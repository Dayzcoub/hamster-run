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
      this.companionRescueMs = 620;
      this.companionRescueImpact = snapshot.stats.lastCompanionRescue || null;
      this.spawnLocalEffect('clean', 'СПАНИЕЛЬ СПАС!');
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
      snapshot.playerHidden = this.companionRescueMs > 180;
      snapshot.companion.visualKey = 'spaniel_run';
      snapshot.companion.mode = 'rescue_smash';
      snapshot.companion.rescueMs = this.companionRescueMs;
      snapshot.companion.impactX = impact?.objectX ?? snapshot.player.x + 36;
      snapshot.companion.renderLane = impact?.lane ?? snapshot.player.renderLane;
      snapshot.companion.x = snapshot.player.x - 22;
    }
  };

  GameScreen.prototype.spawnCompanionSmashParticles = function spawnCompanionSmashParticles(impact, snapshot) {
    if (!impact) return;
    const lane = impact.lane ?? Math.round(snapshot.player.lane);
    const baseX = impact.objectX ?? snapshot.player.x + 42;
    const colors = ['#ffc247', '#9aa8b8', '#5cebff'];
    for (let i = 0; i < 10; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      this.localEffects.push({
        id: `smash_${i}_${Math.random().toString(36).slice(2)}`,
        type: 'smash_particle',
        label: '',
        x: baseX + side * (6 + i * 2),
        lane,
        vx: side * (30 + i * 7),
        vy: -34 - (i % 5) * 8,
        size: 4 + (i % 4),
        color: colors[i % colors.length],
        ageMs: 0,
        durationMs: 420,
      });
    }
  };
}
