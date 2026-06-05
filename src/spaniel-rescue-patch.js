import { GameScreen } from './screens/GameScreen.js';

const originalMount = GameScreen.prototype.mount;
const originalAttachCompanion = GameScreen.prototype.attachCompanion;
const originalUpdateLocalEffects = GameScreen.prototype.updateLocalEffects;

if (!GameScreen.prototype.__spanielRescuePatch) {
  GameScreen.prototype.__spanielRescuePatch = true;

  GameScreen.prototype.mount = function patchedMount() {
    this.previousCompanionRescues = this.controller?.stats?.companionRescues || 0;
    this.companionRescueMs = 0;
    if (this.hasSpanielCompanion && this.controller?.stats) {
      this.controller.stats.companionRescueAvailable = true;
    }
    return originalMount.call(this);
  };

  GameScreen.prototype.updateLocalEffects = function patchedUpdateLocalEffects(snapshot, deltaMs) {
    originalUpdateLocalEffects.call(this, snapshot, deltaMs);

    const rescues = snapshot.stats.companionRescues || 0;
    if (rescues > (this.previousCompanionRescues || 0)) {
      this.companionRescueMs = 820;
      this.spawnLocalEffect('clean', 'СПАНИЕЛЬ СПАС!');
      this.triggerScreenShake?.();
    }

    this.previousCompanionRescues = rescues;
    this.companionRescueMs = Math.max(0, (this.companionRescueMs || 0) - deltaMs);
  };

  GameScreen.prototype.attachCompanion = function patchedAttachCompanion(snapshot) {
    originalAttachCompanion.call(this, snapshot);
    if (!snapshot.companion) return;
    if ((this.companionRescueMs || 0) > 0 && this.game.assets.get('spaniel_rescue')) {
      snapshot.companion.visualKey = 'spaniel_rescue';
      snapshot.companion.x = snapshot.player.x - 38;
    }
  };
}
