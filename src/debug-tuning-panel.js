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

const tuning = loadTuning();
window.__HAMSTER_DEBUG_TUNING = { ...tuning };

function createPanel() {
  if (document.querySelector('[data-hamster-debug-panel]')) return;

  const style = document.createElement('style');
  style.textContent = `
    .hamster-debug-toggle {
      position: fixed;
      right: max(10px, env(safe-area-inset-right));
      top: max(10px, env(safe-area-inset-top));
      z-index: 99999;
      border: 1px solid rgba(255,194,71,.55);
      border-radius: 999px;
      background: rgba(7,14,24,.82);
      color: #ffc247;
      font: 900 12px/1 system-ui, -apple-system, Segoe UI, sans-serif;
      padding: 9px 11px;
      box-shadow: 0 8px 22px rgba(0,0,0,.35);
      touch-action: manipulation;
    }
    .hamster-debug-panel {
      position: fixed;
      right: max(8px, env(safe-area-inset-right));
      top: max(46px, calc(env(safe-area-inset-top) + 42px));
      z-index: 99998;
      width: min(420px, calc(100vw - 16px));
      max-height: min(78vh, 420px);
      overflow: auto;
      border: 1px solid rgba(92,235,255,.32);
      border-radius: 16px;
      background: rgba(5,10,18,.93);
      color: #f5fbff;
      box-shadow: 0 18px 50px rgba(0,0,0,.48);
      padding: 10px;
      font-family: system-ui, -apple-system, Segoe UI, sans-serif;
      backdrop-filter: blur(8px);
    }
    .hamster-debug-panel[hidden] { display: none; }
    .hamster-debug-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 8px;
      font-weight: 950;
      color: #ffc247;
      font-size: 13px;
    }
    .hamster-debug-row {
      display: grid;
      grid-template-columns: 92px 1fr 52px;
      align-items: center;
      gap: 8px;
      margin: 6px 0;
      font-size: 11px;
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
      gap: 8px;
      margin-top: 10px;
    }
    .hamster-debug-actions button {
      border: 1px solid rgba(255,255,255,.16);
      border-radius: 12px;
      background: rgba(255,255,255,.07);
      color: #f5fbff;
      font: 850 12px/1 system-ui, -apple-system, Segoe UI, sans-serif;
      padding: 10px 8px;
      touch-action: manipulation;
    }
    .hamster-debug-note {
      margin-top: 8px;
      color: rgba(245,251,255,.68);
      font-size: 10px;
      line-height: 1.3;
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
  head.innerHTML = '<span>Настройка игрового поля</span><span>врем.</span>';
  panel.appendChild(head);

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
    panel.appendChild(row);
  }

  const actions = document.createElement('div');
  actions.className = 'hamster-debug-actions';

  const copy = document.createElement('button');
  copy.type = 'button';
  copy.textContent = 'Скопировать';
  copy.addEventListener('click', async () => {
    const text = JSON.stringify(window.__HAMSTER_DEBUG_TUNING, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      copy.textContent = 'Скопировано';
      setTimeout(() => { copy.textContent = 'Скопировать'; }, 900);
    } catch {
      window.prompt('Скопируй настройки:', text);
    }
  });

  const reset = document.createElement('button');
  reset.type = 'button';
  reset.textContent = 'Сброс';
  reset.addEventListener('click', () => {
    Object.assign(tuning, DEFAULT_TUNING);
    for (const [key] of FIELDS) {
      const input = panel.querySelector(`input[type="range"]:nth-of-type(1)`);
      void input;
    }
    panel.querySelectorAll('.hamster-debug-row').forEach((row, index) => {
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
  note.textContent = 'Чем больше Lane — тем ниже линия. Y: минус поднимает, плюс опускает. Scale меняет размер.';
  panel.appendChild(note);

  const stop = (event) => event.stopPropagation();
  for (const eventName of ['pointerdown', 'pointerup', 'touchstart', 'touchmove', 'click', 'keydown']) {
    panel.addEventListener(eventName, stop, { passive: false });
    toggle.addEventListener(eventName, stop, { passive: false });
  }
  toggle.addEventListener('click', () => { panel.hidden = !panel.hidden; });

  document.body.append(style, toggle, panel);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createPanel, { once: true });
} else {
  createPanel();
}
