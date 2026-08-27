import { spriteAtlas } from '../assets/platforms/SpriteAtlas';
import { MATERIALS, type MaterialId } from '../audio/materials';
import { REACH } from './physics';
import { renderPlatform } from './platform/MaterialRenderer';
import { pickVariant } from './platform/PlatformVariant';
import { drawPlatformSprite } from './platform/SpriteRenderer';
import type { PlatformDrawState, PlatformVariant, VariantDef } from './platform/types';

export class Platform {
  x: number;
  y: number;
  w: number;
  /** Collision AABB height — visual extends beyond this */
  h: number;
  material: MaterialId;
  variant: PlatformVariant;
  variantDef: VariantDef;
  moving: boolean;
  moveAmp: number;
  moveSpeed: number;
  movePhase: number;
  fading: boolean;
  fadeArmed = false;
  fadeLife: number;
  baseX: number;
  landedOnce = false;
  readonly seed: number;

  squash = 0;
  squashVel = 0;
  sink = 0;
  alive = true;
  opacity = 1;
  /** 1 → 0 after landing; drives sprite squash frames */
  landAnim = 0;
  private wobble = Math.random() * Math.PI * 2;

  constructor(opts: {
    x: number;
    y: number;
    w: number;
    material: MaterialId;
    moving?: boolean;
    fading?: boolean;
    moveAmp?: number;
    seed?: number;
  }) {
    this.x = opts.x;
    this.y = opts.y;
    this.w = opts.w;
    this.h = 16;
    this.material = opts.material;
    this.seed = opts.seed ?? Math.random() * 10000;
    this.variantDef = pickVariant(this.material, makeRand(this.seed));
    this.variant = this.variantDef.id;
    this.moving = opts.moving ?? false;
    this.fading = opts.fading ?? false;
    this.fadeLife = REACH.fadeVisibleMin + 0.8;
    this.baseX = opts.x;
    this.moveAmp = opts.moveAmp ?? 12;
    this.moveSpeed = 0.4 + Math.random() * 0.25;
    this.movePhase = Math.random() * Math.PI * 2;
  }

  /** Collision AABB — unchanged regardless of visual overflow */
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

  update(dt: number, time: number): void {
    this.wobble += dt * 2.2;
    if (this.moving) {
      this.x = this.baseX + Math.sin(time * this.moveSpeed + this.movePhase) * this.moveAmp;
    }

    if (this.fading && (this.landedOnce || this.fadeArmed)) {
      this.fadeLife -= dt;
      if (this.fadeLife < 1.1) this.opacity = Math.max(0, this.fadeLife / 1.1);
      if (this.fadeLife <= 0) this.alive = false;
    }

    const k = 95;
    const d = 8.5;
    const force = -this.squash * k - this.squashVel * d;
    this.squashVel += force * dt;
    this.squash += this.squashVel * dt;
    this.sink = Math.max(0, this.squash) * 6.5;
    if (this.landAnim > 0) this.landAnim = Math.max(0, this.landAnim - dt * 3.8);
  }

  land(intensity: number): void {
    const mat = MATERIALS[this.material];
    this.squashVel = intensity * 2.8 * mat.squash;
    this.squash = Math.max(this.squash, intensity * 0.45 * mat.squash);
    this.landAnim = 1;
    this.landedOnce = true;
    if (this.fading) {
      this.fadeArmed = true;
      this.fadeLife = Math.min(this.fadeLife, 1.8);
    }
  }

  setPreviewSquash(v: number): void {
    this.squash = v;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    toScreen: (x: number, y: number) => { x: number; y: number },
    time = 0,
  ): void {
    const mat = MATERIALS[this.material];
    const softWobble =
      this.material === 'jelly' ||
      this.material === 'clearSlime' ||
      this.material === 'mochi' ||
      this.material === 'butterSlime'
        ? Math.sin(this.wobble) * 0.04
        : 0;

    const squashX = 1 + this.squash * 0.16 + softWobble;
    const squashY = 1 - this.squash * 0.34 - softWobble * 0.5;
    const cy = this.y - this.sink;

    // Hitbox → screen AABB
    const hitHw = (this.w / 2) * squashX;
    const hitHh = (this.h / 2) * squashY;
    const center = toScreen(this.x, cy);
    const leftPt = toScreen(this.x - hitHw, cy);
    const topPt = toScreen(this.x, cy + hitHh);
    const screenW = (center.x - leftPt.x) * 2;
    const screenH = Math.max(6, (center.y - topPt.y) * 2);
    const surfaceY = center.y - screenH / 2;

    const state: PlatformDrawState = {
      x: center.x - screenW / 2,
      y: surfaceY,
      w: screenW,
      h: screenH,
      cx: center.x,
      surfaceY,
      time,
      wobble: this.wobble,
      seed: this.seed,
      opacity: this.opacity,
      squashX,
      squashY,
    };

    const sheet = spriteAtlas.get(this.material);
    if (sheet?.ready) {
      drawPlatformSprite(
        ctx,
        sheet,
        this.material,
        state,
        this.squash,
        this.landAnim,
        this.variantDef.visualDepth,
        this.variantDef.visualSpread,
      );
    } else {
      renderPlatform(ctx, this.variant, mat, state);
    }
  }
}

function makeRand(seed: number): () => number {
  let s = (seed * 2654435761) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
