import { PASTEL, rgba } from '../theme/pastelPalette';
import { PIXEL, fillPx, px, snapPt } from '../theme/pixel';
import type { Platform } from './Platform';

/** Hover above the ledge — chest height when standing, always jumpable. */
const FLOAT_ABOVE = 26;
const MAGNET_R = 130;
const COLLECT_R2 = 42 * 42;
const MIN_HEIGHT = 90;
/** Place a breath every N platforms along the climb. */
const GAP_PLATFORMS = 4;

export class BreathOrb {
  collected = false;
  r = 10;
  private platform: Platform;
  private offsetX: number;
  private phase: number;
  private trail: { x: number; y: number; life: number }[] = [];

  constructor(platform: Platform, offsetX: number) {
    this.platform = platform;
    this.offsetX = offsetX;
    this.phase = Math.random() * Math.PI * 2;
  }

  get x(): number {
    return this.platform.x + this.offsetX;
  }

  get y(): number {
    return this.platform.surfaceY + FLOAT_ABOVE;
  }

  get alive(): boolean {
    return this.platform.alive && this.platform.opacity > 0.22;
  }

  update(dt: number, playerX: number, playerY: number): void {
    this.phase += dt * 2.2;
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < MAGNET_R && dist > 1) {
      const pull = (1 - dist / MAGNET_R) * 150 * dt;
      this.offsetX += (dx / dist) * pull;
    }
    this.trail.push({ x: this.x, y: this.y, life: 0.35 });
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].life -= dt;
      if (this.trail[i].life <= 0) this.trail.splice(i, 1);
    }
    if (this.trail.length > 6) this.trail.splice(0, this.trail.length - 6);
  }

  overlaps(playerX: number, playerY: number): boolean {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    return dx * dx + dy * dy < COLLECT_R2;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    toScreen: (x: number, y: number) => { x: number; y: number },
    time: number,
  ): void {
    if (this.collected) return;
    const bob = Math.sin(this.phase + time) * 4;
    for (const t of this.trail) {
      const tr = toScreen(t.x, t.y + bob * 0.5);
      const ts = snapPt(tr.x, tr.y);
      ctx.globalAlpha = (t.life / 0.35) * 0.35;
      fillPx(ctx, ts.x - PIXEL.unit, ts.y - PIXEL.unit, PIXEL.unit * 2, PIXEL.unit * 2, PASTEL.peach);
    }
    ctx.globalAlpha = 1;
    const raw = toScreen(this.x, this.y + bob);
    const s = snapPt(raw.x, raw.y);
    const pulse = 1 + Math.sin(time * 3 + this.phase) * 0.1;
    const r = px(this.r * pulse);
    const u = PIXEL.unit;

    ctx.save();
    ctx.globalAlpha = 0.9;
    fillPx(ctx, s.x - r / 2, s.y - u, r, u * 2, PASTEL.peach);
    fillPx(ctx, s.x - u, s.y - r / 2, u * 2, r, PASTEL.butter);
    fillPx(ctx, s.x - u, s.y - u, u * 2, u * 2, PASTEL.white);
    if (Math.sin(time * 5 + this.phase) > 0.5) {
      fillPx(ctx, s.x + r / 2 + u, s.y - u, u, u, rgba(PASTEL.coral, 0.8));
      fillPx(ctx, s.x - r / 2 - u * 2, s.y, u, u, rgba(PASTEL.coral, 0.7));
    }
    ctx.restore();
  }
}

export class BreathSpawner {
  orbs: BreathOrb[] = [];
  private seeded = new Set<number>();
  private since = 999;

  reset(): void {
    this.orbs = [];
    this.seeded.clear();
    this.since = 999;
  }

  update(platforms: readonly Platform[], cameraY: number, viewH: number): void {
    this.sync(platforms);
    const killY = cameraY - viewH * 0.95;
    this.orbs = this.orbs.filter((o) => !o.collected && o.alive && o.y > killY);
  }

  private sync(platforms: readonly Platform[]): void {
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i]!;
      if (this.seeded.has(p.seed)) continue;
      this.seeded.add(p.seed);
      this.since += 1;

      if (p.y < MIN_HEIGHT || !p.alive || p.fading) continue;
      if (this.since < GAP_PLATFORMS) continue;

      this.since = 0;
      const maxOff = Math.max(4, p.w * 0.22);
      const offsetX = (Math.random() * 2 - 1) * maxOff;
      this.orbs.push(new BreathOrb(p, offsetX));
    }
  }
}
