import { GameScreen } from './screens/GameScreen.js';

const originalAttachCompanion = GameScreen.prototype.attachCompanion;
const originalUpdateLocalEffects = GameScreen.prototype.updateLocalEffects;
const SPANIEL_BREAD_PICKUP_TOTAL_MS = 620;

if (!GameScreen.prototype.__spanielBreadPickupPatch) {
  GameScreen.prototype.__spanielBreadPickupPatch = true;

  GameScreen.prototype.updateLocalEffects = function patchedSpanielBreadPickupEffects(snapshot, deltaMs) {
    const pickupEvents = (snapshot.events || [])
      .filter((event) => event?.type === 'companion_bread_pickup');
    const companionBread = pickupEvents
      .reduce((sum, event) => sum + (Number(event.value) || 1), 0);

    const previousBread = this.previousBread || 0;
    const breadDelta = Math.max(0, (snapshot.stats?.bread || 0) - previousBread);
    const companionBreadDelta = Math.min(companionBread, breadDelta);

    if (companionBreadDelta > 0) {
      const pickup = pickupEvents[pickupEvents.length - 1];
      this.previousBread = previousBread + companionBreadDelta;
      this.spanielBreadPickupMs = SPANIEL_BREAD_PICKUP_TOTAL_MS;
      this.spanielBreadPickupImpact = {
        objectX: pickup?.x ?? snapshot.player.x - 48,
        lane: pickup?.companionLane ?? pickup?.lane ?? snapshot.player.renderLane,
      };
    }

    originalUpdateLocalEffects.call(this, snapshot, deltaMs);

    if (companionBreadDelta > 0) {
      this.spawnLocalEffect('pickup', `СПАНИК +${companionBreadDelta}`);
    }

    this.spanielBreadPickupMs = Math.max(0, (this.spanielBreadPickupMs || 0) - deltaMs);
    if ((this.spanielBreadPickupMs || 0) <= 0) this.spanielBreadPickupImpact = null;
  };

  GameScreen.prototype.attachCompanion = function patchedSpanielBreadPickupAttach(snapshot) {
    originalAttachCompanion.call(this, snapshot);
    if (!snapshot.companion) return;
    if ((this.companionRescueMs || 0) > 0) return;
    if ((this.spanielBreadPickupMs || 0) <= 0) return;

    const impact = this.spanielBreadPickupImpact || null;
    snapshot.companion.mode = 'bread_pickup_dash';
    snapshot.companion.pickupMs = this.spanielBreadPickupMs;
    snapshot.companion.pickupTotalMs = SPANIEL_BREAD_PICKUP_TOTAL_MS;
    snapshot.companion.pickupX = impact?.objectX ?? snapshot.player.x - 48;
    snapshot.companion.pickupLane = impact?.lane ?? snapshot.player.renderLane;
  };
}
