import { materialDetailStroke, rgba } from '../../theme/pastelPalette';
import { fillPx } from '../../theme/pixel';

/** Tons quentes — amarelo e laranja, sem rosa/branco */
const BUTTER_FILLS = [
  '#FFE878',
  '#FFD848',
  '#E8C030',
  '#F0B838',
  '#FFC860',
  '#F0A030',
  '#E89828',
] as const;

/** Paleta pote estilo margarina (referência Primor) */
const TUB = {
  red: '#D02828',
  redDark: '#A82020',
  redDeep: '#901818',
  orange: '#F07018',
  orangeLight: '#F88828',
  label: '#F0E0B8',
  labelYellow: '#F0C830',
  lid: '#C8D4DC',
  lidLight: '#E4ECF2',
  lidShadow: '#A8B4BC',
  base: '#ECECEC',
  ink: '#C02020',
} as const;

function seeded(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function shiftTone(hex: string, lift: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + Math.round(lift * 255)));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + Math.round(lift * 255)));
  const b = Math.max(0, Math.min(255, (n & 255) + Math.round(lift * 255)));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function butterPaletteIndex(seed: number): number {
  return Math.abs(Math.floor(seed / 983)) % BUTTER_FILLS.length;
}

/** ~38% das manteigas aparecem como pote */
export function isButterJar(seed: number): boolean {
  return seeded(seed, 871) < 0.38;
}

export function butterPreset(seed: number): {
  fill: string;
  particle: string;
  stroke: string;
  glow: string;
} {
  const fill = BUTTER_FILLS[butterPaletteIndex(seed)];
  return {
    fill,
    particle: shiftTone(fill, 0.08),
    stroke: materialDetailStroke(fill),
    glow: rgba(fill, 0.42),
  };
}

export const BUTTER_COLOR_COUNT = BUTTER_FILLS.length;

type ButterDrawArgs = {
  ctx: CanvasRenderingContext2D;
  cx: number;
  sy: number;
  w: number;
  h: number;
  mat: { fill: string; particle: string; stroke: string };
  u: number;
  seed: number;
  time: number;
  wobble: number;
  melt: number;
  press: number;
};

/** Logo pixelado inspirado no rótulo da referência */
function drawTubLogo(ctx: CanvasRenderingContext2D, cx: number, ly: number, u: number): void {
  const r = TUB.ink;
  fillPx(ctx, cx - u * 5, ly + u * 2, u * 2, u * 2, r);
  fillPx(ctx, cx - u * 5, ly + u, u, u * 3, r);
  fillPx(ctx, cx - u * 3, ly + u, u * 2, u * 3, r);
  fillPx(ctx, cx - u * 1, ly + u, u, u * 3, r);
  fillPx(ctx, cx, ly + u, u * 2, u * 2, r);
  fillPx(ctx, cx, ly, u * 2, u, r);
  fillPx(ctx, cx + u * 2, ly + u, u, u * 3, r);
  fillPx(ctx, cx + u * 3, ly + u * 2, u * 2, u, r);
  fillPx(ctx, cx + u * 2, ly + u * 3, u, u, TUB.labelYellow);
}

/** Pote de margarina pixelado — formato quadrado, rótulo creme, tampa reta */
export function drawButterJar(a: ButterDrawArgs): void {
  const { ctx, cx, sy, w, h, u, press } = a;
  const tubW = w * 0.94;
  const tx = cx - tubW / 2;
  const lidH = u * 3.5;
  const bodyTop = sy + lidH;
  const bodyH = h - lidH - u;

  fillPx(ctx, tx, sy + h - u, tubW, u * 2, rgba(TUB.redDeep, 0.28));

  fillPx(ctx, tx, bodyTop, tubW, bodyH, TUB.red);
  fillPx(ctx, tx, bodyTop, u, bodyH, TUB.redDark);
  fillPx(ctx, tx + tubW - u, bodyTop, u, bodyH, TUB.redDeep);
  fillPx(ctx, tx, bodyTop + bodyH - u, tubW, u, TUB.redDark);

  fillPx(ctx, tx + u, sy + h - u * 2, tubW - u * 2, u * 2, TUB.base);

  fillPx(ctx, tx + u * 2, bodyTop + bodyH * 0.24, tubW * 0.58, u * 4, TUB.orange);
  fillPx(ctx, tx + u * 4, bodyTop + bodyH * 0.32, tubW * 0.52, u * 3, TUB.orangeLight);

  fillPx(ctx, tx + u * 2, bodyTop + u * 2, u * 3, u * 3, TUB.base);
  fillPx(ctx, tx + u * 2.5, bodyTop + u * 3, u * 2, u, TUB.redDark);

  fillPx(ctx, cx - u * 3, bodyTop + u, u * 6, u * 2, TUB.orangeLight);
  fillPx(ctx, cx - u * 2, bodyTop + u * 1.15, u * 4, u * 0.8, TUB.base);

  const lw = tubW * 0.84;
  const lx = cx - lw / 2;
  const ly = bodyTop + bodyH * 0.3;
  fillPx(ctx, lx, ly, lw, u * 5, TUB.label);
  fillPx(ctx, lx, ly + u * 5, lw, u, TUB.labelYellow);
  drawTubLogo(ctx, cx, ly, u);

  fillPx(ctx, lx + u * 2, ly + u * 6, u * 5, u, TUB.base);
  fillPx(ctx, lx + u * 2.5, ly + u * 6.15, u, u * 0.7, TUB.red);

  fillPx(ctx, tx + tubW - u * 5, bodyTop + bodyH - u * 4, u * 4, u, TUB.base);
  fillPx(ctx, tx + tubW - u * 4.5, bodyTop + bodyH - u * 3.6, u * 3, u * 0.85, TUB.base);

  fillPx(ctx, tx, sy, tubW, lidH, TUB.lid);
  fillPx(ctx, tx + u, sy + u, tubW - u * 2, u * 1.5, TUB.lidLight);
  fillPx(ctx, tx, sy + lidH - u, tubW, u, TUB.lidShadow);
  fillPx(ctx, cx - u * 4, sy + u * 0.55, u * 3, u * 1.5, TUB.lidShadow);
  fillPx(ctx, cx + u * 2, sy + u * 0.55, u * 3, u * 1.5, TUB.lidShadow);

  if (press > 0.1) {
    fillPx(ctx, cx - u * 2, sy - u, u * 4, u, rgba(TUB.lidLight, 0.75));
  }
}
