import { previewForLevel } from '../data/levelPreviews.js';

export class LevelSelectScreen {
  constructor(game, levels) {
    this.game = game;
    this.levels = levels;
    this.element = document.createElement('section');
    this.element.className = 'screen levels-screen game-bg game-bg--levels';
    this.render();
  }

  render() {
    this.element.innerHTML = `
      <header class="screen-header levels-header">
        <div>
          <div class="kicker">КАМПАНИЯ</div>
          <h2>Выбор уровня</h2>
          <div class="title-rule" aria-hidden="true"><span></span><i>⚡</i></div>
        </div>
        <button class="btn-secondary nav-home" data-action="back" type="button"><span aria-hidden="true">⌂</span> Главное меню</button>
      </header>
      <div class="level-grid" aria-label="Уровни кампании">
        ${this.levels.map((level, index) => this.levelCard(level, index)).join('')}
      </div>
      <button class="btn-secondary back-floating" data-action="back" type="button"><span aria-hidden="true">←</span> Назад</button>
    `;
  }

  levelCard(level, index) {
    const unlocked = this.game.isLevelUnlocked(level.id);
    const completed = this.game.state.completedLevels[level.id];
    const passed = Boolean(completed?.passed);
    const isSecret = level.id === 'kids_room' && !unlocked;
    const preview = previewForLevel(level);
    const previewImage = preview?.png
      ? `<picture class="mission-card__picture"><source srcset="${preview.webp || preview.png}" type="image/webp" /><img class="mission-card__preview" src="${preview.png}" alt="" loading="lazy" decoding="async" /></picture>`
      : '';
    const badge = unlocked
      ? completed
        ? passed
          ? `Сдано: ${completed.bestGrade}`
          : `Доработка: ${completed.bestGrade}`
        : 'Доступен'
      : 'Заблокировано';
    const title = isSecret ? '???' : level.title;
    const description = unlocked
      ? level.short
      : isSecret
        ? 'ТЗ отсутствует. Открывается после концерта.'
        : 'Сдайте предыдущий уровень минимум на C.';
    const stateClass = unlocked
      ? passed
        ? 'is-completed'
        : completed
          ? 'is-revision'
          : index === 0
            ? 'is-active'
            : 'is-available'
      : 'is-locked';
    return `
      <article class="mission-card mission-card--${level.theme} ${stateClass}">
        <div class="mission-card__art" aria-hidden="true">${previewImage}</div>
        <div class="mission-card__shade" aria-hidden="true"></div>
        <span class="badge ${unlocked ? passed ? 'badge--passed' : completed ? 'badge--revision' : '' : 'badge--locked'}">${unlocked ? '' : '<i>🔒</i>'}${badge}</span>
        <h3>${title}</h3>
        <div class="mission-rule" aria-hidden="true"><span></span><i>⚡</i><span></span></div>
        <p>${description}</p>
        <button class="${unlocked ? 'btn-primary' : 'btn-disabled'}" data-level="${level.id}" ${unlocked ? '' : 'disabled'} type="button">
          <span aria-hidden="true">${unlocked ? '▶' : '🔒'}</span>
          ${unlocked ? completed && !passed ? 'Переделать' : 'Старт' : 'Закрыто'}
        </button>
      </article>
    `;
  }

  mount() { this.element.addEventListener('click', this.onClick); }

  onClick = (event) => {
    if (event.target?.closest('[data-action]')?.dataset?.action === 'back') this.game.showMainMenu();
    const levelId = event.target?.closest('[data-level]')?.dataset?.level;
    if (levelId) this.game.startLevel(levelId);
  };

  destroy() { this.element.removeEventListener('click', this.onClick); }
}
