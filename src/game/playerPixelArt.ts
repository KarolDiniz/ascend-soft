import { PASTEL, PLAYER_PASTEL, rgba } from '../theme/pastelPalette';
import { PIXEL, fillPx, px } from '../theme/pixel';

export const PLAYER_DRAW_W = 30;
export const PLAYER_DRAW_H = 30;

/** Corpo blob pixel — igual ao jogador principal */
export function drawPlayerPixelBody(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
): void {
  const u = PIXEL.unit;
  const rows: [number, number][] = [
    [0.45, -0.42],
    [0.7, -0.3],
    [0.88, -0.14],
    [0.95, 0.02],
    [0.95, 0.18],
    [0.82, 0.32],
    [0.55, 0.42],
  ];
  for (const [ww, yy] of rows) {
    const rw = px(bw * ww);
    const ry = px(bh * yy);
    fillPx(ctx, -rw / 2, ry, rw, u * 2, PLAYER_PASTEL.bodyMid);
  }
  fillPx(ctx, -bw * 0.28, -bh * 0.28, bw * 0.55, u * 2, PLAYER_PASTEL.bodyTop);
  fillPx(ctx, -bw * 0.35, bh * 0.28, bw * 0.7, u * 2, PLAYER_PASTEL.bodyBot);
  fillPx(ctx, -bw * 0.42, -bh * 0.1, u, u, rgba(PASTEL.inkSoft, 0.35));
  fillPx(ctx, bw * 0.38, -bh * 0.1, u, u, rgba(PASTEL.inkSoft, 0.35));
}

export function drawPlayerPixelShadow(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
): void {
  const u = PIXEL.unit;
  fillPx(ctx, -bw * 0.4, bh * 0.42, bw * 0.8, u * 2, PLAYER_PASTEL.shadow);
}

export interface PlayerFaceOptions {
  facing?: number;
  blinking?: boolean;
  /** Boca aberta — só no banner falando */
  mouthOpen?: boolean;
  animT?: number;
  showSparkle?: boolean;
}

/** Rosto, blush e olhos — mesma lógica do Player */
export function drawPlayerPixelFace(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  opts: PlayerFaceOptions = {},
): void {
  const u = PIXEL.unit;
  const facing = opts.facing ?? 1;
  const blinking = opts.blinking ?? false;
  const animT = opts.animT ?? 0;

  fillPx(ctx, -bw * 0.22, -bh * 0.28, u * 3, u * 2, rgba(PASTEL.white, 0.75));

  const bx = 7 * facing;
  fillPx(ctx, -bx - u * 2, u, u * 2, u, PLAYER_PASTEL.blush);
  fillPx(ctx, bx, u, u * 2, u, PLAYER_PASTEL.blush);

  const eyeBase = 4 * facing;
  if (blinking) {
    fillPx(ctx, eyeBase - 6, -u, u * 3, u, rgba(PASTEL.ink, 0.55));
    fillPx(ctx, eyeBase + 3, -u, u * 3, u, rgba(PASTEL.ink, 0.55));
  } else {
    const look = facing;
    fillPx(ctx, eyeBase - 6 + look, -u * 2, u * 2, u * 3, rgba(PASTEL.ink, 0.55));
    fillPx(ctx, eyeBase + 4 + look, -u * 2, u * 2, u * 3, rgba(PASTEL.ink, 0.55));
    fillPx(ctx, eyeBase - 5 + look, -u * 3, u, u, PASTEL.white);
    fillPx(ctx, eyeBase + 5 + look, -u * 3, u, u, PASTEL.white);
  }

  if (opts.mouthOpen) {
    fillPx(ctx, eyeBase - 2, u * 2, u * 4, u * 2, rgba(PASTEL.ink, 0.4));
    fillPx(ctx, eyeBase - 1, u * 3, u * 2, u, rgba(PASTEL.inkSoft, 0.3));
  }

  if (opts.showSparkle && Math.sin(animT * 4) > 0.94) {
    fillPx(ctx, bw * 0.28, -bh * 0.35, u, u, PASTEL.butter);
  }
}
