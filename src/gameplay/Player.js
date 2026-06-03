export class Player {
  constructor() {
    this.x = 190;
    this.lane = 1;
    this.renderLane = 1;
    this.state = 'running';
    this.jumpMs = 0;
    this.slideMs = 0;
    this.hitMs = 0;
    this.invulnerableMs = 0;
    this.mistakesLeft = 3;
  }

  get visualKey() {
    if (this.hitMs > 0) return 'hamster_hit';
    if (this.state === 'jumping') return 'hamster_jump';
    if (this.state === 'sliding') return 'hamster_slide';
    if (this.state === 'finished') return 'hamster_celebrate';
    return 'hamster_run_01';
  }

  get jumpOffset() {
    if (this.jumpMs <= 0) return 0;
    const t = this.jumpMs / 620;
    return Math.sin(t * Math.PI) * 120;
  }

  get isJumping() { return this.state === 'jumping' && this.jumpOffset > 46; }
  get isSliding() { return this.state === 'sliding'; }

  update(deltaMs, actions) {
    for (const action of actions) this.apply(action);

    this.renderLane += (this.lane - this.renderLane) * Math.min(1, deltaMs / 110);

    if (this.jumpMs > 0) {
      this.jumpMs += deltaMs;
      if (this.jumpMs >= 620) {
        this.jumpMs = 0;
        if (this.state === 'jumping') this.state = 'running';
      }
    }

    if (this.slideMs > 0) {
      this.slideMs -= deltaMs;
      if (this.slideMs <= 0 && this.state === 'sliding') this.state = 'running';
    }

    if (this.hitMs > 0) this.hitMs -= deltaMs;
    if (this.invulnerableMs > 0) this.invulnerableMs -= deltaMs;
  }

  apply(action) {
    if (this.state === 'finished') return;
    if (action === 'laneNear') this.lane = Math.min(2, this.lane + 1);
    if (action === 'laneFar') this.lane = Math.max(0, this.lane - 1);
    if (action === 'jump' && this.state !== 'jumping') {
      this.state = 'jumping';
      this.jumpMs = 1;
      this.slideMs = 0;
    }
    if (action === 'slide' && this.state !== 'jumping') {
      this.state = 'sliding';
      this.slideMs = 520;
    }
  }

  hit() {
    if (this.invulnerableMs > 0 || this.state === 'finished') return false;
    this.mistakesLeft -= 1;
    this.hitMs = 420;
    this.invulnerableMs = 950;
    return true;
  }

  finish() {
    this.state = 'finished';
  }
}
