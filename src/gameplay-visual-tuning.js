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

window.__HAMSTER_VISUAL_TUNING = VISUAL_TUNING;
window.__HAMSTER_DEBUG_MODE = false;

// Compatibility bridge: renderer patches still read this object as a live override source.
// Temporary debug panels may overwrite it during a tuning session, but production starts from VISUAL_TUNING.
window.__HAMSTER_DEBUG_TUNING = {
  ...VISUAL_TUNING,
  ...(window.__HAMSTER_DEBUG_TUNING || {}),
};
