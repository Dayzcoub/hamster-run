export class LevelSelectScreen {
  constructor(game, levels) {
    this.game = game;
    this.levels = levels;
    this.element = document.createElement('section');
    this.element.className = 'screen levels-screen';
    this.render();
  }

  render() {
    this.element.innerHTML = `
      <header class="screen-header">
        <div>
          <div class="kicker">Кампания</div>
          <h2>Выбор уровня</h2>
        </div>
        <button data-action="back">Главное меню</button>
      </header>
      <div class="level-grid">
        ${this.levels.map((level) => this.levelCard(level)).join('')}
      </div>
    `;
  }

  levelCard(level) {
    const unlocked = this.game.isLevelUnlocked(level.id);
    const completed = this.game.state.completedLevels[level.id];
    return `
      <article class="level-card ${unlocked ? '' : 'locked'}">
        <span class="badge">${unlocked ? (completed ? `Лучший: ${completed.bestGrade}` : 'Доступен') : 'Заблокировано'}</span>
        <h3>${unlocked ? level.title : level.id === 'kids_room' ? '???' : level.title}</h3>
        <p>${unlocked ? level.short : level.id === 'kids_room' ? 'ТЗ отсутствует. Открывается после концерта.' : 'Пройдите предыдущий уровень.'}</p>
        <button data-level="${level.id}" ${unlocked ? '' : 'disabled'}>${unlocked ? 'Старт' : 'Закрыто'}</button>
      </article>
    `;
  }

  mount() { this.element.addEventListener('click', this.onClick); }

  onClick = (event) => {
    if (event.target?.dataset?.action === 'back') this.game.showMainMenu();
    const levelId = event.target?.dataset?.level;
    if (levelId) this.game.startLevel(levelId);
  };

  destroy() { this.element.removeEventListener('click', this.onClick); }
}
