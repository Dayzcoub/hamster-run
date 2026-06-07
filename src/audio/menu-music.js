import { DEFAULT_AUDIO_SETTINGS, normalizeAudioSettings } from './audio-settings.js';

const MENU_MUSIC_SRC = 'assets/audio/music/menu_theme.mp3';

class MenuMusicController {
  constructor() {
    this.audio = null;
    this.enabled = true;
    this.unlocked = false;
    this.pendingPlay = false;
    this.settings = { ...DEFAULT_AUDIO_SETTINGS };
    this.onFirstGesture = this.onFirstGesture.bind(this);
  }

  configure(settings = {}) {
    this.settings = normalizeAudioSettings(settings);
    this.enabled = Boolean(this.settings.enabled);
    this.applyVolume();
    if (!this.enabled) this.pause();
  }

  applyVolume() {
    if (!this.audio) return;
    this.audio.volume = this.enabled
      ? this.settings.masterVolume * this.settings.menuMusicVolume
      : 0;
  }

  ensureAudio() {
    if (this.audio) return this.audio;
    const audio = new Audio(MENU_MUSIC_SRC);
    audio.loop = true;
    audio.preload = 'auto';
    this.audio = audio;
    this.applyVolume();
    return audio;
  }

  mountGestureUnlock() {
    window.addEventListener('pointerdown', this.onFirstGesture, { once: true, passive: true });
    window.addEventListener('keydown', this.onFirstGesture, { once: true });
    window.addEventListener('touchstart', this.onFirstGesture, { once: true, passive: true });
  }

  onFirstGesture() {
    this.unlocked = true;
    if (this.pendingPlay) this.play();
  }

  async play() {
    if (!this.enabled) return;
    this.pendingPlay = true;
    const audio = this.ensureAudio();
    this.applyVolume();
    if (!this.unlocked) {
      this.mountGestureUnlock();
      return;
    }
    try {
      await audio.play();
    } catch {
      this.mountGestureUnlock();
    }
  }

  pause() {
    this.pendingPlay = false;
    if (!this.audio) return;
    this.audio.pause();
  }

  stop() {
    this.pause();
    if (this.audio) this.audio.currentTime = 0;
  }
}

export const menuMusic = new MenuMusicController();
