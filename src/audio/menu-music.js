import { DEFAULT_AUDIO_SETTINGS, normalizeAudioSettings } from './audio-settings.js';

const MENU_MUSIC_SRC = 'assets/audio/music/menu_theme.mp3';

class MenuMusicController {
  constructor() {
    this.audio = null;
    this.audioContext = null;
    this.sourceNode = null;
    this.gainNode = null;
    this.enabled = true;
    this.unlocked = false;
    this.pendingPlay = false;
    this.playToken = 0;
    this.settings = { ...DEFAULT_AUDIO_SETTINGS };
    this.onFirstGesture = this.onFirstGesture.bind(this);
  }

  configure(settings = {}) {
    this.settings = normalizeAudioSettings(settings);
    this.enabled = Boolean(this.settings.enabled);
    this.applyVolume();
    if (!this.enabled) this.pause();
  }

  currentGain() {
    return this.enabled
      ? this.settings.masterVolume * this.settings.menuMusicVolume
      : 0;
  }

  setGainImmediate(gain) {
    if (this.audio) this.audio.volume = Math.max(0, Math.min(1, gain));
    if (!this.gainNode) return;
    const now = this.audioContext?.currentTime || 0;
    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.setValueAtTime(gain, now);
  }

  applyVolume() {
    const gain = this.currentGain();
    if (this.audio) {
      // Desktop browsers respect audio.volume. iOS Safari often ignores it,
      // so the Web Audio GainNode below is the real volume control there.
      this.audio.volume = Math.max(0, Math.min(1, gain));
    }
    if (this.gainNode) {
      const now = this.audioContext?.currentTime || 0;
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setTargetAtTime(gain, now, 0.015);
    }
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

  ensureAudioGraph() {
    const audio = this.ensureAudio();
    if (this.gainNode) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    this.audioContext = this.audioContext || new AudioContextClass();
    this.sourceNode = this.sourceNode || this.audioContext.createMediaElementSource(audio);
    this.gainNode = this.audioContext.createGain();
    this.sourceNode.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);
    this.applyVolume();
  }

  async resumeAudioContext() {
    if (!this.audioContext) return;
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  mountGestureUnlock() {
    window.addEventListener('pointerdown', this.onFirstGesture, { once: true, passive: true });
    window.addEventListener('keydown', this.onFirstGesture, { once: true });
    window.addEventListener('touchstart', this.onFirstGesture, { once: true, passive: true });
  }

  onFirstGesture() {
    this.unlocked = true;
    const token = this.playToken;
    this.ensureAudioGraph();
    this.resumeAudioContext().finally(() => {
      if (this.pendingPlay && token === this.playToken) this.play();
    });
  }

  async play() {
    if (!this.enabled) return;
    this.pendingPlay = true;
    const token = ++this.playToken;
    const audio = this.ensureAudio();
    this.ensureAudioGraph();
    this.applyVolume();
    if (!this.unlocked) {
      this.mountGestureUnlock();
      return;
    }
    try {
      await this.resumeAudioContext();
      if (!this.pendingPlay || token !== this.playToken || !this.enabled) return;
      this.applyVolume();
      await audio.play();
      if (!this.pendingPlay || token !== this.playToken || !this.enabled) {
        this.setGainImmediate(0);
        audio.pause();
      }
    } catch {
      if (this.pendingPlay && token === this.playToken) this.mountGestureUnlock();
    }
  }

  pause() {
    this.pendingPlay = false;
    this.playToken += 1;
    if (!this.audio) return;
    this.audio.pause();
  }

  stop() {
    this.pendingPlay = false;
    this.playToken += 1;
    this.setGainImmediate(0);
    if (!this.audio) return;
    this.audio.pause();
    this.audio.currentTime = 0;
  }
}

export const menuMusic = new MenuMusicController();
