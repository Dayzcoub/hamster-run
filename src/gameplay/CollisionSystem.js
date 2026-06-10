export class CollisionSystem {
  check(player, objects, stats) {
    const events = [];

    for (const object of objects) {
      if (object.collected) continue;

      const isObstacle = object.kind !== 'collectible';
      const inLane = this.isPlayerInObjectLane(player, object);
      const distance = Math.abs(object.x - player.x);
      const collisionDistance = object.kind === 'collectible' ? 54 : 72;

      if (isObstacle) {
        const passEvent = this.resolvePassedObstacle(player, object, stats);
        if (passEvent) events.push(passEvent);
      }

      if (!inLane) continue;
      if (distance > collisionDistance) continue;

      if (object.kind === 'collectible') {
        object.collected = true;
        stats.collect(object.resource, object.value);
        events.push({
          type: 'pickup',
          x: object.x,
          lane: object.lane,
          objectId: object.objectId,
          resource: object.resource,
          value: object.value || 1,
          visualKey: object.visualKey,
        });
        continue;
      }

      if (this.isDodged(player, object)) {
        object.dodgePending = true;
        object.dodgeAction = object.dodge;
        object.dodgeLane = Math.round(player.lane);
        object.dodgeDistance = Math.min(object.dodgeDistance ?? Number.POSITIVE_INFINITY, distance);
        continue;
      }

      if (stats.useCompanionRescue?.(object, player)) {
        object.collected = true;
        events.push({
          type: 'companion_rescue',
          x: object.x,
          lane: Math.round(player.lane),
          objectId: object.objectId,
          visualKey: object.visualKey,
        });
        continue;
      }

      if (player.hit()) {
        object.collected = true;
        stats.mistakes += 1;
        stats.resetStyleCombo?.();
        events.push({
          type: 'hit',
          x: object.x,
          lane: Math.round(player.lane),
          objectId: object.objectId,
          visualKey: object.visualKey,
        });
      }
    }

    return events;
  }

  resolvePassedObstacle(player, object, stats) {
    if (object.collected || object.passed) return null;
    const passedX = player.x - 78;
    if (object.x > passedX) return null;

    object.passed = true;

    if (!object.dodgePending) return null;

    object.collected = true;
    const style = stats.addStyleDodge?.(object.dodgeAction || object.dodge, object.dodgeDistance) || { points: 0, combo: 0 };
    return {
      type: 'style',
      action: object.dodgeAction || object.dodge,
      x: player.x + 28,
      lane: object.dodgeLane ?? Math.round(player.lane),
      objectId: object.objectId,
      visualKey: object.visualKey,
      points: style.points,
      combo: style.combo,
      precisionBonus: style.precisionBonus || 0,
      clean: Boolean(style.clean),
    };
  }

  isPlayerInObjectLane(player, object) {
    const playerLane = Math.round(player.lane);
    if (object.blockedLanes?.length) return object.blockedLanes.includes(playerLane);
    return playerLane === object.lane;
  }

  isDodged(player, object) {
    if (object.dodge === 'jump') return player.clearsHeight?.(object.clearanceHeight || 46) || false;
    if (object.dodge === 'slide') return player.isSliding;
    return false;
  }
}
