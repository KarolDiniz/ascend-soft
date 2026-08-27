import { MATERIALS, type MaterialId } from '../../audio/materials';
import { renderPlatform } from '../../game/platform/MaterialRenderer';
import { getVariants } from '../../game/platform/PlatformVariant';
import type { PlatformDrawState } from '../../game/platform/types';
import {
  SPRITE_FRAME_H,
  SPRITE_FRAME_W,
  SPRITE_FRAMES,
  SPRITE_SHEET_H,
  SPRITE_SHEET_W,
} from './spriteConfig';

const WORLD_W = 140;
const WORLD_H = 16;

/** Bakes procedural art into a sprite sheet (fallback until AI PNG exists). */
export function bakePlaceholderSheet(material: MaterialId, seed = 42): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = SPRITE_SHEET_W;
  canvas.height = SPRITE_SHEET_H;
  const ctx = canvas.getContext('2d')!;
  const variant = getVariants(material)[0]?.id ?? 'jelly_cube';
  const mat = MATERIALS[material];

  const squashCurve = [0, 0.35, 0.72, 0.95, 0.55, 0.12];

  for (let i = 0; i < SPRITE_FRAMES; i++) {
    const sq = squashCurve[i] ?? 0;
    const squashX = 1 + sq * 0.16;
    const squashY = 1 - sq * 0.34;
    const sink = sq * 4.2;

    ctx.save();
    ctx.translate(i * SPRITE_FRAME_W, 0);
    ctx.clearRect(0, 0, SPRITE_FRAME_W, SPRITE_FRAME_H);

    const scale = Math.min(SPRITE_FRAME_W / (WORLD_W * 1.35), SPRITE_FRAME_H / 72);
    const cx = SPRITE_FRAME_W / 2;
    const surfaceY = SPRITE_FRAME_H - 28;

    ctx.translate(cx, 0);
    ctx.scale(scale, scale);
    ctx.translate(-cx / scale + cx, 0);

    const screenW = WORLD_W * squashX;
    const screenH = Math.max(14, WORLD_H * squashY * 2.8);
    const centerY = surfaceY / scale - sink;

    const state: PlatformDrawState = {
      x: cx / scale - screenW / 2,
      y: centerY - screenH / 2,
      w: screenW,
      h: screenH,
      cx: cx / scale,
      surfaceY: centerY,
      time: i * 0.08,
      wobble: seed * 0.01 + i * 0.4,
      seed,
      opacity: 1,
      squashX,
      squashY,
    };

    renderPlatform(ctx, variant, mat, state);
    ctx.restore();
  }

  return canvas;
}

export function canvasToImage(canvas: HTMLCanvasElement): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = canvas.toDataURL('image/png');
  });
}
