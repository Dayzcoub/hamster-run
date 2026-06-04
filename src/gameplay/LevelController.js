import { Player } from './Player.js';
import { ObjectSpawner } from './ObjectSpawner.js';
import { CollisionSystem } from './CollisionSystem.js';

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
  }

  update(deltaMs, actions) {
    if (this.finished) return null;

    this.elapsedMs += deltaMs;
    this.distance += (this.level.speed * deltaMs) / 1000;
    this.player.update(deltaMs, actions);

    const spawned = this.spawner.update(deltaMs, this.elapsedMs);
    if (spawned) this.objects.push(spawned);

    const speed = this.level.speed * (1 + this.elapsedMs / (this.level.duration * 1000) * 0.18);
    for (const object of this.objects) object.x -= (speed * deltaMs) / 1000;
    this.collision.check(this.player, this.objects, this.stats);
    this.objects = this.objects.filter((object) => object.x > -180 && !object.collected);

    if (this.player.mistakesLeft <= 0 || this.elapsedMs >= this.level.duration * 1000) {
      return this.finish();
    }

    return null;
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
      elapsedMs: this.elapsedMs,
      distance: this.distance,
      progress: Math.min(1, this.elapsedMs / (this.level.duration * 1000)),
      stats: this.stats,
    };
  }
}

class LevelStats {
  constructor(level) {
    this.level = level;
    this.bread = 0;
    this.resources = {};
    this.mistakes = 0;
    this.stylePoints = 0;
    this.styleCombo = 0;
    this.bestStyleCombo = 0;
    this.precisionDodges = 0;
    this.styleDodges = { jump: 0, slide: 0 };
  }

  collect(resource, value = 1) {
    if (resource === 'bread') this.bread += value;
    else this.resources[resource] = (this.resources[resource] || 0) + value;
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

  result(player, elapsedMs) {
    const targets = this.level.targetResources || {};
    const targetTotal = Object.values(targets).reduce((sum, value) => sum + value, 0) || 1;
    const collectedTotal = Object.entries(targets).reduce((sum, [key, value]) => {
      return sum + Math.min(value, this.resources[key] || 0);
    }, 0);

    const resourcePercent = collectedTotal / targetTotal;
    const finalPercent = Math.max(0, Math.round((resourcePercent - this.mistakes * 0.1) * 100));
    const grade = finalPercent >= 95 ? 'S' : finalPercent >= 80 ? 'A' : finalPercent >= 65 ? 'B' : finalPercent >= 45 ? 'C' : 'D';
    const score = Math.max(0, Math.round(finalPercent * 10 + this.bread * 15 + player.mistakesLeft * 120 + this.stylePoints));

    return {
      level: this.level,
      bread: this.bread,
      resources: this.resources,
      mistakes: this.mistakes,
      mistakesLeft: player.mistakesLeft,
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
