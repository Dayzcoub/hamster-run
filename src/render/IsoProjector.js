export class IsoProjector {
  constructor() {
    this.defaultLanes = [
      { y: 0.36, scale: 0.82, xOffset: 26 },
      { y: 0.52, scale: 1.0, xOffset: 0 },
      { y: 0.69, scale: 1.18, xOffset: -26 },
    ];
    this.shortLanes = [
      { y: 0.29, scale: 0.82, xOffset: 30 },
      { y: 0.53, scale: 1.0, xOffset: 0 },
      { y: 0.78, scale: 1.18, xOffset: -30 },
    ];
  }

  lanesFor(height) {
    return height < 460 ? this.shortLanes : this.defaultLanes;
  }

  laneData(lane, height) {
    const lanes = this.lanesFor(height);
    const clamped = Math.max(0, Math.min(2, Number.isFinite(lane) ? lane : 1));
    const lowerIndex = Math.floor(clamped);
    const upperIndex = Math.ceil(clamped);
    const t = clamped - lowerIndex;
    const lower = lanes[lowerIndex] || lanes[1];
    const upper = lanes[upperIndex] || lower;

    return {
      y: lower.y + (upper.y - lower.y) * t,
      scale: lower.scale + (upper.scale - lower.scale) * t,
      xOffset: lower.xOffset + (upper.xOffset - lower.xOffset) * t,
    };
  }

  project(x, lane, width, height) {
    const laneData = this.laneData(lane, height);
    return {
      x: x + laneData.xOffset + width * 0.02,
      y: height * laneData.y,
      scale: laneData.scale,
    };
  }

  laneY(lane, height) {
    return height * this.laneData(lane, height).y;
  }
}
