export const DEFAULT_AUDIO_SETTINGS = {
  enabled: true,
  masterVolume: 1,
  menuMusicVolume: 0.42,
  levelMusicVolume: 0.55,
  sfxVolume: 0.8,
};

export function normalizeAudioSettings(settings = {}) {
  const legacyMusic = settings.music !== false;
  const legacySound = settings.sound !== false;
  const audio = settings.audio || {};

  return {
    enabled: audio.enabled ?? legacyMusic,
    masterVolume: clamp01(audio.masterVolume ?? DEFAULT_AUDIO_SETTINGS.masterVolume),
    menuMusicVolume: clamp01(audio.menuMusicVolume ?? DEFAULT_AUDIO_SETTINGS.menuMusicVolume),
    levelMusicVolume: clamp01(audio.levelMusicVolume ?? DEFAULT_AUDIO_SETTINGS.levelMusicVolume),
    sfxVolume: clamp01(audio.sfxVolume ?? (legacySound ? DEFAULT_AUDIO_SETTINGS.sfxVolume : 0)),
  };
}

export function clamp01(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
}
