import { CanvasRenderer } from './CanvasRenderer.js';

const THEMED_OBSTACLE_SCALE_OVERRIDES = {
  wedding_generator: 1.05,
  wedding_wet_cable: 0.95,
  wedding_guest_chair: 1,

  concert_subwoofer: 1.15,
  concert_smoke_machine: 0.95,
  concert_moving_head: 1,

  kids_toy_car: 0.9,
  kids_blocks: 0.85,
  kids_sock_trap: 0.8,
};

const baseSpriteScale = CanvasRenderer.prototype.spriteScale;

CanvasRenderer.prototype.spriteScale = function spriteScaleWithThemedObstacleOverrides(visualKey) {
  return THEMED_OBSTACLE_SCALE_OVERRIDES[visualKey] || baseSpriteScale.call(this, visualKey);
};
