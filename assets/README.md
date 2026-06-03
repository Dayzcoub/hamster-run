# PACK.IT RUN — Assets v0.1

Repo-ready asset structure for the first playable prototype.

## Contents

### Character

- hamster_run_01
- hamster_jump
- hamster_slide
- hamster_hit
- hamster_celebrate

### Collectibles

- bread
- cable_coil
- c2_connector
- bolt
- stage_deck

### Obstacles

- flight_case
- cable_loop
- mic_stand
- mystery_box
- cart

## Runtime

Use `assets/manifest.json`.

Recommended behavior:

```js
const imagePath = supportsWebP ? sprite.webp : sprite.png;
```

## Status

`repo-ready clean-pass`.

These assets are approved for the first v0.1 gameplay prototype. Scale and anchors should be tuned after first in-game render.
