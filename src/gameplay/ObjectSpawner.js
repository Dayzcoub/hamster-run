import { objectCatalog } from '../data/objects.js';

const DEFAULT_SPAWN_TUNING = {
  obstacleBaseChance: 0.32,
  obstacleProgressChance: 0.12,
  minDelayStart: 1180,
  minDelayProgressDrop: 340,
  maxDelayStart: 1560,
  maxDelayProgressDrop: 420,
};

export class ObjectSpawner {
  constructor(level) {
    this.level = level;
    this.tuning = { ...DEFAULT_SPAWN_TUNING, ...(level.spawnTuning || {}) };
    this.timerMs = 500;
    this.lastObstacleLane = null;
  }

  update(deltaMs, elapsedMs) {
    this.timerMs -= deltaMs;
    if (this.timerMs > 0) return null;

    const progress = elapsedMs / (this.level.duration * 1000);
    const minDelay = this.tuning.minDelayStart - progress * this.tuning.minDelayProgressDrop;
    const maxDelay = this.tuning.maxDelayStart - progress * this.tuning.maxDelayProgressDrop;
    this.timerMs = minDelay + Math.random() * Math.max(220, maxDelay - minDelay);

    const obstacleChance = this.tuning.obstacleBaseChance + progress * this.tuning.obstacleProgressChance;
    const isObstacle = Math.random() < obstacleChance;
    const source = isObstacle ? this.level.obstacles : this.level.collectibles;
    const id = source[Math.floor(Math.random() * source.length)];
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
