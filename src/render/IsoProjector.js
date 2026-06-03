export class IsoProjector {
  constructor() {
    this.defaultLanes = [
      { y: 0.36, scale: 0.82, xOffset: 80 },
      { y: 0.52, scale: 1.0, xOffset: 0 },
      { y: 0.69, scale: 1.18, xOffset: -80 },
    ];
    this.shortLanes = [
      { y: 0.29, scale: 0.82, xOffset: 86 },
      { y: 0.53, scale: 1.0, xOffset: 0 },
      { y: 0.78, scale: 1.18, xOffset: -86 },
    ];
  }

  lanesFor(height) {
    return height < 460 ? this.shortLanes : this.defaultLanes;
  }

  project(x, lane, width, height) {
    const lanes = this.lanesFor(height);
    const laneData = lanes[Math.max(0, Math.min(2, Math.round(lane)))] || lanes[1];
    return {
      x: x + laneData.xOffset + width * 0.02,
      y: height * laneData.y,
      scale: laneData.scale,
    };
  }

  laneY(lane, height) {
    return height * this.lanesFor(height)[lane].y;
  }
}
