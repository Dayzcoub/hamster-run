import { GameScreen } from './screens/GameScreen.js';

const originalMount = GameScreen.prototype.mount;
const originalUpdateHud = GameScreen.prototype.updateHud;

function ensureStyle() {
  if (document.getElementById('spaniel-rescue-hud-style')) return;
  const style = document.createElement('style');
  style.id = 'spaniel-rescue-hud-style';
  style.textContent = `
    .hud-chip__spaniel-rescue {
      display: inline-flex;
      align-items: center;
      gap: 0.12rem;
      margin-left: 0.34rem;
      padding-left: 0.34rem;
      border-left: 1px solid rgba(255,194,71,0.34);
      color: var(--accent-gold);
      font-weight: 950;
      white-space: nowrap;
    }

    .hud-chip__spaniel-rescue.is-used {
      opacity: 0.58;
      color: var(--text-muted);
    }

    @media (orientation: landscape) and (max-height: 560px) {
      .hud-chip__spaniel-rescue {
        margin-left: 0.22rem;
        padding-left: 0.22rem;
        gap: 0.04rem;
      }
    }
  `;
  document.head.appendChild(style);
}

if (!GameScreen.prototype.__spanielRescueHudPatch) {
  GameScreen.prototype.__spanielRescueHudPatch = true;

  GameScreen.prototype.mount = function patchedMount() {
    const result = originalMount.call(this);
    ensureStyle();
    if (this.hasSpanielCompanion) {
      const oldChip = this.element.querySelector('.hud-chip--spaniel-rescue');
      oldChip?.remove();

      const mistakesChip = this.element.querySelector('.hud-chip--danger');
      if (mistakesChip && !mistakesChip.querySelector('.hud-chip__spaniel-rescue')) {
        const rescue = document.createElement('span');
        rescue.className = 'hud-chip__spaniel-rescue';
        rescue.title = 'Заряд спасения спаниеля';
        rescue.innerHTML = '<i aria-hidden="true">🐶</i><strong data-hud-value="spaniel-rescue">1</strong>';
        mistakesChip.appendChild(rescue);
      }
    }
    return result;
  };

  GameScreen.prototype.updateHud = function patchedUpdateHud(snapshot) {
    originalUpdateHud.call(this, snapshot);
    const rescue = this.element.querySelector('.hud-chip__spaniel-rescue');
    if (!rescue) return;

    const available = snapshot.stats.companionRescueAvailable && !snapshot.stats.companionRescueUsed;
    const value = rescue.querySelector('[data-hud-value="spaniel-rescue"]');
    if (value) value.textContent = available ? '1' : '0';
    rescue.classList.toggle('is-used', !available);
  };
}
