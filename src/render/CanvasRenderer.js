import { IsoProjector } from './IsoProjector.js';

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
    for (const object of drawable) this.drawObject(object);
    this.drawPlayer(levelState.player);
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
    const baseSize = this.isWideShort ? 132 : this.isCompact ? 116 : 142;
    const size = baseSize * projected.scale;
    this.drawSprite(visualKey, projected.x, projected.y - yJump, size, projected.scale, true, true);
  }

  drawObject(object) {
    const projected = this.projector.project(object.x, object.lane, this.width, this.height);
    const baseSize = object.kind === 'collectible'
      ? (this.isWideShort ? 54 : this.isCompact ? 48 : 60)
      : (this.isWideShort ? 98 : this.isCompact ? 88 : 112);
    this.drawSprite(object.visualKey, projected.x, projected.y, baseSize * projected.scale, projected.scale, false, false);
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
