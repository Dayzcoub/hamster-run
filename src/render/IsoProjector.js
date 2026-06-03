export class IsoProjector {
  constructor() {
    this.lanes = [
      { y: 0.36, scale: 0.82, xOffset: 80 },
      { y: 0.52, scale: 1.0, xOffset: 0 },
      { y: 0.69, scale: 1.18, xOffset: -80 },
    ];
  }

  project(x, lane, width, height) {
    const laneData = this.lanes[Math.max(0, Math.min(2, Math.round(lane)))] || this.lanes[1];
    return {
      x: x + laneData.xOffset + width * 0.02,
      y: height * laneData.y,
      scale: laneData.scale,
    };
  }

  laneY(lane, height) {
    return height * this.lanes[lane].y;
  }
}
