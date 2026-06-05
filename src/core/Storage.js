const SAVE_KEY = 'packit_run_save_v1';

const DEFAULT_SAVE = {
  version: 1,
  bread: 0,
  unlockedLevels: ['dk_almost_ready'],
  completedLevels: {},
  unlockedCompanions: [],
  rewards: {},
  settings: {
    sound: true,
    music: true,
    vibration: true,
    renderQuality: 'auto',
  },
};

export class Storage {
  load() {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (!raw) return structuredClone(DEFAULT_SAVE);
      const parsed = JSON.parse(raw);
      const defaults = structuredClone(DEFAULT_SAVE);
      return {
        ...defaults,
        ...parsed,
        unlockedLevels: Array.isArray(parsed.unlockedLevels) ? parsed.unlockedLevels : defaults.unlockedLevels,
        unlockedCompanions: Array.isArray(parsed.unlockedCompanions) ? parsed.unlockedCompanions : defaults.unlockedCompanions,
        completedLevels: parsed.completedLevels || defaults.completedLevels,
        rewards: parsed.rewards || defaults.rewards,
        settings: {
          ...defaults.settings,
          ...(parsed.settings || {}),
        },
      };
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
