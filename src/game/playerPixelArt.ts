import { PASTEL, PLAYER_PASTEL, rgba } from '../theme/pastelPalette';
import { PIXEL, fillPx, fillPixelCircle, px } from '../theme/pixel';

export const PLAYER_DRAW_W = 30;
export const PLAYER_DRAW_H = 30;

const u = PIXEL.unit;

/** Anéis horizontais do corpo — largura relativa × posição Y */
const BODY_ROWS: readonly [number, number][] = [
  [0.38, -0.44],
  [0.58, -0.36],
  [0.76, -0.24],
  [0.92, -0.1],
  [0.98, 0.04],
  [0.98, 0.18],
  [0.9, 0.3],
  [0.72, 0.38],
  [0.5, 0.42],
];

export interface PlayerBodyOptions {
  /** Corpo liso — uma cor só, sem faixas (banner) */
  solid?: boolean;
  /** Orelhinhas balançando (banner falando) */
  earWiggle?: number;
}

export interface PlayerFaceOptions {
  facing?: number;
  blinking?: boolean;
  /** Deslocamento extra do olhar (banner) */
  look?: number;
  /** Boca aberta — banner falando */
  mouthOpen?: boolean;
  animT?: number;
  showSparkle?: boolean;
  /** Expressão mais animada no banner */
  excited?: boolean;
}

function bodyColorForRow(index: number, total: number): string {
  if (index <= 1) return PLAYER_PASTEL.bodyTop;
  if (index >= total - 2) return PLAYER_PASTEL.bodyBot;
  return PLAYER_PASTEL.bodyMid;
}

function rowHeight(bh: number, index: number): number {
  const yy = BODY_ROWS[index]![1];
  const nextY = index < BODY_ROWS.length - 1 ? BODY_ROWS[index + 1]![1] : yy + 0.1;
  return Math.max(u * 2, px(bh * (nextY - yy)) + u);
}

function drawBodyOutline(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
): void {
  const ink = PLAYER_PASTEL.outline;
  for (const [ww, yy] of BODY_ROWS) {
    const rw = px(bw * ww);
    const ry = px(bh * yy);
    fillPx(ctx, -rw / 2, ry, u, u * 2, ink);
    fillPx(ctx, rw / 2 - u, ry, u, u * 2, ink);
  }
  fillPx(ctx, -bw * 0.22, bh * 0.4, u, u, ink);
  fillPx(ctx, bw * 0.2, bh * 0.4, u, u, ink);
}

function drawSolidBlobBody(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  animT: number,
  earWiggle = 0,
): void {
  const fill = PLAYER_PASTEL.bodySolid;
  const total = BODY_ROWS.length;

  for (let i = 0; i < total; i++) {
    const [ww, yy] = BODY_ROWS[i]!;
    const rw = px(bw * ww);
    const ry = px(bh * yy);
    fillPx(ctx, -rw / 2, ry, rw, rowHeight(bh, i), fill);
  }

  fillPixelCircle(ctx, 0, bh * 0.02, bw * 0.46, fill);

  const earBounce = earWiggle * u;
  fillPx(ctx, -bw * 0.36, -bh * 0.38 - earBounce, u * 2, u * 2, fill);
  fillPx(ctx, bw * 0.28, -bh * 0.38 + earBounce * 0.6, u * 2, u * 2, fill);
  fillPx(ctx, -bw * 0.34, -bh * 0.36 - earBounce, u, u, PLAYER_PASTEL.bodyHi);

  fillPx(ctx, -bw * 0.16, -bh * 0.32, bw * 0.32, u * 2, PLAYER_PASTEL.bodyHi);
  if (Math.sin(animT * 4) > 0.6) {
    fillPx(ctx, -bw * 0.06, -bh * 0.28, bw * 0.14, u, rgba(PASTEL.white, 0.4));
  }

  drawBodyOutline(ctx, bw, bh);
}

/** Corpo blob pixel — slime fofo com volume e brilho */
export function drawPlayerPixelBody(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  animT = 0,
  opts: PlayerBodyOptions = {},
): void {
  if (opts.solid) {
    drawSolidBlobBody(ctx, bw, bh, animT, opts.earWiggle ?? 0);
    return;
  }

  const total = BODY_ROWS.length;

  for (let i = 0; i < total; i++) {
    const [ww, yy] = BODY_ROWS[i]!;
    const rw = px(bw * ww);
    const ry = px(bh * yy);
    fillPx(ctx, -rw / 2, ry, rw, rowHeight(bh, i), bodyColorForRow(i, total));
  }

  fillPx(ctx, -bw * 0.44, -bh * 0.12, u, bh * 0.38, PLAYER_PASTEL.bodyShade);
  fillPx(ctx, -bw * 0.4, bh * 0.18, u, u * 3, PLAYER_PASTEL.bodyShade);

  fillPx(ctx, -bw * 0.18, -bh * 0.34, bw * 0.36, u * 2, PLAYER_PASTEL.bodyHi);
  fillPx(ctx, -bw * 0.1, -bh * 0.28, bw * 0.22, u, rgba(PASTEL.white, 0.45));

  if (Math.sin(animT * 3.5) > 0.55) {
    fillPx(ctx, bw * 0.14, -bh * 0.18, u, u, rgba(PASTEL.white, 0.55));
  }

  fillPx(ctx, -bw * 0.36, -bh * 0.38, u * 2, u * 2, PLAYER_PASTEL.bodyTop);
  fillPx(ctx, bw * 0.28, -bh * 0.38, u * 2, u * 2, PLAYER_PASTEL.bodyTop);
  fillPx(ctx, -bw * 0.34, -bh * 0.36, u, u, PLAYER_PASTEL.bodyHi);
  fillPx(ctx, bw * 0.3, -bh * 0.36, u, u, PLAYER_PASTEL.bodyHi);

  fillPx(ctx, -bw * 0.32, bh * 0.3, bw * 0.64, u * 2, PLAYER_PASTEL.bodyBot);

  drawBodyOutline(ctx, bw, bh);
}

export function drawPlayerPixelShadow(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  scale = 1,
): void {
  const spread = 0.42 + (scale - 1) * 0.04;
  fillPx(ctx, -bw * spread, bh * 0.4, bw * spread * 2, u * 2, PLAYER_PASTEL.shadow);
  fillPx(ctx, -bw * (spread - 0.14), bh * 0.42, bw * (spread - 0.14) * 2, u, rgba(PLAYER_PASTEL.shadow, 0.65));
}

/** Rosto, blush e olhos */
export function drawPlayerPixelFace(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  opts: PlayerFaceOptions = {},
): void {
  const facing = opts.facing ?? 1;
  const blinking = opts.blinking ?? false;
  const animT = opts.animT ?? 0;
  const mouthOpen = opts.mouthOpen ?? false;
  const excited = opts.excited ?? false;
  const look = (opts.look ?? 0) + facing;
  const eyeOff = 5 * facing;

  fillPx(ctx, -bw * 0.14, -bh * 0.32, bw * 0.28, u, rgba(PASTEL.white, 0.35));

  const blushAlpha = excited && mouthOpen ? 0.55 : 0.42;
  const blush = rgba(PASTEL.coral, blushAlpha);
  fillPx(ctx, -u * 5, u * 0.5, u * 2, u, blush);
  fillPx(ctx, -u * 4, u, u, u, blush);
  fillPx(ctx, u * 3, u * 0.5, u * 2, u, blush);
  fillPx(ctx, u * 4, u, u, u, blush);

  if (blinking) {
    fillPx(ctx, eyeOff - u * 3, -u, u * 3, u, PLAYER_PASTEL.eyeLine);
    fillPx(ctx, eyeOff + u * 2, -u, u * 3, u, PLAYER_PASTEL.eyeLine);
  } else {
    const eyeH = excited && mouthOpen ? u * 5 : u * 4;
    fillPx(ctx, eyeOff - u * 3 + look, -u * 2, u * 3, eyeH, PLAYER_PASTEL.eyeLine);
    fillPx(ctx, eyeOff + u * 2 + look, -u * 2, u * 3, eyeH, PLAYER_PASTEL.eyeLine);
    fillPx(ctx, eyeOff - u * 2 + look, -u * 3, u * 2, u * 2, PLAYER_PASTEL.eyeFill);
    fillPx(ctx, eyeOff + u * 3 + look, -u * 3, u * 2, u * 2, PLAYER_PASTEL.eyeFill);
    fillPx(ctx, eyeOff - u * 2 + look, -u * 3, u, u, PASTEL.white);
    fillPx(ctx, eyeOff + u * 3 + look, -u * 3, u, u, PASTEL.white);
    if (Math.sin(animT * 5) > 0.7) {
      fillPx(ctx, eyeOff - u + look, -u, u, u, rgba(PASTEL.white, 0.6));
      fillPx(ctx, eyeOff + u * 4 + look, -u, u, u, rgba(PASTEL.white, 0.6));
    }
  }

  if (mouthOpen) {
    const mouthH = excited ? u * 3 : u * 2;
    fillPx(ctx, eyeOff - u * 2, u * 2, u * 5, mouthH, PLAYER_PASTEL.eyeLine);
    fillPx(ctx, eyeOff - u, u * 3, u * 3, u, rgba(PASTEL.rose, 0.45));
    fillPx(ctx, eyeOff - u * 0.5, u * 2.5, u * 2, u, rgba(PASTEL.white, 0.35));
  } else {
    fillPx(ctx, eyeOff - u, u * 2, u * 2, u, PLAYER_PASTEL.eyeLine);
    fillPx(ctx, eyeOff + u * 2, u * 2, u * 2, u, PLAYER_PASTEL.eyeLine);
  }

  if (opts.showSparkle && Math.sin(animT * 4) > 0.94) {
    fillPx(ctx, bw * 0.3, -bh * 0.38, u, u, PASTEL.butter);
    fillPx(ctx, bw * 0.32, -bh * 0.4, u, u, rgba(PASTEL.white, 0.8));
  }
}
