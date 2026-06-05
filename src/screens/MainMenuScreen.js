import { menuPhrases } from '../data/texts.js';

const menuItems = [
  { action: 'play', label: 'Играть', icon: '▶', kind: 'primary' },
  { action: 'levels', label: 'Уровни', icon: '▱', kind: 'secondary' },
  { label: 'Склад — скоро', icon: '▤', kind: 'disabled' },
  { label: 'Магазин — скоро', icon: '🛒', kind: 'disabled' },
  { action: 'quality', label: 'Качество: auto', icon: '⚙', kind: 'secondary muted' },
];

const qualityLabels = {
  auto: 'Качество: авто',
  performance: 'Качество: FPS',
  quality: 'Качество: красиво',
};

function crewStatus(state, spanielPortrait) {
  const hasSpaniel = state.unlockedCompanions?.includes('spaniel');
  const hasHomeTechdir = Boolean(state.rewards?.skin_home_techdir);
  const skinLabel = hasHomeTechdir ? '<em>Скин: Домашний техдир</em>' : '';
  const spanielAvatar = hasSpaniel && spanielPortrait
    ? `<img class="crew-status__avatar" src="${spanielPortrait.meta.webp || spanielPortrait.meta.png}" alt="Боевой спаниель" />`
    : '';

  if (hasSpaniel) {
    return `<div class="crew-status is-unlocked ${hasHomeTechdir ? 'has-skin' : ''}" aria-label="Команда">${spanielAvatar}<span>Команда</span><strong>🐹 Хомяк + Боевой спаниель</strong>${skinLabel}</div>`;
  }
  return `<div class="crew-status ${hasHomeTechdir ? 'has-skin' : ''}" aria-label="Команда"><span>Команда</span><strong>🐹 Хомяк</strong>${skinLabel}</div>`;
}

export class MainMenuScreen {
  constructor(game) {
    this.game = game;
    this.element = document.createElement('section');
    this.element.className = 'screen menu-screen game-bg game-bg--menu';
    const phrase = menuPhrases[Math.floor(Math.random() * menuPhrases.length)];
    const hero = game.assets.get('hamster_run_01');
    const spanielPortrait = game.assets.get('spaniel_portrait');
    const renderQuality = game.state.settings.renderQuality || 'auto';
    this.element.innerHTML = `
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
        <button class="icon-button" type="button" aria-label="Настройки">⚙</button>
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
            <span ${item.action === 'quality' ? 'data-quality-label' : ''}>${item.action === 'quality' ? qualityLabels[renderQuality] : item.label}</span>
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
    `;
  }

  mount() {
    this.element.addEventListener('click', this.onClick);
  }

  onClick = (event) => {
    const action = event.target?.closest('[data-action]')?.dataset?.action;
    if (action === 'play') this.game.startLevel('dk_almost_ready');
    if (action === 'levels') this.game.showLevels();
    if (action === 'quality') {
      const next = this.game.cycleRenderQuality();
      const label = this.element.querySelector('[data-quality-label]');
      if (label) label.textContent = qualityLabels[next] || qualityLabels.auto;
    }
  };

  destroy() {
    this.element.removeEventListener('click', this.onClick);
  }
}
