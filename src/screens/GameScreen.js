import { CanvasRenderer } from '../render/CanvasRenderer.js';
import { LevelController } from '../gameplay/LevelController.js';

export class GameScreen {
  constructor(game, level) {
    this.game = game;
    this.level = level;
    this.controller = new LevelController(level);
    this.localEffects = [];
    this.screenShakeMs = 0;
    this.screenShakeSeed = 0;
    this.previousBread = 0;
    this.previousResources = 0;
    this.previousMistakesLeft = 3;
    this.previousStylePoints = 0;
    this.previousStyleCombo = 0;
    this.element = document.createElement('section');
    this.element.className = 'screen game-screen';
    this.element.innerHTML = `
      <header class="hud">
        <div class="hud-title">
          <strong>${level.title}</strong>
          <span class="kicker">${level.intro}</span>
        </div>
        <div class="hud-metrics">
          <span class="metric" data-hud="bread">Хлеб: 0</span>
          <span class="metric" data-hud="resources">Ресурсы: 0</span>
          <span class="metric" data-hud="mistakes">Косяки: 3</span>
          <span class="metric" data-hud="style">Финты: 0</span>
        </div>
        <div class="progress-track"><div class="progress-fill" data-hud="progress"></div></div>
      </header>
      <div class="canvas-wrap"><canvas class="game-canvas" aria-label="Игровое поле"></canvas></div>
      <footer class="event-bar">Свайп: дорожка · вверх прыжок · вниз подкат · финты дают бонус</footer>
    `;
  }

  mount() {
    this.canvas = this.element.querySelector('canvas');
    this.renderer = new CanvasRenderer(this.canvas, this.game.assets);
    this.detachTouch = this.game.input.attachTouchTarget(this.canvas);
    this.last = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  tick = (now) => {
    const deltaMs = Math.min(42, now - this.last);
    this.last = now;
    const actions = this.game.input.consume();
    const result = this.controller.update(deltaMs, actions);
    const snapshot = this.controller.snapshot();
    this.updateLocalEffects(snapshot, deltaMs);
    this.updateScreenShake(deltaMs);
    snapshot.effects = this.localEffects;
    snapshot.screenShake = this.getScreenShake(now);
    this.renderer.render(snapshot);
    this.updateHud(snapshot);

    if (result) {
      window.setTimeout(() => this.game.showResult(result), 450);
      return;
    }

    this.frame = requestAnimationFrame(this.tick);
  };

  updateLocalEffects(snapshot, deltaMs) {
    const resources = Object.values(snapshot.stats.resources).reduce((sum, value) => sum + value, 0);

    if (snapshot.stats.bread > this.previousBread) this.spawnLocalEffect('pickup', `+${snapshot.stats.bread - this.previousBread}`);
    if (resources > this.previousResources) this.spawnLocalEffect('pickup', `+${resources - this.previousResources}`);
    if (snapshot.stats.stylePoints > this.previousStylePoints) {
      const gained = snapshot.stats.stylePoints - this.previousStylePoints;
      const combo = snapshot.stats.styleCombo || 1;
      const label = combo > 1 ? `ФИНТ +${gained} ×${combo}` : `ФИНТ +${gained}`;
      this.spawnLocalEffect('style', label);
    }
    if (snapshot.player.mistakesLeft < this.previousMistakesLeft) {
      this.spawnLocalEffect('hit', '-1');
      this.triggerScreenShake();
    }

    this.previousBread = snapshot.stats.bread;
    this.previousResources = resources;
    this.previousMistakesLeft = snapshot.player.mistakesLeft;
    this.previousStylePoints = snapshot.stats.stylePoints || 0;
    this.previousStyleCombo = snapshot.stats.styleCombo || 0;

    for (const effect of this.localEffects) effect.ageMs += deltaMs;
    this.localEffects = this.localEffects.filter((effect) => effect.ageMs < effect.durationMs);
  }

  triggerScreenShake() {
    this.screenShakeMs = 220;
    this.screenShakeSeed = Math.random() * 1000;
  }

  updateScreenShake(deltaMs) {
    this.screenShakeMs = Math.max(0, this.screenShakeMs - deltaMs);
  }

  getScreenShake(now) {
    if (this.screenShakeMs <= 0) return null;
    const intensity = Math.pow(this.screenShakeMs / 220, 1.35);
    return {
      intensity,
      seed: this.screenShakeSeed,
      time: now,
    };
  }

  spawnLocalEffect(type, label) {
    const player = this.controller.player;
    this.localEffects.push({
      id: `fx_${Math.random().toString(36).slice(2)}`,
      type,
      label,
      x: player.x + 34,
      lane: player.renderLane,
      ageMs: 0,
      durationMs: type === 'pickup' ? 560 : type === 'style' ? 720 : 420,
    });
  }

  updateHud(snapshot) {
    this.element.querySelector('[data-hud="bread"]').textContent = `Хлеб: ${snapshot.stats.bread}`;
    const resources = Object.values(snapshot.stats.resources).reduce((sum, value) => sum + value, 0);
    this.element.querySelector('[data-hud="resources"]').textContent = `Ресурсы: ${resources}`;
    this.element.querySelector('[data-hud="mistakes"]').textContent = `Косяки: ${snapshot.player.mistakesLeft}`;
    this.element.querySelector('[data-hud="style"]').textContent = `Финты: ${snapshot.stats.stylePoints || 0}`;
    this.element.querySelector('[data-hud="progress"]').style.width = `${Math.round(snapshot.progress * 100)}%`;
  }

  destroy() {
    cancelAnimationFrame(this.frame);
    this.detachTouch?.();
  }
}
