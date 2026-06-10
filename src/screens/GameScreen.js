import '../render/CanvasRendererPolish.js';
import '../render/CanvasRendererPerformance.js';
import '../render/CanvasRendererCleanRoad.js';
import '../render/CanvasRendererVisualRebuildV1.js';
import '../render/CanvasRendererLevelBackdrops.js';
import { CanvasRenderer } from '../render/CanvasRenderer.js';
import { LevelController } from '../gameplay/LevelController.js';

const COUNTDOWN_TOTAL_MS = 3200;
const FINAL_PHASE_SECONDS = 20;
const LEVEL_EVENT_BANNER_MS = 2300;

const RESOURCE_LABELS = {
  bread: 'хлеб',
  deck: 'настил',
  cable: 'кабель',
  bolts: 'болты',
  c2: 'C2',
  powercon: 'PowerCON',
  tape: 'тейп',
  led: 'LED',
  truss: 'фермы',
};

const OBSTACLE_HIT_LABELS = {
  case: 'КОФР!',
  cable_loop: 'КАБЕЛЬ!',
  mic_stand: 'СТОЙКА!',
  mystery_box: 'СЮРПРИЗ!',
  cart: 'ТЕЛЕЖКА!',

  wedding_generator: 'ГЕНЕРАТОР!',
  wedding_wet_cable: 'МОКРЫЙ КАБЕЛЬ!',
  wedding_guest_chair: 'СТУЛ ГОСТЯ!',
  wedding_decor_arch: 'АРКА!',

  concert_subwoofer: 'САБ!',
  concert_smoke_machine: 'ДЫМ-МАШИНА!',
  concert_moving_head: 'ГОЛОВА!',
  concert_cases_with_truss: 'ФЕРМА НА КОФРАХ!',
  concert_stagehands_carrying_truss: 'ГРУЗЧИКИ!',

  kids_toy_car: 'МАШИНКА!',
  kids_blocks: 'КУБИКИ!',
  kids_sock_trap: 'НОСКИ!',

  truss_section_left: 'ФЕРМА!',
  truss_section_right: 'ФЕРМА!',
};

function targetEntries(level) {
  return Object.entries(level.targetResources || {});
}

function targetTotal(level) {
  return targetEntries(level).reduce((sum, [, value]) => sum + value, 0);
}

function packageSummary(level) {
  const entries = targetEntries(level);
  if (!entries.length) return 'Собери пакет ресурсов';
  return entries
    .map(([key, value]) => `${RESOURCE_LABELS[key] || key} ×${value}`)
    .join(' · ');
}

function remainingSeconds(snapshot) {
  const durationMs = (snapshot.level.duration || 0) * 1000;
  const remainingMs = Math.max(0, durationMs - (snapshot.elapsedMs || 0));
  return Math.ceil(remainingMs / 1000);
}

function formatRemainingTime(snapshot) {
  const totalSeconds = remainingSeconds(snapshot);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function isFinalPhase(snapshot) {
  if (!snapshot?.level?.duration) return false;
  return remainingSeconds(snapshot) <= FINAL_PHASE_SECONDS;
}

function hitLabelFromEvents(events = []) {
  const hitEvent = events.find((event) => event?.type === 'hit');
  if (!hitEvent) return '-1';
  return OBSTACLE_HIT_LABELS[hitEvent.objectId] || '-1';
}

function vibrateCollision() {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([45, 35, 55]);
    }
  } catch {
    // Some browsers expose the API but reject vibration silently.
  }
}

export class GameScreen {
  constructor(game, level) {
    this.game = game;
    this.level = level;
    this.controller = new LevelController(level);
    this.localEffects = [];
    this.screenShakeMs = 0;
    this.screenShakeSeed = 0;
    this.previousBread = 0;
    this.previousPackage = 0;
    this.previousResourceTotal = 0;
    this.previousExtraResourcePoints = 0;
    this.previousMistakesLeft = 3;
    this.previousStylePoints = 0;
    this.previousStyleCombo = 0;
    this.previousPrecisionDodges = 0;
    this.packageCompleteAnnounced = false;
    this.finalPhaseAnnounced = false;
    this.currentLevelEventId = null;
    this.levelEventBannerMs = 0;
    this.paused = false;
    this.countdownMs = COUNTDOWN_TOTAL_MS;
    this.lastCountdownLabel = '';
    this.packageTargetTotal = targetTotal(level);
    this.lastSnapshot = null;
    this.hasSpanielCompanion = game.state.unlockedCompanions?.includes('spaniel');
    this.element = document.createElement('section');
    this.element.className = `screen game-screen game-screen--${level.theme} is-countdown`;
    this.element.innerHTML = `
      <header class="game-hud" aria-label="Игровой интерфейс">
        <button class="hud-pause" data-action="pause" type="button" aria-label="Пауза">Ⅱ</button>
        <div class="hud-status">
          <span class="hud-status__icon" aria-hidden="true">◷</span>
          <span class="hud-status__text">${level.intro}</span>
          <strong class="hud-timer" data-hud="timer">${formatRemainingTime({ level, elapsedMs: 0 })}</strong>
        </div>
        <div class="hud-score" aria-label="Общие очки"><span aria-hidden="true">⚡</span><strong data-hud-value="score">0</strong></div>
        <div class="hud-chips">
          <span class="hud-chip hud-chip--bread"><i aria-hidden="true">🍞</i><b>Хлеб</b><strong data-hud-value="bread">0</strong></span>
          <span class="hud-chip hud-chip--package" title="${packageSummary(level)}"><i aria-hidden="true">📦</i><b>Пакет</b><strong data-hud-value="package">0/${this.packageTargetTotal || 0}</strong></span>
          <span class="hud-chip hud-chip--danger"><i aria-hidden="true">⚠</i><b>Косяки</b><strong data-hud-value="mistakes">3</strong></span>
          <span class="hud-chip hud-chip--style"><i aria-hidden="true">★</i><b>Финты</b><strong data-hud-value="style">0</strong></span>
        </div>
        <div class="progress-track" aria-hidden="true"><div class="progress-fill" data-hud="progress"></div></div>
      </header>
      <div class="canvas-wrap"><canvas class="game-canvas" aria-label="Игровое поле"></canvas></div>
      <footer class="event-bar" data-event-bar><span aria-hidden="true">📦</span><strong data-event-title>Цель:</strong> <span data-event-text>собери пакет ресурсов · хлеб и финты дают рекорд</span></footer>
      <aside class="level-event-banner" data-level-event-banner hidden aria-live="polite">
        <span>Событие</span>
        <strong data-level-event-banner-title></strong>
        <em data-level-event-banner-text></em>
      </aside>
      <aside class="start-countdown" aria-live="polite" aria-label="Старт уровня">
        <span class="start-countdown__kicker">ПАКЕТ НА УРОВЕНЬ</span>
        <strong data-countdown-label>3</strong>
        <span class="start-countdown__hint">${packageSummary(level)}</span>
      </aside>
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

    if (this.countdownMs > 0) {
      this.game.input.consume();
      this.countdownMs = Math.max(0, this.countdownMs - deltaMs);
      const snapshot = this.controller.snapshot();
      snapshot.effects = [];
      snapshot.screenShake = null;
      this.attachCompanion(snapshot);
      this.lastSnapshot = snapshot;
      this.renderer.render(snapshot);
      this.updateHud(snapshot);
      this.updateCountdown();
      this.frame = requestAnimationFrame(this.tick);
      return;
    }

    this.element.classList.remove('is-countdown');
    const actions = this.game.input.consume();
    const result = this.controller.update(deltaMs, actions);
    const snapshot = this.controller.snapshot();
    this.updateLocalEffects(snapshot, deltaMs);
    this.updateLevelEventBanner(snapshot, deltaMs);
    this.updateScreenShake(deltaMs);
    snapshot.effects = this.localEffects;
    snapshot.screenShake = this.getScreenShake(now);
    this.attachCompanion(snapshot);
    this.lastSnapshot = snapshot;
    this.renderer.render(snapshot);
    this.updateHud(snapshot);

    if (result) {
      window.setTimeout(() => this.game.showResult(result), 450);
      return;
    }

    this.frame = requestAnimationFrame(this.tick);
  };

  attachCompanion(snapshot) {
    if (!this.hasSpanielCompanion || !this.game.assets.get('spaniel_run')) return;
    const player = snapshot.player;
    snapshot.companion = {
      visualKey: 'spaniel_run',
      x: player.x - 58,
      renderLane: player.renderLane,
      state: player.state,
    };
  }

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

  updateCountdown() {
    const label = this.countdownLabel();
    if (label === this.lastCountdownLabel) return;
    this.lastCountdownLabel = label;
    const countdownNode = this.element.querySelector('[data-countdown-label]');
    if (countdownNode) countdownNode.textContent = label;
    this.element.dataset.countdownLabel = label;
  }

  countdownLabel() {
    if (this.countdownMs > 2300) return '3';
    if (this.countdownMs > 1400) return '2';
    if (this.countdownMs > 520) return '1';
    if (this.countdownMs > 0) return 'Монтаж!';
    return '';
  }

  packageCollected(snapshot) {
    const targets = snapshot.level.targetResources || {};
    return Object.entries(targets).reduce((sum, [key, value]) => {
      const collected = key === 'bread' ? snapshot.stats.bread : snapshot.stats.resources[key] || 0;
      return sum + Math.min(value, collected);
    }, 0);
  }

  resourceTotal(snapshot) {
    return Object.values(snapshot.stats.resources || {}).reduce((sum, value) => sum + value, 0);
  }

  updateLocalEffects(snapshot, deltaMs) {
    const packageCollected = this.packageCollected(snapshot);
    const resourceTotal = this.resourceTotal(snapshot);
    const precisionDodges = snapshot.stats.precisionDodges || 0;
    const extraResourcePoints = snapshot.stats.extraResourcePoints || 0;
    const finalPhase = isFinalPhase(snapshot);

    if (finalPhase && !this.finalPhaseAnnounced) {
      this.finalPhaseAnnounced = true;
    }
    if (snapshot.stats.bread > this.previousBread) this.spawnLocalEffect('pickup', `+${snapshot.stats.bread - this.previousBread}`);
    if (packageCollected > this.previousPackage) this.spawnLocalEffect('pickup', `ПАКЕТ +${packageCollected - this.previousPackage}`);
    if (!this.packageCompleteAnnounced && this.packageTargetTotal > 0 && packageCollected >= this.packageTargetTotal) {
      this.packageCompleteAnnounced = true;
      this.spawnLocalEffect('complete', 'ПАКЕТ СОБРАН!');
    }
    if (resourceTotal > this.previousResourceTotal && packageCollected === this.previousPackage) {
      const gainedExtraPoints = Math.max(0, extraResourcePoints - this.previousExtraResourcePoints);
      const label = gainedExtraPoints > 0
        ? `ЛИШНЕЕ +${resourceTotal - this.previousResourceTotal} · +${gainedExtraPoints}`
        : `ЛИШНЕЕ +${resourceTotal - this.previousResourceTotal}`;
      this.spawnLocalEffect('pickup', label);
    }
    if (snapshot.stats.stylePoints > this.previousStylePoints) {
      const gained = snapshot.stats.stylePoints - this.previousStylePoints;
      const combo = snapshot.stats.styleCombo || 1;
      const cleanGained = precisionDodges > this.previousPrecisionDodges;
      const prefix = cleanGained ? 'ЧИСТО' : 'ФИНТ';
      const label = combo > 1 ? `${prefix} +${gained} ×${combo}` : `${prefix} +${gained}`;
      this.spawnLocalEffect(cleanGained ? 'clean' : 'style', label);
    }
    if (snapshot.player.mistakesLeft < this.previousMistakesLeft) {
      this.spawnLocalEffect('hit', hitLabelFromEvents(snapshot.events));
      this.triggerScreenShake();
      vibrateCollision();
    }

    this.previousBread = snapshot.stats.bread;
    this.previousPackage = packageCollected;
    this.previousResourceTotal = resourceTotal;
    this.previousExtraResourcePoints = extraResourcePoints;
    this.previousMistakesLeft = snapshot.player.mistakesLeft;
    this.previousStylePoints = snapshot.stats.stylePoints || 0;
    this.previousStyleCombo = snapshot.stats.styleCombo || 0;
    this.previousPrecisionDodges = precisionDodges;

    for (const effect of this.localEffects) effect.ageMs += deltaMs;
    this.localEffects = this.localEffects.filter((effect) => effect.ageMs < effect.durationMs);
  }

  updateLevelEventBanner(snapshot, deltaMs) {
    const event = snapshot.activeEvent;
    const banner = this.element.querySelector('[data-level-event-banner]');
    if (!banner) return;

    if (event?.id && event.id !== this.currentLevelEventId) {
      this.currentLevelEventId = event.id;
      this.levelEventBannerMs = LEVEL_EVENT_BANNER_MS;
      const title = banner.querySelector('[data-level-event-banner-title]');
      const text = banner.querySelector('[data-level-event-banner-text]');
      if (title) title.textContent = String(event.title || 'Событие').replace(/:$/, '');
      if (text) text.textContent = event.text || 'темп монтажа изменился';
      banner.hidden = false;
      banner.style.animation = 'none';
      banner.offsetHeight;
      banner.style.animation = '';
    } else if (!event) {
      this.currentLevelEventId = null;
    }

    if (!banner.hidden) {
      this.levelEventBannerMs = Math.max(0, this.levelEventBannerMs - deltaMs);
      if (this.levelEventBannerMs <= 0) banner.hidden = true;
    }
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
      durationMs: type === 'pickup' ? 560 : type === 'complete' ? 980 : type === 'clean' ? 780 : type === 'style' ? 720 : 420,
    });
  }

  updateHud(snapshot) {
    const packageCollected = this.packageCollected(snapshot);
    const packageComplete = this.packageTargetTotal > 0 && packageCollected >= this.packageTargetTotal;
    const finalPhase = isFinalPhase(snapshot);
    const levelEvent = snapshot.activeEvent;
    const packageChip = this.element.querySelector('.hud-chip--package');
    if (packageChip) packageChip.classList.toggle('is-package-complete', packageComplete);
    this.element.classList.toggle('is-package-complete', packageComplete);
    this.element.classList.toggle('is-final-phase', finalPhase);
    this.element.classList.toggle('is-level-event-active', Boolean(levelEvent));
    const eventTitle = this.element.querySelector('[data-event-title]');
    const eventText = this.element.querySelector('[data-event-text]');
    if (eventTitle && eventText) {
      if (packageComplete) {
        eventTitle.textContent = finalPhase ? 'Финал:' : 'Пакет собран:';
        eventText.textContent = finalPhase ? 'добирай хлеб, лишние части и чистые финты до сирены' : 'добирай хлеб, лишние части и финты до конца таймера';
      } else if (finalPhase) {
        eventTitle.textContent = 'Финал:';
        eventText.textContent = 'дожми пакет до конца таймера';
      } else if (levelEvent) {
        eventTitle.textContent = levelEvent.title || 'Событие:';
        eventText.textContent = levelEvent.text || 'темп монтажа изменился';
      } else {
        eventTitle.textContent = 'Цель:';
        eventText.textContent = 'собери пакет ресурсов · хлеб, лишние части и финты дают рекорд';
      }
    }
    this.element.querySelector('[data-hud-value="bread"]').textContent = snapshot.stats.bread;
    this.element.querySelector('[data-hud-value="package"]').textContent = `${packageCollected}/${this.packageTargetTotal || 0}`;
    this.element.querySelector('[data-hud-value="mistakes"]').textContent = snapshot.player.mistakesLeft;
    this.element.querySelector('[data-hud-value="style"]').textContent = snapshot.stats.stylePoints || 0;
    this.element.querySelector('[data-hud-value="score"]').textContent = typeof snapshot.stats.liveScore === 'function'
      ? snapshot.stats.liveScore(snapshot.player)
      : snapshot.stats.stylePoints || 0;
    this.element.querySelector('[data-hud="timer"]').textContent = formatRemainingTime(snapshot);
    this.element.querySelector('[data-hud="progress"]').style.width = `${Math.round(snapshot.progress * 100)}%`;
  }

  destroy() {
    cancelAnimationFrame(this.frame);
    this.detachTouch?.();
    this.element.removeEventListener('click', this.onClick);
  }
}
