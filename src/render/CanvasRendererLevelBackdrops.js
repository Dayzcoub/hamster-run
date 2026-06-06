import { CanvasRenderer } from './CanvasRenderer.js';
import { backdropForLevel } from '../data/backdrops.js';

const fallbackDrawBackground = CanvasRenderer.prototype.drawBackground;

if (!CanvasRenderer.prototype.__levelBackdropPatch) {
  CanvasRenderer.prototype.__levelBackdropPatch = true;

  CanvasRenderer.prototype.drawBackground = function drawLevelBackdrop(levelState = {}) {
    const backdrop = backdropForLevel(levelState.level);
    const asset = backdrop?.visualKey ? this.assets?.get(backdrop.visualKey) : null;

    if (!asset?.image) {
      fallbackDrawBackground.call(this, levelState);
      return;
    }

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const distance = levelState.distance || 0;
    const image = asset.image;
    const sourceW = image.naturalWidth || image.width;
    const sourceH = image.naturalHeight || image.height;
    const scale = Math.max(h / sourceH, w / sourceW);
    const drawW = sourceW * scale;
    const drawH = sourceH * scale;
    const drawY = (h - drawH) * 0.5;
    const scrollRatio = backdrop.scrollRatio ?? 0.18;
    const scroll = (distance * scrollRatio) % drawW;

    ctx.save();
    ctx.fillStyle = '#050913';
    ctx.fillRect(-24, -24, w + 48, h + 48);

    for (let x = -scroll - drawW; x < w + drawW; x += drawW) {
      ctx.drawImage(image, x, drawY, drawW, drawH);
    }

    this.drawBackdropReadabilityOverlayV1(ctx, w, h, levelState);
    ctx.restore();
  };

  CanvasRenderer.prototype.drawBackdropReadabilityOverlayV1 = function drawBackdropReadabilityOverlayV1(ctx, w, h, levelState = {}) {
    const low = Boolean(this.lowPerf);

    const topShade = ctx.createLinearGradient(0, 0, 0, h * 0.24);
    topShade.addColorStop(0, 'rgba(3,7,13,0.34)');
    topShade.addColorStop(0.78, 'rgba(3,7,13,0.08)');
    topShade.addColorStop(1, 'rgba(3,7,13,0)');
    ctx.fillStyle = topShade;
    ctx.fillRect(0, 0, w, h * 0.26);

    const gameplayShade = ctx.createLinearGradient(0, h * 0.4, 0, h);
    gameplayShade.addColorStop(0, 'rgba(5,10,18,0.015)');
    gameplayShade.addColorStop(0.52, 'rgba(5,10,18,0.055)');
    gameplayShade.addColorStop(1, 'rgba(3,7,13,0.15)');
    ctx.fillStyle = gameplayShade;
    ctx.fillRect(0, h * 0.4, w, h * 0.6);

    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = low ? 0.06 : 0.1;
    const cyan = ctx.createRadialGradient(w * 0.18, h * 0.22, 0, w * 0.18, h * 0.22, w * 0.42);
    cyan.addColorStop(0, 'rgba(92,235,255,0.22)');
    cyan.addColorStop(1, 'rgba(92,235,255,0)');
    ctx.fillStyle = cyan;
    ctx.fillRect(0, 0, w, h);

    ctx.globalAlpha = low ? 0.055 : 0.08;
    const amber = ctx.createRadialGradient(w * 0.78, h * 0.2, 0, w * 0.78, h * 0.2, w * 0.38);
    amber.addColorStop(0, 'rgba(255,194,71,0.22)');
    amber.addColorStop(1, 'rgba(255,194,71,0)');
    ctx.fillStyle = amber;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'source-over';
    if (!low) {
      const vignette = ctx.createRadialGradient(w * 0.5, h * 0.48, 0, w * 0.5, h * 0.48, Math.max(w, h) * 0.78);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(0.8, 'rgba(0,0,0,0.045)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.18)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
    }
  };

  CanvasRenderer.prototype.drawLaneDeckBaseV1 = function drawLaneDeckBaseV1(ctx, width, laneYs, low) {
    const top = laneYs[0] - 66;
    const bottom = laneYs[2] + 92;
    const base = ctx.createLinearGradient(0, top, 0, bottom);
    base.addColorStop(0, 'rgba(8,17,30,0.24)');
    base.addColorStop(0.54, 'rgba(8,16,27,0.3)');
    base.addColorStop(1, 'rgba(4,9,16,0.38)');
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
    grad.addColorStop(0, active ? 'rgba(20,34,52,0.22)' : 'rgba(13,25,40,0.15)');
    grad.addColorStop(0.52, active ? 'rgba(16,29,45,0.28)' : 'rgba(10,20,34,0.2)');
    grad.addColorStop(1, active ? 'rgba(11,20,32,0.36)' : 'rgba(6,13,23,0.28)');

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
      ctx.globalAlpha = active ? 0.11 : 0.06;
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
    gloss.addColorStop(0, 'rgba(255,255,255,0.01)');
    gloss.addColorStop(0.42, 'rgba(92,235,255,0.015)');
    gloss.addColorStop(1, 'rgba(255,194,71,0.012)');
    ctx.fillStyle = gloss;
    ctx.fillRect(0, height * 0.43, width, height * 0.57);
  };
}
