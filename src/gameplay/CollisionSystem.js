export class CollisionSystem {
  check(player, objects, stats) {
    for (const object of objects) {
      if (object.collected) continue;
      if (Math.round(player.lane) !== object.lane) continue;
      const distance = Math.abs(object.x - player.x);
      if (distance > (object.kind === 'collectible' ? 54 : 72)) continue;

      if (object.kind === 'collectible') {
        object.collected = true;
        stats.collect(object.resource, object.value);
        continue;
      }

      if (this.isDodged(player, object)) continue;
      if (player.hit()) {
        object.collected = true;
        stats.mistakes += 1;
      }
    }
  }

  isDodged(player, object) {
    if (object.dodge === 'jump') return player.isJumping;
    if (object.dodge === 'slide') return player.isSliding;
    return false;
  }
}
