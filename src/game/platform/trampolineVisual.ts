import type { MaterialDef } from '../../audio/materials';
import { PASTEL, rgba } from '../../theme/pastelPalette';
import { fillPx } from '../../theme/pixel';
import { TRAMPOLINE } from './trampoline';

/**
 * Brinquedo de trampolim molengo: base fixa → mola ondulante → pad que se esparrama.
 * `compress` 0 = repouso, 1 = amassado, negativo = esticado no recoil.
 */
export function drawTrampolinePlatform(
  ctx: CanvasRenderingContext2D,
  x: number,
  restSy: number,
  w: number,
  u: number,
  compress: number,
  wobble: number,
  mat: MaterialDef,
  spent: boolean,
  vel = 0,
): void {
  const c = Math.max(-0.55, Math.min(1.15, compress));
  const mush = Math.max(0, c);
  const bounce = Math.min(1, Math.abs(vel) * 0.08);

  const padH = u * 2;
  const springRest = Math.max(u * 10, Math.round(TRAMPOLINE.compressDrop / 0.76 / u) * u);
  const springH = Math.max(
    u * 3,
    Math.round((springRest * (1 - c * 0.76)) / u) * u,
  );
  const padDrop = springRest - springH;
  const baseH = u * 5;
  const footH = u * 3;

  const lean = Math.round((Math.sin(wobble * 1.7) * u * (1.6 + bounce) * (spent ? 0.45 : 1)) / u) * u;
  const jiggleX = Math.round((Math.sin(wobble * 2.4) * u * (0.8 + mush * 1.2)) / u) * u;
  const sag = Math.round((mush * u * 2 + Math.sin(wobble * 4.1) * u * 0.5) / u) * u;

  const padTop = restSy + padDrop + sag;
  const springTop = padTop + padH;
  const baseTop = restSy + padH + springRest;
  const cx = x + w / 2 + jiggleX * 0.35;

  const frame = spent ? '#7A8490' : PASTEL.ink;
  const frameHi = spent ? '#9AA4B0' : '#8A94A0';
  const frameDeep = spent ? '#5A646E' : '#3E4852';
  const coilA = spent ? '#C8B8A4' : '#F0E2C4';
  const coilB = spent ? '#A89880' : '#D4BE8A';
  const coilEdge = spent ? '#8A7A66' : '#B89A6A';
  const pad = spent ? rgba(mat.stroke, 0.78) : mat.fill;
  const padRim = spent ? mat.stroke : mat.stroke;
  const wood = spent ? '#C4B4A0' : PASTEL.caramel;
  const woodHi = spent ? '#D4C8B8' : PASTEL.caramelDeep;

  fillPx(ctx, x - u, baseTop + baseH - u, w + u * 2, u * 2, rgba('#2A343C', 0.22));

  fillPx(ctx, x + u, baseTop + u, w - u * 2, baseH - u, frameDeep);
  fillPx(ctx, x, baseTop, w, baseH - u, wood);
  fillPx(ctx, x + u, baseTop, w - u * 2, u, woodHi);
  fillPx(ctx, x + u * 2, baseTop + u, w - u * 4, u, rgba(PASTEL.white, 0.22));

  fillPx(ctx, x - u, baseTop + baseH - footH, u * 4, footH, frame);
  fillPx(ctx, x + u, baseTop + baseH - footH, u * 2, u, frameHi);
  fillPx(ctx, x + w - u * 3, baseTop + baseH - footH, u * 4, footH, frame);
  fillPx(ctx, x + w - u * 3, baseTop + baseH - footH, u * 2, u, frameHi);
  fillPx(ctx, x + w * 0.28, baseTop + baseH - u * 2, u * 3, u * 2, frameDeep);
  fillPx(ctx, x + w * 0.72 - u * 3, baseTop + baseH - u * 2, u * 3, u * 2, frameDeep);

  const postW = u * 2;
  const postH = Math.max(u, baseTop - springTop);
  const postLean = Math.round((lean * 0.6) / u) * u;
  fillPx(ctx, x + u * 2 + postLean, springTop, postW, postH, frame);
  fillPx(ctx, x + u * 2 + postLean, springTop, u, postH, frameHi);
  fillPx(ctx, x + w - u * 4 - postLean, springTop, postW, postH, frame);
  fillPx(ctx, x + w - u * 4 - postLean, springTop, u, postH, frameHi);

  const plateW = Math.max(u * 8, w * 0.5 + mush * u * 2);
  fillPx(ctx, cx - plateW / 2, springTop, plateW, u, frameDeep);
  fillPx(ctx, cx - plateW / 2, baseTop - u, plateW, u, frameDeep);

  const coilW = Math.max(u * 8, w * (0.46 + mush * 0.18));
  drawFloppyCoil(
    ctx,
    cx,
    springTop + u,
    Math.max(u * 2, springH - u * 2),
    coilW,
    u,
    wobble,
    c,
    coilA,
    coilB,
    coilEdge,
  );

  const fat = Math.round((mush * u * 6 + bounce * u * 2) / u) * u;
  const padW = w + u * 4 + fat;
  const padX = x - u * 2 - fat / 2 + lean;
  const tilt = Math.round((Math.sin(wobble * 2.05) * u * (1.1 + mush * 0.8)) / u) * u;

  fillPx(ctx, padX, padTop, padW, padH, pad);
  fillPx(ctx, padX + u + tilt, padTop, padW - u * 2, u, rgba(PASTEL.white, spent ? 0.16 : 0.5));
  fillPx(ctx, padX, padTop + padH - u, padW, u, rgba(padRim, 0.55));
  fillPx(ctx, padX, padTop, u, padH, rgba(padRim, 0.32));
  fillPx(ctx, padX + padW - u, padTop + tilt, u, padH, rgba(padRim, 0.24));

  if (mush > 0.2) {
    const dip = Math.round((mush * u) / u) * u;
    fillPx(ctx, padX + padW * 0.28, padTop + padH - u + dip, padW * 0.44, u, rgba(padRim, 0.28));
  }

  fillPx(ctx, cx - u * 3 + lean, padTop, u * 6, u, rgba(PASTEL.white, spent ? 0.1 : 0.28));

  if (!spent) {
    fillPx(ctx, padX + padW * 0.16, padTop, u * 4, u, rgba(PASTEL.white, 0.48));
    const pulse = 0.5 + Math.sin(wobble * 3.6) * 0.5;
    if (pulse > 0.55) {
      fillPx(ctx, padX + padW * 0.62, padTop, u * 2, u, rgba(PASTEL.white, 0.28 * pulse));
    }
  }
}

function drawFloppyCoil(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  h: number,
  coilW: number,
  u: number,
  wobble: number,
  compress: number,
  colA: string,
  colB: string,
  edge: string,
): void {
  const mush = Math.max(0, compress);
  const coils = Math.max(4, Math.round(5 + mush * 2));
  const steps = Math.max(8, Math.round(h / u));
  const amp = coilW * (0.38 + mush * 0.22);
  let prevX = cx;
  let prevY = top;

  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const y = top + t * h;
    const wave = Math.sin(t * coils * Math.PI * 2 + wobble * 2.15) * amp;
    const wob = Math.sin(wobble * 1.8 + t * 3.4) * u * (1.2 + mush);
    const px = cx + wave + wob;
    const col = s % 2 === 0 ? colA : colB;
    const thick = u * (2 + (mush > 0.55 ? 1 : 0));
    fillPx(ctx, px - thick / 2, y, thick, u, col);
    fillPx(ctx, px - thick / 2 + u, y, Math.max(u, thick - u * 2), u, rgba(PASTEL.white, 0.22));
    if (s > 0) {
      const midY = (prevY + y) / 2;
      const midX = (prevX + px) / 2;
      fillPx(ctx, midX - u, midY, u * 2, u, edge);
    }
    prevX = px;
    prevY = y;
  }
}
