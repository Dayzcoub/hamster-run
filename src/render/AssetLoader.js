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
    this.images.set(sprite.visualKey, { image: cleaned, meta: sprite });
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

    for (let i = 0; i < data.length; i += 4) {
      const pixel = i / 4;
      const y = Math.floor(pixel / width);
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

      if (bakedCharacterShadow || bakedObjectShadow || softNeutralHalo || whiteMatteEdge) {
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

  get(visualKey) {
    return this.images.get(visualKey) || null;
  }
}

function clampByte(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}
