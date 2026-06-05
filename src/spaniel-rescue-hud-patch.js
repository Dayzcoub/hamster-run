import { GameScreen } from './screens/GameScreen.js';

const originalMount = GameScreen.prototype.mount;
const originalUpdateHud = GameScreen.prototype.updateHud;

function ensureStyle() {
  if (document.getElementById('spaniel-rescue-hud-style')) return;
  const style = document.createElement('style');
  style.id = 'spaniel-rescue-hud-style';
  style.textContent = `
    .hud-chip--spaniel-rescue {
      border-color: rgba(255,194,71,0.46);
      background: linear-gradient(180deg, rgba(255,194,71,0.12), rgba(8,16,28,0.84));
    }

    .hud-chip--spaniel-rescue strong {
      color: var(--accent-gold);
    }

    .hud-chip--spaniel-rescue.is-used {
      opacity: 0.62;
      border-color: rgba(160,176,196,0.26);
      background: rgba(8,16,28,0.62);
    }

    .hud-chip--spaniel-rescue.is-used strong {
      color: var(--text-muted);
    }

    @media (orientation: landscape) and (max-height: 560px) {
      .hud-chip--spaniel-rescue b {
        max-width: 76px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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
      const chips = this.element.querySelector('.hud-chips');
      if (chips && !chips.querySelector('.hud-chip--spaniel-rescue')) {
        const chip = document.createElement('span');
        chip.className = 'hud-chip hud-chip--spaniel-rescue';
        chip.innerHTML = '<i aria-hidden="true">🐶</i><b>Спасение</b><strong data-hud-value="spaniel-rescue">1/1</strong>';
        chips.appendChild(chip);
      }
    }
    return result;
  };

  GameScreen.prototype.updateHud = function patchedUpdateHud(snapshot) {
    originalUpdateHud.call(this, snapshot);
    const rescueChip = this.element.querySelector('.hud-chip--spaniel-rescue');
    if (!rescueChip) return;

    const available = snapshot.stats.companionRescueAvailable && !snapshot.stats.companionRescueUsed;
    const value = rescueChip.querySelector('[data-hud-value="spaniel-rescue"]');
    if (value) value.textContent = available ? '1/1' : '0/1';
    rescueChip.classList.toggle('is-used', !available);
  };
}
