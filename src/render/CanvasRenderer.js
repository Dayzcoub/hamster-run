import { IsoProjector } from './IsoProjector.js';

const SPRITE_SCALE_OVERRIDES = {
  hamster_run_01: 0.92,
  hamster_jump: 0.92,
  hamster_slide: 0.92,
  hamster_hit: 0.92,
  hamster_celebrate: 0.92,
  bread: 0.84,
  cable_coil: 0.66,
  c2_connector: 0.9,
  bolt: 0.86,
  stage_deck: 0.78,
  flight_case: 0.78,
  cable_loop: 0.62,
  mic_stand: 0.9,
  mystery_box: 0.74,
  cart: 0.8,
};

const PICKUP_PARTICLES = [
  { angle: -2.7, distance: 26, size: 3.6, delay: 0.02 },
  { angle: -2.15, distance: 34, size: 2.8, delay: 0.1 },
  { angle: -1.55, distance: 42, size: 3.3, delay: 0 },
  { angle: -0.92, distance: 36, size: 2.7, delay: 0.16 },
  { angle: -0.28, distance: 28, size: 3.8, delay: 0.06 },
  { angle: 0.35, distance: 22, size: 2.6, delay: 0.14 },
  { angle: -1.2, distance: 54, size: 2.2, delay: 0.22 },
];

export class CanvasRenderer {
  constructor(canvas, assets) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.assets = assets;
    this.projector = new IsoProjector();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(320, Math.floor(rect.width));
    const height = Math.max(300, Math.floor(rect.height));
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
  }

  render(levelState) {
    this.resize();
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.applyScreenShake(levelState.screenShake);
    this.drawBackground(levelState);
    this.drawLanes();

    const drawable = [...levelState.objects].sort((a, b) => a.lane - b.lane || a.x - b.x);
    for (const object of drawable) this.drawObject(object, levelState.elapsedMs);
    this.drawPlayer(levelState.player, levelState.elapsedMs);
    this.drawEffects(levelState.effects || []);
  }

  applyScreenShake(screenShake) {
    if (!screenShake?.intensity) return;
    const power = Math.max(0, Math.min(1, screenShake.intensity));
    const seed = screenShake.seed || 0;
    const time = screenShake.time || 0;
    const x = Math.sin(time / 17 + seed) * 7 * power + Math.sin(time / 43 + seed * 0.7) * 3 * power;
    const y = Math.cos(time / 23 + seed * 1.3) * 5 * power;
    this.ctx.translate(x, y);
  }

  drawBackground(levelState) {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, this.width, this.height);
    gradient.addColorStop(0, '#151021');
    gradient.addColorStop(0.45, '#1b1d2c');
    gradient.addColorStop(1, '#0d1320');
    ctx.fillStyle = gradient;
    ctx.fillRect(-16, -16, this.width + 32, this.height + 32);

    ctx.save();
    ctx.globalAlpha = this.isCompact ? 0.15 : 0.2;
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(-16, -16, this.width + 32, this.height * 0.28 + 16);
    ctx.fillStyle = '#f4b942';
    const stripeStep = this.isCompact ? 240 : 300;
    const stripeCount = Math.ceil(this.width / stripeStep) + 4;
    for (let i = 0; i < stripeCount; i++) {
      const x = ((i * stripeStep - (levelState.distance * 0.12) % stripeStep) % (this.width + stripeStep)) - 130;
      ctx.beginPath();
      ctx.moveTo(x, -16);
      ctx.lineTo(x + 84, -16);
      ctx.lineTo(x - 90, this.height + 16);
      ctx.lineTo(x - 146, this.height + 16);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  drawLanes() {
    const ctx = this.ctx;
    const depthBase = this.isWideShort ? 66 : this.isCompact ? 52 : 58;
    const depthStep = this.isWideShort ? 14 : this.isCompact ? 10 : 12;
    const laneOffset = this.isWideShort ? 82 : this.isCompact ? 56 : 78;

    for (let lane = 0; lane < 3; lane++) {
      const y = this.projector.laneY(lane, this.height);
      const depth = depthBase + lane * depthStep;
      const offset = (1 - lane) * laneOffset;
      ctx.save();
      ctx.globalAlpha = 0.84;
      ctx.fillStyle = lane === 2 ? '#2b1f18' : lane === 1 ? '#241c17' : '#211817';
      ctx.strokeStyle = 'rgba(244,185,66,0.27)';
      ctx.lineWidth = this.isCompact ? 1.7 : 2;
      ctx.beginPath();
      ctx.moveTo(-220 + offset, y + depth);
      ctx.lineTo(this.width + 240 + offset, y + depth - 28);
      ctx.lineTo(this.width + 280 + offset, y - depth);
      ctx.lineTo(-180 + offset, y - depth + 28);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = 'rgba(103,232,249,0.18)';
      ctx.beginPath();
      ctx.moveTo(-180 + offset, y);
      ctx.lineTo(this.width + 240 + offset, y - 28);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawPlayer(player, elapsedMs = 0) {
    const visualKey = player.visualKey;
    const projected = this.projector.project(player.x, player.renderLane, this.width, this.height);
    const yJump = player.jumpOffset * (this.isCompact ? 0.82 : 1);
    const baseSize = this.isWideShort ? 106 : this.isCompact ? 100 : 122;
    const size = baseSize * projected.scale * this.spriteScale(visualKey);
    const animation = this.playerAnimation(player, elapsedMs);
    this.drawSprite(visualKey, projected.x + animation.x, projected.y - yJump + animation.y, size, projected.scale, true, true, animation);
  }

  playerAnimation(player, elapsedMs = 0) {
    const phase = elapsedMs / 96;
    const step = Math.sin(phase);
    const stepAbs = Math.abs(step);
    const fastStep = Math.sin(phase * 2);
    const animation = {
      x: Math.sin(phase * 0.5) * 1.4,
      y: -stepAbs * 5.5,
      rotation: step * 0.045,
      scaleX: 1 + stepAbs * 0.035,
      scaleY: 1 - stepAbs * 0.026,
      shadowScale: 1 + stepAbs * 0.08,
      shadowAlpha: 0.22 + stepAbs * 0.04,
    };

    if (player.state === 'jumping') {
      const t = Math.min(1, Math.max(0, player.jumpMs / 620));
      const lift = Math.sin(t * Math.PI);
      const takeoff = Math.max(0, 1 - t * 7);
      const landing = Math.max(0, (t - 0.86) / 0.14);
      animation.x += lift * 3;
      animation.y -= lift * 2;
      animation.rotation = -0.13 + lift * 0.2;
      animation.scaleX = 0.94 + takeoff * 0.08 + landing * 0.1;
      animation.scaleY = 1.12 - takeoff * 0.08 - landing * 0.1;
      animation.shadowScale = 0.72 + (1 - lift) * 0.28;
      animation.shadowAlpha = 0.12 + (1 - lift) * 0.12;
      return animation;
    }

    if (player.state === 'sliding') {
      const t = Math.min(1, Math.max(0, player.slideMs / 520));
      const slideKick = Math.sin((1 - t) * Math.PI);
      animation.x += 8 + slideKick * 5;
      animation.y += 7;
      animation.rotation = 0.22;
      animation.scaleX = 1.16;
      animation.scaleY = 0.82;
      animation.shadowScale = 1.18;
      animation.shadowAlpha = 0.28;
      return animation;
    }

    if (player.hitMs > 0) {
      const t = Math.min(1, Math.max(0, player.hitMs / 420));
      const shake = Math.sin(elapsedMs / 18) * t;
      animation.x += -10 * t + shake * 5;
      animation.y += Math.sin(elapsedMs / 24) * t * 3;
      animation.rotation = -0.28 * t + shake * 0.08;
      animation.scaleX = 1.08 - t * 0.08;
      animation.scaleY = 0.92 + t * 0.08;
      animation.shadowScale = 1.06;
      animation.shadowAlpha = 0.3;
      return animation;
    }

    if (player.state === 'finished') {
      const cheer = Math.sin(elapsedMs / 150);
      animation.x = cheer * 1.5;
      animation.y = -6 - Math.abs(cheer) * 5;
      animation.rotation = cheer * 0.08;
      animation.scaleX = 1;
      animation.scaleY = 1.03;
      animation.shadowScale = 0.92;
      animation.shadowAlpha = 0.2;
      return animation;
    }

    animation.rotation += fastStep * 0.012;
    return animation;
  }

  drawObject(object, elapsedMs = 0) {
    const projected = this.projector.project(object.x, object.lane, this.width, this.height);
    const baseSize = object.kind === 'collectible'
      ? (this.isWideShort ? 44 : this.isCompact ? 42 : 52)
      : (this.isWideShort ? 74 : this.isCompact ? 68 : 90);
    const pulse = object.kind === 'collectible' ? 1 + Math.sin((elapsedMs || 0) / 140) * 0.055 : 1;
    const size = baseSize * projected.scale * this.spriteScale(object.visualKey) * pulse;
    this.drawSpriteContourGlow(object.visualKey, projected.x, projected.y, size, object.kind === 'collectible');
    this.drawSprite(object.visualKey, projected.x, projected.y, size, projected.scale, false, false);
    this.drawObjectMarker(object, projected.x, projected.y, size, projected.scale, elapsedMs);
  }

  drawObjectMarker(object, x, y, size, scale, elapsedMs = 0) {
    const collectible = object.kind === 'collectible';
    const label = collectible ? '+' : '!';
    const ctx = this.ctx;
    const markerSize = Math.max(16, Math.min(24, size * 0.34));
    const bob = collectible ? Math.sin((elapsedMs || 0) / 180) * 2.2 : 0;
    const markerY = y - size * 0.84 - markerSize * 0.38 + bob;
    const markerX = x + size * 0.18;
    const radius = markerSize * 0.52;

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = collectible ? 0.92 : 0.96;
    ctx.shadowColor = collectible ? 'rgba(103,232,249,0.82)' : 'rgba(239,68,68,0.86)';
    ctx.shadowBlur = collectible ? 10 : 12;
    ctx.fillStyle = collectible ? 'rgba(13,34,43,0.86)' : 'rgba(54,20,20,0.9)';
    ctx.strokeStyle = collectible ? 'rgba(244,185,66,0.92)' : 'rgba(255,107,53,0.95)';
    ctx.lineWidth = Math.max(1.5, 2 * scale);
    ctx.beginPath();
    ctx.arc(markerX, markerY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.font = `900 ${markerSize}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(13,19,32,0.92)';
    ctx.fillStyle = collectible ? '#67e8f9' : '#fb7185';
    ctx.strokeText(label, markerX, markerY - markerSize * 0.04);
    ctx.fillText(label, markerX, markerY - markerSize * 0.04);
    ctx.restore();
  }

  drawSpriteContourGlow(visualKey, x, y, size, collectible) {
    const sprite = this.assets.get(visualKey);
    const ctx = this.ctx;
    if (!sprite) return;

    const { image, meta } = sprite;
    const anchor = meta.anchor || { x: 0.5, y: 0.85 };
    const aspect = image.width / image.height;
    const width = size * aspect;
    const height = size;
    const drawX = -width * anchor.x;
    const drawY = -height * anchor.y;
    const outer = collectible ? 'rgba(103,232,249,0.95)' : 'rgba(255,107,53,0.98)';
    const inner = collectible ? 'rgba(244,185,66,0.72)' : 'rgba(239,68,68,0.74)';

    ctx.save();
    ctx.translate(x, y);
    ctx.globalCompositeOperation = 'screen';

    ctx.globalAlpha = collectible ? 0.64 : 0.7;
    ctx.shadowColor = outer;
    ctx.shadowBlur = collectible ? 18 : 16;
    ctx.drawImage(image, drawX, drawY, width, height);

    ctx.globalAlpha = collectible ? 0.46 : 0.48;
    ctx.shadowColor = inner;
    ctx.shadowBlur = collectible ? 8 : 7;
    ctx.drawImage(image, drawX, drawY, width, height);

    ctx.globalAlpha = collectible ? 0.18 : 0.22;
    ctx.shadowColor = outer;
    ctx.shadowBlur = 0;
    ctx.drawImage(image, drawX - 1.5, drawY, width, height);
    ctx.drawImage(image, drawX + 1.5, drawY, width, height);
    ctx.drawImage(image, drawX, drawY - 1.5, width, height);
    ctx.drawImage(image, drawX, drawY + 1.5, width, height);

    ctx.restore();
  }

  drawEffects(effects) {
    const ctx = this.ctx;
    for (const effect of effects) {
      const t = Math.min(1, effect.ageMs / effect.durationMs);
      const projected = this.projector.project(effect.x, effect.lane, this.width, this.height);
      const y = projected.y - 64 - t * 34;
      const alpha = 1 - t;
      const pickup = effect.type === 'pickup';
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = pickup ? 'rgba(103,232,249,0.28)' : 'rgba(239,68,68,0.28)';
      ctx.beginPath();
      ctx.arc(projected.x, projected.y - 42, 24 + t * 34, 0, Math.PI * 2);
      ctx.fill();

      if (pickup) {
        this.drawPickupParticles(projected.x, projected.y - 42, t, alpha);
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.font = '900 20px system-ui, -apple-system, Segoe UI, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(13,19,32,0.9)';
      ctx.fillStyle = pickup ? '#67e8f9' : '#fb7185';
      ctx.strokeText(effect.label, projected.x, y);
      ctx.fillText(effect.label, projected.x, y);
      ctx.restore();
    }
  }

  drawPickupParticles(x, y, t, alpha) {
    const ctx = this.ctx;
    const eased = 1 - Math.pow(1 - t, 2);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';

    for (let index = 0; index < PICKUP_PARTICLES.length; index++) {
      const particle = PICKUP_PARTICLES[index];
      const localT = Math.max(0, Math.min(1, (t - particle.delay) / (1 - particle.delay)));
      if (localT <= 0) continue;

      const drift = particle.distance * (0.28 + eased * 0.72) * localT;
      const px = x + Math.cos(particle.angle) * drift;
      const py = y + Math.sin(particle.angle) * drift - localT * 12;
      const particleAlpha = alpha * (1 - localT * 0.72);
      const radius = particle.size * (1 - localT * 0.35);

      ctx.globalAlpha = particleAlpha;
      ctx.shadowColor = index % 2 === 0 ? 'rgba(103,232,249,0.9)' : 'rgba(244,185,66,0.9)';
      ctx.shadowBlur = 8;
      ctx.fillStyle = index % 2 === 0 ? '#67e8f9' : '#f4b942';
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  spriteScale(visualKey) {
    return SPRITE_SCALE_OVERRIDES[visualKey] || 1;
  }

  drawSprite(visualKey, x, y, size, scale, isPlayer, flipX = false, animation = null) {
    const sprite = this.assets.get(visualKey);
    const ctx = this.ctx;
    if (!sprite) {
      this.drawFallback(x, y, size, isPlayer);
      return;
    }

    const { image, meta } = sprite;
    const anchor = meta.anchor || { x: 0.5, y: 0.85 };
    const aspect = image.width / image.height;
    const widthScale = isPlayer ? 0.86 : 1;
    const heightScale = isPlayer ? 1.08 : 1;
    const width = size * aspect * widthScale;
    const height = size * heightScale;
    const drawX = -width * anchor.x;
    const drawY = -height * anchor.y;
    const animScaleX = animation?.scaleX ?? 1;
    const animScaleY = animation?.scaleY ?? 1;
    const animRotation = animation?.rotation ?? 0;
    const shadowScale = animation?.shadowScale ?? 1;
    const shadowAlpha = animation?.shadowAlpha ?? 0.24;

    ctx.save();
    ctx.globalAlpha = shadowAlpha;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(x, y + 8 * scale, width * 0.24 * shadowScale, height * 0.07 / Math.max(0.75, shadowScale), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(x, y);
    if (flipX) ctx.scale(-1, 1);
    ctx.rotate(animRotation);
    ctx.scale(animScaleX, animScaleY);
    ctx.drawImage(image, drawX, drawY, width, height);
    ctx.restore();
  }

  drawFallback(x, y, size, isPlayer) {
    const ctx = this.ctx;
    ctx.fillStyle = isPlayer ? '#f4b942' : '#67e8f9';
    ctx.beginPath();
    ctx.arc(x, y - size * 0.45, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }
}
