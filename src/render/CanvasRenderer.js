import { IsoProjector } from './IsoProjector.js';

const SPRITE_SCALE_OVERRIDES = {
  hamster_run_01: 0.92,
  hamster_jump: 0.92,
  hamster_slide: 0.92,
  hamster_hit: 0.92,
  hamster_celebrate: 0.92,
  bread: 0.84,
  cable_coil: 0.66,
  c2_connector: 0.9,
  bolt: 0.86,
  stage_deck: 0.78,
  flight_case: 0.78,
  cable_loop: 0.62,
  mic_stand: 0.9,
  mystery_box: 0.74,
  cart: 0.8,
};

export class CanvasRenderer {
  constructor(canvas, assets) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.assets = assets;
    this.projector = new IsoProjector();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(320, Math.floor(rect.width));
    const height = Math.max(300, Math.floor(rect.height));
    if (this.canvas.width !== width * this.dpr || this.canvas.height !== height * this.dpr) {
      this.canvas.width = width * this.dpr;
      this.canvas.height = height * this.dpr;
    }

    this.canvasWidth = width;
    this.canvasHeight = height;
    this.width = width;
    this.height = height;
    this.viewportX = 0;
    this.viewportY = 0;
    this.isCompact = width < 700 || height < 500;
    this.isWideShort = width / height > 2.05;
  }

  render(levelState) {
    this.resize();
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.drawBackground(levelState);
    this.drawLanes();

    const drawable = [...levelState.objects].sort((a, b) => a.lane - b.lane || a.x - b.x);
    for (const object of drawable) this.drawObject(object, levelState.elapsedMs);
    this.drawPlayer(levelState.player);
    this.drawEffects(levelState.effects || []);
  }

  drawBackground(levelState) {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, this.width, this.height);
    gradient.addColorStop(0, '#151021');
    gradient.addColorStop(0.45, '#1b1d2c');
    gradient.addColorStop(1, '#0d1320');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.globalAlpha = this.isCompact ? 0.15 : 0.2;
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(0, 0, this.width, this.height * 0.28);
    ctx.fillStyle = '#f4b942';
    const stripeStep = this.isCompact ? 240 : 300;
    const stripeCount = Math.ceil(this.width / stripeStep) + 4;
    for (let i = 0; i < stripeCount; i++) {
      const x = ((i * stripeStep - (levelState.distance * 0.12) % stripeStep) % (this.width + stripeStep)) - 130;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 84, 0);
      ctx.lineTo(x - 90, this.height);
      ctx.lineTo(x - 146, this.height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  drawLanes() {
    const ctx = this.ctx;
    const depthBase = this.isWideShort ? 66 : this.isCompact ? 52 : 58;
    const depthStep = this.isWideShort ? 14 : this.isCompact ? 10 : 12;
    const laneOffset = this.isWideShort ? 82 : this.isCompact ? 56 : 78;

    for (let lane = 0; lane < 3; lane++) {
      const y = this.projector.laneY(lane, this.height);
      const depth = depthBase + lane * depthStep;
      const offset = (1 - lane) * laneOffset;
      ctx.save();
      ctx.globalAlpha = 0.84;
      ctx.fillStyle = lane === 2 ? '#2b1f18' : lane === 1 ? '#241c17' : '#211817';
      ctx.strokeStyle = 'rgba(244,185,66,0.27)';
      ctx.lineWidth = this.isCompact ? 1.7 : 2;
      ctx.beginPath();
      ctx.moveTo(-220 + offset, y + depth);
      ctx.lineTo(this.width + 240 + offset, y + depth - 28);
      ctx.lineTo(this.width + 280 + offset, y - depth);
      ctx.lineTo(-180 + offset, y - depth + 28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = 'rgba(103,232,249,0.18)';
      ctx.beginPath();
      ctx.moveTo(-180 + offset, y);
      ctx.lineTo(this.width + 240 + offset, y - 28);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawPlayer(player) {
    const visualKey = player.visualKey;
    const projected = this.projector.project(player.x, player.renderLane, this.width, this.height);
    const yJump = player.jumpOffset * (this.isCompact ? 0.82 : 1);
    const baseSize = this.isWideShort ? 106 : this.isCompact ? 100 : 122;
    const size = baseSize * projected.scale * this.spriteScale(visualKey);
    this.drawSprite(visualKey, projected.x, projected.y - yJump, size, projected.scale, true, true);
  }

  drawObject(object, elapsedMs = 0) {
    const projected = this.projector.project(object.x, object.lane, this.width, this.height);
    const baseSize = object.kind === 'collectible'
      ? (this.isWideShort ? 44 : this.isCompact ? 42 : 52)
      : (this.isWideShort ? 74 : this.isCompact ? 68 : 90);
    const pulse = object.kind === 'collectible' ? 1 + Math.sin((elapsedMs || 0) / 140) * 0.055 : 1;
    const size = baseSize * projected.scale * this.spriteScale(object.visualKey) * pulse;
    this.drawSpriteContourGlow(object.visualKey, projected.x, projected.y, size, object.kind === 'collectible');
    this.drawSprite(object.visualKey, projected.x, projected.y, size, projected.scale, false, false);
  }

  drawSpriteContourGlow(visualKey, x, y, size, collectible) {
    const sprite = this.assets.get(visualKey);
    const ctx = this.ctx;
    if (!sprite) return;

    const { image, meta } = sprite;
    const anchor = meta.anchor || { x: 0.5, y: 0.85 };
    const aspect = image.width / image.height;
    const width = size * aspect;
    const height = size;
    const drawX = -width * anchor.x;
    const drawY = -height * anchor.y;
    const outer = collectible ? 'rgba(103,232,249,0.95)' : 'rgba(255,107,53,0.98)';
    const inner = collectible ? 'rgba(244,185,66,0.72)' : 'rgba(239,68,68,0.74)';

    ctx.save();
    ctx.translate(x, y);
    ctx.globalCompositeOperation = 'screen';

    ctx.globalAlpha = collectible ? 0.64 : 0.7;
    ctx.shadowColor = outer;
    ctx.shadowBlur = collectible ? 18 : 16;
    ctx.drawImage(image, drawX, drawY, width, height);

    ctx.globalAlpha = collectible ? 0.46 : 0.48;
    ctx.shadowColor = inner;
    ctx.shadowBlur = collectible ? 8 : 7;
    ctx.drawImage(image, drawX, drawY, width, height);

    ctx.globalAlpha = collectible ? 0.18 : 0.22;
    ctx.shadowColor = outer;
    ctx.shadowBlur = 0;
    ctx.drawImage(image, drawX - 1.5, drawY, width, height);
    ctx.drawImage(image, drawX + 1.5, drawY, width, height);
    ctx.drawImage(image, drawX, drawY - 1.5, width, height);
    ctx.drawImage(image, drawX, drawY + 1.5, width, height);

    ctx.restore();
  }

  drawEffects(effects) {
    const ctx = this.ctx;
    for (const effect of effects) {
      const t = Math.min(1, effect.ageMs / effect.durationMs);
      const projected = this.projector.project(effect.x, effect.lane, this.width, this.height);
      const y = projected.y - 64 - t * 34;
      const alpha = 1 - t;
      const pickup = effect.type === 'pickup';
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = pickup ? 'rgba(103,232,249,0.28)' : 'rgba(239,68,68,0.28)';
      ctx.beginPath();
      ctx.arc(projected.x, projected.y - 42, 24 + t * 34, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.font = '900 20px system-ui, -apple-system, Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(13,19,32,0.9)';
      ctx.fillStyle = pickup ? '#67e8f9' : '#fb7185';
      ctx.strokeText(effect.label, projected.x, y);
      ctx.fillText(effect.label, projected.x, y);
      ctx.restore();
    }
  }

  spriteScale(visualKey) {
    return SPRITE_SCALE_OVERRIDES[visualKey] || 1;
  }

  drawSprite(visualKey, x, y, size, scale, isPlayer, flipX = false) {
    const sprite = this.assets.get(visualKey);
    const ctx = this.ctx;
    if (!sprite) {
      this.drawFallback(x, y, size, isPlayer);
      return;
    }

    const { image, meta } = sprite;
    const anchor = meta.anchor || { x: 0.5, y: 0.85 };
    const aspect = image.width / image.height;
    const widthScale = isPlayer ? 0.86 : 1;
    const heightScale = isPlayer ? 1.08 : 1;
    const width = size * aspect * widthScale;
    const height = size * heightScale;
    const drawX = -width * anchor.x;
    const drawY = -height * anchor.y;

    ctx.save();
    ctx.globalAlpha = 0.24;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(x, y + 8 * scale, width * 0.24, height * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(x, y);
    if (flipX) ctx.transform(-1, 0, 0, 1, 0, 0);
    ctx.drawImage(image, drawX, drawY, width, height);
    ctx.restore();
  }

  drawFallback(x, y, size, isPlayer) {
    const ctx = this.ctx;
    ctx.fillStyle = isPlayer ? '#f4b942' : '#67e8f9';
    ctx.beginPath();
    ctx.arc(x, y - size * 0.45, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
}
