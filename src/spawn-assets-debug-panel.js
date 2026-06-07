const STORAGE_KEY = 'hamster_spawn_scale_factors_v1';
const DEV_FLAG_KEY = 'hamster_dev_spawn_debug_enabled';
const DEFAULT_SELECTED = 'bread';

const DEFAULT_FACTORS = {
  bread: 1,
  cable_coil: 1,
  c2_connector: 1,
  bolt: 1,
  stage_deck: 1,
  powercon: 0.8,
  tape: 0.72,
  led: 0.78,
  truss: 0.78,
  flight_case: 1,
  cable_loop: 1,
  mic_stand: 1,
  mystery_box: 1,
  cart: 1,
};

function isDevEnabled() {
  try {
    return window.localStorage?.getItem(DEV_FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

function loadFactors() {
  try {
    const saved = window.localStorage?.getItem(STORAGE_KEY);
    if (!saved) return { ...DEFAULT_FACTORS };
    return { ...DEFAULT_FACTORS, ...JSON.parse(saved) };
  } catch {
    return { ...DEFAULT_FACTORS };
  }
}

function saveFactors(factors) {
  window.__HAMSTER_SPAWN_SCALE_FACTORS = { ...factors };
  try {
    window.localStorage?.setItem(STORAGE_KEY, JSON.stringify(factors));
  } catch {
    // Live tuning still works without persistent storage.
  }
}

function setDebugMode(active) {
  window.__HAMSTER_SPAWN_DEBUG_MODE = active;
  window.__HAMSTER_DEBUG_MODE = active;
  window.dispatchEvent(new CustomEvent('hamster-debug-mode-change', { detail: { active, source: 'spawn-assets' } }));
}

function currentFactors() {
  return { ...DEFAULT_FACTORS, ...(window.__HAMSTER_SPAWN_SCALE_FACTORS || {}) };
}

function clampScale(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 1;
  return Math.max(0.35, Math.min(1.8, numeric));
}

function exportJson() {
  const factors = currentFactors();
  return JSON.stringify({ spawnScaleFactors: factors }, null, 2);
}

function installStyles() {
  if (document.querySelector('[data-spawn-assets-debug-style]')) return;
  const style = document.createElement('style');
  style.dataset.spawnAssetsDebugStyle = 'true';
  style.textContent = `
    .spawn-assets-debug[hidden], .spawn-assets-debug__panel[hidden] { display: none; }
    .spawn-assets-debug {
      position: fixed;
      left: max(10px, env(safe-area-inset-left));
      top: max(10px, env(safe-area-inset-top));
      z-index: 65;
      display: grid;
      gap: .42rem;
      align-items: start;
      pointer-events: none;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .spawn-assets-debug button, .spawn-assets-debug input, .spawn-assets-debug textarea { pointer-events: auto; }
    .spawn-assets-debug__toggle {
      min-width: 78px;
      min-height: 36px;
      border-radius: 999px;
      border: 1px solid rgba(92,235,255,.36);
      color: #07111e;
      background: linear-gradient(180deg,#7df3ff 0%,#35d7ff 100%);
      font-weight: 950;
      box-shadow: 0 10px 28px rgba(0,0,0,.35);
    }
    .spawn-assets-debug__panel {
      width: min(390px, calc(100vw - 20px));
      max-height: min(42vh, 290px);
      overflow: auto;
      padding: .58rem;
      border-radius: 16px;
      background: rgba(5, 11, 20, .96);
      border: 1px solid rgba(92,235,255,.28);
      box-shadow: 0 18px 48px rgba(0,0,0,.45);
      pointer-events: auto;
    }
    .spawn-assets-debug__panel header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: .5rem;
      margin-bottom: .42rem;
    }
    .spawn-assets-debug__panel strong {
      color: #ffc247;
      font-size: .74rem;
      letter-spacing: .1em;
      text-transform: uppercase;
    }
    .spawn-assets-debug__panel header button,
    .spawn-assets-debug__actions button {
      min-height: 28px;
      padding: 0 .5rem;
      border-radius: 10px;
      color: #dce9ff;
      background: rgba(8,16,29,.9);
      border: 1px solid rgba(92,235,255,.22);
      font-weight: 900;
      font-size: .72rem;
    }
    .spawn-assets-debug__row {
      display: grid;
      grid-template-columns: 72px minmax(120px, 1fr) 50px;
      gap: .42rem;
      align-items: center;
      min-height: 32px;
      color: rgba(220,233,255,.88);
      font-weight: 850;
      font-size: .74rem;
    }
    .spawn-assets-debug__row input { width: 100%; accent-color: #ffc247; }
    .spawn-assets-debug__row b { color: #5cebff; text-align: right; font-size: .72rem; }
    .spawn-assets-debug__hint {
      margin: .32rem 0;
      color: rgba(220,233,255,.72);
      font-size: .68rem;
      font-weight: 760;
    }
    .spawn-assets-debug textarea {
      width: 100%;
      min-height: 74px;
      margin-top: .38rem;
      resize: vertical;
      border-radius: 10px;
      border: 1px solid rgba(92,235,255,.18);
      background: rgba(2,7,14,.72);
      color: #dce9ff;
      font: 700 .62rem ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      padding: .42rem;
    }
    .spawn-assets-debug__actions { display: flex; gap: .38rem; flex-wrap: wrap; margin-top: .38rem; }
    @media (orientation: landscape) and (max-height: 520px) {
      .spawn-assets-debug { top: max(6px, env(safe-area-inset-top)); left: max(6px, env(safe-area-inset-left)); }
      .spawn-assets-debug__toggle { min-height: 30px; min-width: 68px; font-size: .72rem; }
      .spawn-assets-debug__panel { width: min(420px, 54vw); max-height: 36vh; padding: .45rem; }
      .spawn-assets-debug__row { grid-template-columns: 62px minmax(100px,1fr) 42px; min-height: 26px; font-size: .68rem; }
      .spawn-assets-debug textarea { min-height: 54px; }
    }
  `;
  document.head.appendChild(style);
}

function render() {
  if (document.querySelector('[data-spawn-assets-debug-root]')) return;
  const root = document.createElement('aside');
  root.className = 'spawn-assets-debug';
  root.dataset.spawnAssetsDebugRoot = 'true';
  root.innerHTML = `
    <button class="spawn-assets-debug__toggle" type="button" data-spawn-debug-toggle>Ассеты</button>
    <section class="spawn-assets-debug__panel" data-spawn-debug-panel hidden aria-label="Настройка ассетов спавна">
      <header>
        <strong>Ассеты</strong>
        <button type="button" data-spawn-debug-close>Закрыть</button>
      </header>
      <p class="spawn-assets-debug__hint">Тапни объект на поле. Scale применяется только к выбранному объекту.</p>
      <label class="spawn-assets-debug__row">
        <span data-spawn-debug-selected>${DEFAULT_SELECTED}</span>
        <input data-spawn-debug-scale type="range" min="0.35" max="1.8" step="0.01" />
        <b data-spawn-debug-value>1.00</b>
      </label>
      <div class="spawn-assets-debug__actions">
        <button type="button" data-spawn-debug-reset>Сбросить выбранный</button>
        <button type="button" data-spawn-debug-export>Экспорт JSON</button>
      </div>
      <textarea data-spawn-debug-output readonly placeholder="JSON появится тут после экспорта"></textarea>
    </section>
  `;
  document.body.appendChild(root);
}

function syncPanel(root) {
  const selected = window.__HAMSTER_SPAWN_DEBUG_SELECTED || DEFAULT_SELECTED;
  const factors = currentFactors();
  const value = clampScale(factors[selected] ?? 1);
  const selectedNode = root.querySelector('[data-spawn-debug-selected]');
  const input = root.querySelector('[data-spawn-debug-scale]');
  const output = root.querySelector('[data-spawn-debug-value]');
  if (selectedNode) selectedNode.textContent = selected;
  if (input) input.value = String(value);
  if (output) output.textContent = value.toFixed(2);
}

function setOpen(root, open) {
  const panel = root.querySelector('[data-spawn-debug-panel]');
  root.classList.toggle('is-open', open);
  if (panel) panel.hidden = !open;
  setDebugMode(open);
  if (open) syncPanel(root);
}

function selectByPoint(root, clientX, clientY) {
  const zones = window.__HAMSTER_SPAWN_DEBUG_HIT_ZONES || [];
  if (!zones.length) return;
  const canvas = document.querySelector('.game-canvas');
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;
  let best = null;
  let bestDistance = Infinity;

  for (const zone of zones) {
    const distance = Math.hypot(x - zone.x, y - zone.y);
    if (distance <= zone.radius && distance < bestDistance) {
      best = zone;
      bestDistance = distance;
    }
  }

  if (!best) return;
  window.__HAMSTER_SPAWN_DEBUG_SELECTED = best.visualKey;
  syncPanel(root);
}

function wire(root) {
  if (root.dataset.spawnAssetsDebugWired === 'true') return;
  root.dataset.spawnAssetsDebugWired = 'true';
  window.__HAMSTER_SPAWN_SCALE_FACTORS = loadFactors();
  window.__HAMSTER_SPAWN_DEBUG_SELECTED = DEFAULT_SELECTED;

  root.addEventListener('click', async (event) => {
    if (event.target.closest('[data-spawn-debug-toggle]')) {
      setOpen(root, !root.classList.contains('is-open'));
      return;
    }
    if (event.target.closest('[data-spawn-debug-close]')) {
      setOpen(root, false);
      return;
    }
    if (event.target.closest('[data-spawn-debug-reset]')) {
      const selected = window.__HAMSTER_SPAWN_DEBUG_SELECTED || DEFAULT_SELECTED;
      const factors = currentFactors();
      factors[selected] = DEFAULT_FACTORS[selected] ?? 1;
      saveFactors(factors);
      syncPanel(root);
      return;
    }
    if (event.target.closest('[data-spawn-debug-export]')) {
      const text = exportJson();
      const output = root.querySelector('[data-spawn-debug-output]');
      if (output) output.value = text;
      try { await navigator.clipboard?.writeText(text); } catch { /* Copy is optional. */ }
    }
  });

  root.addEventListener('input', (event) => {
    if (!event.target.matches('[data-spawn-debug-scale]')) return;
    const selected = window.__HAMSTER_SPAWN_DEBUG_SELECTED || DEFAULT_SELECTED;
    const factors = currentFactors();
    factors[selected] = clampScale(event.target.value);
    saveFactors(factors);
    syncPanel(root);
  });

  document.addEventListener('pointerdown', (event) => {
    if (!root.classList.contains('is-open')) return;
    if (event.target.closest('[data-spawn-assets-debug-root]')) return;
    selectByPoint(root, event.clientX, event.clientY);
  }, { passive: true });
}

function updateVisibility() {
  const root = document.querySelector('[data-spawn-assets-debug-root]');
  if (!root) return;
  const activeGame = document.querySelector('.game-screen');
  const visible = Boolean(activeGame && isDevEnabled());
  root.hidden = !visible;
  if (!visible && root.classList.contains('is-open')) setOpen(root, false);
}

function boot() {
  installStyles();
  render();
  const root = document.querySelector('[data-spawn-assets-debug-root]');
  wire(root);
  updateVisibility();
  const observer = new MutationObserver(updateVisibility);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true });
  window.addEventListener('hamster-dev-settings-change', updateVisibility);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
