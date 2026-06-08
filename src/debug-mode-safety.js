function hasOpenDebugPanel() {
  return Boolean(
    document.querySelector('.spawn-assets-debug.is-open')
    || document.querySelector('.truss-debug.is-open')
    || document.querySelector('.game-screen [data-truss-debug-root].is-open')
  );
}

function resetDebugMode(source = 'safety') {
  const wasActive = Boolean(window.__HAMSTER_DEBUG_MODE || window.__HAMSTER_SPAWN_DEBUG_MODE || window.__HAMSTER_TRUSS_DEBUG_MODE);
  window.__HAMSTER_DEBUG_MODE = false;
  window.__HAMSTER_SPAWN_DEBUG_MODE = false;
  window.__HAMSTER_TRUSS_DEBUG_MODE = false;
  window.__HAMSTER_SPAWN_DEBUG_HIT_ZONES = [];
  if (wasActive) {
    window.dispatchEvent(new CustomEvent('hamster-debug-mode-change', { detail: { active: false, source } }));
  }
}

function enforceDebugModeSafety() {
  const active = Boolean(window.__HAMSTER_DEBUG_MODE || window.__HAMSTER_SPAWN_DEBUG_MODE || window.__HAMSTER_TRUSS_DEBUG_MODE);
  if (!active) return;

  const hasGame = Boolean(document.querySelector('.game-screen'));
  if (!hasGame || !hasOpenDebugPanel()) {
    resetDebugMode('safety');
  }
}

window.__HAMSTER_RESET_DEBUG_MODE = resetDebugMode;
window.addEventListener('beforeunload', () => resetDebugMode('beforeunload'));
window.addEventListener('pagehide', () => resetDebugMode('pagehide'));
window.addEventListener('hamster-dev-settings-change', enforceDebugModeSafety);

setInterval(enforceDebugModeSafety, 250);

if (document.body) {
  new MutationObserver(enforceDebugModeSafety).observe(document.body, { childList: true, subtree: true, attributes: true });
} else {
  document.addEventListener('DOMContentLoaded', () => {
    new MutationObserver(enforceDebugModeSafety).observe(document.body, { childList: true, subtree: true, attributes: true });
  }, { once: true });
}
