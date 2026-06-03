export class AssetLoader {
  constructor(manifestPath) {
    this.manifestPath = manifestPath;
    this.manifest = null;
    this.images = new Map();
  }

  async load() {
    const response = await fetch(this.manifestPath);
    if (!response.ok) throw new Error(`Failed to load asset manifest: ${response.status}`);
    this.manifest = await response.json();
    await Promise.all(Object.values(this.manifest.sprites).map((sprite) => this.loadSprite(sprite)));
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
      const bakedObjectShadow = !isCharacter && yNorm > 0.62 && chroma < 42 && max > 130;
      const softNeutralHalo = a > 0.02 && a < 0.82 && chroma < 48 && max > 35;
      const whiteMatteEdge = a > 0.02 && a < 0.98 && chroma < 52 && max > 214;
      const cableLoopInnerWhiteMatte = isCableLoop
        && a > 0.62
        && chroma < 62
        && max > 175
        && xNorm > 0.18
        && xNorm < 0.82
        && yNorm > 0.18
        && yNorm < 0.76;

      if (bakedCharacterShadow || bakedObjectShadow || softNeutralHalo || whiteMatteEdge || cableLoopInnerWhiteMatte) {
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
    return this.images.get(visualKey) || null;
  }
}

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}
