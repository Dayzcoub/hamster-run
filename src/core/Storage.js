const SAVE_KEY = 'packit_run_save_v1';

const DEFAULT_SAVE = {
  version: 1,
  bread: 0,
  unlockedLevels: ['dk_almost_ready'],
  completedLevels: {},
  settings: {
    sound: true,
    music: true,
    vibration: true,
  },
};

export class Storage {
  load() {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (!raw) return structuredClone(DEFAULT_SAVE);
      return { ...structuredClone(DEFAULT_SAVE), ...JSON.parse(raw) };
    } catch (error) {
      console.warn('Failed to load save, using default', error);
      return structuredClone(DEFAULT_SAVE);
    }
  }

  save(state) {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }

  reset() {
    window.localStorage.removeItem(SAVE_KEY);
    return this.load();
  }
}
