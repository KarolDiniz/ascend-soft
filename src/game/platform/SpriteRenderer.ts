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
}

export function pickSpriteFrame(
  pressAmount: number,
  pressVel: number,
  releaseTimer: number,
  meltProgress = 0,
): number {
  const pressed = Math.max(0, pressAmount, meltProgress * 0.9);

  if (pressed > 0.12) {
    const t = Math.min(1, (pressed - 0.12) / 0.95);
    const idx = SPRITE_FRAME.squash1 + Math.floor(t * 2.2);
    return Math.min(SPRITE_FRAME.squash3, idx);
  }

  if (releaseTimer > 0.04 || pressAmount < -0.04 || pressVel < -2.5) {
    return SPRITE_FRAME.rebound;
  }

  const breathe = Math.sin(performance.now() * 0.002) * 0.5 + 0.5;
  return breathe > 0.94 ? SPRITE_FRAME.rebound : SPRITE_FRAME.idle;
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
  const frame = pickSpriteFrame(pressAmount, pressVel, releaseTimer, melt);
  const img = sheet.image;
  const mat = MATERIALS[material];

  const pressed = Math.max(0, pressAmount);
  const heightMul = 1 - pressed * 0.06 - melt * 0.35;
  const spread = state.w * visualSpreadMul * (1 + pressed * 0.03 + melt * 0.25);
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
  const contactShadow = ctx.createRadialGradient(
    anchorX,
    shadowY,
    0,
    anchorX,
    shadowY,
    drawW * 0.42,
  );
  contactShadow.addColorStop(0, rgba(PASTEL.inkSoft, 0.12));
  contactShadow.addColorStop(1, rgba(PASTEL.inkSoft, 0));
  ctx.fillStyle = contactShadow;
  ctx.beginPath();
  ctx.ellipse(anchorX, shadowY, drawW * 0.38, 7, 0, 0, Math.PI * 2);
  ctx.fill();

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

  // Soft pastel wash — only on opaque sprite pixels (no bounding-box square)
  ctx.globalCompositeOperation = 'source-atop';
  ctx.globalAlpha = state.opacity * 0.4;
  ctx.fillStyle = mat.spriteWash;
  ctx.fillRect(dx, dy, drawW, drawH);
  ctx.globalAlpha = state.opacity * 0.14;
  ctx.fillStyle = rgba(PASTEL.cream, 0.9);
  ctx.fillRect(dx, dy, drawW, drawH);
  ctx.globalCompositeOperation = 'source-over';

  if (melt > 0.05) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = state.opacity * melt * 0.45;
    const g = ctx.createLinearGradient(dx, dy, dx, dy + drawH);
    g.addColorStop(0, rgba(PASTEL.butter, 0.65));
    g.addColorStop(0.5, rgba(PASTEL.peach, 0.2));
    g.addColorStop(1, rgba(PASTEL.caramel, 0.12));
    ctx.fillStyle = g;
    ctx.fillRect(dx, dy, drawW, drawH);
    ctx.globalCompositeOperation = 'source-over';
  }

  const crack = overlay?.crackLevel ?? 0;
  if (crack > 0.05) {
    ctx.globalAlpha = state.opacity * Math.min(1, crack * 1.2);
    ctx.strokeStyle = rgba(PASTEL.white, 0.85);
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(anchorX - drawW * 0.28, anchorY + drawH * 0.15);
    ctx.lineTo(anchorX - drawW * 0.02, anchorY + drawH * 0.45);
    ctx.lineTo(anchorX + drawW * 0.22, anchorY + drawH * 0.22);
    ctx.moveTo(anchorX + drawW * 0.05, anchorY + drawH * 0.12);
    ctx.lineTo(anchorX + drawW * 0.18, anchorY + drawH * 0.5);
    if (crack > 0.55) {
      ctx.moveTo(anchorX - drawW * 0.15, anchorY + drawH * 0.35);
      ctx.lineTo(anchorX - drawW * 0.32, anchorY + drawH * 0.55);
    }
    ctx.stroke();
  }

  if (overlay?.behavior === 'crumble' && (overlay.integrity ?? 1) < 0.95) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = state.opacity * (1 - overlay.integrity) * 0.28;
    ctx.fillStyle = rgba(PASTEL.caramelDeep, 0.45);
    ctx.fillRect(dx, dy, drawW, drawH);
    ctx.globalCompositeOperation = 'source-over';
  }

  if ((overlay?.flash ?? 0) > 0.05) {
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = state.opacity * overlay!.flash * 0.65;
    ctx.fillStyle = PASTEL.white;
    ctx.fillRect(dx, dy, drawW, drawH);
    ctx.globalCompositeOperation = 'source-over';
  }

  if (sheet.source === 'ai' && pressed > 0.25 && melt < 0.3) {
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = state.opacity * Math.min(0.32, pressed * 0.26);
    ctx.fillStyle = rgba(PASTEL.butter, 0.55);
    ctx.beginPath();
    ctx.ellipse(anchorX, anchorY + drawH * 0.08, drawW * 0.25, drawH * 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
