import type { MaterialId } from './materials';

export interface LandSamplePlayOpts {
  pitch?: number;
  volume?: number;
}

/** Samples de pouso por material — decode único, reutilizado a cada colisão */
const LAND_SAMPLE_URLS: Partial<Record<MaterialId, readonly string[]>> = {
  /** Vidro / cristal quebrando (Freesound Community) */
  iceSoap: ['/assets/audio/land/iceSoap.mp3'],
  /** Sabonete — hand soap + crack (Freesound Community / Soumages) */
  glycerin: ['/assets/audio/land/handSoap.mp3', '/assets/audio/land/glycerin.mp3'],
  /** Teclado — clique (Magiaz) */
  keyboard: ['/assets/audio/land/keyboard.mp3'],
  /** Plástico bolha — estalo + puff (Alex Jauk / Freesound Community) */
  bubbleWrap: ['/assets/audio/land/bubbleWrap.mp3', '/assets/audio/land/cloud.mp3'],
  /** Garrafa na água / mergulho (Freesound Community) */
  plasticBottle: ['/assets/audio/land/plasticBottle.mp3'],
  /** Impacto de slime (Universfield) */
  clearSlime: ['/assets/audio/land/slime.mp3'],
  butterSlime: ['/assets/audio/land/slime.mp3'],
  /** Gelatina — squish + kick (Floraphonic / Freesound Community) */
  jelly: ['/assets/audio/land/jelly.mp3', '/assets/audio/land/jelly-kick.mp3'],
  /** Embalagem de chocolate (Freesound Community) */
  chocolate: ['/assets/audio/land/chocolate.mp3'],
  /** Esponja na água — squeeze (Freesound Community) */
  sponge: ['/assets/audio/land/sponge.mp3'],
  /** Passos na grama (Freesound Community) */
  grass: ['/assets/audio/land/grass.mp3'],
  /** Espuma de banho — pickup suave (Freesound Community) */
  bathFoam: ['/assets/audio/land/bathFoam.mp3'],
  /** Nuvem — puff de fumaça (Freesound Community) */
  cloud: ['/assets/audio/land/cloud.mp3'],
};

export class LandSampleBank {
  private buffers = new Map<string, AudioBuffer>();
  private loadPromise: Promise<void> | null = null;

  async load(ctx: AudioContext): Promise<void> {
    if (!this.loadPromise) this.loadPromise = this.loadAll(ctx);
    await this.loadPromise;
  }

  has(material: MaterialId): boolean {
    const urls = LAND_SAMPLE_URLS[material];
    return !!urls?.some((url) => this.buffers.has(url));
  }

  play(
    ctx: AudioContext,
    dest: AudioNode,
    material: MaterialId,
    opts: LandSamplePlayOpts = {},
  ): boolean {
    const urls = LAND_SAMPLE_URLS[material];
    if (!urls?.length) return false;

    const available = urls.filter((url) => this.buffers.has(url));
    if (!available.length) return false;

    const url = available[Math.floor(Math.random() * available.length)]!;
    const buffer = this.buffers.get(url)!;
    const pitch = opts.pitch ?? 1;
    const vol = opts.volume ?? 1;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = pitch;

    const g = ctx.createGain();
    const t = ctx.currentTime;
    const dur = buffer.duration / pitch;
    const playDur = Math.min(dur, 0.62);

    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(vol * 0.72, t + playDur * 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + playDur);

    src.connect(g);
    g.connect(dest);
    src.start(t);
    src.stop(t + playDur + 0.02);
    return true;
  }

  private async loadAll(ctx: AudioContext): Promise<void> {
    const urls = new Set<string>();
    for (const list of Object.values(LAND_SAMPLE_URLS)) {
      list?.forEach((url) => urls.add(url));
    }
    await Promise.all([...urls].map((url) => this.fetchOne(ctx, url)));
  }

  private async fetchOne(ctx: AudioContext, url: string): Promise<void> {
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const ab = await res.arrayBuffer();
      const buf = await ctx.decodeAudioData(ab.slice(0));
      this.buffers.set(url, buf);
    } catch {
      // Mantém fallback procedural em playLand
    }
  }
}
