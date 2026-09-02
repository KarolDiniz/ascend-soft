import { PASTEL, rgba } from '../theme/pastelPalette';
import { PIXEL, fillPx, px, snapPt } from '../theme/pixel';
import type { Platform } from './Platform';

const FLOAT_ABOVE = 26;
const COLLECT_R2 = 42 * 42;
const MIN_HEIGHT = 90;
const GAP_PLATFORMS = 4;

export class CoinOrb {
  collected = false;
  private platform: Platform;
  private offsetX: number;
  private phase: number;

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

  update(dt: number, playerX: number, playerY: number, magnetR: number): void {
    this.phase += dt * 3.4;
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < magnetR && dist > 1) {
      this.offsetX += (dx / dist) * (1 - dist / magnetR) * 150 * dt;
    }
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
    const bob = Math.sin(this.phase + time) * 3.5;
    const raw = toScreen(this.x, this.y + bob);
    const s = snapPt(raw.x, raw.y);
    const u = PIXEL.unit;
    const spin = 0.28 + Math.abs(Math.sin(this.phase * 1.6)) * 0.72;
    const hw = px(5.2 * spin);
    const hh = u * 5;

    ctx.save();
    fillPx(ctx, s.x - hw, s.y - hh + u, hw * 2, hh * 2 - u * 2, '#E2B84A');
    fillPx(ctx, s.x - hw + u, s.y - hh, hw * 2 - u * 2, u, rgba('#F3E2A8', 0.95));
    fillPx(ctx, s.x - hw + u, s.y + hh - u, hw * 2 - u * 2, u, '#C4922C');
    if (spin > 0.55) {
      fillPx(ctx, s.x - u, s.y - u, u * 2, u * 2, PASTEL.white);
      fillPx(ctx, s.x - u * 0.5, s.y + u, u, u, rgba('#C4922C', 0.7));
    }
    ctx.restore();
  }
}

export class CoinSpawner {
  orbs: CoinOrb[] = [];
  private seeded = new Set<number>();
  private since = 999;
  private magnetR = 130;

  setMagnetR(r: number): void {
    this.magnetR = r;
  }

  reset(): void {
    this.orbs.length = 0;
    this.seeded.clear();
    this.since = 999;
  }

  update(platforms: readonly Platform[], cameraY: number, viewH: number): void {
    this.sync(platforms);
    const killY = cameraY - viewH * 0.95;
    let w = 0;
    for (let i = 0; i < this.orbs.length; i++) {
      const o = this.orbs[i]!;
      if (!o.collected && o.alive && o.y > killY) this.orbs[w++] = o;
    }
    this.orbs.length = w;
  }

  tickMagnet(dt: number, playerX: number, playerY: number): void {
    const r = this.magnetR;
    for (let i = 0; i < this.orbs.length; i++) {
      const o = this.orbs[i]!;
      if (o.collected) continue;
      o.update(dt, playerX, playerY, r);
    }
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
      this.orbs.push(new CoinOrb(p, (Math.random() * 2 - 1) * maxOff));
    }
  }
}
