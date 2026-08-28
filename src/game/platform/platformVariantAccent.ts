import type { MaterialDef } from '../../audio/materials';
import { PASTEL, rgba } from '../../theme/pastelPalette';
import { fillPx } from '../../theme/pixel';
import type { PlatformVariant } from './types';

function seeded(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Escala visual por variante — cada instância tem silhueta própria */
export function getVariantScale(variant: PlatformVariant): { wMul: number; hMul: number } {
  const map: Partial<Record<PlatformVariant, { wMul: number; hMul: number }>> = {
    jelly_cube: { wMul: 0.96, hMul: 1.08 },
    jelly_dome: { wMul: 1.06, hMul: 1.18 },
    butter_slab: { wMul: 1.1, hMul: 0.88 },
    butter_pat: { wMul: 0.92, hMul: 0.78 },
    butter_curl: { wMul: 1.04, hMul: 0.95 },
    mochi_round: { wMul: 1.02, hMul: 1.12 },
    mochi_square: { wMul: 0.98, hMul: 0.94 },
    chocolate_puddle: { wMul: 1.14, hMul: 0.72 },
    chocolate_bar: { wMul: 0.94, hMul: 1.06 },
    citrus_half: { wMul: 1.08, hMul: 1.1 },
    citrus_wedge: { wMul: 0.82, hMul: 0.9 },
    honey_chunk: { wMul: 1.02, hMul: 1.05 },
    honey_drip: { wMul: 0.96, hMul: 1.15 },
    glycerin_bar: { wMul: 0.98, hMul: 0.92 },
    glycerin_gem: { wMul: 0.9, hMul: 1.08 },
    whipped_peaks: { wMul: 1.05, hMul: 1.2 },
    whipped_swirl: { wMul: 0.95, hMul: 1.15 },
    kinetic_mound: { wMul: 1.08, hMul: 1.05 },
    kinetic_slab: { wMul: 1.12, hMul: 0.78 },
    ice_shard: { wMul: 0.88, hMul: 1.12 },
    ice_block: { wMul: 1.0, hMul: 0.95 },
    slime_puddle: { wMul: 1.18, hMul: 0.68 },
    slime_blob: { wMul: 1.05, hMul: 1.15 },
    butterSlime_fold: { wMul: 1.0, hMul: 1.08 },
    butterSlime_scoop: { wMul: 0.94, hMul: 1.12 },
    marshmallow_puff: { wMul: 1.06, hMul: 1.18 },
    marshmallow_cube: { wMul: 0.96, hMul: 0.92 },
    sponge_block: { wMul: 1.04, hMul: 0.96 },
    sponge_soft: { wMul: 1.08, hMul: 0.88 },
    soapBubble_orb: { wMul: 0.92, hMul: 1.1 },
    soapBubble_cluster: { wMul: 1.12, hMul: 0.95 },
    bathFoam_cloud: { wMul: 1.1, hMul: 1.15 },
    bathFoam_swirl: { wMul: 1.0, hMul: 1.08 },
    lavenderSoap_bar: { wMul: 0.98, hMul: 0.9 },
    lavenderSoap_gem: { wMul: 0.9, hMul: 1.06 },
    creamSoap_bar: { wMul: 1.0, hMul: 0.92 },
    creamSoap_oval: { wMul: 1.06, hMul: 0.88 },
    keyboard_row: { wMul: 1.05, hMul: 0.72 },
    keyboard_pad: { wMul: 0.92, hMul: 0.85 },
    bubbleWrap_sheet: { wMul: 1.08, hMul: 0.82 },
    bubbleWrap_pack: { wMul: 0.98, hMul: 1.05 },
  };
  return map[variant] ?? { wMul: 1, hMul: 1 };
}

type AccentArgs = {
  ctx: CanvasRenderingContext2D;
  cx: number;
  sy: number;
  w: number;
  h: number;
  mat: MaterialDef;
  u: number;
  seed: number;
  time: number;
  wobble: number;
};

/** Detalhes exclusivos por variante — lê-se a diferença entre duas prateleiras iguais */
export function drawVariantAccent(a: AccentArgs, variant: PlatformVariant): void {
  const { ctx, cx, sy, w, h, mat, u, seed, time, wobble } = a;
  const x = cx - w / 2;

  switch (variant) {
    case 'jelly_dome': {
      for (let i = 0; i < 5; i++) {
        const tw = w * (0.35 + i * 0.08);
        fillPx(ctx, cx - tw / 2, sy - u * (3 + i), tw, u, rgba(mat.fill, 0.85 - i * 0.08));
      }
      fillPx(ctx, cx - u * 2, sy - u * 2, u * 4, u, rgba(PASTEL.white, 0.55));
      break;
    }
    case 'jelly_cube': {
      fillPx(ctx, x, sy, u * 2, u * 2, rgba(PASTEL.white, 0.5));
      fillPx(ctx, x + w - u * 2, sy, u * 2, u * 2, rgba(PASTEL.white, 0.5));
      fillPx(ctx, x, sy + h - u * 2, u * 2, u * 2, mat.stroke);
      fillPx(ctx, x + w - u * 2, sy + h - u * 2, u * 2, u * 2, mat.stroke);
      break;
    }
    case 'butter_pat': {
      for (let row = 0; row < h; row += u) {
        const t = row / Math.max(1, h);
        const ww = w * (0.78 + Math.sin(t * Math.PI) * 0.2);
        fillPx(ctx, cx - ww / 2, sy + row, ww, u, row === 0 ? rgba(PASTEL.white, 0.6) : mat.fill);
      }
      break;
    }
    case 'butter_curl': {
      const curlX = x + w - u * 3;
      for (let i = 0; i < 6; i++) {
        fillPx(ctx, curlX - i * u * 0.6, sy + u + i * u, u * 2, u, mat.fill);
        fillPx(ctx, curlX - i * u * 0.4, sy + i * u, u, u * 2, rgba(mat.particle, 0.7));
      }
      break;
    }
    case 'mochi_round': {
      fillPx(ctx, cx - w * 0.42, sy - u, w * 0.84, u * 2, mat.fill);
      fillPx(ctx, cx - w * 0.35, sy - u * 2, w * 0.7, u, rgba(mat.particle, 0.65));
      break;
    }
    case 'mochi_square': {
      const bite = seeded(seed, 88) > 0.5 ? 1 : -1;
      fillPx(ctx, cx + bite * w * 0.38, sy + u, u * 3, u * 3, PASTEL.cream);
      fillPx(ctx, cx + bite * w * 0.36, sy + u * 2, u * 2, u * 2, rgba(mat.stroke, 0.35));
      break;
    }
    case 'chocolate_puddle': {
      fillPx(ctx, cx - w * 0.55, sy + h - u, w * 1.1, u * 2, mat.fill);
      fillPx(ctx, cx - w * 0.48, sy + h, w * 0.96, u, rgba(mat.particle, 0.45));
      break;
    }
    case 'chocolate_bar': {
      for (let i = 1; i < 4; i++) {
        fillPx(ctx, x + (w * i) / 4, sy + u, u, h - u * 2, rgba(mat.stroke, 0.4));
      }
      break;
    }
    case 'citrus_wedge': {
      for (let row = 0; row < h; row += u) {
        const ww = w * (0.25 + (row / h) * 0.55);
        fillPx(ctx, x + u * 2, sy + row, ww, u, mat.fill);
      }
      fillPx(ctx, x + u * 2, sy, u, h, PASTEL.white);
      break;
    }
    case 'citrus_half': {
      fillPx(ctx, cx - w * 0.45, sy - u * 2, w * 0.9, u * 3, mat.fill);
      fillPx(ctx, cx - u * 3, sy - u, u * 6, u, rgba(PASTEL.white, 0.55));
      break;
    }
    case 'honey_drip': {
      fillPx(ctx, cx - w * 0.22, sy + h - u, w * 0.44, u * 2, mat.fill);
      fillPx(ctx, cx - w * 0.18, sy + h, w * 0.36, u, rgba(mat.particle, 0.5));
      break;
    }
    case 'honey_chunk': {
      fillPx(ctx, x + u * 2, sy - u * 2, w * 0.35, u * 2, mat.fill);
      fillPx(ctx, x + w * 0.55, sy - u, u * 3, u * 2, rgba(mat.particle, 0.65));
      break;
    }
    case 'glycerin_gem': {
      fillPx(ctx, cx, sy + u * 2, u, h - u * 4, rgba(PASTEL.white, 0.45));
      fillPx(ctx, cx - w * 0.22, sy + h * 0.45, w * 0.44, u, rgba(PASTEL.white, 0.35));
      break;
    }
    case 'whipped_swirl': {
      const turns = 5;
      for (let i = 0; i < turns; i++) {
        const ang = i * 1.2 + wobble;
        fillPx(ctx, cx + Math.cos(ang) * u * (2 + i), sy + h * 0.25 - i * u, u * 2, u, i % 2 ? PASTEL.white : mat.fill);
      }
      break;
    }
    case 'kinetic_slab': {
      fillPx(ctx, x, sy + h * 0.55, w, h * 0.45, mat.fill);
      for (let i = 0; i < 8; i++) {
        fillPx(ctx, x + seeded(seed, i + 92) * w, sy + h * 0.6, u, u, rgba(mat.particle, 0.5));
      }
      break;
    }
    case 'ice_shard': {
      fillPx(ctx, cx - u, sy - u * 4, u * 2, u * 3, rgba(PASTEL.white, 0.65));
      fillPx(ctx, cx + u * 2, sy - u * 2, u, u * 4, rgba(PASTEL.mist, 0.55));
      fillPx(ctx, cx - u * 3, sy + u, u * 2, u * 2, mat.particle);
      break;
    }
    case 'slime_puddle': {
      fillPx(ctx, cx - w * 0.58, sy + h - u, w * 1.16, u * 2, rgba(mat.fill, 0.75));
      fillPx(ctx, cx - w * 0.45, sy + h, w * 0.9, u, rgba(mat.particle, 0.5));
      break;
    }
    case 'slime_blob': {
      fillPx(ctx, cx - u * 4, sy - u * 3, u * 8, u * 4, mat.fill);
      fillPx(ctx, cx - u * 2, sy - u * 4, u * 4, u * 2, rgba(mat.particle, 0.6));
      break;
    }
    case 'butterSlime_scoop': {
      const sx = cx + w * 0.22;
      fillPx(ctx, sx, sy + u, u * 4, u * 3, PASTEL.cream);
      fillPx(ctx, sx + u, sy + u * 2, u * 2, u * 2, mat.fill);
      break;
    }
    case 'butterSlime_fold': {
      fillPx(ctx, cx - w * 0.15, sy + u, u, h - u * 2, rgba(mat.stroke, 0.35));
      fillPx(ctx, cx - w * 0.12, sy + h * 0.35, w * 0.24, u, rgba(PASTEL.white, 0.4));
      break;
    }
    case 'marshmallow_puff': {
      for (let i = 0; i < 4; i++) {
        fillPx(ctx, cx + (i - 1.5) * u * 3, sy - u * (2 + (i % 2)), u * 3, u * 2, PASTEL.white);
      }
      break;
    }
    case 'soapBubble_cluster': {
      drawBubbleAccent(ctx, cx - w * 0.32, sy + h * 0.35, u, mat);
      drawBubbleAccent(ctx, cx + w * 0.28, sy + h * 0.45, u, mat);
      drawBubbleAccent(ctx, cx, sy + h * 0.15, u, mat);
      break;
    }
    case 'bathFoam_swirl': {
      for (let i = 0; i < 6; i++) {
        const ang = time * 0.8 + i * 1.05;
        fillPx(ctx, cx + Math.cos(ang) * w * 0.28, sy + h * 0.3 + Math.sin(ang) * u * 2, u * 2, u, PASTEL.white);
      }
      break;
    }
    case 'lavenderSoap_gem': {
      fillPx(ctx, cx, sy + u, u, h - u * 2, rgba(PASTEL.lilac, 0.55));
      fillPx(ctx, cx - w * 0.2, sy + h * 0.42, w * 0.4, u, rgba(PASTEL.white, 0.4));
      fillPx(ctx, cx - u, sy - u, u * 2, u, rgba(PASTEL.lilac, 0.45));
      break;
    }
    case 'creamSoap_oval': {
      fillPx(ctx, cx - w * 0.38, sy - u, w * 0.76, u * 2, rgba(PASTEL.white, 0.5));
      break;
    }
    case 'keyboard_pad': {
      fillPx(ctx, x + u, sy, w - u * 2, h, rgba(mat.fill, 0.9));
      fillPx(ctx, x + u * 2, sy + u * 2, w - u * 4, h - u * 4, mat.stroke);
      break;
    }
    case 'bubbleWrap_pack': {
      fillPx(ctx, x - u, sy, u * 2, h, rgba(mat.stroke, 0.45));
      fillPx(ctx, x + w - u, sy, u * 2, h, rgba(mat.stroke, 0.45));
      fillPx(ctx, x, sy - u, w, u, rgba(PASTEL.white, 0.45));
      break;
    }
    default:
      break;
  }
}

function drawBubbleAccent(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  u: number,
  mat: MaterialDef,
): void {
  fillPx(ctx, bx - u, by - u, u * 3, u * 3, rgba(mat.particle, 0.55));
  fillPx(ctx, bx, by, u, u, rgba(PASTEL.white, 0.65));
}
