import { CanvasRenderer } from './CanvasRenderer.js';

const originalResize = CanvasRenderer.prototype.resize;
const originalDrawBackground = CanvasRenderer.prototype.drawBackground;
const originalDrawObject = CanvasRenderer.prototype.drawObject;
const originalDrawObjectMarker = CanvasRenderer.prototype.drawObjectMarker;
const originalDrawSpriteContourGlow = CanvasRenderer.prototype.drawSpriteContourGlow;
const originalDrawLaneSwitchTrail = CanvasRenderer.prototype.drawLaneSwitchTrail;

function savedRenderQuality() {
  try {
    const raw = window.localStorage.getItem('packit_run_save_v1');
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.settings?.renderQuality || 'auto';
  } catch {
    return 'auto';
  }
}

function shouldUseLowPerf(width, height) {
  const quality = savedRenderQuality();
  if (quality === 'performance') return true;
  if (quality === 'quality') return false;

  const ua = navigator.userAgent || '';
  const android = /Android|MZ-|Meizu|Flyme/i.test(ua);
  return android || width < 900 || height < 540;
}

CanvasRenderer.prototype.resize = function resizeWithPerformanceMode() {
  const rect = this.canvas.getBoundingClientRect();
  const width = Math.max(320, Math.floor(rect.width));
  const height = Math.max(260, Math.floor(rect.height));
  this.lowPerf = shouldUseLowPerf(width, height);
  this.dpr = this.lowPerf ? 1 : Math.min(window.devicePixelRatio || 1, 2);

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

  if (!this.lowPerf) originalResize.call(this);
};

CanvasRenderer.prototype.drawBackground = function drawBackgroundPerformance(levelState) {
  if (!this.lowPerf) {
    originalDrawBackground.call(this, levelState);
    return;
  }

  const ctx = this.ctx;
  const w = this.width;
  const h = this.height;
  const distance = levelState.distance || 0;

  const sky = ctx.createLinearGradient(0, 0, w, h);
  sky.addColorStop(0, '#071120');
  sky.addColorStop(0.5, '#0b1424');
  sky.addColorStop(1, '#050913');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = '#5cebff';
  ctx.fillRect(0, h * 0.22, w, 2);
  ctx.fillStyle = '#ffc247';
  ctx.fillRect(0, h * 0.37, w, 2);

  const stripeOffset = (distance * 0.08) % 220;
  ctx.globalAlpha = 0.08;
  for (let x = -stripeOffset; x < w + 220; x += 220) {
    ctx.beginPath();
    ctx.moveTo(x, h * 0.1);
    ctx.lineTo(x + 36, h * 0.1);
    ctx.lineTo(x - 80, h);
    ctx.lineTo(x - 112, h);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
};

CanvasRenderer.prototype.drawObject = function drawObjectPerformance(object, elapsedMs = 0) {
  if (!this.lowPerf) {
    originalDrawObject.call(this, object, elapsedMs);
    return;
  }

  const projected = this.projector.project(object.x, object.lane, this.width, this.height);
  const baseSize = object.kind === 'collectible'
    ? (this.isWideShort ? 42 : this.isCompact ? 40 : 50)
    : (this.isWideShort ? 68 : this.isCompact ? 64 : 84);
  const size = baseSize * projected.scale * this.spriteScale(object.visualKey);
  this.drawSprite(object.visualKey, projected.x, projected.y, size, projected.scale, false, false);
  originalDrawObjectMarker.call(this, object, projected.x, projected.y, size, projected.scale, elapsedMs);
};

CanvasRenderer.prototype.drawSpriteContourGlow = function drawSpriteContourGlowPerformance(visualKey, x, y, size, collectible) {
  if (this.lowPerf) return;
  originalDrawSpriteContourGlow.call(this, visualKey, x, y, size, collectible);
};

CanvasRenderer.prototype.drawObjectMarker = function drawObjectMarkerPerformance(object, x, y, size, scale, elapsedMs = 0) {
  if (!this.lowPerf) {
    originalDrawObjectMarker.call(this, object, x, y, size, scale, elapsedMs);
    return;
  }

  const collectible = object.kind === 'collectible';
  const ctx = this.ctx;
  const markerSize = Math.max(14, Math.min(20, size * 0.3));
  const markerY = y - size * 0.78;
  const markerX = x + size * 0.15;

  ctx.save();
  ctx.globalAlpha = 0.96;
  ctx.fillStyle = collectible ? 'rgba(18,30,34,0.95)' : 'rgba(54,20,20,0.95)';
  ctx.strokeStyle = collectible ? '#ffc247' : '#ff5a4e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(markerX, markerY, markerSize * 0.52, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.font = `900 ${markerSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = collectible ? '#ffc247' : '#ff5a4e';
  ctx.fillText(collectible ? '+' : '!', markerX, markerY - markerSize * 0.05);
  ctx.restore();
};

CanvasRenderer.prototype.drawLaneSwitchTrail = function drawLaneSwitchTrailPerformance(...args) {
  if (this.lowPerf) return;
  originalDrawLaneSwitchTrail?.call(this, ...args);
};
