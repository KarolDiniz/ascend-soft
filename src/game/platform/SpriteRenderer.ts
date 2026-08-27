import type { MaterialId } from '../../audio/materials';
import type { MaterialSprite } from '../../assets/platforms/SpriteAtlas';
import {
  SPRITE_FRAME,
  SPRITE_FRAME_H,
  SPRITE_FRAME_W,
  SPRITE_FRAMES,
} from '../../assets/platforms/spriteConfig';
import type { PlatformDrawState } from './types';

export function pickSpriteFrame(squash: number, landAnim: number): number {
  if (landAnim > 0.05) {
    const t = 1 - landAnim;
    return Math.min(
      SPRITE_FRAMES - 1,
      Math.max(SPRITE_FRAME.squash1, Math.floor(t * (SPRITE_FRAMES - 1))),
    );
  }
  if (squash > 0.08) {
    return Math.min(SPRITE_FRAME.squash4, Math.floor(squash * 10) + SPRITE_FRAME.squash1);
  }
  const breathe = Math.sin(performance.now() * 0.002) * 0.5 + 0.5;
  return breathe > 0.92 ? SPRITE_FRAME.rebound : SPRITE_FRAME.idle;
}

export function drawPlatformSprite(
  ctx: CanvasRenderingContext2D,
  sheet: MaterialSprite,
  _material: MaterialId,
  state: PlatformDrawState,
  squash: number,
  landAnim: number,
  visualDepthMul: number,
  visualSpreadMul: number,
): void {
  const frame = pickSpriteFrame(squash, landAnim);
  const img = sheet.image;

  const spread = state.w * visualSpreadMul;
  const depth = state.h * visualDepthMul * 2.2;
  const drawW = spread * 1.08;
  const drawH = depth + state.h * 0.5;

  const anchorX = state.cx;
  // Landing surface = visual TOP of the object (player stands here)
  const anchorY = state.surfaceY;

  // Frames are bottom-weighted (transparent padding on top ~15–25%).
  // Place the sheet so the opaque top sits on the collision surface,
  // with the body hanging downward — not straddling the player.
  const topPad = 0.16;
  const dx = anchorX - drawW / 2;
  const dy = anchorY - drawH * topPad;

  ctx.save();
  ctx.globalAlpha = state.opacity;

  // Contact shadow under the object (near visual bottom)
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

  // Squash around the landing surface (top), so the top stays put
  ctx.translate(anchorX, anchorY);
  ctx.scale(state.squashX, state.squashY);
  ctx.translate(-anchorX, -anchorY);

  ctx.drawImage(
    img,
    frame * SPRITE_FRAME_W,
    0,
    SPRITE_FRAME_W,
    SPRITE_FRAME_H,
    dx,
    dy,
    drawW,
    drawH,
  );

  if (sheet.source === 'ai' && squash > 0.2) {
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = state.opacity * Math.min(0.35, squash * 0.25);
    ctx.fillStyle = 'rgba(255, 220, 180, 0.6)';
    ctx.beginPath();
    ctx.ellipse(anchorX, anchorY + drawH * 0.08, drawW * 0.25, drawH * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
