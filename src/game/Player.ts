import type { Input } from './Input';
import type { Platform } from './Platform';
import { PHYS } from './physics';

interface TrailPoint {
  x: number;
  y: number;
  life: number;
  color: string;
}

export class Player {
  x = 0;
  y = 40;
  vx = 0;
  vy = 0;
  w = 30;
  h = 30;
  onGround = false;
  facing = 1;
  trailColor = '#7eb0b8';

  private coyote = 0;
  private squash = 1;
  private stretch = 1;
  private trail: TrailPoint[] = [];
  private trailTimer = 0;
  groundedPlatform: Platform | null = null;

  readonly gravity = PHYS.gravity;
  readonly moveAccel = PHYS.moveAccel;
  readonly maxSpeed = PHYS.maxSpeed;
  readonly jumpVel = PHYS.jumpVel;
  readonly friction = PHYS.friction;
  readonly airFriction = PHYS.airFriction;

  get left(): number {
    return this.x - this.w / 2;
  }
  get right(): number {
    return this.x + this.w / 2;
  }
  get top(): number {
    return this.y + this.h / 2;
  }
  get bottom(): number {
    return this.y - this.h / 2;
  }

  reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.onGround = false;
    this.coyote = 0;
    this.squash = 1;
    this.stretch = 1;
    this.trail.length = 0;
    this.groundedPlatform = null;
    this.trailColor = '#7eb0b8';
  }

  update(dt: number, input: Input): boolean {
    let jumped = false;
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (dir !== 0) this.facing = dir;

    if (dir !== 0) {
      this.vx += dir * this.moveAccel * dt;
    } else {
      const fr = this.onGround ? this.friction : this.airFriction;
      if (Math.abs(this.vx) <= fr * dt) this.vx = 0;
      else this.vx -= Math.sign(this.vx) * fr * dt;
    }
    this.vx = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.vx));

    if (this.onGround) this.coyote = 0.11;
    else this.coyote = Math.max(0, this.coyote - dt);

    if (input.consumeJump() && (this.onGround || this.coyote > 0)) {
      const leaving = this.groundedPlatform;
      this.vy = this.jumpVel;
      this.onGround = false;
      this.coyote = 0;
      this.groundedPlatform = null;
      this.stretch = 1.32;
      this.squash = 0.78;
      jumped = true;
      if (leaving) leaving.setPressed(false);
    }

    if (!input.jumpHeld && this.vy > 90) {
      this.vy *= 0.9;
    }

    this.vy -= this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    const targetStretch = this.onGround
      ? 1
      : 1 + Math.min(0.22, Math.abs(this.vy) / 1100);
    const targetSquash = this.onGround ? 1 : 1 / targetStretch;
    this.stretch += (targetStretch - this.stretch) * Math.min(1, 14 * dt);
    this.squash += (targetSquash - this.squash) * Math.min(1, 14 * dt);

    this.trailTimer -= dt;
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].life -= dt;
      if (this.trail[i].life <= 0) this.trail.splice(i, 1);
    }
    if (!this.onGround && this.trailTimer <= 0) {
      this.trail.push({ x: this.x, y: this.y, life: 0.3, color: this.trailColor });
      this.trailTimer = 0.032;
    }

    return jumped;
  }

  landOn(platform: Platform, _sinkHint = 0): void {
    // Feet on current surface (top already accounts for press sink after update)
    this.y = platform.surfaceY + this.h / 2;
    this.vy = 0;
    this.onGround = true;
    this.groundedPlatform = platform;
    this.squash = 1.38;
    this.stretch = 0.72;
  }

  /** Keep feet glued to platform surface while standing. */
  stickToSurface(platform: Platform): void {
    this.y = platform.surfaceY + this.h / 2;
    this.vy = 0;
    this.onGround = true;
    this.groundedPlatform = platform;
  }

  applyLandSquash(intensity: number): void {
    this.squash = 1 + intensity * 0.48;
    this.stretch = 1 - intensity * 0.3;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    toScreen: (x: number, y: number) => { x: number; y: number },
  ): void {
    for (const t of this.trail) {
      const s = toScreen(t.x, t.y);
      ctx.globalAlpha = (t.life / 0.3) * 0.32;
      ctx.fillStyle = t.color;
      this.blob(ctx, s.x, s.y, this.w * 0.4, this.h * 0.4);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    const s = toScreen(this.x, this.y);
    const bw = this.w * this.squash;
    const bh = this.h * this.stretch;

    ctx.save();
    ctx.translate(s.x, s.y);

    ctx.fillStyle = 'rgba(80, 100, 110, 0.14)';
    ctx.beginPath();
    ctx.ellipse(0, bh * 0.5, bw * 0.48, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    const body = ctx.createRadialGradient(-bw * 0.15, -bh * 0.22, 2, 0, 0, bw * 0.72);
    body.addColorStop(0, '#9ec8d0');
    body.addColorStop(0.5, '#6aa0aa');
    body.addColorStop(1, '#4d7e88');
    ctx.fillStyle = body;
    this.blob(ctx, 0, 0, bw / 2, bh / 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(-bw * 0.18, -bh * 0.24, bw * 0.2, bh * 0.15, -0.4, 0, Math.PI * 2);
    ctx.fill();

    // Blush
    ctx.fillStyle = 'rgba(240, 150, 150, 0.35)';
    ctx.beginPath();
    ctx.ellipse(-8 * this.facing - 2, 4, 4.5, 2.8, 0, 0, Math.PI * 2);
    ctx.ellipse(8 * this.facing + 2, 4, 4.5, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = 'rgba(40, 55, 65, 0.45)';
    const eyeX = 3.5 * this.facing;
    ctx.beginPath();
    ctx.arc(eyeX - 5.5, -2.5, 2.4, 0, Math.PI * 2);
    ctx.arc(eyeX + 5.5, -2.5, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(eyeX - 4.5, -3.3, 0.9, 0, Math.PI * 2);
    ctx.arc(eyeX + 6.5, -3.3, 0.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private blob(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number): void {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  }
}
