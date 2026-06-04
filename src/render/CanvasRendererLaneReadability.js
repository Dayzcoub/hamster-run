import { CanvasRenderer } from './CanvasRenderer.js';

const originalDrawLanes = CanvasRenderer.prototype.drawLanes;
const originalDrawObject = CanvasRenderer.prototype.drawObject;

CanvasRenderer.prototype.drawLanes = function drawLanesWithActiveFocus(levelState = {}) {
  originalDrawLanes.call(this, levelState);
  if (levelState.player) this.drawActiveLaneFocus(levelState.player, levelState.elapsedMs || 0);
};

CanvasRenderer.prototype.drawActiveLaneFocus = function drawActiveLaneFocus(player, elapsedMs = 0) {
  const ctx = this.ctx;
  const projected = this.projector.project(player.x, player.renderLane, this.width, this.height);
  const laneY = projected.y;
  const scale = projected.scale;
  const width = this.lowPerf ? 154 * scale : 190 * scale;
  const height = this.lowPerf ? 22 * scale : 28 * scale;
  const pulse = this.lowPerf ? 1 : 0.82 + Math.sin(elapsedMs / 180) * 0.12;

  ctx.save();
  ctx.globalCompositeOperation = this.lowPerf ? 'source-over' : 'screen';
  ctx.globalAlpha = this.lowPerf ? 0.28 : 0.34 * pulse;

  const grad = ctx.createLinearGradient(projected.x - width * 0.5, laneY, projected.x + width * 0.5, laneY);
  grad.addColorStop(0, 'rgba(92,235,255,0)');
  grad.addColorStop(0.22, 'rgba(92,235,255,0.42)');
  grad.addColorStop(0.52, 'rgba(255,194,71,0.48)');
  grad.addColorStop(0.82, 'rgba(92,235,255,0.38)');
  grad.addColorStop(1, 'rgba(92,235,255,0)');

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(projected.x - 8 * scale, laneY + 14 * scale, width * 0.5, height * 0.5, -0.045, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = this.lowPerf ? 0.5 : 0.62 * pulse;
  ctx.strokeStyle = this.lowPerf ? 'rgba(92,235,255,0.38)' : 'rgba(255,194,71,0.54)';
  ctx.lineWidth = this.lowPerf ? 1 : 1.4;
  ctx.beginPath();
  ctx.moveTo(projected.x - width * 0.38, laneY + 10 * scale);
  ctx.lineTo(projected.x + width * 0.38, laneY + 5 * scale);
  ctx.stroke();

  ctx.restore();
};

CanvasRenderer.prototype.drawObject = function drawObjectWithLaneAnchor(object, elapsedMs = 0) {
  this.drawObjectLaneAnchor(object, elapsedMs);
  originalDrawObject.call(this, object, elapsedMs);
};

CanvasRenderer.prototype.drawObjectLaneAnchor = function drawObjectLaneAnchor(object, elapsedMs = 0) {
  const ctx = this.ctx;
  const projected = this.projector.project(object.x, object.lane, this.width, this.height);
  const collectible = object.kind === 'collectible';
  const scale = projected.scale;
  const width = (collectible ? 66 : 104) * scale;
  const height = (collectible ? 10 : 16) * scale;
  const y = projected.y + (collectible ? 8 : 15) * scale;

  ctx.save();
  ctx.globalCompositeOperation = this.lowPerf ? 'source-over' : 'screen';
  ctx.globalAlpha = this.lowPerf ? 0.24 : 0.32;

  const grad = ctx.createLinearGradient(projected.x - width * 0.5, y, projected.x + width * 0.5, y);
  const color = collectible ? '92,235,255' : '255,90,78';
  grad.addColorStop(0, `rgba(${color},0)`);
  grad.addColorStop(0.5, `rgba(${color},0.58)`);
  grad.addColorStop(1, `rgba(${color},0)`);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(projected.x, y, width * 0.5, height * 0.5, -0.04, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = this.lowPerf ? 0.42 : 0.56;
  ctx.strokeStyle = collectible ? 'rgba(92,235,255,0.48)' : 'rgba(255,90,78,0.52)';
  ctx.lineWidth = this.lowPerf ? 1 : 1.2;
  ctx.beginPath();
  ctx.moveTo(projected.x - width * 0.35, y - height * 0.12);
  ctx.lineTo(projected.x + width * 0.35, y - height * 0.2);
  ctx.stroke();

  ctx.restore();
};
