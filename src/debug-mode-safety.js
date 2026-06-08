const MAX_DEBUG_FREEZE_MS = 20000;
const DEV_TRUSS_DEBUG_KEY = 'hamster_dev_truss_debug_enabled';
let debugStartedAt = 0;

function localFlag(key) {
  try {
    return window.localStorage?.getItem(key) === '1';
  } catch {
    return false;
  }
}

function syncEmbeddedTrussDebugVisibility() {
  const trussEnabled = localFlag(DEV_TRUSS_DEBUG_KEY);
  document.querySelectorAll('.game-screen [data-truss-debug-root]').forEach((root) => {
    root.hidden = !trussEnabled;
    root.dataset.devHidden = trussEnabled ? 'false' : 'true';
    if (!trussEnabled) {
      root.classList.remove('is-open');
      const panel = root.querySelector('[data-truss-debug-panel]');
      if (panel) panel.hidden = true;
    }
  });
}

function hasOpenDebugPanel() {
  return Boolean(
    document.querySelector('.spawn-assets-debug.is-open')
    || document.querySelector('.truss-debug.is-open')
    || document.querySelector('.game-screen [data-truss-debug-root].is-open')
  );
}

function resetOpenDebugPanels() {
  document.querySelectorAll('.spawn-assets-debug.is-open, .truss-debug.is-open, .game-screen [data-truss-debug-root].is-open').forEach((root) => {
    root.classList.remove('is-open');
    const panel = root.querySelector('[data-spawn-debug-panel], [data-truss-debug-panel]');
    if (panel) panel.hidden = true;
  });
}

function resetDebugMode(source = 'safety') {
  const wasActive = Boolean(window.__HAMSTER_DEBUG_MODE || window.__HAMSTER_SPAWN_DEBUG_MODE || window.__HAMSTER_TRUSS_DEBUG_MODE);
  window.__HAMSTER_DEBUG_MODE = false;
  window.__HAMSTER_SPAWN_DEBUG_MODE = false;
  window.__HAMSTER_TRUSS_DEBUG_MODE = false;
  window.__HAMSTER_SPAWN_DEBUG_HIT_ZONES = [];
  debugStartedAt = 0;
  resetOpenDebugPanels();
  syncEmbeddedTrussDebugVisibility();
  if (wasActive) {
    window.dispatchEvent(new CustomEvent('hamster-debug-mode-change', { detail: { active: false, source } }));
  }
}

function enforceDebugModeSafety() {
  syncEmbeddedTrussDebugVisibility();
  const active = Boolean(window.__HAMSTER_DEBUG_MODE || window.__HAMSTER_SPAWN_DEBUG_MODE || window.__HAMSTER_TRUSS_DEBUG_MODE);
  if (!active) {
    debugStartedAt = 0;
    return;
  }

  const now = performance.now();
  if (!debugStartedAt) debugStartedAt = now;

  const hasGame = Boolean(document.querySelector('.game-screen'));
  const expired = now - debugStartedAt > MAX_DEBUG_FREEZE_MS;
  if (!hasGame || !hasOpenDebugPanel() || expired) {
    resetDebugMode(expired ? 'safety-timeout' : 'safety');
  }
}

window.__HAMSTER_RESET_DEBUG_MODE = resetDebugMode;
window.addEventListener('beforeunload', () => resetDebugMode('beforeunload'));
window.addEventListener('pagehide', () => resetDebugMode('pagehide'));
window.addEventListener('hamster-dev-settings-change', enforceDebugModeSafety);

setInterval(enforceDebugModeSafety, 250);

if (document.body) {
  new MutationObserver(enforceDebugModeSafety).observe(document.body, { childList: true, subtree: true, attributes: true });
  enforceDebugModeSafety();
} else {
  document.addEventListener('DOMContentLoaded', () => {
    new MutationObserver(enforceDebugModeSafety).observe(document.body, { childList: true, subtree: true, attributes: true });
    enforceDebugModeSafety();
  }, { once: true });
}
