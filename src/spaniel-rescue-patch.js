import { GameScreen } from './screens/GameScreen.js';

const originalMount = GameScreen.prototype.mount;
const originalAttachCompanion = GameScreen.prototype.attachCompanion;
const originalUpdateLocalEffects = GameScreen.prototype.updateLocalEffects;

if (!GameScreen.prototype.__spanielRescuePatch) {
  GameScreen.prototype.__spanielRescuePatch = true;

  GameScreen.prototype.mount = function patchedMount() {
    this.previousCompanionRescues = this.controller?.stats?.companionRescues || 0;
    this.companionRescueMs = 0;
    this.companionRescueImpact = null;
    if (this.hasSpanielCompanion && this.controller?.stats) {
      this.controller.stats.companionRescueAvailable = true;
    }
    return originalMount.call(this);
  };

  GameScreen.prototype.updateLocalEffects = function patchedUpdateLocalEffects(snapshot, deltaMs) {
    originalUpdateLocalEffects.call(this, snapshot, deltaMs);

    const rescues = snapshot.stats.companionRescues || 0;
    if (rescues > (this.previousCompanionRescues || 0)) {
      this.companionRescueMs = 760;
      this.companionRescueImpact = snapshot.stats.lastCompanionRescue || null;
      this.spawnLocalEffect('spaniel_rescue_text', 'СПАНИЕЛЬ СПАС!');
      this.spawnCompanionSmashParticles?.(this.companionRescueImpact, snapshot);
      this.triggerScreenShake?.();
    }

    this.previousCompanionRescues = rescues;
    this.companionRescueMs = Math.max(0, (this.companionRescueMs || 0) - deltaMs);
    if ((this.companionRescueMs || 0) <= 0) this.companionRescueImpact = null;
  };

  GameScreen.prototype.attachCompanion = function patchedAttachCompanion(snapshot) {
    originalAttachCompanion.call(this, snapshot);
    if (!snapshot.companion) return;

    if ((this.companionRescueMs || 0) > 0) {
      const impact = this.companionRescueImpact || snapshot.stats.lastCompanionRescue;
      snapshot.playerHidden = this.companionRescueMs > 260;
      snapshot.companion.visualKey = 'spaniel_run';
      snapshot.companion.mode = 'rescue_smash';
      snapshot.companion.rescueMs = this.companionRescueMs;
      snapshot.companion.rescueTotalMs = 760;
      snapshot.companion.impactX = impact?.objectX ?? snapshot.player.x + 36;
      snapshot.companion.renderLane = impact?.lane ?? snapshot.player.renderLane;
      snapshot.companion.x = snapshot.player.x - 22;
    }
  };

  GameScreen.prototype.spawnCompanionSmashParticles = function spawnCompanionSmashParticles(impact, snapshot) {
    if (!impact) return;
    const lane = impact.lane ?? Math.round(snapshot.player.lane);
    const baseX = impact.objectX ?? snapshot.player.x + 42;
    const colors = ['#a7b0bd', '#657282', '#343b45', '#ffc247', '#5cebff'];
    for (let i = 0; i < 12; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      const heavyPiece = i < 5;
      this.localEffects.push({
        id: `smash_${i}_${Math.random().toString(36).slice(2)}`,
        type: 'smash_particle',
        label: '',
        shape: heavyPiece ? 'piece' : 'spark',
        x: baseX + side * (5 + i * 2),
        lane,
        vx: side * (heavyPiece ? 24 + i * 6 : 40 + i * 8),
        vy: heavyPiece ? -28 - (i % 4) * 7 : -38 - (i % 5) * 8,
        size: heavyPiece ? 7 + (i % 3) : 3 + (i % 3),
        rotation: (i * 0.72) % 3.14,
        color: colors[i % colors.length],
        ageMs: 0,
        durationMs: heavyPiece ? 520 : 360,
      });
    }
  };
}
