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

    this.drawSpanielCompanion(levelState.companion, levelState.elapsedMs);
    this.drawPlayer(levelState.player, levelState.elapsedMs);
    this.drawEffects(levelState.effects || []);
  };

  CanvasRenderer.prototype.drawSpanielCompanion = function drawSpanielCompanion(companion, elapsedMs = 0) {
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

    this.drawSprite(
      companion.visualKey,
      projected.x - 10 + animation.x,
      projected.y + animation.y,
      size,
      projected.scale,
      false,
      true,
      animation,
    );
  };
}
