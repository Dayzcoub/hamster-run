const DEV_SPAWN_DEBUG_KEY = 'hamster_dev_spawn_debug_enabled';
const DEV_TRUSS_DEBUG_KEY = 'hamster_dev_truss_debug_enabled';

const loaded = {
  spawn: false,
  truss: false,
};

function flag(key) {
  try {
    return window.localStorage?.getItem(key) === '1';
  } catch {
    return false;
  }
}

async function loadSpawnDebug() {
  if (loaded.spawn || !flag(DEV_SPAWN_DEBUG_KEY)) return;
  loaded.spawn = true;
  try {
    await import('./spawn-assets-debug-panel.js');
  } catch (error) {
    loaded.spawn = false;
    console.error('[Hamster Crew] Failed to load spawn assets debug panel', error);
  }
}

async function loadTrussDebug() {
  if (loaded.truss || !flag(DEV_TRUSS_DEBUG_KEY)) return;
  loaded.truss = true;
  try {
    await import('./truss-debug-panel.js');
  } catch (error) {
    loaded.truss = false;
    console.error('[Hamster Crew] Failed to load truss debug panel', error);
  }
}

function syncDevDebugTools() {
  void loadSpawnDebug();
  void loadTrussDebug();
}

window.addEventListener('hamster-dev-settings-change', syncDevDebugTools);
window.addEventListener('storage', syncDevDebugTools);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', syncDevDebugTools, { once: true });
} else {
  syncDevDebugTools();
}
