import { menuPhrases } from '../data/texts.js';

export class MainMenuScreen {
  constructor(game) {
    this.game = game;
    this.element = document.createElement('section');
    this.element.className = 'screen menu-screen';
    const phrase = menuPhrases[Math.floor(Math.random() * menuPhrases.length)];
    const hero = game.assets.get('hamster_run_01');
    this.element.innerHTML = `
      <div class="menu-hero">
        <div class="kicker">pseudo-isometric runner</div>
        <h1 class="title">HAMSTER<br />CREW</h1>
        <p class="subtitle">Хомяк на монтаже спасает мероприятия от кабелей, кофров, дедлайнов и бытового хаоса.</p>
        <div class="hero-card">${hero ? `<img class="hero-hamster" src="${hero.meta.webp}" alt="Хомяк-техник" />` : ''}</div>
        <div class="phrase">${phrase}</div>
      </div>
      <nav class="menu-actions" aria-label="Главное меню">
        <button class="primary" data-action="play">Играть</button>
        <button data-action="levels">Уровни</button>
        <button disabled>Склад — скоро</button>
        <button disabled>Магазин — скоро</button>
        <button data-action="settings">Настройки — позже</button>
      </nav>
    `;
  }

  mount() {
    this.element.addEventListener('click', this.onClick);
  }

  onClick = (event) => {
    const action = event.target?.dataset?.action;
    if (action === 'play') this.game.startLevel('dk_almost_ready');
    if (action === 'levels') this.game.showLevels();
  };

  destroy() {
    this.element.removeEventListener('click', this.onClick);
  }
}
