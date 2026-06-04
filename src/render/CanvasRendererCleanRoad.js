import { CanvasRenderer } from './CanvasRenderer.js';

const drawObjectBase = CanvasRenderer.prototype.drawObject;
const drawSpriteBase = CanvasRenderer.prototype.drawSprite;

CanvasRenderer.prototype.drawLanes = function drawThreeLaneStageRoad(levelState = {}) {
  const ctx = this.ctx;
  const w = this.width;
  const h = this.height;
  const distance = levelState.distance || 0;
  const activeLane = levelState.player?.renderLane ?? 1;
  const player = levelState.player || null;
  const laneYs = [0, 1, 2].map((lane) => this.projector.laneY(lane, h));
  const laneHeights = this.isWideShort ? [44, 56, 70] : [52, 66, 82];
  const slant = this.isWideShort ? 22 : 28;

  ctx.save();

  this.drawRoadBackplate(ctx, w, laneYs[0] - 54, laneYs[2] + 82, slant);

  for (let lane = 0; lane < 3; lane++) {
    const y = laneYs[lane];
    const height = laneHeights[lane];
    const active = Math.abs(activeLane - lane) < 0.55;
    this.drawLaneSlab(ctx, w, y, height, slant, lane, active);
  }

  this.drawRoadMotionDashes(ctx, w, laneYs, distance);
  if (player) this.drawPlayerLanePatch(ctx, player);
  this.drawFloorScratches(ctx, w, h, distance);
  ctx.restore();
};

CanvasRenderer.prototype.drawRoadBackplate = function drawRoadBackplate(ctx, width, topY, bottomY, slant) {
  const bg = ctx.createLinearGradient(0, topY, 0, bottomY);
  bg.addColorStop(0, '#07101e');
  bg.addColorStop(0.48, '#0a1423');
  bg.addColorStop(1, '#050b14');

  ctx.globalAlpha = 0.92;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(-96, topY + slant);
  ctx.lineTo(width + 96, topY);
  ctx.lineTo(width + 90, bottomY - slant * 0.45);
  ctx.lineTo(-100, bottomY + slant * 0.45);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = 'rgba(92,235,255,0.28)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, topY + 8);
  ctx.lineTo(width, topY - 10);
  ctx.moveTo(0, bottomY - 2);
  ctx.lineTo(width, bottomY - 20);
  ctx.stroke();
};

CanvasRenderer.prototype.drawLaneSlab = function drawLaneSlab(ctx, width, centerY, laneHeight, slant, lane, active) {
  const top = centerY - laneHeight * 0.5;
  const bottom = centerY + laneHeight * 0.5;
  const leftTop = -70;
  const rightTop = width + 80;
  const leftBottom = -86;
  const rightBottom = width + 64;

  const laneGrad = ctx.createLinearGradient(0, top, 0, bottom);
  if (lane === 0) {
    laneGrad.addColorStop(0, '#0c1728');
    laneGrad.addColorStop(1, '#091220');
  } else if (lane === 1) {
    laneGrad.addColorStop(0, '#101c2d');
    laneGrad.addColorStop(1, '#0b1524');
  } else {
    laneGrad.addColorStop(0, '#121c2a');
    laneGrad.addColorStop(1, '#080f1a');
  }

  ctx.globalAlpha = active ? 0.9 : 0.8;
  ctx.fillStyle = laneGrad;
  ctx.beginPath();
  ctx.moveTo(leftTop, top + slant);
  ctx.lineTo(rightTop, top);
  ctx.lineTo(rightBottom, bottom - slant * 0.32);
  ctx.lineTo(leftBottom, bottom + slant * 0.32);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = active ? 0.22 : 0.15;
  ctx.fillStyle = active ? 'rgba(255,194,71,0.12)' : 'rgba(92,235,255,0.07)';
  ctx.beginPath();
  ctx.moveTo(leftTop, top + slant + 2);
  ctx.lineTo(rightTop, top + 2);
  ctx.lineTo(rightTop, top + 14);
  ctx.lineTo(leftTop, top + slant + 16);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = active ? 0.4 : 0.34;
  ctx.strokeStyle = active ? 'rgba(255,194,71,0.38)' : 'rgba(92,235,255,0.32)';
  ctx.lineWidth = active ? 1.4 : 1.1;
  ctx.beginPath();
  ctx.moveTo(leftTop + 18, centerY + 4);
  ctx.lineTo(rightTop - 12, centerY - 14);
  ctx.stroke();

  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(leftBottom + 20, bottom + slant * 0.12);
  ctx.lineTo(rightBottom - 18, bottom - slant * 0.45);
  ctx.stroke();
};

CanvasRenderer.prototype.drawPlayerLanePatch = function drawPlayerLanePatch(ctx, player) {
  const point = this.projector.project(player.x, player.renderLane, this.width, this.height);
  const scale = point.scale;
  const width = (this.lowPerf ? 106 : 126) * scale;
  const y = point.y + 14 * scale;

  ctx.globalAlpha = this.lowPerf ? 0.24 : 0.3;
  ctx.fillStyle = 'rgba(255,194,71,0.16)';
  ctx.beginPath();
  ctx.ellipse(point.x - 8 * scale, y + 5 * scale, width * 0.5, 7 * scale, -0.05, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = this.lowPerf ? 0.34 : 0.42;
  ctx.strokeStyle = 'rgba(255,194,71,0.38)';
  ctx.lineWidth = this.lowPerf ? 1 : 1.2;
  ctx.beginPath();
  ctx.moveTo(point.x - width * 0.38, y);
  ctx.lineTo(point.x + width * 0.38, y - 5 * scale);
  ctx.stroke();
};

CanvasRenderer.prototype.drawRoadMotionDashes = function drawRoadMotionDashes(ctx, width, laneYs, distance) {
  ctx.globalAlpha = this.lowPerf ? 0.08 : 0.12;
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1;
  const offset = (distance * 0.18) % 150;

  for (const y of laneYs) {
    for (let x = -offset - 120; x < width + 180; x += 150) {
      ctx.beginPath();
      ctx.moveTo(x, y + 34);
      ctx.lineTo(x + 58, y + 30);
      ctx.stroke();
    }
  }
};

CanvasRenderer.prototype.drawFloorScratches = function drawFloorScratches(ctx, width, height, distance) {
  const baseY = height * 0.74;
  const offset = (distance * 0.055) % 190;
  ctx.globalAlpha = this.lowPerf ? 0.08 : 0.11;
  ctx.strokeStyle = 'rgba(92,235,255,0.22)';
  ctx.lineWidth = 1;

  for (let i = 0; i < 7; i++) {
    const x = ((i * 190 - offset) % (width + 240)) - 120;
    const y = baseY + (i % 3) * 22;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 70 + (i % 2) * 24, y - 4);
    ctx.stroke();
  }
};

CanvasRenderer.prototype.drawObject = function drawObjectWithCleanAnchor(object, elapsedMs = 0) {
  this.drawCleanObjectAnchor(object);
  drawObjectBase.call(this, object, elapsedMs);
};

CanvasRenderer.prototype.drawCleanObjectAnchor = function drawCleanObjectAnchor(object) {
  const ctx = this.ctx;
  const point = this.projector.project(object.x, object.lane, this.width, this.height);
  const collectible = object.kind === 'collectible';
  const scale = point.scale;
  const half = (collectible ? 24 : 32) * scale;
  const y = point.y + (collectible ? 8 : 13) * scale;

  ctx.save();
  ctx.globalAlpha = this.lowPerf ? 0.52 : 0.58;
  ctx.fillStyle = 'rgba(0,0,0,0.46)';
  ctx.beginPath();
  ctx.ellipse(point.x, y + 7 * scale, half, 4.8 * scale, -0.05, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = this.lowPerf ? 0.26 : 0.34;
  ctx.strokeStyle = collectible ? 'rgba(92,235,255,0.48)' : 'rgba(255,90,78,0.54)';
  ctx.lineWidth = this.lowPerf ? 1 : 1.2;
  ctx.beginPath();
  ctx.moveTo(point.x - half * 0.86, y);
  ctx.lineTo(point.x + half * 0.86, y - 3 * scale);
  ctx.stroke();
  ctx.restore();
};

CanvasRenderer.prototype.drawSprite = function drawSpriteWithBetterContactShadow(visualKey, x, y, size, scale, isPlayer, flipX = false, animation = null) {
  if (!isPlayer) {
    drawSpriteBase.call(this, visualKey, x, y, size, scale, isPlayer, flipX, animation);
    return;
  }

  const ctx = this.ctx;
  const shadowScale = animation?.shadowScale ?? 1;
  const shadowAlpha = Math.max(animation?.shadowAlpha ?? 0.24, this.lowPerf ? 0.34 : 0.3);

  ctx.save();
  ctx.globalAlpha = shadowAlpha;
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.beginPath();
  ctx.ellipse(x, y + 11 * scale, size * 0.28 * shadowScale, size * 0.065, -0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawSpriteBase.call(this, visualKey, x, y, size, scale, isPlayer, flipX, animation);
};
