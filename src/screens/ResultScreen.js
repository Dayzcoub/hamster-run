export class ResultScreen {
  constructor(game, result) {
    this.game = game;
    this.result = result;
    const jumpDodges = result.styleDodges?.jump || 0;
    const slideDodges = result.styleDodges?.slide || 0;
    this.element = document.createElement('section');
    this.element.className = 'screen result-screen';
    this.element.innerHTML = `
      <article class="result-card">
        <div class="kicker">Техсводка</div>
        <h2>${result.level.title}</h2>
        <div class="result-grade">${result.grade}</div>
        <p>${result.phrase}</p>
        <div class="result-stats">
          <div><strong>Выполнение</strong><br />${result.finalPercent}%</div>
          <div><strong>Хлеб</strong><br />${result.bread}</div>
          <div><strong>Косяки</strong><br />${result.mistakes}</div>
          <div><strong>Финты</strong><br />${result.stylePoints || 0}</div>
          <div><strong>Прыжок / подкат</strong><br />${jumpDodges} / ${slideDodges}</div>
          <div><strong>Очки</strong><br />${result.score}</div>
        </div>
        <div class="result-actions">
          <button data-action="retry">Повторить</button>
          <button data-action="levels">К уровням</button>
          <button data-action="menu">Главное меню</button>
        </div>
      </article>
    `;
  }

  mount() { this.element.addEventListener('click', this.onClick); }

  onClick = (event) => {
    const action = event.target?.dataset?.action;
    if (action === 'retry') this.game.startLevel(this.result.level.id);
    if (action === 'levels') this.game.showLevels();
    if (action === 'menu') this.game.showMainMenu();
  };

  destroy() { this.element.removeEventListener('click', this.onClick); }
}
