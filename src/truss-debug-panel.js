const PANEL_STORAGE_KEY = 'hamster_truss_debug_panel_open_v1';
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
    window.localStorage?.setItem(window.__HAMSTER_TRUSS_TUNING_STORAGE_KEY || 'hamster_truss_visual_tuning_v1', JSON.stringify(tuning));
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

function render() {
  if (document.querySelector('[data-truss-debug-root]')) return;

  const root = document.createElement('aside');
  root.className = 'truss-debug';
  root.dataset.trussDebugRoot = 'true';
  root.innerHTML = `
    <button class="truss-debug__toggle" type="button" data-truss-debug-toggle>Ферма</button>
    <section class="truss-debug__panel" data-truss-debug-panel aria-label="Настройка фермы">
      <header>
        <strong>Ферма</strong>
        <button type="button" data-truss-debug-reset>Сброс</button>
      </header>
      <label>
        <span>Scale</span>
        <input data-truss-debug-input="scale" type="range" min="0.55" max="1.75" step="0.01" />
        <b data-truss-debug-value="scale"></b>
      </label>
      <label>
        <span>Подъём</span>
        <input data-truss-debug-input="lift" type="range" min="-80" max="80" step="1" />
        <b data-truss-debug-value="lift"></b>
      </label>
      <label>
        <span>Поворот</span>
        <input data-truss-debug-input="rotation" type="range" min="-45" max="45" step="1" />
        <b data-truss-debug-value="rotation"></b>
      </label>
      <p data-truss-debug-copy></p>
    </section>
  `;

  document.body.appendChild(root);

  const panel = root.querySelector('[data-truss-debug-panel]');
  const toggle = root.querySelector('[data-truss-debug-toggle]');
  const copy = root.querySelector('[data-truss-debug-copy]');

  function sync(next = currentTuning()) {
    const tuning = {
      scale: clampNumber(next.scale, 0.55, 1.75, DEFAULTS.scale),
      lift: clampNumber(next.lift, -80, 80, DEFAULTS.lift),
      rotation: clampNumber(next.rotation, -45, 45, DEFAULTS.rotation),
    };
    saveTuning(tuning);
    setControlValue(root, 'scale', tuning.scale);
    setControlValue(root, 'lift', tuning.lift);
    setControlValue(root, 'rotation', tuning.rotation);
    if (copy) copy.textContent = `scale: ${tuning.scale.toFixed(2)} · lift: ${Math.round(tuning.lift)} · rotation: ${Math.round(tuning.rotation)}`;
  }

  function setOpen(open) {
    root.classList.toggle('is-open', open);
    savePanelOpen(open);
    if (panel) panel.hidden = !open;
  }

  root.addEventListener('input', (event) => {
    const key = event.target?.dataset?.trussDebugInput;
    if (!key) return;
    sync({ ...currentTuning(), [key]: Number(event.target.value) });
  });

  root.addEventListener('click', (event) => {
    if (event.target?.closest('[data-truss-debug-toggle]')) {
      setOpen(!root.classList.contains('is-open'));
      return;
    }
    if (event.target?.closest('[data-truss-debug-reset]')) {
      sync(DEFAULTS);
    }
  });

  sync(currentTuning());
  setOpen(readPanelOpen());
}

function updateVisibility() {
  const root = document.querySelector('[data-truss-debug-root]');
  if (!root) return;
  const activeGame = document.querySelector('.game-screen--concert');
  root.hidden = !activeGame;
}

function boot() {
  render();
  updateVisibility();
  const observer = new MutationObserver(updateVisibility);
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
