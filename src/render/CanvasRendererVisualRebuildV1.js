import { CanvasRenderer } from './CanvasRenderer.js';

const baseDrawObject = CanvasRenderer.prototype.drawObject;
const baseDrawSprite = CanvasRenderer.prototype.drawSprite;

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

if (!CanvasRenderer.prototype.__visualRebuildV1Patch) {
  CanvasRenderer.prototype.__visualRebuildV1Patch = true;

  CanvasRenderer.prototype.drawBackground = function drawBackstageWorldV1(levelState = {}) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const distance = levelState.distance || 0;
    const low = Boolean(this.lowPerf);

    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#07111f');
    bg.addColorStop(0.46, '#0a1422');
    bg.addColorStop(0.72, '#080f1a');
    bg.addColorStop(1, '#030710');
    ctx.fillStyle = bg;
    ctx.fillRect(-24, -24, w + 48, h + 48);

    this.drawBackstageDepthV1(ctx, w, h, distance, low);
    this.drawBackstagePracticalLightsV1(ctx, w, h, distance, low);
    this.drawBackstageFloorV1(ctx, w, h, distance, low);
    this.drawBackstageVignetteV1(ctx, w, h, low);
  };

  CanvasRenderer.prototype.drawBackstageDepthV1 = function drawBackstageDepthV1(ctx, w, h, distance, low) {
    const yBase = h * 0.38;
    const scroll = (distance * 0.025) % 260;

    ctx.save();
    ctx.globalAlpha = low ? 0.24 : 0.34;
    ctx.strokeStyle = 'rgba(92,235,255,0.18)';
    ctx.lineWidth = low ? 1 : 1.25;

    for (let x = -320 - scroll; x < w + 360; x += 260) {
      this.drawStageTrussV1(ctx, x, yBase - 92, 86, 176);
      this.drawStageBeamV1(ctx, x + 44, yBase - 88, 222, 38);
    }

    ctx.globalAlpha = low ? 0.28 : 0.36;
    ctx.fillStyle = 'rgba(4,8,14,0.74)';
    ctx.strokeStyle = 'rgba(160,176,196,0.14)';
    for (let x = -220 - (distance * 0.045) % 210; x < w + 260; x += 210) {
      const y = yBase + 10 + (x / 210 % 2) * 16;
      this.roundRect(ctx, x, y, 88, 46, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillRect(x + 14, y + 46, 10, 6);
      ctx.fillRect(x + 62, y + 46, 10, 6);
    }

    ctx.restore();
  };

  CanvasRenderer.prototype.drawStageTrussV1 = function drawStageTrussV1(ctx, x, y, width, height) {
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.stroke();
    for (let i = 0; i < 5; i += 1) {
      const y0 = y + (height / 5) * i;
      const y1 = y + (height / 5) * (i + 1);
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.lineTo(x + width, y1);
      ctx.moveTo(x + width, y0);
      ctx.lineTo(x, y1);
      ctx.stroke();
    }
  };

  CanvasRenderer.prototype.drawStageBeamV1 = function drawStageBeamV1(ctx, x, y, width, height) {
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.stroke();
    for (let i = 0; i < 6; i += 1) {
      const x0 = x + (width / 6) * i;
      const x1 = x + (width / 6) * (i + 1);
      ctx.beginPath();
      ctx.moveTo(x0, y + height);
      ctx.lineTo(x1, y);
      ctx.stroke();
    }
  };

  CanvasRenderer.prototype.drawBackstagePracticalLightsV1 = function drawBackstagePracticalLightsV1(ctx, w, h, distance, low) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    const cyan = ctx.createRadialGradient(w * 0.16, h * 0.2, 0, w * 0.16, h * 0.2, w * 0.48);
    cyan.addColorStop(0, low ? 'rgba(92,235,255,0.11)' : 'rgba(92,235,255,0.17)');
    cyan.addColorStop(0.48, 'rgba(47,141,255,0.045)');
    cyan.addColorStop(1, 'rgba(47,141,255,0)');
    ctx.fillStyle = cyan;
    ctx.fillRect(0, 0, w, h);

    const warm = ctx.createRadialGradient(w * 0.77, h * 0.24, 0, w * 0.77, h * 0.24, w * 0.42);
    warm.addColorStop(0, low ? 'rgba(255,194,71,0.1)' : 'rgba(255,194,71,0.16)');
    warm.addColorStop(0.5, 'rgba(255,90,78,0.045)');
    warm.addColorStop(1, 'rgba(255,90,78,0)');
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, w, h);

    if (!low) {
      const stripeOffset = (distance * 0.05) % 320;
      ctx.globalAlpha = 0.13;
      ctx.fillStyle = '#5cebff';
      for (let i = -2; i < Math.ceil(w / 320) + 3; i += 1) {
        const x = i * 320 - stripeOffset;
        ctx.beginPath();
        ctx.moveTo(x + 70, 0);
        ctx.lineTo(x + 126, 0);
        ctx.lineTo(x - 40, h);
        ctx.lineTo(x - 92, h);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.restore();
  };

  CanvasRenderer.prototype.drawBackstageFloorV1 = function drawBackstageFloorV1(ctx, w, h, distance, low) {
    const floorTop = h * 0.42;
    const floor = ctx.createLinearGradient(0, floorTop, 0, h);
    floor.addColorStop(0, 'rgba(10,21,35,0.56)');
    floor.addColorStop(0.5, 'rgba(7,14,24,0.88)');
    floor.addColorStop(1, 'rgba(3,7,13,0.98)');
    ctx.fillStyle = floor;
    ctx.fillRect(0, floorTop, w, h - floorTop);

    ctx.save();
    ctx.globalAlpha = low ? 0.1 : 0.16;
    ctx.strokeStyle = 'rgba(255,194,71,0.24)';
    ctx.lineWidth = 1;
    const offset = (distance * 0.06) % 180;
    for (let x = -offset - 160; x < w + 180; x += 180) {
      ctx.beginPath();
      ctx.moveTo(x, h * 0.72);
      ctx.lineTo(x + 110, h * 0.71);
      ctx.stroke();
    }

    ctx.globalAlpha = low ? 0.08 : 0.12;
    ctx.strokeStyle = 'rgba(92,235,255,0.24)';
    for (let i = 0; i < 4; i += 1) {
      const y = h * (0.49 + i * 0.11);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y - 10);
      ctx.stroke();
    }
    ctx.restore();
  };

  CanvasRenderer.prototype.drawBackstageVignetteV1 = function drawBackstageVignetteV1(ctx, w, h, low) {
    if (low) return;
    const vignette = ctx.createRadialGradient(w * 0.5, h * 0.48, 0, w * 0.5, h * 0.48, Math.max(w, h) * 0.72);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(0.68, 'rgba(0,0,0,0.16)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.46)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  };

  CanvasRenderer.prototype.drawLanes = function drawPremiumStageLanesV1(levelState = {}) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const distance = levelState.distance || 0;
    const activeLane = levelState.player?.renderLane ?? 1;
    const laneYs = [0, 1, 2].map((lane) => this.projector.laneY(lane, h));
    const low = Boolean(this.lowPerf);

    ctx.save();
    this.drawLaneDeckBaseV1(ctx, w, laneYs, low);

    for (let lane = 0; lane < 3; lane += 1) {
      const active = Math.abs(activeLane - lane) < 0.55;
      this.drawLaneTrackV1(ctx, w, laneYs[lane], lane, active, low);
    }

    this.drawLaneMotionMarksV1(ctx, w, laneYs, distance, low);
    this.drawLaneGlossV1(ctx, w, h, low);
    ctx.restore();
  };

  CanvasRenderer.prototype.drawLaneDeckBaseV1 = function drawLaneDeckBaseV1(ctx, width, laneYs, low) {
    const top = laneYs[0] - 66;
    const bottom = laneYs[2] + 92;
    const base = ctx.createLinearGradient(0, top, 0, bottom);
    base.addColorStop(0, 'rgba(8,17,30,0.92)');
    base.addColorStop(0.54, 'rgba(8,16,27,0.98)');
    base.addColorStop(1, 'rgba(4,9,16,0.98)');
    ctx.globalAlpha = 0.96;
    ctx.fillStyle = base;
    ctx.beginPath();
    ctx.moveTo(-110, top + 28);
    ctx.lineTo(width + 110, top);
    ctx.lineTo(width + 92, bottom - 24);
    ctx.lineTo(-120, bottom + 8);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = low ? 0.2 : 0.28;
    ctx.strokeStyle = 'rgba(92,235,255,0.34)';
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
    grad.addColorStop(0, active ? 'rgba(20,34,52,0.82)' : 'rgba(13,25,40,0.74)');
    grad.addColorStop(0.52, active ? 'rgba(16,29,45,0.92)' : 'rgba(10,20,34,0.86)');
    grad.addColorStop(1, active ? 'rgba(11,20,32,0.96)' : 'rgba(6,13,23,0.94)');

    ctx.globalAlpha = 1;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-82, top + 18);
    ctx.lineTo(width + 86, top);
    ctx.lineTo(width + 72, bottom - 12);
    ctx.lineTo(-98, bottom + 10);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = active ? 0.44 : 0.26;
    ctx.strokeStyle = active ? 'rgba(255,194,71,0.46)' : 'rgba(92,235,255,0.28)';
    ctx.lineWidth = active ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY + 2);
    ctx.lineTo(width, centerY - 16);
    ctx.stroke();

    if (!low) {
      ctx.globalAlpha = active ? 0.16 : 0.1;
      ctx.fillStyle = active ? 'rgba(255,194,71,0.12)' : 'rgba(92,235,255,0.09)';
      ctx.beginPath();
      ctx.moveTo(-70, top + 18);
      ctx.lineTo(width + 70, top);
      ctx.lineTo(width + 70, top + 12);
      ctx.lineTo(-72, top + 30);
      ctx.closePath();
      ctx.fill();
    }
  };

  CanvasRenderer.prototype.drawLaneMotionMarksV1 = function drawLaneMotionMarksV1(ctx, width, laneYs, distance, low) {
    ctx.globalAlpha = low ? 0.12 : 0.18;
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1;
    const offset = (distance * 0.2) % 170;
    for (const y of laneYs) {
      for (let x = -offset - 180; x < width + 220; x += 170) {
        ctx.beginPath();
        ctx.moveTo(x, y + 32);
        ctx.lineTo(x + 68, y + 26);
        ctx.stroke();
      }
    }
  };

  CanvasRenderer.prototype.drawLaneGlossV1 = function drawLaneGlossV1(ctx, width, height, low) {
    if (low) return;
    const gloss = ctx.createLinearGradient(0, height * 0.43, 0, height);
    gloss.addColorStop(0, 'rgba(255,255,255,0.02)');
    gloss.addColorStop(0.42, 'rgba(92,235,255,0.03)');
    gloss.addColorStop(1, 'rgba(255,194,71,0.025)');
    ctx.fillStyle = gloss;
    ctx.fillRect(0, height * 0.43, width, height * 0.57);
  };

  CanvasRenderer.prototype.drawObject = function drawObjectUnifiedV1(object, elapsedMs = 0) {
    this.drawObjectGroundingV1(object);
    baseDrawObject.call(this, object, elapsedMs);
  };

  CanvasRenderer.prototype.drawObjectGroundingV1 = function drawObjectGroundingV1(object) {
    const ctx = this.ctx;
    const point = this.projector.project(object.x, object.lane, this.width, this.height);
    const collectible = object.kind === 'collectible';
    const scale = point.scale;
    const half = (collectible ? 28 : 38) * scale;
    const y = point.y + (collectible ? 10 : 14) * scale;

    ctx.save();
    ctx.globalAlpha = this.lowPerf ? 0.46 : 0.58;
    ctx.fillStyle = 'rgba(0,0,0,0.54)';
    ctx.beginPath();
    ctx.ellipse(point.x, y + 7 * scale, half, (collectible ? 5 : 6) * scale, -0.06, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = this.lowPerf ? 0.2 : 0.3;
    ctx.strokeStyle = collectible ? 'rgba(255,194,71,0.46)' : 'rgba(255,90,78,0.5)';
    ctx.lineWidth = this.lowPerf ? 1 : 1.2;
    ctx.beginPath();
    ctx.moveTo(point.x - half * 0.9, y);
    ctx.lineTo(point.x + half * 0.9, y - 4 * scale);
    ctx.stroke();
    ctx.restore();
  };

  CanvasRenderer.prototype.drawSprite = function drawSpriteUnifiedContactV1(visualKey, x, y, size, scale, isPlayer, flipX = false, animation = null) {
    const heroLike = isPlayer || visualKey?.startsWith('spaniel_');
    if (!heroLike) {
      baseDrawSprite.call(this, visualKey, x, y, size, scale, isPlayer, flipX, animation);
      return;
    }

    const ctx = this.ctx;
    const shadowScale = animation?.shadowScale ?? 1;
    const shadowAlpha = Math.max(animation?.shadowAlpha ?? 0.22, this.lowPerf ? 0.28 : 0.24);
    ctx.save();
    ctx.globalAlpha = shadowAlpha;
    ctx.fillStyle = 'rgba(0,0,0,0.68)';
    ctx.beginPath();
    ctx.ellipse(x, y + 11 * scale, size * 0.28 * shadowScale, size * 0.06, -0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    baseDrawSprite.call(this, visualKey, x, y, size, scale, isPlayer, flipX, animation);
  };
}
