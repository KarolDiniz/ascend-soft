import { PASTEL, rgba } from '../../theme/pastelPalette';
import { fillPx } from '../../theme/pixel';

function seeded(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Todas as plataformas de mel têm abelhas */
export function getHoneyBeeCount(seed: number): number {
  return 4 + Math.floor(seeded(seed, 910) * 3);
}

/** ~24% dos favos têm o ursinho comendo mel */
export function hasHoneyPooh(seed: number): boolean {
  return seeded(seed, 911) < 0.24;
}

function drawSingleBee(
  ctx: CanvasRenderingContext2D,
  u: number,
  bx: number,
  by: number,
  time: number,
  idx: number,
): void {
  const stripe = '#2A2418';
  const yellow = '#F0C830';
  const wingOpen = Math.sin(time * 58 + idx * 2.1) > 0;

  fillPx(ctx, bx, by + u * 0.35, u * 1.1, u, yellow);
  fillPx(ctx, bx + u * 0.15, by + u * 0.45, u * 0.75, u * 0.55, stripe);
  fillPx(ctx, bx + u * 0.55, by + u * 0.35, u * 0.45, u * 0.65, yellow);
  fillPx(ctx, bx - u * 0.1, by + u * 0.2, u * 0.35, u * 0.35, rgba(stripe, 0.85));

  if (wingOpen) {
    fillPx(ctx, bx - u * 1.2, by - u * 0.35, u * 1.1, u * 0.5, rgba(PASTEL.white, 0.82));
    fillPx(ctx, bx + u * 0.35, by - u * 0.35, u * 1.1, u * 0.5, rgba(PASTEL.white, 0.82));
  } else {
    fillPx(ctx, bx - u, by - u * 0.05, u * 0.9, u * 0.28, rgba(PASTEL.mist, 0.55));
    fillPx(ctx, bx + u * 0.35, by - u * 0.05, u * 0.9, u * 0.28, rgba(PASTEL.mist, 0.55));
  }
}

/** Abelhas orbitando o favo — dispersam ao pisar */
export function drawHoneyBees(
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
  if (scatterT < 0) return;

  const beeCount = getHoneyBeeCount(seed);
  const bu = u * 1.05;

  for (let i = 0; i < beeCount; i++) {
    const orbitR = w * (0.14 + seeded(seed, i + 920) * 0.32);
    const speed = 2.8 + seeded(seed, i + 921) * 2.2;
    const ang = time * speed + i * 1.85 + wobble * 0.3;
    let bx = cx + Math.cos(ang) * orbitR + (seeded(seed, i + 922) - 0.5) * w * 0.12;
    let by = sy - bu * (2.8 + Math.sin(time * 4.2 + i * 1.6) * 2.8);

    if (scatterT > 0) {
      const side = (i % 2 === 0 ? -1 : 1) * scatterT * w * 0.32;
      bx += side + Math.sin(scatterT * 26 + i * 2.3) * bu * 1.6;
      by -= scatterY + scatterT * bu * 7;
    }

    let alpha = 1;
    if (scatterT > 0.5) alpha = Math.max(0, 1 - (scatterT - 0.5) / 0.9);
    if (alpha <= 0) continue;

    ctx.save();
    ctx.globalAlpha *= alpha;
    drawSingleBee(ctx, bu, bx, by, time, i);
    ctx.restore();
  }
}

/** Ursinho Pooh pixel — sentado no favo com pote de mel */
export function drawHoneyPooh(
  ctx: CanvasRenderingContext2D,
  u: number,
  seed: number,
  time: number,
  x: number,
  sy: number,
  w: number,
): void {
  if (!hasHoneyPooh(seed)) return;

  const side = seeded(seed, 912) < 0.5 ? -1 : 1;
  const px = x + w * (side > 0 ? 0.68 : 0.22);
  const py = sy - u * 2 + Math.sin(time * 2.2 + seed * 0.02) * u * 0.35;
  const wave = Math.sin(time * 4.5 + seed) * u * 0.8;

  const fur = '#F0C038';
  const furHi = '#F8D858';
  const furLo = '#D8A828';
  const shirt = '#E04838';
  const shirtLo = '#C03028';
  const ink = rgba(PASTEL.ink, 0.75);

  // Corpo sentado
  fillPx(ctx, px - u * 2.5, py + u * 2, u * 5, u * 3.5, fur);
  fillPx(ctx, px - u * 3, py + u * 3, u * 2, u * 2.5, furLo);
  fillPx(ctx, px + u, py + u * 3, u * 2, u * 2.5, furLo);

  // Camiseta vermelha
  fillPx(ctx, px - u * 2, py + u * 3, u * 4, u * 2.2, shirt);
  fillPx(ctx, px - u * 2.5, py + u * 4.5, u * 5, u * 0.8, shirtLo);

  // Cabeça redonda
  fillPx(ctx, px - u * 2.5, py - u * 3, u * 5, u * 5, fur);
  fillPx(ctx, px - u * 2, py - u * 2.5, u * 4, u * 4, furHi);

  // Orelhas
  fillPx(ctx, px - u * 3.5, py - u * 4.5, u * 2.2, u * 2.2, fur);
  fillPx(ctx, px + u * 1.2, py - u * 4.5, u * 2.2, u * 2.2, fur);
  fillPx(ctx, px - u * 3, py - u * 4, u * 1.2, u * 1.2, furLo);
  fillPx(ctx, px + u * 1.7, py - u * 4, u * 1.2, u * 1.2, furLo);

  // Focinho
  fillPx(ctx, px - u * 1.5, py - u * 0.5, u * 3, u * 2, furHi);
  fillPx(ctx, px - u * 0.8, py, u * 1.6, u * 1.2, '#F8E8C8');

  // Olhos e nariz
  fillPx(ctx, px - u * 1.2, py - u * 1.2, u, u * 1.2, ink);
  fillPx(ctx, px + u * 0.3, py - u * 1.2, u, u * 1.2, ink);
  fillPx(ctx, px - u * 0.5, py - u * 0.2, u, u, ink);

  // Pata no mel / acenando
  fillPx(ctx, px + side * u * 2.5 + wave, py + u * 1.5, u * 1.8, u * 1.8, fur);
  fillPx(ctx, px + side * u * 3 + wave, py + u * 2.5, u * 1.2, u * 1.2, furHi);

  // Pote de mel
  const potX = px - side * u * 3.5;
  const potY = py + u * 4;
  fillPx(ctx, potX, potY, u * 2.5, u * 2, PASTEL.honey);
  fillPx(ctx, potX - u * 0.3, potY - u, u * 3, u, rgba(PASTEL.honey, 0.85));
  fillPx(ctx, potX + u * 0.5, potY + u * 0.3, u, u, rgba('#FFFFFF', 0.45));
  fillPx(ctx, potX + u * 0.3, potY + u * 1.2, u * 1.4, u * 0.5, PASTEL.honey);
}

export function isHoneyBeeScatterDone(scatterT: number): boolean {
  return scatterT > 1.45;
}
