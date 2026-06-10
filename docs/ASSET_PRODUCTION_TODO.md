# Hamster Crew — Asset Production TODO

## Project

- Repo: `Dayzcoub/hamster-run`
- GitHub Pages: `dayzcoub.github.io`
- Purpose: track missing game-ready obstacle assets that need to be prepared and added to the game.

## Goal

Prepare final transparent 2D obstacle sprites for the themed levels. Most of these `visualKey` values are already wired in code with temporary fallback sprites, so final art can be added gradually without breaking the game.

## General requirements for all new assets

- One object or one obstacle setup per image.
- Transparent background with clean alpha.
- No white card, no box, no backdrop, no floor, no UI elements.
- No text or logos.
- Object must not touch image edges.
- Strong readable silhouette on a small mobile screen.
- Unified style across the full set.
- Style: slightly cartoonish game 2D / light 3/4 / pseudo-isometric, clean shapes, readable volume.
- Not photorealistic, not flat icon, not pixel art.
- Avoid strong baked shadows that make alpha cleanup difficult.

## Technical format

Primary format:

```txt
PNG with transparency
```

Recommended additional format:

```txt
WebP with transparency
```

Target paths:

```txt
assets/sprites/obstacles/png/<asset_name>.png
assets/sprites/obstacles/webp/<asset_name>.webp
```

## Gameplay rule for obstacle art

The obstacle type must be visually clear:

```txt
jump       = object stands on the floor / player jumps over it
slide      = something hangs or crosses above / player slides under it
lane_change = object blocks lanes / player must move to a free lane
```

Do not use random floor objects as slide obstacles. Slide obstacles should read as an arch, low truss, carried long object, hanging cables, or another overhead/underpass situation.

---

# Priority 1 — required production assets

## Wedding Tent

### `wedding_generator`

- Level: `wedding_tent`
- Type: `jump`
- File paths:
  - `assets/sprites/obstacles/png/wedding_generator.png`
  - `assets/sprites/obstacles/webp/wedding_generator.webp`
- Description: small portable event/wedding generator.
- Visual notes:
  - Compact but clearly readable as a generator.
  - Can have wheels, handle, vents, rugged case body.
  - Should feel like event production equipment, not a home appliance.
- Current fallback: `cart`

### `wedding_wet_cable`

- Level: `wedding_tent`
- Type: `jump`
- File paths:
  - `assets/sprites/obstacles/png/wedding_wet_cable.png`
  - `assets/sprites/obstacles/webp/wedding_wet_cable.webp`
- Description: wet cable lying messily on the floor.
- Visual notes:
  - Not a perfect coil; should look like a messy trip hazard.
  - Can include a subtle wet/glossy hint, but no separate floor patch.
  - Must remain readable and not become tiny visual noise.
- Current fallback: `cable_loop`

### `wedding_guest_chair`

- Level: `wedding_tent`
- Type: `jump`
- File paths:
  - `assets/sprites/obstacles/png/wedding_guest_chair.png`
  - `assets/sprites/obstacles/webp/wedding_guest_chair.webp`
- Description: banquet/wedding guest chair in the way.
- Visual notes:
  - Wedding or banquet chair silhouette.
  - Not too thin; should read clearly as a solid obstacle.
  - Slightly funny “wrong place at the wrong time” feel.
- Current fallback: `mystery_box`

### `wedding_decor_arch`

- Level: `wedding_tent`
- Type: `slide`
- File paths:
  - `assets/sprites/obstacles/png/wedding_decor_arch.png`
  - `assets/sprites/obstacles/webp/wedding_decor_arch.webp`
- Description: low wedding decor arch that the hamster slides under.
- Visual notes:
  - Decorative wedding arch with fabric, ribbons, flowers, or garland.
  - Must clearly create an underpass/overhead shape.
  - The player should immediately understand: slide under it.
- Current fallback: `mic_stand`

## Big Concert

### `concert_subwoofer`

- Level: `big_concert`
- Type: `jump`
- File paths:
  - `assets/sprites/obstacles/png/concert_subwoofer.png`
  - `assets/sprites/obstacles/webp/concert_subwoofer.webp`
- Description: single concert subwoofer.
- Visual notes:
  - Heavy, dark, stage-audio object.
  - Should read as a sub, not as a generic flight case.
  - Large grille/front face is useful for readability.
- Current fallback: `flight_case`

### `concert_smoke_machine`

- Level: `big_concert`
- Type: `jump`
- File paths:
  - `assets/sprites/obstacles/png/concert_smoke_machine.png`
  - `assets/sprites/obstacles/webp/concert_smoke_machine.webp`
- Description: compact stage smoke machine.
- Visual notes:
  - Small stage device with body, handle, nozzle.
  - Avoid too much smoke cloud; asset should remain a solid obstacle.
  - Slight comic/game styling is good.
- Current fallback: `mystery_box`

### `concert_cases_with_truss`

- Level: `big_concert`
- Type: `slide`
- File paths:
  - `assets/sprites/obstacles/png/concert_cases_with_truss.png`
  - `assets/sprites/obstacles/webp/concert_cases_with_truss.webp`
- Description: two flight cases with a long truss/pipe/decor bar lying across the top; hamster slides underneath.
- Visual notes:
  - Two cases act as supports.
  - Long truss or pipe spans between them.
  - Must read as an overhead/underpass obstacle, not a floor object.
- Current fallback: `mic_stand`

### `concert_stagehands_carrying_truss`

- Level: `big_concert`
- Type: `slide`
- File paths:
  - `assets/sprites/obstacles/png/concert_stagehands_carrying_truss.png`
  - `assets/sprites/obstacles/webp/concert_stagehands_carrying_truss.webp`
- Description: two stagehands/loaders carrying a long truss or pipe; hamster slides under the carried object.
- Visual notes:
  - Two tech workers, one on each side.
  - Long truss/pipe between them at slide height.
  - Should feel funny and alive, but must stay readable on mobile.
- Current fallback: `mic_stand`

## Kids Room

### `kids_toy_car`

- Level: `kids_room`
- Type: `jump`
- File paths:
  - `assets/sprites/obstacles/png/kids_toy_car.png`
  - `assets/sprites/obstacles/webp/kids_toy_car.webp`
- Description: bright toy car.
- Visual notes:
  - Childlike, colorful, readable silhouette.
  - Not too tiny; should be a clear obstacle.
- Current fallback: `cart`

### `kids_blocks`

- Level: `kids_room`
- Type: `jump`
- File paths:
  - `assets/sprites/obstacles/png/kids_blocks.png`
  - `assets/sprites/obstacles/webp/kids_blocks.webp`
- Description: small pile of children’s blocks.
- Visual notes:
  - Must read as several toy blocks, not a generic box.
  - Compact pile, clear silhouette.
- Current fallback: `mystery_box`

### `kids_sock_trap`

- Level: `kids_room`
- Type: `jump`
- File paths:
  - `assets/sprites/obstacles/png/kids_sock_trap.png`
  - `assets/sprites/obstacles/webp/kids_sock_trap.webp`
- Description: funny sock trap / scattered socks.
- Visual notes:
  - One or several socks, but not too small.
  - Should read as messy/funny obstacle.
- Current fallback: `cable_loop`

---

# Priority 2 — later expansion ideas

### `concert_moving_head`

- Recommended type: `jump`
- Description: floor standing moving head light fixture.
- Note: not recommended as a slide obstacle because a moving head on the floor does not explain the slide action well.

### `concert_hanging_cables`

- Recommended type: `slide`
- Description: cables hanging from above, player slides underneath.

### `concert_ladder_light_bar`

- Recommended type: `slide`
- Description: lighting tech on a ladder or ladder with a low hanging light bar.

### `wedding_ladder_decor`

- Recommended type: `slide`
- Description: decorator on ladder / fabric / garland hanging low enough to slide under.

---

# Already existing / not needed now

Existing collectibles:

```txt
powercon
tape
led
truss
```

Existing base obstacles:

```txt
case
cable_loop
mic_stand
mystery_box
cart
truss_section_left
truss_section_right
```

---

# Production checklist

| Asset | Level | Type | Priority | Status | Current fallback |
|---|---|---:|---:|---|---|
| `wedding_generator` | Wedding Tent | jump | 1 | missing art | `cart` |
| `wedding_wet_cable` | Wedding Tent | jump | 1 | missing art | `cable_loop` |
| `wedding_guest_chair` | Wedding Tent | jump | 1 | missing art | `mystery_box` |
| `wedding_decor_arch` | Wedding Tent | slide | 1 | missing art | `mic_stand` |
| `concert_subwoofer` | Big Concert | jump | 1 | missing art | `flight_case` |
| `concert_smoke_machine` | Big Concert | jump | 1 | missing art | `mystery_box` |
| `concert_cases_with_truss` | Big Concert | slide | 1 | missing art | `mic_stand` |
| `concert_stagehands_carrying_truss` | Big Concert | slide | 1 | missing art | `mic_stand` |
| `kids_toy_car` | Kids Room | jump | 1 | missing art | `cart` |
| `kids_blocks` | Kids Room | jump | 1 | missing art | `mystery_box` |
| `kids_sock_trap` | Kids Room | jump | 1 | missing art | `cable_loop` |
| `concert_moving_head` | Big Concert | jump | 2 | optional later | `mic_stand` |
| `concert_hanging_cables` | Big Concert | slide | 2 | idea only | — |
| `concert_ladder_light_bar` | Big Concert | slide | 2 | idea only | — |
| `wedding_ladder_decor` | Wedding Tent | slide | 2 | idea only | — |

---

# Integration note

When final files are added to the target folders with matching names, the optional themed obstacle loader will pick them up automatically. Until then, the game uses fallback sprites and should remain playable.
