import { CanvasRenderer } from './CanvasRenderer.js';

const originalDrawPlayer = CanvasRenderer.prototype.drawPlayer;

CanvasRenderer.prototype.drawPlayer = function drawPlayerWithLaneTrail(player, elapsedMs = 0) {
  const laneDelta = player.lane - player.renderLane;
  if (Math.abs(laneDelta) > 0.035) this.drawLaneSwitchTrail(player, laneDelta, elapsedMs);
  originalDrawPlayer.call(this, player, elapsedMs);
};

CanvasRenderer.prototype.drawLaneSwitchTrail = function drawLaneSwitchTrail(player, laneDelta, elapsedMs = 0) {
  const ctx = this.ctx;
  const from = this.projector.project(player.x, player.renderLane, this.width, this.height);
  const to = this.projector.project(player.x, player.lane, this.width, this.height);
  const strength = Math.min(1, Math.abs(laneDelta));
  const dir = Math.sign(laneDelta) || 1;
  const timePulse = 0.65 + Math.sin(elapsedMs / 48) * 0.18;

  ctx.save();
  ctx.globalCompositeOperation = 'screen';

  const grad = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
  grad.addColorStop(0, 'rgba(92,235,255,0)');
  grad.addColorStop(0.35, `rgba(92,235,255,${0.22 * strength * timePulse})`);
  grad.addColorStop(0.72, `rgba(255,194,71,${0.18 * strength * timePulse})`);
  grad.addColorStop(1, 'rgba(255,194,71,0)');

  ctx.strokeStyle = grad;
  ctx.lineWidth = (this.isCompact ? 10 : 14) * strength;
  ctx.lineCap = 'round';
  ctx.shadowColor = 'rgba(92,235,255,0.58)';
  ctx.shadowBlur = 16;

  const cx = (from.x + to.x) * 0.5 - 10 * dir;
  const cy = (from.y + to.y) * 0.5;
  ctx.beginPath();
  ctx.moveTo(from.x - 18, from.y + 8);
  ctx.quadraticCurveTo(cx, cy, to.x - 12, to.y + 8);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = `rgba(92,235,255,${0.42 * strength})`;
  for (let i = 0; i < 4; i++) {
    const t = (i + 1) / 5;
    const px = from.x + (to.x - from.x) * t - 22 - i * 7;
    const py = from.y + (to.y - from.y) * t + 14 + Math.sin(elapsedMs / 60 + i) * 3;
    ctx.beginPath();
    ctx.ellipse(px, py, 5 - i * 0.45, 2.6 - i * 0.28, -0.12 * dir, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
};
