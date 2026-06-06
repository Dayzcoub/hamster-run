import { CanvasRenderer } from './CanvasRenderer.js';

const originalRender = CanvasRenderer.prototype.render;
const originalSpriteScale = CanvasRenderer.prototype.spriteScale;
const originalDrawEffects = CanvasRenderer.prototype.drawEffects;

const SPANIEL_FOLLOW_LAG_MS = 320;
const SPANIEL_JUMP_HEIGHT_RATIO = 0.55;

const SPANIEL_SPRITE_SCALE = {
  spaniel_idle: 0.53,
  spaniel_run: 0.53,
  spaniel_rescue: 0.55,
  spaniel_pickup_toast: 0.53,
  spaniel_portrait: 0.5,
};

const SPANIEL_LANE_PROFILES = [
  { yOffset: -1 },
  { yOffset: 6 },
  { yOffset: 12 },
];

function debugTuning() {
  return window.__HAMSTER_DEBUG_TUNING || {};
}

function laneProfile(lane = 1) {
  const clamped = Math.max(0, Math.min(2, Number.isFinite(lane) ? lane : 1));
  const lo = Math.floor(clamped);
  const hi = Math.ceil(clamped);
  const t = clamped - lo;
  const a = SPANIEL_LANE_PROFILES[lo] || SPANIEL_LANE_PROFILES[1];
  const b = SPANIEL_LANE_PROFILES[hi] || a;
  return {
    yOffset: a.yOffset + (b.yOffset - a.yOffset) * t,
  };
}

function playfieldY(renderer, projectedY) {
  if (typeof renderer.remapProjectedYToPlayfield === 'function') {
    return renderer.remapProjectedYToPlayfield(projectedY);
  }
  return projectedY;
}

function renderTime(elapsedMs = 0) {
  if (Number.isFinite(elapsedMs) && elapsedMs > 0) return elapsedMs;
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') return performance.now();
  return Date.now();
}

function companionGroundY(baseY, lane, tuning) {
  const profile = laneProfile(lane);
  return baseY + profile.yOffset + (Number(tuning.playerY) || 0) + (Number(tuning.spanielY) || 0);
}

function smoothValue(renderer, key, targetValue, elapsedMs = 0, fallbackValue = 0) {
  const now = renderTime(elapsedMs);
  const target = Number.isFinite(targetValue) ? targetValue : fallbackValue;
  const storeKey = `__spanielLag_${key}`;
  const previous = renderer[storeKey];
  if (!previous || now < previous.elapsedMs) {
    renderer[storeKey] = { value: target, elapsedMs: now };
    return target;
  }

  const dt = Math.max(0, Math.min(48, now - previous.elapsedMs));
  const follow = 1 - Math.exp(-dt / SPANIEL_FOLLOW_LAG_MS);
  const value = previous.value + (target - previous.value) * follow;
  renderer[storeKey] = { value, elapsedMs: now };
  return value;
}

function smoothLane(renderer, targetLane, elapsedMs = 0) {
  const target = Math.max(0, Math.min(2, Number.isFinite(targetLane) ? targetLane : 1));
  return smoothValue(renderer, 'lane', target, elapsedMs, target);
}

function smoothJump(renderer, targetJump, elapsedMs = 0) {
  return smoothValue(renderer, 'jump', Number(targetJump) || 0, elapsedMs, 0);
}

if (!CanvasRenderer.prototype.__spanielCompanionPatch) {
  CanvasRenderer.prototype.__spanielCompanionPatch = true;

  CanvasRenderer.prototype.spriteScale = function patchedSpriteScale(visualKey) {
    const tuning = debugTuning();
    const spanielScale = Number(tuning.spanielScale) || 1;
    const base = SPANIEL_SPRITE_SCALE[visualKey] || originalSpriteScale.call(this, visualKey);
    return visualKey?.startsWith('spaniel_') ? base * spanielScale : base;
  };

  CanvasRenderer.prototype.render = function patchedRender(levelState) {
    if (!levelState?.companion) return originalRender.call(this, levelState);

    this.resize();
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.applyScreenShake(levelState.screenShake);
    this.drawBackground(levelState);
    this.drawLanes(levelState);

    const drawable = [...levelState.objects].sort((a, b) => a.lane - b.lane || a.x - b.x);
    for (const object of drawable) this.drawObject(object, levelState.elapsedMs);

    this.drawSpanielCompanion(levelState.companion, levelState.elapsedMs, levelState.stats, levelState.player);
    if (!levelState.playerHidden) this.drawPlayer(levelState.player, levelState.elapsedMs);
    this.drawEffects(levelState.effects || []);
  };

  CanvasRenderer.prototype.drawEffects = function patchedDrawEffects(effects) {
    const normalEffects = [];
    for (const effect of effects || []) {
      if (effect.type === 'smash_particle') this.drawSpanielSmashParticle(effect);
      else if (effect.type === 'spaniel_rescue_text') this.drawSpanielRescueText(effect);
      else normalEffects.push(effect);
    }
    originalDrawEffects.call(this, normalEffects);
  };

  CanvasRenderer.prototype.drawSpanielCompanion = function drawSpanielCompanion(companion, elapsedMs = 0, stats = null, player = null) {
    if (!companion?.visualKey || !this.assets.get(companion.visualKey)) return;

    const tuning = debugTuning();
    const visualLane = smoothLane(this, companion.renderLane, elapsedMs);
    const delayedJump = smoothJump(this, player?.jumpOffset, elapsedMs);
    const projected = this.projector.project(companion.x, visualLane, this.width, this.height);
    const baseY = playfieldY(this, projected.y);
    const groundedY = companionGroundY(baseY, visualLane, tuning);
    const yJump = delayedJump * (this.isCompact ? 0.72 : 0.82) * SPANIEL_JUMP_HEIGHT_RATIO;
    const baseSize = this.isWideShort ? 88 : this.isCompact ? 82 : 98;
    let size = baseSize * projected.scale * this.spriteScale(companion.visualKey);
    const phase = renderTime(elapsedMs) / 110;
    const step = Math.abs(Math.sin(phase));
    const animation = {
      x: Math.sin(phase * 0.5) * 1.8,
      y: 1.2 - step * (this.isCompact ? 1.5 : 2.2),
      rotation: Math.sin(phase) * 0.025,
      scaleX: 1,
      scaleY: 1,
      shadowScale: 0.9 + step * 0.06,
      shadowAlpha: 0.18,
    };

    let x = projected.x - 10 + animation.x;
    let y = groundedY - yJump + animation.y;

    if (companion.mode === 'rescue_smash') {
      const total = companion.rescueTotalMs || 760;
      const t = 1 - Math.max(0, Math.min(1, (companion.rescueMs || 0) / total));
      const attackProgress = Math.min(1, t / 0.46);
      const returnProgress = Math.max(0, (t - 0.46) / 0.54);
      const attackEase = 1 - Math.pow(1 - attackProgress, 3);
      const returnEase = returnProgress * returnProgress * (3 - 2 * returnProgress);
      const punch = Math.sin(Math.min(1, attackProgress) * Math.PI);
      const impactProjected = this.projector.project(companion.impactX || companion.x + 70, visualLane, this.width, this.height);
      const impactBaseY = playfieldY(this, impactProjected.y);
      const impactGroundedY = companionGroundY(impactBaseY, visualLane, tuning);
      const rawDx = impactProjected.x - projected.x;
      const rawDy = impactGroundedY - groundedY;
      const maxDash = this.isWideShort ? 84 : this.isCompact ? 74 : 92;
      const dashDistance = Math.min(maxDash, Math.hypot(rawDx, rawDy) || maxDash);
      const dashX = rawDx >= 0 ? dashDistance : -dashDistance;
      const dashY = rawDy * Math.min(1, dashDistance / Math.max(1, Math.abs(rawDx)));
      const travel = attackEase * (1 - returnEase * 0.82);
      x = projected.x + dashX * travel - 8;
      y = groundedY - yJump + dashY * travel - punch * 9;
      size *= 1.18 + punch * 0.26 - returnEase * 0.12;
      animation.rotation = -0.08 + punch * 0.2 - returnEase * 0.07;
      animation.scaleX = 1.05 + punch * 0.1;
      animation.scaleY = 0.97 + punch * 0.04;
      animation.shadowScale = 1.04 + punch * 0.12;
      animation.shadowAlpha = 0.24 + punch * 0.05;
    }

    this.drawSprite(
      companion.visualKey,
      x,
      y,
      size,
      projected.scale,
      false,
      false,
      animation,
    );

    if (companion.mode !== 'rescue_smash') this.drawSpanielRescueBadge(x, y, size, stats, elapsedMs);
  };

  CanvasRenderer.prototype.drawSpanielRescueBadge = function drawSpanielRescueBadge(x, y, size, stats, elapsedMs = 0) {
    const available = stats?.companionRescueAvailable && !stats?.companionRescueUsed;
    if (!available) return;

    const ctx = this.ctx;
    const badgeW = this.isCompact ? 42 : 48;
    const badgeH = this.isCompact ? 22 : 24;
    const floatY = Math.sin(renderTime(elapsedMs) / 280) * 1.8;
    const badgeX = x + size * 0.08 - badgeW / 2;
    const badgeY = y - size * 1.34 + floatY;
    const radius = badgeH / 2;

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.96;
    ctx.shadowColor = 'rgba(255,194,71,0.44)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = 'rgba(8,16,28,0.88)';
    ctx.strokeStyle = 'rgba(255,194,71,0.72)';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, badgeX, badgeY, badgeW, badgeH, radius);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.font = `900 ${this.isCompact ? 13 : 14}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffc247';
    ctx.fillText('🐶 1', badgeX + badgeW / 2, badgeY + badgeH / 2 + 0.5);
    ctx.restore();
  };

  CanvasRenderer.prototype.drawSpanielSmashParticle = function drawSpanielSmashParticle(effect) {
    const t = Math.min(1, effect.ageMs / effect.durationMs);
    const projected = this.projector.project(effect.x, effect.lane, this.width, this.height);
    const baseY = playfieldY(this, projected.y);
    const x = projected.x + (effect.vx || 0) * t;
    const y = baseY + (effect.vy || 0) * t + 52 * t * t;
    const alpha = 1 - t;
    const size = (effect.size || 5) * (1 - t * 0.24);

    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = effect.shape === 'piece' ? 'source-over' : 'screen';
    ctx.fillStyle = effect.color || '#ffc247';
    ctx.strokeStyle = 'rgba(5,9,16,0.42)';
    ctx.lineWidth = 1;
    ctx.shadowColor = effect.shape === 'piece' ? 'rgba(0,0,0,0.35)' : effect.color || '#ffc247';
    ctx.shadowBlur = effect.shape === 'piece' ? 2 : 8;
    ctx.translate(x, y);
    ctx.rotate((effect.rotation || 0) + t * 2.8);
    if (effect.shape === 'piece') {
      ctx.fillRect(-size * 0.7, -size * 0.48, size * 1.4, size * 0.96);
      ctx.strokeRect(-size * 0.7, -size * 0.48, size * 1.4, size * 0.96);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  CanvasRenderer.prototype.drawSpanielRescueText = function drawSpanielRescueText(effect) {
    const t = Math.min(1, effect.ageMs / effect.durationMs);
    const projected = this.projector.project(effect.x, effect.lane, this.width, this.height);
    const baseY = playfieldY(this, projected.y);
    const y = baseY - 74 - t * 14;
    const alpha = 1 - Math.max(0, (t - 0.72) / 0.28);
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `950 ${this.isCompact ? 17 : 20}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(5,9,16,0.92)';
    ctx.fillStyle = '#ff5a4e';
    ctx.strokeText(effect.label, projected.x + 34, y);
    ctx.fillText(effect.label, projected.x + 34, y);
    ctx.restore();
  };
}
