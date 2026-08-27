import { spriteAtlas } from '../assets/platforms/SpriteAtlas';
import { MATERIALS, type MaterialId } from '../audio/materials';
import { REACH } from './physics';
import { renderPlatform } from './platform/MaterialRenderer';
import { pickVariant } from './platform/PlatformVariant';
import { drawPlatformSprite } from './platform/SpriteRenderer';
import type { PlatformDrawState, PlatformVariant, VariantDef } from './platform/types';

const SINK_MAX = 5.2;
const PRESS_MIN = 0.28;

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

  /** 1 while player grounded on this platform, else 0 */
  pressTarget = 0;
  /** Spring value toward pressTarget * pressHold (can overshoot) */
  pressAmount = 0;
  pressVel = 0;
  /** Held squash intensity while pressed (from land impact) */
  pressHold = PRESS_MIN;
  /** Seconds remaining showing rebound sprite after release */
  releaseTimer = 0;

  /** Visual squash derived from press (legacy impulse still blends in) */
  squash = 0;
  squashVel = 0;
  sink = 0;
  alive = true;
  opacity = 1;
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

  /** Landing surface Y in world space (top minus visual sink). */
  get surfaceY(): number {
    return this.top - this.sink;
  }

  get isPressed(): boolean {
    return this.pressTarget > 0.5;
  }

  /**
   * Keep pressed while the player stands on this platform.
   * impact: 0–1+ used only when transitioning into pressed.
   */
  setPressed(pressed: boolean, impact = 0.6): void {
    const mat = MATERIALS[this.material];
    if (pressed) {
      const soft = 0.65 + 0.35 * Math.min(1.6, mat.squash) / 1.55;
      const hold = Math.min(0.72, Math.max(PRESS_MIN, 0.26 + impact * 0.38) * soft);

      if (this.pressTarget < 0.5) {
        // Fresh land: overshoot then settle to hold
        this.pressHold = hold;
        this.pressAmount = Math.max(this.pressAmount, 0.32 + impact * 0.35);
        this.pressVel += (1.8 + impact * 2.4) * mat.squash;
        this.landedOnce = true;
        if (this.fading) {
          this.fadeArmed = true;
          this.fadeLife = Math.min(this.fadeLife, 1.8);
        }
      } else {
        // Already pressed — gently raise hold if harder impact
        this.pressHold = Math.max(this.pressHold, hold * 0.85);
      }
      this.pressTarget = 1;
      this.releaseTimer = 0;
    } else if (this.pressTarget > 0.5) {
      this.pressTarget = 0;
      // Rebound kick: spring shoots past idle then settles
      this.pressVel -= (5.5 + this.pressHold * 3) * mat.squash;
      this.releaseTimer = 0.26;
    }
  }

  /** Impulse-only land (particles/audio still called from Game). */
  land(intensity: number): void {
    this.setPressed(true, intensity);
  }

  setPreviewSquash(v: number): void {
    this.pressAmount = v;
    this.pressTarget = 0;
    this.pressVel = 0;
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

    if (this.releaseTimer > 0) this.releaseTimer = Math.max(0, this.releaseTimer - dt);

    const mat = MATERIALS[this.material];
    const target = this.pressTarget * this.pressHold;
    // ~200–300ms settle: stiffer when releasing for snappy rebound
    const k = this.pressTarget > 0.5 ? 155 : 175;
    const d = this.pressTarget > 0.5 ? 14 : 11;
    const force = (target - this.pressAmount) * k - this.pressVel * d;
    this.pressVel += force * dt;
    this.pressAmount += this.pressVel * dt;

    // Soft clamp extremes (allow slight overshoot for feel)
    if (this.pressAmount > 1.45) {
      this.pressAmount = 1.45;
      this.pressVel *= 0.4;
    }
    if (this.pressAmount < -0.35) {
      this.pressAmount = -0.35;
      this.pressVel *= 0.45;
    }

    // Visual squash: pressed positive, rebound can go slightly negative (= stretch)
    const visual = Math.max(0, this.pressAmount);
    this.squash = visual;
    this.sink = Math.max(0, this.pressAmount) * SINK_MAX * (0.75 + 0.35 * Math.min(1.5, mat.squash));

    // Tiny idle wobble when fully released
    if (this.pressTarget < 0.5 && Math.abs(this.pressAmount) < 0.04 && Math.abs(this.pressVel) < 0.3) {
      this.pressAmount = 0;
      this.pressVel = 0;
      this.sink = 0;
      this.squash = 0;
    }
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
        ? Math.sin(this.wobble) * 0.04 * (1 - Math.min(1, Math.abs(this.pressAmount)))
        : 0;

    const pressed = Math.max(0, this.pressAmount);
    const stretch = Math.max(0, -this.pressAmount);
    const squashX = 1 + pressed * 0.12 + softWobble - stretch * 0.06;
    const squashY = 1 - pressed * 0.22 - softWobble * 0.5 + stretch * 0.14;
    const cy = this.y - this.sink;

    const hitHw = (this.w / 2) * Math.max(0.85, squashX);
    const hitHh = (this.h / 2) * Math.max(0.55, squashY);
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
        this.pressAmount,
        this.pressVel,
        this.releaseTimer,
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
