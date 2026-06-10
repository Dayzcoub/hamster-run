import { backdrops } from '../data/backdrops.js';

const OPTIONAL_THEMED_OBSTACLE_SPRITES = [
  { visualKey: 'wedding_generator', role: 'pending wedding generator obstacle art', fallbackVisualKey: 'cart', scaleHint: 1.05 },
  { visualKey: 'wedding_wet_cable', role: 'pending wet cable obstacle art', fallbackVisualKey: 'cable_loop', scaleHint: 0.95 },
  { visualKey: 'wedding_guest_chair', role: 'pending guest chair obstacle art', fallbackVisualKey: 'mystery_box', scaleHint: 1 },
  { visualKey: 'wedding_decor_arch', role: 'pending wedding decor arch slide obstacle art', fallbackVisualKey: 'mic_stand', scaleHint: 1.08 },
  { visualKey: 'concert_subwoofer', role: 'pending concert subwoofer obstacle art', fallbackVisualKey: 'flight_case', scaleHint: 1.15 },
  { visualKey: 'concert_smoke_machine', role: 'pending smoke machine obstacle art', fallbackVisualKey: 'mystery_box', scaleHint: 0.95 },
  { visualKey: 'concert_moving_head', role: 'pending moving head obstacle art', fallbackVisualKey: 'mic_stand', scaleHint: 1 },
  { visualKey: 'concert_cases_with_truss', role: 'pending cases with truss slide obstacle art', fallbackVisualKey: 'mic_stand', scaleHint: 1.08 },
  { visualKey: 'concert_stagehands_carrying_truss', role: 'pending stagehands carrying truss slide obstacle art', fallbackVisualKey: 'mic_stand', scaleHint: 1.12 },
  { visualKey: 'kids_toy_car', role: 'pending toy car obstacle art', fallbackVisualKey: 'cart', scaleHint: 0.9 },
  { visualKey: 'kids_blocks', role: 'pending kids blocks obstacle art', fallbackVisualKey: 'mystery_box', scaleHint: 0.85 },
  { visualKey: 'kids_sock_trap', role: 'pending sock trap obstacle art', fallbackVisualKey: 'cable_loop', scaleHint: 0.8 },
].map((sprite) => ({
  type: 'obstacle',
  png: `assets/sprites/obstacles/png/${sprite.visualKey}.png`,
  webp: `assets/sprites/obstacles/webp/${sprite.visualKey}.webp`,
  sourceSize: { width: 768, height: 768 },
  anchor: { x: 0.5, y: 0.84 },
  status: 'pending_art_optional',
  ...sprite,
}));

export class AssetLoader {
  constructor(manifestPath) {
    this.manifestPath = manifestPath;
    this.manifest = null;
    this.images = new Map();
    this.spriteFallbacks = new Map();
  }

  async load() {
    const response = await fetch(this.manifestPath);
    if (!response.ok) throw new Error(`Failed to load asset manifest: ${response.status}`);
    this.manifest = await response.json();
    await Promise.all(Object.values(this.manifest.sprites).filter(shouldPreloadSprite).map((sprite) => this.loadSprite(sprite)));
    await this.loadOptionalThemedObstacles();
    await this.loadBackdrops();
  }

  async loadBackdrops() {
    await Promise.all(Object.values(backdrops).map(async (backdrop) => {
      try {
        const image = await this.loadImage(backdrop.webp || backdrop.png);
        this.images.set(backdrop.visualKey, { image, meta: backdrop });
      } catch {
        // Some future level backdrops are intentionally declared before the art exists.
        // Missing files should fall back to the procedural canvas background.
      }
    }));
  }

  async loadOptionalThemedObstacles() {
    await Promise.all(OPTIONAL_THEMED_OBSTACLE_SPRITES.map(async (sprite) => {
      this.spriteFallbacks.set(sprite.visualKey, sprite.fallbackVisualKey);
      try {
        await this.loadSprite(sprite);
      } catch {
        // These obstacle assets are intentionally wired before the final art exists.
        // The renderer will use fallbackVisualKey until the transparent PNG/WebP is added.
      }
    }));
  }

  async loadSprite(sprite) {
    const preferred = sprite.webp || sprite.png;
    const fallback = sprite.png;
    const image = await this.loadImage(preferred).catch(() => this.loadImage(fallback));
    const cleaned = this.cleanSprite(image, sprite);
    const trimmed = this.trimTransparentBounds(cleaned, sprite);
    this.images.set(sprite.visualKey, { image: trimmed, meta: sprite });
  }

  loadImage(path) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = path;
    });
  }

  cleanSprite(image, sprite) {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    const isCharacter = sprite.type === 'character';
    const isCableLoop = sprite.visualKey === 'cable_loop';
    const isTrussSection = sprite.visualKey?.startsWith('truss_section_');

    if (isTrussSection) this.removeConnectedLightBackground(imageData, width, height);

    for (let i = 0; i < data.length; i += 4) {
      const pixel = i / 4;
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      const xNorm = x / width;
      const yNorm = y / height;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      let a = data[i + 3] / 255;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const chroma = max - min;

      const bakedCharacterShadow = isCharacter && yNorm > 0.62 && chroma < 42 && max > 45;
      const bakedObjectShadow = !isCharacter && !isTrussSection && yNorm > 0.62 && chroma < 42 && max > 130;
      const softNeutralHalo = a > 0.02 && a < 0.82 && chroma < 48 && max > 35;
      const whiteMatteEdge = a > 0.02 && a < 0.98 && chroma < 52 && max > 214;
      const trussBakedWhite = isTrussSection && a > 0.84 && chroma < 30 && max > 226;
      const cableLoopInnerWhiteMatte = isCableLoop
        && a > 0.62
        && chroma < 62
        && max > 175
        && xNorm > 0.18
        && xNorm < 0.82
        && yNorm > 0.18
        && yNorm < 0.76;

      if (bakedCharacterShadow || bakedObjectShadow || softNeutralHalo || whiteMatteEdge || trussBakedWhite || cableLoopInnerWhiteMatte) {
        data[i + 3] = 0;
        continue;
      }

      if (a > 0.02 && a < 0.98) {
        a = Math.max(a, 0.03);
        data[i] = clampByte((r - (1 - a) * 255) / a);
        data[i + 1] = clampByte((g - (1 - a) * 255) / a);
        data[i + 2] = clampByte((b - (1 - a) * 255) / a);
      }

      if (a < 0.04) data[i + 3] = 0;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  removeConnectedLightBackground(imageData, width, height) {
    const data = imageData.data;
    const visited = new Uint8Array(width * height);
    const queue = [];
    const enqueue = (x, y) => {
      if (x < 0 || y < 0 || x >= width || y >= height) return;
      const index = y * width + x;
      if (visited[index]) return;
      const offset = index * 4;
      if (!isTrussBackgroundPixel(data[offset], data[offset + 1], data[offset + 2], data[offset + 3])) return;
      visited[index] = 1;
      queue.push(index);
    };

    for (let x = 0; x < width; x += 1) {
      enqueue(x, 0);
      enqueue(x, height - 1);
    }
    for (let y = 0; y < height; y += 1) {
      enqueue(0, y);
      enqueue(width - 1, y);
    }

    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const index = queue[cursor];
      const x = index % width;
      const y = Math.floor(index / width);
      const offset = index * 4;
      data[offset + 3] = 0;
      enqueue(x + 1, y);
      enqueue(x - 1, y);
      enqueue(x, y + 1);
      enqueue(x, y - 1);
    }
  }

  trimTransparentBounds(source, sprite) {
    const sourceCtx = source.getContext('2d', { willReadFrequently: true });
    const imageData = sourceCtx.getImageData(0, 0, source.width, source.height);
    const data = imageData.data;
    const threshold = sprite.type === 'character' ? 14 : 10;
    let minX = source.width;
    let minY = source.height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < source.height; y += 1) {
      for (let x = 0; x < source.width; x += 1) {
        const alpha = data[(y * source.width + x) * 4 + 3];
        if (alpha <= threshold) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (maxX < minX || maxY < minY) return source;

    const padding = sprite.type === 'character' ? 10 : 6;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(source.width - 1, maxX + padding);
    maxY = Math.min(source.height - 1, maxY + padding);

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const target = document.createElement('canvas');
    target.width = width;
    target.height = height;
    target.getContext('2d').drawImage(source, minX, minY, width, height, 0, 0, width, height);
    return target;
  }

  get(visualKey) {
    const sprite = this.images.get(visualKey);
    if (sprite) return sprite;

    const fallbackVisualKey = this.spriteFallbacks.get(visualKey);
    if (fallbackVisualKey) return this.images.get(fallbackVisualKey) || null;

    return null;
  }
}

function shouldPreloadSprite(sprite) {
  return sprite?.type !== 'obstacle_reference';
}

function isTrussBackgroundPixel(r, g, b, alpha) {
  if (alpha < 8) return true;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const chroma = max - min;
  return max > 166 && chroma < 42;
}

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}