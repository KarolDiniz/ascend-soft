import { AudioBus } from '../audio/AudioBus';
import { MATERIALS, type MaterialId } from '../audio/materials';
import { AmbientParticles } from './atmosphere/AmbientParticles';
import { Atmosphere } from './atmosphere/Atmosphere';
import { SceneryLayer } from './atmosphere/SceneryLayer';
import { SoftPass } from './atmosphere/SoftPass';
import { Background } from './Background';
import { BreathSpawner } from './Breaths';
import { CollectibleManager } from './collectibles/CollectibleManager';
import { COLLECTIBLES } from './collectibles/definitions';
import { addCollected, loadCollected } from './collectibles/storage';
import { Camera } from './Camera';
import { Input } from './Input';
import { Particles } from './Particles';
import { ShardField } from './platform/ShardVfx';
import { isSoapBarMaterial } from './platform/soapColors';
import { PlatformSpawner } from './PlatformSpawner';
import { Player } from './Player';
import { REACH } from './physics';
import { PhaseRunOrder, setPhaseRun } from './PhaseRunOrder';
import { materialMood } from './ThemedPhases';
import type { FallSummary } from '../ui/fallCopy';
import type { Hud } from '../ui/Hud';
import type { PlatformEvent } from './Platform';
import { getPerfProfile, loadSettings, saveSettings, type UserSettings } from './GameSettings';
import { loadPlayerAppearance, savePlayerAppearance, type PlayerAppearance } from './playerAppearance';
import { enablePixelMode, PIXEL, snapPt } from '../theme/pixel';

const BEST_KEY = 'ascend-soft-best';
const SEEN_KEY = 'ascend-soft-seen-materials';

export type GameState = 'title' | 'playing' | 'falling';

interface Floater {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

interface TitleBabble {
  x: number;
  y: number;
  vx: number;
  vy: number;
  text: string;
  life: number;
  maxLife: number;
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audio: AudioBus;
  private hud: Hud;

  private input = new Input();
  private camera = new Camera();
  private player = new Player();
  private spawner = new PlatformSpawner();
  private particles = new Particles();
  private ambient = new AmbientParticles();
  private atmosphere = new Atmosphere();
  private scenery = new SceneryLayer();
  /** Low-res upscale soft-focus for scenery (cheap fake blur). */
  private softScenery = new SoftPass(0.38);
  private shards = new ShardField();
  private breaths = new BreathSpawner();
  private collectibles = new CollectibleManager();
  private collected = loadCollected();
  private runCollectibles = 0;
  private background = new Background();
  private mixStreak = 0;
  private lastReaction = '';
  private fpsEma = 60;

  state: GameState = 'title';
  height = 0;
  best = 0;
  breathCount = 0;
  perfectStreak = 0;

  private time = 0;
  private lastTs = 0;
  private raf = 0;
  private fallTimer = 0;
  private worldHalfW = 180;
  private dpr = 1;
  private W = 0;
  private H = 0;
  private debug = false;
  private screenPunch = 0;
  private floaters: Floater[] = [];
  private seenMaterials = new Set<MaterialId>();
  /** Banners de fase já exibidos nesta rodada — não repetir ao ciclar altitudes */
  private shownPhaseToasts = new Set<MaterialId>();
  private runBestBroken = false;
  private startBest = 0;
  private fallRevealTimer = 0;
  private fallSummaryPending: FallSummary | null = null;
  private userSettings: UserSettings = loadSettings();
  private lightMode = this.userSettings.lightMode;
  private lastMarimbaBar = -1;
  private kittenWalkAcc = 0;
  private titleFollowSpeed = 0;
  private titleBabbles: TitleBabble[] = [];
  private titleBabbleCd = 0;
  private titleBabbleStep = 0;
  private titleMurmurActive = false;
  private titleOverlayOpen = false;

  constructor(canvas: HTMLCanvasElement, audio: AudioBus, hud: Hud) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unavailable');
    this.ctx = ctx;
    this.audio = audio;
    this.hud = hud;
    this.best = Number(localStorage.getItem(BEST_KEY) || '0') || 0;
    this.debug = new URLSearchParams(location.search).has('debug');
    try {
      const raw = localStorage.getItem(SEEN_KEY);
      if (raw) (JSON.parse(raw) as MaterialId[]).forEach((id) => this.seenMaterials.add(id));
    } catch {
      /* ignore */
    }
    this.applyUserSettings(this.userSettings);
    this.applyPlayerAppearance(loadPlayerAppearance());
    this.input.bind(canvas);
    this.resize();
    this.applyPerfSettings();
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('pointerdown', () => {
      if (this.state !== 'title' || !this.hud.isTitleVisible()) return;
      void this.audio.unlock().then(() => {
        this.audio.setVolume(this.userSettings.volume / 100);
        this.audio.setMuted(this.userSettings.muted);
      });
    });
  }

  applyPlayerAppearance(app: PlayerAppearance): void {
    savePlayerAppearance(app);
    this.player.setAppearance(app);
  }

  /** Squash feliz ao trocar cor/acessório no editor */
  nudgeTitleCharacter(): void {
    if (this.state !== 'title') return;
    this.player.nudgeHappy();
    this.player.mouthOpen = true;
    window.setTimeout(() => {
      if (this.state === 'title' && !this.titleMurmurActive) this.player.mouthOpen = false;
    }, 220);
  }

  /** Modal da tela inicial — silencia o blob atrás enquanto estiver aberto */
  setTitleOverlayOpen(open: boolean): void {
    this.titleOverlayOpen = open;
    if (!open || this.state !== 'title') return;
    this.audio.stopSoftMurmur();
    this.titleMurmurActive = false;
    this.player.mouthOpen = false;
    this.titleBabbles.length = 0;
    this.titleBabbleCd = 0;
  }

  isLightMode(): boolean {
    return this.lightMode;
  }

  isReduceMotion(): boolean {
    return this.userSettings.reduceMotion;
  }

  applyUserSettings(settings: UserSettings): void {
    this.userSettings = { ...settings };
    document.documentElement.classList.toggle('reduce-motion', settings.reduceMotion);

    if (this.lightMode !== settings.lightMode) {
      this.lightMode = settings.lightMode;
      this.applyPerfSettings();
      this.resize();
    }

    this.audio.setVolume(settings.volume / 100);
    this.audio.setMuted(settings.muted);
    this.audio.setVoiceEnabled(settings.voiceEnabled);
    this.audio.setLandIntensity(settings.landIntensity);
    this.hud.setMuteLabel(settings.muted || settings.volume === 0);
  }

  setLightMode(enabled: boolean): void {
    const next = { ...this.userSettings, lightMode: enabled };
    saveSettings(next);
    this.applyUserSettings(next);
  }

  private perfProfile() {
    return getPerfProfile(this.lightMode);
  }

  private applyPerfSettings(): void {
    const p = this.perfProfile();
    this.softScenery.setScale(p.softPassScale);
    this.ambient.setBudgetScale(p.budgetScale);
    this.scenery.configurePerf({
      skipBiomeSprites: p.skipBiomeSprites,
      maxDraw: p.maxSceneryDraw,
      forceLow: p.forceSceneryPerf,
    });
    if (p.forceSceneryPerf) this.scenery.setPerfMode(true);
    else if (!this.lightMode) this.scenery.setPerfMode(false);
    this.applyMobileScales();
  }

  private applyMobileScales(): void {
    const p = this.perfProfile();
    if (p.lightMode) {
      this.ambient.setMobileScale(p.ambientScale);
      this.particles.setMobileScale(p.particleScale);
      return;
    }
    const mobile = this.W < 700 || this.dpr >= 1.5;
    this.ambient.setMobileScale(mobile ? 0.68 : p.ambientScale);
    this.particles.setMobileScale(mobile ? 0.58 : p.particleScale);
  }

  start(): void {
    this.lastTs = performance.now();
    const loop = (ts: number) => {
      const raw = (ts - this.lastTs) / 1000;
      this.lastTs = ts;
      const dt = Math.min(0.033, Math.max(0.001, raw));
      this.update(dt);
      this.draw();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
  }

  initTitle(): void {
    this.resetRun();
    this.state = 'title';
    this.titleFollowSpeed = 0;
    this.titleBabbles.length = 0;
    this.titleBabbleCd = 0;
    this.titleBabbleStep = 0;
    this.titleMurmurActive = false;
    this.titleOverlayOpen = false;
    this.audio.stopSoftMurmur();
    this.player.mouthOpen = false;
    this.hud.showTitle(this.best);
    this.onCatalogRefresh?.();
  }

  /** Callback para atualizar catálogo na tela inicial */
  onCatalogRefresh: (() => void) | null = null;

  goToTitle(): void {
    this.audio.stopSoftMurmur();
    this.fallRevealTimer = 0;
    this.fallSummaryPending = null;
    this.initTitle();
  }

  beginPlay(): void {
    this.audio.stopSoftMurmur();
    this.titleMurmurActive = false;
    this.resetRun();
    this.state = 'playing';
    this.hud.showPlaying(this.best);
    const z = this.atmosphere.getPrimaryZone();
    const pal = this.atmosphere.getPalette();
    this.tryShowPhaseToast(z.id, z.label, z.quote, pal.accent);
    this.hud.setAmbientColors(pal.top, pal.mid);
  }

  retry(): void {
    this.fallRevealTimer = 0;
    this.fallSummaryPending = null;
    this.beginPlay();
  }

  private resetRun(): void {
    const seed = (Date.now() ^ (Math.random() * 1e9)) >>> 0;
    const phaseRun = new PhaseRunOrder(seed);
    setPhaseRun(phaseRun);

    this.spawner = new PlatformSpawner(seed);
    this.spawner.setWorldHalfWidth(this.worldHalfW);
    this.spawner.reset(this.worldHalfW, phaseRun.starterMaterial());
    this.player.reset(0, 28);
    this.camera.snapTo(this.player.y, this.H * 0.15);
    this.particles.clear();
    this.ambient.clear();
    this.shards.clear();
    this.breaths.reset();
    this.collectibles.reset();
    this.runCollectibles = 0;
    this.scenery.resetForRun(phaseRun.starterMaterial());
    this.atmosphere.resetForHeight(0);
    this.height = 0;
    this.breathCount = 0;
    this.perfectStreak = 0;
    this.mixStreak = 0;
    this.lastReaction = '';
    this.fallTimer = 0;
    this.time = 0;
    this.floaters.length = 0;
    this.screenPunch = 0;
    this.runBestBroken = false;
    this.startBest = this.best;
    this.shownPhaseToasts.clear();
    this.fallRevealTimer = 0;
    this.fallSummaryPending = null;
  }

  /** Exibe banner de reflexão conforme preferência do jogador */
  private tryShowPhaseToast(
    id: MaterialId,
    label: string,
    quote: string,
    accent?: string,
  ): void {
    const mode = this.userSettings.bannerMode;
    if (mode === 'never') return;
    if (mode === 'first') {
      if (this.shownPhaseToasts.has(id)) return;
      this.shownPhaseToasts.add(id);
    }
    this.hud.showPhaseToast(label, quote, accent);
  }

  private resize(): void {
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    const p = this.perfProfile();
    const mobile = this.W < 700;
    const rawDpr = window.devicePixelRatio || 1;
    const cap = mobile ? p.mobileDprCap : p.dprCap;
    this.dpr = Math.min(cap, rawDpr);
    this.canvas.width = Math.floor(this.W * this.dpr);
    this.canvas.height = Math.floor(this.H * this.dpr);
    this.canvas.style.width = `${this.W}px`;
    this.canvas.style.height = `${this.H}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.worldHalfW = Math.min(220, Math.max(150, this.W * 0.38));
    this.spawner.setWorldHalfWidth(this.worldHalfW);
    this.applyMobileScales();
  }

  private updateAdaptivePerf(): void {
    const p = this.perfProfile();
    let amb = p.ambientScale;
    let part = p.particleScale;
    if (this.fpsEma < 45) {
      amb = Math.min(amb, 0.45);
      part = Math.min(part, 0.45);
      this.particles.setAllowContinuous(false);
      this.scenery.setPerfMode(true);
    } else if (this.fpsEma < 55) {
      amb = Math.min(amb, 0.62);
      part = Math.min(part, 0.68);
      this.particles.setAllowContinuous(true);
      this.scenery.setPerfMode(true);
    } else {
      this.particles.setAllowContinuous(true);
      this.scenery.setPerfMode(p.forceSceneryPerf);
    }
    if (!p.lightMode && this.W >= 700 && this.dpr < 1.5 && this.fpsEma >= 55) {
      amb = p.ambientScale;
      part = p.particleScale;
      this.scenery.setPerfMode(false);
    }
    this.ambient.setMobileScale(amb);
    this.particles.setMobileScale(part);
  }

  private update(dt: number): void {
    this.time += dt;
    this.input.update(dt);
    this.fpsEma = this.fpsEma * 0.9 + (1 / Math.max(0.001, dt)) * 0.1;
    this.updateAdaptivePerf();

    const atmoHeight = this.state === 'title' ? 40 : this.height;
    this.atmosphere.update(dt, atmoHeight);
    this.background.update(dt, this.atmosphere);
    this.scenery.update(dt, this.atmosphere);
    this.ambient.update(dt, this.atmosphere, this.camera.y, this.W, this.H);
    this.ambient.emitFromScenery(
      this.scenery.collectEmitters(this.W, this.H, this.camera.y),
      this.atmosphere,
      this.W,
      this.H,
      dt,
    );

    const grassWeight = this.atmosphere
      .getWeights()
      .filter((w) => w.zone.id === 'grass')
      .reduce((sum, w) => sum + w.weight, 0);
    if (this.perfProfile().birdAmbience) {
      this.audio.updateGrassBirdAmbience(dt, grassWeight);
    }

    if (this.atmosphere.biomeEntered && this.state === 'playing') {
      const z = this.atmosphere.getPrimaryZone();
      const pal = this.atmosphere.getPalette();
      this.ambient.biomeBurst(this.player.x, this.player.y, this.atmosphere);
      this.tryShowPhaseToast(z.id, z.label, z.quote, this.atmosphere.getAccent());
      this.hud.setAmbientColors(pal.top, pal.mid);
      this.audio.playBiomeEnter(z.id);
      if (!this.userSettings.reduceMotion) {
        this.screenPunch = Math.max(this.screenPunch, 0.32);
        this.particles.burst(
          this.player.x,
          this.player.y + 30,
          this.atmosphere.getAccent(),
          14,
          'glitter',
          false,
        );
      }
    }

    if (this.state === 'playing') {
      const pal = this.atmosphere.getPalette();
      this.hud.setAmbientColors(pal.top, pal.mid);
    }

    if (this.screenPunch > 0) this.screenPunch = Math.max(0, this.screenPunch - dt * 4);

    for (let i = this.floaters.length - 1; i >= 0; i--) {
      this.floaters[i].life -= dt;
      this.floaters[i].y += 28 * dt;
      if (this.floaters[i].life <= 0) this.floaters.splice(i, 1);
    }

    if (this.state === 'title') {
      this.camera.follow(42 + Math.sin(this.time * 0.28) * 10, this.H * 0.14);
      this.camera.update(dt);
      this.updateTitlePlayer(dt);
      this.collectibles.syncPlatforms(this.spawner.platforms);
      for (const p of this.spawner.platforms) {
        const wave = this.userSettings.reduceMotion
          ? 0.2
          : Math.sin(this.time * 2.05 + p.x * 0.04 + p.y * 0.01);
        const soft = this.userSettings.reduceMotion
          ? 0
          : Math.sin(this.time * 0.9 + p.x * 0.02) * 0.06;
        p.setPreviewSquash(0.2 + wave * 0.16 + soft);
        p.update(dt, this.time);
      }
      return;
    }

    if (this.state === 'falling') {
      this.fallTimer += dt;
      this.player.vy -= 200 * dt;
      this.player.y += this.player.vy * dt * 0.3;
      this.particles.setWind(this.atmosphere.windX, this.atmosphere.windY);
      this.particles.update(dt);
      this.shards.update(dt);
      this.camera.update(dt);
      for (const p of this.spawner.platforms) p.update(dt, this.time);

      if (this.fallRevealTimer > 0) {
        this.fallRevealTimer -= dt;
        if (this.fallRevealTimer <= 0 && this.fallSummaryPending) {
          this.hud.showFall(this.fallSummaryPending);
          this.fallSummaryPending = null;
        }
      }
      return;
    }

    const prevPlat = this.player.groundedPlatform;
    const prevBottom = this.player.bottom;
    const wasGrounded = this.player.onGround;
    const jumped = this.player.update(dt, this.input);
    if (jumped === 'ground' && prevPlat) {
      const mat = MATERIALS[prevPlat.material];
      this.particles.releasePuff(
        this.player.x,
        prevPlat.surfaceY,
        mat.particle,
        this.atmosphere.getAccent(),
      );
      if (prevPlat.material === 'keyboard') {
        this.particles.keyboardLetters(
          this.player.x,
          prevPlat.surfaceY,
          7 + Math.min(5, Math.floor(Math.abs(this.player.vx) * 0.04)),
          true,
          this.player.vx,
        );
      }
      if (prevPlat.material === 'grass') {
        this.particles.grassFoliage(
          this.player.x,
          prevPlat.surfaceY,
          10 + Math.min(6, Math.floor(Math.abs(this.player.vx) * 0.05)),
          true,
          this.player.vx,
        );
      }
      if (prevPlat.material === 'blossom') {
        this.particles.blossomPetals(
          this.player.x,
          prevPlat.surfaceY,
          12 + Math.min(6, Math.floor(Math.abs(this.player.vx) * 0.05)),
          true,
          this.player.vx,
        );
      }
      if (prevPlat.material === 'marimba') {
        this.particles.musicNotes(
          this.player.x,
          prevPlat.surfaceY,
          7 + Math.min(5, Math.floor(Math.abs(this.player.vx) * 0.04)),
          true,
          this.player.vx,
        );
      }
    }
    if (jumped === 'air') {
      this.particles.burst(
        this.player.x,
        this.player.y,
        this.player.trailColor,
        10,
        'spark',
        false,
        this.atmosphere.getAccent(),
      );
    }

    const wall = this.worldHalfW + 20;
    if (this.player.x < -wall) {
      this.player.x = -wall;
      this.player.vx *= -0.3;
    }
    if (this.player.x > wall) {
      this.player.x = wall;
      this.player.vx *= -0.3;
    }

    this.spawner.update(this.player.y, this.camera.y, this.H);
    this.collectibles.syncPlatforms(this.spawner.platforms);
    this.collectibles.prune(this.camera.y, this.H);
    for (const p of this.spawner.platforms) p.update(dt, this.time);

    this.resolveCollisions(prevBottom);

    if (this.player.groundedPlatform?.alive && this.player.groundedPlatform.solid) {
      this.player.stickToSurface(this.player.groundedPlatform);
    } else if (
      prevPlat &&
      wasGrounded &&
      jumped !== 'ground' &&
      (!prevPlat.solid || !prevPlat.alive)
    ) {
      this.player.grantVanishCoyote();
    }

    // Walk-off / fall-off: release press on previous platform
    if (prevPlat && this.player.groundedPlatform !== prevPlat) {
      prevPlat.setPressed(false);
      if (wasGrounded && !jumped) {
        const mat = MATERIALS[prevPlat.material];
        this.particles.releasePuff(
          this.player.x,
          prevPlat.surfaceY,
          mat.particle,
          this.atmosphere.getAccent(),
        );
      }
    }

    // Continuous grounded ASMR juice
    if (this.player.groundedPlatform?.alive && this.player.onGround) {
      const gp = this.player.groundedPlatform;
      const mat = MATERIALS[gp.material];
      this.particles.emitGrounded(
        dt,
        this.player.x,
        gp.surfaceY,
        this.player.vx,
        gp.pressAmount,
        mat.squash,
        mat.particle,
        mat.particleStyle,
        gp.material,
        gp.behavior,
        this.atmosphere.getAccent(),
      );
      if (gp.material === 'marimba' && Math.abs(this.player.vx) > 35) {
        const prevBar = this.lastMarimbaBar;
        const bar = gp.noteMarimbaHit(this.player.x);
        if (bar !== prevBar) {
          this.audio.playMarimbaBar(bar, 0.45 + gp.pressAmount * 0.25);
          this.particles.musicNotes(this.player.x, gp.surfaceY, 2, false, this.player.vx);
          this.lastMarimbaBar = bar;
        }
      }
      if (gp.material === 'kitten') {
        const walkRate = Math.abs(this.player.vx) * 0.007 + gp.pressAmount * 1.8 + 0.4;
        this.kittenWalkAcc += dt * walkRate;
        while (this.kittenWalkAcc >= 1) {
          this.kittenWalkAcc -= 1;
          if (gp.noteKittenMeow(this.player.x)) {
            this.audio.playKittenMeow();
            this.particles.burst(this.player.x, gp.surfaceY, mat.particle, 3, 'glitter', false);
          }
        }
      }
    } else if (!this.player.onGround) {
      this.particles.emitAirTrail(dt, this.player.x, this.player.y, this.player.trailColor);
    }

    // Idle aura from nearby platforms (even when not standing)
    const camY = this.camera.y;
    for (const p of this.spawner.platforms) {
      if (!p.alive || p.opacity < 0.3) continue;
      if (Math.abs(p.y - camY) > this.H * 0.85) continue;
      if (Math.abs(p.x - this.player.x) > this.worldHalfW + 40) continue;
      const mat = p.getMaterialDef();
      this.particles.emitPlatformIdle(dt, p.x, p.surfaceY, mat.particle, mat.particleStyle, p.material);
    }

    // Behavior juice from platforms
    for (const p of this.spawner.platforms) {
      for (const ev of p.consumeEvents()) {
        if (
          ev.type === 'vanishUnderPlayer' &&
          prevPlat === p &&
          wasGrounded &&
          jumped !== 'ground'
        ) {
          this.player.grantVanishCoyote();
          this.audio.playSoftVanish();
        }
        this.handlePlatformEvent(p, ev);
      }
    }

    const plats = this.spawner.platforms;
    const topPlatY = plats.length ? plats[plats.length - 1].y : this.player.y;
    this.breaths.update(topPlatY, this.player.x);
    for (const o of this.breaths.orbs) {
      o.update(dt, this.player.x, this.player.y);
      if (!o.collected) {
        const dx = this.player.x - o.x;
        const dy = this.player.y - o.y;
        if (dx * dx + dy * dy < 24 * 24) {
          o.collected = true;
          this.breathCount += 1;
          this.audio.playBreath();
          this.particles.burst(o.x, o.y, '#e8a090', 8, 'foam', true, this.atmosphere.getAccent());
          this.particles.inhale(o.x, o.y, this.atmosphere.getAccent());
        }
      }
    }

    const foundId = this.collectibles.update(
      dt,
      this.player.x,
      this.player.y,
      this.camera.y,
      this.H,
    );
    if (foundId) this.handleCollectible(foundId);

    this.particles.setWind(this.atmosphere.windX, this.atmosphere.windY);
    this.particles.update(dt);
    this.shards.update(dt);

    this.height = Math.max(0, Math.floor(this.player.y));
    if (this.height > this.best) {
      this.best = this.height;
      localStorage.setItem(BEST_KEY, String(this.best));
      if (!this.runBestBroken && this.height > this.startBest && this.startBest > 0) {
        this.runBestBroken = true;
        this.audio.playRecord();
        if (!this.userSettings.reduceMotion) {
          this.particles.confetti(this.player.x, this.player.y + 20);
        }
        this.addFloater(this.player.x, this.player.y + 40, 'recorde!', '#e8a090');
      } else if (!this.runBestBroken && this.startBest === 0 && this.height >= 30) {
        this.runBestBroken = true;
      }
    }
    this.hud.update(this.height, this.best, this.breathCount, this.perfectStreak);

    this.camera.follow(this.player.y, this.H * 0.18);
    this.camera.update(dt);

    const killLine = this.camera.y - this.H * 0.55;
    if (this.player.y < killLine) this.triggerFall();
  }

  private resolveCollisions(prevBottom: number): void {
    if (this.player.vy > 0) {
      // Rising — leave any pressed platform
      if (this.player.groundedPlatform) {
        this.player.groundedPlatform.setPressed(false);
      }
      this.player.onGround = false;
      this.player.groundedPlatform = null;
      return;
    }

    const wasGrounded = this.player.onGround;
    let landed: (typeof this.spawner.platforms)[number] | null = null;

    for (const p of this.spawner.platforms) {
      if (!p.alive || !p.solid || p.opacity < 0.25) continue;
      const withinX = this.player.right > p.left + 4 && this.player.left < p.right - 4;
      if (!withinX) continue;

      const platformTop = p.surfaceY;
      const crossing =
        prevBottom >= platformTop - 6 && this.player.bottom <= platformTop + 12;
      const resting =
        wasGrounded &&
        this.player.groundedPlatform === p &&
        Math.abs(this.player.bottom - platformTop) < 16;

      if (crossing || resting) {
        landed = p;
        break;
      }
    }

    if (!landed) {
      this.player.onGround = false;
      this.player.groundedPlatform = null;
      return;
    }

    const p = landed;
    const platformTop = p.surfaceY;
    const justLanded = !wasGrounded || this.player.groundedPlatform !== p;

    if (justLanded) {
      const impact = Math.min(1.25, Math.abs(this.player.vy) / 360);
      const centerDist = Math.abs(this.player.x - p.x) / (p.w / 2);
      const perfect = centerDist < 0.15;
      const mat = p.getMaterialDef();

      p.setPressed(true, impact * (perfect ? 1.2 : 1));
      this.player.landOn(p);
      this.player.applyLandSquash(impact * (perfect ? 1.15 : 1));
      this.player.trailColor = mat.particle;

      if (p.material !== 'jelly' && !isSoapBarMaterial(p.material)) {
        this.particles.landBurst(
          this.player.x,
          platformTop,
          mat.particle,
          mat.particleStyle,
          impact,
          perfect,
          this.atmosphere.getAccent(),
          p.material,
          perfect ? this.perfectStreak + 1 : 0,
        );
      }

      this.player.setLandExpression(p.material);
      let marimbaBar: number | undefined;
      if (p.material === 'marimba') {
        marimbaBar = p.noteMarimbaHit(this.player.x);
        this.lastMarimbaBar = marimbaBar;
      } else {
        this.lastMarimbaBar = -1;
      }

      // Material-specific juice — cada item tem assinatura própria
      switch (p.material) {
        case 'glycerin':
        case 'lavenderSoap':
        case 'creamSoap':
          this.particles.soapStepFoam(this.player.x, platformTop, mat.particle, impact, p.w);
          this.particles.risingBubbles(this.player.x, platformTop, mat.particle, 20 + Math.floor(impact * 14));
          break;
        case 'iceSoap':
        case 'whipped':
        case 'bathFoam':
          this.particles.risingBubbles(
            this.player.x,
            platformTop,
            mat.particle,
            p.material === 'whipped' || p.material === 'bathFoam' ? 28 : 20,
          );
          break;
        case 'soapBubble':
        case 'bubbleWrap':
          this.particles.risingBubbles(this.player.x, platformTop, mat.particle, 22);
          this.particles.foamPopStorm(this.player.x, platformTop, mat.particle);
          break;
        case 'clearSlime':
          this.particles.gumStretch(this.player.x, platformTop, mat.particle);
          this.particles.burst(this.player.x, platformTop, mat.particle, 10, 'foam', false);
          this.addFloater(this.player.x, platformTop + 16, 'gruda!', mat.particle);
          break;
        case 'mochi':
        case 'marshmallow':
          this.particles.burst(this.player.x, platformTop, mat.particle, 14, 'foam', false);
          this.particles.burst(this.player.x, platformTop, mat.particle, 8, 'crumb', false);
          break;
        case 'sponge':
          this.particles.waterSquirt(this.player.x, platformTop, p.w, impact);
          break;
        case 'keyboard':
          this.particles.keyboardLetters(
            this.player.x,
            platformTop,
            8 + Math.floor(impact * 8),
            true,
            this.player.vx,
          );
          break;
        case 'butter':
          this.particles.butterSpread(this.player.x, platformTop, mat.particle, impact, p.w);
          this.particles.drip(this.player.x, platformTop, mat.particle, 6);
          break;
        case 'chocolate':
          this.particles.chocolateBonbons(
            this.player.x,
            platformTop,
            10 + Math.floor(impact * 14),
            true,
            this.player.vx,
          );
          this.particles.meltRibbon(this.player.x, platformTop, mat.particle);
          break;
        case 'honeycomb':
          this.particles.drip(this.player.x, platformTop, mat.particle, 8);
          this.particles.meltRibbon(this.player.x, platformTop, mat.particle);
          break;
        case 'jelly':
          this.particles.jellySlimeDrops(this.player.x, platformTop, mat.particle, p.w, impact);
          break;
        case 'citrus':
          this.particles.juiceArc(this.player.x, platformTop, mat.particle);
          this.particles.burst(this.player.x, platformTop, mat.particle, 12, 'zest', false);
          break;
        case 'kinetic':
          this.particles.sandWhirl(
            this.player.x,
            platformTop,
            mat.particle,
            impact,
            this.player.vx,
            true,
          );
          break;
        case 'butterSlime':
          this.particles.burst(this.player.x, platformTop, mat.particle, 14, 'foam', false);
          this.particles.burst(this.player.x, platformTop, mat.particle, 8, 'crumb', false);
          break;
        case 'amoeba':
          this.particles.jellySlimeDrops(this.player.x, platformTop, mat.particle, p.w, impact);
          break;
        case 'moss':
          this.particles.mossBits(
            this.player.x,
            platformTop,
            12 + Math.floor(impact * 10),
            true,
            this.player.vx,
          );
          this.addFloater(this.player.x, platformTop + 16, 'macio~', mat.particle);
          break;
        case 'cotton':
          this.particles.cottonFluff(
            this.player.x,
            platformTop,
            14 + Math.floor(impact * 12),
            true,
            this.player.vx,
          );
          break;
        case 'grass':
          this.particles.grassFoliage(
            this.player.x,
            platformTop,
            12 + Math.floor(impact * 10),
            true,
            this.player.vx,
          );
          break;
        case 'cloud':
          this.particles.foamPopStorm(this.player.x, platformTop, mat.particle);
          break;
        case 'paper':
          this.particles.burst(this.player.x, platformTop, mat.particle, 14, 'crumb', false);
          this.particles.sandFall(this.player.x, platformTop, mat.particle, 8);
          break;
        case 'plasticBottle':
          this.particles.crackSpark(this.player.x, platformTop, this.atmosphere.getAccent());
          this.particles.burst(this.player.x, platformTop, mat.particle, 10, 'spark', false);
          break;
        case 'velvet':
          this.particles.velvetFibers(
            this.player.x,
            platformTop,
            mat.particle,
            12 + Math.floor(impact * 10),
            true,
            this.player.vx,
          );
          this.particles.burst(this.player.x, platformTop, mat.particle, 6, 'foam', false);
          break;
        case 'blossom':
          this.particles.blossomPetals(
            this.player.x,
            platformTop,
            14 + Math.floor(impact * 12),
            true,
            this.player.vx,
          );
          this.particles.burst(this.player.x, platformTop, mat.particle, 8, 'glitter', false);
          break;
        case 'marimba':
          this.particles.musicNotes(
            this.player.x,
            platformTop,
            9 + Math.floor(impact * 8),
            true,
            this.player.vx,
          );
          this.addFloater(this.player.x, platformTop + 16, '♪', mat.particle);
          break;
        case 'crystal':
          this.particles.risingBubbles(this.player.x, platformTop, mat.particle, 18);
          this.particles.burst(this.player.x, platformTop, mat.particle, 10, 'glitter', false);
          break;
        case 'ceramic':
          this.particles.crackSpark(this.player.x, platformTop, mat.particle);
          this.particles.burst(this.player.x, platformTop, mat.particle, 10, 'shard', false);
          break;
        case 'clay':
          this.particles.sandWhirl(
            this.player.x,
            platformTop,
            mat.particle,
            impact * 0.85,
            this.player.vx,
            true,
          );
          break;
        case 'silk':
          this.particles.silkThreads(
            this.player.x,
            platformTop,
            mat.particle,
            14 + Math.floor(impact * 10),
            true,
            this.player.vx,
          );
          this.particles.burst(this.player.x, platformTop, '#FFFFFF', 6, 'glitter', false);
          break;
        case 'kitten':
          p.noteKittenMeow(this.player.x);
          this.particles.cottonFluff(
            this.player.x,
            platformTop,
            8 + Math.floor(impact * 6),
            true,
            this.player.vx,
          );
          this.particles.burst(this.player.x, platformTop, mat.particle, 6, 'glitter', false);
          this.addFloater(this.player.x, platformTop + 16, 'miau~', mat.particle);
          break;
        default:
          break;
      }

      this.audio.playLand(p.material, perfect, this.perfectStreak, impact, marimbaBar);

      if (!this.userSettings.reduceMotion) {
        const landScreen = this.toScreen(this.player.x, platformTop);
        this.ambient.sceneryLandRipple(
          this.scenery.collectEmitters(this.W, this.H, this.camera.y),
          landScreen.x,
          landScreen.y,
          this.W,
          this.H,
        );
      }

      if (perfect) {
        this.perfectStreak += 1;
        if (!this.userSettings.reduceMotion) {
          this.camera.nudgePerfect(5 + Math.min(6, this.perfectStreak));
          this.screenPunch = 0.55 + Math.min(0.25, this.perfectStreak * 0.04);
        }
        this.addFloater(
          this.player.x,
          platformTop + 18,
          this.perfectStreak > 1 ? `+${this.perfectStreak}` : '+',
          '#e8a090',
        );
      } else {
        this.perfectStreak = 0;
      }

      if (!this.seenMaterials.has(p.material)) {
        this.seenMaterials.add(p.material);
        try {
          localStorage.setItem(SEEN_KEY, JSON.stringify([...this.seenMaterials]));
        } catch {
          /* ignore */
        }
      }

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(perfect ? [12, 20, 12] : 10);
        } catch {
          /* ignore */
        }
      }
    } else {
      p.setPressed(true);
      this.player.stickToSurface(p);
    }
  }

  private handlePlatformEvent(
    p: (typeof this.spawner.platforms)[number],
    ev: PlatformEvent,
  ): void {
    const mat = p.getMaterialDef();
    switch (ev.type) {
      case 'mouseSqueak':
        this.audio.playCheeseMouseSqueak();
        break;
      case 'spongeFlyBuzz':
        this.audio.playSpongeFlyBuzz();
        break;
      case 'honeyBeeBuzz':
        this.audio.playHoneyBeeBuzz();
        break;
      case 'meltDrip':
        this.particles.drip(p.x, p.surfaceY - 4, mat.particle, 4);
        this.particles.meltRibbon(p.x, p.surfaceY, mat.particle);
        if (materialMood(this.atmosphere.primaryId) === 'food' || materialMood(this.atmosphere.primaryId) === 'soap') {
          this.particles.burst(p.x, p.surfaceY, this.atmosphere.getAccent(), 3, 'foam', false);
        }
        if (Math.random() > 0.6) this.audio.playMeltDrip();
        break;
      case 'meltGone':
        this.particles.meltFinish(p.x, p.surfaceY, mat.particle);
        this.audio.playMeltGone();
        this.noteReaction(ev.floater, p.x, p.surfaceY + 20, '#d4a574');
        break;
      case 'crack':
        this.audio.playCrack();
        this.particles.crackSpark(p.x, p.surfaceY, this.atmosphere.getAccent());
        this.particles.burst(p.x, p.surfaceY, '#ffffff', 6, 'glitter', false);
        break;
      case 'shatter':
        this.shards.burst(p.x, p.surfaceY, ev.color, 16, p.w * 0.65);
        this.particles.shatterFollowThrough(p.x, p.surfaceY, mat.particle, this.atmosphere.getAccent());
        if (materialMood(this.atmosphere.primaryId) === 'frost') {
          this.particles.burst(p.x, p.surfaceY, '#d0e8f8', 10, 'glitter', false);
        }
        this.audio.playShatter();
        if (!this.userSettings.reduceMotion) {
          this.screenPunch = Math.max(this.screenPunch, 0.4);
        }
        this.noteReaction(ev.floater, p.x, p.surfaceY + 22, '#a8d8ff');
        break;
      case 'crumbleSand':
        this.particles.sandFall(p.x, p.surfaceY, mat.particle, p.w);
        if (Math.random() > 0.55) {
          this.particles.burst(p.x, p.surfaceY, mat.particle, 5, 'sand', false, this.atmosphere.getAccent());
        }
        if (Math.random() > 0.5) this.audio.playCrumbleLoop();
        break;
      case 'crumbleGone':
        this.particles.sandFall(p.x, p.surfaceY, mat.particle, p.w * 1.2);
        this.particles.burst(p.x, p.surfaceY, mat.particle, 18, 'sand', false, this.atmosphere.getAccent());
        this.audio.playCrumbleGone();
        this.noteReaction(ev.floater, p.x, p.surfaceY + 18, '#c9a88a');
        break;
      case 'foamPop':
        this.particles.foamPopStorm(p.x, p.surfaceY, mat.particle);
        this.audio.playFoamPop();
        if (!this.userSettings.reduceMotion) {
          this.screenPunch = Math.max(this.screenPunch, 0.35);
        }
        this.noteReaction(ev.floater, p.x, p.surfaceY + 20, '#fff5fa');
        break;
      case 'squeeze':
        this.particles.juiceArc(p.x, p.surfaceY, mat.particle);
        this.particles.burst(p.x, p.surfaceY, mat.particle, 6, 'zest', false, this.atmosphere.getAccent());
        if (materialMood(this.atmosphere.primaryId) === 'food') {
          this.particles.burst(p.x, p.surfaceY + 8, '#ffd0e0', 3, 'foam', false);
        }
        this.audio.playSqueeze();
        if (ev.gone && ev.floater) {
          this.noteReaction(ev.floater, p.x, p.surfaceY + 18, '#ffb84d');
        }
        break;
      case 'vanishUnderPlayer':
        break;
    }
  }

  private noteReaction(text: string, x: number, y: number, color: string): void {
    if (!text) return;
    this.addFloater(x, y, text, color);
    this.particles.floaterOrbit(x, y + 10, color);
    if (this.lastReaction && this.lastReaction !== text) {
      this.mixStreak += 1;
      if (this.mixStreak >= 3) {
        this.mixStreak = 0;
      }
    } else {
      this.mixStreak = Math.max(1, this.mixStreak);
    }
    this.lastReaction = text;
  }

  private handleCollectible(id: import('./collectibles/definitions').CollectibleId): void {
    const def = COLLECTIBLES[id];
    const isNew = addCollected(this.collected, id);
    this.runCollectibles += 1;
    this.audio.playCollect();
    if (!this.userSettings.reduceMotion) {
      this.screenPunch = Math.min(1, this.screenPunch + 0.35);
      if (isNew) this.particles.confetti(this.player.x, this.player.y + 16);
    }
    this.particles.burst(
      this.player.x,
      this.player.y + 8,
      def.primary,
      16,
      'spark',
      true,
      def.accent,
    );
    this.addFloater(this.player.x, this.player.y + 32, isNew ? `+${def.name}!` : def.name, def.primary);
    this.onCatalogRefresh?.();
  }

  private addFloater(x: number, y: number, text: string, color: string): void {
    this.floaters.push({ x, y, text, life: 0.85, color });
  }

  private triggerFall(): void {
    if (this.state !== 'playing') return;
    if (this.player.groundedPlatform) {
      this.player.groundedPlatform.setPressed(false);
    }
    this.state = 'falling';
    this.fallTimer = 0;
    this.perfectStreak = 0;
    this.particles.exhale(this.player.x, this.player.y, this.atmosphere.getAccent());
    this.audio.playFall();
    this.fallSummaryPending = {
      height: this.height,
      best: this.best,
      breaths: this.breathCount,
      collectibles: this.runCollectibles,
      startBest: this.startBest,
      runBestBroken: this.runBestBroken,
    };
    this.fallRevealTimer = 0.48;
  }

  private toScreen = (x: number, y: number) => {
    const s = this.camera.worldToScreen(x, y, this.W, this.H);
    return snapPt(s.x, s.y);
  };

  private screenToWorld(sx: number, sy: number): { x: number; y: number } {
    return {
      x: sx - this.W / 2 + this.camera.x,
      y: this.camera.y + this.H / 2 - sy,
    };
  }

  private updateTitlePlayer(dt: number): void {
    const p = this.player;
    const reduce = this.userSettings.reduceMotion;
    const followStrength = reduce ? 5.5 : 9.5;
    const follow = 1 - Math.exp(-followStrength * dt);

    const idleX = Math.sin(this.time * 0.48) * 22;
    const idleY = 28 + Math.sin(this.time * 1.05) * 7;

    let targetX = idleX;
    let targetY = idleY;

    if (this.input.pointerKnown) {
      const world = this.screenToWorld(this.input.pointerX, this.input.pointerY);
      const marginX = p.w * 0.45;
      const marginY = p.h * 0.45;
      const minX = -this.W / 2 + marginX;
      const maxX = this.W / 2 - marginX;
      const minY = this.camera.y - this.H / 2 + marginY;
      const maxY = this.camera.y + this.H / 2 - marginY;
      targetX = Math.max(minX, Math.min(maxX, world.x));
      targetY = Math.max(minY, Math.min(maxY, world.y));
    }

    const bob =
      this.input.pointerKnown && !reduce ? Math.sin(this.time * 8.5) * 2.2 * dt * 6 : 0;
    this.titleFollowSpeed = p.updateTitleFollow(dt, targetX, targetY, follow, bob);

    const moving =
      !this.titleOverlayOpen && this.titleFollowSpeed > 12 && this.input.pointerKnown;

    if (moving) {
      this.titleBabbleCd -= dt;
      if (this.titleBabbleCd <= 0) {
        this.spawnTitleBabble();
        this.titleBabbleCd = 0.2 + Math.random() * 0.16;
      }
    } else {
      this.titleBabbleCd = Math.max(0, this.titleBabbleCd - dt * 0.35);
    }

    this.syncTitleMurmur(moving);

    this.updateTitleBabbles(dt);
  }

  private syncTitleMurmur(moving: boolean): void {
    const canVoice =
      this.audio.isReady && !this.audio.isMuted && this.audio.isVoiceEnabled;

    if (this.titleOverlayOpen || !moving || !canVoice) {
      if (this.titleMurmurActive) {
        this.audio.stopSoftMurmur();
        this.titleMurmurActive = false;
        this.player.mouthOpen = false;
      }
      return;
    }

    this.titleMurmurActive = true;
    this.audio.ensureTitleMurmur((open) => {
      this.player.mouthOpen = open;
    });
  }

  private spawnTitleBabble(): void {
    const mouth = this.player.getMouthWorld();
    const phrases = ['bla', 'bla bla', 'bla bla bla'] as const;
    const text = phrases[this.titleBabbleStep % phrases.length]!;
    this.titleBabbleStep++;
    const facing = this.player.facing;
    this.titleBabbles.push({
      x: mouth.x + facing * 8 + (Math.random() - 0.5) * 6,
      y: mouth.y + 2,
      vx: facing * (24 + Math.random() * 16),
      vy: 18 + Math.random() * 12,
      text,
      life: 1.05,
      maxLife: 1.05,
    });
  }

  private updateTitleBabbles(dt: number): void {
    for (let i = this.titleBabbles.length - 1; i >= 0; i--) {
      const b = this.titleBabbles[i]!;
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vy += 8 * dt;
      if (b.life <= 0) this.titleBabbles.splice(i, 1);
    }
  }

  private drawTitleBabbles(ctx: CanvasRenderingContext2D): void {
    if (this.titleBabbles.length === 0) return;
    enablePixelMode(ctx);
    ctx.font = "8px 'Press Start 2P', monospace";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const b of this.titleBabbles) {
      const raw = this.toScreen(b.x, b.y);
      const s = snapPt(raw.x, raw.y);
      const t = 1 - b.life / b.maxLife;
      const alpha = Math.min(1, Math.max(0.88, b.life / b.maxLife));
      const wobble = Math.sin(t * 14 + b.x * 0.1) * 1.5;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(255, 252, 248, 0.9)';
      ctx.fillText(b.text, s.x + wobble + 1, s.y - 1);
      ctx.fillStyle = '#2E3339';
      ctx.fillText(b.text, s.x + wobble, s.y - 2);
    }
    ctx.globalAlpha = 1;
  }

  private draw(): void {
    const ctx = this.ctx;
    enablePixelMode(ctx);
    ctx.clearRect(0, 0, this.W, this.H);

    const punch = this.userSettings.reduceMotion
      ? 1
      : 1 + this.screenPunch * 0.012 + this.camera.punch * 0.008;
    ctx.save();
    if (punch !== 1) {
      ctx.translate(this.W / 2, this.H / 2);
      // Quantize punch so scale feels stepped/pixel
      const p = Math.round(punch * 64) / 64;
      ctx.scale(p, p);
      ctx.translate(-this.W / 2, -this.H / 2);
    }
    enablePixelMode(ctx);

    this.background.drawSky(ctx, this.W, this.H, this.atmosphere);

    const paintScenery = (s: CanvasRenderingContext2D) => {
      this.scenery.drawFar(s, this.W, this.H, this.camera.y, this.atmosphere);
      this.ambient.drawFar(s, this.toScreen);
      this.scenery.drawMid(s, this.W, this.H, this.camera.y, this.atmosphere);
      this.ambient.drawMid(s, this.toScreen);
    };

    const p = this.perfProfile();
    if (p.useSoftPass && this.state !== 'title') {
      this.softScenery.paint(ctx, this.W, this.H, paintScenery);
    } else {
      paintScenery(ctx);
    }

    const onTitle = this.state === 'title';
    if (!onTitle) {
      this.background.drawLightOverlay(ctx, this.W, this.H, this.atmosphere);
      enablePixelMode(ctx);
    }

    for (const p of this.spawner.platforms) p.draw(ctx, this.toScreen, this.time);
    this.collectibles.draw(ctx, this.toScreen, this.time, this.camera.y, this.H);
    for (const o of this.breaths.orbs) o.draw(ctx, this.toScreen, this.time);
    this.particles.draw(ctx, this.toScreen);
    this.shards.draw(ctx, this.toScreen);
    this.ambient.drawNear(ctx, this.toScreen);

    if (!onTitle) this.player.draw(ctx, this.toScreen);

    if (!onTitle) {
      this.background.drawBiomeOverlays(ctx, this.W, this.H, this.atmosphere);
    }

    for (const f of this.floaters) {
      const s = this.toScreen(f.x, f.y);
      ctx.globalAlpha = Math.min(1, f.life * 1.4);
      ctx.fillStyle = f.color;
      ctx.font = PIXEL.font;
      ctx.textAlign = 'center';
      // Pixel text shadow
      ctx.fillStyle = 'rgba(90,97,108,0.35)';
      ctx.fillText(f.text, s.x + 2, s.y + 2);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, s.x, s.y);
    }
    ctx.globalAlpha = 1;

    if (!this.userSettings.reduceMotion && !onTitle) {
      this.background.drawVignetteAndGrain(ctx, this.W, this.H, this.atmosphere);
    }

    if (onTitle) {
      this.player.draw(ctx, this.toScreen, { titleBoost: true });
      this.drawTitleBabbles(ctx);
    }

    if (this.debug) this.drawDebug(ctx);

    ctx.restore();

    if (this.state === 'falling') {
      const a = Math.min(0.55, this.fallTimer * 0.62);
      ctx.fillStyle = `rgba(168, 198, 214, ${a * 0.28})`;
      ctx.fillRect(0, 0, this.W, this.H);
      ctx.fillStyle = `rgba(243, 230, 220, ${a})`;
      ctx.fillRect(0, 0, this.W, this.H);
    }
  }

  private drawDebug(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const p of this.spawner.platforms) {
      const a = this.toScreen(p.left, p.top);
      const b = this.toScreen(p.right, p.bottom);
      ctx.strokeStyle = 'rgba(220, 80, 60, 0.7)';
      ctx.lineWidth = 1;
      ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);

      const c = this.toScreen(p.x, p.top);
      const topReach = this.toScreen(p.x, p.y + REACH.maxGapY);
      const side = this.toScreen(p.x + REACH.maxCenterGapX, p.y);
      ctx.strokeStyle = 'rgba(60, 140, 120, 0.35)';
      ctx.beginPath();
      ctx.ellipse(c.x, c.y, Math.abs(side.x - c.x), Math.abs(c.y - topReach.y), 0, Math.PI, 0, true);
      ctx.stroke();
    }
    const pl = this.toScreen(this.player.left, this.player.top);
    const pr = this.toScreen(this.player.right, this.player.bottom);
    ctx.strokeStyle = 'rgba(40, 100, 200, 0.8)';
    ctx.strokeRect(pl.x, pl.y, pr.x - pl.x, pr.y - pl.y);
    ctx.fillStyle = 'rgba(40,60,80,0.75)';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(
      `zone=${this.atmosphere.getDebugLabel()} gp=${this.particles.activeCount} amb=${this.ambient.activeCount} scn=${this.scenery.activeCount} h=${this.height} fps~${this.fpsEma.toFixed(0)}`,
      10,
      this.H - 12,
    );
    ctx.fillText(
      `${this.atmosphere.getDebugWeights()} emit=${this.scenery.lastEmitterCount} gust=${this.atmosphere.gustStrength.toFixed(2)}`,
      10,
      this.H - 28,
    );
    ctx.restore();
  }
}
