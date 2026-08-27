import type { MaterialId } from './materials';

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export class AudioBus {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfx: GainNode | null = null;
  private ambient: GainNode | null = null;
  private music: GainNode | null = null;
  private ambientGainBase = 0.42;
  private noiseCache = new Map<number, AudioBuffer>();
  private started = false;
  private muted = false;
  private volume = 0.55;
  /** Soft generative BGM scheduler */
  private musicStep = 0;
  private nextMusicTime = 0;
  private musicTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly musicBpm = 66;

  get isMuted(): boolean {
    return this.muted;
  }

  get isReady(): boolean {
    return this.started;
  }

  async unlock(): Promise<void> {
    if (this.started) {
      if (this.ctx?.state === 'suspended') await this.ctx.resume();
      return;
    }
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.sfx = this.ctx.createGain();
    this.ambient = this.ctx.createGain();
    this.music = this.ctx.createGain();
    this.sfx.connect(this.master);
    this.ambient.connect(this.master);
    this.music.connect(this.ambient);
    this.master.connect(this.ctx.destination);
    this.applyGains();
    // Resume before starting sources — required on Chrome/Safari
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.started = true;
    this.startAmbient();
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyGains();
  }

  setVolume(v: number): void {
    this.volume = clamp(v, 0, 1);
    this.applyGains();
  }

  private applyGains(): void {
    if (!this.master || !this.sfx || !this.ambient || !this.ctx) return;
    const now = this.ctx.currentTime;
    const m = this.muted ? 0 : this.volume;
    this.master.gain.setTargetAtTime(m, now, 0.05);
    this.sfx.gain.setTargetAtTime(0.95, now, 0.05);
    this.ambient.gain.setTargetAtTime(this.ambientGainBase, now, 0.08);
  }

  private duckAmbient(ms = 100): void {
    if (!this.ambient || !this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const g = this.ambient.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(this.ambientGainBase * 0.35, t + 0.02);
    g.linearRampToValueAtTime(this.ambientGainBase, t + ms / 1000);
  }

  private startAmbient(): void {
    if (!this.ctx || !this.ambient || !this.music) return;
    const ctx = this.ctx;

    // Warm pink-ish noise bed (ASMR hush)
    const noise = this.noiseBuffer(ctx, 2, true);
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 380;
    const ng = ctx.createGain();
    ng.gain.value = 0.04;
    src.connect(filter);
    filter.connect(ng);
    ng.connect(this.ambient);
    src.start();

    // Soft root drone (F2 / C3)
    for (const f of [87.31, 130.81]) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = f * (1 + (Math.random() - 0.5) * 0.003);
      g.gain.value = 0.045;
      const lfo = ctx.createOscillator();
      const lfoG = ctx.createGain();
      lfo.frequency.value = 0.03 + Math.random() * 0.025;
      lfoG.gain.value = 0.012;
      lfo.connect(lfoG);
      lfoG.connect(g.gain);
      osc.connect(g);
      g.connect(this.ambient);
      osc.start();
      lfo.start();
    }

    this.music.gain.value = 1;
    this.nextMusicTime = ctx.currentTime + 0.12;
    this.musicStep = 0;
    this.scheduleMusic();
  }

  /**
   * Soft generative loop — Fmaj7 → Am7 → Bbmaj7 → Cadd9
   * Slow arpeggios + airy bells; ducking still applies via ambient bus.
   */
  private scheduleMusic(): void {
    if (!this.ctx || !this.music) return;
    if (!this.started || this.muted) {
      if (this.musicTimer !== null) clearTimeout(this.musicTimer);
      this.musicTimer = setTimeout(() => this.scheduleMusic(), 120);
      return;
    }
    const ctx = this.ctx;
    // Keep scheduling even if context was briefly suspended
    if (ctx.state === 'suspended') void ctx.resume();

    const stepDur = 60 / this.musicBpm / 2;
    const horizon = 0.25;

    while (this.nextMusicTime < ctx.currentTime + horizon) {
      // Skip notes that are already in the past (tab was backgrounded)
      if (this.nextMusicTime >= ctx.currentTime - 0.02) {
        this.playMusicStep(this.musicStep, this.nextMusicTime);
      }
      this.nextMusicTime += stepDur;
      this.musicStep += 1;
    }

    if (this.musicTimer !== null) clearTimeout(this.musicTimer);
    this.musicTimer = setTimeout(() => this.scheduleMusic(), 40);
  }

  private playMusicStep(step: number, t: number): void {
    if (!this.ctx || !this.music) return;
    const ctx = this.ctx;
    const dest = this.music;
    const bar = Math.floor(step / 8) % 4;
    const beat = step % 8;

    // Chord tones (Hz) — warm F major family
    const chords: number[][] = [
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [220.0, 261.63, 329.63, 392.0], // Am7
      [233.08, 293.66, 349.23, 440.0], // Bbmaj7
      [261.63, 329.63, 392.0, 493.88], // Cadd9
    ];
    const chord = chords[bar];

    // Soft pad swell on bar downbeat
    if (beat === 0) {
      for (let i = 0; i < 3; i++) {
        this.musicTone(ctx, dest, 'sine', chord[i], chord[i], 3.2, 0.07 - i * 0.012, t + i * 0.02);
      }
      this.musicTone(ctx, dest, 'triangle', chord[0] * 0.5, chord[0] * 0.5, 3.4, 0.05, t);
    }

    // Satisfying arpeggio — sparse, never busy
    const arpPattern = [0, 2, 1, 3, 2, 0, 3, 1];
    if (beat % 2 === 0 || beat === 3 || beat === 7) {
      const idx = arpPattern[beat];
      const f = chord[idx] * (beat >= 6 ? 2 : 1);
      const vol = beat === 0 ? 0.11 : 0.08;
      this.musicTone(ctx, dest, 'sine', f, f * 1.002, 0.9, vol, t);
      this.musicTone(ctx, dest, 'triangle', f * 1.003, f * 1.003, 0.6, vol * 0.4, t + 0.01);
    }

    // Airy sparkle every 2 bars
    if (step % 16 === 12) {
      const sparkle = chord[3] * 2;
      this.musicTone(ctx, dest, 'sine', sparkle, sparkle * 1.01, 1.4, 0.055, t);
      this.musicTone(ctx, dest, 'sine', sparkle * 1.5, sparkle * 1.5, 1.0, 0.03, t + 0.06);
    }

    // Soft breath pulse on off-bars
    if (beat === 4 && bar % 2 === 1) {
      this.musicBreath(ctx, dest, t);
    }
  }

  private musicTone(
    ctx: AudioContext,
    dest: GainNode,
    type: OscillatorType,
    f0: number,
    f1: number,
    dur: number,
    vol: number,
    t: number,
  ): void {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2400;
    filter.Q.value = 0.5;
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(40, f0), t);
    if (Math.abs(f0 - f1) > 0.5) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur * 0.9);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.04);
    g.gain.exponentialRampToValueAtTime(vol * 0.55, t + dur * 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(filter);
    filter.connect(g);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  private musicBreath(ctx: AudioContext, dest: GainNode, t: number): void {
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(ctx, 0.45, true);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(520, t);
    filter.frequency.exponentialRampToValueAtTime(780, t + 0.35);
    filter.Q.value = 0.7;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.055, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
    src.connect(filter);
    filter.connect(g);
    g.connect(dest);
    src.start(t);
    src.stop(t + 0.45);
  }

  playJump(): void {
    this.withCtx((ctx, sfx) => {
      const t = ctx.currentTime;
      const noise = this.noiseBuffer(ctx, 0.2);
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, t);
      filter.frequency.exponentialRampToValueAtTime(400, t + 0.15);
      filter.Q.value = 0.7;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.1, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      src.connect(filter);
      filter.connect(g);
      g.connect(sfx);
      src.start(t);
      src.stop(t + 0.18);
    });
  }

  playLand(material: MaterialId, perfect: boolean, streak = 0): void {
    this.withCtx((ctx, sfx) => {
      this.duckAmbient(110);
      const pitch = 0.92 + Math.random() * 0.16;
      const handlers: Record<MaterialId, () => void> = {
        jelly: () => this.jellyPloop(ctx, sfx, pitch),
        butter: () => this.butterThup(ctx, sfx, pitch),
        mochi: () => this.mochiBounce(ctx, sfx, pitch),
        chocolate: () => this.chocolateRipple(ctx, sfx, pitch),
        citrus: () => this.citrusZest(ctx, sfx, pitch),
        honeycomb: () => this.honeyDrip(ctx, sfx, pitch),
        glycerin: () => this.soapSquish(ctx, sfx, pitch),
        whipped: () => this.whippedFoam(ctx, sfx, pitch),
        kinetic: () => this.kineticShush(ctx, sfx, pitch),
        iceSoap: () => this.iceTing(ctx, sfx, pitch),
        clearSlime: () => this.slimeBlorp(ctx, sfx, pitch),
        butterSlime: () => this.butterSlimeFold(ctx, sfx, pitch),
      };
      handlers[material]();
      if (perfect) this.perfectChime(ctx, sfx, pitch, streak);
    });
  }

  playFall(): void {
    this.withCtx((ctx, sfx) => {
      const t = ctx.currentTime;
      const noise = this.noiseBuffer(ctx, 0.85);
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(700, t);
      filter.frequency.exponentialRampToValueAtTime(140, t + 0.7);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.07, t + 0.06);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
      src.connect(filter);
      filter.connect(g);
      g.connect(sfx);
      src.start(t);
      src.stop(t + 0.85);

      const osc = ctx.createOscillator();
      const og = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(55, t + 0.65);
      og.gain.setValueAtTime(0.05, t);
      og.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      osc.connect(og);
      og.connect(sfx);
      osc.start(t);
      osc.stop(t + 0.72);
    });
  }

  playBreath(): void {
    this.withCtx((ctx, sfx) => {
      const t = ctx.currentTime;
      const noise = this.noiseBuffer(ctx, 0.35);
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(500, t);
      filter.frequency.exponentialRampToValueAtTime(900, t + 0.25);
      filter.Q.value = 0.8;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.08, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      src.connect(filter);
      filter.connect(g);
      g.connect(sfx);
      src.start(t);
      src.stop(t + 0.35);
    });
  }

  playRecord(): void {
    this.withCtx((ctx, sfx) => {
      const t = ctx.currentTime;
      for (const [i, f] of [523.25, 659.25, 783.99].entries()) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = f;
        const st = t + i * 0.08;
        g.gain.setValueAtTime(0.0001, st);
        g.gain.exponentialRampToValueAtTime(0.06, st + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, st + 0.35);
        osc.connect(g);
        g.connect(sfx);
        osc.start(st);
        osc.stop(st + 0.4);
      }
    });
  }

  playMeltDrip(): void {
    this.withCtx((ctx, sfx) => {
      const t = ctx.currentTime;
      this.tone(ctx, sfx, 'sine', 140, 70, 0.12, 0.04, t);
      this.noiseBurst(ctx, sfx, 0.06, 350, 0.03, t);
    });
  }

  playMeltGone(): void {
    this.withCtx((ctx, sfx) => {
      const t = ctx.currentTime;
      this.duckAmbient(140);
      this.tone(ctx, sfx, 'sine', 180, 60, 0.35, 0.1, t);
      this.noiseBurst(ctx, sfx, 0.2, 400, 0.06, t);
    });
  }

  playCrack(): void {
    this.withCtx((ctx, sfx) => {
      const t = ctx.currentTime;
      this.noiseBurst(ctx, sfx, 0.05, 2400, 0.07, t, 'bandpass');
      this.tone(ctx, sfx, 'triangle', 900, 400, 0.08, 0.05, t);
    });
  }

  playShatter(): void {
    this.withCtx((ctx, sfx) => {
      const t = ctx.currentTime;
      this.duckAmbient(160);
      this.tone(ctx, sfx, 'sine', 1200, 600, 0.12, 0.06, t);
      this.noiseBurst(ctx, sfx, 0.18, 2800, 0.1, t, 'bandpass');
      this.noiseBurst(ctx, sfx, 0.25, 900, 0.07, t + 0.04);
      this.tone(ctx, sfx, 'sine', 480, 180, 0.3, 0.05, t + 0.06);
    });
  }

  playCrumbleLoop(): void {
    this.withCtx((ctx, sfx) => {
      const t = ctx.currentTime;
      this.noiseBurst(ctx, sfx, 0.08, 700, 0.035, t);
    });
  }

  playCrumbleGone(): void {
    this.withCtx((ctx, sfx) => {
      const t = ctx.currentTime;
      this.duckAmbient(120);
      this.noiseBurst(ctx, sfx, 0.35, 600, 0.1, t);
      this.tone(ctx, sfx, 'sine', 120, 50, 0.3, 0.06, t);
    });
  }

  playFoamPop(): void {
    this.withCtx((ctx, sfx) => {
      const t = ctx.currentTime;
      this.duckAmbient(120);
      this.tone(ctx, sfx, 'sine', 280, 90, 0.16, 0.12, t);
      this.noiseBurst(ctx, sfx, 0.12, 1400, 0.09, t, 'highpass');
      this.tone(ctx, sfx, 'triangle', 420, 160, 0.1, 0.05, t + 0.03);
    });
  }

  playSqueeze(): void {
    this.withCtx((ctx, sfx) => {
      const t = ctx.currentTime;
      this.noiseBurst(ctx, sfx, 0.1, 1800, 0.07, t, 'bandpass');
      this.tone(ctx, sfx, 'sine', 240, 100, 0.14, 0.08, t);
    });
  }

  playSoftVanish(): void {
    this.withCtx((ctx, sfx) => {
      const t = ctx.currentTime;
      this.tone(ctx, sfx, 'sine', 220, 80, 0.25, 0.04, t);
    });
  }

  /** Soft whoosh / chime when entering a new altitude biome */
  playBiomeEnter(zoneId: string): void {
    this.withCtx((ctx, sfx) => {
      const t = ctx.currentTime;
      const base =
        zoneId === 'garden'
          ? 392
          : zoneId === 'bakery'
            ? 440
            : zoneId === 'spa'
              ? 494
              : zoneId === 'frost'
                ? 523
                : 349;
      this.noiseBurst(ctx, sfx, 0.18, 900, 0.045, t, 'bandpass');
      this.tone(ctx, sfx, 'sine', base, base * 1.5, 0.35, 0.06, t);
      this.tone(ctx, sfx, 'triangle', base * 1.5, base * 2, 0.28, 0.035, t + 0.04);
    });
  }

  // —— Material one-shots ——

  private jellyPloop(ctx: AudioContext, sfx: GainNode, pitch: number): void {
    const t = ctx.currentTime;
    this.tone(ctx, sfx, 'sine', 200 * pitch, 80 * pitch, 0.2, 0.17, t);
    this.tone(ctx, sfx, 'triangle', 120 * pitch, 90 * pitch, 0.1, 0.09, t);
    this.noiseBurst(ctx, sfx, 0.06, 600, 0.05, t);
  }

  private butterThup(ctx: AudioContext, sfx: GainNode, pitch: number): void {
    const t = ctx.currentTime;
    this.tone(ctx, sfx, 'sine', 160 * pitch, 70 * pitch, 0.14, 0.14, t);
    this.noiseBurst(ctx, sfx, 0.05, 400, 0.07, t);
  }

  private mochiBounce(ctx: AudioContext, sfx: GainNode, pitch: number): void {
    const t = ctx.currentTime;
    this.tone(ctx, sfx, 'sine', 280 * pitch, 140 * pitch, 0.22, 0.14, t);
    this.tone(ctx, sfx, 'triangle', 180 * pitch, 100 * pitch, 0.12, 0.08, t + 0.04);
  }

  private chocolateRipple(ctx: AudioContext, sfx: GainNode, pitch: number): void {
    const t = ctx.currentTime;
    this.tone(ctx, sfx, 'sine', 140 * pitch, 60 * pitch, 0.25, 0.12, t);
    this.noiseBurst(ctx, sfx, 0.08, 280, 0.06, t);
  }

  private citrusZest(ctx: AudioContext, sfx: GainNode, pitch: number): void {
    const t = ctx.currentTime;
    this.noiseBurst(ctx, sfx, 0.07, 2200 * pitch, 0.09, t, 'bandpass');
    this.tone(ctx, sfx, 'triangle', 520 * pitch, 260 * pitch, 0.08, 0.06, t);
  }

  private honeyDrip(ctx: AudioContext, sfx: GainNode, pitch: number): void {
    const t = ctx.currentTime;
    this.tone(ctx, sfx, 'sine', 240 * pitch, 90 * pitch, 0.28, 0.11, t);
    this.tone(ctx, sfx, 'sine', 180 * pitch, 70 * pitch, 0.2, 0.06, t + 0.05);
  }

  private soapSquish(ctx: AudioContext, sfx: GainNode, pitch: number): void {
    const t = ctx.currentTime;
    this.tone(ctx, sfx, 'sine', 300 * pitch, 120 * pitch, 0.14, 0.1, t);
    this.noiseBurst(ctx, sfx, 0.12, 1800, 0.07, t, 'highpass');
  }

  private whippedFoam(ctx: AudioContext, sfx: GainNode, pitch: number): void {
    const t = ctx.currentTime;
    this.noiseBurst(ctx, sfx, 0.18, 900 * pitch, 0.1, t);
    this.tone(ctx, sfx, 'triangle', 220 * pitch, 110 * pitch, 0.12, 0.05, t);
  }

  private kineticShush(ctx: AudioContext, sfx: GainNode, pitch: number): void {
    const t = ctx.currentTime;
    this.noiseBurst(ctx, sfx, 0.2, 700 * pitch, 0.11, t);
    this.noiseBurst(ctx, sfx, 0.12, 1400, 0.05, t + 0.03, 'bandpass');
  }

  private iceTing(ctx: AudioContext, sfx: GainNode, pitch: number): void {
    const t = ctx.currentTime;
    this.tone(ctx, sfx, 'sine', 760 * pitch, 760 * pitch, 0.32, 0.07, t);
    this.tone(ctx, sfx, 'sine', 1140 * pitch, 1140 * pitch, 0.22, 0.035, t);
  }

  private slimeBlorp(ctx: AudioContext, sfx: GainNode, pitch: number): void {
    const t = ctx.currentTime;
    this.tone(ctx, sfx, 'sine', 260 * pitch, 70 * pitch, 0.22, 0.15, t);
    this.tone(ctx, sfx, 'triangle', 150 * pitch, 60 * pitch, 0.18, 0.08, t + 0.02);
    this.noiseBurst(ctx, sfx, 0.08, 500, 0.05, t);
  }

  private butterSlimeFold(ctx: AudioContext, sfx: GainNode, pitch: number): void {
    const t = ctx.currentTime;
    this.tone(ctx, sfx, 'sine', 190 * pitch, 80 * pitch, 0.2, 0.13, t);
    this.noiseBurst(ctx, sfx, 0.1, 450, 0.07, t);
  }

  private perfectChime(
    ctx: AudioContext,
    sfx: GainNode,
    pitch: number,
    streak: number,
  ): void {
    const t = ctx.currentTime;
    const base = 660 * pitch * (1 + Math.min(4, streak) * 0.03);
    this.tone(ctx, sfx, 'sine', base, base, 0.4, 0.055, t);
    this.tone(ctx, sfx, 'sine', base * 1.5, base * 1.5, 0.32, 0.03, t + 0.02);
  }

  private tone(
    ctx: AudioContext,
    sfx: GainNode,
    type: OscillatorType,
    f0: number,
    f1: number,
    dur: number,
    vol: number,
    t: number,
  ): void {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(40, f0), t);
    if (f0 !== f1) osc.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(sfx);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private noiseBurst(
    ctx: AudioContext,
    sfx: GainNode,
    dur: number,
    freq: number,
    vol: number,
    t: number,
    kind: BiquadFilterType = 'lowpass',
  ): void {
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(ctx, Math.max(0.05, dur));
    const filter = ctx.createBiquadFilter();
    filter.type = kind;
    filter.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(sfx);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  private noiseBuffer(ctx: AudioContext, duration: number, pink = false): AudioBuffer {
    const key = Math.floor(duration * 1000) * (pink ? 1 : -1);
    const cached = this.noiseCache.get(key);
    if (cached) return cached;
    const len = Math.floor(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      if (pink) {
        b0 = 0.99765 * b0 + white * 0.099046;
        b1 = 0.963 * b1 + white * 0.032158;
        b2 = 0.57 * b2 + white * 0.0165;
        data[i] = b0 + b1 + b2 + white * 0.02;
      } else {
        data[i] = white;
      }
    }
    this.noiseCache.set(key, buf);
    return buf;
  }

  private withCtx(fn: (ctx: AudioContext, sfx: GainNode) => void): void {
    if (!this.started || !this.ctx || !this.sfx || this.muted) return;
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    fn(this.ctx, this.sfx);
  }
}
