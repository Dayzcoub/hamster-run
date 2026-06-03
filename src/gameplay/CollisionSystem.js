export class CollisionSystem {
  check(player, objects, stats) {
    const events = [];

    for (const object of objects) {
      if (object.collected) continue;
      if (Math.round(player.lane) !== object.lane) continue;
      const distance = Math.abs(object.x - player.x);
      if (distance > (object.kind === 'collectible' ? 54 : 72)) continue;

      if (object.kind === 'collectible') {
        object.collected = true;
        stats.collect(object.resource, object.value);
        events.push({
          type: 'pickup',
          x: object.x,
          lane: object.lane,
          resource: object.resource,
          value: object.value || 1,
          visualKey: object.visualKey,
        });
        continue;
      }

      if (this.isDodged(player, object)) continue;
      if (player.hit()) {
        object.collected = true;
        stats.mistakes += 1;
        events.push({
          type: 'hit',
          x: object.x,
          lane: object.lane,
          visualKey: object.visualKey,
        });
      }
    }

    return events;
  }

  isDodged(player, object) {
    if (object.dodge === 'jump') return player.isJumping;
    if (object.dodge === 'slide') return player.isSliding;
    return false;
  }
}
