import { CanvasRenderer } from './CanvasRenderer.js';

if (!CanvasRenderer.prototype.__backdropLaneTransparencyPatch) {
  CanvasRenderer.prototype.__backdropLaneTransparencyPatch = true;

  CanvasRenderer.prototype.drawLaneDeckBaseV1 = function drawLaneDeckBaseV1(ctx, width, laneYs, low) {
    const top = laneYs[0] - 66;
    const bottom = laneYs[2] + 92;
    const base = ctx.createLinearGradient(0, top, 0, bottom);
    base.addColorStop(0, 'rgba(8,17,30,0.28)');
    base.addColorStop(0.54, 'rgba(8,16,27,0.34)');
    base.addColorStop(1, 'rgba(4,9,16,0.42)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = base;
    ctx.beginPath();
    ctx.moveTo(-110, top + 28);
    ctx.lineTo(width + 110, top);
    ctx.lineTo(width + 92, bottom - 24);
    ctx.lineTo(-120, bottom + 8);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = low ? 0.24 : 0.34;
    ctx.strokeStyle = 'rgba(92,235,255,0.38)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, top + 8);
    ctx.lineTo(width, top - 18);
    ctx.moveTo(0, bottom - 4);
    ctx.lineTo(width, bottom - 28);
    ctx.stroke();
  };

  CanvasRenderer.prototype.drawLaneTrackV1 = function drawLaneTrackV1(ctx, width, centerY, lane, active, low) {
    const height = this.isWideShort ? [42, 54, 68][lane] : [50, 64, 78][lane];
    const top = centerY - height * 0.5;
    const bottom = centerY + height * 0.5;
    const grad = ctx.createLinearGradient(0, top, width, bottom);
    grad.addColorStop(0, active ? 'rgba(20,34,52,0.28)' : 'rgba(13,25,40,0.18)');
    grad.addColorStop(0.52, active ? 'rgba(16,29,45,0.34)' : 'rgba(10,20,34,0.24)');
    grad.addColorStop(1, active ? 'rgba(11,20,32,0.42)' : 'rgba(6,13,23,0.32)');

    ctx.globalAlpha = 1;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-82, top + 18);
    ctx.lineTo(width + 86, top);
    ctx.lineTo(width + 72, bottom - 12);
    ctx.lineTo(-98, bottom + 10);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = active ? 0.52 : 0.32;
    ctx.strokeStyle = active ? 'rgba(255,194,71,0.52)' : 'rgba(92,235,255,0.34)';
    ctx.lineWidth = active ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY + 2);
    ctx.lineTo(width, centerY - 16);
    ctx.stroke();

    if (!low) {
      ctx.globalAlpha = active ? 0.12 : 0.07;
      ctx.fillStyle = active ? 'rgba(255,194,71,0.14)' : 'rgba(92,235,255,0.1)';
      ctx.beginPath();
      ctx.moveTo(-70, top + 18);
      ctx.lineTo(width + 70, top);
      ctx.lineTo(width + 70, top + 12);
      ctx.lineTo(-72, top + 30);
      ctx.closePath();
      ctx.fill();
    }
  };

  CanvasRenderer.prototype.drawLaneGlossV1 = function drawLaneGlossV1(ctx, width, height, low) {
    if (low) return;
    const gloss = ctx.createLinearGradient(0, height * 0.43, 0, height);
    gloss.addColorStop(0, 'rgba(255,255,255,0.012)');
    gloss.addColorStop(0.42, 'rgba(92,235,255,0.018)');
    gloss.addColorStop(1, 'rgba(255,194,71,0.014)');
    ctx.fillStyle = gloss;
    ctx.fillRect(0, height * 0.43, width, height * 0.57);
  };
}
