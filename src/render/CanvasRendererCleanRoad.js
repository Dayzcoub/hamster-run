import { CanvasRenderer } from './CanvasRenderer.js';

const drawObjectBase = CanvasRenderer.prototype.drawObject;

CanvasRenderer.prototype.drawLanes = function drawCleanRoad(levelState = {}) {
  const ctx = this.ctx;
  const w = this.width;
  const h = this.height;
  const distance = levelState.distance || 0;
  const activeLane = levelState.player?.renderLane ?? 1;
  const y0 = this.projector.laneY(0, h);
  const y1 = this.projector.laneY(1, h);
  const y2 = this.projector.laneY(2, h);
  const topY = y0 - 46;
  const bottomY = y2 + 70;

  ctx.save();

  const road = ctx.createLinearGradient(0, topY, 0, bottomY);
  road.addColorStop(0, '#101b2d');
  road.addColorStop(0.45, '#0b1524');
  road.addColorStop(1, '#070d18');
  ctx.fillStyle = road;
  ctx.beginPath();
  ctx.moveTo(-80, topY + 26);
  ctx.lineTo(w + 90, topY);
  ctx.lineTo(w + 80, bottomY - 14);
  ctx.lineTo(-90, bottomY + 14);
  ctx.closePath();
  ctx.fill();

  const lanes = [y0, y1, y2];
  for (let i = 0; i < lanes.length; i++) {
    const y = lanes[i];
    const active = Math.abs(activeLane - i) < 0.55;

    ctx.globalAlpha = active ? 0.16 : 0.07;
    ctx.fillStyle = active ? 'rgba(255,194,71,0.34)' : 'rgba(92,235,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(-40, y - 34);
    ctx.lineTo(w + 42, y - 52);
    ctx.lineTo(w + 44, y + 30);
    ctx.lineTo(-42, y + 50);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = active ? 0.48 : 0.28;
    ctx.strokeStyle = active ? 'rgba(255,194,71,0.58)' : 'rgba(92,235,255,0.36)';
    ctx.lineWidth = active ? 2 : 1.3;
    ctx.beginPath();
    ctx.moveTo(-30, y + 6);
    ctx.lineTo(w + 40, y - 14);
    ctx.stroke();
  }

  ctx.globalAlpha = this.lowPerf ? 0.1 : 0.15;
  ctx.strokeStyle = 'rgba(255,255,255,0.24)';
  ctx.lineWidth = 1;
  const offset = (distance * 0.16) % 150;
  for (const y of lanes) {
    for (let x = -offset - 90; x < w + 160; x += 150) {
      ctx.beginPath();
      ctx.moveTo(x, y + 48);
      ctx.lineTo(x + 58, y + 44);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 0.32;
  ctx.strokeStyle = 'rgba(92,235,255,0.22)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, topY + 4);
  ctx.lineTo(w, topY - 14);
  ctx.moveTo(0, bottomY + 2);
  ctx.lineTo(w, bottomY - 16);
  ctx.stroke();

  ctx.restore();
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
  const half = (collectible ? 24 : 34) * scale;
  const y = point.y + (collectible ? 8 : 13) * scale;

  ctx.save();
  ctx.globalAlpha = this.lowPerf ? 0.42 : 0.52;
  ctx.strokeStyle = collectible ? 'rgba(92,235,255,0.58)' : 'rgba(255,90,78,0.62)';
  ctx.lineWidth = this.lowPerf ? 1.2 : 1.5;
  ctx.beginPath();
  ctx.moveTo(point.x - half, y);
  ctx.lineTo(point.x + half, y - 3 * scale);
  ctx.stroke();
  ctx.restore();
};
