export class ResultScreen {
  constructor(game, result) {
    this.game = game;
    this.result = result;
    const jumpDodges = result.styleDodges?.jump || 0;
    const slideDodges = result.styleDodges?.slide || 0;
    this.element = document.createElement('section');
    this.element.className = `screen result-screen game-bg game-bg--result result-screen--grade-${String(result.grade || 'd').toLowerCase()}`;
    this.element.innerHTML = `
      <article class="result-card game-panel">
        <div class="result-left">
          <div class="kicker">ТЕХСВОДКА</div>
          <h2>${result.level.title}</h2>
          <div class="result-grade" aria-label="Оценка ${result.grade}">${result.grade}</div>
          <p class="result-phrase"><span aria-hidden="true">🐹</span>${result.phrase}</p>
          <button class="btn-primary result-retry" data-action="retry" type="button"><span aria-hidden="true">▶</span>Повторить</button>
        </div>
        <div class="result-stats" aria-label="Статистика уровня">
          <div class="stat-card stat-card--progress">
            <i aria-hidden="true">◎</i>
            <strong>Выполнение</strong>
            <b>${result.finalPercent}%</b>
            <span class="mini-progress"><em data-progress="completion"></em></span>
          </div>
          <div class="stat-card"><i aria-hidden="true">🍞</i><strong>Хлеб</strong><b>${result.bread}</b></div>
          <div class="stat-card stat-card--danger"><i aria-hidden="true">⚠</i><strong>Косяки</strong><b>${result.mistakes}</b></div>
          <div class="stat-card"><i aria-hidden="true">☆</i><strong>Финты</strong><b>${result.stylePoints || 0}</b></div>
          <div class="stat-card"><i aria-hidden="true">👟</i><strong>Прыжок / подкат</strong><b>${jumpDodges} / ${slideDodges}</b></div>
          <div class="stat-card"><i aria-hidden="true">◇</i><strong>Очки</strong><b>${result.score}</b></div>
        </div>
        <div class="result-actions">
          <button class="btn-secondary" data-action="levels" type="button"><span aria-hidden="true">▱</span>К уровням</button>
          <button class="btn-secondary" data-action="menu" type="button"><span aria-hidden="true">⌂</span>Главное меню</button>
        </div>
      </article>
    `;
  }

  mount() {
    this.element.addEventListener('click', this.onClick);
    this.element.querySelector('[data-progress="completion"]').style.width = `${this.result.finalPercent}%`;
  }

  onClick = (event) => {
    const action = event.target?.closest('[data-action]')?.dataset?.action;
    if (action === 'retry') this.game.startLevel(this.result.level.id);
    if (action === 'levels') this.game.showLevels();
    if (action === 'menu') this.game.showMainMenu();
  };

  destroy() { this.element.removeEventListener('click', this.onClick); }
}
