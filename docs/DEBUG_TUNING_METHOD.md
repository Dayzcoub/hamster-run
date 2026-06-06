# In-game debug tuning method

Use this method for visual/gameplay tuning that is hard to dial in by guessing code constants.

## Goal

Instead of repeatedly committing blind coefficient changes, temporarily add an in-game debug stand with live controls, tune on the real target device, copy the resulting JSON values, then bake those values into a permanent tuning module.

This worked well for the DK backdrop perspective pass: lane heights, hamster Y/scale, spaniel Y/scale, and spawned object Y/scale were tuned directly on the phone.

## Workflow

1. Add a temporary debug panel module and import it from `src/main.js` only while tuning.
2. Add a static debug stand for the feature being tuned.
   - Freeze or bypass the normal game loop update while debug mode is open.
   - Draw representative objects/states on screen at once.
   - Avoid showing normal pause overlays during debug mode.
3. Add sliders/toggles for the parameters being tuned.
   - Positions / offsets.
   - Scales.
   - Lane heights.
   - Opacity/intensity/speed when relevant.
4. Store live values in `window.__HAMSTER_DEBUG_TUNING` and `localStorage` so reloads preserve the current experiment.
5. Add a copy button that exports JSON.
6. Test on the real target phone.
7. Paste the JSON into a permanent tuning file.
8. Remove or disconnect the temporary debug panel from `src/main.js`.

## Current baked example

The current perspective tuning is baked in:

```js
// src/gameplay-perspective-tuning.js
window.__HAMSTER_DEBUG_MODE = false;

window.__HAMSTER_DEBUG_TUNING = {
  laneTop: 0.736,
  laneMid: 0.822,
  laneBottom: 0.98,
  playerY: -21,
  playerScale: 1,
  spanielY: -7,
  spanielScale: 1.09,
  objectY: -29,
  objectScale: 0.87,
};
```

`src/main.js` should import the baked tuning file before the renderer patches that read it:

```js
import './gameplay-perspective-tuning.js';
import './render/CanvasRendererSpanielCompanion.js';
import './render/CanvasRendererPerspectiveAlignmentV1.js';
```

## Rules

- Keep the debug panel temporary unless explicitly needed again.
- Do not leave `DBG` UI visible in the final production/gameplay state.
- Do not tune by changing physics/FPS-sensitive logic unless the task is specifically physics/FPS.
- Prefer a small dedicated tuning file over scattering final constants across many modules.
- When tuning visual alignment, draw all relevant objects/states at once so relative positions are obvious.
- For mobile tuning, verify on the real phone before baking values.

## Useful pattern

```js
window.__HAMSTER_DEBUG_TUNING = {
  someOffsetY: -12,
  someScale: 0.94,
};

function tuning() {
  return {
    someOffsetY: -12,
    someScale: 0.94,
    ...(window.__HAMSTER_DEBUG_TUNING || {}),
  };
}
```

During debug mode, sliders update `window.__HAMSTER_DEBUG_TUNING`. After the user sends the final JSON, paste those values into the baked tuning file and remove the debug UI import.
