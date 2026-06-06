const PANEL_POS_KEY = 'hamster.debugTuning.panelPos.v1';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value)));
}

function loadPosition() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PANEL_POS_KEY) || 'null');
    if (Number.isFinite(parsed?.left) && Number.isFinite(parsed?.top)) return parsed;
  } catch {
    // ignore
  }
  return null;
}

function savePosition(left, top) {
  localStorage.setItem(PANEL_POS_KEY, JSON.stringify({
    left: Math.round(left),
    top: Math.round(top),
  }));
}

function placePanel(panel, left, top) {
  const rect = panel.getBoundingClientRect();
  const minLeft = Math.min(0, 42 - rect.width);
  const maxLeft = window.innerWidth - 42;
  const minTop = 0;
  const maxTop = window.innerHeight - 36;
  const nextLeft = clamp(left, minLeft, maxLeft);
  const nextTop = clamp(top, minTop, maxTop);
  panel.style.left = `${nextLeft}px`;
  panel.style.top = `${nextTop}px`;
  panel.style.right = 'auto';
  panel.style.bottom = 'auto';
  return { left: nextLeft, top: nextTop };
}

function patchDebugPanel() {
  const panel = document.querySelector('[data-hamster-debug-panel]');
  if (!panel || panel.dataset.dragPatch === 'true') return;
  const head = panel.querySelector('.hamster-debug-head');
  if (!head) return;

  panel.dataset.dragPatch = 'true';
  panel.style.top = '0px';
  panel.style.left = '4px';
  panel.style.bottom = 'auto';
  panel.style.right = 'auto';
  panel.style.width = 'min(720px, calc(100vw - 92px))';
  panel.style.maxHeight = 'min(28vh, 142px)';
  panel.style.touchAction = 'none';

  head.style.cursor = 'grab';
  head.style.touchAction = 'none';
  head.style.userSelect = 'none';
  head.textContent = 'Debug: тяни панель за эту шапку';

  const saved = loadPosition();
  requestAnimationFrame(() => {
    if (saved) placePanel(panel, saved.left, saved.top);
    else placePanel(panel, 4, 0);
  });

  let drag = null;
  head.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = panel.getBoundingClientRect();
    drag = {
      id: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    head.setPointerCapture?.(event.pointerId);
  });

  head.addEventListener('pointermove', (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    placePanel(panel, event.clientX - drag.offsetX, event.clientY - drag.offsetY);
  });

  const endDrag = (event) => {
    if (!drag || drag.id !== event.pointerId) return;
    const rect = panel.getBoundingClientRect();
    savePosition(rect.left, rect.top);
    drag = null;
  };
  head.addEventListener('pointerup', endDrag);
  head.addEventListener('pointercancel', endDrag);

  window.addEventListener('resize', () => {
    if (panel.hidden) return;
    const rect = panel.getBoundingClientRect();
    const next = placePanel(panel, rect.left, rect.top);
    savePosition(next.left, next.top);
  });
}

function watchDebugPanel() {
  patchDebugPanel();
  const observer = new MutationObserver(patchDebugPanel);
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', watchDebugPanel, { once: true });
} else {
  watchDebugPanel();
}
