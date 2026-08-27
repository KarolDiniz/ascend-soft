import type { MaterialId } from '../../audio/materials';
import { ALL_SPRITE_MATERIALS, spriteUrl } from './spriteConfig';
import { bakePlaceholderSheet, canvasToImage } from './PlaceholderGenerator';

export type SpriteSource = 'ai' | 'placeholder';

export interface MaterialSprite {
  image: CanvasImageSource;
  source: SpriteSource;
  ready: boolean;
}

class SpriteAtlasImpl {
  private sheets = new Map<MaterialId, MaterialSprite>();
  private initPromise: Promise<void> | null = null;

  get enabled(): boolean {
    return this.sheets.size > 0;
  }

  init(): Promise<void> {
    if (!this.initPromise) this.initPromise = this.loadAll();
    return this.initPromise;
  }

  get(material: MaterialId): MaterialSprite | undefined {
    return this.sheets.get(material);
  }

  has(material: MaterialId): boolean {
    const s = this.sheets.get(material);
    return !!s?.ready;
  }

  sourceOf(material: MaterialId): SpriteSource {
    return this.sheets.get(material)?.source ?? 'placeholder';
  }

  /** Count of AI-loaded sheets (for debug HUD) */
  aiCount(): number {
    let n = 0;
    for (const s of this.sheets.values()) if (s.source === 'ai') n++;
    return n;
  }

  private async loadAll(): Promise<void> {
    await Promise.all(ALL_SPRITE_MATERIALS.map((id) => this.loadMaterial(id)));
  }

  private async loadMaterial(material: MaterialId): Promise<void> {
    const placeholderCanvas = bakePlaceholderSheet(material);
    const placeholderImg = await canvasToImage(placeholderCanvas);
    this.sheets.set(material, {
      image: placeholderImg,
      source: 'placeholder',
      ready: true,
    });

    try {
      const ai = await this.fetchImage(spriteUrl(material));
      this.sheets.set(material, { image: ai, source: 'ai', ready: true });
    } catch {
      /* keep placeholder */
    }
  }

  private fetchImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth < 64 || img.naturalHeight < 32) {
          reject(new Error('sprite too small'));
          return;
        }
        resolve(img);
      };
      img.onerror = () => reject(new Error(`failed: ${url}`));
      img.src = url;
    });
  }
}

export const spriteAtlas = new SpriteAtlasImpl();
