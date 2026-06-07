const TRUSS_TUNING_STORAGE_KEY = 'hamster_truss_visual_tuning_v1';

const VISUAL_TUNING = {
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

const DEFAULT_TRUSS_TUNING = {
  scale: 0.78,
  lift: 15,
  rotation: -9,
};

function loadTrussTuning() {
  try {
    const saved = window.localStorage?.getItem(TRUSS_TUNING_STORAGE_KEY);
    if (!saved) return { ...DEFAULT_TRUSS_TUNING };
    const parsed = JSON.parse(saved);
    return {
      scale: Number.isFinite(Number(parsed.scale)) ? Number(parsed.scale) : DEFAULT_TRUSS_TUNING.scale,
      lift: Number.isFinite(Number(parsed.lift)) ? Number(parsed.lift) : DEFAULT_TRUSS_TUNING.lift,
      rotation: Number.isFinite(Number(parsed.rotation)) ? Number(parsed.rotation) : DEFAULT_TRUSS_TUNING.rotation,
    };
  } catch {
    return { ...DEFAULT_TRUSS_TUNING };
  }
}

window.__HAMSTER_VISUAL_TUNING = VISUAL_TUNING;
window.__HAMSTER_TRUSS_TUNING_STORAGE_KEY = TRUSS_TUNING_STORAGE_KEY;
window.__HAMSTER_DEFAULT_TRUSS_TUNING = DEFAULT_TRUSS_TUNING;
window.__HAMSTER_TRUSS_TUNING = {
  ...DEFAULT_TRUSS_TUNING,
  ...(window.__HAMSTER_TRUSS_TUNING || {}),
  ...loadTrussTuning(),
};
window.__HAMSTER_DEBUG_MODE = false;

// Compatibility bridge: renderer patches still read this object as a live override source.
// Temporary debug panels may overwrite it during a tuning session, but production starts from VISUAL_TUNING.
window.__HAMSTER_DEBUG_TUNING = {
  ...VISUAL_TUNING,
  ...(window.__HAMSTER_DEBUG_TUNING || {}),
};
