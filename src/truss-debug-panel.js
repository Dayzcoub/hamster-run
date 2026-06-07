const PANEL_STORAGE_KEY = 'hamster_truss_debug_panel_open_v1';
const STORAGE_KEY = 'hamster_truss_visual_tuning_v1';
const DEFAULTS = { scale: 1, lift: 0, rotation: 0 };

function currentTuning() {
  return {
    ...DEFAULTS,
    ...(window.__HAMSTER_DEFAULT_TRUSS_TUNING || {}),
    ...(window.__HAMSTER_TRUSS_TUNING || {}),
  };
}

function clampNumber(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(min, Math.min(max, numeric));
}

function saveTuning(tuning) {
  window.__HAMSTER_TRUSS_TUNING = { ...tuning };
  try {
    window.localStorage?.setItem(window.__HAMSTER_TRUSS_TUNING_STORAGE_KEY || STORAGE_KEY, JSON.stringify(tuning));
  } catch {
    // Storage can be unavailable in private mode; live tuning still works for the session.
  }
}

function savePanelOpen(open) {
  try {
    window.localStorage?.setItem(PANEL_STORAGE_KEY, open ? '1' : '0');
  } catch {
    // Ignore storage failures.
  }
}

function readPanelOpen() {
  try {
    return window.localStorage?.getItem(PANEL_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function formatValue(key, value) {
  if (key === 'rotation') return `${Number(value).toFixed(0)}°`;
  if (key === 'lift') return `${Number(value).toFixed(0)}px`;
  return Number(value).toFixed(2);
}

function setControlValue(root, key, value) {
  const input = root.querySelector(`[data-truss-debug-input="${key}"]`);
  const output = root.querySelector(`[data-truss-debug-value="${key}"]`);
  if (input) input.value = String(value);
  if (output) output.textContent = formatValue(key, value);
}

function setDebugMode(open) {
  window.__HAMSTER_TRUSS_DEBUG_MODE = open;
  window.__HAMSTER_DEBUG_MODE = open;
  window.dispatchEvent(new CustomEvent('hamster-debug-mode-change', { detail: { active: open, source: 'truss' } }));
}

function findRoot() {
  return document.querySelector('.game-screen--concert [data-truss-debug-root]')
    || document.querySelector('[data-truss-debug-root]');
}

function ensureFallbackRoot() {
  if (findRoot()) return findRoot();

  const root = document.createElement('aside');
  root.className = 'truss-debug';
  root.dataset.trussDebugRoot = 'true';
  root.innerHTML = `
    <button class="truss-debug__toggle" type="button" data-truss-debug-toggle>Ферма</button>
    <section class="truss-debug__panel" data-truss-debug-panel hidden aria-label="Настройка фермы">
      <header>
        <strong>Ферма</strong>
        <button type="button" data-truss-debug-reset>Сброс</button>
      </header>
      <label><span>Scale</span><input data-truss-debug-input="scale" type="range" min="0.55" max="1.75" step="0.01" /><b data-truss-debug-value="scale"></b></label>
      <label><span>Подъём</span><input data-truss-debug-input="lift" type="range" min="-80" max="80" step="1" /><b data-truss-debug-value="lift"></b></label>
      <label><span>Поворот</span><input data-truss-debug-input="rotation" type="range" min="-45" max="45" step="1" /><b data-truss-debug-value="rotation"></b></label>
      <p data-truss-debug-copy></p>
    </section>
  `;
  document.body.appendChild(root);
  return root;
}

function sync(root, next = currentTuning()) {
  const tuning = {
    scale: clampNumber(next.scale, 0.55, 1.75, DEFAULTS.scale),
    lift: clampNumber(next.lift, -80, 80, DEFAULTS.lift),
    rotation: clampNumber(next.rotation, -45, 45, DEFAULTS.rotation),
  };
  saveTuning(tuning);
  setControlValue(root, 'scale', tuning.scale);
  setControlValue(root, 'lift', tuning.lift);
  setControlValue(root, 'rotation', tuning.rotation);
  const copy = root.querySelector('[data-truss-debug-copy]');
  if (copy) copy.textContent = `scale: ${tuning.scale.toFixed(2)} · lift: ${Math.round(tuning.lift)} · rotation: ${Math.round(tuning.rotation)}`;
}

function setOpen(root, open) {
  const panel = root.querySelector('[data-truss-debug-panel]');
  root.classList.toggle('is-open', open);
  savePanelOpen(open);
  setDebugMode(open);
  if (panel) panel.hidden = !open;
}

function wireRoot(root) {
  if (!root || root.dataset.trussDebugWired === 'true') return;
  root.dataset.trussDebugWired = 'true';

  root.addEventListener('input', (event) => {
    const key = event.target?.dataset?.trussDebugInput;
    if (!key) return;
    sync(root, { ...currentTuning(), [key]: Number(event.target.value) });
  });

  root.addEventListener('click', (event) => {
    if (event.target?.closest('[data-truss-debug-toggle], [data-action="truss-debug-toggle"]')) {
      setOpen(root, !root.classList.contains('is-open'));
      return;
    }
    if (event.target?.closest('[data-truss-debug-reset], [data-action="truss-debug-reset"]')) {
      sync(root, DEFAULTS);
    }
  });

  sync(root, currentTuning());
  setOpen(root, readPanelOpen());
}

function updateVisibility() {
  const root = ensureFallbackRoot();
  wireRoot(root);
  const activeGame = document.querySelector('.game-screen--concert');
  root.hidden = !activeGame;
  if (!activeGame && root.classList.contains('is-open')) setOpen(root, false);
}

function boot() {
  updateVisibility();
  const observer = new MutationObserver(updateVisibility);
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
