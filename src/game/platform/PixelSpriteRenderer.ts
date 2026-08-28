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
import { enablePixelMode, PIXEL, px } from '../../theme/pixel';
import type { PlatformBehavior } from './behaviors';
import type { PlatformDrawState } from './types';

export interface PixelSpriteOverlay {
  crackLevel: number;
  meltProgress: number;
  flash: number;
  integrity: number;
  behavior: PlatformBehavior;
  pressTime?: number;
  phase?: string;
}

/**
 * Smooth 0..1 → frame with continuous visual scale between frames.
 * Physics stays floaty; pixels stay crisp (nearest-neighbor).
 */
export function pickPixelFrame(
  pressAmount: number,
  pressVel: number,
  releaseTimer: number,
  meltProgress = 0,
  overlay?: PixelSpriteOverlay,
): number {
  const behavior = overlay?.behavior ?? 'elastic';
  const integrity = overlay?.integrity ?? 1;
  const crack = overlay?.crackLevel ?? 0;
  const pressTime = overlay?.pressTime ?? 0;

  if (behavior === 'melt' && meltProgress > 0.04) {
    const t = Math.min(1, meltProgress);
    return SPRITE_FRAME.squash1 + Math.min(3, Math.floor(t * 4));
  }
  if (behavior === 'crumble' && integrity < 0.98) {
    const lost = 1 - integrity;
    return SPRITE_FRAME.squash1 + Math.min(3, Math.floor(lost * 4));
  }
  if (behavior === 'foamPop' && (overlay?.phase === 'anticipate' || pressTime > 0.55)) {
    return SPRITE_FRAME.squash4;
  }
  if (behavior === 'shatter') {
    if (crack > 0.5) return SPRITE_FRAME.squash2;
    if (crack > 0.12 || pressAmount > 0.18) return SPRITE_FRAME.squash1;
    if (releaseTimer > 0.03 || pressAmount < -0.03) return SPRITE_FRAME.rebound;
    return breathe(behavior);
  }

  const pressed = Math.max(0, pressAmount);
  if (pressed > 0.05) {
    // Ease for buttery transitions across squash1..4
    const t = easeOutCubic(Math.min(1, (pressed - 0.05) / 0.95));
    return SPRITE_FRAME.squash1 + Math.round(t * 3);
  }
  if (releaseTimer > 0.02 || pressAmount < -0.025 || pressVel < -1.8) {
    return SPRITE_FRAME.rebound;
  }
  return breathe(behavior);
}

function breathe(behavior: PlatformBehavior): number {
  const speed = behavior === 'elastic' ? 0.0028 : 0.0016;
  const thr = behavior === 'elastic' ? 0.86 : 0.94;
  const b = Math.sin(performance.now() * speed) * 0.5 + 0.5;
  return b > thr ? SPRITE_FRAME.rebound : SPRITE_FRAME.idle;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Draw pixel-art sheet with continuous squash (fluid) + nearest blit (crisp).
 */
export function drawPixelPlatformSprite(
  ctx: CanvasRenderingContext2D,
  sheet: MaterialSprite,
  material: MaterialId,
  state: PlatformDrawState,
  pressAmount: number,
  pressVel: number,
  releaseTimer: number,
  visualDepthMul: number,
  visualSpreadMul: number,
  overlay?: PixelSpriteOverlay,
): void {
  enablePixelMode(ctx);
  const melt = overlay?.meltProgress ?? 0;
  const behavior = overlay?.behavior ?? 'elastic';
  const frame = pickPixelFrame(pressAmount, pressVel, releaseTimer, melt, overlay);
  const mat = MATERIALS[material];
  const img = sheet.image;

  const pressed = Math.max(0, pressAmount);
  // Continuous (non-snapped) deform for fluid feel — only anchor snaps
  const heightMul = 1 - pressed * 0.12 - melt * 0.42;
  const spreadExtra =
    melt * 0.32 +
    (behavior === 'foamPop' ? pressed * 0.2 : 0) +
    (behavior === 'crumble' ? (1 - (overlay?.integrity ?? 1)) * 0.22 : 0) +
    (behavior === 'elastic' ? Math.sin(state.wobble) * 0.02 : 0);

  const spread = state.w * visualSpreadMul * (1 + pressed * 0.065 + spreadExtra);
  const depth = state.h * visualDepthMul * 2.45 * Math.max(0.28, heightMul);
  let drawW = spread * 1.12;
  let drawH = (depth + state.h * 0.55) * Math.max(0.28, heightMul);

  // Keep aspect somewhat chunky but allow continuous size change
  drawW = Math.max(PIXEL.unit * 10, drawW);
  drawH = Math.max(PIXEL.unit * 6, drawH);

  const anchorX = state.cx;
  const anchorY = state.surfaceY;
  const dx = anchorX - drawW / 2;
  const dy = anchorY - drawH * 0.14;

  ctx.save();
  ctx.globalAlpha = state.opacity;
  enablePixelMode(ctx);

  // Soft pixel shadow (2–3 rects)
  ctx.fillStyle = rgba(PASTEL.inkSoft, 0.16 + pressed * 0.08);
  ctx.fillRect(
    px(anchorX - drawW * 0.36),
    px(dy + drawH - 2),
    px(drawW * 0.72),
    PIXEL.unit * 2,
  );

  // Fluid squash via canvas transform (continuous) — THIS is the juice
  ctx.translate(anchorX, anchorY);
  ctx.scale(state.squashX, state.squashY);
  ctx.translate(-anchorX, -anchorY);

  enablePixelMode(ctx);
  const sx = Math.min(frame, SPRITE_FRAMES - 1) * SPRITE_FRAME_W;
  // Snap draw rect to pixel grid for crisp edges while scale stays fluid
  const rdx = px(dx);
  const rdy = px(dy);
  const rdw = Math.max(PIXEL.unit * 8, px(drawW));
  const rdh = Math.max(PIXEL.unit * 5, px(drawH));

  ctx.drawImage(img, sx, 0, SPRITE_FRAME_W, SPRITE_FRAME_H, rdx, rdy, rdw, rdh);

  // Light pastel wash (subtle — keep pixel art readable)
  ctx.globalCompositeOperation = 'source-atop';
  // Can't easily source-atop on world — use overlay rects instead
  ctx.globalCompositeOperation = 'source-over';

  // Specular sparkle when freshly pressed (satisfying)
  if (pressed > 0.15 && melt < 0.4 && behavior !== 'shatter') {
    ctx.globalAlpha = state.opacity * Math.min(0.55, pressed * 0.4);
    ctx.fillStyle = PASTEL.white;
    ctx.fillRect(px(anchorX - drawW * 0.12), px(anchorY + drawH * 0.05), PIXEL.unit * 3, PIXEL.unit);
    ctx.fillRect(px(anchorX + drawW * 0.08), px(anchorY + drawH * 0.1), PIXEL.unit * 2, PIXEL.unit);
  }

  // Melt drip strips
  if (melt > 0.08) {
    ctx.globalAlpha = state.opacity * Math.min(1, melt * 1.2);
    ctx.fillStyle = mat.fill;
    const drips = 2 + Math.floor(melt * 5);
    for (let i = 0; i < drips; i++) {
      const ox = (i / Math.max(1, drips - 1) - 0.5) * drawW * 0.55;
      const len = PIXEL.unit * (1 + Math.floor(melt * 5 + ((state.seed + i) % 3)));
      ctx.fillRect(px(anchorX + ox), px(anchorY + drawH * 0.55), PIXEL.unit * 2, len);
    }
  }

  // Crack pixels
  const crack = overlay?.crackLevel ?? 0;
  if (crack > 0.05) {
    ctx.globalAlpha = state.opacity * Math.min(1, crack * 1.3);
    ctx.fillStyle = PASTEL.white;
    const n = 3 + Math.floor(crack * 5);
    for (let i = 0; i < n; i++) {
      const t = i / n;
      ctx.fillRect(
        px(anchorX - drawW * 0.28 + t * drawW * 0.5),
        px(anchorY + drawH * (0.15 + t * 0.35)),
        PIXEL.unit,
        PIXEL.unit * (1 + (i % 2)),
      );
    }
  }

  if ((overlay?.flash ?? 0) > 0.05) {
    ctx.globalAlpha = state.opacity * overlay!.flash * 0.55;
    ctx.fillStyle = PASTEL.white;
    ctx.fillRect(rdx, rdy, rdw, rdh);
  }

  // Idle jelly shimmer
  if (behavior === 'elastic' && Math.abs(pressAmount) < 0.12) {
    const pulse = Math.sin(performance.now() * 0.004 + state.seed) * 0.5 + 0.5;
    if (pulse > 0.78) {
      ctx.globalAlpha = state.opacity * 0.35 * pulse;
      ctx.fillStyle = PASTEL.white;
      ctx.fillRect(px(anchorX - PIXEL.unit), px(anchorY + drawH * 0.12), PIXEL.unit * 2, PIXEL.unit);
    }
  }

  ctx.restore();
}
