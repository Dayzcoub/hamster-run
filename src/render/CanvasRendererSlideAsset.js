import { CanvasRenderer } from './CanvasRenderer.js';

const slideSpritePath = 'assets/sprites/characters/hamster/svg/hamster_slide_custom.svg';
let slideImage = null;
let slideLoading = null;

function loadSlideSprite() {
  if (slideImage?.complete && slideImage.naturalWidth > 0) return slideImage;
  if (slideLoading) return null;

  slideImage = new Image();
  slideLoading = new Promise((resolve) => {
    slideImage.onload = () => resolve(slideImage);
    slideImage.onerror = () => resolve(null);
    slideImage.src = slideSpritePath;
  });
  return null;
}

const originalDrawSprite = CanvasRenderer.prototype.drawSprite;

CanvasRenderer.prototype.drawSprite = function drawSpriteWithCustomSlide(visualKey, x, y, size, scale, isPlayer, flipX = false, animation = null) {
  if (visualKey !== 'hamster_slide' || !isPlayer) {
    originalDrawSprite.call(this, visualKey, x, y, size, scale, isPlayer, flipX, animation);
    return;
  }

  const sprite = loadSlideSprite();
  if (!sprite) {
    originalDrawSprite.call(this, visualKey, x, y, size, scale, isPlayer, flipX, animation);
    return;
  }

  const ctx = this.ctx;
  const aspect = sprite.width / sprite.height;
  const width = size * aspect * 1.14;
  const height = size * 0.92;
  const drawX = -width * 0.52;
  const drawY = -height * 0.8;
  const rotation = animation?.rotation ?? 0;

  ctx.save();
  ctx.globalAlpha = Math.max(animation?.shadowAlpha ?? 0.28, 0.34);
  ctx.fillStyle = 'rgba(0,0,0,0.74)';
  ctx.beginPath();
  ctx.ellipse(x + 8 * scale, y + 13 * scale, width * 0.26, height * 0.055, -0.05, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(x, y);
  if (flipX) ctx.scale(-1, 1);
  ctx.rotate(rotation * 0.32);
  ctx.drawImage(sprite, drawX, drawY, width, height);
  ctx.restore();
};
