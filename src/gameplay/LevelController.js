import { Player } from './Player.js';
import { ObjectSpawner } from './ObjectSpawner.js';
import { CollisionSystem } from './CollisionSystem.js';

const EXTRA_PACKAGE_RESOURCE_POINTS = 25;
const COMPANION_BREAD_OFFSET_X = -58;
const COMPANION_BREAD_RADIUS_X = 76;
const COMPANION_BREAD_MISSED_X = 18;
const COMPANION_BREAD_MAX_LANE_DISTANCE = 1;

export class LevelController {
  constructor(level) {
    this.level = level;
    this.player = new Player();
    this.spawner = new ObjectSpawner(level);
    this.collision = new CollisionSystem();
    this.objects = [];
    this.elapsedMs = 0;
    this.distance = 0;
    this.finished = false;
    this.stats = new LevelStats(level);
    this.events = [];
  }

  update(deltaMs, actions) {
    if (this.finished) return null;

    this.events = [];
    this.elapsedMs += deltaMs;
    this.distance += (this.level.speed * deltaMs) / 1000;
    this.player.update(deltaMs, actions);

    const spawned = this.spawner.update(deltaMs, this.elapsedMs, this.stats);
    if (Array.isArray(spawned)) this.objects.push(...spawned);
    else if (spawned) this.objects.push(spawned);

    const speed = this.level.speed * (1 + this.elapsedMs / (this.level.duration * 1000) * 0.18);
    for (const object of this.objects) object.x -= (speed * deltaMs) / 1000;
    this.events.push(...this.collectCompanionBread());
    this.events.push(...this.collision.check(this.player, this.objects, this.stats));
    this.objects = this.objects.filter((object) => object.x > -180 && !object.collected);

    if (this.player.mistakesLeft <= 0 || this.elapsedMs >= this.level.duration * 1000) {
      return this.finish();
    }

    return null;
  }

  collectCompanionBread() {
    if (!this.stats.companionRescueAvailable) return [];

    const events = [];
    const companionX = this.player.x + COMPANION_BREAD_OFFSET_X;
    const playerLane = Math.round(this.player.lane);

    for (const object of this.objects) {
      if (object.collected) continue;
      if (object.kind !== 'collectible') continue;
      if (object.resource !== 'bread') continue;

      const objectLane = Math.round(object.lane);
      const laneDistance = Math.abs(objectLane - playerLane);
      if (laneDistance <= 0 || laneDistance > COMPANION_BREAD_MAX_LANE_DISTANCE) continue;

      const hasPassedHamster = object.x < this.player.x - COMPANION_BREAD_MISSED_X;
      if (!hasPassedHamster) continue;
      if (Math.abs(object.x - companionX) > COMPANION_BREAD_RADIUS_X) continue;

      object.collected = true;
      this.stats.collect('bread', object.value || 1);
      events.push({
        type: 'companion_bread_pickup',
        x: object.x,
        lane: object.lane,
        companionLane: objectLane,
        objectId: object.objectId,
        resource: 'bread',
        value: object.value || 1,
        visualKey: object.visualKey,
      });
    }

    return events;
  }

  finish() {
    this.finished = true;
    this.player.finish();
    return this.stats.result(this.player, this.elapsedMs);
  }

  snapshot() {
    return {
      level: this.level,
      player: this.player,
      objects: this.objects,
      events: this.events,
      elapsedMs: this.elapsedMs,
      distance: this.distance,
      progress: Math.min(1, this.elapsedMs / (this.level.duration * 1000)),
      stats: this.stats,
      activeEvent: this.spawner.currentEvent?.() || null,
    };
  }
}

class LevelStats {
  constructor(level) {
    this.level = level;
    this.bread = 0;
    this.resources = {};
    this.extraResources = {};
    this.extraResourcePoints = 0;
    this.mistakes = 0;
    this.stylePoints = 0;
    this.styleCombo = 0;
    this.bestStyleCombo = 0;
    this.precisionDodges = 0;
    this.styleDodges = { jump: 0, slide: 0 };
    this.companionRescueAvailable = false;
    this.companionRescueUsed = false;
    this.companionRescues = 0;
    this.lastCompanionRescue = null;
  }

  collect(resource, value = 1) {
    const amount = Number.isFinite(Number(value)) ? Number(value) : 1;
    const target = this.level.targetResources?.[resource] || 0;
    const before = this.collectedForResource(resource);

    if (resource === 'bread') this.bread += amount;
    else this.resources[resource] = (this.resources[resource] || 0) + amount;

    if (resource !== 'bread' && target > 0 && before >= target) {
      this.extraResources[resource] = (this.extraResources[resource] || 0) + amount;
      this.extraResourcePoints += amount * EXTRA_PACKAGE_RESOURCE_POINTS;
    }
  }

  useCompanionRescue(object = null, player = null) {
    if (!this.companionRescueAvailable || this.companionRescueUsed) return false;
    this.companionRescueUsed = true;
    this.companionRescues += 1;
    this.lastCompanionRescue = {
      id: `rescue_${this.companionRescues}`,
      objectX: object?.x ?? player?.x ?? 0,
      lane: Math.round(player?.lane ?? object?.lane ?? 1),
      visualKey: object?.visualKey || 'flight_case',
    };
    this.resetStyleCombo();
    return true;
  }

  addStyleDodge(action, dodgeDistance = 72) {
    const normalized = action === 'slide' ? 'slide' : 'jump';
    this.styleCombo += 1;
    this.bestStyleCombo = Math.max(this.bestStyleCombo, this.styleCombo);
    this.styleDodges[normalized] = (this.styleDodges[normalized] || 0) + 1;

    const base = normalized === 'slide' ? 75 : 60;
    const comboBonus = Math.min(90, Math.max(0, this.styleCombo - 1) * 15);
    const precisionBonus = dodgeDistance <= 28 ? 35 : dodgeDistance <= 44 ? 20 : 0;
    if (precisionBonus > 0) this.precisionDodges += 1;
    const points = base + comboBonus + precisionBonus;
    this.stylePoints += points;

    return {
      points,
      combo: this.styleCombo,
      precisionBonus,
      clean: precisionBonus > 0,
    };
  }

  resetStyleCombo() {
    this.styleCombo = 0;
  }

  collectedForResource(resource) {
    return resource === 'bread' ? this.bread : this.resources[resource] || 0;
  }

  liveScore(player) {
    return Math.max(0, Math.round(this.bread * 15 + player.mistakesLeft * 120 + this.stylePoints + this.extraResourcePoints));
  }

  result(player, elapsedMs) {
    const targets = this.level.targetResources || {};
    const targetTotal = Object.values(targets).reduce((sum, value) => sum + value, 0) || 1;
    const collectedTotal = Object.entries(targets).reduce((sum, [key, value]) => {
      return sum + Math.min(value, this.collectedForResource(key));
    }, 0);

    const resourcePercent = collectedTotal / targetTotal;
    const finalPercent = Math.max(0, Math.round((resourcePercent - this.mistakes * 0.1) * 100));
    const grade = finalPercent >= 95 ? 'S' : finalPercent >= 80 ? 'A' : finalPercent >= 65 ? 'B' : finalPercent >= 45 ? 'C' : 'D';
    const score = Math.max(0, Math.round(finalPercent * 10 + this.bread * 15 + player.mistakesLeft * 120 + this.stylePoints + this.extraResourcePoints));

    return {
      level: this.level,
      bread: this.bread,
      resources: this.resources,
      extraResources: this.extraResources,
      extraResourcePoints: this.extraResourcePoints,
      mistakes: this.mistakes,
      mistakesLeft: player.mistakesLeft,
      companionRescues: this.companionRescues,
      stylePoints: this.stylePoints,
      styleDodges: this.styleDodges,
      bestStyleCombo: this.bestStyleCombo,
      precisionDodges: this.precisionDodges,
      finalPercent,
      grade,
      score,
      elapsedMs,
      phrase: this.pickPhrase(grade),
    };
  }

  pickPhrase(grade) {
    const phrases = this.level.resultPhrases || {};
    if (grade === 'S' || grade === 'A') return phrases.perfect || phrases.good;
    if (grade === 'B' || grade === 'C') return phrases.good || phrases.bad;
    return phrases.bad || 'Объект не сдан. Хомяк требует хлеб.';
  }
}
