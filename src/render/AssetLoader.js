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
    this.images.set(sprite.visualKey, { image, meta: sprite });
  }

  loadImage(path) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = path;
    });
  }

  get(visualKey) {
    return this.images.get(visualKey) || null;
  }
}
