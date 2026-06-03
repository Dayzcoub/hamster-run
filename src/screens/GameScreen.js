import { CanvasRenderer } from '../render/CanvasRenderer.js';
import { LevelController } from '../gameplay/LevelController.js';

export class GameScreen {
  constructor(game, level) {
    this.game = game;
    this.level = level;
    this.controller = new LevelController(level);
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
        </div>
        <div class="progress-track"><div class="progress-fill" data-hud="progress"></div></div>
      </header>
      <div class="canvas-wrap"><canvas class="game-canvas" aria-label="Игровое поле"></canvas></div>
      <footer class="event-bar">Свайп: дорожка · вверх прыжок · вниз подкат</footer>
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
    this.renderer.render(snapshot);
    this.updateHud(snapshot);

    if (result) {
      window.setTimeout(() => this.game.showResult(result), 450);
      return;
    }

    this.frame = requestAnimationFrame(this.tick);
  };

  updateHud(snapshot) {
    this.element.querySelector('[data-hud="bread"]').textContent = `Хлеб: ${snapshot.stats.bread}`;
    const resources = Object.values(snapshot.stats.resources).reduce((sum, value) => sum + value, 0);
    this.element.querySelector('[data-hud="resources"]').textContent = `Ресурсы: ${resources}`;
    this.element.querySelector('[data-hud="mistakes"]').textContent = `Косяки: ${snapshot.player.mistakesLeft}`;
    this.element.querySelector('[data-hud="progress"]').style.width = `${Math.round(snapshot.progress * 100)}%`;
  }

  destroy() {
    cancelAnimationFrame(this.frame);
    this.detachTouch?.();
  }
}
