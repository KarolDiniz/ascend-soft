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
 * Um slot de sample por material — arquivo em public/assets/audio/land/{nome}.mp3.
 * Materiais sem MP3 ainda usam fallback procedural em AudioBus.playLand().
 */
const LAND_SAMPLE_URLS: Record<MaterialId, readonly string[]> = {
  jelly: landFiles('jelly.mp3', 'jelly-kick.mp3'),
  butter: landFiles('butter.mp3'),
  mochi: landFiles('mochi.mp3'),
  marshmallow: landFiles('marshmallow.mp3'),
  chocolate: landFiles('chocolate.mp3'),
  sponge: landFiles('sponge.mp3'),
  glycerin: landFiles('handSoap.mp3', 'glycerin.mp3'),
  citrus: landFiles('citrus.mp3'),
  clearSlime: landFiles('slime.mp3'),
  whipped: landFiles('whipped.mp3'),
  honeycomb: landFiles('honeycomb.mp3'),
  soapBubble: landFiles('soapBubble.mp3'),
  bathFoam: landFiles('bathFoam.mp3'),
  lavenderSoap: landFiles('lavenderSoap.mp3'),
  creamSoap: landFiles('creamSoap.mp3'),
  keyboard: landFiles('keyboard.mp3'),
  bubbleWrap: landFiles('bubbleWrap.mp3', 'bubbleWrap-poof.mp3'),
  kinetic: landFiles('kinetic.mp3'),
  iceSoap: landFiles('iceSoap.mp3'),
  butterSlime: landFiles('butterSlime.mp3'),
  amoeba: landFiles('amoeba.mp3'),
  moss: landFiles('moss.mp3'),
  grass: landFiles('grass.mp3'),
  cotton: landFiles('cotton.mp3'),
  cloud: landFiles('cloud.mp3'),
  paper: landFiles('paper.mp3'),
  plasticBottle: landFiles('plasticBottle.mp3'),
  velvet: landFiles('velvet.mp3'),
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
    const pitch = opts.pitch ?? 1;
    const vol = opts.volume ?? 1;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = pitch;

    const g = ctx.createGain();
    const t = ctx.currentTime;
    const dur = buffer.duration / pitch;
    const playDur = Math.min(dur, opts.maxDuration ?? 0.62);
    const startOffset =
      opts.randomStart && buffer.duration > playDur + 0.04
        ? Math.random() * (buffer.duration - playDur - 0.02)
        : 0;

    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(vol * 0.72, t + playDur * 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + playDur);

    src.connect(g);
    g.connect(dest);
    src.start(t, startOffset);
    src.stop(t + playDur + 0.02);
    return true;
  }

  private async loadAll(ctx: AudioContext): Promise<void> {
    const urls = new Set<string>();
    for (const list of Object.values(LAND_SAMPLE_URLS)) {
      list.forEach((url) => urls.add(url));
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
