import { spriteAtlas } from '../assets/platforms/SpriteAtlas';
import { MATERIALS, type MaterialId } from '../audio/materials';
import { REACH } from './physics';
import {
  getBehaviorDef,
  type BehaviorDef,
  type BehaviorPhase,
  type PlatformBehavior,
} from './platform/behaviors';
import { renderPlatform } from './platform/MaterialRenderer';
import { pickVariant } from './platform/PlatformVariant';
import { drawPlatformSprite } from './platform/SpriteRenderer';
import type { PlatformDrawState, PlatformVariant, VariantDef } from './platform/types';

const SINK_MAX = 5.2;
const PRESS_MIN = 0.28;

/** Events emitted once for Game to juice (particles/audio/floaters). */
export type PlatformEvent =
  | { type: 'meltDrip' }
  | { type: 'meltGone'; floater: string }
  | { type: 'crack' }
  | { type: 'shatter'; floater: string; color: string }
  | { type: 'crumbleSand' }
  | { type: 'crumbleGone'; floater: string }
  | { type: 'foamPop'; floater: string }
  | { type: 'squeeze'; floater?: string; gone: boolean }
  | { type: 'vanishUnderPlayer' };

export class Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  material: MaterialId;
  variant: PlatformVariant;
  variantDef: VariantDef;
  behavior: PlatformBehavior;
  behaviorDef: BehaviorDef;
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

  pressTarget = 0;
  pressAmount = 0;
  pressVel = 0;
  pressHold = PRESS_MIN;
  releaseTimer = 0;

  /** 1 = intact, 0 = destroyed */
  integrity = 1;
  phase: BehaviorPhase = 'idle';
  landCount = 0;
  pressTime = 0;
  crackLevel = 0;
  meltProgress = 0;
  flash = 0;
  /** Extra visual flatten for melt/foam */
  deformX = 1;
  deformY = 1;

  squash = 0;
  sink = 0;
  alive = true;
  /** Collision active (false during payoff shards) */
  solid = true;
  opacity = 1;
  private wobble = Math.random() * Math.PI * 2;
  private events: PlatformEvent[] = [];
  private sandEmit = 0;
  private dripEmit = 0;

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
    this.behaviorDef = getBehaviorDef(this.material);
    this.behavior = this.behaviorDef.behavior;
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
  get surfaceY(): number {
    return this.top - this.sink;
  }
  get isPressed(): boolean {
    return this.pressTarget > 0.5;
  }
  get isMortal(): boolean {
    return this.behaviorDef.mortal;
  }

  consumeEvents(): PlatformEvent[] {
    if (this.events.length === 0) return [];
    const e = this.events.splice(0, this.events.length);
    return e;
  }

  private emit(e: PlatformEvent): void {
    this.events.push(e);
  }

  setPressed(pressed: boolean, impact = 0.6): void {
    if (!this.solid || !this.alive) return;
    const mat = MATERIALS[this.material];
    if (pressed) {
      const soft = 0.65 + (0.35 * Math.min(1.6, mat.squash)) / 1.55;
      const hold = Math.min(0.72, Math.max(PRESS_MIN, 0.26 + impact * 0.38) * soft);
      const fresh = this.pressTarget < 0.5;

      if (fresh) {
        this.pressHold = hold;
        this.pressAmount = Math.max(this.pressAmount, 0.32 + impact * 0.35);
        this.pressVel += (1.8 + impact * 2.4) * mat.squash;
        this.landedOnce = true;
        this.landCount += 1;
        this.onLandBehavior(impact);
        if (this.fading) {
          this.fadeArmed = true;
          this.fadeLife = Math.min(this.fadeLife, 1.8);
        }
      } else {
        this.pressHold = Math.max(this.pressHold, hold * 0.85);
      }
      this.pressTarget = 1;
      this.releaseTimer = 0;
      if (this.phase === 'idle') this.phase = 'pressed';
    } else if (this.pressTarget > 0.5) {
      this.pressTarget = 0;
      this.pressVel -= (5.5 + this.pressHold * 3) * mat.squash;
      this.releaseTimer = 0.26;
      if (this.phase === 'pressed' && this.integrity >= 1) this.phase = 'idle';
    }
  }

  land(intensity: number): void {
    this.setPressed(true, intensity);
  }

  private onLandBehavior(impact: number): void {
    const def = this.behaviorDef;
    if (this.behavior === 'shatter' || (this.behavior === 'melt' && this.material === 'chocolate')) {
      if (impact >= def.shatterImpact) {
        this.triggerShatter();
        return;
      }
      if (this.behavior === 'shatter') {
        this.crackLevel = Math.min(1, this.landCount / Math.max(1, def.maxLands));
        this.emit({ type: 'crack' });
        if (this.landCount >= def.maxLands) {
          this.phase = 'anticipate';
          // shatter next frame of press or immediately
          this.triggerShatter();
        }
      }
    }
    if (this.behavior === 'squeeze') {
      this.emit({
        type: 'squeeze',
        gone: this.landCount >= def.maxLands,
        floater: this.landCount >= def.maxLands ? def.floater : undefined,
      });
      if (this.landCount >= def.maxLands) {
        this.integrity = 0.3;
        this.phase = 'anticipate';
        this.startVanish(0.35);
      }
    }
  }

  private triggerShatter(): void {
    if (this.phase === 'payoff' || this.phase === 'gone') return;
    this.phase = 'payoff';
    this.solid = false;
    this.flash = 1;
    this.integrity = 0;
    this.emit({
      type: 'shatter',
      floater: this.behaviorDef.floater,
      color: MATERIALS[this.material].particle,
    });
    this.emit({ type: 'vanishUnderPlayer' });
    this.startVanish(0.05);
  }

  private startVanish(delay: number): void {
    this.fadeArmed = true;
    this.fadeLife = Math.max(0.05, delay);
    this.fading = true;
  }

  setPreviewSquash(v: number): void {
    this.pressAmount = v;
    this.pressTarget = 0;
    this.pressVel = 0;
  }

  update(dt: number, time: number): void {
    this.wobble += dt * 2.2;
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 8);

    if (this.moving && this.solid) {
      this.x = this.baseX + Math.sin(time * this.moveSpeed + this.movePhase) * this.moveAmp;
    }

    if (this.releaseTimer > 0) this.releaseTimer = Math.max(0, this.releaseTimer - dt);

    // Press spring
    const mat = MATERIALS[this.material];
    const target = this.pressTarget * this.pressHold;
    const k = this.pressTarget > 0.5 ? 155 : 175;
    const d = this.pressTarget > 0.5 ? 14 : 11;
    const force = (target - this.pressAmount) * k - this.pressVel * d;
    this.pressVel += force * dt;
    this.pressAmount += this.pressVel * dt;
    if (this.pressAmount > 1.45) {
      this.pressAmount = 1.45;
      this.pressVel *= 0.4;
    }
    if (this.pressAmount < -0.35) {
      this.pressAmount = -0.35;
      this.pressVel *= 0.45;
    }

    // Behavior while pressed
    if (this.pressTarget > 0.5 && this.solid) {
      this.pressTime += dt;
      this.updateBehaviorWhilePressed(dt);
    } else if (this.pressTarget < 0.5) {
      // partial reset press time for foam if released early — keep progress for melt? melt pauses when not pressed
    }

    // Fade / vanish
    if (this.fading && (this.landedOnce || this.fadeArmed || this.phase === 'payoff')) {
      this.fadeLife -= dt;
      if (this.fadeLife < 0.5) this.opacity = Math.max(0, this.fadeLife / 0.5);
      if (this.fadeLife <= 0) {
        this.alive = false;
        this.solid = false;
        this.phase = 'gone';
      }
    }

    const visual = Math.max(0, this.pressAmount);
    const meltFlat = this.meltProgress;
    this.squash = Math.max(visual, meltFlat * 0.85);
    const sinkBase =
      Math.max(0, this.pressAmount) * SINK_MAX * (0.75 + 0.35 * Math.min(1.5, mat.squash));
    const meltSink = meltFlat * 10;
    const crumbleSink = this.behavior === 'crumble' ? (1 - this.integrity) * 12 : 0;
    this.sink = sinkBase + meltSink + crumbleSink;

    this.deformX = 1 + meltFlat * 0.35 + (this.behavior === 'foamPop' ? visual * 0.15 : 0);
    this.deformY = 1 - meltFlat * 0.55 - (this.behavior === 'foamPop' ? visual * 0.2 : 0);

    if (
      this.pressTarget < 0.5 &&
      Math.abs(this.pressAmount) < 0.04 &&
      Math.abs(this.pressVel) < 0.3 &&
      meltFlat < 0.05
    ) {
      this.pressAmount = 0;
      this.pressVel = 0;
    }
  }

  private updateBehaviorWhilePressed(dt: number): void {
    const def = this.behaviorDef;
    switch (this.behavior) {
      case 'melt': {
        this.phase = this.meltProgress < 0.15 ? 'anticipate' : 'active';
        this.meltProgress = Math.min(1, this.meltProgress + dt / def.lifetime);
        this.integrity = 1 - this.meltProgress;
        this.dripEmit -= dt;
        if (this.dripEmit <= 0) {
          this.dripEmit = 0.08;
          this.emit({ type: 'meltDrip' });
        }
        if (this.meltProgress >= 1) {
          this.phase = 'payoff';
          this.solid = false;
          this.emit({ type: 'meltGone', floater: def.floater });
          this.emit({ type: 'vanishUnderPlayer' });
          this.startVanish(0.25);
        }
        break;
      }
      case 'crumble': {
        this.phase = 'active';
        this.integrity = Math.max(0, this.integrity - dt / def.lifetime);
        this.sandEmit -= dt;
        if (this.sandEmit <= 0) {
          this.sandEmit = 0.06;
          this.emit({ type: 'crumbleSand' });
        }
        if (this.integrity <= 0) {
          this.phase = 'payoff';
          this.solid = false;
          this.emit({ type: 'crumbleGone', floater: def.floater });
          this.emit({ type: 'vanishUnderPlayer' });
          this.startVanish(0.2);
        }
        break;
      }
      case 'foamPop': {
        this.phase = this.pressTime > def.lifetime * 0.7 ? 'anticipate' : 'pressed';
        // Extra squash while waiting to pop
        this.pressHold = Math.min(0.95, PRESS_MIN + 0.35 + this.pressTime * 0.4);
        if (this.pressTime >= def.lifetime) {
          this.phase = 'payoff';
          this.solid = false;
          this.flash = 0.6;
          this.emit({ type: 'foamPop', floater: def.floater });
          this.emit({ type: 'vanishUnderPlayer' });
          this.startVanish(0.12);
        }
        break;
      }
      case 'shatter': {
        // crack grows slightly while standing
        if (this.crackLevel > 0 && this.crackLevel < 1) {
          this.crackLevel = Math.min(1, this.crackLevel + dt * 0.15);
        }
        break;
      }
      default:
        break;
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    toScreen: (x: number, y: number) => { x: number; y: number },
    time = 0,
  ): void {
    if (!this.alive && this.opacity <= 0) return;
    const mat = MATERIALS[this.material];
    // Per-behavior live deform — each material "feels" different underfoot
    const idleAmt = 1 - Math.min(1, Math.abs(this.pressAmount));
    let softWobble = 0;
    if (this.behavior === 'elastic') {
      const amp =
        this.material === 'mochi' ? 0.055 : this.material === 'butterSlime' ? 0.048 : 0.04;
      softWobble = Math.sin(this.wobble) * amp * idleAmt;
    } else if (this.behavior === 'foamPop') {
      softWobble = Math.sin(this.wobble * 1.4) * 0.025 * idleAmt;
    }

    const pressed = Math.max(0, this.pressAmount);
    const stretch = Math.max(0, -this.pressAmount);
    const pressMulX =
      this.behavior === 'melt'
        ? 0.18
        : this.behavior === 'shatter'
          ? 0.05
          : this.behavior === 'squeeze'
            ? 0.14
            : 0.12;
    const pressMulY =
      this.behavior === 'melt'
        ? 0.32
        : this.behavior === 'shatter'
          ? 0.1
          : this.behavior === 'foamPop'
            ? 0.28
            : 0.22;
    const squashX =
      (1 + pressed * pressMulX + softWobble - stretch * 0.06) * this.deformX;
    const squashY =
      (1 - pressed * pressMulY - softWobble * 0.5 + stretch * 0.14) *
      Math.max(0.2, this.deformY);
    const cy = this.y - this.sink;

    const hitHw = (this.w / 2) * Math.max(0.85, squashX);
    const hitHh = (this.h / 2) * Math.max(0.4, squashY);
    const center = toScreen(this.x, cy);
    const leftPt = toScreen(this.x - hitHw, cy);
    const topPt = toScreen(this.x, cy + hitHh);
    const screenW = (center.x - leftPt.x) * 2;
    const screenH = Math.max(4, (center.y - topPt.y) * 2);
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
        {
          crackLevel: this.crackLevel,
          meltProgress: this.meltProgress,
          flash: this.flash,
          integrity: this.integrity,
          behavior: this.behavior,
          pressTime: this.pressTime,
          phase: this.phase,
        },
      );
    } else {
      renderPlatform(ctx, this.variant, mat, state);
      this.drawOverlaysFallback(ctx, state);
    }
  }

  private drawOverlaysFallback(ctx: CanvasRenderingContext2D, s: PlatformDrawState): void {
    if (this.crackLevel > 0.05) {
      ctx.save();
      ctx.globalAlpha = s.opacity * this.crackLevel;
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(s.cx - s.w * 0.3, s.surfaceY + s.h * 0.2);
      ctx.lineTo(s.cx, s.surfaceY + s.h * 0.55);
      ctx.lineTo(s.cx + s.w * 0.25, s.surfaceY + s.h * 0.3);
      ctx.stroke();
      ctx.restore();
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
