export class Input {
  constructor() {
    this.actions = new Set();
    this.pointerStart = null;
    this.bound = false;
  }

  bind() {
    if (this.bound) return;
    this.bound = true;

    window.addEventListener('keydown', (event) => {
      const action = this.mapKey(event.key);
      if (action) {
        event.preventDefault();
        this.actions.add(action);
      }
    });
  }

  attachTouchTarget(element) {
    const onPointerDown = (event) => {
      this.pointerStart = { x: event.clientX, y: event.clientY };
    };

    const onPointerUp = (event) => {
      if (!this.pointerStart) return;
      const dx = event.clientX - this.pointerStart.x;
      const dy = event.clientY - this.pointerStart.y;
      this.pointerStart = null;
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      if (Math.max(ax, ay) < 26) return;
      if (ay > ax) this.actions.add(dy < 0 ? 'jump' : 'slide');
      else this.actions.add(dx < 0 ? 'laneNear' : 'laneFar');
    };

    element.addEventListener('pointerdown', onPointerDown);
    element.addEventListener('pointerup', onPointerUp);

    return () => {
      element.removeEventListener('pointerdown', onPointerDown);
      element.removeEventListener('pointerup', onPointerUp);
    };
  }

  consume() {
    const actions = [...this.actions];
    this.actions.clear();
    return actions;
  }

  mapKey(key) {
    const lower = key.toLowerCase();
    if (lower === 'a' || key === 'ArrowLeft') return 'laneNear';
    if (lower === 'd' || key === 'ArrowRight') return 'laneFar';
    if (lower === 'w' || key === 'ArrowUp' || key === ' ') return 'jump';
    if (lower === 's' || key === 'ArrowDown') return 'slide';
    if (lower === 'p' || key === 'Escape') return 'pause';
    if (key === 'Enter') return 'confirm';
    return null;
  }
}
