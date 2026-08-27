import type { MaterialDef, MaterialId } from '../../audio/materials';
import { PASTEL, rgba } from '../../theme/pastelPalette';
import { PIXEL, fillPx, px } from '../../theme/pixel';
import { MATERIAL_LEDGE } from './ledgeSizes';
import type { PlatformBehavior } from './behaviors';
import type { PlatformDrawState, PlatformVariant } from './types';

export interface PixelPlatformOverlay {
  crackLevel: number;
  meltProgress: number;
  flash: number;
  integrity: number;
  behavior: PlatformBehavior;
}

function seeded(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Pixel-art LEDGES — always platform-shaped (top surface + body + lip).
 * Material identity lives in surface texture, color, and micro-details.
 * Good practices: 1px outline, top highlight, bottom shade, limited palette,
 * readable silhouette at small size, unique pattern per material.
 */
export function renderPixelPlatform(
  ctx: CanvasRenderingContext2D,
  material: MaterialId,
  _variant: PlatformVariant,
  mat: MaterialDef,
  s: PlatformDrawState,
  overlay?: PixelPlatformOverlay,
): void {
  const u = PIXEL.unit;
  const melt = overlay?.meltProgress ?? 0;
  const integrity = overlay?.integrity ?? 1;
  const ledge = MATERIAL_LEDGE[material];

  const cx = s.cx;
  const surfaceY = s.surfaceY;
  // Wide flat platform — height from hitbox * depth (not a floating object)
  const w = Math.max(u * 14, px(s.w * ledge.visualSpread * (1 + melt * 0.28)));
  const bodyH = Math.max(
    u * 5,
    px(s.h * ledge.visualDepth * (1.55 + (1 - Math.max(0.25, s.squashY)) * 0.35) * Math.max(0.4, integrity)),
  );

  ctx.save();
  ctx.globalAlpha = s.opacity;
  ctx.imageSmoothingEnabled = false;

  // Contact shadow under ledge
  fillPx(ctx, cx - w * 0.45, surfaceY + bodyH - u, w * 0.9, u * 2, rgba(PASTEL.inkSoft, 0.2));

  const fill = mat.fill;
  const stroke = mat.stroke;
  const hi = rgba(PASTEL.white, 0.65);
  const shade = rgba(PASTEL.inkSoft, 0.22);

  // —— Core ledge silhouette (rounded soft rect in pixels) ——
  drawLedgeBody(ctx, cx, surfaceY, w, bodyH, fill, stroke, hi, shade, material);

  // —— Material surface identity ——
  paintSurface(ctx, material, cx, surfaceY, w, bodyH, mat, s.seed, s.time, s.wobble, overlay);

  // Melt drips over the lip
  if (melt > 0.06) {
    const n = 2 + Math.floor(melt * 6);
    for (let i = 0; i < n; i++) {
      const ox = (seeded(s.seed, i) - 0.5) * w * 0.75;
      const len = u * (1 + Math.floor(melt * 5 + seeded(s.seed, i + 9) * 3));
      fillPx(ctx, cx + ox, surfaceY + bodyH - u, u * 2, len, fill);
    }
  }

  // Cracks (soap / ice)
  const crack = overlay?.crackLevel ?? 0;
  if (crack > 0.05) {
    ctx.globalAlpha = s.opacity * Math.min(1, crack * 1.25);
    for (let i = 0; i < 3 + Math.floor(crack * 4); i++) {
      const t = i / 6;
      fillPx(
        ctx,
        cx - w * 0.35 + t * w * 0.7,
        surfaceY + bodyH * (0.2 + seeded(s.seed, i) * 0.5),
        u,
        u * (2 + (i % 2)),
        PASTEL.white,
      );
    }
  }

  if ((overlay?.flash ?? 0) > 0.05) {
    ctx.globalAlpha = s.opacity * overlay!.flash * 0.55;
    fillPx(ctx, cx - w / 2, surfaceY, w, bodyH, PASTEL.white);
  }

  // Sticky gum strands (when pressed / rebound)
  if (overlay?.behavior === 'sticky' && Math.abs(s.squashY - 1) > 0.04) {
    ctx.globalAlpha = s.opacity * 0.7;
    const pull = (1 - s.squashY) * bodyH * 0.8;
    fillPx(ctx, cx - u * 2, surfaceY - pull, u, pull + u, mat.fill);
    fillPx(ctx, cx + u * 3, surfaceY - pull * 0.7, u, pull * 0.7 + u, mat.stroke);
  }

  ctx.restore();
}

function drawLedgeBody(
  ctx: CanvasRenderingContext2D,
  cx: number,
  sy: number,
  w: number,
  h: number,
  fill: string,
  stroke: string,
  hi: string,
  shade: string,
  material: MaterialId,
): void {
  const u = PIXEL.unit;
  const x = cx - w / 2;

  // Main body
  fillPx(ctx, x + u, sy, w - u * 2, h, fill);
  fillPx(ctx, x, sy + u, w, h - u * 2, fill);

  // Top playable highlight (reads as platform surface)
  fillPx(ctx, x + u * 2, sy, w - u * 4, u, hi);
  // Second highlight row for chunky pixel readability
  if (material === 'butter' || material === 'mochi' || material === 'chocolate') {
    fillPx(ctx, x + u * 3, sy + u, w - u * 6, u, rgba(PASTEL.white, 0.25));
  }

  // Bottom shade / lip
  fillPx(ctx, x + u, sy + h - u * 2, w - u * 2, u, shade);
  fillPx(ctx, x, sy + h - u, w, u, stroke);

  // Outline
  fillPx(ctx, x + u, sy, w - u * 2, u, stroke);
  fillPx(ctx, x, sy + u, u, h - u * 2, stroke);
  fillPx(ctx, x + w - u, sy + u, u, h - u * 2, stroke);
}

function paintSurface(
  ctx: CanvasRenderingContext2D,
  material: MaterialId,
  cx: number,
  sy: number,
  w: number,
  h: number,
  mat: MaterialDef,
  seed: number,
  time: number,
  wobble: number,
  overlay?: PixelPlatformOverlay,
): void {
  const u = PIXEL.unit;
  const x = cx - w / 2;

  switch (material) {
    case 'butter': {
      // Knife score lines on slab
      for (let i = 0; i < 4; i++) {
        fillPx(ctx, x + u * 3, sy + u * (2 + i * 2), w - u * 6, u, rgba(PASTEL.honey, 0.45));
      }
      break;
    }
    case 'mochi': {
      // QUEIJO — holes (Swiss cheese) + soft spots
      const holes = 5 + Math.floor(seeded(seed, 1) * 4);
      for (let i = 0; i < holes; i++) {
        const hx = x + u * 3 + seeded(seed, i) * (w - u * 8);
        const hy = sy + u * 2 + seeded(seed, i + 20) * (h - u * 5);
        const hr = u * (1 + Math.floor(seeded(seed, i + 40) * 2));
        fillPx(ctx, hx, hy, hr * 2, hr * 2, rgba(PASTEL.cream, 0.55));
        fillPx(ctx, hx + u, hy + u, hr, hr, rgba(PASTEL.caramel, 0.35));
      }
      // Idle bounce sparkle
      if (Math.sin(wobble) > 0.85) {
        fillPx(ctx, cx, sy + u, u * 2, u, PASTEL.white);
      }
      break;
    }
    case 'jelly': {
      // Translucent bubbles inside gelatin ledge
      for (let i = 0; i < 5; i++) {
        const bx = x + u * 4 + seeded(seed, i) * (w - u * 10);
        const by = sy + u * 2 + seeded(seed, i + 5) * (h * 0.5);
        fillPx(ctx, bx, by, u, u, rgba(PASTEL.white, 0.55));
      }
      // Wobble sheen
      const ox = Math.sin(wobble) * u * 2;
      fillPx(ctx, cx - u * 2 + ox, sy + u, u * 3, u, rgba(PASTEL.white, 0.4));
      break;
    }
    case 'chocolate': {
      fillPx(ctx, cx - u / 2, sy + u, u, h - u * 3, rgba(PASTEL.caramelDeep, 0.45));
      fillPx(ctx, x + u * 3, sy + h * 0.45, w - u * 6, u, rgba(PASTEL.caramelDeep, 0.4));
      break;
    }
    case 'citrus': {
      // Pulp segment ticks
      for (let i = 0; i < 6; i++) {
        const tx = x + u * 3 + (i / 5) * (w - u * 6);
        fillPx(ctx, tx, sy + u * 2, u, h - u * 4, rgba(PASTEL.white, 0.35));
      }
      break;
    }
    case 'honeycomb': {
      for (let i = 0; i < 8; i++) {
        const hx = x + u * 3 + (i % 4) * (w / 4.5);
        const hy = sy + u * 2 + Math.floor(i / 4) * (h * 0.35);
        fillPx(ctx, hx, hy, u * 2, u, rgba(PASTEL.butter, 0.55));
        fillPx(ctx, hx + u, hy - u, u, u * 3, rgba(PASTEL.honey, 0.4));
      }
      break;
    }
    case 'glycerin':
    case 'iceSoap': {
      // Soap bar — clean bands + glitter
      fillPx(ctx, x + u * 3, sy + u * 2, w - u * 6, u, rgba(PASTEL.white, 0.5));
      if (material === 'iceSoap') {
        fillPx(ctx, cx - u, sy + u * 3, u, u * 3, PASTEL.white);
        fillPx(ctx, cx + u * 4, sy + h * 0.4, u * 2, u, PASTEL.white);
      } else {
        for (let i = 0; i < 4; i++) {
          fillPx(
            ctx,
            x + u * 4 + seeded(seed, i) * (w - u * 10),
            sy + u * 3 + seeded(seed, i + 2) * (h * 0.4),
            u,
            u,
            i % 2 ? PASTEL.lilac : PASTEL.white,
          );
        }
      }
      break;
    }
    case 'whipped': {
      // Foam peaks along top edge of platform
      const peaks = 4;
      for (let i = 0; i < peaks; i++) {
        const px0 = x + u * 4 + (i / (peaks - 1)) * (w - u * 8);
        const ph = u * (2 + Math.floor(seeded(seed, i) * 3));
        fillPx(ctx, px0 - u, sy - ph + u, u * 3, ph, PASTEL.white);
        fillPx(ctx, px0, sy - ph, u * 2, u, PASTEL.blush);
      }
      break;
    }
    case 'kinetic': {
      // Grain speckles
      for (let i = 0; i < 12; i++) {
        if (seeded(seed, i) > (overlay?.integrity ?? 1)) continue;
        fillPx(
          ctx,
          x + u * 2 + seeded(seed, i + 10) * (w - u * 4),
          sy + u + seeded(seed, i + 20) * (h - u * 3),
          u,
          u,
          PASTEL.sandSoft,
        );
      }
      break;
    }
    case 'clearSlime': {
      // CHICLETE — chewed gum blotches + stretch dots (rosa mascado)
      for (let i = 0; i < 6; i++) {
        const bx = x + u * 3 + seeded(seed, i) * (w - u * 8);
        const by = sy + u * 2 + seeded(seed, i + 7) * (h - u * 5);
        const bw = u * (2 + Math.floor(seeded(seed, i + 3) * 3));
        fillPx(ctx, bx, by, bw, u * 2, i % 2 ? PASTEL.rose : PASTEL.blush);
        fillPx(ctx, bx + u, by + u, u, u, rgba(PASTEL.coral, 0.5));
      }
      // Shine
      fillPx(ctx, cx - u * 3, sy + u, u * 4, u, rgba(PASTEL.white, 0.45));
      break;
    }
    case 'butterSlime': {
      for (let i = 0; i < 4; i++) {
        fillPx(ctx, x + u * 4, sy + u * (2 + i * 2), w - u * 8, u, rgba(PASTEL.coral, 0.3));
      }
      break;
    }
    default:
      break;
  }

  void time;
  void mat;
}
