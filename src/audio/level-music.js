import { DEFAULT_AUDIO_SETTINGS, normalizeAudioSettings } from './audio-settings.js';

const LEVEL_MUSIC_SOURCES = {
  dk_almost_ready: 'assets/audio/music/level_dk_almost_ready.mp3',
  wedding_tent: 'assets/audio/music/level_wedding_tent.mp3',
  big_concert: 'assets/audio/music/level_big_concert.mp3',
  kids_room: 'assets/audio/music/level_kids_room.mp3',
};

class LevelMusicController {
  constructor() {
    this.audio = null;
    this.audioContext = null;
    this.sourceNode = null;
    this.gainNode = null;
    this.currentLevelId = null;
    this.enabled = true;
    this.unlocked = false;
    this.pendingLevelId = null;
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
      ? this.settings.masterVolume * this.settings.levelMusicVolume
      : 0;
  }

  applyVolume() {
    const gain = this.currentGain();
    if (this.audio) this.audio.volume = Math.max(0, Math.min(1, gain));
    if (this.gainNode) {
      const now = this.audioContext?.currentTime || 0;
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setTargetAtTime(gain, now, 0.015);
    }
  }

  ensureAudio(levelId) {
    const src = LEVEL_MUSIC_SOURCES[levelId];
    if (!src) return null;
    if (this.audio && this.currentLevelId === levelId) return this.audio;

    this.disconnectGraph();
    const audio = new Audio(src);
    audio.loop = true;
    audio.preload = 'auto';
    this.audio = audio;
    this.currentLevelId = levelId;
    this.applyVolume();
    return audio;
  }

  disconnectGraph() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    try { this.sourceNode?.disconnect(); } catch {}
    try { this.gainNode?.disconnect(); } catch {}
    this.sourceNode = null;
    this.gainNode = null;
  }

  ensureAudioGraph() {
    if (!this.audio || this.gainNode) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.audioContext = this.audioContext || new AudioContextClass();
    this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
    this.gainNode = this.audioContext.createGain();
    this.sourceNode.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);
    this.applyVolume();
  }

  async resumeAudioContext() {
    if (!this.audioContext) return;
    if (this.audioContext.state === 'suspended') await this.audioContext.resume();
  }

  mountGestureUnlock() {
    window.addEventListener('pointerdown', this.onFirstGesture, { once: true, passive: true });
    window.addEventListener('keydown', this.onFirstGesture, { once: true });
    window.addEventListener('touchstart', this.onFirstGesture, { once: true, passive: true });
  }

  onFirstGesture() {
    this.unlocked = true;
    this.ensureAudioGraph();
    this.resumeAudioContext().finally(() => {
      if (this.pendingLevelId) this.play(this.pendingLevelId);
    });
  }

  async play(levelId) {
    if (!this.enabled) return;
    this.pendingLevelId = levelId;
    const audio = this.ensureAudio(levelId);
    if (!audio) return;
    this.ensureAudioGraph();
    this.applyVolume();
    if (!this.unlocked) {
      this.mountGestureUnlock();
      return;
    }
    try {
      await this.resumeAudioContext();
      this.applyVolume();
      await audio.play();
    } catch {
      this.mountGestureUnlock();
    }
  }

  pause() {
    this.pendingLevelId = null;
    if (!this.audio) return;
    this.audio.pause();
  }

  stop() {
    this.pause();
    if (this.audio) this.audio.currentTime = 0;
  }
}

export const levelMusic = new LevelMusicController();
