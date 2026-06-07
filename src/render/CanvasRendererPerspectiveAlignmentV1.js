import { CanvasRenderer } from './CanvasRenderer.js';

const baseRender = CanvasRenderer.prototype.render;
const baseSpriteScale = CanvasRenderer.prototype.spriteScale;
const baseDrawEffects = CanvasRenderer.prototype.drawEffects;

const PLAYER_FLOOR_DROP = -8;
const OBJECT_FLOOR_DROP = 5;

const LANE_PROFILES = [
  { yOffset: -1, shadowScale: 0.82 },
  { yOffset: 6, shadowScale: 1.0 },
  { yOffset: 12, shadowScale: 1.16 },
];

// Manual lane heights: [top lane, middle lane, bottom lane].
// Larger value means lower on screen, smaller value means higher on screen.
const LANE_Y_FACTORS = {
  wideShort: [0.64, 0.75, 0.88],
  compact: [0.65, 0.76, 0.88],
  default: [0.66, 0.76, 0.86],
};

const DEFAULT_VISUAL_TUNING = {
  laneTop: 0.64,
  laneMid: 0.75,
  laneBottom: 0.88,
  playerY: PLAYER_FLOOR_DROP,
  playerScale: 1,
  objectY: 0,
  objectScale: 1,
};

const DEFAULT_TRUSS_TUNING = {
  scale: 1,
  lift: 0,
  rotation: 0,
};

const DEBUG_OBJECT_KEYS = [
  'bread',
  'stage_deck',
  'cable_coil',
  'c2_connector',
  'flight_case',
  'cart',
  'mic_stand',
  'mystery_box',
  'bolt',
  'cable_loop',
  'truss_section_left',
  'truss_section_right',
];

function visualTuning() {
  return {
    ...DEFAULT_VISUAL_TUNING,
    ...(window.__HAMSTER_VISUAL_TUNING || {}),
    ...(window.__HAMSTER_DEBUG_TUNING || {}),
  };
}

function trussTuning() {
  const tuning = window.__HAMSTER_TRUSS_TUNING || {};
  return {
    scale: Number.isFinite(Number(tuning.scale)) ? Number(tuning.scale) : DEFAULT_TRUSS_TUNING.scale,
    lift: Number.isFinite(Number(tuning.lift)) ? Number(tuning.lift) : DEFAULT_TRUSS_TUNING.lift,
    rotation: Number.isFinite(Number(tuning.rotation)) ? Number(tuning.rotation) : DEFAULT_TRUSS_TUNING.rotation,
  };
}

function isTrussSection(visualKey) {
  return visualKey === 'truss_section_left' || visualKey === 'truss_section_right';
}

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

  CanvasRenderer.prototype.render = function renderWithDebugTuningStand(levelState = {}) {
    if (window.__HAMSTER_DEBUG_MODE) {
      this.renderDebugTuningStand(levelState);
      return;
    }
    baseRender.call(this, levelState);
  };

  CanvasRenderer.prototype.getLaneYFactors = function getLaneYFactors() {
    const tuning = visualTuning();
    if (Number.isFinite(tuning.laneTop) && Number.isFinite(tuning.laneMid) && Number.isFinite(tuning.laneBottom)) {
      return [tuning.laneTop, tuning.laneMid, tuning.laneBottom];
    }
    if (this.isWideShort) return LANE_Y_FACTORS.wideShort;
    if (this.isCompact) return LANE_Y_FACTORS.compact;
    return LANE_Y_FACTORS.default;
  };

  CanvasRenderer.prototype.getLaneYFactor = function getLaneYFactor(lane = 1) {
    const factors = this.getLaneYFactors();
    const clamped = Math.max(0, Math.min(2, Number.isFinite(lane) ? lane : 1));
    const lo = Math.floor(clamped);
    const hi = Math.ceil(clamped);
    const t = clamped - lo;
    return factors[lo] + (factors[hi] - factors[lo]) * t;
  };

  CanvasRenderer.prototype.remapLaneToPlayfieldY = function remapLaneToPlayfieldY(lane = 1) {
    return this.height * this.getLaneYFactor(lane);
  };

  CanvasRenderer.prototype.getPlayfieldBottomY = function getPlayfieldBottomY() {
    return this.remapLaneToPlayfieldY(2);
  };

  CanvasRenderer.prototype.getPlayfieldTopY = function getPlayfieldTopY() {
    return this.remapLaneToPlayfieldY(0);
  };

  CanvasRenderer.prototype.remapProjectedYToPlayfield = function remapProjectedYToPlayfield(projectedY) {
    const originalTop = this.projector.laneY(0, this.height);
    const originalBottom = this.projector.laneY(2, this.height);
    const t = Math.max(0, Math.min(1, (projectedY - originalTop) / Math.max(1, originalBottom - originalTop)));
    return this.remapLaneToPlayfieldY(t * 2);
  };

  CanvasRenderer.prototype.spriteScale = function perspectiveSpriteScale(visualKey) {
    const tuning = visualTuning();
    const trussOnly = trussTuning();
    const scale = baseSpriteScale.call(this, visualKey);
    if (visualKey?.startsWith('hamster_')) return scale * 0.9 * (Number(tuning.playerScale) || 1);
    if (visualKey?.startsWith('spaniel_')) return scale * 0.92;
    if (isTrussSection(visualKey)) return scale * 1.28 * (Number(tuning.objectScale) || 1) * trussOnly.scale;
    if (['bread', 'cable_coil', 'c2_connector', 'bolt', 'stage_deck'].includes(visualKey)) return scale * 0.92 * (Number(tuning.objectScale) || 1);
    if (['flight_case', 'cable_loop', 'mic_stand', 'mystery_box', 'cart'].includes(visualKey)) return scale * 0.94 * (Number(tuning.objectScale) || 1);
    return scale;
  };

  CanvasRenderer.prototype.drawPlayer = function drawPlayerPerspectiveV1(player, elapsedMs = 0) {
    const tuning = visualTuning();
    const visualKey = player.visualKey;
    const projected = this.projector.project(player.x, player.renderLane, this.width, this.height);
    const profile = laneProfile(player.renderLane);
    const baseY = this.remapProjectedYToPlayfield(projected.y);
    const yJump = player.jumpOffset * (this.isCompact ? 0.72 : 0.82);
    const baseSize = this.isWideShort ? 98 : this.isCompact ? 92 : 112;
    const size = baseSize * projected.scale * this.spriteScale(visualKey);
    const animation = this.playerAnimation(player, elapsedMs);
    const x = projected.x + animation.x;
    const y = baseY + profile.yOffset + (Number(tuning.playerY) || 0) - yJump + animation.y;
    this.drawSprite(visualKey, x, y, size, projected.scale, true, true, animation);
  };

  CanvasRenderer.prototype.drawObject = function drawObjectPerspectiveV1(object, elapsedMs = 0) {
    const tuning = visualTuning();
    const trussOnly = trussTuning();
    const projected = this.projector.project(object.x, object.lane, this.width, this.height);
    const profile = laneProfile(object.lane);
    const collectible = object.kind === 'collectible';
    const truss = isTrussSection(object.visualKey);
    const baseSize = truss
      ? (this.isWideShort ? 68 : this.isCompact ? 62 : 78)
      : collectible
        ? (this.isWideShort ? 40 : this.isCompact ? 38 : 48)
        : (this.isWideShort ? 66 : this.isCompact ? 62 : 82);
    const pulse = collectible ? 1 + Math.sin((elapsedMs || 0) / 140) * 0.04 : 1;
    const size = baseSize * projected.scale * this.spriteScale(object.visualKey) * pulse;
    const groundOffset = truss ? 24 : collectible ? 7 : 11;
    const yOffset = truss ? 28 - trussOnly.lift : 0;
    const groundY = this.remapProjectedYToPlayfield(projected.y) + profile.yOffset + OBJECT_FLOOR_DROP + (Number(tuning.objectY) || 0) + groundOffset * projected.scale;
    const x = projected.x;
    const y = Math.min(groundY + yOffset, this.getPlayfieldBottomY() - 8 * projected.scale);
    const spriteAnimation = truss && trussOnly.rotation
      ? { rotation: trussOnly.rotation * Math.PI / 180, shadowScale: 0.9, shadowAlpha: 0 }
      : null;

    this.drawObjectGroundingV1({ ...object, __groundX: x, __groundY: y, __groundScale: projected.scale, __shadowProfile: profile });
    this.drawSpriteContourGlow(object.visualKey, x, y, size, collectible);
    this.drawSprite(object.visualKey, x, y, size, projected.scale, false, false, spriteAnimation);
    this.drawObjectMarker(object, x, y, size, projected.scale, elapsedMs);
  };

  CanvasRenderer.prototype.drawObjectGroundingV1 = function drawObjectGroundingPerspectiveV1(object) {
    const projected = this.projector.project(object.x, object.lane, this.width, this.height);
    const collectible = object.kind === 'collectible';
    const truss = isTrussSection(object.visualKey);
    const trussOnly = trussTuning();
    const profile = object.__shadowProfile || laneProfile(object.lane);
    const scale = object.__groundScale || projected.scale;
    const x = object.__groundX ?? projected.x;
    const y = Math.min((object.__groundY ?? this.remapProjectedYToPlayfield(projected.y)) + (collectible ? 8 : truss ? 7 : 11) * scale, this.getPlayfieldBottomY() - 2);
    const width = (truss ? 92 * trussOnly.scale : collectible ? 26 : 38) * scale * profile.shadowScale;
    const height = (truss ? 10 * Math.max(0.72, trussOnly.scale) : collectible ? 5 : 7) * scale * profile.shadowScale;

    drawGroundShadow(this.ctx, x, y, width, height, this.lowPerf ? 0.5 : truss ? 0.68 : 0.62);

    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = collectible ? 0.16 : truss ? 0.08 : 0.12;
    ctx.strokeStyle = collectible ? 'rgba(255,194,71,0.42)' : truss ? 'rgba(92,235,255,0.2)' : 'rgba(255,90,78,0.36)';
    ctx.lineWidth = this.lowPerf ? 1 : 1.05;
    ctx.beginPath();
    ctx.moveTo(x - width * 0.82, y - height * 0.15);
    ctx.lineTo(x + width * 0.82, y - height * 0.72);
    ctx.stroke();
    ctx.restore();
  };

  CanvasRenderer.prototype.drawLanes = function drawLanesPerspectivePlayfieldV1(levelState = {}) {
    const ctx = this.ctx;
    const w = this.width;
    const distance = levelState.distance || 0;
    const activeLane = levelState.player?.renderLane ?? 1;
    const laneYs = [0, 1, 2].map((lane) => this.remapLaneToPlayfieldY(lane));
    const low = Boolean(this.lowPerf);

    ctx.save();
    this.drawLaneDeckBaseV1(ctx, w, laneYs, low);

    for (let lane = 0; lane < 3; lane += 1) {
      const active = Math.abs(activeLane - lane) < 0.55;
      this.drawLaneTrackV1(ctx, w, laneYs[lane], lane, active, low);
    }

    this.drawLaneMotionMarksV1(ctx, w, laneYs, distance, low);
    this.drawLaneGlossV1(ctx, w, this.height, low);
    ctx.restore();
  };

  CanvasRenderer.prototype.drawLaneDeckBaseV1 = function drawLaneDeckBasePerspectiveV1(ctx, width, laneYs, low) {
    const top = laneYs[0] - 24;
    const bottom = this.getPlayfieldBottomY();
    const base = ctx.createLinearGradient(0, top, 0, bottom);
    base.addColorStop(0, 'rgba(8,17,30,0.025)');
    base.addColorStop(0.54, 'rgba(8,16,27,0.055)');
    base.addColorStop(1, 'rgba(4,9,16,0.16)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = base;
    ctx.beginPath();
    ctx.moveTo(-90, top + 14);
    ctx.lineTo(width + 96, top);
    ctx.lineTo(width + 86, bottom - 13);
    ctx.lineTo(-110, bottom + 4);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = low ? 0.16 : 0.22;
    ctx.strokeStyle = 'rgba(92,235,255,0.2)';
    ctx.lineWidth = 0.95;
    ctx.beginPath();
    ctx.moveTo(0, bottom - 3);
    ctx.lineTo(width, bottom - 20);
    ctx.stroke();
  };

  CanvasRenderer.prototype.drawLaneTrackV1 = function drawLaneTrackPerspectiveV1(ctx, width, centerY, lane, active, low) {
    const height = this.isWideShort ? [10, 16, 24][lane] : [14, 22, 32][lane];
    const top = centerY - height * 0.5;
    const bottom = centerY + height * 0.5;
    const grad = ctx.createLinearGradient(0, top, width, bottom);
    grad.addColorStop(0, active ? 'rgba(20,34,52,0.035)' : 'rgba(13,25,40,0.012)');
    grad.addColorStop(0.52, active ? 'rgba(16,29,45,0.06)' : 'rgba(10,20,34,0.024)');
    grad.addColorStop(1, active ? 'rgba(11,20,32,0.1)' : 'rgba(6,13,23,0.048)');

    ctx.globalAlpha = 1;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-72, top + 8);
    ctx.lineTo(width + 78, top);
    ctx.lineTo(width + 70, bottom - 7);
    ctx.lineTo(-90, bottom + 5);
    ctx.closePath();
    ctx.fill();

    ctx.globalAlpha = active ? 0.28 : 0.12;
    ctx.strokeStyle = active ? 'rgba(255,194,71,0.28)' : 'rgba(92,235,255,0.1)';
    ctx.lineWidth = active ? 1 : 0.8;
    ctx.beginPath();
    ctx.moveTo(0, centerY + height * 0.42);
    ctx.lineTo(width, centerY + height * 0.42 - 15);
    ctx.stroke();
  };

  CanvasRenderer.prototype.drawLaneMotionMarksV1 = function drawLaneMotionMarksPlayfieldV1(ctx, width, laneYs, distance, low) {
    ctx.globalAlpha = low ? 0.035 : 0.05;
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 0.8;
    const offset = (distance * 0.16) % 180;
    for (const y of laneYs) {
      for (let x = -offset - 180; x < width + 220; x += 180) {
        ctx.beginPath();
        ctx.moveTo(x, y + 18);
        ctx.lineTo(x + 58, y + 12);
        ctx.stroke();
      }
    }
  };

  CanvasRenderer.prototype.renderDebugTuningStand = function renderDebugTuningStand(levelState = {}) {
    this.resize();
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const standState = {
      ...levelState,
      distance: 0,
      screenShake: null,
      player: { ...(levelState.player || {}), renderLane: 1 },
      objects: [],
      effects: [],
    };

    this.drawBackground(standState);
    this.drawLanes(standState);

    if (window.__HAMSTER_TRUSS_DEBUG_MODE) {
      const w = this.width;
      const elapsedMs = 0;
      const samples = [
        { visualKey: 'truss_section_left', lane: 0, x: w * 0.42 },
        { visualKey: 'truss_section_right', lane: 1, x: w * 0.62 },
      ];

      for (const sample of samples) {
        this.drawObject({
          visualKey: sample.visualKey,
          kind: 'obstacle',
          x: sample.x,
          lane: sample.lane,
        }, elapsedMs);
      }

      this.drawDebugTuningLabels('TRUSS DEBUG');
      this.drawBottomFieldMask();
      return;
    }

    const w = this.width;
    const elapsedMs = 0;
    const hamsterKey = levelState.player?.visualKey || 'hamster_run_01';
    const spanielTemplate = levelState.companion || { visualKey: 'spaniel_run' };

    for (let lane = 0; lane < 3; lane += 1) {
      if (typeof this.drawSpanielCompanion === 'function') {
        this.drawSpanielCompanion({
          ...spanielTemplate,
          visualKey: spanielTemplate.visualKey || 'spaniel_run',
          x: w * 0.1,
          renderLane: lane,
          mode: 'debug_idle',
        }, elapsedMs, { companionRescueAvailable: false });
      }

      this.drawPlayer({
        visualKey: hamsterKey,
        x: w * 0.2,
        renderLane: lane,
        jumpOffset: 0,
      }, elapsedMs);

      DEBUG_OBJECT_KEYS.forEach((visualKey, index) => {
        const objectKind = ['bread', 'stage_deck', 'cable_coil', 'c2_connector', 'bolt'].includes(visualKey) ? 'collectible' : 'obstacle';
        this.drawObject({
          visualKey,
          kind: objectKind,
          x: w * (0.28 + index * 0.055),
          lane,
        }, elapsedMs);
      });
    }

    this.drawDebugTuningLabels();
    this.drawBottomFieldMask();
  };

  CanvasRenderer.prototype.drawDebugTuningLabels = function drawDebugTuningLabels(labelPrefix = 'LANE') {
    const ctx = this.ctx;
    const w = this.width;
    ctx.save();
    ctx.font = `900 ${this.isCompact ? 11 : 13}px system-ui, -apple-system, Segoe UI, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let lane = 0; lane < 3; lane += 1) {
      const y = this.remapLaneToPlayfieldY(lane);
      ctx.globalAlpha = 0.84;
      ctx.fillStyle = 'rgba(7,14,24,0.7)';
      this.roundRect(ctx, 12, y - 13, labelPrefix === 'LANE' ? 72 : 118, 24, 12);
      ctx.fill();
      ctx.fillStyle = '#92ebff';
      ctx.fillText(`${labelPrefix} ${lane}`, 24, y);
      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = lane === 1 ? 'rgba(255,194,71,0.72)' : 'rgba(92,235,255,0.5)';
      ctx.lineWidth = lane === 1 ? 1.5 : 1;
      ctx.beginPath();
      ctx.moveTo(labelPrefix === 'LANE' ? 92 : 140, y);
      ctx.lineTo(w - 16, y - 14);
      ctx.stroke();
    }
    ctx.restore();
  };

  CanvasRenderer.prototype.drawLaneGlossV1 = function drawLaneGlossPerspectiveV1(ctx, width, height, low) {
    if (low) return;
    const bottom = this.getPlayfieldBottomY();
    const gloss = ctx.createLinearGradient(0, this.getPlayfieldTopY(), 0, bottom);
    gloss.addColorStop(0, 'rgba(255,255,255,0.001)');
    gloss.addColorStop(0.5, 'rgba(92,235,255,0.004)');
    gloss.addColorStop(1, 'rgba(255,194,71,0.01)');
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
    grad.addColorStop(0, 'rgba(7,18,30,0.02)');
    grad.addColorStop(0.18, 'rgba(4,12,22,0.36)');
    grad.addColorStop(1, 'rgba(3,8,16,0.9)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, y - 4, w, h - y + 4);

    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.38;
    ctx.strokeStyle = 'rgba(92,235,255,0.22)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y - 16);
    ctx.stroke();

    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = 'rgba(255,194,71,0.14)';
    ctx.beginPath();
    ctx.moveTo(0, y + 3);
    ctx.lineTo(w, y - 13);
    ctx.stroke();
    ctx.restore();
  };

  CanvasRenderer.prototype.drawEffects = function drawEffectsWithBottomFieldMask(effects = []) {
    baseDrawEffects.call(this, effects);
    this.drawBottomFieldMask();
  };
}
