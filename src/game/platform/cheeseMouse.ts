import { PASTEL, rgba } from '../../theme/pastelPalette';
import { fillPx } from '../../theme/pixel';

export type CheeseHole = readonly [number, number, number];

function seeded(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** ~42% dos queijos escondem um ratinho pixelado num furo */
export function hasCheeseMouse(seed: number): boolean {
  return seeded(seed, 900) < 0.42;
}

export function getCheeseMouseHoleIndex(seed: number, holeCount: number): number {
  return Math.floor(seeded(seed, 901) * holeCount) % holeCount;
}

export function getCheeseHolePosition(
  seed: number,
  holeIdx: number,
  holes: readonly CheeseHole[],
  x: number,
  w: number,
  sy: number,
  h: number,
  hop: number,
  u: number,
): { hx: number; hy: number; r: number } {
  const [nx, ny, r] = holes[holeIdx]!;
  return {
    hx: x + w * nx + (seeded(seed, holeIdx) - 0.5) * u * 2,
    hy: sy + h * ny + hop,
    r,
  };
}

function drawMouseBody(
  ctx: CanvasRenderingContext2D,
  u: number,
  mx: number,
  my: number,
  scale: number,
  time: number,
  seed: number,
  flee: boolean,
): void {
  const su = u * scale;
  const body = '#B8B0A8';
  const snout = '#D8D0C8';
  const ear = PASTEL.blush;
  const ink = rgba(PASTEL.ink, 0.62);

  fillPx(ctx, mx - su * 4.5, my + su * 2, su * 3, su, body);
  fillPx(ctx, mx - su * 5.5, my + su * 1.5, su * 2, su, rgba(body, 0.85));

  fillPx(ctx, mx - su * 2, my + su * 1.5, su * 5, su * 4.5, body);
  fillPx(ctx, mx - su * 1.5, my + su * 2, su * 4, su * 3, snout);

  fillPx(ctx, mx - su * 3.5, my - su * 3, su * 2.5, su * 2.5, ear);
  fillPx(ctx, mx + su * 1, my - su * 3, su * 2.5, su * 2.5, ear);
  fillPx(ctx, mx - su * 3, my - su * 2.5, su * 1.2, su * 1.2, rgba(PASTEL.rose, 0.65));
  fillPx(ctx, mx + su * 1.5, my - su * 2.5, su * 1.2, su * 1.2, rgba(PASTEL.rose, 0.65));

  fillPx(ctx, mx - su * 3, my - su * 1.5, su * 7, su * 5, body);
  fillPx(ctx, mx - su * 2, my - su * 0.5, su * 5, su * 3, snout);

  const blink = !flee && Math.floor(time * 0.9 + seed) % 7 === 0;
  if (blink) {
    fillPx(ctx, mx - su * 2, my + su * 0.5, su * 2.5, su, ink);
    fillPx(ctx, mx + su * 0.5, my + su * 0.5, su * 2.5, su, ink);
  } else {
    fillPx(ctx, mx - su * 2, my + su * 0.5, su * 1.5, su * 2.5, ink);
    fillPx(ctx, mx + su * 0.5, my + su * 0.5, su * 1.5, su * 2.5, ink);
    fillPx(ctx, mx - su * 1.5, my + su * 0.5, su, su, PASTEL.white);
    fillPx(ctx, mx + su, my + su * 0.5, su, su, PASTEL.white);
  }

  fillPx(ctx, mx + su * 0.5, my + su * 2, su * 1.2, su * 1.2, PASTEL.rose);

  fillPx(ctx, mx - su * 5, my + su * 2, su * 2.5, su, rgba(PASTEL.inkSoft, 0.45));
  fillPx(ctx, mx + su * 2.5, my + su * 2, su * 2.5, su, rgba(PASTEL.inkSoft, 0.45));
  fillPx(ctx, mx - su * 5, my + su * 3, su * 2, su, rgba(PASTEL.inkSoft, 0.35));
  fillPx(ctx, mx + su * 2.5, my + su * 3, su * 2, su, rgba(PASTEL.inkSoft, 0.35));

  fillPx(ctx, mx - su * 3.5, my + su * 4.5, su * 2, su * 2, body);
  fillPx(ctx, mx + su * 1.5, my + su * 4.5, su * 2, su * 2, body);

  if (flee) {
    fillPx(ctx, mx - su * 2, my + su * 0.2, su * 1.8, su * 2.2, PASTEL.white);
    fillPx(ctx, mx + su * 0.5, my + su * 0.2, su * 1.8, su * 2.2, PASTEL.white);
    fillPx(ctx, mx - su * 1.5, my + su * 0.8, su, su * 1.5, ink);
    fillPx(ctx, mx + su, my + su * 0.8, su, su * 1.5, ink);
  }
}

/** Ratinho no queijo — espreita ou foge ao ser pisado */
export function drawCheeseMouse(
  ctx: CanvasRenderingContext2D,
  u: number,
  seed: number,
  time: number,
  wobble: number,
  x: number,
  w: number,
  sy: number,
  h: number,
  hop: number,
  holes: readonly CheeseHole[],
  fleeT: number,
  fleeY: number,
): void {
  if (!hasCheeseMouse(seed)) return;
  if (fleeT < 0) return;

  const holeIdx = getCheeseMouseHoleIndex(seed, holes.length);
  const { hx, hy, r } = getCheeseHolePosition(seed, holeIdx, holes, x, w, sy, h, hop, u);
  const holeW = u * r;
  const mx = hx + holeW * 0.05;

  if (fleeT > 0) {
    const mxFlee = mx + Math.sin(fleeT * 18) * u * 0.8;
    const myFlee = hy + u * r * 0.2 + fleeY;
    const alpha = fleeY > h * 2.2 ? Math.max(0, 1 - (fleeY - h * 2.2) / (h * 1.5)) : 1;
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    drawMouseBody(ctx, u, mxFlee, myFlee, 1.15, time, seed, true);
    ctx.restore();
    return;
  }

  const peek = 0.78 + Math.max(0, Math.sin(time * 2.4 + seed * 0.4 + wobble * 0.2)) * 0.22;
  const emerge = peek * u * 7;
  const my = hy + u * r * 0.35 - emerge;

  fillPx(ctx, hx - u, hy - u, holeW + u * 2, u * r + u * 2, rgba(PASTEL.white, 0.18));

  drawMouseBody(ctx, u, mx, my, 1.2, time, seed, false);
}

/** Animação de fuga terminou — rato saiu de cena */
export function isCheeseMouseFleeDone(fleeT: number, fleeY: number, platformH: number): boolean {
  return fleeT > 0 && fleeY > platformH * 5.5;
}
