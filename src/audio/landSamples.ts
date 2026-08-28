import type { MaterialId } from './materials';

export interface LandSamplePlayOpts {
  pitch?: number;
  volume?: number;
  /** Duração máxima do clip — útil para samples longos (ex.: passos) */
  maxDuration?: number;
  /** Início aleatório no buffer — varia o ponto do sample */
  randomStart?: boolean;
}

const LAND_AUDIO_BASE = `${import.meta.env.BASE_URL}assets/audio/land/`;

function landFiles(...names: string[]): readonly string[] {
  return names.map((name) => `${LAND_AUDIO_BASE}${name}`);
}

/**
 * Sample de pouso por material — arquivos em public/assets/audio/land/.
 * No disco hoje: bathFoam, bubbleWrap, bubbleWrap-poof, chocolate, cloud, glycerin,
 * grass, handSoap, iceSoap, jelly, jelly-kick, keyboard, kitten, mushroom, plasticBottle,
 * popcorn, seashell, slime, sponge.
 * Materiais sem MP3 dedicado usam proxy sonoro; se o fetch falhar, AudioBus usa síntese procedural.
 */
const LAND_SAMPLE_URLS: Record<MaterialId, readonly string[]> = {
  jelly: landFiles('jelly.mp3', 'jelly-kick.mp3'),
  butter: landFiles('jelly.mp3'),
  mochi: landFiles('sponge.mp3'),
  marshmallow: landFiles('cloud.mp3'),
  chocolate: landFiles('chocolate.mp3'),
  sponge: landFiles('sponge.mp3'),
  glycerin: landFiles('handSoap.mp3', 'glycerin.mp3'),
  citrus: landFiles('sponge.mp3'),
  clearSlime: landFiles('slime.mp3'),
  whipped: landFiles('bathFoam.mp3'),
  honeycomb: landFiles('chocolate.mp3'),
  soapBubble: landFiles('bubbleWrap-poof.mp3', 'bathFoam.mp3'),
  bathFoam: landFiles('bathFoam.mp3'),
  lavenderSoap: landFiles('handSoap.mp3', 'glycerin.mp3'),
  creamSoap: landFiles('handSoap.mp3', 'glycerin.mp3'),
  keyboard: landFiles('keyboard.mp3'),
  bubbleWrap: landFiles('bubbleWrap.mp3', 'bubbleWrap-poof.mp3'),
  kinetic: landFiles('sponge.mp3'),
  iceSoap: landFiles('iceSoap.mp3'),
  butterSlime: landFiles('slime.mp3'),
  amoeba: landFiles('slime.mp3'),
  moss: landFiles('grass.mp3'),
  grass: landFiles('grass.mp3'),
  cotton: landFiles('cloud.mp3'),
  cloud: landFiles('cloud.mp3'),
  paper: landFiles('keyboard.mp3'),
  plasticBottle: landFiles('plasticBottle.mp3'),
  velvet: landFiles('cloud.mp3'),
  blossom: landFiles(), // som procedural — pétalas + campainha
  marimba: landFiles(), // tom procedural — nota muda por barra
  crystal: landFiles('iceSoap.mp3'),
  ceramic: landFiles('glycerin.mp3'),
  clay: landFiles('sponge.mp3'),
  silk: landFiles('cloud.mp3'),
  kitten: landFiles('kitten.mp3'),
  mushroom: landFiles('mushroom.mp3'),
  kalimba: landFiles(),
  xylophone: landFiles(),
  tambourine: landFiles(),
  popcorn: landFiles('popcorn.mp3'),
  bamboo: landFiles(),
  cork: landFiles(),
  seashell: landFiles('seashell.mp3'),
  macaron: landFiles(),
  boba: landFiles(),
  feather: landFiles(),
  woodBlock: landFiles(),
};

export class LandSampleBank {
  private buffers = new Map<string, AudioBuffer>();
  private loading: Promise<void> | null = null;
  private loadCtx: AudioContext | null = null;

  async load(ctx: AudioContext): Promise<void> {
    if (this.loadCtx !== ctx) {
      this.buffers.clear();
      this.loading = null;
      this.loadCtx = ctx;
    }
    if (!this.loading) {
      this.loading = this.loadAll(ctx).finally(() => {
        this.loading = null;
      });
    }
    await this.loading;
    const missing = this.missingUrls();
    if (missing.length > 0) {
      await Promise.all(missing.map((url) => this.fetchOne(ctx, url)));
    }
  }

  has(material: MaterialId): boolean {
    const urls = LAND_SAMPLE_URLS[material];
    return urls.some((url) => this.buffers.has(url));
  }

  play(
    ctx: AudioContext,
    dest: AudioNode,
    material: MaterialId,
    opts: LandSamplePlayOpts = {},
  ): boolean {
    const urls = LAND_SAMPLE_URLS[material];
    const available = urls.filter((url) => this.buffers.has(url));
    if (!available.length) return false;

    const url = available[Math.floor(Math.random() * available.length)]!;
    const buffer = this.buffers.get(url)!;
    const pitch = Math.max(0.25, opts.pitch ?? 1);
    const vol = Math.max(0.0001, opts.volume ?? 1);

    try {
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = pitch;

      const g = ctx.createGain();
      const t = ctx.currentTime;
      const dur = buffer.duration / pitch;
      const playDur = Math.min(Math.max(0.04, dur), opts.maxDuration ?? 0.62);
      const startOffset =
        opts.randomStart && buffer.duration > playDur + 0.04
          ? Math.random() * (buffer.duration - playDur - 0.02)
          : 0;

      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol * 0.72), t + playDur * 0.5);
      g.gain.exponentialRampToValueAtTime(0.0001, t + playDur);

      src.connect(g);
      g.connect(dest);
      src.start(t, startOffset);
      src.stop(t + playDur + 0.02);
      return true;
    } catch {
      return false;
    }
  }

  private missingUrls(): string[] {
    const urls = new Set<string>();
    for (const list of Object.values(LAND_SAMPLE_URLS)) {
      list.forEach((url) => urls.add(url));
    }
    return [...urls].filter((url) => !this.buffers.has(url));
  }

  private async loadAll(ctx: AudioContext): Promise<void> {
    const missing = this.missingUrls();
    await Promise.all(missing.map((url) => this.fetchOne(ctx, url)));
  }

  private async fetchOne(ctx: AudioContext, url: string): Promise<void> {
    if (this.buffers.has(url)) return;
    try {
      const res = await fetch(url);
      if (!res.ok) return;
      const ab = await res.arrayBuffer();
      const buf = await ctx.decodeAudioData(ab);
      this.buffers.set(url, buf);
    } catch {
      // Mantém fallback procedural em playLand
    }
  }
}
