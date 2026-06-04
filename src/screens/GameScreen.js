import '../render/CanvasRendererPolish.js';
import '../render/CanvasRendererPerformance.js';
import '../render/CanvasRendererCleanRoad.js';
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
    this.paused = false;
    this.lastSnapshot = null;
    this.element = document.createElement('section');
    this.element.className = `screen game-screen game-screen--${level.theme}`;
    this.element.innerHTML = `
      <header class="game-hud" aria-label="Игровой интерфейс">
        <button class="hud-pause" data-action="pause" type="button" aria-label="Пауза">Ⅱ</button>
        <div class="hud-status">
          <span class="hud-status__icon" aria-hidden="true">◷</span>
          <span class="hud-status__text">${level.intro}</span>
          <strong class="hud-timer" data-hud="timer">10:00</strong>
        </div>
        <div class="hud-score" aria-label="Очки финтов"><span aria-hidden="true">⚡</span><strong data-hud-value="score">0</strong></div>
        <div class="hud-chips">
          <span class="hud-chip hud-chip--bread"><i aria-hidden="true">🍞</i><b>Хлеб</b><strong data-hud-value="bread">0</strong></span>
          <span class="hud-chip hud-chip--resources"><i aria-hidden="true">🧵</i><b>Ресурсы</b><strong data-hud-value="resources">0</strong></span>
          <span class="hud-chip hud-chip--danger"><i aria-hidden="true">⚠</i><b>Косяки</b><strong data-hud-value="mistakes">3</strong></span>
          <span class="hud-chip hud-chip--style"><i aria-hidden="true">★</i><b>Финты</b><strong data-hud-value="style">0</strong></span>
        </div>
        <div class="progress-track" aria-hidden="true"><div class="progress-fill" data-hud="progress"></div></div>
      </header>
      <div class="canvas-wrap"><canvas class="game-canvas" aria-label="Игровое поле"></canvas></div>
      <footer class="event-bar"><span aria-hidden="true">☝</span><strong>Свайп:</strong> дорожка · вверх прыжок · вниз подкат · финты дают бонус</footer>
      <aside class="pause-overlay" aria-hidden="true">
        <div class="pause-card game-panel">
          <div class="kicker">ПАУЗА</div>
          <h2>Монтаж на стопе</h2>
          <p>Завхоз пока не смотрит. Можно выдохнуть и продолжить забег.</p>
          <div class="pause-actions">
            <button class="btn-primary" data-action="resume" type="button"><span aria-hidden="true">▶</span>Продолжить</button>
            <button class="btn-secondary" data-action="levels" type="button"><span aria-hidden="true">▱</span>К уровням</button>
            <button class="btn-secondary" data-action="menu" type="button"><span aria-hidden="true">⌂</span>Главное меню</button>
          </div>
        </div>
      </aside>
    `;
  }

  mount() {
    this.canvas = this.element.querySelector('canvas');
    this.renderer = new CanvasRenderer(this.canvas, this.game.assets);
    this.detachTouch = this.game.input.attachTouchTarget(this.canvas);
    this.element.addEventListener('click', this.onClick);
    this.last = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  tick = (now) => {
    const deltaMs = Math.min(42, now - this.last);
    this.last = now;

    if (this.paused) {
      this.game.input.consume();
      if (this.lastSnapshot) this.renderer.render(this.lastSnapshot);
      this.frame = requestAnimationFrame(this.tick);
      return;
    }

    const actions = this.game.input.consume();
    const result = this.controller.update(deltaMs, actions);
    const snapshot = this.controller.snapshot();
    this.updateLocalEffects(snapshot, deltaMs);
    this.updateScreenShake(deltaMs);
    snapshot.effects = this.localEffects;
    snapshot.screenShake = this.getScreenShake(now);
    this.lastSnapshot = snapshot;
    this.renderer.render(snapshot);
    this.updateHud(snapshot);

    if (result) {
      window.setTimeout(() => this.game.showResult(result), 450);
      return;
    }

    this.frame = requestAnimationFrame(this.tick);
  };

  onClick = (event) => {
    const action = event.target?.closest('[data-action]')?.dataset?.action;
    if (action === 'pause') this.setPaused(true);
    if (action === 'resume') this.setPaused(false);
    if (action === 'levels') this.game.showLevels();
    if (action === 'menu') this.game.showMainMenu();
  };

  setPaused(paused) {
    this.paused = paused;
    this.element.classList.toggle('is-paused', paused);
    const pauseButton = this.element.querySelector('[data-action="pause"]');
    if (pauseButton) {
      pauseButton.textContent = paused ? '▶' : 'Ⅱ';
      pauseButton.setAttribute('aria-label', paused ? 'Продолжить' : 'Пауза');
    }
  }

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
    const resources = Object.values(snapshot.stats.resources).reduce((sum, value) => sum + value, 0);
    this.element.querySelector('[data-hud-value="bread"]').textContent = snapshot.stats.bread;
    this.element.querySelector('[data-hud-value="resources"]').textContent = resources;
    this.element.querySelector('[data-hud-value="mistakes"]').textContent = snapshot.player.mistakesLeft;
    this.element.querySelector('[data-hud-value="style"]').textContent = snapshot.stats.stylePoints || 0;
    this.element.querySelector('[data-hud-value="score"]').textContent = snapshot.stats.stylePoints || 0;
    this.element.querySelector('[data-hud="progress"]').style.width = `${Math.round(snapshot.progress * 100)}%`;
  }

  destroy() {
    cancelAnimationFrame(this.frame);
    this.detachTouch?.();
    this.element.removeEventListener('click', this.onClick);
  }
}
