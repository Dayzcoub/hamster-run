export class OrientationLock {
  constructor(root) {
    this.root = root;
    this.enabled = false;
    this.handleChange = this.handleChange.bind(this);
  }

  start() {
    if (this.enabled) return;
    this.enabled = true;
    window.addEventListener('orientationchange', this.handleChange, { passive: true });
    window.addEventListener('resize', this.handleChange, { passive: true });
    this.handleChange();
  }

  stop() {
    if (!this.enabled) return;
    this.enabled = false;
    window.removeEventListener('orientationchange', this.handleChange);
    window.removeEventListener('resize', this.handleChange);
    this.root?.classList?.remove('app-shell--portrait-game');
  }

  async requestLandscape() {
    this.start();

    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      }
    } catch (error) {
      // Fullscreen is allowed only from a user gesture in many browsers.
    }

    try {
      const orientation = screen.orientation;
      if (orientation?.lock) await orientation.lock('landscape');
    } catch (error) {
      // Browser may reject orientation lock outside installed PWA/fullscreen.
    }

    this.handleChange();
  }

  async unlock() {
    this.stop();
    try { screen.orientation?.unlock?.(); } catch (error) {}
  }

  handleChange() {
    const portrait = window.innerHeight > window.innerWidth;
    this.root?.classList?.toggle('app-shell--portrait-game', Boolean(this.enabled && portrait));
  }
}
