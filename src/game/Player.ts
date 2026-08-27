import type { Input } from './Input';
import type { Platform } from './Platform';
import { PHYS } from './physics';
import { PLAYER_PASTEL } from '../theme/pastelPalette';
import { PIXEL, enablePixelMode, fillPx, px, snapPt } from '../theme/pixel';
import {
  drawPlayerPixelBody,
  drawPlayerPixelFace,
  drawPlayerPixelShadow,
} from './playerPixelArt';

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
  w = 36;
  h = 30;
  onGround = false;
  facing = 1;
  trailColor = PLAYER_PASTEL.trail;
  /** Jump multiplier from sticky gum / cheese boost */
  jumpBoost = 1;

  private coyote = 0;
  private squash = 1;
  private stretch = 1;
  private trail: TrailPoint[] = [];
  private trailTimer = 0;
  private blinkT = 0;
  private animT = 0;
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
    this.trailColor = PLAYER_PASTEL.trail;
    this.blinkT = 0;
    this.animT = 0;
    this.jumpBoost = 1;
  }

  update(dt: number, input: Input): boolean {
    let jumped = false;
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    if (dir !== 0) this.facing = dir;

    if (dir !== 0) {
      const sticky = this.groundedPlatform?.behavior === 'sticky';
      this.vx += dir * this.moveAccel * dt * (sticky ? 0.72 : 1);
    } else {
      const sticky = this.groundedPlatform?.behavior === 'sticky';
      const fr = this.onGround ? this.friction * (sticky ? 1.55 : 1) : this.airFriction;
      if (Math.abs(this.vx) <= fr * dt) this.vx = 0;
      else this.vx -= Math.sign(this.vx) * fr * dt;
    }
    this.vx = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.vx));

    if (this.onGround) this.coyote = 0.11;
    else this.coyote = Math.max(0, this.coyote - dt);

    if (input.consumeJump() && (this.onGround || this.coyote > 0)) {
      const leaving = this.groundedPlatform;
      const boost = this.jumpBoost;
      this.vy = this.jumpVel * boost;
      this.jumpBoost = 1;
      this.onGround = false;
      this.coyote = 0;
      this.groundedPlatform = null;
      this.stretch = 1.38 * Math.min(1.15, boost);
      this.squash = 0.72;
      jumped = true;
      if (leaving) leaving.setPressed(false);
    }

    if (!input.jumpHeld && this.vy > 90) {
      this.vy *= 0.9;
    }

    this.vy -= this.gravity * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Springy squash — fluid in state, snapped only at draw
    const targetStretch = this.onGround
      ? 1
      : 1 + Math.min(0.28, Math.abs(this.vy) / 1000);
    const targetSquash = this.onGround ? 1 : 1 / targetStretch;
    this.stretch += (targetStretch - this.stretch) * Math.min(1, 16 * dt);
    this.squash += (targetSquash - this.squash) * Math.min(1, 16 * dt);

    this.animT += dt;
    this.blinkT -= dt;
    if (this.blinkT < -2.2) this.blinkT = 0.12 + Math.random() * 0.08;

    this.trailTimer -= dt;
    for (let i = this.trail.length - 1; i >= 0; i--) {
      this.trail[i].life -= dt;
      if (this.trail[i].life <= 0) this.trail.splice(i, 1);
    }
    if (!this.onGround && this.trailTimer <= 0) {
      this.trail.push({ x: this.x, y: this.y, life: 0.28, color: this.trailColor });
      this.trailTimer = 0.028;
    }

    return jumped;
  }

  landOn(platform: Platform, _sinkHint = 0): void {
    this.y = platform.surfaceY + this.h / 2;
    this.vy = 0;
    this.onGround = true;
    this.groundedPlatform = platform;
    this.squash = 1.42;
    this.stretch = 0.68;
    const boost = platform.behaviorDef.jumpBoost;
    if (boost > 1) this.jumpBoost = Math.max(this.jumpBoost, boost);
  }

  stickToSurface(platform: Platform): void {
    this.y = platform.surfaceY + this.h / 2;
    this.vy = 0;
    this.onGround = true;
    this.groundedPlatform = platform;
  }

  grantVanishCoyote(): void {
    this.coyote = Math.max(this.coyote, 0.14);
    this.onGround = false;
    this.groundedPlatform = null;
  }

  applyLandSquash(intensity: number): void {
    this.squash = 1 + intensity * 0.52;
    this.stretch = 1 - intensity * 0.32;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    toScreen: (x: number, y: number) => { x: number; y: number },
  ): void {
    enablePixelMode(ctx);
    const u = PIXEL.unit;

    // Pixel trail
    for (const t of this.trail) {
      const raw = toScreen(t.x, t.y);
      const s = snapPt(raw.x, raw.y);
      ctx.globalAlpha = (t.life / 0.28) * 0.45;
      const sz = Math.max(u, px(this.w * 0.28 * (t.life / 0.28)));
      fillPx(ctx, s.x - sz / 2, s.y - sz / 2, sz, sz, t.color);
    }
    ctx.globalAlpha = 1;

    const raw = toScreen(this.x, this.y);
    const s = snapPt(raw.x, raw.y);
    // Quantize squash for chunky but still “fluid” stepped frames
    const sq = Math.round(this.squash * 8) / 8;
    const st = Math.round(this.stretch * 8) / 8;
    const bw = px(this.w * sq);
    const bh = px(this.h * st);

    ctx.save();
    ctx.translate(s.x, s.y);

    // Shadow
    drawPlayerPixelShadow(ctx, bw, bh);

    // Body — stepped oval (cute pixel slime)
    drawPlayerPixelBody(ctx, bw, bh, this.animT);

    drawPlayerPixelFace(ctx, bw, bh, {
      facing: this.facing,
      blinking: this.blinkT > 0,
      animT: this.animT,
      showSparkle: this.onGround,
    });

    ctx.restore();
  }
}
