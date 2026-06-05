import { GameScreen } from './screens/GameScreen.js';

const STYLE_ID = 'hamster-final-countdown-style';

function remainingSeconds(snapshot) {
  const durationMs = (snapshot?.level?.duration || 0) * 1000;
  const remainingMs = Math.max(0, durationMs - (snapshot?.elapsedMs || 0));
  return Math.ceil(remainingMs / 1000);
}

function ensureFinalCountdownStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .game-screen.is-last-10-seconds .hud-timer {
      color: var(--accent-warning);
      text-shadow: 0 0 16px rgba(255, 194, 71, 0.42);
    }

    .game-screen.is-last-10-seconds .hud-status {
      border-color: rgba(255, 194, 71, 0.48);
    }

    .game-screen.is-last-10-seconds::before {
      content: "10 СЕКУНД!";
      position: absolute;
      z-index: 25;
      left: 50%;
      top: 40%;
      width: min(380px, 58vw);
      padding: clamp(10px, 2.2vh, 18px) clamp(18px, 4vw, 30px);
      border-radius: clamp(16px, 3.2vw, 24px);
      transform: translate(-50%, -50%);
      pointer-events: none;
      text-align: center;
      color: var(--accent-warning);
      font-size: clamp(1.25rem, 4.5vw, 3rem);
      line-height: 0.95;
      letter-spacing: -0.035em;
      font-weight: 1000;
      background: linear-gradient(180deg, rgba(35, 28, 20, 0.95), rgba(9, 14, 24, 0.9));
      border: 1px solid rgba(255, 194, 71, 0.5);
      box-shadow: 0 16px 46px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.08);
      animation: hamster-last-ten-banner 2.4s ease forwards;
    }

    .game-screen.is-last-10-seconds::after {
      content: "До сирены";
      position: absolute;
      z-index: 26;
      left: 50%;
      top: calc(40% + clamp(36px, 7vw, 62px));
      transform: translateX(-50%);
      pointer-events: none;
      color: var(--accent-cyan);
      font-size: clamp(0.56rem, 1.5vw, 0.84rem);
      font-weight: 950;
      line-height: 1;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      animation: hamster-last-ten-banner 2.4s ease forwards;
    }

    @keyframes hamster-last-ten-banner {
      0% { opacity: 0; transform: translate(-50%, -45%) scale(0.98); }
      14% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      76% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      100% { opacity: 0; transform: translate(-50%, -54%) scale(0.98); }
    }

    @media (orientation: landscape) and (max-height: 560px) {
      .game-screen.is-last-10-seconds::before {
        top: 42%;
        width: min(300px, 48vw);
        padding: 9px 16px;
        border-radius: 17px;
        font-size: clamp(1rem, 3.8vw, 2rem);
      }

      .game-screen.is-last-10-seconds::after {
        top: calc(42% + clamp(30px, 5.6vw, 48px));
        font-size: clamp(0.5rem, 1.35vw, 0.68rem);
      }
    }
  `;
  document.head.appendChild(style);
}

const originalUpdateHud = GameScreen.prototype.updateHud;

GameScreen.prototype.updateHud = function updateHudWithFinalCountdown(snapshot) {
  originalUpdateHud?.call(this, snapshot);
  ensureFinalCountdownStyle();
  const seconds = remainingSeconds(snapshot);
  const active = seconds > 0 && seconds <= 10;
  this.element.classList.toggle('is-last-10-seconds', active);
};
