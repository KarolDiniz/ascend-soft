import type { MaterialId } from '../../audio/materials';
import type { MaterialSprite } from '../../assets/platforms/SpriteAtlas';
import {
  SPRITE_FRAME,
  SPRITE_FRAME_H,
  SPRITE_FRAME_W,
  SPRITE_FRAMES,
} from '../../assets/platforms/spriteConfig';
import type { PlatformDrawState } from './types';

/**
 * Map press spring → sprite frame.
 * pressAmount > 0 → squash frames; rebound on release / negative overshoot.
 */
export function pickSpriteFrame(
  pressAmount: number,
  pressVel: number,
  releaseTimer: number,
): number {
  const pressed = Math.max(0, pressAmount);

  if (pressed > 0.12) {
    // Prefer mid squash frames — avoid max flat look
    const t = Math.min(1, (pressed - 0.12) / 0.95);
    const idx = SPRITE_FRAME.squash1 + Math.floor(t * 2.2);
    return Math.min(SPRITE_FRAME.squash3, idx);
  }

  // Rebound at peak of release (stretching past idle)
  if (releaseTimer > 0.04 || pressAmount < -0.04 || pressVel < -2.5) {
    return SPRITE_FRAME.rebound;
  }

  const breathe = Math.sin(performance.now() * 0.002) * 0.5 + 0.5;
  return breathe > 0.94 ? SPRITE_FRAME.rebound : SPRITE_FRAME.idle;
}

export function drawPlatformSprite(
  ctx: CanvasRenderingContext2D,
  sheet: MaterialSprite,
  _material: MaterialId,
  state: PlatformDrawState,
  pressAmount: number,
  pressVel: number,
  releaseTimer: number,
  visualDepthMul: number,
  visualSpreadMul: number,
): void {
  const frame = pickSpriteFrame(pressAmount, pressVel, releaseTimer);
  const img = sheet.image;

  const pressed = Math.max(0, pressAmount);
  // Flattened frames read shorter — mild height reduction while pressed
  const heightMul = 1 - pressed * 0.06;
  const spread = state.w * visualSpreadMul * (1 + pressed * 0.03);
  const depth = state.h * visualDepthMul * 2.2 * heightMul;
  const drawW = spread * 1.08;
  const drawH = (depth + state.h * 0.5) * heightMul;

  const anchorX = state.cx;
  // Landing surface = visual TOP — player stands here
  const anchorY = state.surfaceY;

  const topPad = 0.16;
  const dx = anchorX - drawW / 2;
  const dy = anchorY - drawH * topPad;

  ctx.save();
  ctx.globalAlpha = state.opacity;

  const shadowY = dy + drawH - 2;
  const contactShadow = ctx.createRadialGradient(
    anchorX,
    shadowY,
    0,
    anchorX,
    shadowY,
    drawW * 0.42,
  );
  contactShadow.addColorStop(0, 'rgba(40, 50, 60, 0.16)');
  contactShadow.addColorStop(1, 'rgba(40, 50, 60, 0)');
  ctx.fillStyle = contactShadow;
  ctx.beginPath();
  ctx.ellipse(anchorX, shadowY, drawW * 0.38, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Scale around TOP so feet stay planted while body flattens downward
  ctx.translate(anchorX, anchorY);
  ctx.scale(state.squashX, state.squashY);
  ctx.translate(-anchorX, -anchorY);

  ctx.drawImage(
    img,
    Math.min(frame, SPRITE_FRAMES - 1) * SPRITE_FRAME_W,
    0,
    SPRITE_FRAME_W,
    SPRITE_FRAME_H,
    dx,
    dy,
    drawW,
    drawH,
  );

  if (sheet.source === 'ai' && pressed > 0.25) {
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = state.opacity * Math.min(0.35, pressed * 0.28);
    ctx.fillStyle = 'rgba(255, 220, 180, 0.6)';
    ctx.beginPath();
    ctx.ellipse(anchorX, anchorY + drawH * 0.08, drawW * 0.25, drawH * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
