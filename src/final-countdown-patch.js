import { GameScreen } from './screens/GameScreen.js';

const STYLE_ID = 'hamster-final-countdown-style';
const BANNER_CLASS = 'is-visible';

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

    .last-ten-banner {
      position: absolute;
      z-index: 27;
      left: 50%;
      top: 40%;
      width: min(380px, 58vw);
      padding: clamp(10px, 2.2vh, 18px) clamp(18px, 4vw, 30px);
      border-radius: clamp(16px, 3.2vw, 24px);
      transform: translate(-50%, -50%);
      pointer-events: none;
      text-align: center;
      opacity: 0;
      color: var(--accent-warning);
      background: linear-gradient(180deg, rgba(35, 28, 20, 0.95), rgba(9, 14, 24, 0.9));
      border: 1px solid rgba(255, 194, 71, 0.5);
      box-shadow: 0 16px 46px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }

    .last-ten-banner strong {
      display: block;
      font-size: clamp(1.25rem, 4.5vw, 3rem);
      line-height: 0.95;
      letter-spacing: -0.035em;
      font-weight: 1000;
    }

    .last-ten-banner span {
      display: block;
      margin-top: 0.48rem;
      color: var(--accent-cyan);
      font-size: clamp(0.56rem, 1.5vw, 0.84rem);
      font-weight: 950;
      line-height: 1;
      text-transform: uppercase;
      letter-spacing: 0.16em;
    }

    .last-ten-banner.is-visible {
      animation: hamster-last-ten-banner 2.65s ease forwards;
    }

    @keyframes hamster-last-ten-banner {
      0% { opacity: 0; transform: translate(-50%, -45%) scale(0.98); }
      14% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      76% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      100% { opacity: 0; transform: translate(-50%, -54%) scale(0.98); }
    }

    @media (orientation: landscape) and (max-height: 560px) {
      .last-ten-banner {
        top: 42%;
        width: min(300px, 48vw);
        padding: 9px 16px;
        border-radius: 17px;
      }

      .last-ten-banner strong {
        font-size: clamp(1rem, 3.8vw, 2rem);
      }

      .last-ten-banner span {
        margin-top: 0.36rem;
        font-size: clamp(0.5rem, 1.35vw, 0.68rem);
      }
    }
  `;
  document.head.appendChild(style);
}

function ensureBanner(screen) {
  if (screen.lastTenBanner?.isConnected) return screen.lastTenBanner;
  const banner = document.createElement('aside');
  banner.className = 'last-ten-banner';
  banner.setAttribute('aria-live', 'polite');
  banner.innerHTML = '<strong>10 СЕКУНД!</strong><span>До сирены</span>';
  screen.element.appendChild(banner);
  screen.lastTenBanner = banner;
  return banner;
}

function showLastTenBanner(screen) {
  ensureFinalCountdownStyle();
  const banner = ensureBanner(screen);
  banner.classList.remove(BANNER_CLASS);
  void banner.offsetWidth;
  banner.classList.add(BANNER_CLASS);
  window.clearTimeout(screen.lastTenBannerTimer);
  screen.lastTenBannerTimer = window.setTimeout(() => banner.classList.remove(BANNER_CLASS), 2750);
}

const originalUpdateHud = GameScreen.prototype.updateHud;

GameScreen.prototype.updateHud = function updateHudWithFinalCountdown(snapshot) {
  originalUpdateHud?.call(this, snapshot);
  ensureFinalCountdownStyle();
  const seconds = remainingSeconds(snapshot);
  const active = seconds > 0 && seconds <= 10;
  this.element.classList.toggle('is-last-10-seconds', active);
  if (seconds === 10 && !this.lastTenAnnounced) {
    this.lastTenAnnounced = true;
    showLastTenBanner(this);
  }
};

const originalDestroy = GameScreen.prototype.destroy;

GameScreen.prototype.destroy = function destroyWithFinalCountdownCleanup(...args) {
  window.clearTimeout(this.lastTenBannerTimer);
  this.lastTenBanner?.remove();
  this.lastTenBanner = null;
  this.lastTenAnnounced = false;
  return originalDestroy?.apply(this, args);
};
