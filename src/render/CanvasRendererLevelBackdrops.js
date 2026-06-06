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

    const topShade = ctx.createLinearGradient(0, 0, 0, h * 0.34);
    topShade.addColorStop(0, 'rgba(3,7,13,0.64)');
    topShade.addColorStop(0.72, 'rgba(3,7,13,0.18)');
    topShade.addColorStop(1, 'rgba(3,7,13,0)');
    ctx.fillStyle = topShade;
    ctx.fillRect(0, 0, w, h * 0.36);

    const gameplayShade = ctx.createLinearGradient(0, h * 0.35, 0, h);
    gameplayShade.addColorStop(0, 'rgba(5,10,18,0.06)');
    gameplayShade.addColorStop(0.48, 'rgba(5,10,18,0.22)');
    gameplayShade.addColorStop(1, 'rgba(3,7,13,0.46)');
    ctx.fillStyle = gameplayShade;
    ctx.fillRect(0, h * 0.35, w, h * 0.65);

    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = low ? 0.12 : 0.18;
    const cyan = ctx.createRadialGradient(w * 0.18, h * 0.22, 0, w * 0.18, h * 0.22, w * 0.42);
    cyan.addColorStop(0, 'rgba(92,235,255,0.32)');
    cyan.addColorStop(1, 'rgba(92,235,255,0)');
    ctx.fillStyle = cyan;
    ctx.fillRect(0, 0, w, h);

    ctx.globalAlpha = low ? 0.1 : 0.16;
    const amber = ctx.createRadialGradient(w * 0.78, h * 0.2, 0, w * 0.78, h * 0.2, w * 0.38);
    amber.addColorStop(0, 'rgba(255,194,71,0.32)');
    amber.addColorStop(1, 'rgba(255,194,71,0)');
    ctx.fillStyle = amber;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = 'source-over';
    if (!low) {
      const vignette = ctx.createRadialGradient(w * 0.5, h * 0.48, 0, w * 0.5, h * 0.48, Math.max(w, h) * 0.74);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(0.72, 'rgba(0,0,0,0.12)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.38)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
    }
  };
}
