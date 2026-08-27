import { AudioBus } from '../audio/AudioBus';
import { MATERIALS, type MaterialId } from '../audio/materials';
import { Background } from './Background';
import { BreathSpawner } from './Breaths';
import { Camera } from './Camera';
import { Input } from './Input';
import { Particles } from './Particles';
import { PlatformSpawner } from './PlatformSpawner';
import { Player } from './Player';
import { REACH } from './physics';
import type { Hud } from '../ui/Hud';

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
  private breaths = new BreathSpawner();
  private background = new Background();

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
  private runBestBroken = false;
  private startBest = 0;

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
    this.input.bind(canvas);
    this.resize();
    window.addEventListener('resize', () => this.resize());
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
    this.hud.showTitle();
  }

  beginPlay(): void {
    this.resetRun();
    this.state = 'playing';
    this.hud.showPlaying(this.best);
  }

  retry(): void {
    this.beginPlay();
  }

  private resetRun(): void {
    this.spawner = new PlatformSpawner(Date.now() ^ (Math.random() * 1e9));
    this.spawner.setWorldHalfWidth(this.worldHalfW);
    this.spawner.reset(this.worldHalfW);
    this.player.reset(0, 28);
    this.camera.snapTo(this.player.y, this.H * 0.15);
    this.particles.clear();
    this.breaths.reset();
    this.height = 0;
    this.breathCount = 0;
    this.perfectStreak = 0;
    this.fallTimer = 0;
    this.time = 0;
    this.floaters.length = 0;
    this.screenPunch = 0;
    this.runBestBroken = false;
    this.startBest = this.best;
  }

  private resize(): void {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.W = window.innerWidth;
    this.H = window.innerHeight;
    this.canvas.width = Math.floor(this.W * this.dpr);
    this.canvas.height = Math.floor(this.H * this.dpr);
    this.canvas.style.width = `${this.W}px`;
    this.canvas.style.height = `${this.H}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.worldHalfW = Math.min(220, Math.max(150, this.W * 0.38));
    this.spawner.setWorldHalfWidth(this.worldHalfW);
  }

  private update(dt: number): void {
    this.time += dt;
    this.input.update(dt);
    this.background.update(dt);
    if (this.screenPunch > 0) this.screenPunch = Math.max(0, this.screenPunch - dt * 4);

    for (let i = this.floaters.length - 1; i >= 0; i--) {
      this.floaters[i].life -= dt;
      this.floaters[i].y += 28 * dt;
      if (this.floaters[i].life <= 0) this.floaters.splice(i, 1);
    }

    if (this.state === 'title') {
      this.camera.follow(50 + Math.sin(this.time * 0.35) * 8, this.H * 0.12);
      this.camera.update(dt);
      for (const p of this.spawner.platforms) {
        p.setPreviewSquash(0.15 + Math.sin(this.time * 2.2 + p.x * 0.05) * 0.12);
        p.update(dt, this.time);
      }
      return;
    }

    if (this.state === 'falling') {
      this.fallTimer += dt;
      this.player.vy -= 200 * dt;
      this.player.y += this.player.vy * dt * 0.3;
      this.particles.update(dt);
      this.camera.update(dt);
      for (const p of this.spawner.platforms) p.update(dt, this.time);
      return;
    }

    const prevPlat = this.player.groundedPlatform;
    const prevBottom = this.player.bottom;
    const jumped = this.player.update(dt, this.input);
    if (jumped) this.audio.playJump();

    const wall = this.worldHalfW + 20;
    if (this.player.x < -wall) {
      this.player.x = -wall;
      this.player.vx *= -0.3;
    }
    if (this.player.x > wall) {
      this.player.x = wall;
      this.player.vx *= -0.3;
    }

    this.resolveCollisions(prevBottom);

    // Walk-off / fall-off: release press on previous platform
    if (prevPlat && this.player.groundedPlatform !== prevPlat) {
      prevPlat.setPressed(false);
    }

    this.spawner.update(this.player.y, this.camera.y, this.H);
    for (const p of this.spawner.platforms) p.update(dt, this.time);

    // After spring update, glue feet to the live surface
    if (this.player.groundedPlatform?.alive) {
      this.player.stickToSurface(this.player.groundedPlatform);
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
          this.particles.burst(o.x, o.y, '#e8a090', 8, 'foam', true);
        }
      }
    }

    this.particles.update(dt);

    this.height = Math.max(0, Math.floor(this.player.y));
    if (this.height > this.best) {
      this.best = this.height;
      localStorage.setItem(BEST_KEY, String(this.best));
      if (!this.runBestBroken && this.height > this.startBest && this.startBest > 0) {
        this.runBestBroken = true;
        this.audio.playRecord();
        this.particles.confetti(this.player.x, this.player.y + 20);
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
      if (!p.alive || p.opacity < 0.25) continue;
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
      const impact = Math.min(1.25, Math.abs(this.player.vy) / 420);
      const centerDist = Math.abs(this.player.x - p.x) / (p.w / 2);
      const perfect = centerDist < 0.15;
      const mat = MATERIALS[p.material];

      p.setPressed(true, impact * (perfect ? 1.2 : 1));
      this.player.landOn(p);
      this.player.applyLandSquash(impact * (perfect ? 1.15 : 1));
      this.player.trailColor = mat.particle;

      const count = 8 + Math.floor(impact * 8);
      this.particles.burst(
        this.player.x,
        platformTop,
        mat.particle,
        count,
        mat.particleStyle,
        perfect,
      );
      this.audio.playLand(p.material, perfect, this.perfectStreak);

      if (perfect) {
        this.perfectStreak += 1;
        this.camera.nudgePerfect(5 + Math.min(4, this.perfectStreak));
        this.screenPunch = 0.55;
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
        this.hud.showMaterialToast(mat.name);
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
    this.audio.playFall();
    this.hud.showFall(this.height, this.best);
  }

  private toScreen = (x: number, y: number) =>
    this.camera.worldToScreen(x, y, this.W, this.H);

  private draw(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);

    const punch = 1 + this.screenPunch * 0.012 + this.camera.punch * 0.008;
    ctx.save();
    if (punch !== 1) {
      ctx.translate(this.W / 2, this.H / 2);
      ctx.scale(punch, punch);
      ctx.translate(-this.W / 2, -this.H / 2);
    }

    this.background.draw(ctx, this.W, this.H, this.camera.y);

    const left = this.toScreen(-this.worldHalfW - 30, this.camera.y);
    const right = this.toScreen(this.worldHalfW + 30, this.camera.y);
    ctx.fillStyle = 'rgba(255,255,255,0.035)';
    ctx.fillRect(0, 0, Math.max(0, left.x), this.H);
    ctx.fillRect(right.x, 0, Math.max(0, this.W - right.x), this.H);

    for (const p of this.spawner.platforms) p.draw(ctx, this.toScreen, this.time);
    for (const o of this.breaths.orbs) o.draw(ctx, this.toScreen, this.time);
    this.particles.draw(ctx, this.toScreen);

    if (this.state === 'title') {
      this.player.x = Math.sin(this.time * 0.55) * 18;
      this.player.y = 30 + Math.sin(this.time * 1.1) * 5;
    }
    this.player.draw(ctx, this.toScreen);

    for (const f of this.floaters) {
      const s = this.toScreen(f.x, f.y);
      ctx.globalAlpha = Math.min(1, f.life * 1.4);
      ctx.fillStyle = f.color;
      ctx.font = "600 22px 'Fraunces', Georgia, serif";
      ctx.textAlign = 'center';
      ctx.fillText(f.text, s.x, s.y);
    }
    ctx.globalAlpha = 1;

    if (this.debug) this.drawDebug(ctx);

    ctx.restore();

    if (this.state === 'falling') {
      const a = Math.min(0.38, this.fallTimer * 0.4);
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
      `gapY≤${REACH.maxGapY.toFixed(0)} reachX≤${REACH.maxCenterGapX.toFixed(0)} h=${this.height}`,
      10,
      this.H - 12,
    );
    ctx.restore();
  }
}
