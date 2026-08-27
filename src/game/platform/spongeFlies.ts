import { PASTEL, rgba } from '../../theme/pastelPalette';
import { fillPx } from '../../theme/pixel';

function seeded(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** ~45% das esponjas têm mosquinhas sobrevoando */
export function hasSpongeFlies(seed: number): boolean {
  return seeded(seed, 880) < 0.45;
}

export function getSpongeFlyCount(seed: number): number {
  return 2 + Math.floor(seeded(seed, 881) * 2);
}

function drawSingleFly(
  ctx: CanvasRenderingContext2D,
  u: number,
  fx: number,
  fy: number,
  time: number,
  idx: number,
): void {
  const body = rgba(PASTEL.ink, 0.72);
  const wingOpen = Math.sin(time * 52 + idx * 1.9) > 0;

  fillPx(ctx, fx, fy + u * 0.4, u, u * 1.1, body);
  fillPx(ctx, fx - u * 0.15, fy + u * 0.2, u * 0.55, u * 0.45, body);

  if (wingOpen) {
    fillPx(ctx, fx - u * 1.15, fy - u * 0.45, u, u * 0.55, rgba(PASTEL.white, 0.85));
    fillPx(ctx, fx + u * 0.35, fy - u * 0.45, u, u * 0.55, rgba(PASTEL.white, 0.85));
  } else {
    fillPx(ctx, fx - u * 0.95, fy - u * 0.1, u * 0.85, u * 0.35, rgba(PASTEL.mist, 0.6));
    fillPx(ctx, fx + u * 0.35, fy - u * 0.1, u * 0.85, u * 0.35, rgba(PASTEL.mist, 0.6));
  }
}

/** Mosquinhas orbitando acima da esponja — dispersam ao ser pisada */
export function drawSpongeFlies(
  ctx: CanvasRenderingContext2D,
  u: number,
  seed: number,
  time: number,
  wobble: number,
  cx: number,
  sy: number,
  w: number,
  scatterT: number,
  scatterY: number,
): void {
  if (!hasSpongeFlies(seed)) return;
  if (scatterT < 0) return;

  const flyCount = getSpongeFlyCount(seed);
  const fu = u * 1.05;

  for (let i = 0; i < flyCount; i++) {
    const orbitR = w * (0.1 + seeded(seed, i + 890) * 0.24);
    const speed = 2.4 + seeded(seed, i + 891) * 1.8;
    const ang = time * speed + i * 2.35 + wobble * 0.25;
    let fx = cx + Math.cos(ang) * orbitR + (seeded(seed, i + 892) - 0.5) * w * 0.1;
    let fy = sy - fu * (3.5 + Math.sin(time * 3.8 + i * 1.4) * 2.2);

    if (scatterT > 0) {
      const side = (i % 2 === 0 ? -1 : 1) * scatterT * w * 0.28;
      fx += side + Math.sin(scatterT * 24 + i * 2) * fu * 1.5;
      fy -= scatterY + scatterT * fu * 6;
    }

    let alpha = 1;
    if (scatterT > 0.55) alpha = Math.max(0, 1 - (scatterT - 0.55) / 0.85);
    if (alpha <= 0) continue;

    ctx.save();
    ctx.globalAlpha *= alpha;
    drawSingleFly(ctx, fu, fx, fy, time, i);
    ctx.restore();
  }
}

export function isSpongeFlyScatterDone(scatterT: number): boolean {
  return scatterT > 1.45;
}
