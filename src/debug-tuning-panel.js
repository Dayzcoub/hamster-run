const STORAGE_KEY = 'hamster.debugTuning.v1';

const DEFAULT_TUNING = {
  laneTop: 0.64,
  laneMid: 0.75,
  laneBottom: 0.88,
  playerY: -8,
  playerScale: 1,
  spanielY: 0,
  spanielScale: 1,
  objectY: 0,
  objectScale: 1,
};

const FIELDS = [
  ['laneTop', 'Lane верх', 0.5, 0.95, 0.001],
  ['laneMid', 'Lane середина', 0.5, 0.95, 0.001],
  ['laneBottom', 'Lane низ', 0.5, 0.98, 0.001],
  ['playerY', 'Хомяк Y', -80, 60, 1],
  ['playerScale', 'Хомяк scale', 0.45, 1.6, 0.01],
  ['spanielY', 'Спаник Y', -80, 60, 1],
  ['spanielScale', 'Спаник scale', 0.45, 1.6, 0.01],
  ['objectY', 'Объекты Y', -80, 60, 1],
  ['objectScale', 'Объекты scale', 0.45, 1.6, 0.01],
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value)));
}

function loadTuning() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { ...DEFAULT_TUNING, ...parsed };
  } catch {
    return { ...DEFAULT_TUNING };
  }
}

function saveTuning(tuning) {
  window.__HAMSTER_DEBUG_TUNING = { ...tuning };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(window.__HAMSTER_DEBUG_TUNING));
  window.dispatchEvent(new CustomEvent('hamster-debug-tuning-change', {
    detail: window.__HAMSTER_DEBUG_TUNING,
  }));
}

function setDebugMode(active) {
  window.__HAMSTER_DEBUG_MODE = Boolean(active);
  document.documentElement.classList.toggle('hamster-debug-mode-on', window.__HAMSTER_DEBUG_MODE);
  window.dispatchEvent(new CustomEvent('hamster-debug-mode-change', {
    detail: { active: window.__HAMSTER_DEBUG_MODE },
  }));
}

const tuning = loadTuning();
window.__HAMSTER_DEBUG_TUNING = { ...tuning };
window.__HAMSTER_DEBUG_MODE = false;

function createPanel() {
  if (document.querySelector('[data-hamster-debug-panel]')) return;

  const style = document.createElement('style');
  style.textContent = `
    .hamster-debug-toggle {
      position: fixed;
      right: max(8px, env(safe-area-inset-right));
      top: max(8px, env(safe-area-inset-top));
      z-index: 99999;
      border: 1px solid rgba(255,194,71,.62);
      border-radius: 999px;
      background: rgba(7,14,24,.88);
      color: #ffc247;
      font: 950 12px/1 system-ui, -apple-system, Segoe UI, sans-serif;
      padding: 9px 11px;
      box-shadow: 0 8px 22px rgba(0,0,0,.35);
      touch-action: manipulation;
    }
    .hamster-debug-mode-on .hamster-debug-toggle {
      background: rgba(255,194,71,.18);
      color: #fff2c9;
    }
    .hamster-debug-panel {
      position: fixed;
      left: max(8px, env(safe-area-inset-left));
      top: max(96px, calc(env(safe-area-inset-top) + 86px));
      z-index: 99998;
      width: min(680px, calc(100vw - 98px));
      max-height: min(31vh, 172px);
      overflow: auto;
      border: 1px solid rgba(92,235,255,.34);
      border-radius: 14px;
      background: rgba(5,10,18,.88);
      color: #f5fbff;
      box-shadow: 0 18px 50px rgba(0,0,0,.44);
      padding: 8px;
      font-family: system-ui, -apple-system, Segoe UI, sans-serif;
      backdrop-filter: blur(8px);
    }
    .hamster-debug-panel[hidden] { display: none; }
    .hamster-debug-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 5px;
      font-weight: 950;
      color: #ffc247;
      font-size: 11px;
    }
    .hamster-debug-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(150px, 1fr));
      gap: 4px 8px;
    }
    .hamster-debug-row {
      display: grid;
      grid-template-columns: 72px 1fr 42px;
      align-items: center;
      gap: 6px;
      min-width: 0;
      font-size: 10px;
    }
    .hamster-debug-row input[type='range'] { width: 100%; accent-color: #ffc247; }
    .hamster-debug-value {
      text-align: right;
      color: #92ebff;
      font-variant-numeric: tabular-nums;
    }
    .hamster-debug-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin-top: 6px;
    }
    .hamster-debug-actions button {
      border: 1px solid rgba(255,255,255,.16);
      border-radius: 10px;
      background: rgba(255,255,255,.07);
      color: #f5fbff;
      font: 850 11px/1 system-ui, -apple-system, Segoe UI, sans-serif;
      padding: 8px 7px;
      touch-action: manipulation;
    }
    .hamster-debug-note {
      margin-top: 5px;
      color: rgba(245,251,255,.68);
      font-size: 9px;
      line-height: 1.25;
    }
    @media (max-width: 820px) and (orientation: landscape) {
      .hamster-debug-panel {
        top: max(78px, calc(env(safe-area-inset-top) + 70px));
        width: min(660px, calc(100vw - 92px));
        max-height: min(29vh, 150px);
      }
      .hamster-debug-grid { grid-template-columns: repeat(3, minmax(140px, 1fr)); }
      .hamster-debug-row { grid-template-columns: 68px 1fr 38px; gap: 5px; font-size: 9px; }
      .hamster-debug-actions button { padding: 7px 6px; }
      .hamster-debug-note { display: none; }
    }
  `;

  const toggle = document.createElement('button');
  toggle.className = 'hamster-debug-toggle';
  toggle.type = 'button';
  toggle.textContent = 'DBG';
  toggle.setAttribute('aria-label', 'Debug tuning');

  const panel = document.createElement('div');
  panel.className = 'hamster-debug-panel';
  panel.dataset.hamsterDebugPanel = 'true';
  panel.hidden = true;

  const head = document.createElement('div');
  head.className = 'hamster-debug-head';
  head.innerHTML = '<span>Debug: статичный стенд объектов</span><span>DBG ON</span>';
  panel.appendChild(head);

  const grid = document.createElement('div');
  grid.className = 'hamster-debug-grid';
  panel.appendChild(grid);

  const valueNodes = new Map();

  function formatValue(key, value) {
    if (key.includes('Scale') || key.startsWith('lane')) return Number(value).toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
    return String(Math.round(Number(value)));
  }

  function applyField(key, rawValue) {
    const spec = FIELDS.find(([field]) => field === key);
    if (!spec) return;
    const [, , min, max] = spec;
    tuning[key] = clamp(rawValue, min, max);
    const node = valueNodes.get(key);
    if (node) node.textContent = formatValue(key, tuning[key]);
    saveTuning(tuning);
  }

  for (const [key, label, min, max, step] of FIELDS) {
    const row = document.createElement('label');
    row.className = 'hamster-debug-row';

    const name = document.createElement('span');
    name.textContent = label;

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(tuning[key]);

    const value = document.createElement('span');
    value.className = 'hamster-debug-value';
    value.textContent = formatValue(key, tuning[key]);
    valueNodes.set(key, value);

    input.addEventListener('input', () => applyField(key, input.value));

    row.append(name, input, value);
    grid.appendChild(row);
  }

  const actions = document.createElement('div');
  actions.className = 'hamster-debug-actions';

  const copy = document.createElement('button');
  copy.type = 'button';
  copy.textContent = 'Скопировать JSON';
  copy.addEventListener('click', async () => {
    const text = JSON.stringify(window.__HAMSTER_DEBUG_TUNING, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      copy.textContent = 'Скопировано';
      setTimeout(() => { copy.textContent = 'Скопировать JSON'; }, 900);
    } catch {
      window.prompt('Скопируй настройки:', text);
    }
  });

  const reset = document.createElement('button');
  reset.type = 'button';
  reset.textContent = 'Сброс';
  reset.addEventListener('click', () => {
    Object.assign(tuning, DEFAULT_TUNING);
    grid.querySelectorAll('.hamster-debug-row').forEach((row, index) => {
      const [key] = FIELDS[index];
      const input = row.querySelector('input');
      if (input) input.value = String(tuning[key]);
      const node = valueNodes.get(key);
      if (node) node.textContent = formatValue(key, tuning[key]);
    });
    saveTuning(tuning);
  });

  actions.append(copy, reset);
  panel.appendChild(actions);

  const note = document.createElement('div');
  note.className = 'hamster-debug-note';
  note.textContent = 'При открытом DBG игра рисует статичный стенд. Lane: больше = ниже. Y: минус = выше, плюс = ниже.';
  panel.appendChild(note);

  const stop = (event) => event.stopPropagation();
  for (const eventName of ['pointerdown', 'pointerup', 'touchstart', 'touchmove', 'click', 'keydown']) {
    panel.addEventListener(eventName, stop, { passive: false });
    toggle.addEventListener(eventName, stop, { passive: false });
  }
  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    setDebugMode(!panel.hidden);
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) {
      panel.hidden = true;
      setDebugMode(false);
    }
  });

  document.body.append(style, toggle, panel);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createPanel, { once: true });
} else {
  createPanel();
}
