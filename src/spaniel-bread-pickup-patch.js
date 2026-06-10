import { GameScreen } from './screens/GameScreen.js';

const originalUpdateLocalEffects = GameScreen.prototype.updateLocalEffects;

if (!GameScreen.prototype.__spanielBreadPickupPatch) {
  GameScreen.prototype.__spanielBreadPickupPatch = true;

  GameScreen.prototype.updateLocalEffects = function patchedSpanielBreadPickupEffects(snapshot, deltaMs) {
    const companionBread = (snapshot.events || [])
      .filter((event) => event?.type === 'companion_bread_pickup')
      .reduce((sum, event) => sum + (Number(event.value) || 1), 0);

    const previousBread = this.previousBread || 0;
    const breadDelta = Math.max(0, (snapshot.stats?.bread || 0) - previousBread);
    const companionBreadDelta = Math.min(companionBread, breadDelta);

    if (companionBreadDelta > 0) {
      this.previousBread = previousBread + companionBreadDelta;
    }

    originalUpdateLocalEffects.call(this, snapshot, deltaMs);

    if (companionBreadDelta > 0) {
      this.spawnLocalEffect('pickup', `СПАНИК +${companionBreadDelta}`);
    }
  };
}
