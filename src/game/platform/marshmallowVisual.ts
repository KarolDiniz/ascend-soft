import { rgba } from '../../theme/pastelPalette';
import { fillPx } from '../../theme/pixel';

/** Paleta fiel à referência — marshmallow torcido rosa + creme */
export const MARSHMALLOW_TWIST = {
  pinkHi: '#FFB8D0',
  pinkMid: '#FF78A8',
  pink: '#F05090',
  pinkDark: '#D03878',
  pinkDeep: '#B82868',
  creamHi: '#FFFFFF',
  creamMid: '#FAF4EE',
  cream: '#F5EDE5',
  creamDark: '#E0D8D0',
  creamDeep: '#D0C8C0',
} as const;

const MM = MARSHMALLOW_TWIST;

function twistColorAt(gCol: number, gRow: number, totalRows: number): string {
  const phase = (gCol * 1 + gRow * 1.55) / 5;
  const frac = phase - Math.floor(phase);
  const pink = Math.floor(phase) % 2 === 0;
  const edge = Math.min(frac, 1 - frac) * 2;
  const ny = gRow / Math.max(1, totalRows - 1);
  const light = (1 - ny) * 0.42 + (1 - ((gCol % 8) / 8)) * 0.12;

  if (edge < 0.1) return pink ? MM.pinkDeep : MM.creamDeep;
  if (pink) {
    if (light > 0.55 && edge > 0.32) return MM.pinkHi;
    if (light > 0.28) return edge > 0.36 ? MM.pinkMid : MM.pink;
    return MM.pinkDark;
  }
  if (light > 0.5 && edge > 0.32) return MM.creamHi;
  if (light > 0.24) return edge > 0.36 ? MM.creamMid : MM.cream;
  return MM.creamDark;
}

function scallopHalfWidth(row: number, rows: number, cols: number, seed: number): number {
  const t = row / Math.max(1, rows - 1);
  const wave = Math.sin(t * Math.PI * 2 + seed * 0.017) * 0.03;
  const top = 0.98;
  const belly = Math.sin(t * Math.PI) * 0.05;
  const bottomRound = t > 0.8 ? (t - 0.8) * 0.18 : 0;
  return (cols / 2) * Math.min(1, top + belly + wave - bottomRound);
}

/** Marshmallow torcido — pixel art fiel à referência (espiral rosa/creme) */
export function drawTwistedMarshmallowPlatform(
  ctx: CanvasRenderingContext2D,
  x: number,
  sy: number,
  w: number,
  h: number,
  u: number,
  squash: number,
  seed: number,
): void {
  const bodyTop = sy + squash;
  const bodyH = Math.max(u, h - squash);
  const cols = Math.ceil(w / u);
  const rows = Math.ceil(bodyH / u);
  const cx = x + w / 2;
  const baseCol = Math.floor(x / u);

  for (let row = 0; row < rows; row++) {
    const py = bodyTop + row * u;
    const halfW = scallopHalfWidth(row, rows, cols, seed);

    for (let col = 0; col < cols; col++) {
      const px = x + col * u;
      if (Math.abs(px + u / 2 - cx) > halfW) continue;

      const gCol = baseCol + col;
      const gRow = row;
      fillPx(ctx, px, py, u, u, twistColorAt(gCol, gRow, rows));
    }
  }

  // Brilho superior esquerdo (luz da referência)
  const hiRows = Math.max(1, Math.floor(rows * 0.24));
  for (let row = 0; row < hiRows; row++) {
    const py = bodyTop + row * u;
    const halfW = scallopHalfWidth(row, rows, cols, seed) * 0.7;
    fillPx(ctx, cx - halfW, py, Math.max(u, halfW * 0.5), u, rgba(MM.creamHi, 0.38));
    fillPx(ctx, cx - halfW * 0.8, py, u * 2, u, rgba(MM.pinkHi, 0.22));
  }

  // Sombra inferior direita
  const shStart = rows - Math.max(1, Math.floor(rows * 0.22));
  for (let row = shStart; row < rows; row++) {
    const py = bodyTop + row * u;
    const halfW = scallopHalfWidth(row, rows, cols, seed) * 0.62;
    fillPx(ctx, cx + halfW * 0.1, py, Math.max(u, halfW * 0.45), u, rgba(MM.pinkDeep, 0.28));
    fillPx(ctx, cx + halfW * 0.3, py, u * 2, u, rgba(MM.creamDeep, 0.34));
  }

  // Contorno suave nas cristas laterais
  for (let row = 1; row < rows - 1; row++) {
    const py = bodyTop + row * u;
    const halfW = scallopHalfWidth(row, rows, cols, seed);
    fillPx(ctx, cx - halfW - u * 0.05, py, u, u, rgba(MM.pinkDark, 0.16));
    fillPx(ctx, cx + halfW - u * 0.55, py, u, u, rgba(MM.pinkDeep, 0.2));
  }
}
