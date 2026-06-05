import { CanvasRenderer } from './CanvasRenderer.js';

const originalRender = CanvasRenderer.prototype.render;
const originalSpriteScale = CanvasRenderer.prototype.spriteScale;

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
    this.drawPlayer(levelState.player, levelState.elapsedMs);
    this.drawEffects(levelState.effects || []);
  };

  CanvasRenderer.prototype.drawSpanielCompanion = function drawSpanielCompanion(companion, elapsedMs = 0, stats = null) {
    if (!companion?.visualKey || !this.assets.get(companion.visualKey)) return;

    const projected = this.projector.project(companion.x, companion.renderLane, this.width, this.height);
    const baseSize = this.isWideShort ? 88 : this.isCompact ? 82 : 98;
    const size = baseSize * projected.scale * this.spriteScale(companion.visualKey);
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
    const x = projected.x - 10 + animation.x;
    const y = projected.y + animation.y;

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

    this.drawSpanielRescueBadge(x, y, size, stats);
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
}
