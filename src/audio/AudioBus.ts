import type { MaterialId } from './materials';
import { PHASE_ORDER } from '../game/ThemedPhases';

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
  /** Volume relativo da música generativa (abaixo das plataformas) */
  private readonly musicGain = 0.32;
  /** Volume do SFX de salto — discreto para não competir com o pouso */
  private readonly jumpPeakGain = 0.032;
  private noiseCache = new Map<number, AudioBuffer>();
  private started = false;
  private muted = false;
  private volume = 0.55;
  /** Soft generative BGM scheduler */
  private musicStep = 0;
  private nextMusicTime = 0;
  private musicTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly musicBpm = 66;
  private murmurTimer: ReturnType<typeof setTimeout> | null = null;
  private murmurEndAt = 0;
  private murmurIndex = 0;

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

  private duckAmbient(ms = 100, level = 0.35): void {
    if (!this.ambient || !this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const g = this.ambient.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(this.ambientGainBase * level, t + 0.02);
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

    this.music.gain.value = this.musicGain;
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
      g.gain.exponentialRampToValueAtTime(this.jumpPeakGain, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      src.connect(filter);
      filter.connect(g);
      g.connect(sfx);
      src.start(t);
      src.stop(t + 0.18);
    });
  }

  playLand(material: MaterialId, perfect: boolean, streak = 0, impact = 1): void {
    this.withCtx((ctx, sfx) => {
      this.duckAmbient(220, 0.1);
      const land = ctx.createGain();
      land.gain.value = this.landBusGain;
      land.connect(sfx);
      const pitch = 0.92 + Math.random() * 0.16;
      const imp = clamp(impact, 0.35, 1.35);
      const handlers: Record<MaterialId, () => void> = {
        jelly: () => this.jellyPloop(ctx, land, pitch, imp),
        butter: () => this.butterThup(ctx, land, pitch, imp),
        mochi: () => this.cheeseLand(ctx, land, pitch, imp),
        marshmallow: () => this.marshmallowPuff(ctx, land, pitch, imp),
        chocolate: () => this.chocolateRipple(ctx, land, pitch, imp),
        sponge: () => this.spongeSquish(ctx, land, pitch, imp),
        citrus: () => this.citrusZest(ctx, land, pitch, imp),
        honeycomb: () => this.honeyDrip(ctx, land, pitch, imp),
        glycerin: () => this.soapSquish(ctx, land, pitch, imp),
        whipped: () => this.whippedFoam(ctx, land, pitch, imp),
        soapBubble: () => this.soapBubblePop(ctx, land, pitch, imp),
        bathFoam: () => this.bathFoamFizz(ctx, land, pitch, imp),
        lavenderSoap: () => this.lavenderSquish(ctx, land, pitch, imp),
        creamSoap: () => this.creamSquish(ctx, land, pitch, imp),
        keyboard: () => this.keyboardClick(ctx, land, pitch, imp),
        bubbleWrap: () => this.bubbleWrapPop(ctx, land, pitch, imp),
        kinetic: () => this.kineticSand(ctx, land, pitch, imp),
        iceSoap: () => this.iceTing(ctx, land, pitch, imp),
        clearSlime: () => this.slimeBlorp(ctx, land, pitch, imp),
        butterSlime: () => this.butterSlimeFold(ctx, land, pitch, imp),
      };
      handlers[material]();
      if (perfect) this.perfectChime(ctx, land, pitch, streak);
    });
  }

  /** Ratinho assustado — gritinho ao cair */
  playCheeseMouseSqueak(): void {
    this.withCtx((ctx, sfx) => {
      this.duckAmbient(100);
      const t = ctx.currentTime;
      this.tone(ctx, sfx, 'sine', 1320, 620, 0.08, 0.11, t);
      this.tone(ctx, sfx, 'triangle', 980, 480, 0.065, 0.085, t + 0.014);
      this.tone(ctx, sfx, 'sine', 760, 380, 0.05, 0.06, t + 0.032);
      this.noiseBurst(ctx, sfx, 0.028, 3200, 0.04, t, 'bandpass');
      for (let i = 0; i < 4; i++) {
        this.noiseBurst(ctx, sfx, 0.018, 720 + i * 160, 0.032 - i * 0.005, t + 0.05 + i * 0.035, 'lowpass');
        this.tone(ctx, sfx, 'triangle', 540 - i * 55, 320, 0.022, 0.018, t + 0.055 + i * 0.035);
      }
    });
  }

  /** Mosquinhas dispersando da esponja */
  playSpongeFlyBuzz(): void {
    this.withCtx((ctx, sfx) => {
      this.duckAmbient(90);
      const t = ctx.currentTime;
      for (let i = 0; i < 10; i++) {
        const f = 160 + ((i * 97) % 140);
        this.noiseBurst(ctx, sfx, 0.016, f, 0.034, t + i * 0.024, 'bandpass');
      }
      this.tone(ctx, sfx, 'sine', 240, 190, 0.05, 0.038, t);
      this.tone(ctx, sfx, 'triangle', 310, 260, 0.04, 0.03, t + 0.04);
      this.softNoise(ctx, sfx, 0.07, 2600, 0.045, t + 0.03, 'highpass');
      this.softNoise(ctx, sfx, 0.05, 1800, 0.032, t + 0.08, 'bandpass', 1.2);
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

  /** Soft whoosh / chime when entering a new themed phase */
  playBiomeEnter(zoneId: MaterialId): void {
    this.withCtx((ctx, sfx) => {
      const t = ctx.currentTime;
      const idx = PHASE_ORDER.indexOf(zoneId);
      const step = idx >= 0 ? idx : 0;
      const base = 349 + step * 18;
      this.noiseBurst(ctx, sfx, 0.18, 900, 0.045, t, 'bandpass');
      this.tone(ctx, sfx, 'sine', base, base * 1.5, 0.35, 0.06, t);
      this.tone(ctx, sfx, 'triangle', base * 1.5, base * 2, 0.28, 0.035, t + 0.04);
    });
  }

  /** Bonequinho murmurando — voz fina enquanto o banner estiver visível */
  playSoftMurmur(durationMs = 5600): void {
    this.stopSoftMurmur();
    this.murmurEndAt = performance.now() + durationMs;
    this.murmurIndex = 0;
    this.duckAmbient(Math.min(durationMs, 480));
    this.scheduleMurmurSyllable();
  }

  stopSoftMurmur(): void {
    if (this.murmurTimer !== null) {
      clearTimeout(this.murmurTimer);
      this.murmurTimer = null;
    }
    this.murmurEndAt = 0;
  }

  private scheduleMurmurSyllable(): void {
    if (this.murmurEndAt <= 0 || performance.now() >= this.murmurEndAt) {
      this.stopSoftMurmur();
      return;
    }
    this.withCtx((ctx, sfx) => {
      const dur = 0.07 + Math.random() * 0.11;
      const t = ctx.currentTime + 0.015;
      this.murmurSyllable(ctx, sfx, t, dur, this.murmurIndex++);
    });
    const pauseMs = (0.05 + Math.random() * 0.09) * 1000 + 80;
    this.murmurTimer = setTimeout(() => this.scheduleMurmurSyllable(), pauseMs);
  }

  private murmurSyllable(
    ctx: AudioContext,
    sfx: GainNode,
    t: number,
    dur: number,
    index: number,
  ): void {
    const pitch = 1.05 + Math.random() * 0.22 + index * 0.015;
    const f0 = (420 + Math.random() * 140) * pitch;
    const f1 = f0 * (1.75 + Math.random() * 0.35);
    const f2 = f0 * (2.65 + Math.random() * 0.45);
    const vol = 0.062 + Math.random() * 0.028;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 360;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3200;
    lp.Q.value = 0.6;
    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0.0001, t);
    bus.gain.exponentialRampToValueAtTime(vol, t + 0.018);
    bus.gain.exponentialRampToValueAtTime(vol * 0.55, t + dur * 0.55);
    bus.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    hp.connect(lp);
    lp.connect(bus);
    bus.connect(sfx);

    const vibrato = ctx.createOscillator();
    const vibratoG = ctx.createGain();
    vibrato.frequency.value = 5.5 + Math.random() * 2.5;
    vibratoG.gain.value = f0 * 0.018;

    const body = ctx.createOscillator();
    body.type = 'triangle';
    body.frequency.setValueAtTime(f0, t);
    body.frequency.exponentialRampToValueAtTime(f0 * (0.92 + Math.random() * 0.12), t + dur);
    vibrato.connect(vibratoG);
    vibratoG.connect(body.frequency);
    body.connect(hp);
    body.start(t);
    body.stop(t + dur + 0.02);
    vibrato.start(t);
    vibrato.stop(t + dur + 0.02);

    const formant = ctx.createOscillator();
    formant.type = 'sine';
    formant.frequency.setValueAtTime(f1, t);
    formant.frequency.exponentialRampToValueAtTime(f2, t + dur * 0.85);
    const fg = ctx.createGain();
    fg.gain.setValueAtTime(0.0001, t);
    fg.gain.exponentialRampToValueAtTime(vol * 0.72, t + 0.02);
    fg.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    formant.connect(fg);
    fg.connect(hp);
    formant.start(t);
    formant.stop(t + dur + 0.02);

    if (Math.random() > 0.35) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuffer(ctx, Math.max(0.04, dur * 0.55));
      const nf = ctx.createBiquadFilter();
      nf.type = 'bandpass';
      nf.frequency.value = 1800 + Math.random() * 900;
      nf.Q.value = 1.2;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.0001, t);
      ng.gain.exponentialRampToValueAtTime(vol * 0.52, t + 0.008);
      ng.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.45);
      src.connect(nf);
      nf.connect(ng);
      ng.connect(hp);
      src.start(t);
      src.stop(t + dur + 0.02);
    }
  }

  // —— Material one-shots ——

  /** Ganho extra nos SFX de pouso — plataformas dominam o mix */
  private readonly landVolBoost = 3.6;
  /** Bus dedicado só para pouso — acima de murmúrio, música e outros SFX */
  private readonly landBusGain = 2.15;

  private impactVol(base: number, impact: number): number {
    return base * this.landVolBoost * (0.72 + Math.min(1.3, impact) * 0.42);
  }

  private softThud(
    ctx: AudioContext,
    sfx: GainNode,
    t: number,
    pitch: number,
    impact: number,
    f0 = 120,
  ): void {
    const v = this.impactVol(0.11, impact);
    this.tone(ctx, sfx, 'sine', f0 * pitch, f0 * pitch * 0.52, 0.17, v, t);
    this.noiseBurst(ctx, sfx, 0.045, 240, v * 0.7, t);
  }

  private squelch(
    ctx: AudioContext,
    sfx: GainNode,
    t: number,
    pitch: number,
    impact: number,
    freq = 520,
  ): void {
    const v = this.impactVol(0.13, impact);
    this.tone(ctx, sfx, 'sine', 210 * pitch, 78 * pitch, 0.2, v, t);
    this.tone(ctx, sfx, 'triangle', 130 * pitch, 62 * pitch, 0.13, v * 0.55, t + 0.012);
    this.noiseBurst(ctx, sfx, 0.1, freq, v * 0.72, t, 'bandpass');
    this.noiseBurst(ctx, sfx, 0.055, freq * 0.55, v * 0.38, t + 0.035);
  }

  /** Tom com ataque suave e filtro quente — ASMR agradável */
  private warmLandTone(
    ctx: AudioContext,
    sfx: GainNode,
    type: OscillatorType,
    f0: number,
    f1: number,
    dur: number,
    vol: number,
    t: number,
    lp = 1400,
  ): void {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(lp, t);
    filter.frequency.exponentialRampToValueAtTime(Math.max(120, lp * 0.72), t + dur);
    filter.Q.value = 0.65;
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(40, f0), t);
    if (Math.abs(f0 - f1) > 1) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur * 0.9);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.024);
    g.gain.exponentialRampToValueAtTime(vol * 0.58, t + dur * 0.42);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(filter);
    filter.connect(g);
    g.connect(sfx);
    osc.start(t);
    osc.stop(t + dur + 0.03);
  }

  /** Ruído rosa filtrado — textura macia sem aspereza */
  private softNoise(
    ctx: AudioContext,
    sfx: GainNode,
    dur: number,
    freq: number,
    vol: number,
    t: number,
    kind: BiquadFilterType = 'lowpass',
    q = 0.75,
  ): void {
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(ctx, Math.max(0.06, dur), true);
    const filter = ctx.createBiquadFilter();
    filter.type = kind;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(vol * 0.48, t + dur * 0.48);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(sfx);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  /** Wobble gelatinoso — frequência oscila como gelatina/ameba */
  private jellyWobble(
    ctx: AudioContext,
    sfx: GainNode,
    f0: number,
    f1: number,
    dur: number,
    vol: number,
    t: number,
    wobbleHz = 5.5,
    wobbleDepth = 0.1,
  ): void {
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    const g = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(880, t);
    filter.frequency.exponentialRampToValueAtTime(520, t + dur);
    filter.Q.value = 0.55;
    osc.type = 'sine';
    const base = Math.max(40, f0);
    osc.frequency.setValueAtTime(base, t);
    if (Math.abs(f0 - f1) > 1) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur * 0.88);
    }
    lfo.type = 'sine';
    lfo.frequency.value = wobbleHz;
    lfoG.gain.value = base * wobbleDepth;
    lfo.connect(lfoG);
    lfoG.connect(osc.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.018);
    g.gain.exponentialRampToValueAtTime(vol * 0.5, t + dur * 0.38);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(filter);
    filter.connect(g);
    g.connect(sfx);
    osc.start(t);
    lfo.start(t);
    osc.stop(t + dur + 0.03);
    lfo.stop(t + dur + 0.03);
  }

  /** Squish viscoso — ruído úmido com filtro escorregando (ameba) */
  private viscousSquish(
    ctx: AudioContext,
    sfx: GainNode,
    dur: number,
    vol: number,
    t: number,
    pitch: number,
  ): void {
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(ctx, Math.max(0.08, dur), true);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(820 * pitch, t);
    filter.frequency.exponentialRampToValueAtTime(160 * pitch, t + dur * 0.92);
    filter.Q.setValueAtTime(2.4, t);
    filter.Q.exponentialRampToValueAtTime(0.7, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(vol * 0.55, t + dur * 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(sfx);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  private jellyPloop(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.14, impact);

    // Tab squish — impacto mole instantâneo
    this.softNoise(ctx, sfx, 0.09, 720, v * 0.62, t, 'bandpass', 1.6);
    this.softNoise(ctx, sfx, 0.06, 1050, v * 0.32, t + 0.004, 'highpass');
    this.warmLandTone(ctx, sfx, 'sine', 168 * pitch, 48 * pitch, 0.14, v * 0.75, t, 950);

    // Corpo ameba — bloop grave com wobble
    this.jellyWobble(ctx, sfx, 88 * pitch, 34 * pitch, 0.44, v * 1.0, t + 0.006, 5.8, 0.12);
    this.jellyWobble(ctx, sfx, 118 * pitch, 72 * pitch, 0.32, v * 0.48, t + 0.04, 6.5, 0.09);

    // Rebotes jello — ameba assentando
    this.jellyWobble(ctx, sfx, 68 * pitch, 54 * pitch, 0.3, v * 0.38, t + 0.1, 4.5, 0.11);
    this.jellyWobble(ctx, sfx, 58 * pitch, 46 * pitch, 0.24, v * 0.2, t + 0.19, 3.8, 0.08);

    // Camadas squish úmidas viscosas
    this.viscousSquish(ctx, sfx, 0.24, v * 0.58, t, pitch);
    this.viscousSquish(ctx, sfx, 0.16, v * 0.32, t + 0.025, pitch * 0.92);
    this.softNoise(ctx, sfx, 0.18, 280, v * 0.42, t + 0.015, 'lowpass');
    this.softNoise(ctx, sfx, 0.12, 440, v * 0.28, t + 0.05, 'bandpass', 1.0);

    // Squelch mole tipo slime/amoeba
    this.warmLandTone(ctx, sfx, 'sine', 142 * pitch, 44 * pitch, 0.22, v * 0.72, t + 0.01, 680);
    this.softNoise(ctx, sfx, 0.13, 360, v * 0.55, t + 0.012, 'bandpass', 1.35);
    this.softNoise(ctx, sfx, 0.09, 240, v * 0.32, t + 0.038, 'lowpass');

    // Escorregadas viscosas pós-impacto
    for (let i = 0; i < 4; i++) {
      const delay = 0.055 + i * 0.052;
      this.softNoise(ctx, sfx, 0.07, 320 - i * 35, v * 0.22, t + delay, 'bandpass', 1.15);
      this.jellyWobble(
        ctx,
        sfx,
        (95 - i * 12) * pitch,
        42 * pitch,
        0.08,
        v * 0.14,
        t + delay,
        7 + i * 0.8,
        0.07,
      );
    }
  }

  private butterThup(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.12, impact);

    // Espalhar — shhhhk lateral de faca passando
    this.butterSpreadScrape(ctx, sfx, pitch, v, t + 0.006);

    // Almofada cremosa — thud quente e macio
    this.warmLandTone(ctx, sfx, 'sine', 88 * pitch, 48 * pitch, 0.3, v * 1.08, t, 620);
    this.warmLandTone(ctx, sfx, 'triangle', 124 * pitch, 72 * pitch, 0.24, v * 0.52, t + 0.016, 780);

    // Textura de espalhar manteiga
    this.softNoise(ctx, sfx, 0.13, 260, v * 0.36, t + 0.01, 'lowpass');
    this.softNoise(ctx, sfx, 0.09, 420, v * 0.2, t + 0.028, 'bandpass', 0.55);

    // Squish médio manteigoso
    this.warmLandTone(ctx, sfx, 'sine', 178 * pitch, 88 * pitch, 0.2, v * 0.38, t + 0.022, 950);

    // Cauda longa e reconfortante
    this.warmLandTone(ctx, sfx, 'sine', 68 * pitch, 54 * pitch, 0.38, v * 0.24, t + 0.065, 480);

    // Migalha sutil — quase imperceptível
    this.softNoise(ctx, sfx, 0.045, 820, v * 0.1, t + 0.042, 'bandpass', 1.4);
  }

  /** Textura de espalhar manteiga com faca — ruído deslizante */
  private butterSpreadScrape(
    ctx: AudioContext,
    sfx: GainNode,
    pitch: number,
    vol: number,
    t: number,
  ): void {
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(ctx, 0.13, true);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(720 * pitch, t);
    filter.frequency.exponentialRampToValueAtTime(180 * pitch, t + 0.1);
    filter.Q.setValueAtTime(0.75, t);
    filter.Q.linearRampToValueAtTime(0.45, t + 0.08);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol * 0.44, t + 0.014);
    g.gain.exponentialRampToValueAtTime(vol * 0.16, t + 0.07);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    src.connect(filter);
    filter.connect(g);
    g.connect(sfx);
    src.start(t);
    src.stop(t + 0.14);
    this.softNoise(ctx, sfx, 0.06, 340, vol * 0.22, t + 0.02, 'lowpass', 0.6);
  }

  private cheeseLand(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.12, impact);
    this.softThud(ctx, sfx, t, pitch, impact, 155);
    this.tone(ctx, sfx, 'sine', 280 * pitch, 140 * pitch, 0.22, v * 0.85, t + 0.025);
    this.tone(ctx, sfx, 'triangle', 480 * pitch, 320 * pitch, 0.08, v * 0.3, t + 0.04);
    this.noiseBurst(ctx, sfx, 0.05, 520, v * 0.4, t + 0.03, 'bandpass');
  }

  private marshmallowPuff(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.12, impact);

    // Nuvem macia — puff aéreo e reconfortante
    this.warmLandTone(ctx, sfx, 'sine', 260 * pitch, 155 * pitch, 0.3, v * 0.92, t, 1700);
    this.warmLandTone(ctx, sfx, 'sine', 210 * pitch, 175 * pitch, 0.34, v * 0.5, t + 0.055, 1500);
    this.softNoise(ctx, sfx, 0.2, 680, v * 0.3, t, 'bandpass', 0.85);
    this.softNoise(ctx, sfx, 0.15, 380, v * 0.2, t + 0.028, 'lowpass');
    this.warmLandTone(ctx, sfx, 'triangle', 360 * pitch, 240 * pitch, 0.14, v * 0.18, t + 0.032, 2100);
    this.warmLandTone(ctx, sfx, 'sine', 420 * pitch, 320 * pitch, 0.1, v * 0.12, t + 0.07, 2400);
  }

  private chocolateRipple(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.12, impact);
    this.tone(ctx, sfx, 'sine', 125 * pitch, 52 * pitch, 0.28, v, t);
    this.tone(ctx, sfx, 'triangle', 90 * pitch, 45 * pitch, 0.2, v * 0.5, t + 0.025);
    this.noiseBurst(ctx, sfx, 0.09, 220, v * 0.65, t);
    this.noiseBurst(ctx, sfx, 0.05, 140, v * 0.4, t + 0.06, 'lowpass');
  }

  private spongeSquish(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.12, impact);

    this.warmLandTone(ctx, sfx, 'sine', 240 * pitch, 105 * pitch, 0.18, v * 0.55, t, 1200);
    this.softNoise(ctx, sfx, 0.1, 620, v * 0.38, t, 'bandpass', 0.9);

    // Esguicho úmido
    this.softNoise(ctx, sfx, 0.12, 1400, v * 0.42, t + 0.012, 'bandpass', 1.1);
    this.softNoise(ctx, sfx, 0.08, 900, v * 0.28, t + 0.025, 'highpass');
    this.warmLandTone(ctx, sfx, 'sine', 520 * pitch, 280 * pitch, 0.08, v * 0.22, t + 0.018, 2200);
    this.warmLandTone(ctx, sfx, 'triangle', 180 * pitch, 75 * pitch, 0.14, v * 0.35, t + 0.03, 950);
  }

  private citrusZest(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.1, impact);
    this.noiseBurst(ctx, sfx, 0.09, 2800 * pitch, v * 0.85, t, 'bandpass');
    this.noiseBurst(ctx, sfx, 0.06, 4200, v * 0.45, t + 0.015, 'highpass');
    this.tone(ctx, sfx, 'triangle', 620 * pitch, 280 * pitch, 0.1, v * 0.55, t);
    this.tone(ctx, sfx, 'sine', 880 * pitch, 440 * pitch, 0.06, v * 0.3, t + 0.025);
  }

  private honeyDrip(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.11, impact);
    this.tone(ctx, sfx, 'sine', 230 * pitch, 75 * pitch, 0.32, v, t);
    this.tone(ctx, sfx, 'sine', 165 * pitch, 58 * pitch, 0.24, v * 0.55, t + 0.06);
    this.tone(ctx, sfx, 'triangle', 120 * pitch, 48 * pitch, 0.18, v * 0.35, t + 0.12);
    this.noiseBurst(ctx, sfx, 0.05, 300, v * 0.3, t + 0.08, 'lowpass');
  }

  private soapSquish(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.11, impact);
    this.squelch(ctx, sfx, t, pitch, impact, 1400);
    this.noiseBurst(ctx, sfx, 0.08, 2200, v * 0.4, t + 0.02, 'highpass');
    for (let i = 0; i < 2; i++) {
      this.tone(ctx, sfx, 'sine', 900 * pitch, 600 * pitch, 0.04, v * 0.18, t + 0.04 + i * 0.03);
    }
  }

  private lavenderSquish(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.1, impact);
    this.squelch(ctx, sfx, t, pitch * 1.04, impact, 1300);
    this.noiseBurst(ctx, sfx, 0.08, 2200, v * 0.4, t + 0.02, 'highpass');
    this.tone(ctx, sfx, 'sine', 720 * pitch, 720 * pitch, 0.14, v * 0.25, t + 0.05);
  }

  private creamSquish(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.11, impact);
    this.softThud(ctx, sfx, t, pitch * 0.96, impact, 130);
    this.squelch(ctx, sfx, t + 0.01, pitch * 0.95, impact, 900);
    this.tone(ctx, sfx, 'triangle', 280 * pitch, 160 * pitch, 0.1, v * 0.35, t + 0.03);
  }

  private whippedFoam(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.1, impact);
    this.noiseBurst(ctx, sfx, 0.2, 950 * pitch, v * 0.8, t);
    this.noiseBurst(ctx, sfx, 0.14, 1600, v * 0.45, t + 0.015, 'highpass');
    this.tone(ctx, sfx, 'triangle', 210 * pitch, 95 * pitch, 0.14, v * 0.4, t);
    this.tone(ctx, sfx, 'sine', 340 * pitch, 200 * pitch, 0.08, v * 0.25, t + 0.04);
  }

  private bathFoamFizz(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.1, impact);
    this.whippedFoam(ctx, sfx, pitch * 0.95, impact);
    for (let i = 0; i < 4; i++) {
      this.tone(ctx, sfx, 'sine', 1200 + i * 180, 800, 0.035, v * 0.15, t + 0.05 + i * 0.025);
    }
  }

  private soapBubblePop(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.11, impact);
    this.tone(ctx, sfx, 'sine', 420 * pitch, 90 * pitch, 0.12, v * 0.85, t);
    this.noiseBurst(ctx, sfx, 0.07, 2000, v * 0.65, t, 'bandpass');
    this.tone(ctx, sfx, 'sine', 680 * pitch, 680 * pitch, 0.18, v * 0.3, t + 0.025);
    this.noiseBurst(ctx, sfx, 0.05, 3200, v * 0.35, t + 0.03, 'highpass');
  }

  private bubbleWrapPop(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.12, impact);
    for (let i = 0; i < 3; i++) {
      this.tone(ctx, sfx, 'sine', 380 * pitch, 60 * pitch, 0.07, v * (0.7 - i * 0.12), t + i * 0.045);
      this.noiseBurst(ctx, sfx, 0.035, 1800 + i * 300, v * 0.5, t + i * 0.045, 'bandpass');
    }
  }

  private keyboardClick(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.1, impact);
    this.noiseBurst(ctx, sfx, 0.025, 2800, v * 0.75, t, 'bandpass');
    this.tone(ctx, sfx, 'triangle', 820 * pitch, 420 * pitch, 0.04, v * 0.55, t);
    this.tone(ctx, sfx, 'sine', 1200 * pitch, 600 * pitch, 0.035, v * 0.35, t + 0.008);
    this.noiseBurst(ctx, sfx, 0.02, 4500, v * 0.25, t + 0.012, 'highpass');
  }

  private kineticSand(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.11, impact);
    this.noiseBurst(ctx, sfx, 0.22, 620 * pitch, v * 0.75, t);
    this.noiseBurst(ctx, sfx, 0.15, 1100, v * 0.4, t + 0.02, 'bandpass');
    this.noiseBurst(ctx, sfx, 0.12, 380, v * 0.5, t + 0.04);
    this.tone(ctx, sfx, 'sine', 160 * pitch, 80 * pitch, 0.1, v * 0.3, t);
  }

  private iceTing(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.09, impact);
    this.tone(ctx, sfx, 'sine', 820 * pitch, 820 * pitch, 0.38, v * 0.85, t);
    this.tone(ctx, sfx, 'sine', 1240 * pitch, 1240 * pitch, 0.28, v * 0.45, t + 0.015);
    this.tone(ctx, sfx, 'triangle', 1680 * pitch, 1680 * pitch, 0.2, v * 0.25, t + 0.03);
    this.noiseBurst(ctx, sfx, 0.04, 4000, v * 0.2, t, 'highpass');
  }

  private slimeBlorp(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.13, impact);
    this.squelch(ctx, sfx, t, pitch, impact, 480);
    this.tone(ctx, sfx, 'sine', 340 * pitch, 95 * pitch, 0.12, v * 0.45, t + 0.02);
    this.noiseBurst(ctx, sfx, 0.06, 350, v * 0.35, t + 0.05, 'lowpass');
  }

  private butterSlimeFold(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.12, impact);
    this.tone(ctx, sfx, 'sine', 175 * pitch, 68 * pitch, 0.22, v, t);
    this.noiseBurst(ctx, sfx, 0.12, 420, v * 0.65, t);
    this.tone(ctx, sfx, 'triangle', 130 * pitch, 55 * pitch, 0.15, v * 0.45, t + 0.04);
    this.noiseBurst(ctx, sfx, 0.07, 280, v * 0.35, t + 0.07, 'lowpass');
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
