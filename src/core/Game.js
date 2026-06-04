import { Storage } from './Storage.js';
import { Input } from './Input.js';
import { OrientationLock } from './OrientationLock.js';
import { AssetLoader } from '../render/AssetLoader.js';
import { MainMenuScreen } from '../screens/MainMenuScreen.js';
import { LevelSelectScreen } from '../screens/LevelSelectScreen.js';
import { GameScreen } from '../screens/GameScreen.js';
import { ResultScreen } from '../screens/ResultScreen.js';
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
  }

  async start() {
    await this.assets.load();
    this.input.bind();
    this.showMainMenu();
  }

  setScreen(screen) {
    if (this.activeScreen) this.activeScreen.destroy?.();
    this.activeScreen = screen;
    this.root.innerHTML = '';
    this.root.appendChild(screen.element);
    screen.mount?.();
  }

  showMainMenu() {
    this.orientationLock.stop();
    this.setScreen(new MainMenuScreen(this));
  }

  showLevels() {
    this.orientationLock.start();
    this.setScreen(new LevelSelectScreen(this, levels));
  }

  startLevel(levelId) {
    const level = levels.find((item) => item.id === levelId);
    if (!level) throw new Error(`Unknown level: ${levelId}`);
    this.orientationLock.requestLandscape();
    this.setScreen(new GameScreen(this, level));
  }

  showResult(result) {
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
    }

    this.storage.save(this.state);
  }

  pickBetterGrade(current, next) {
    const order = ['D', 'C', 'B', 'A', 'S'];
    if (!current) return next;
    return order.indexOf(next) > order.indexOf(current) ? next : current;
  }

  isLevelUnlocked(levelId) {
    return this.state.unlockedLevels.includes(levelId);
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
