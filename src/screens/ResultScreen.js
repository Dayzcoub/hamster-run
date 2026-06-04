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

function packageProgress(result) {
  const targets = result.level.targetResources || {};
  const entries = Object.entries(targets);
  const targetTotal = entries.reduce((sum, [, value]) => sum + value, 0);
  const collectedTotal = entries.reduce((sum, [key, value]) => {
    const collected = key === 'bread' ? result.bread : result.resources?.[key] || 0;
    return sum + Math.min(value, collected);
  }, 0);
  const summary = entries
    .map(([key, value]) => {
      const collected = key === 'bread' ? result.bread : result.resources?.[key] || 0;
      return `${RESOURCE_LABELS[key] || key} ${Math.min(value, collected)}/${value}`;
    })
    .join(' · ');

  return { targetTotal, collectedTotal, summary };
}

function resultTip(result) {
  const progress = packageProgress(result);
  if (result.mistakes > 0) return 'Меньше косяков: каждый косяк режет выполнение примерно на 10%.';
  if (progress.collectedTotal < progress.targetTotal) return 'Добери пакет: оценка растёт от нужных ресурсов, хлеб отдельно даёт очки.';
  if ((result.stylePoints || 0) < 220) return 'Больше финтов: прыгай и подкатывайся впритык к препятствиям ради бонусов.';
  if (result.bestStyleCombo < 3) return 'Собери серию финтов подряд: комбо быстрее поднимает итоговые очки.';
  return 'Отличный монтаж. Теперь можно выбивать S-рейтинг и рекорд очков.';
}

function recordLabel(result) {
  if (result.isFirstClear) return 'Первый проход';
  if (result.isNewRecord) return 'Новый рекорд';
  return 'Лучший результат';
}

export class ResultScreen {
  constructor(game, result) {
    this.game = game;
    this.result = result;
    const jumpDodges = result.styleDodges?.jump || 0;
    const slideDodges = result.styleDodges?.slide || 0;
    const bestScore = result.bestScore ?? result.score;
    const previousBestScore = result.previousBestScore || 0;
    const deltaScore = result.score - previousBestScore;
    const packageInfo = packageProgress(result);
    this.element = document.createElement('section');
    this.element.className = `screen result-screen game-bg game-bg--result result-screen--grade-${String(result.grade || 'd').toLowerCase()} ${result.isNewRecord ? 'result-screen--record' : ''}`;
    this.element.innerHTML = `
      <article class="result-card game-panel">
        <div class="result-left">
          <div class="kicker">ТЕХСВОДКА</div>
          <h2>${result.level.title}</h2>
          <div class="result-grade" aria-label="Оценка ${result.grade}">${result.grade}</div>
          <p class="result-phrase"><span aria-hidden="true">🐹</span>${result.phrase}</p>
          <div class="result-package" aria-label="Пакет ресурсов">
            <span>Пакет</span>
            <strong>${packageInfo.collectedTotal}/${packageInfo.targetTotal}</strong>
            <small>${packageInfo.summary}</small>
          </div>
          <div class="result-record ${result.isNewRecord ? 'is-new-record' : ''}" aria-label="Рекорд уровня">
            <span>${recordLabel(result)}</span>
            <strong>${bestScore}</strong>
            ${result.isNewRecord && previousBestScore > 0 ? `<b>+${deltaScore}</b>` : ''}
          </div>
          <p class="result-tip"><span aria-hidden="true">▸</span>${resultTip(result)}</p>
          <button class="btn-primary result-retry" data-action="retry" type="button"><span aria-hidden="true">▶</span>Повторить</button>
        </div>
        <div class="result-stats" aria-label="Статистика уровня">
          <div class="stat-card stat-card--progress">
            <i aria-hidden="true">◎</i>
            <strong>Выполнение</strong>
            <b>${result.finalPercent}%</b>
            <span class="mini-progress"><em data-progress="completion"></em></span>
          </div>
          <div class="stat-card stat-card--package"><i aria-hidden="true">📦</i><strong>Пакет</strong><b>${packageInfo.collectedTotal}/${packageInfo.targetTotal}</b></div>
          <div class="stat-card"><i aria-hidden="true">🍞</i><strong>Хлеб</strong><b>${result.bread}</b></div>
          <div class="stat-card stat-card--danger"><i aria-hidden="true">⚠</i><strong>Косяки</strong><b>${result.mistakes}</b></div>
          <div class="stat-card"><i aria-hidden="true">☆</i><strong>Финты</strong><b>${result.stylePoints || 0}</b></div>
          <div class="stat-card stat-card--record"><i aria-hidden="true">🏆</i><strong>Рекорд</strong><b>${bestScore}</b></div>
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
