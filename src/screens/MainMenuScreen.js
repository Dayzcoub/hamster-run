import { menuPhrases } from '../data/texts.js';
import { menuMusic } from '../audio/menu-music.js';

const menuItems = [
  { action: 'play', label: 'Играть', icon: '▶', kind: 'primary' },
  { action: 'levels', label: 'Уровни', icon: '▱', kind: 'secondary' },
  { label: 'Склад — скоро', icon: '▤', kind: 'disabled' },
  { label: 'Магазин — скоро', icon: '🛒', kind: 'disabled' },
  { action: 'settings', label: 'Настройки', icon: '⚙', kind: 'secondary muted' },
];

const DEV_PASSWORD = 'montage';
const DEV_UNLOCK_KEY = 'hamster_dev_tools_unlocked';
const DEV_SPAWN_DEBUG_KEY = 'hamster_dev_spawn_debug_enabled';
const DEV_TRUSS_DEBUG_KEY = 'hamster_dev_truss_debug_enabled';

const qualityLabels = {
  auto: 'Авто',
  performance: 'FPS',
  quality: 'Красиво',
};

const audioLabels = {
  menuMusicVolume: 'Музыка меню',
  levelMusicVolume: 'Музыка уровней',
  sfxVolume: 'Звуковые эффекты',
};

function audioIcon(game) {
  return game.state.settings.audio?.enabled ? '🔊' : '🔇';
}

function percent(value) {
  return `${Math.round(Number(value || 0) * 100)}%`;
}

function localFlag(key) {
  try {
    return window.localStorage?.getItem(key) === '1';
  } catch {
    return false;
  }
}

function setLocalFlag(key, value) {
  try {
    if (value) window.localStorage?.setItem(key, '1');
    else window.localStorage?.removeItem(key);
  } catch {
    // Ignore storage failures.
  }
  window.dispatchEvent(new CustomEvent('hamster-dev-settings-change'));
}

function crewStatus(state, spanielPortrait) {
  const hasSpaniel = state.unlockedCompanions?.includes('spaniel');
  const hasHomeTechdir = Boolean(state.rewards?.skin_home_techdir);
  const skinLabel = hasHomeTechdir ? '<em>Скин: Домашний техдир</em>' : '';
  const spanielAvatar = hasSpaniel && spanielPortrait
    ? `<img class="crew-status__avatar" src="${spanielPortrait.meta.png || spanielPortrait.meta.webp}" alt="Боевой спаниель" />`
    : '';

  if (hasSpaniel) {
    return `<div class="crew-status is-unlocked ${hasHomeTechdir ? 'has-skin' : ''}" aria-label="Команда">${spanielAvatar}<span>Команда</span><strong>🐹 Хомяк + Боевой спаниель</strong>${skinLabel}</div>`;
  }
  return `<div class="crew-status ${hasHomeTechdir ? 'has-skin' : ''}" aria-label="Команда"><span>Команда</span><strong>🐹 Хомяк</strong>${skinLabel}</div>`;
}

function settingsPanel(game) {
  const audio = game.state.settings.audio || {};
  const renderQuality = game.state.settings.renderQuality || 'auto';
  const devUnlocked = localFlag(DEV_UNLOCK_KEY);
  const spawnDebugEnabled = localFlag(DEV_SPAWN_DEBUG_KEY);
  const trussDebugEnabled = localFlag(DEV_TRUSS_DEBUG_KEY);
  const qualityButtons = Object.entries(qualityLabels).map(([value, label]) => `
    <button class="settings-choice ${renderQuality === value ? 'is-active' : ''}" data-quality-option="${value}" type="button">${label}</button>
  `).join('');
  const sliders = Object.entries(audioLabels).map(([field, label]) => {
    const value = Number(audio[field] ?? 0);
    return `
      <label class="settings-slider">
        <span>${label}</span>
        <input type="range" min="0" max="1" step="0.01" value="${value}" data-audio-field="${field}" />
        <strong data-audio-value="${field}">${percent(value)}</strong>
      </label>
    `;
  }).join('');

  return `
    <div class="menu-settings" data-settings-panel hidden>
      <div class="menu-settings__scrim" data-action="settings-close"></div>
      <section class="menu-settings__panel" role="dialog" aria-modal="true" aria-label="Настройки игры">
        <header class="menu-settings__header">
          <div>
            <span>Настройки</span>
            <strong>Звук и производительность</strong>
          </div>
          <button class="menu-settings__close" data-action="settings-close" type="button" aria-label="Закрыть">×</button>
        </header>

        <div class="settings-block settings-block--quality">
          <h3>Качество графики</h3>
          <div class="settings-choice-row">${qualityButtons}</div>
        </div>

        <div class="settings-block settings-block--audio">
          <h3>Звук</h3>
          <button class="settings-toggle ${audio.enabled ? 'is-on' : ''}" data-action="audio" type="button" data-audio-toggle>
            <span data-audio-icon>${audio.enabled ? '🔊' : '🔇'}</span>
            <strong>${audio.enabled ? 'Звук включён' : 'Звук выключен'}</strong>
          </button>
          ${sliders}
        </div>

        <div class="settings-block settings-block--dev ${devUnlocked ? 'is-unlocked' : ''}" data-dev-tools-block>
          <h3>Dev tools</h3>
          <div class="settings-dev-lock" ${devUnlocked ? 'hidden' : ''} data-dev-lock>
            <input class="settings-dev-input" data-dev-password type="password" inputmode="text" autocomplete="off" placeholder="Пароль" />
            <button class="settings-toggle" data-action="dev-unlock" type="button">Открыть</button>
          </div>
          <div class="settings-dev-tools" ${devUnlocked ? '' : 'hidden'} data-dev-tools>
            <button class="settings-toggle ${spawnDebugEnabled ? 'is-on' : ''}" data-action="dev-toggle-spawn" type="button">Ассеты: ${spawnDebugEnabled ? 'вкл' : 'выкл'}</button>
            <button class="settings-toggle ${trussDebugEnabled ? 'is-on' : ''}" data-action="dev-toggle-truss" type="button">Ферма: ${trussDebugEnabled ? 'вкл' : 'выкл'}</button>
            <button class="settings-toggle" data-action="dev-lock" type="button">Скрыть dev tools</button>
          </div>
          <p class="settings-dev-note" data-dev-note>Debug-панели появляются только во время уровня после включения тут.</p>
        </div>
      </section>
    </div>
  `;
}

export class MainMenuScreen {
  constructor(game) {
    this.game = game;
    this.element = document.createElement('section');
    this.element.className = 'screen menu-screen game-bg game-bg--menu';
    const phrase = menuPhrases[Math.floor(Math.random() * menuPhrases.length)];
    const hero = game.assets.get('hamster_run_01');
    const spanielPortrait = game.assets.get('spaniel_portrait');
    this.element.innerHTML = `
      <button class="menu-audio-toggle" data-action="audio" type="button" aria-label="Музыка меню" data-audio-icon>${audioIcon(this.game)}</button>

      <div class="player-badge" aria-label="Профиль игрока">
        ${hero ? `<img src="${hero.meta.webp}" alt="Хомяк-монтажник" />` : '<span class="player-badge__avatar">🐹</span>'}
        <div class="player-badge__body">
          <strong>Монтажник</strong>
          <span>2 450 / 4 000 XP</span>
          <div class="xp-bar"><i></i></div>
        </div>
        <b>12</b>
      </div>

      <div class="resource-bar" aria-label="Ресурсы игрока">
        <span><i>🍞</i><strong>${this.game.state.bread || 0}</strong><button type="button" aria-label="Добавить хлеб">+</button></span>
        <span><i>🧵</i><strong>87</strong><button type="button" aria-label="Добавить ресурсы">+</button></span>
        <span><i>⚡</i><strong>1 240</strong><button type="button" aria-label="Добавить финты">+</button></span>
        <button class="icon-button" data-action="settings" type="button" aria-label="Настройки">⚙</button>
      </div>

      <div class="menu-hero">
        <div class="kicker">PSEUDO-ISOMETRIC RUNNER</div>
        <h1 class="title"><span>HAMSTER</span><span class="title-gold">CREW</span></h1>
        <div class="title-rule" aria-hidden="true"><span></span><i>⚡</i><span></span></div>
        <p class="subtitle">Хомяк на монтаже спасает мероприятия от кабелей, кофров, дедлайнов и бытового хаоса.</p>
        ${crewStatus(this.game.state, spanielPortrait)}
        ${hero ? `<img class="menu-hamster" src="${hero.meta.webp}" alt="Хомяк-техник бежит на монтаж" />` : ''}
        <p class="phrase">${phrase}</p>
      </div>

      <nav class="menu-actions" aria-label="Главное меню">
        ${menuItems.map((item) => `
          <button class="menu-action menu-action--${item.kind.replace(' ', ' menu-action--')} ${item.kind === 'primary' ? 'btn-primary' : item.kind.includes('disabled') ? 'btn-disabled' : 'btn-secondary'}" ${item.action ? `data-action="${item.action}"` : 'disabled'} type="button">
            <span class="menu-action__icon" aria-hidden="true">${item.icon}</span>
            <span>${item.label}</span>
          </button>
        `).join('')}
      </nav>

      <div class="menu-quick-links" aria-label="Быстрые разделы">
        <button type="button" class="btn-secondary"><span>🏆</span> Достижения</button>
        <button type="button" class="btn-secondary"><span>☑</span> Ежедневные задачи</button>
      </div>

      <div class="crew-links" aria-label="Сообщество">
        <span>Присоединяйся к CREW</span>
        <i>DC</i><i>VK</i><i>TG</i><i>YT</i>
      </div>
      ${settingsPanel(this.game)}
    `;
  }

  mount() {
    this.element.addEventListener('click', this.onClick);
    this.element.addEventListener('input', this.onInput);
    menuMusic.play();
  }

  onClick = (event) => {
    const action = event.target?.closest('[data-action]')?.dataset?.action;
    if (action !== 'audio') menuMusic.play();
    if (action === 'audio') this.toggleAudio();
    if (action === 'settings') this.openSettings();
    if (action === 'settings-close') this.closeSettings();
    if (action === 'play') this.game.startLevel('dk_almost_ready');
    if (action === 'levels') this.game.showLevels();
    if (action === 'dev-unlock') this.unlockDevTools();
    if (action === 'dev-lock') this.lockDevTools();
    if (action === 'dev-toggle-spawn') this.toggleDevFlag(DEV_SPAWN_DEBUG_KEY);
    if (action === 'dev-toggle-truss') this.toggleDevFlag(DEV_TRUSS_DEBUG_KEY);

    const qualityOption = event.target?.closest('[data-quality-option]')?.dataset?.qualityOption;
    if (qualityOption) this.setQuality(qualityOption);
  };

  onInput = (event) => {
    const field = event.target?.dataset?.audioField;
    if (!field) return;
    const value = Number(event.target.value);
    this.game.saveAudioSettings({ enabled: true, [field]: value });
    const label = this.element.querySelector(`[data-audio-value="${field}"]`);
    if (label) label.textContent = percent(value);
    this.syncAudioControls();
    menuMusic.play();
  };

  openSettings() {
    const panel = this.element.querySelector('[data-settings-panel]');
    if (panel) panel.hidden = false;
  }

  closeSettings() {
    const panel = this.element.querySelector('[data-settings-panel]');
    if (panel) panel.hidden = true;
  }

  unlockDevTools() {
    const input = this.element.querySelector('[data-dev-password]');
    const value = String(input?.value || '').trim();
    const note = this.element.querySelector('[data-dev-note]');
    if (value !== DEV_PASSWORD) {
      if (note) note.textContent = 'Неверный пароль.';
      return;
    }
    setLocalFlag(DEV_UNLOCK_KEY, true);
    this.renderDevToolsState();
  }

  lockDevTools() {
    setLocalFlag(DEV_UNLOCK_KEY, false);
    setLocalFlag(DEV_SPAWN_DEBUG_KEY, false);
    setLocalFlag(DEV_TRUSS_DEBUG_KEY, false);
    this.renderDevToolsState();
  }

  toggleDevFlag(key) {
    setLocalFlag(key, !localFlag(key));
    this.renderDevToolsState();
  }

  renderDevToolsState() {
    const unlocked = localFlag(DEV_UNLOCK_KEY);
    const spawnEnabled = localFlag(DEV_SPAWN_DEBUG_KEY);
    const trussEnabled = localFlag(DEV_TRUSS_DEBUG_KEY);
    const block = this.element.querySelector('[data-dev-tools-block]');
    const lock = this.element.querySelector('[data-dev-lock]');
    const tools = this.element.querySelector('[data-dev-tools]');
    const note = this.element.querySelector('[data-dev-note]');
    if (block) block.classList.toggle('is-unlocked', unlocked);
    if (lock) lock.hidden = unlocked;
    if (tools) tools.hidden = !unlocked;
    if (note) note.textContent = unlocked ? 'Debug-панели появляются только во время уровня после включения тут.' : 'Debug-панели закрыты паролем.';
    const spawnButton = this.element.querySelector('[data-action="dev-toggle-spawn"]');
    if (spawnButton) {
      spawnButton.classList.toggle('is-on', spawnEnabled);
      spawnButton.textContent = `Ассеты: ${spawnEnabled ? 'вкл' : 'выкл'}`;
    }
    const trussButton = this.element.querySelector('[data-action="dev-toggle-truss"]');
    if (trussButton) {
      trussButton.classList.toggle('is-on', trussEnabled);
      trussButton.textContent = `Ферма: ${trussEnabled ? 'вкл' : 'выкл'}`;
    }
  }

  toggleAudio() {
    const audio = this.game.toggleAudioEnabled();
    this.syncAudioControls();
    if (audio.enabled) menuMusic.play();
  }

  syncAudioControls() {
    const icon = audioIcon(this.game);
    this.element.querySelectorAll('[data-audio-icon]').forEach((item) => {
      item.textContent = icon;
    });
    const toggle = this.element.querySelector('[data-audio-toggle]');
    if (toggle) {
      const enabled = Boolean(this.game.state.settings.audio?.enabled);
      toggle.classList.toggle('is-on', enabled);
      const text = toggle.querySelector('strong');
      if (text) text.textContent = enabled ? 'Звук включён' : 'Звук выключен';
    }
  }

  setQuality(value) {
    this.game.setRenderQuality(value);
    this.element.querySelectorAll('[data-quality-option]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.qualityOption === value);
    });
  }

  destroy() {
    this.element.removeEventListener('click', this.onClick);
    this.element.removeEventListener('input', this.onInput);
  }
}
