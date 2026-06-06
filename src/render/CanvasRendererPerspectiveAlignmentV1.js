import { CanvasRenderer } from './CanvasRenderer.js';

const baseSpriteScale = CanvasRenderer.prototype.spriteScale;
const baseDrawEffects = CanvasRenderer.prototype.drawEffects;

const LANE_PROFILES = [
  { yOffset: -3, shadowScale: 0.82 },
  { yOffset: 7, shadowScale: 1.0 },
  { yOffset: 15, shadowScale: 1.16 },
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

  CanvasRenderer.prototype.getPlayfieldBottomY = function getPlayfieldBottomY() {
    return this.height * (this.isWideShort ? 0.735 : this.isCompact ? 0.745 : 0.76);
  };

  CanvasRenderer.prototype.getPlayfieldTopY = function getPlayfieldTopY() {
    const bottom = this.getPlayfieldBottomY();
    return bottom - this.height * (this.isWideShort ? 0.34 : this.isCompact ? 0.32 : 0.33);
  };

  CanvasRenderer.prototype.remapProjectedYToPlayfield = function remapProjectedYToPlayfield(projectedY) {
    const originalTop = this.projector.laneY(0, this.height);
    const originalBottom = this.projector.laneY(2, this.height);
    const t = Math.max(0, Math.min(1, (projectedY - originalTop) / Math.max(1, originalBottom - originalTop)));
    return this.getPlayfieldTopY() + t * (this.getPlayfieldBottomY() - this.getPlayfieldTopY());
  };

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
    const baseY = this.remapProjectedYToPlayfield(projected.y);
    const yJump = player.jumpOffset * (this.isCompact ? 0.82 : 1);
    const baseSize = this.isWideShort ? 98 : this.isCompact ? 92 : 112;
    const size = baseSize * projected.scale * this.spriteScale(visualKey);
    const animation = this.playerAnimation(player, elapsedMs);
    const x = projected.x + animation.x;
    const y = baseY + profile.yOffset - yJump + animation.y;
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
    const groundY = this.remapProjectedYToPlayfield(projected.y) + profile.yOffset + (collectible ? 9 : 13) * projected.scale;
    const x = projected.x;
    const y = Math.min(groundY, this.getPlayfieldBottomY() - 8 * projected.scale);

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
    const y = Math.min((object.__groundY ?? this.remapProjectedYToPlayfield(projected.y)) + (collectible ? 9 : 12) * scale, this.getPlayfieldBottomY() - 2);
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

  CanvasRenderer.prototype.drawLanes = function drawLanesPerspectivePlayfieldV1(levelState = {}) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const distance = levelState.distance || 0;
    const activeLane = levelState.player?.renderLane ?? 1;
    const laneYs = [0, 1, 2].map((lane) => this.remapProjectedYToPlayfield(this.projector.laneY(lane, h)));
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

  CanvasRenderer.prototype.drawLaneDeckBaseV1 = function drawLaneDeckBasePerspectiveV1(ctx, width, laneYs, low) {
    const top = laneYs[0] - 34;
    const bottom = this.getPlayfieldBottomY();
    const base = ctx.createLinearGradient(0, top, 0, bottom);
    base.addColorStop(0, 'rgba(8,17,30,0.06)');
    base.addColorStop(0.54, 'rgba(8,16,27,0.12)');
    base.addColorStop(1, 'rgba(4,9,16,0.24)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = base;
    ctx.beginPath();
    ctx.moveTo(-90, top + 18);
    ctx.lineTo(width + 96, top);
    ctx.lineTo(width + 86, bottom - 14);
    ctx.lineTo(-110, bottom + 4);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = low ? 0.28 : 0.4;
    ctx.strokeStyle = 'rgba(92,235,255,0.36)';
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(0, bottom - 3);
    ctx.lineTo(width, bottom - 22);
    ctx.stroke();
  };

  CanvasRenderer.prototype.drawLaneTrackV1 = function drawLaneTrackPerspectiveV1(ctx, width, centerY, lane, active, low) {
    const height = this.isWideShort ? [14, 20, 28][lane] : [18, 26, 36][lane];
    const top = centerY - height * 0.5;
    const bottom = centerY + height * 0.5;
    const grad = ctx.createLinearGradient(0, top, width, bottom);
    grad.addColorStop(0, active ? 'rgba(20,34,52,0.1)' : 'rgba(13,25,40,0.045)');
    grad.addColorStop(0.52, active ? 'rgba(16,29,45,0.16)' : 'rgba(10,20,34,0.075)');
    grad.addColorStop(1, active ? 'rgba(11,20,32,0.24)' : 'rgba(6,13,23,0.13)');

    ctx.globalAlpha = 1;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-72, top + 10);
    ctx.lineTo(width + 78, top);
    ctx.lineTo(width + 70, bottom - 8);
    ctx.lineTo(-90, bottom + 6);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = active ? 0.62 : 0.34;
    ctx.strokeStyle = active ? 'rgba(255,194,71,0.58)' : 'rgba(92,235,255,0.3)';
    ctx.lineWidth = active ? 1.4 : 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY + height * 0.38);
    ctx.lineTo(width, centerY + height * 0.38 - 17);
    ctx.stroke();

    ctx.globalAlpha = active ? 0.3 : 0.16;
    ctx.strokeStyle = active ? 'rgba(255,194,71,0.35)' : 'rgba(92,235,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(0, centerY - height * 0.38);
    ctx.lineTo(width, centerY - height * 0.38 - 17);
    ctx.stroke();
  };

  CanvasRenderer.prototype.drawLaneGlossV1 = function drawLaneGlossPerspectiveV1(ctx, width, height, low) {
    if (low) return;
    const bottom = this.getPlayfieldBottomY();
    const gloss = ctx.createLinearGradient(0, this.getPlayfieldTopY(), 0, bottom);
    gloss.addColorStop(0, 'rgba(255,255,255,0.004)');
    gloss.addColorStop(0.5, 'rgba(92,235,255,0.008)');
    gloss.addColorStop(1, 'rgba(255,194,71,0.018)');
    ctx.fillStyle = gloss;
    ctx.fillRect(0, this.getPlayfieldTopY(), width, bottom - this.getPlayfieldTopY());
  };

  CanvasRenderer.prototype.drawBottomFieldMask = function drawBottomFieldMask() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const y = this.getPlayfieldBottomY();

    ctx.save();
    const grad = ctx.createLinearGradient(0, y - 4, 0, h);
    grad.addColorStop(0, 'rgba(7,18,30,0.04)');
    grad.addColorStop(0.18, 'rgba(4,12,22,0.42)');
    grad.addColorStop(1, 'rgba(3,8,16,0.92)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y - 4, w, h - y + 4);

    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.44;
    ctx.strokeStyle = 'rgba(92,235,255,0.26)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y - 18);
    ctx.stroke();

    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = 'rgba(255,194,71,0.18)';
    ctx.beginPath();
    ctx.moveTo(0, y + 3);
    ctx.lineTo(w, y - 15);
    ctx.stroke();
    ctx.restore();
  };

  CanvasRenderer.prototype.drawEffects = function drawEffectsWithBottomFieldMask(effects = []) {
    baseDrawEffects.call(this, effects);
    this.drawBottomFieldMask();
  };
}
