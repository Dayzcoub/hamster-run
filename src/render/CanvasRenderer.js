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
    const height = Math.max(260, Math.floor(rect.height));
    if (this.canvas.width !== width * this.dpr || this.canvas.height !== height * this.dpr) {
      this.canvas.width = width * this.dpr;
      this.canvas.height = height * this.dpr;
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    }
    this.width = width;
    this.height = height;
    this.isCompact = width < 620 || height < 540;
  }

  render(levelState) {
    this.resize();
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
    ctx.globalAlpha = this.isCompact ? 0.16 : 0.22;
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(0, 0, this.width, this.height * 0.3);
    ctx.fillStyle = '#f4b942';
    const stripeStep = this.isCompact ? 210 : 260;
    for (let i = 0; i < 6; i++) {
      const x = ((i * stripeStep - (levelState.distance * 0.12) % stripeStep) % (this.width + stripeStep)) - 130;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + 90, 0);
      ctx.lineTo(x - 90, this.height);
      ctx.lineTo(x - 155, this.height);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  drawLanes() {
    const ctx = this.ctx;
    for (let lane = 0; lane < 3; lane++) {
      const y = this.projector.laneY(lane, this.height);
      const depth = (this.isCompact ? 46 : 54) + lane * (this.isCompact ? 7 : 10);
      const offset = (1 - lane) * (this.isCompact ? 42 : 72);
      ctx.save();
      ctx.globalAlpha = 0.82;
      ctx.fillStyle = lane === 2 ? '#2b1f18' : lane === 1 ? '#241c17' : '#211817';
      ctx.strokeStyle = 'rgba(244,185,66,0.24)';
      ctx.lineWidth = this.isCompact ? 1.6 : 2;
      ctx.beginPath();
      ctx.moveTo(-80 + offset, y + depth);
      ctx.lineTo(this.width + 90 + offset, y + depth - 26);
      ctx.lineTo(this.width + 130 + offset, y - depth);
      ctx.lineTo(-40 + offset, y - depth + 26);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = 'rgba(103,232,249,0.18)';
      ctx.beginPath();
      ctx.moveTo(-40 + offset, y);
      ctx.lineTo(this.width + 100 + offset, y - 26);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawPlayer(player) {
    const visualKey = player.visualKey;
    const projected = this.projector.project(player.x, player.renderLane, this.width, this.height);
    const yJump = player.jumpOffset * (this.isCompact ? 0.78 : 1);
    const size = (this.isCompact ? 110 : 138) * projected.scale;
    this.drawSprite(visualKey, projected.x, projected.y - yJump, size, projected.scale, true);
  }

  drawObject(object) {
    const projected = this.projector.project(object.x, object.lane, this.width, this.height);
    const baseSize = object.kind === 'collectible'
      ? (this.isCompact ? 46 : 58)
      : (this.isCompact ? 86 : 112);
    this.drawSprite(object.visualKey, projected.x, projected.y, baseSize * projected.scale, projected.scale, false);
  }

  drawSprite(visualKey, x, y, size, scale, isPlayer) {
    const sprite = this.assets.get(visualKey);
    const ctx = this.ctx;
    if (!sprite) {
      this.drawFallback(x, y, size, isPlayer);
      return;
    }

    const { image, meta } = sprite;
    const anchor = meta.anchor || { x: 0.5, y: 0.85 };
    const aspect = image.width / image.height;
    const width = size * aspect;
    const height = size;
    const drawX = x - width * anchor.x;
    const drawY = y - height * anchor.y;

    ctx.save();
    ctx.globalAlpha = 0.23;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(x, y + 8 * scale, width * 0.28, height * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.drawImage(image, drawX, drawY, width, height);
  }

  drawFallback(x, y, size, isPlayer) {
    const ctx = this.ctx;
    ctx.fillStyle = isPlayer ? '#f4b942' : '#67e8f9';
    ctx.beginPath();
    ctx.arc(x, y - size * 0.45, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
}
