import { CanvasRenderer } from './CanvasRenderer.js';

const baseSpriteScale = CanvasRenderer.prototype.spriteScale;

const LANE_PROFILES = [
  { yOffset: -4, shadowScale: 0.82 },
  { yOffset: 8, shadowScale: 1.0 },
  { yOffset: 18, shadowScale: 1.16 },
];

function laneProfile(lane = 1) {
  const clamped = Math.max(0, Math.min(2, Number.isFinite(lane) ? lane : 1));
  const lo = Math.floor(clamped);
  const hi = Math.ceil(clamped);
  const t = clamped - lo;
  const a = LANE_PROFILES[lo] || LANE_PROFILES[1];
  const b = LANE_PROFILES[hi] || a;
  return {
    yOffset: a.yOffset + (b.yOffset - a.yOffset) * t,
    shadowScale: a.shadowScale + (b.shadowScale - a.shadowScale) * t,
  };
}

function drawGroundShadow(ctx, x, y, width, height, alpha, color = 'rgba(0,0,0,0.68)') {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, width, height, -0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

if (!CanvasRenderer.prototype.__perspectiveAlignmentV1Patch) {
  CanvasRenderer.prototype.__perspectiveAlignmentV1Patch = true;

  CanvasRenderer.prototype.spriteScale = function perspectiveSpriteScale(visualKey) {
    const scale = baseSpriteScale.call(this, visualKey);
    if (visualKey?.startsWith('hamster_')) return scale * 0.9;
    if (visualKey?.startsWith('spaniel_')) return scale * 0.92;
    if (['bread', 'cable_coil', 'c2_connector', 'bolt', 'stage_deck'].includes(visualKey)) return scale * 0.92;
    if (['flight_case', 'cable_loop', 'mic_stand', 'mystery_box', 'cart'].includes(visualKey)) return scale * 0.94;
    return scale;
  };

  CanvasRenderer.prototype.drawPlayer = function drawPlayerPerspectiveV1(player, elapsedMs = 0) {
    const visualKey = player.visualKey;
    const projected = this.projector.project(player.x, player.renderLane, this.width, this.height);
    const profile = laneProfile(player.renderLane);
    const yJump = player.jumpOffset * (this.isCompact ? 0.82 : 1);
    const baseSize = this.isWideShort ? 98 : this.isCompact ? 92 : 112;
    const size = baseSize * projected.scale * this.spriteScale(visualKey);
    const animation = this.playerAnimation(player, elapsedMs);
    const x = projected.x + animation.x;
    const y = projected.y + profile.yOffset - yJump + animation.y;
    this.drawSprite(visualKey, x, y, size, projected.scale, true, true, animation);
  };

  CanvasRenderer.prototype.drawObject = function drawObjectPerspectiveV1(object, elapsedMs = 0) {
    const projected = this.projector.project(object.x, object.lane, this.width, this.height);
    const profile = laneProfile(object.lane);
    const collectible = object.kind === 'collectible';
    const baseSize = collectible
      ? (this.isWideShort ? 40 : this.isCompact ? 38 : 48)
      : (this.isWideShort ? 66 : this.isCompact ? 62 : 82);
    const pulse = collectible ? 1 + Math.sin((elapsedMs || 0) / 140) * 0.045 : 1;
    const size = baseSize * projected.scale * this.spriteScale(object.visualKey) * pulse;
    const groundY = projected.y + profile.yOffset + (collectible ? 11 : 15) * projected.scale;
    const x = projected.x;
    const y = groundY;

    this.drawObjectGroundingV1({ ...object, __groundX: x, __groundY: y, __groundScale: projected.scale, __shadowProfile: profile });
    this.drawSpriteContourGlow(object.visualKey, x, y, size, collectible);
    this.drawSprite(object.visualKey, x, y, size, projected.scale, false, false);
    this.drawObjectMarker(object, x, y, size, projected.scale, elapsedMs);
  };

  CanvasRenderer.prototype.drawObjectGroundingV1 = function drawObjectGroundingPerspectiveV1(object) {
    const projected = this.projector.project(object.x, object.lane, this.width, this.height);
    const collectible = object.kind === 'collectible';
    const profile = object.__shadowProfile || laneProfile(object.lane);
    const scale = object.__groundScale || projected.scale;
    const x = object.__groundX ?? projected.x;
    const y = (object.__groundY ?? projected.y) + (collectible ? 9 : 12) * scale;
    const width = (collectible ? 26 : 38) * scale * profile.shadowScale;
    const height = (collectible ? 5 : 7) * scale * profile.shadowScale;

    drawGroundShadow(this.ctx, x, y, width, height, this.lowPerf ? 0.5 : 0.62);

    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = collectible ? 0.18 : 0.14;
    ctx.strokeStyle = collectible ? 'rgba(255,194,71,0.48)' : 'rgba(255,90,78,0.42)';
    ctx.lineWidth = this.lowPerf ? 1 : 1.15;
    ctx.beginPath();
    ctx.moveTo(x - width * 0.82, y - height * 0.15);
    ctx.lineTo(x + width * 0.82, y - height * 0.72);
    ctx.stroke();
    ctx.restore();
  };

  CanvasRenderer.prototype.drawLaneDeckBaseV1 = function drawLaneDeckBasePerspectiveV1(ctx, width, laneYs, low) {
    const top = laneYs[0] - 42;
    const bottom = laneYs[2] + 74;
    const base = ctx.createLinearGradient(0, top, 0, bottom);
    base.addColorStop(0, 'rgba(8,17,30,0.1)');
    base.addColorStop(0.54, 'rgba(8,16,27,0.16)');
    base.addColorStop(1, 'rgba(4,9,16,0.26)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = base;
    ctx.beginPath();
    ctx.moveTo(-90, top + 20);
    ctx.lineTo(width + 96, top);
    ctx.lineTo(width + 86, bottom - 18);
    ctx.lineTo(-110, bottom + 6);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = low ? 0.22 : 0.3;
    ctx.strokeStyle = 'rgba(92,235,255,0.28)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, top + 8);
    ctx.lineTo(width, top - 10);
    ctx.moveTo(0, bottom - 2);
    ctx.lineTo(width, bottom - 20);
    ctx.stroke();
  };

  CanvasRenderer.prototype.drawLaneTrackV1 = function drawLaneTrackPerspectiveV1(ctx, width, centerY, lane, active, low) {
    const height = this.isWideShort ? [20, 26, 34][lane] : [24, 32, 42][lane];
    const top = centerY - height * 0.5;
    const bottom = centerY + height * 0.5;
    const grad = ctx.createLinearGradient(0, top, width, bottom);
    grad.addColorStop(0, active ? 'rgba(20,34,52,0.16)' : 'rgba(13,25,40,0.08)');
    grad.addColorStop(0.52, active ? 'rgba(16,29,45,0.22)' : 'rgba(10,20,34,0.12)');
    grad.addColorStop(1, active ? 'rgba(11,20,32,0.3)' : 'rgba(6,13,23,0.18)');

    ctx.globalAlpha = 1;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-72, top + 12);
    ctx.lineTo(width + 78, top);
    ctx.lineTo(width + 70, bottom - 10);
    ctx.lineTo(-90, bottom + 8);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = active ? 0.58 : 0.34;
    ctx.strokeStyle = active ? 'rgba(255,194,71,0.54)' : 'rgba(92,235,255,0.32)';
    ctx.lineWidth = active ? 1.4 : 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY + height * 0.34);
    ctx.lineTo(width, centerY + height * 0.34 - 18);
    ctx.stroke();

    ctx.globalAlpha = active ? 0.34 : 0.18;
    ctx.strokeStyle = active ? 'rgba(255,194,71,0.42)' : 'rgba(92,235,255,0.2)';
    ctx.beginPath();
    ctx.moveTo(0, centerY - height * 0.34);
    ctx.lineTo(width, centerY - height * 0.34 - 18);
    ctx.stroke();
  };

  CanvasRenderer.prototype.drawLaneGlossV1 = function drawLaneGlossPerspectiveV1(ctx, width, height, low) {
    if (low) return;
    const gloss = ctx.createLinearGradient(0, height * 0.46, 0, height);
    gloss.addColorStop(0, 'rgba(255,255,255,0.006)');
    gloss.addColorStop(0.42, 'rgba(92,235,255,0.01)');
    gloss.addColorStop(1, 'rgba(255,194,71,0.008)');
    ctx.fillStyle = gloss;
    ctx.fillRect(0, height * 0.46, width, height * 0.54);
  };
}
