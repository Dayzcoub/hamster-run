import { Storage } from './Storage.js';
import { Input } from './Input.js';
import { OrientationLock } from './OrientationLock.js';
import { AssetLoader } from '../render/AssetLoader.js';
import { MainMenuScreen } from '../screens/MainMenuScreen.js';
import { LevelSelectScreen } from '../screens/LevelSelectScreen.js';
import { GameScreen } from '../screens/GameScreen.js';
import { ResultScreen } from '../screens/ResultScreen.js';
import { menuMusic } from '../audio/menu-music.js';
import { levelMusic } from '../audio/level-music.js';
import { normalizeAudioSettings } from '../audio/audio-settings.js';
import { levels } from '../data/levels.js';

const PASSING_GRADES = new Set(['C', 'B', 'A', 'S']);

export class Game {
  constructor(root) {
    this.root = root;
    this.storage = new Storage();
    this.input = new Input();
    this.orientationLock = new OrientationLock(root);
    this.assets = new AssetLoader('assets/manifest.json');
    this.activeScreen = null;
    this.state = this.storage.load();
    this.configureAudio();
  }

  async start() {
    await this.assets.load();
    this.input.bind();
    this.showMainMenu();
  }

  configureAudio() {
    this.state.settings.audio = normalizeAudioSettings(this.state.settings);
    menuMusic.configure(this.state.settings);
    levelMusic.configure(this.state.settings);
  }

  setScreen(screen) {
    if (this.activeScreen) this.activeScreen.destroy?.();
    this.activeScreen = screen;
    this.root.innerHTML = '';
    this.root.appendChild(screen.element);
    screen.mount?.();
  }

  showMainMenu() {
    levelMusic.stop();
    this.orientationLock.stop();
    this.configureAudio();
    this.setScreen(new MainMenuScreen(this));
  }

  showLevels() {
    levelMusic.stop();
    this.orientationLock.start();
    this.configureAudio();
    menuMusic.play();
    this.setScreen(new LevelSelectScreen(this, levels));
  }

  startLevel(levelId) {
    menuMusic.stop();
    const level = levels.find((item) => item.id === levelId);
    if (!level) throw new Error(`Unknown level: ${levelId}`);
    this.configureAudio();
    levelMusic.play(level.id);
    this.orientationLock.requestLandscape();
    this.setScreen(new GameScreen(this, level));
  }

  showResult(result) {
    menuMusic.stop();
    levelMusic.stop();
    this.applyResult(result);
    this.orientationLock.start();
    this.setScreen(new ResultScreen(this, result));
  }

  applyResult(result) {
    const saved = this.state.completedLevels[result.level.id];
    const previousBestScore = saved?.bestScore || 0;
    const previousBestGrade = saved?.bestGrade || null;
    const wasPassed = Boolean(saved?.passed);
    const passed = PASSING_GRADES.has(result.grade);
    const bestScore = Math.max(previousBestScore, result.score);
    const bestGrade = this.pickBetterGrade(previousBestGrade, result.grade);

    result.previousBestScore = previousBestScore;
    result.previousBestGrade = previousBestGrade;
    result.bestScore = bestScore;
    result.bestGrade = bestGrade;
    result.isNewRecord = result.score > previousBestScore;
    result.isFirstClear = !saved;
    result.passed = passed;
    result.wasPassed = wasPassed;
    result.firstPassed = passed && !wasPassed;
    result.unlockedRewards = [];

    this.state.bread += result.bread;
    this.state.completedLevels[result.level.id] = {
      bestGrade,
      bestScore,
      passed: wasPassed || passed,
      completedAt: new Date().toISOString(),
    };

    if (passed) {
      for (const unlock of result.level.unlocksAfterComplete || []) {
        if (!this.state.unlockedLevels.includes(unlock)) {
          this.state.unlockedLevels.push(unlock);
        }
      }
      this.applyLevelRewards(result);
    }

    this.storage.save(this.state);
  }

  applyLevelRewards(result) {
    if (result.level.id === 'dk_almost_ready') {
      this.unlockCompanion('spaniel', result, 'Открыт помощник: боевой спаниель');
    }
    if (result.level.id === 'kids_room') {
      this.unlockReward('skin_home_techdir', result, 'Открыт скин: Домашний техдир');
    }
  }

  unlockCompanion(id, result, label) {
    if (this.state.unlockedCompanions.includes(id)) return;
    this.state.unlockedCompanions.push(id);
    result.unlockedRewards.push({ type: 'companion', id, label });
  }

  unlockReward(id, result, label) {
    if (this.state.rewards[id]) return;
    this.state.rewards[id] = true;
    result.unlockedRewards.push({ type: 'reward', id, label });
  }

  pickBetterGrade(current, next) {
    const order = ['D', 'C', 'B', 'A', 'S'];
    if (!current) return next;
    return order.indexOf(next) > order.indexOf(current) ? next : current;
  }

  isLevelUnlocked(levelId) {
    return this.state.unlockedLevels.includes(levelId);
  }

  saveAudioSettings(nextAudio) {
    this.state.settings.audio = normalizeAudioSettings({
      ...this.state.settings,
      audio: {
        ...(this.state.settings.audio || {}),
        ...(nextAudio || {}),
      },
    });
    this.state.settings.music = this.state.settings.audio.enabled;
    this.state.settings.sound = this.state.settings.audio.sfxVolume > 0;
    this.storage.save(this.state);
    this.configureAudio();
    window.dispatchEvent(new CustomEvent('hamster-audio-settings-change', {
      detail: { audio: this.state.settings.audio },
    }));
  }

  toggleAudioEnabled() {
    const audio = normalizeAudioSettings(this.state.settings);
    this.saveAudioSettings({ enabled: !audio.enabled });
    return this.state.settings.audio;
  }

  setRenderQuality(renderQuality) {
    const allowed = ['auto', 'performance', 'quality'];
    this.state.settings.renderQuality = allowed.includes(renderQuality) ? renderQuality : 'auto';
    this.storage.save(this.state);
    window.dispatchEvent(new CustomEvent('hamster-render-quality-change', {
      detail: { renderQuality: this.state.settings.renderQuality },
    }));
  }

  cycleRenderQuality() {
    const order = ['auto', 'performance', 'quality'];
    const current = this.state.settings.renderQuality || 'auto';
    const next = order[(order.indexOf(current) + 1) % order.length] || 'auto';
    this.setRenderQuality(next);
    return next;
  }
}
