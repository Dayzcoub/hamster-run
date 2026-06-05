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
      const t = 1 - Math.max(0, Math.min(1, (companion.rescueMs || 0) / 620));
      const attack = Math.sin(Math.min(1, t / 0.68) * Math.PI);
      const impactProjected = this.projector.project(companion.impactX || companion.x + 70, companion.renderLane, this.width, this.height);
      x = projected.x + (impactProjected.x - projected.x) * Math.min(1, t * 1.7) - 8;
      y = projected.y + (impactProjected.y - projected.y) * Math.min(1, t * 1.7) - attack * 10;
      size *= 1.28 + attack * 0.18;
      animation.rotation = -0.1 + attack * 0.22;
      animation.scaleX = 1.08 + attack * 0.08;
      animation.scaleY = 0.96 + attack * 0.05;
      animation.shadowScale = 1.08;
      animation.shadowAlpha = 0.28;
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

    if (companion.mode !== 'rescue_smash') this.drawSpanielRescueBadge(x, y, size, stats);
  };

  CanvasRenderer.prototype.drawSpanielRescueBadge = function drawSpanielRescueBadge(x, y, size, stats) {
    const available = stats?.companionRescueAvailable && !stats?.companionRescueUsed;
    if (!available) return;

    const ctx = this.ctx;
    const badgeW = this.isCompact ? 42 : 48;
    const badgeH = this.isCompact ? 22 : 24;
    const badgeX = x - badgeW * 0.52;
    const badgeY = y - size * 0.72;
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
    const y = projected.y + (effect.vy || 0) * t + 68 * t * t;
    const alpha = 1 - t;
    const size = (effect.size || 5) * (1 - t * 0.28);

    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = effect.color || '#ffc247';
    ctx.shadowColor = effect.color || '#ffc247';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
}
