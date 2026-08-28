import type { MaterialId } from '../../audio/materials';
import { MATERIALS } from '../../audio/materials';
import type { MaterialSprite } from '../../assets/platforms/SpriteAtlas';
import {
  SPRITE_FRAME,
  SPRITE_FRAME_H,
  SPRITE_FRAME_W,
  SPRITE_FRAMES,
} from '../../assets/platforms/spriteConfig';
import { PASTEL, rgba } from '../../theme/pastelPalette';
import type { PlatformBehavior } from './behaviors';
import type { PlatformDrawState } from './types';

export interface SpriteOverlay {
  crackLevel: number;
  meltProgress: number;
  flash: number;
  integrity: number;
  behavior: PlatformBehavior;
  /** Extra time-based juice (foam anticipate, jelly wobble phase) */
  pressTime?: number;
  phase?: string;
}

/** Isolated buffer so pastel wash never paints a box onto the world canvas */
let tintCanvas: HTMLCanvasElement | null = null;
let tintCtx: CanvasRenderingContext2D | null = null;

function ensureTintBuffer(w: number, h: number): CanvasRenderingContext2D {
  const cw = Math.max(1, Math.ceil(w));
  const ch = Math.max(1, Math.ceil(h));
  if (!tintCanvas) {
    tintCanvas = document.createElement('canvas');
    tintCtx = tintCanvas.getContext('2d');
  }
  if (!tintCtx) throw new Error('2d unavailable');
  if (tintCanvas.width < cw || tintCanvas.height < ch) {
    tintCanvas.width = cw;
    tintCanvas.height = ch;
  }
  return tintCtx;
}

/**
 * Behavior-aware frame pick — uses full 0..5 strip.
 * Each lifecycle reads differently so landings feel unique & addictive.
 */
export function pickSpriteFrame(
  pressAmount: number,
  pressVel: number,
  releaseTimer: number,
  meltProgress = 0,
  overlay?: SpriteOverlay,
): number {
  const behavior = overlay?.behavior ?? 'elastic';
  const integrity = overlay?.integrity ?? 1;
  const crack = overlay?.crackLevel ?? 0;
  const pressTime = overlay?.pressTime ?? 0;

  // --- Melt: idle → squash → puddle (squash4) as meltProgress rises ---
  if (behavior === 'melt') {
    if (meltProgress > 0.08) {
      const t = Math.min(1, meltProgress);
      if (t < 0.25) return SPRITE_FRAME.squash1;
      if (t < 0.45) return SPRITE_FRAME.squash2;
      if (t < 0.7) return SPRITE_FRAME.squash3;
      return SPRITE_FRAME.squash4;
    }
  }

  // --- Crumble: integrity drives flatten ---
  if (behavior === 'crumble' && integrity < 0.98) {
    const lost = 1 - integrity;
    if (lost < 0.2) return SPRITE_FRAME.squash1;
    if (lost < 0.45) return SPRITE_FRAME.squash2;
    if (lost < 0.7) return SPRITE_FRAME.squash3;
    return SPRITE_FRAME.squash4;
  }

  // --- Foam pop: anticipate squash4 before burst ---
  if (behavior === 'foamPop') {
    if (overlay?.phase === 'anticipate' || pressTime > 0.65) {
      return SPRITE_FRAME.squash4;
    }
  }

  // --- Shatter: micro dent + crack, almost never deep squash ---
  if (behavior === 'shatter') {
    if (crack > 0.55) return SPRITE_FRAME.squash2;
    if (crack > 0.15 || pressAmount > 0.2) return SPRITE_FRAME.squash1;
    if (releaseTimer > 0.04 || pressAmount < -0.04) return SPRITE_FRAME.rebound;
    return breatheIdle(behavior);
  }

  // --- Squeeze: progressive pulp crush across lands ---
  if (behavior === 'squeeze') {
    const pressed = Math.max(0, pressAmount);
    if (pressed > 0.15) {
      const t = Math.min(1, pressed);
      if (t < 0.35) return SPRITE_FRAME.squash1;
      if (t < 0.6) return SPRITE_FRAME.squash2;
      if (t < 0.85) return SPRITE_FRAME.squash3;
      return SPRITE_FRAME.squash4;
    }
  }

  // --- Elastic / default press: smooth ease across squash1–4 ---
  const pressed = Math.max(0, pressAmount, meltProgress * 0.9);
  if (pressed > 0.08) {
    const t = easeInOutCubic(Math.min(1, (pressed - 0.08) / 0.95));
    // Map 0..1 → squash1..squash4 (indices 1..4)
    const idx = SPRITE_FRAME.squash1 + Math.round(t * 3);
    return Math.min(SPRITE_FRAME.squash4, Math.max(SPRITE_FRAME.squash1, idx));
  }

  // Rebound overshoot — jelly/mochi love this frame
  if (releaseTimer > 0.03 || pressAmount < -0.03 || pressVel < -2.2) {
    return SPRITE_FRAME.rebound;
  }

  return breatheIdle(behavior);
}

function breatheIdle(behavior: PlatformBehavior): number {
  const now = performance.now();
  // Soft materials breathe more often / taller
  const speed =
    behavior === 'elastic' ? 0.0024 : behavior === 'foamPop' ? 0.0018 : 0.0014;
  const threshold = behavior === 'elastic' ? 0.88 : 0.95;
  const breathe = Math.sin(now * speed) * 0.5 + 0.5;
  return breathe > threshold ? SPRITE_FRAME.rebound : SPRITE_FRAME.idle;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function drawPlatformSprite(
  ctx: CanvasRenderingContext2D,
  sheet: MaterialSprite,
  material: MaterialId,
  state: PlatformDrawState,
  pressAmount: number,
  pressVel: number,
  releaseTimer: number,
  visualDepthMul: number,
  visualSpreadMul: number,
  overlay?: SpriteOverlay,
): void {
  const melt = overlay?.meltProgress ?? 0;
  const frame = pickSpriteFrame(pressAmount, pressVel, releaseTimer, melt, overlay);
  const img = sheet.image;
  const mat = MATERIALS[material];
  const behavior = overlay?.behavior ?? 'elastic';

  const pressed = Math.max(0, pressAmount);
  const heightMul = 1 - pressed * 0.09 - melt * 0.35 - (behavior === 'crumble' ? (1 - (overlay?.integrity ?? 1)) * 0.25 : 0);
  const spreadExtra =
    melt * 0.25 +
    (behavior === 'foamPop' && pressed > 0.3 ? pressed * 0.17 : 0) +
    (behavior === 'crumble' ? (1 - (overlay?.integrity ?? 1)) * 0.18 : 0);
  const spread = state.w * visualSpreadMul * (1 + pressed * 0.05 + spreadExtra);
  const depth = state.h * visualDepthMul * 2.2 * Math.max(0.35, heightMul);
  const drawW = spread * 1.08;
  const drawH = (depth + state.h * 0.5) * Math.max(0.35, heightMul);

  const anchorX = state.cx;
  const anchorY = state.surfaceY;

  const topPad = 0.16;
  const dx = anchorX - drawW / 2;
  const dy = anchorY - drawH * topPad;

  ctx.save();
  ctx.globalAlpha = state.opacity;

  const shadowY = dy + drawH - 2;
  const shadowBoost = 1 + pressed * 0.35 + melt * 0.5;
  const contactShadow = ctx.createRadialGradient(
    anchorX,
    shadowY,
    0,
    anchorX,
    shadowY,
    drawW * 0.42 * shadowBoost,
  );
  contactShadow.addColorStop(0, rgba(PASTEL.inkSoft, 0.1 + pressed * 0.06));
  contactShadow.addColorStop(1, rgba(PASTEL.inkSoft, 0));
  ctx.fillStyle = contactShadow;
  ctx.beginPath();
  ctx.ellipse(anchorX, shadowY, drawW * 0.38 * shadowBoost, 7 + pressed * 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(anchorX, anchorY);
  ctx.scale(state.squashX, state.squashY);
  ctx.translate(-anchorX, -anchorY);

  const tctx = ensureTintBuffer(drawW, drawH);
  tctx.setTransform(1, 0, 0, 1, 0, 0);
  tctx.clearRect(0, 0, Math.ceil(drawW), Math.ceil(drawH));
  tctx.globalCompositeOperation = 'source-over';
  tctx.globalAlpha = 1;
  tctx.drawImage(
    img,
    Math.min(frame, SPRITE_FRAMES - 1) * SPRITE_FRAME_W,
    0,
    SPRITE_FRAME_W,
    SPRITE_FRAME_H,
    0,
    0,
    drawW,
    drawH,
  );

  tctx.globalCompositeOperation = 'source-atop';
  tctx.globalAlpha = 0.36;
  tctx.fillStyle = mat.spriteWash;
  tctx.fillRect(0, 0, drawW, drawH);
  tctx.globalAlpha = 0.12;
  tctx.fillStyle = rgba(PASTEL.cream, 0.9);
  tctx.fillRect(0, 0, drawW, drawH);

  // Behavior-specific color washes (pastel only)
  if (melt > 0.05) {
    tctx.globalAlpha = melt * 0.5;
    const g = tctx.createLinearGradient(0, 0, 0, drawH);
    if (material === 'honeycomb') {
      g.addColorStop(0, rgba(PASTEL.honey, 0.7));
      g.addColorStop(0.55, rgba(PASTEL.butter, 0.25));
      g.addColorStop(1, rgba(PASTEL.caramel, 0.15));
    } else if (material === 'chocolate') {
      g.addColorStop(0, rgba(PASTEL.caramel, 0.7));
      g.addColorStop(0.5, rgba(PASTEL.peach, 0.22));
      g.addColorStop(1, rgba(PASTEL.caramelDeep, 0.18));
    } else {
      g.addColorStop(0, rgba(PASTEL.butter, 0.65));
      g.addColorStop(0.5, rgba(PASTEL.peach, 0.2));
      g.addColorStop(1, rgba(PASTEL.caramel, 0.12));
    }
    tctx.fillStyle = g;
    tctx.fillRect(0, 0, drawW, drawH);
  }

  if (behavior === 'crumble' && (overlay?.integrity ?? 1) < 0.95) {
    tctx.globalAlpha = (1 - overlay!.integrity) * 0.32;
    tctx.fillStyle = rgba(PASTEL.sand, 0.55);
    tctx.fillRect(0, 0, drawW, drawH);
  }

  if (behavior === 'foamPop' && pressed > 0.35) {
    tctx.globalAlpha = Math.min(0.28, pressed * 0.22);
    tctx.fillStyle = rgba(PASTEL.blush, 0.5);
    tctx.fillRect(0, 0, drawW, drawH);
  }

  if (behavior === 'squeeze' && pressed > 0.2) {
    tctx.globalAlpha = Math.min(0.3, pressed * 0.25);
    tctx.fillStyle = rgba(PASTEL.citrus, 0.55);
    tctx.fillRect(0, 0, drawW, drawH);
  }

  if ((overlay?.flash ?? 0) > 0.05) {
    tctx.globalAlpha = overlay!.flash * 0.65;
    tctx.fillStyle = PASTEL.white;
    tctx.fillRect(0, 0, drawW, drawH);
  }

  tctx.globalCompositeOperation = 'source-over';
  tctx.globalAlpha = 1;

  ctx.drawImage(tintCanvas!, 0, 0, drawW, drawH, dx, dy, drawW, drawH);

  const crack = overlay?.crackLevel ?? 0;
  if (crack > 0.05) {
    ctx.globalAlpha = state.opacity * Math.min(1, crack * 1.2);
    ctx.strokeStyle = rgba(PASTEL.white, material === 'iceSoap' ? 0.95 : 0.8);
    ctx.lineWidth = material === 'iceSoap' ? 1.6 : 1.3;
    ctx.beginPath();
    ctx.moveTo(anchorX - drawW * 0.28, anchorY + drawH * 0.15);
    ctx.lineTo(anchorX - drawW * 0.02, anchorY + drawH * 0.45);
    ctx.lineTo(anchorX + drawW * 0.22, anchorY + drawH * 0.22);
    ctx.moveTo(anchorX + drawW * 0.05, anchorY + drawH * 0.12);
    ctx.lineTo(anchorX + drawW * 0.18, anchorY + drawH * 0.5);
    if (crack > 0.55) {
      ctx.moveTo(anchorX - drawW * 0.15, anchorY + drawH * 0.35);
      ctx.lineTo(anchorX - drawW * 0.32, anchorY + drawH * 0.55);
      if (material === 'iceSoap') {
        ctx.moveTo(anchorX + drawW * 0.1, anchorY + drawH * 0.28);
        ctx.lineTo(anchorX + drawW * 0.3, anchorY + drawH * 0.48);
      }
    }
    ctx.stroke();
  }

  // Wet highlight bloom on soft press (ASMR sheen)
  if (sheet.source === 'ai' && pressed > 0.2 && melt < 0.35 && behavior !== 'shatter') {
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = state.opacity * Math.min(0.36, pressed * 0.28);
    ctx.fillStyle = rgba(PASTEL.butter, behavior === 'elastic' ? 0.65 : 0.45);
    ctx.beginPath();
    ctx.ellipse(anchorX, anchorY + drawH * 0.08, drawW * 0.25, drawH * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Jelly / slime secondary wobble sheen
  if (behavior === 'elastic' && Math.abs(pressAmount) < 0.15) {
    const pulse = Math.sin(performance.now() * 0.003 + state.seed) * 0.5 + 0.5;
    if (pulse > 0.7) {
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = state.opacity * 0.08 * pulse;
      ctx.fillStyle = rgba(PASTEL.mint, 0.8);
      ctx.beginPath();
      ctx.ellipse(anchorX, anchorY + drawH * 0.12, drawW * 0.18, drawH * 0.04, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}
