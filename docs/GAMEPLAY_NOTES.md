# Hamster Crew — Gameplay Notes

## Spaniel companion

Status: accepted working gameplay point.

The spaniel is an unlocked companion that follows the hamster during a run. It is not a full second player and should not take over the main package goal.

## Current companion behavior

### 1. Visual companion

- The spaniel runs behind / near the hamster.
- It uses the existing `spaniel_run` visual key.
- Rendering is handled by `src/render/CanvasRendererSpanielCompanion.js`.
- The companion must stay lightweight for mobile performance, especially on older Android devices.

### 2. One-time rescue

- The spaniel can save the hamster from one obstacle collision.
- Rescue uses the existing `companionRescueAvailable`, `companionRescueUsed`, and `companionRescues` fields in level stats.
- On rescue, the spaniel performs a short smash/dash animation.
- The game shows the feedback text:

```txt
СПАНИЕЛЬ СПАС!
```

Important rule:

```txt
Rescue is limited and should remain stronger than bread pickup.
```

### 3. Missed bread pickup

The spaniel also collects missed bread, but only as a bonus helper mechanic.

Accepted rules:

- It collects **only bread**.
- It must **not** collect package resources.
- It collects bread only when the bread is on an adjacent lane.
- It collects bread only after the bread has already passed the hamster.
- It collects bread only when the bread is close enough to the spaniel position.
- It does not affect package completion.
- It only increases bread/score.

Current constants in `src/gameplay/LevelController.js`:

```js
const COMPANION_BREAD_OFFSET_X = -58;
const COMPANION_BREAD_RADIUS_X = 76;
const COMPANION_BREAD_MISSED_X = 18;
const COMPANION_BREAD_MAX_LANE_DISTANCE = 1;
```

Current event emitted by gameplay logic:

```txt
companion_bread_pickup
```

Current feedback text:

```txt
СПАНИК +1
```

### 4. Bread pickup animation

When spaniel collects bread, it should visibly jump / dash to the adjacent lane, pick up the bread, and return to the hamster.

Current visual mode:

```txt
bread_pickup_dash
```

Current animation data placed on `snapshot.companion`:

```js
snapshot.companion.mode = 'bread_pickup_dash';
snapshot.companion.pickupMs = this.spanielBreadPickupMs;
snapshot.companion.pickupTotalMs = SPANIEL_BREAD_PICKUP_TOTAL_MS;
snapshot.companion.pickupX = impact?.objectX ?? snapshot.player.x - 48;
snapshot.companion.pickupLane = impact?.lane ?? snapshot.player.renderLane;
```

Current animation file:

```txt
src/render/CanvasRendererSpanielCompanion.js
```

Current state patch file:

```txt
src/spaniel-bread-pickup-patch.js
```

## Design intent

The spaniel should feel helpful and funny, but not overpowered.

It should:

- reward slightly messy play;
- create a warm companion moment;
- help with bonus bread;
- not solve the package objective for the player;
- not reduce the need to dodge obstacles;
- not add heavy visual effects.

## Performance constraints

Keep companion effects mobile-safe:

- no heavy canvas glow layers;
- no large particle bursts for bread pickup;
- no new runtime 3D;
- no expensive shadows/radial effects;
- reuse existing sprite and draw pipeline.

## Test checklist

Use a real phone test after any changes.

### Bread pickup test

1. Start a level with the spaniel unlocked.
2. Keep the hamster in the middle lane.
3. Let bread pass on the left or right adjacent lane.
4. Do not move the hamster to collect it.
5. Expected result:
   - spaniel jumps/dashes toward that lane;
   - bread counter increases;
   - `СПАНИК +1` appears;
   - package resource counters do not change.

### Rescue test

1. Hit an obstacle while rescue is still available.
2. Expected result:
   - spaniel rescue triggers;
   - hamster avoids losing the run immediately;
   - smash animation plays;
   - `СПАНИЕЛЬ СПАС!` appears;
   - rescue badge/availability updates correctly.

### Regression checks

- FPS must remain acceptable on old Android test device.
- Regular bread pickup by hamster still works.
- Package resources are not collected by spaniel.
- Result score includes extra bread collected by spaniel.
- Rescue and bread pickup animations should not overlap visually in a broken way.
