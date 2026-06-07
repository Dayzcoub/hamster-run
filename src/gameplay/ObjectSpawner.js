import { objectCatalog } from '../data/objects.js';

const DEFAULT_SPAWN_TUNING = {
  obstacleBaseChance: 0.32,
  obstacleProgressChance: 0.12,
  minDelayStart: 1180,
  minDelayProgressDrop: 340,
  maxDelayStart: 1560,
  maxDelayProgressDrop: 420,
};

const FINAL_PHASE_SECONDS = 20;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function remainingSeconds(level, elapsedMs) {
  const durationMs = (level.duration || 0) * 1000;
  return Math.ceil(Math.max(0, durationMs - elapsedMs) / 1000);
}

function resourceCollected(stats, resource) {
  return resource === 'bread' ? stats?.bread || 0 : stats?.resources?.[resource] || 0;
}

function packageCollected(level, stats) {
  const targets = level.targetResources || {};
  return Object.entries(targets).reduce((sum, [resource, target]) => {
    const collected = resourceCollected(stats, resource);
    return sum + Math.min(target, collected);
  }, 0);
}

function packageTargetTotal(level) {
  return Object.values(level.targetResources || {}).reduce((sum, value) => sum + value, 0);
}

function isPackageComplete(level, stats) {
  const targetTotal = packageTargetTotal(level);
  return targetTotal > 0 && packageCollected(level, stats) >= targetTotal;
}

function weightedPick(ids = [], weights = {}) {
  if (!ids.length) return null;
  const totalWeight = ids.reduce((sum, id) => sum + Math.max(0, Number(weights[id]) || 1), 0);
  if (totalWeight <= 0) return ids[Math.floor(Math.random() * ids.length)];

  let cursor = Math.random() * totalWeight;
  for (const id of ids) {
    cursor -= Math.max(0, Number(weights[id]) || 1);
    if (cursor <= 0) return id;
  }
  return ids[ids.length - 1];
}

export class ObjectSpawner {
  constructor(level) {
    this.level = level;
    this.tuning = { ...DEFAULT_SPAWN_TUNING, ...(level.spawnTuning || {}) };
    this.timerMs = 500;
    this.lastObstacleLane = null;
  }

  update(deltaMs, elapsedMs, stats = null) {
    this.timerMs -= deltaMs;
    if (this.timerMs > 0) return null;

    const progress = elapsedMs / (this.level.duration * 1000);
    const finalPhase = remainingSeconds(this.level, elapsedMs) <= FINAL_PHASE_SECONDS;
    const packageComplete = isPackageComplete(this.level, stats);
    const minDelay = this.tuning.minDelayStart - progress * this.tuning.minDelayProgressDrop;
    const maxDelay = this.tuning.maxDelayStart - progress * this.tuning.maxDelayProgressDrop;
    const finalPhaseDelayFactor = finalPhase ? 0.88 : 1;
    const nextDelay = minDelay + Math.random() * Math.max(220, maxDelay - minDelay);
    this.timerMs = Math.max(520, nextDelay * finalPhaseDelayFactor);

    let obstacleChance = this.tuning.obstacleBaseChance + progress * this.tuning.obstacleProgressChance;
    if (finalPhase) {
      obstacleChance += packageComplete ? 0.04 : -0.03;
      obstacleChance = clamp(obstacleChance, 0.22, 0.54);
    }

    const isObstacle = Math.random() < obstacleChance;
    const id = isObstacle
      ? this.pickObstacleId(finalPhase)
      : weightedPick(this.pickCollectibleSource(progress, stats, finalPhase, packageComplete));
    const catalogItem = objectCatalog[id];
    const lane = this.pickLane(isObstacle, catalogItem);
    const blockedLanes = this.resolveBlockedLanes(catalogItem, lane);

    return {
      id: `${id}_${Math.random().toString(36).slice(2)}`,
      objectId: id,
      kind: catalogItem.type,
      visualKey: catalogItem.visualKey,
      resource: catalogItem.resource,
      value: catalogItem.value || 1,
      dodge: catalogItem.dodge,
      clearanceHeight: catalogItem.clearanceHeight,
      lane,
      laneSpan: catalogItem.laneSpan || 1,
      blockedLanes,
      x: 1180,
      collected: false,
    };
  }

  pickObstacleId(finalPhase = false) {
    const weights = finalPhase
      ? { ...(this.level.obstacleWeights || {}), ...(this.level.finalObstacleWeights || {}) }
      : this.level.obstacleWeights || {};
    return weightedPick(this.level.obstacles, weights);
  }

  pickCollectibleSource(progress, stats, finalPhase = false, packageComplete = false) {
    const breadIds = this.level.collectibles.filter((id) => objectCatalog[id]?.resource === 'bread');
    if (finalPhase && packageComplete && breadIds.length) {
      return Math.random() < 0.72 ? breadIds : this.level.collectibles;
    }

    if (!stats || progress < 0.48) return this.level.collectibles;

    const missingIds = this.level.collectibles.filter((id) => {
      const item = objectCatalog[id];
      const resource = item?.resource;
      if (!resource) return false;
      const target = this.level.targetResources?.[resource] || 0;
      if (target <= 0) return false;
      return resourceCollected(stats, resource) < target;
    });

    if (!missingIds.length) return this.level.collectibles;
    const biasChance = finalPhase ? 0.9 : progress > 0.78 ? 0.82 : progress > 0.62 ? 0.66 : 0.48;
    return Math.random() < biasChance ? missingIds : this.level.collectibles;
  }

  pickLane(isObstacle, catalogItem = {}) {
    if (catalogItem.blockedLanes?.length) return catalogItem.blockedLanes[0];

    let lane = Math.floor(Math.random() * 3);
    if (isObstacle && lane === this.lastObstacleLane) lane = (lane + 1 + Math.floor(Math.random() * 2)) % 3;
    if (isObstacle) this.lastObstacleLane = lane;
    return lane;
  }

  resolveBlockedLanes(catalogItem = {}, lane) {
    if (catalogItem.blockedLanes?.length) return [...catalogItem.blockedLanes];
    const span = Math.max(1, catalogItem.laneSpan || 1);
    return Array.from({ length: span }, (_, index) => Math.min(2, lane + index));
  }
}
