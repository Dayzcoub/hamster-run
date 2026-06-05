import './hit-feedback-patch.js';
import './final-countdown-patch.js';
import { Game } from './core/Game.js';

const app = document.querySelector('#app');
const game = new Game(app);

game.start().catch((error) => {
  console.error(error);
  app.innerHTML = `
    <section class="screen screen--error">
      <h1>HAMSTER CREW</h1>
      <p>Не удалось запустить игру.</p>
      <pre>${String(error?.message || error)}</pre>
    </section>
  `;
});
