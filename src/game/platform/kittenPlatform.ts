import { PASTEL, rgba } from '../../theme/pastelPalette';
import { fillPx } from '../../theme/pixel';

const FUR_COLORS = ['#F0A860', '#B8B0A8', '#F8E8D8', '#D89868'] as const;
const INK = rgba(PASTEL.ink, 0.62);

function seeded(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function getKittenCount(seed: number): number {
  return 2 + Math.floor(seeded(seed, 880) * 2);
}

/** Qual gatinho está mais perto do jogador */
export function kittenIndexAtPlayer(
  seed: number,
  playerX: number,
  platformX: number,
  platformW: number,
  count: number,
): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < count; i++) {
    const nx = 0.14 + (i / Math.max(1, count - 1)) * 0.72 + (seeded(seed, i + 881) - 0.5) * 0.06;
    const kx = platformX - platformW / 2 + nx * platformW;
    const d = Math.abs(playerX - kx);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

function drawKittenBody(
  ctx: CanvasRenderingContext2D,
  u: number,
  mx: number,
  my: number,
  scale: number,
  time: number,
  seed: number,
  fur: string,
  meowing: boolean,
): void {
  const su = u * scale;
  const tailWag = Math.sin(time * 5 + seed) * su * 1.8;

  // Rabo
  fillPx(ctx, mx + su * 4, my + su * 2 + tailWag * 0.3, su * 2, su, fur);
  fillPx(ctx, mx + su * 5.5, my + su * 0.5 + tailWag, su * 2, su * 2, fur);

  // Corpo sentado
  fillPx(ctx, mx - su * 3, my + su * 2, su * 7, su * 4.5, fur);
  fillPx(ctx, mx - su * 2, my + su * 3, su * 5, su * 3, rgba(PASTEL.white, 0.35));

  // Patas
  fillPx(ctx, mx - su * 2.5, my + su * 6, su * 2, su * 2, fur);
  fillPx(ctx, mx + su * 1.5, my + su * 6, su * 2, su * 2, fur);

  // Cabeça
  fillPx(ctx, mx - su * 3, my - su * 1, su * 6, su * 5, fur);
  fillPx(ctx, mx - su * 2, my, su * 4, su * 3, rgba(PASTEL.white, 0.4));

  // Orelhas
  fillPx(ctx, mx - su * 3.5, my - su * 3, su * 2, su * 2.5, fur);
  fillPx(ctx, mx + su * 1.5, my - su * 3, su * 2, su * 2.5, fur);
  fillPx(ctx, mx - su * 3, my - su * 2.5, su * 1.2, su * 1.5, rgba(PASTEL.rose, 0.55));
  fillPx(ctx, mx + su * 2, my - su * 2.5, su * 1.2, su * 1.5, rgba(PASTEL.rose, 0.55));

  // Bigodes
  fillPx(ctx, mx - su * 4.5, my + su * 1.5, su * 2, su * 0.5, INK);
  fillPx(ctx, mx + su * 2.5, my + su * 1.5, su * 2, su * 0.5, INK);
  fillPx(ctx, mx - su * 4, my + su * 2.5, su * 1.5, su * 0.5, INK);
  fillPx(ctx, mx + su * 2.5, my + su * 2.5, su * 1.5, su * 0.5, INK);

  // Olhos
  if (meowing) {
    fillPx(ctx, mx - su * 2, my + su * 0.5, su * 1.8, su * 2.2, INK);
    fillPx(ctx, mx + su * 0.5, my + su * 0.5, su * 1.8, su * 2.2, INK);
  } else {
    const blink = Math.floor(time * 0.85 + seed) % 9 === 0;
    if (blink) {
      fillPx(ctx, mx - su * 2, my + su * 1.5, su * 2, su, INK);
      fillPx(ctx, mx + su * 0.5, my + su * 1.5, su * 2, su, INK);
    } else {
      fillPx(ctx, mx - su * 2, my + su * 0.8, su * 1.8, su * 2.5, INK);
      fillPx(ctx, mx + su * 0.5, my + su * 0.8, su * 1.8, su * 2.5, INK);
      fillPx(ctx, mx - su * 1.5, my + su * 0.8, su, su, PASTEL.white);
      fillPx(ctx, mx + su, my + su * 0.8, su, su, PASTEL.white);
    }
  }

  // Focinho e boca
  fillPx(ctx, mx - su * 0.5, my + su * 2.5, su * 1.5, su * 1.2, rgba(PASTEL.white, 0.55));
  fillPx(ctx, mx - su * 0.2, my + su * 3, su, su, PASTEL.rose);
  if (meowing) {
    fillPx(ctx, mx - su * 0.8, my + su * 3.5, su * 2, su * 1.8, INK);
    fillPx(ctx, mx - su * 0.4, my + su * 4, su * 1.2, su, rgba(PASTEL.rose, 0.5));
  }
}

/** Almofada com gatinhos pixel — miam quando pisados */
export function drawKittenPlatform(
  ctx: CanvasRenderingContext2D,
  u: number,
  seed: number,
  time: number,
  wobble: number,
  cx: number,
  sy: number,
  w: number,
  h: number,
  mat: { fill: string; stroke: string; particle: string },
  press: number,
  meowFlash: number,
  meowIdx: number,
): void {
  const x = cx - w / 2;
  const squish = 1 - press * 0.06;

  // Almofada felpuda
  fillPx(ctx, x + u, sy + h * 0.45, w - u * 2, h * 0.55, mat.stroke);
  fillPx(ctx, x + u * 2, sy + h * 0.5, w - u * 4, h * 0.48 * squish, mat.fill);
  fillPx(ctx, x + u * 3, sy + h * 0.52, w - u * 6, u * 2, rgba(PASTEL.white, 0.28));
  fillPx(ctx, x + u * 2, sy + h - u, w - u * 4, u, rgba(mat.particle, 0.45));

  const count = getKittenCount(seed);
  for (let i = 0; i < count; i++) {
    const nx = 0.14 + (i / Math.max(1, count - 1)) * 0.72 + (seeded(seed, i + 881) - 0.5) * 0.06;
    const kx = x + nx * w;
    const bounce = Math.sin(time * 2.2 + i + wobble * 0.3) * u * 0.4;
    const ky = sy + h * 0.22 + bounce - press * u * 2;
    const scale = 0.95 + seeded(seed, i + 882) * 0.2;
    const fur = FUR_COLORS[Math.floor(seeded(seed, i + 883) * FUR_COLORS.length)]!;
    const meowing = meowFlash > 0.15 && i === meowIdx;
    drawKittenBody(ctx, u, kx, ky, scale, time, seed + i, fur, meowing);

    if (meowing && meowFlash > 0.4) {
      fillPx(ctx, kx + u * 3, ky - u * 4, u, u, rgba(PASTEL.butter, 0.85));
      fillPx(ctx, kx + u * 3.5, ky - u * 5, u, u, rgba(PASTEL.white, 0.7));
    }
  }
}
