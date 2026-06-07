# Truss obstacle asset rework TODO

## Current temporary state

The Big Concert truss obstacle is currently usable, but its artwork is not final.

Temporary baked visual tuning:

```js
scale: 0.78
lift: 15
rotation: -9
```

These values compensate the current PNG so it looks acceptable in gameplay. This is only a temporary visual correction, not the final art direction.

## Problem

The current truss section asset still does not naturally sit on the floor plane of the game background. It needs code-side scale, lift, and rotation compensation to feel close enough.

The final version should not depend on heavy visual correction in the renderer.

## Future art requirement

Create a new clean truss obstacle asset that:

- has transparent background and clean alpha channel;
- has no white/card/checker/product-render background;
- looks like a short physical truss section lying on the floor;
- matches the floor perspective of the runner scene;
- uses a pseudo-isometric / 3-4 floor angle, not a top-down product render;
- has round aluminum tubes, not square beams;
- has visible diagonal bracing;
- is short, about 1 meter visually, not a long 2.5-3 meter section;
- reads clearly at mobile gameplay size;
- can block two lanes without looking like a UI sticker.

## Needed variants

Prepare at least two final gameplay assets:

```text
assets/sprites/obstacles/png/truss_section_left.png
assets/sprites/obstacles/png/truss_section_right.png
```

Optional master/reference file may stay separate as:

```text
assets/sprites/obstacles/png/truss_section_master.png
```

The master/reference file should not be preloaded during gameplay if it is only used as art reference.

## Gameplay rule to preserve

Do not change obstacle mechanics during the art pass:

- `truss_section_left` blocks two lanes;
- `truss_section_right` blocks two lanes;
- player must dodge by changing lane;
- jump and slide must not clear the truss.

## Cleanup after final art

After the new asset is accepted:

1. Re-test Big Concert on real phone.
2. Reduce or remove temporary truss tuning if the asset naturally sits correctly.
3. Remove/disconnect temporary truss debug UI if no longer needed.
4. Keep only final baked constants in `src/gameplay-visual-tuning.js`.
