import { CanvasRenderer } from './CanvasRenderer.js';

const originalRender = CanvasRenderer.prototype.render;
const originalSpriteScale = CanvasRenderer.prototype.spriteScale;
const originalDrawEffects = CanvasRenderer.prototype.drawEffects;

const SPANIEL_SPRITE_SCALE = {
  spaniel_idle: 0.53,
  spaniel_run: 0.53,
  spaniel_rescue: 0.55,
  spaniel_pickup_toast: 0.53,
  spaniel_portrait: 0.5,
};

if (!CanvasRenderer.prototype.__spanielCompanionPatch) {
  CanvasRenderer.prototype.__spanielCompanionPatch = true;

  CanvasRenderer.prototype.spriteScale = function patchedSpriteScale(visualKey) {
    return SPANIEL_SPRITE_SCALE[visualKey] || originalSpriteScale.call(this, visualKey);
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

    this.drawSpanielCompanion(levelState.companion, levelState.elapsedMs, levelState.stats);
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

  CanvasRenderer.prototype.drawSpanielCompanion = function drawSpanielCompanion(companion, elapsedMs = 0, stats = null) {
    if (!companion?.visualKey || !this.assets.get(companion.visualKey)) return;

    const projected = this.projector.project(companion.x, companion.renderLane, this.width, this.height);
    const baseSize = this.isWideShort ? 88 : this.isCompact ? 82 : 98;
    let size = baseSize * projected.scale * this.spriteScale(companion.visualKey);
    const phase = elapsedMs / 110;
    const step = Math.abs(Math.sin(phase));
    const animation = {
      x: Math.sin(phase * 0.5) * 1.8,
      y: 2 - step * (this.isCompact ? 2.2 : 3.2),
      rotation: Math.sin(phase) * 0.025,
      scaleX: 1,
      scaleY: 1,
      shadowScale: 0.9 + step * 0.06,
      shadowAlpha: 0.18,
    };

    let x = projected.x - 10 + animation.x;
    let y = projected.y + animation.y;

    if (companion.mode === 'rescue_smash') {
      const total = companion.rescueTotalMs || 760;
      const t = 1 - Math.max(0, Math.min(1, (companion.rescueMs || 0) / total));
      const attackProgress = Math.min(1, t / 0.46);
      const returnProgress = Math.max(0, (t - 0.46) / 0.54);
      const attackEase = 1 - Math.pow(1 - attackProgress, 3);
      const returnEase = returnProgress * returnProgress * (3 - 2 * returnProgress);
      const punch = Math.sin(Math.min(1, attackProgress) * Math.PI);
      const impactProjected = this.projector.project(companion.impactX || companion.x + 70, companion.renderLane, this.width, this.height);
      const rawDx = impactProjected.x - projected.x;
      const rawDy = impactProjected.y - projected.y;
      const maxDash = this.isWideShort ? 84 : this.isCompact ? 74 : 92;
      const dashDistance = Math.min(maxDash, Math.hypot(rawDx, rawDy) || maxDash);
      const dashX = rawDx >= 0 ? dashDistance : -dashDistance;
      const dashY = rawDy * Math.min(1, dashDistance / Math.max(1, Math.abs(rawDx)));
      const travel = attackEase * (1 - returnEase * 0.82);
      x = projected.x + dashX * travel - 8;
      y = projected.y + dashY * travel - punch * 12;
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
    const floatY = Math.sin(elapsedMs / 280) * 1.8;
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
    const x = projected.x + (effect.vx || 0) * t;
    const y = projected.y + (effect.vy || 0) * t + 72 * t * t;
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
    const y = projected.y - 84 - t * 18;
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
