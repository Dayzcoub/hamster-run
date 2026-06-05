import { GameScreen } from './screens/GameScreen.js';

const STYLE_ID = 'hamster-hit-feedback-style';
const FLASH_CLASS = 'is-visible';

function ensureHitFeedbackStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .hit-flash-overlay {
      position: absolute;
      inset: 0;
      z-index: 19;
      pointer-events: none;
      opacity: 0;
      background:
        radial-gradient(circle at 36% 54%, rgba(255, 194, 71, 0.18), transparent 34%),
        linear-gradient(90deg, rgba(255, 70, 70, 0.2), transparent 28%, transparent 72%, rgba(255, 122, 42, 0.14));
      mix-blend-mode: screen;
    }

    .hit-flash-overlay.is-visible {
      animation: hamster-hit-flash 280ms ease-out forwards;
    }

    @keyframes hamster-hit-flash {
      0% { opacity: 0; }
      18% { opacity: 1; }
      100% { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

function ensureHitFlashNode(screen) {
  if (screen.hitFlashNode?.isConnected) return screen.hitFlashNode;
  const node = document.createElement('div');
  node.className = 'hit-flash-overlay';
  node.setAttribute('aria-hidden', 'true');
  screen.element.appendChild(node);
  screen.hitFlashNode = node;
  return node;
}

const originalTriggerScreenShake = GameScreen.prototype.triggerScreenShake;

GameScreen.prototype.triggerScreenShake = function triggerScreenShakeWithHitFlash(...args) {
  originalTriggerScreenShake?.apply(this, args);
  ensureHitFeedbackStyle();
  const node = ensureHitFlashNode(this);
  node.classList.remove(FLASH_CLASS);
  // Restart the CSS animation even on rapid repeated hits.
  void node.offsetWidth;
  node.classList.add(FLASH_CLASS);
  window.clearTimeout(this.hitFlashTimer);
  this.hitFlashTimer = window.setTimeout(() => node.classList.remove(FLASH_CLASS), 320);
};

const originalDestroy = GameScreen.prototype.destroy;

GameScreen.prototype.destroy = function destroyWithHitFlashCleanup(...args) {
  window.clearTimeout(this.hitFlashTimer);
  this.hitFlashNode?.remove();
  this.hitFlashNode = null;
  return originalDestroy?.apply(this, args);
};
