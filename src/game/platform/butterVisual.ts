import { PASTEL, rgba } from '../../theme/pastelPalette';
import { fillPx } from '../../theme/pixel';

/** Tons distintos de manteiga por instância */
const BUTTER_FILLS = [
  '#FFE08A',
  '#FFF0B8',
  '#F5D878',
  '#FFE898',
  '#F8E8C0',
  '#FFD890',
] as const;

export type ButterGarnish = 'salt' | 'honey';

function seeded(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function butterPaletteIndex(seed: number): number {
  return Math.abs(Math.floor(seed / 971)) % BUTTER_FILLS.length;
}

function shiftTone(hex: string, lift: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) + Math.round(lift * 255));
  const g = Math.min(255, ((n >> 8) & 255) + Math.round(lift * 255));
  const b = Math.min(255, (n & 255) + Math.round(lift * 255));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function butterColorPreset(seed: number): {
  fill: string;
  particle: string;
  glow: string;
} {
  const fill = BUTTER_FILLS[butterPaletteIndex(seed)];
  return {
    fill,
    particle: shiftTone(fill, 0.22),
    glow: rgba(fill, 0.42),
  };
}

export function getButterGarnish(seed: number): ButterGarnish {
  return seeded(seed, 850) < 0.52 ? 'salt' : 'honey';
}

export function drawButterGarnish(
  ctx: CanvasRenderingContext2D,
  seed: number,
  x: number,
  sy: number,
  w: number,
  h: number,
  u: number,
  time: number,
): void {
  const garnish = getButterGarnish(seed);
  const gx = x + w * (0.14 + seeded(seed, 851) * 0.38);
  const gy = sy + h * (0.22 + seeded(seed, 852) * 0.42);

  if (garnish === 'salt') {
    const crystals = 6 + Math.floor(seeded(seed, 853) * 4);
    for (let i = 0; i < crystals; i++) {
      const cx = gx + (seeded(seed, i + 860) - 0.5) * u * 5;
      const cy = gy + (seeded(seed, i + 870) - 0.5) * u * 3;
      fillPx(ctx, cx, cy, u, u, rgba('#FFFFFF', 0.82));
      if (i % 2 === 0) fillPx(ctx, cx + u * 0.5, cy - u * 0.5, u, u, rgba('#FFFFFF', 0.55));
    }
    fillPx(ctx, gx - u, gy + u, u * 3, u, rgba('#FFFFFF', 0.35));
  } else {
    const hx = x + w * (0.62 + seeded(seed, 854) * 0.22);
    const hy = sy + u * (0.8 + seeded(seed, 855) * 1.2);
    const honey = PASTEL.honey;
    const drip = u * (2 + Math.floor(seeded(seed, 856) * 2));
    fillPx(ctx, hx, hy, u * 2, u * 2, honey);
    fillPx(ctx, hx + u * 0.5, hy + u * 2, u, drip, honey);
    fillPx(ctx, hx - u * 0.5, hy + u * 2 + drip - u, u * 2, u, rgba(honey, 0.85));
    fillPx(ctx, hx, hy + u * 2 + drip, u, u * 2, rgba(honey, 0.7));
    const wobble = Math.sin(time * 3.2 + seed * 0.01) * u * 0.4;
    fillPx(ctx, hx + u + wobble, hy + u, u, u, rgba('#FFFFFF', 0.45));
  }
}

/** Faca de manteiga cravada na taveta — posição varia levemente por seed */
export function drawButterKnife(
  ctx: CanvasRenderingContext2D,
  seed: number,
  x: number,
  sy: number,
  w: number,
  h: number,
  u: number,
  butterFill: string,
): void {
  const placement = seeded(seed, 840) < 0.45 ? -1 : 1;
  const ox = x + w * (0.5 + placement * (0.22 + seeded(seed, 841) * 0.12));
  const oy = sy + u;
  const bladeDir = -placement;

  const handle = '#C8B898';
  const handleHi = '#E4D8C4';
  const handleLo = '#A09070';
  const blade = '#A0ACB8';
  const bladeLo = '#889098';

  // Cabo — pequeno, vertical
  fillPx(ctx, ox - u, oy - u * 6, u * 2, u * 6, handle);
  fillPx(ctx, ox - u * 1.5, oy - u * 5, u, u * 4, handleLo);
  fillPx(ctx, ox + u * 0.5, oy - u * 5, u, u * 4, handleHi);
  fillPx(ctx, ox - u * 1.5, oy - u * 6, u * 3, u, handleHi);
  fillPx(ctx, ox - u * 0.5, oy - u * 7, u * 2, u, rgba(PASTEL.blush, 0.35));

  // Lâmina — diagonal cravada na manteiga, apontando para o centro
  for (let i = 0; i < 6; i++) {
    const bx = ox + bladeDir * i * u * 1.1 - u * 0.5;
    const by = oy + i * u * 0.85;
    const bw = u * (3.2 - i * 0.2);
    fillPx(ctx, bx, by, bw, u, i < 2 ? blade : bladeLo);
  }
  const tipX = ox + bladeDir * u * 5.5 - u * 0.5;
  const tipY = oy + u * 5;
  fillPx(ctx, tipX, tipY, u * 2, u, butterFill);
  fillPx(ctx, tipX + bladeDir * u * 0.6, tipY - u, u, u, rgba(butterFill, 0.75));
  fillPx(ctx, ox + bladeDir * u * 0.8, oy + u * 0.5, u * 2, u, rgba('#FFFFFF', 0.42));

  // Marca de corte sob a ponta
  fillPx(ctx, tipX - u, sy + h - u, u * 4, u, rgba(butterFill, 0.55));
}

export const BUTTER_COLOR_COUNT = BUTTER_FILLS.length;
