import type { MaterialId } from './materials';
import type { LandIntensity } from '../game/GameSettings';
import { getPhaseRun } from '../game/PhaseRunOrder';
import { LandSampleBank } from './landSamples';

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export class AudioBus {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfx: GainNode | null = null;
  /** Bus exclusivo de impacto nas plataformas — mais alto que SFX, música e ambiente */
  private land: GainNode | null = null;
  private ambient: GainNode | null = null;
  private music: GainNode | null = null;
  private ambientGainBase = 0.36;
  /** Volume relativo da música generativa (abaixo das plataformas) */
  private readonly musicGain = 0.26;
  /** Ganho da voz da criaturinha (banner, pulo, queda, respiração) — abaixo do pouso */
  private readonly creatureVolBoost = 1.45;
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
  private murmurMouthCallback: ((open: boolean) => void) | null = null;
  private murmurPauseMs = 120;
  private murmurMood = {
    basePitch: 620,
    energy: 0.72,
    syllablesInPhrase: 0,
    phraseLen: 6,
  };
  /** Canto de pássaros na fase grama */
  private birdChirpAcc = 0;
  private birdChirpCooldown = 0;
  /** Pouso simplificado no modo leve */
  private lightLandAudio = false;
  private readonly landSamples = new LandSampleBank();

  get isMuted(): boolean {
    return this.muted;
  }

  get isVoiceEnabled(): boolean {
    return this.voiceEnabled;
  }

  get isReady(): boolean {
    return this.started;
  }

  async unlock(): Promise<void> {
    if (this.started) {
      if (this.ctx?.state === 'suspended') await this.ctx.resume();
      void this.landSamples.load(this.ctx!);
      return;
    }
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.sfx = this.ctx.createGain();
    this.land = this.ctx.createGain();
    this.ambient = this.ctx.createGain();
    this.music = this.ctx.createGain();
    this.sfx.connect(this.master);
    this.land.connect(this.master);
    this.ambient.connect(this.master);
    this.music.connect(this.ambient);
    this.master.connect(this.ctx.destination);
    this.applyGains();
    // Resume before starting sources — required on Chrome/Safari
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.started = true;
    void this.landSamples.load(this.ctx);
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

  setLightLandAudio(simple: boolean): void {
    this.lightLandAudio = simple;
  }

  setVoiceEnabled(enabled: boolean): void {
    this.voiceEnabled = enabled;
    if (!enabled) this.stopSoftMurmur();
  }

  setLandIntensity(level: LandIntensity): void {
    this.landIntensityMul = { low: 0.52, medium: 1, high: 1.42 }[level];
  }

  private voiceEnabled = true;
  private landIntensityMul = 1;

  private applyGains(): void {
    if (!this.master || !this.sfx || !this.land || !this.ambient || !this.ctx) return;
    const now = this.ctx.currentTime;
    const m = this.muted ? 0 : this.volume;
    this.master.gain.setTargetAtTime(m, now, 0.05);
    this.sfx.gain.setTargetAtTime(0.78, now, 0.05);
    this.land.gain.setTargetAtTime(1.08, now, 0.05);
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

  playLand(material: MaterialId, perfect: boolean, streak = 0, impact = 1, marimbaBar?: number): void {
    this.withLandCtx((ctx, landBus) => {
      this.duckAmbient(300, 0.07);
      const land = ctx.createGain();
      land.gain.value = this.landBusGain * this.landIntensityMul;
      land.connect(landBus);
      const pitch = 0.92 + Math.random() * 0.16;
      const imp = clamp(impact, 0.35, 1.35);
      if (this.lightLandAudio) {
        const t = ctx.currentTime;
        this.softThud(ctx, land, t, pitch, imp);
        this.noiseBurst(ctx, land, 0.07, 480 + Math.random() * 220, this.impactVol(0.07, imp), t, 'bandpass');
        if (perfect) this.perfectChime(ctx, land, pitch, streak);
        return;
      }
      const handlers: Record<MaterialId, () => void> = {
        jelly: () => this.landWithSample(ctx, land, 'jelly', pitch, imp, () => this.jellyPloop(ctx, land, pitch, imp)),
        butter: () => this.landWithSample(ctx, land, 'butter', pitch, imp, () => this.butterThup(ctx, land, pitch, imp)),
        mochi: () => this.landWithSample(ctx, land, 'mochi', pitch, imp, () => this.cheeseLand(ctx, land, pitch, imp)),
        marshmallow: () =>
          this.landWithSample(ctx, land, 'marshmallow', pitch, imp, () =>
            this.marshmallowPuff(ctx, land, pitch, imp),
          ),
        chocolate: () =>
          this.landWithSample(ctx, land, 'chocolate', pitch, imp, () =>
            this.chocolateRipple(ctx, land, pitch, imp),
          ),
        sponge: () =>
          this.landWithSample(ctx, land, 'sponge', pitch, imp, () => this.spongeSquish(ctx, land, pitch, imp)),
        citrus: () =>
          this.landWithSample(ctx, land, 'citrus', pitch, imp, () => this.citrusZest(ctx, land, pitch, imp)),
        honeycomb: () =>
          this.landWithSample(ctx, land, 'honeycomb', pitch, imp, () => this.honeyDrip(ctx, land, pitch, imp)),
        glycerin: () =>
          this.landWithSample(ctx, land, 'glycerin', pitch, imp, () => this.soapSquish(ctx, land, pitch, imp)),
        whipped: () =>
          this.landWithSample(ctx, land, 'whipped', pitch, imp, () => this.whippedFoam(ctx, land, pitch, imp)),
        soapBubble: () =>
          this.landWithSample(ctx, land, 'soapBubble', pitch, imp, () =>
            this.soapBubblePop(ctx, land, pitch, imp),
          ),
        bathFoam: () =>
          this.landWithSample(ctx, land, 'bathFoam', pitch, imp, () => this.bathFoamFizz(ctx, land, pitch, imp)),
        lavenderSoap: () =>
          this.landWithSample(ctx, land, 'lavenderSoap', pitch, imp, () =>
            this.lavenderSquish(ctx, land, pitch, imp),
          ),
        creamSoap: () =>
          this.landWithSample(ctx, land, 'creamSoap', pitch, imp, () => this.creamSquish(ctx, land, pitch, imp)),
        keyboard: () =>
          this.landWithSample(ctx, land, 'keyboard', pitch, imp, () => this.keyboardClick(ctx, land, pitch, imp)),
        bubbleWrap: () =>
          this.landWithSample(ctx, land, 'bubbleWrap', pitch, imp, () =>
            this.bubbleWrapPop(ctx, land, pitch, imp),
          ),
        kinetic: () =>
          this.landWithSample(ctx, land, 'kinetic', pitch, imp, () => this.kineticSand(ctx, land, pitch, imp)),
        iceSoap: () =>
          this.landWithSample(ctx, land, 'iceSoap', pitch, imp, () => this.iceTing(ctx, land, pitch, imp)),
        clearSlime: () =>
          this.landWithSample(ctx, land, 'clearSlime', pitch, imp, () => this.slimeBlorp(ctx, land, pitch, imp)),
        butterSlime: () =>
          this.landWithSample(ctx, land, 'butterSlime', pitch, imp, () =>
            this.butterSlimeFold(ctx, land, pitch, imp),
          ),
        amoeba: () =>
          this.landWithSample(ctx, land, 'amoeba', pitch, imp, () => this.amoebaBlob(ctx, land, pitch, imp)),
        moss: () => this.landWithSample(ctx, land, 'moss', pitch, imp, () => this.mossLand(ctx, land, pitch, imp)),
        grass: () => {
          if (
            this.playLandSample(ctx, land, 'grass', pitch, imp, {
              maxDuration: 0.24,
              randomStart: true,
              pitchBoost: 1.06 + Math.random() * 0.14,
            })
          ) {
            return;
          }
          this.grassCrunch(ctx, land, pitch, imp);
        },
        cotton: () =>
          this.landWithSample(ctx, land, 'cotton', pitch, imp, () => this.cottonFluff(ctx, land, pitch, imp)),
        cloud: () =>
          this.landWithSample(ctx, land, 'cloud', pitch, imp, () => this.cloudPoof(ctx, land, pitch, imp)),
        paper: () =>
          this.landWithSample(ctx, land, 'paper', pitch, imp, () => this.paperCrinkle(ctx, land, pitch, imp)),
        plasticBottle: () =>
          this.landWithSample(ctx, land, 'plasticBottle', pitch, imp, () =>
            this.plasticSplash(ctx, land, pitch, imp),
          ),
        velvet: () =>
          this.landWithSample(ctx, land, 'velvet', pitch, imp, () => this.velvetThud(ctx, land, pitch, imp)),
        blossom: () =>
          this.landWithSample(ctx, land, 'blossom', pitch, imp, () =>
            this.blossomPetalLand(ctx, land, pitch, imp),
          ),
        marimba: () =>
          this.landWithSample(ctx, land, 'marimba', pitch, imp, () =>
            this.marimbaToneAt(ctx, land, pitch, imp, marimbaBar ?? Math.floor(Math.random() * 7)),
          ),
        crystal: () =>
          this.landWithSample(ctx, land, 'crystal', pitch, imp, () => this.iceTing(ctx, land, pitch, imp)),
        ceramic: () =>
          this.landWithSample(ctx, land, 'ceramic', pitch, imp, () => this.ceramicClink(ctx, land, pitch, imp)),
        clay: () =>
          this.landWithSample(ctx, land, 'clay', pitch, imp, () => this.kineticSand(ctx, land, pitch, imp)),
        silk: () =>
          this.landWithSample(ctx, land, 'silk', pitch, imp, () => this.velvetThud(ctx, land, pitch, imp)),
        kitten: () => {
          if (
            this.playLandSample(ctx, land, 'kitten', pitch, imp, {
              maxDuration: 0.75,
              randomStart: true,
            })
          ) {
            return;
          }
          this.kittenMeowProcedural(ctx, land, pitch);
        },
      };
      handlers[material]();
      if (perfect) this.perfectChime(ctx, land, pitch, streak);
    });
  }

  /** Gatinho mia ao ser pisado — sample kitten.mp3 */
  playKittenMeow(): void {
    this.withLandCtx((ctx, landBus) => {
      this.duckAmbient(90);
      const land = ctx.createGain();
      land.gain.value = this.landBusGain * this.landIntensityMul;
      land.connect(landBus);
      const pitch = 0.86 + Math.random() * 0.22;
      if (
        this.playLandSample(ctx, land, 'kitten', pitch, 0.6, {
          maxDuration: 0.72,
          randomStart: true,
          pitchBoost: 0.98 + Math.random() * 0.08,
        })
      ) {
        return;
      }
      this.kittenMeowProcedural(ctx, land, pitch);
    });
  }

  private kittenMeowProcedural(ctx: AudioContext, sfx: GainNode, pitch: number): void {
    const t = ctx.currentTime;
    const v = 0.085 + Math.random() * 0.035;
    const f0 = (440 + Math.random() * 160) * pitch;
    const f1 = (260 + Math.random() * 100) * pitch;
    this.tone(ctx, sfx, 'sine', f0, f1, 0.24, v, t);
    this.tone(ctx, sfx, 'triangle', f0 * 1.15, f1 * 1.08, 0.2, v * 0.5, t + 0.018);
    this.softNoise(ctx, sfx, 0.11, 1900, v * 0.42, t + 0.035, 'bandpass', 1.15);
    this.softNoise(ctx, sfx, 0.09, 880, v * 0.28, t + 0.07, 'lowpass');
    if (Math.random() > 0.35) {
      this.tone(ctx, sfx, 'sine', f1 * 0.92, f1 * 0.86, 0.16, v * 0.32, t + 0.11);
      this.tone(ctx, sfx, 'triangle', f1 * 1.3, f1 * 1.22, 0.1, v * 0.16, t + 0.14);
    }
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

  /** Abelhas saindo do favo de mel */
  playHoneyBeeBuzz(): void {
    this.withCtx((ctx, sfx) => {
      this.duckAmbient(85);
      const t = ctx.currentTime;
      for (let i = 0; i < 14; i++) {
        const f = 220 + ((i * 73) % 180);
        this.noiseBurst(ctx, sfx, 0.014, f, 0.038, t + i * 0.018, 'bandpass');
      }
      this.tone(ctx, sfx, 'sine', 320, 260, 0.045, 0.042, t);
      this.tone(ctx, sfx, 'triangle', 420, 340, 0.035, 0.032, t + 0.035);
      this.tone(ctx, sfx, 'sine', 280, 220, 0.03, 0.025, t + 0.07);
      this.softNoise(ctx, sfx, 0.06, 3200, 0.04, t + 0.025, 'highpass');
    });
  }

  playFall(): void {
    this.withCtx((ctx, sfx) => {
      const t = ctx.currentTime;
      if (this.voiceEnabled) {
        this.creatureVocal(ctx, sfx, t, 0.2, 620, 1480, 0.052, { wobble: true, boing: true });
        this.creatureVocal(ctx, sfx, t + 0.19, 0.11, 960, 420, 0.044, { squeak: true, pop: true });
      }

      const noise = this.noiseBuffer(ctx, 0.55);
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(520, t);
      filter.frequency.exponentialRampToValueAtTime(130, t + 0.55);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.068, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.58);
      src.connect(filter);
      filter.connect(g);
      g.connect(sfx);
      src.start(t);
      src.stop(t + 0.6);
    });
  }

  /** Soluço suave ao abrir a tela de derrota */
  playFallWhimper(): void {
    if (!this.voiceEnabled) return;
    this.withCtx((ctx, sfx) => {
      const t = ctx.currentTime;
      this.creatureVocal(ctx, sfx, t, 0.16, 520, 360, 0.046, { wobble: true });
      this.creatureVocal(ctx, sfx, t + 0.18, 0.1, 680, 300, 0.034, { squeak: true });
      this.creatureVocal(ctx, sfx, t + 0.34, 0.08, 460, 320, 0.028, { wobble: true, blip: true });
    });
  }

  playBreath(): void {
    if (!this.voiceEnabled) return;
    this.withCtx((ctx, sfx) => {
      const t = ctx.currentTime;
      this.creatureVocal(ctx, sfx, t, 0.09, 920, 580, 0.04, { boing: true, chime: true });
      this.creatureVocal(ctx, sfx, t + 0.07, 0.065, 680, 640, 0.028, { blip: true, shimmer: true });
    });
  }

  playCollect(): void {
    this.withCtx((ctx, sfx) => {
      const t = ctx.currentTime;
      // Jingle tipo "win" — arpejo ascendente + brilho final
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      for (const [i, f] of notes.entries()) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = i < 3 ? 'square' : 'sine';
        osc.frequency.setValueAtTime(f, t + i * 0.07);
        const st = t + i * 0.07;
        g.gain.setValueAtTime(0.0001, st);
        g.gain.exponentialRampToValueAtTime(0.11 - i * 0.012, st + 0.018);
        g.gain.exponentialRampToValueAtTime(0.0001, st + 0.22);
        osc.connect(g);
        g.connect(sfx);
        osc.start(st);
        osc.stop(st + 0.24);
      }
      // Harmônico de celebração
      const shimmer = ctx.createOscillator();
      const sg = ctx.createGain();
      shimmer.type = 'triangle';
      shimmer.frequency.setValueAtTime(1568, t + 0.28);
      shimmer.frequency.exponentialRampToValueAtTime(2093, t + 0.48);
      sg.gain.setValueAtTime(0.0001, t + 0.28);
      sg.gain.exponentialRampToValueAtTime(0.07, t + 0.32);
      sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      shimmer.connect(sg);
      sg.connect(sfx);
      shimmer.start(t + 0.28);
      shimmer.stop(t + 0.58);
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
      const idx = getPhaseRun().indexOf(zoneId);
      const step = idx >= 0 ? idx : 0;
      const base = 349 + step * 18;
      this.noiseBurst(ctx, sfx, 0.18, 900, 0.045, t, 'bandpass');
      this.tone(ctx, sfx, 'sine', base, base * 1.5, 0.35, 0.06, t);
      this.tone(ctx, sfx, 'triangle', base * 1.5, base * 2, 0.28, 0.035, t + 0.04);
    });
    if (zoneId === 'grass') this.playBirdChirp(true);
  }

  /** Trinados suaves enquanto a fase grama está visível */
  updateGrassBirdAmbience(dt: number, grassWeight: number): void {
    if (!this.started || this.muted || grassWeight < 0.18) {
      this.birdChirpAcc = 0;
      return;
    }
    if (this.birdChirpCooldown > 0) {
      this.birdChirpCooldown -= dt;
      return;
    }
    const rate = (0.12 + grassWeight * 0.42) * dt;
    this.birdChirpAcc += rate;
    while (this.birdChirpAcc >= 1) {
      this.birdChirpAcc -= 1;
      if (Math.random() < 0.55 + grassWeight * 0.4) {
        this.playBirdChirp(false);
        this.birdChirpCooldown = 1.8 + Math.random() * 3.2;
        break;
      }
    }
  }

  /** Canto procedural de passarinho — bus ambiente, tom ASMR suave */
  playBirdChirp(burst = false): void {
    this.withAmbient((ctx, amb) => {
      const t = ctx.currentTime + 0.01;
      const chirps = burst ? 2 + Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * 2);
      let offset = 0;
      for (let i = 0; i < chirps; i++) {
        const f0 = 2600 + Math.random() * 2400;
        const f1 = f0 * (1.04 + Math.random() * 0.18);
        const dur = 0.055 + Math.random() * 0.09;
        const vol = 0.014 + Math.random() * 0.012;
        this.musicTone(ctx, amb, 'sine', f0, f1, dur, vol, t + offset);
        if (Math.random() > 0.35) {
          this.musicTone(ctx, amb, 'triangle', f0 * 1.48, f0 * 1.52, dur * 0.75, vol * 0.45, t + offset + 0.008);
        }
        offset += dur + 0.05 + Math.random() * 0.14;
      }
    });
  }

  /** Personagem murmurando o banner — voz de criaturinha pequena e fofa */
  playCreatureSpeech(
    text: string,
    durationMs = 5600,
    onMouth?: (open: boolean) => void,
  ): void {
    this.stopSoftMurmur();
    if (!this.voiceEnabled) {
      onMouth?.(false);
      return;
    }
    this.murmurEndAt = performance.now() + durationMs;
    this.murmurMouthCallback = onMouth ?? null;
    this.murmurMood = {
      basePitch: 540 + Math.random() * 220,
      energy: 0.5 + Math.random() * 0.45,
      syllablesInPhrase: 0,
      phraseLen: 3 + Math.floor(Math.random() * 8),
    };
    const syllables = this.estimateSyllables(text);
    this.murmurPauseMs = Math.max(52, ((durationMs - 260) / syllables) * 0.78);
    this.duckAmbient(Math.min(durationMs, 480));
    this.scheduleMurmurSyllable();
  }

  /** @deprecated use playCreatureSpeech */
  playSoftMurmur(durationMs = 5600): void {
    this.playCreatureSpeech('', durationMs);
  }

  /** Mantém o murmúrio contínuo na tela inicial enquanto o personagem se move */
  ensureTitleMurmur(onMouth?: (open: boolean) => void): void {
    if (!this.voiceEnabled) {
      onMouth?.(false);
      return;
    }
    const now = performance.now();
    if (this.murmurEndAt > now + 220) {
      this.murmurEndAt = Math.max(this.murmurEndAt, now + 820);
      if (onMouth) this.murmurMouthCallback = onMouth;
      return;
    }
    this.playCreatureSpeech('', 900, onMouth);
  }

  stopSoftMurmur(): void {
    if (this.murmurTimer !== null) {
      clearTimeout(this.murmurTimer);
      this.murmurTimer = null;
    }
    this.murmurMouthCallback?.(false);
    this.murmurMouthCallback = null;
    this.murmurEndAt = 0;
  }

  private estimateSyllables(text: string): number {
    if (!text.trim()) return 14;
    const groups = text.toLowerCase().match(/[aáàâãeéêiíîoóôõuúüy]+/gi);
    return Math.max(8, Math.min(32, groups?.length ?? 10));
  }

  private scheduleMurmurSyllable(): void {
    if (this.murmurEndAt <= 0 || performance.now() >= this.murmurEndAt) {
      this.stopSoftMurmur();
      return;
    }
    this.withCtx((ctx, sfx) => {
      let cursor = ctx.currentTime + 0.008;
      const cluster = Math.random();
      const burstCount = cluster > 0.84 ? 3 : cluster > 0.52 ? 2 : 1;

      for (let i = 0; i < burstCount; i++) {
        const dur = 0.038 + Math.random() * 0.13;
        this.littleCreatureMurmurSyllable(ctx, sfx, cursor, dur);
        cursor += dur * (0.68 + Math.random() * 0.38) + Math.random() * 0.018;
        this.murmurMood.syllablesInPhrase++;
      }

      if (this.murmurMouthCallback) {
        this.murmurMouthCallback(true);
        const mouthDur = Math.min(0.16, Math.max(0.05, cursor - ctx.currentTime));
        window.setTimeout(() => this.murmurMouthCallback?.(false), mouthDur * 1000 * 0.55);
      }
    });

    let phraseBreak = 0;
    if (this.murmurMood.syllablesInPhrase >= this.murmurMood.phraseLen) {
      phraseBreak = 160 + Math.random() * 240;
      this.murmurMood.syllablesInPhrase = 0;
      this.murmurMood.phraseLen = 3 + Math.floor(Math.random() * 9);
      this.murmurMood.energy = 0.42 + Math.random() * 0.52;
      this.murmurMood.basePitch = clamp(
        this.murmurMood.basePitch + (Math.random() - 0.5) * 55,
        480,
        980,
      );
    }

    const hesitation = Math.random() > 0.9 ? 70 + Math.random() * 110 : 0;
    const pauseMs =
      this.murmurPauseMs * (0.55 + Math.random() * 0.75) * (1.1 - this.murmurMood.energy * 0.35) +
      phraseBreak +
      hesitation;
    this.murmurTimer = window.setTimeout(() => this.scheduleMurmurSyllable(), pauseMs);
  }

  /** Vocal da criaturinha — fino, engraçado, com boing e piadas sonoras */
  private creatureVocal(
    ctx: AudioContext,
    sfx: GainNode,
    t: number,
    dur: number,
    f0Start: number,
    f0End: number,
    vol: number,
    opts: {
      breath?: number;
      chime?: boolean;
      shimmer?: boolean;
      boing?: boolean;
      squeak?: boolean;
      blip?: boolean;
      wobble?: boolean;
      pop?: boolean;
      murmur?: boolean;
    } = {},
  ): void {
    vol *= this.creatureVolBoost;

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = opts.murmur ? 260 : opts.squeak ? 520 : 400;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = opts.murmur ? 4000 : opts.blip ? 5200 : 4800;
    lp.Q.value = 0.35;
    hp.connect(lp);

    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0.0001, t);
    if (opts.pop) {
      bus.gain.exponentialRampToValueAtTime(vol * 1.35, t + 0.006);
      bus.gain.exponentialRampToValueAtTime(vol, t + 0.018);
    } else {
      bus.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    }
    bus.gain.exponentialRampToValueAtTime(vol * 0.65, t + dur * 0.42);
    bus.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    lp.connect(bus);
    bus.connect(sfx);

    const vibrato = ctx.createOscillator();
    const vibratoG = ctx.createGain();
    vibrato.frequency.value = opts.wobble ? 9.5 + Math.random() * 4.5 : 4.2 + Math.random() * 2.4;
    vibratoG.gain.value = f0Start * (opts.wobble ? 0.038 : 0.014);

    const core = ctx.createOscillator();
    core.type = opts.squeak || opts.blip ? 'triangle' : 'sine';
    core.frequency.setValueAtTime(f0Start, t);
    if (opts.boing) {
      const peak = Math.max(f0Start, f0End) * (1.12 + Math.random() * 0.14);
      core.frequency.exponentialRampToValueAtTime(Math.max(400, peak), t + dur * 0.32);
      core.frequency.exponentialRampToValueAtTime(Math.max(360, f0End), t + dur);
    } else {
      core.frequency.exponentialRampToValueAtTime(Math.max(opts.murmur ? 240 : 360, f0End), t + dur);
    }
    vibrato.connect(vibratoG);
    vibratoG.connect(core.frequency);

    const cGain = ctx.createGain();
    cGain.gain.value = opts.blip ? 0.48 : opts.squeak ? 0.44 : 0.36;
    core.connect(cGain);
    cGain.connect(hp);
    core.start(t);
    core.stop(t + dur + 0.02);
    vibrato.start(t);
    vibrato.stop(t + dur + 0.02);

    const useShimmer = opts.shimmer ?? !opts.murmur;
    if (useShimmer && !opts.blip) {
      for (const detune of [1.018, 0.982]) {
        const sh = ctx.createOscillator();
        sh.type = 'sine';
        sh.frequency.setValueAtTime(f0Start * detune, t);
        sh.frequency.exponentialRampToValueAtTime(
          Math.max(opts.murmur ? 240 : 360, f0End * detune),
          t + dur,
        );
        const sg = ctx.createGain();
        sg.gain.value = 0.14;
        sh.connect(sg);
        sg.connect(hp);
        sh.start(t);
        sh.stop(t + dur + 0.02);
      }
    }

    if (opts.boing) {
      const boing = ctx.createOscillator();
      boing.type = 'triangle';
      boing.frequency.setValueAtTime(f0Start * 1.55, t + dur * 0.08);
      boing.frequency.exponentialRampToValueAtTime(Math.max(500, f0End * 1.4), t + dur * 0.75);
      const bg = ctx.createGain();
      bg.gain.setValueAtTime(0.0001, t + dur * 0.08);
      bg.gain.exponentialRampToValueAtTime(vol * 0.22, t + dur * 0.2);
      bg.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      boing.connect(bg);
      bg.connect(hp);
      boing.start(t);
      boing.stop(t + dur + 0.02);
    }

    const breath = opts.breath ?? (opts.blip ? 0.22 : opts.murmur ? 0.44 : 0.38);
    this.softNoise(ctx, sfx, dur * 0.88, 1720 + Math.random() * 480, vol * breath * 0.5, t, 'bandpass', 0.68);

    if (opts.chime) {
      const chimeF = [1310, 1760, 2210, 2860][Math.floor(Math.random() * 4)]!;
      this.tone(ctx, sfx, 'sine', chimeF, chimeF * 0.998, dur * 0.5, vol * 0.18, t + 0.004);
    }

    if (opts.squeak) {
      this.noiseBurst(
        ctx,
        sfx,
        Math.min(0.022, dur * 0.18),
        4800 + Math.random() * 900,
        vol * (opts.murmur ? 0.12 : 0.2),
        t,
        'bandpass',
      );
    } else if (!opts.murmur && Math.random() > 0.68) {
      this.noiseBurst(ctx, sfx, Math.min(0.022, dur * 0.18), 4800 + Math.random() * 900, vol * 0.2, t, 'bandpass');
    }
  }

  /** Murmurio fofo de criaturinha — gibberish cartoon, ritmo orgânico */
  private littleCreatureMurmurSyllable(
    ctx: AudioContext,
    sfx: GainNode,
    t: number,
    dur: number,
  ): void {
    const mood = this.murmurMood;
    mood.basePitch = clamp(mood.basePitch + (Math.random() - 0.5) * 48, 480, 980);

    const vol = (0.044 + Math.random() * 0.034) * (0.68 + mood.energy * 0.52);
    const roll = Math.random();
    const f0 = mood.basePitch * (0.86 + Math.random() * 0.26);
    const rising = Math.random() > 0.4;
    const f0End = f0 * (rising ? 1.06 + Math.random() * 0.22 : 0.78 + Math.random() * 0.16);
    const murmur = { murmur: true, chime: false } as const;

    if (roll < 0.22) {
      this.creatureVocal(ctx, sfx, t, dur * (0.48 + Math.random() * 0.2), f0 * 1.08, f0End * 1.12, vol, {
        ...murmur,
        squeak: true,
        pop: true,
        shimmer: false,
      });
      if (Math.random() > 0.35) {
        this.creatureVocal(ctx, sfx, t + dur * 0.44, dur * (0.38 + Math.random() * 0.18), f0 * 0.9, f0End * 0.86, vol * 0.82, {
          ...murmur,
          blip: true,
          shimmer: false,
        });
      }
      return;
    }

    if (roll < 0.42) {
      this.creatureVocal(ctx, sfx, t, dur * (0.88 + Math.random() * 0.28), f0, f0End, vol, {
        ...murmur,
        wobble: true,
        boing: rising && Math.random() > 0.45,
        pop: Math.random() > 0.55,
        shimmer: Math.random() > 0.65,
      });
      return;
    }

    if (roll < 0.58) {
      this.creatureVocal(ctx, sfx, t, dur * (1.02 + Math.random() * 0.35), f0 * 0.94, f0End * 0.88, vol * 0.78, {
        ...murmur,
        breath: 0.5,
        wobble: Math.random() > 0.5,
        shimmer: false,
      });
      return;
    }

    this.creatureVocal(ctx, sfx, t, dur, f0, f0End, vol, {
      ...murmur,
      wobble: !rising && Math.random() > 0.4,
      boing: rising && Math.random() > 0.58,
      pop: Math.random() > 0.62,
      blip: dur < 0.072,
      shimmer: Math.random() > 0.58,
      squeak: Math.random() > 0.82,
    });
  }

  // —— Material one-shots ——

  /** Ganho extra nos SFX de pouso — plataformas dominam o mix */
  private readonly landVolBoost = 4.6;
  /** Bus por impacto — acima de murmúrio, música e outros SFX */
  private readonly landBusGain = 2.95;

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
    this.softNoise(ctx, sfx, 0.2, 1100, v * 0.55, t, 'bandpass', 0.9);
    this.softNoise(ctx, sfx, 0.16, 680, v * 0.38, t + 0.02, 'lowpass');
    this.warmLandTone(ctx, sfx, 'sine', 240 * pitch, 170 * pitch, 0.22, v * 0.42, t, 1600);
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

  /** Nota de marimba por barra — escala pentatônica G4→G5 */
  playMarimbaBar(barIndex: number, impact = 1): void {
    this.withLandCtx((ctx, landBus) => {
      const land = ctx.createGain();
      land.gain.value = this.landBusGain * this.landIntensityMul;
      land.connect(landBus);
      const pitch = 0.94 + Math.random() * 0.08;
      this.marimbaToneAt(ctx, land, pitch, clamp(impact, 0.35, 1.35), barIndex);
    });
  }

  private marimbaToneAt(
    ctx: AudioContext,
    sfx: GainNode,
    pitch: number,
    impact: number,
    barIndex: number,
  ): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.11, impact);
    const notes = [392, 440, 494, 523, 587, 659, 784];
    const idx = Math.max(0, Math.min(notes.length - 1, barIndex));
    const f = notes[idx]! * pitch;
    this.tone(ctx, sfx, 'sine', f, f * 0.5, 0.18, v * 0.7, t);
    this.tone(ctx, sfx, 'triangle', f * 2, f, 0.12, v * 0.35, t + 0.01);
    this.tone(ctx, sfx, 'sine', f * 3, f * 1.5, 0.08, v * 0.18, t + 0.02);
  }

  private ceramicClink(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.1, impact);
    this.tone(ctx, sfx, 'triangle', 880 * pitch, 440 * pitch, 0.06, v * 0.55, t);
    this.tone(ctx, sfx, 'sine', 1320 * pitch, 660 * pitch, 0.045, v * 0.4, t + 0.006);
    this.noiseBurst(ctx, sfx, 0.03, 2400, v * 0.35, t, 'bandpass');
  }

  private kineticSand(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.11, impact);
    this.noiseBurst(ctx, sfx, 0.22, 620 * pitch, v * 0.75, t);
    this.noiseBurst(ctx, sfx, 0.15, 1100, v * 0.4, t + 0.02, 'bandpass');
    this.noiseBurst(ctx, sfx, 0.12, 380, v * 0.5, t + 0.04);
    this.tone(ctx, sfx, 'sine', 160 * pitch, 80 * pitch, 0.1, v * 0.3, t);
  }

  private playLandSample(
    ctx: AudioContext,
    bus: GainNode,
    material: MaterialId,
    pitch: number,
    impact: number,
    extra: { maxDuration?: number; randomStart?: boolean; pitchBoost?: number } = {},
  ): boolean {
    const vol = this.impactVol(0.15, impact) * 1.4;
    const pitchMul = extra.pitchBoost ?? 1;
    return this.landSamples.play(ctx, bus, material, {
      pitch: pitch * (0.94 + Math.random() * 0.1) * pitchMul,
      volume: vol,
      maxDuration: extra.maxDuration,
      randomStart: extra.randomStart,
    });
  }

  private landWithSample(
    ctx: AudioContext,
    land: GainNode,
    material: MaterialId,
    pitch: number,
    imp: number,
    fallback: () => void,
  ): void {
    if (this.playLandSample(ctx, land, material, pitch, imp)) return;
    fallback();
  }

  private amoebaBlob(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.13, impact);
    this.jellyWobble(ctx, sfx, 72 * pitch, 28 * pitch, 0.5, v * 0.95, t, 4.2, 0.14);
    this.viscousSquish(ctx, sfx, 0.28, v * 0.65, t, pitch * 0.88);
    this.softNoise(ctx, sfx, 0.2, 220, v * 0.48, t + 0.02, 'lowpass');
    this.warmLandTone(ctx, sfx, 'sine', 95 * pitch, 38 * pitch, 0.26, v * 0.6, t + 0.01, 520);
  }

  private mossLand(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.11, impact);
    this.softThud(ctx, sfx, t, pitch * 0.9, impact, 108);
    this.noiseBurst(ctx, sfx, 0.12, 380, v * 0.7, t, 'bandpass');
    this.noiseBurst(ctx, sfx, 0.08, 220, v * 0.45, t + 0.03, 'lowpass');
    this.tone(ctx, sfx, 'triangle', 145 * pitch, 95 * pitch, 0.18, v * 0.4, t + 0.02);
  }

  private cottonFluff(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.1, impact);
    this.softNoise(ctx, sfx, 0.22, 2200, v * 0.55, t, 'highpass');
    this.softNoise(ctx, sfx, 0.18, 1400, v * 0.35, t + 0.025, 'bandpass', 0.6);
    this.warmLandTone(ctx, sfx, 'sine', 380 * pitch, 300 * pitch, 0.2, v * 0.45, t, 2800);
    this.warmLandTone(ctx, sfx, 'sine', 520 * pitch, 400 * pitch, 0.12, v * 0.2, t + 0.05, 3200);
  }

  private paperCrinkle(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.14, impact);
    const p = pitch * (0.94 + Math.random() * 0.12);

    // Toque seco na folha
    this.noiseBurst(ctx, sfx, 0.016, 5200 * p, v * 0.78, t, 'highpass');
    this.noiseBurst(ctx, sfx, 0.012, 6800, v * 0.42, t + 0.004, 'bandpass');

    // Corpo leve da folha
    this.softThud(ctx, sfx, t + 0.006, p * 0.96, impact, 142);
    this.warmLandTone(ctx, sfx, 'triangle', 188 * p, 148 * p, 0.08, v * 0.34, t + 0.01, 1900);

    // Cascata de amassar — estalos em sequência
    for (let i = 0; i < 7; i++) {
      const st = t + 0.014 + i * 0.019 + Math.random() * 0.008;
      const freq = 2600 + i * 340 + Math.random() * 480;
      this.noiseBurst(ctx, sfx, 0.022 + Math.random() * 0.012, freq * p, v * (0.6 - i * 0.05), st, 'highpass');
    }

    // Textura de folha roçando
    this.softNoise(ctx, sfx, 0.11, 3800, v * 0.45, t + 0.022, 'bandpass', 1.45);
    this.softNoise(ctx, sfx, 0.15, 2400, v * 0.36, t + 0.038, 'bandpass', 1.05);
    this.softNoise(ctx, sfx, 0.13, 1200, v * 0.26, t + 0.052, 'lowpass');

    // Micro estalos na cauda
    for (let i = 0; i < 4; i++) {
      this.noiseBurst(
        ctx,
        sfx,
        0.014,
        4200 + i * 520 + Math.random() * 300,
        v * (0.24 - i * 0.04),
        t + 0.1 + i * 0.022,
        'highpass',
      );
    }

    this.tone(ctx, sfx, 'triangle', 255 * p, 198 * p, 0.055, v * 0.24, t + 0.018);
  }

  private velvetThud(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.12, impact);
    this.warmLandTone(ctx, sfx, 'sine', 78 * pitch, 42 * pitch, 0.32, v * 1.0, t, 380);
    this.softNoise(ctx, sfx, 0.14, 180, v * 0.42, t, 'lowpass');
    this.warmLandTone(ctx, sfx, 'triangle', 110 * pitch, 68 * pitch, 0.22, v * 0.38, t + 0.03, 480);
  }

  /** Pouso nas flores — pétalas soltas e sino delicado */
  private blossomPetalLand(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.11, impact);
    const p = pitch * (0.97 + Math.random() * 0.08);

    // Toque macio no canteiro
    this.softThud(ctx, sfx, t, p * 0.92, impact, 98);
    this.warmLandTone(ctx, sfx, 'sine', 220 * p, 180 * p, 0.1, v * 0.42, t + 0.006, 2600);

    // Pétalas sussurrando ao cair
    this.softNoise(ctx, sfx, 0.18, 2800, v * 0.52, t + 0.01, 'highpass', 0.85);
    this.softNoise(ctx, sfx, 0.14, 1800, v * 0.38, t + 0.022, 'bandpass', 1.1);
    this.softNoise(ctx, sfx, 0.16, 1100, v * 0.28, t + 0.018, 'bandpass', 0.75);

    // Estalinhos finos de pétala
    for (let i = 0; i < 4; i++) {
      const st = t + 0.014 + i * 0.018;
      this.noiseBurst(
        ctx,
        sfx,
        0.016,
        3200 + i * 320 + Math.random() * 240,
        v * (0.36 - i * 0.04),
        st,
        'highpass',
      );
    }

    // Campainha floral — notas suaves ascendentes
    const notes = [587, 659, 740];
    const note = notes[Math.floor(Math.random() * notes.length)]! * p;
    this.tone(ctx, sfx, 'sine', note, note * 1.002, 0.14, v * 0.32, t + 0.028);
    this.tone(ctx, sfx, 'triangle', note * 1.5, note * 1.502, 0.09, v * 0.14, t + 0.038);

    // Cauda de pétalas flutuando
    this.softNoise(ctx, sfx, 0.24, 920, v * 0.2, t + 0.05, 'bandpass', 0.55);
    this.tone(ctx, sfx, 'sine', note * 0.88, note * 0.881, 0.11, v * 0.12, t + 0.062);
  }

  private grassCrunch(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.14, impact);
    const p = pitch * (0.96 + Math.random() * 0.1);

    // Pisada leve na terra
    this.softThud(ctx, sfx, t, p, impact, 112);
    this.warmLandTone(ctx, sfx, 'sine', 88 * p, 54 * p, 0.14, v * 0.58, t + 0.004, 440);

    // Capim seco — camadas de rustle
    this.softNoise(ctx, sfx, 0.15, 1500, v * 0.68, t + 0.008, 'bandpass', 1.35);
    this.softNoise(ctx, sfx, 0.11, 920, v * 0.48, t + 0.016, 'bandpass', 1.05);
    this.softNoise(ctx, sfx, 0.13, 580, v * 0.4, t + 0.012, 'lowpass');

    // Estalos finos de folha
    for (let i = 0; i < 5; i++) {
      const st = t + 0.012 + i * 0.02;
      this.noiseBurst(
        ctx,
        sfx,
        0.02,
        2400 + i * 280 + Math.random() * 200,
        v * (0.44 - i * 0.05),
        st,
        'highpass',
      );
    }

    // Cauda suave de folhas balançando
    this.softNoise(ctx, sfx, 0.22, 760, v * 0.24, t + 0.048, 'bandpass', 0.7);
    this.tone(ctx, sfx, 'triangle', 162 * p, 118 * p, 0.09, v * 0.2, t + 0.038);
  }

  private plasticSplash(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.12, impact);
    this.noiseBurst(ctx, sfx, 0.14, 420, v * 0.8, t, 'bandpass');
    this.tone(ctx, sfx, 'sine', 190 * pitch, 70 * pitch, 0.2, v * 0.55, t);
    this.softNoise(ctx, sfx, 0.16, 680, v * 0.45, t + 0.02, 'lowpass');
  }

  private cloudPoof(ctx: AudioContext, sfx: GainNode, pitch: number, impact: number): void {
    const t = ctx.currentTime;
    const v = this.impactVol(0.1, impact);
    this.softNoise(ctx, sfx, 0.18, 520, v * 0.7, t, 'bandpass', 0.5);
    this.softNoise(ctx, sfx, 0.22, 380, v * 0.45, t + 0.02, 'lowpass');
    this.warmLandTone(ctx, sfx, 'sine', 200 * pitch, 140 * pitch, 0.28, v * 0.5, t, 1200);
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
    this.runWhenResumed(() => fn(this.ctx!, this.sfx!));
  }

  private withLandCtx(fn: (ctx: AudioContext, land: GainNode) => void): void {
    if (!this.started || !this.ctx || !this.land || this.muted) return;
    this.runWhenResumed(() => fn(this.ctx!, this.land!));
  }

  private runWhenResumed(run: () => void): void {
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().then(run);
      return;
    }
    run();
  }

  private withAmbient(fn: (ctx: AudioContext, amb: GainNode) => void): void {
    if (!this.started || !this.ctx || !this.ambient || this.muted) return;
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    fn(this.ctx, this.ambient);
  }
}
