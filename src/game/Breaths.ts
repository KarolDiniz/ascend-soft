import { PASTEL, rgba } from '../theme/pastelPalette';
import { PIXEL, fillPx, px, snapPt } from '../theme/pixel';

export class BreathOrb {
  x: number;
  y: number;
  r = 8;
  collected = false;
  private phase: number;
  private trail: { x: number; y: number; life: number }[] = [];

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.phase = Math.random() * Math.PI * 2;
  }

  update(dt: number, playerX: number, playerY: number): void {
    this.phase += dt * 2.2;
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 70 && dist > 1) {
      const pull = (1 - dist / 70) * 90 * dt;
      this.x += (dx / dist) * pull;
      this.y += (dy / dist) * pull;
    }
    this.trail.push({ x: this.x, y: this.y, life: 0.35 });
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].life -= dt;
      if (this.trail[i].life <= 0) this.trail.splice(i, 1);
    }
    if (this.trail.length > 6) this.trail.splice(0, this.trail.length - 6);
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
    // Diamond / plus sparkle orb
    fillPx(ctx, s.x - r / 2, s.y - u, r, u * 2, PASTEL.peach);
    fillPx(ctx, s.x - u, s.y - r / 2, u * 2, r, PASTEL.butter);
    fillPx(ctx, s.x - u, s.y - u, u * 2, u * 2, PASTEL.white);
    // Twinkle corners
    if (Math.sin(time * 5 + this.phase) > 0.5) {
      fillPx(ctx, s.x + r / 2 + u, s.y - u, u, u, rgba(PASTEL.coral, 0.8));
      fillPx(ctx, s.x - r / 2 - u * 2, s.y, u, u, rgba(PASTEL.coral, 0.7));
    }
    ctx.restore();
  }
}

export class BreathSpawner {
  orbs: BreathOrb[] = [];
  private nextAt = 200;

  reset(): void {
    this.orbs = [];
    this.nextAt = 120 + Math.random() * 80;
  }

  update(platformsY: number, playerX: number): void {
    while (this.nextAt < platformsY) {
      const x = playerX + (Math.random() - 0.5) * 140;
      this.orbs.push(new BreathOrb(x, this.nextAt + 20));
      this.nextAt += 150 + Math.random() * 160;
    }
    this.orbs = this.orbs.filter((o) => !o.collected && o.y > platformsY - 600);
  }
}
