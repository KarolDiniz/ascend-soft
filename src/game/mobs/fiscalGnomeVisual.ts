import { PASTEL, rgba } from '../../theme/pastelPalette';
import { fillPx } from '../../theme/pixel';

/** Gnomo pixelado, origem no peito. +X = frente (aplicar scale de facing no caller). */
export function drawFiscalGnome(
  ctx: CanvasRenderingContext2D,
  u: number,
  time: number,
  squash: number,
  stretch: number,
): void {
  const sx = squash;
  const sy = stretch;
  const ink = rgba(PASTEL.ink, 0.7);
  const hat = PASTEL.coral;
  const hatDeep = PASTEL.rose;
  const skin = PASTEL.peach;
  const beard = PASTEL.white;
  const coat = PASTEL.seafoam;
  const coatDeep = PASTEL.mint;
  const belt = PASTEL.caramel;
  const shoe = PASTEL.caramelDeep;

  const wingOpen = Math.sin(time * 54) > 0;
  if (wingOpen) {
    fillPx(ctx, u * -5.2 * sx, u * -1.2 * sy, u * 3.2 * sx, u * 1.6 * sy, rgba(PASTEL.white, 0.88));
    fillPx(ctx, u * 2.2 * sx, u * -1.2 * sy, u * 3.2 * sx, u * 1.6 * sy, rgba(PASTEL.white, 0.88));
  } else {
    fillPx(ctx, u * -4.4 * sx, u * -0.4 * sy, u * 2.6 * sx, u * 0.9 * sy, rgba(PASTEL.mist, 0.62));
    fillPx(ctx, u * 1.8 * sx, u * -0.4 * sy, u * 2.6 * sx, u * 0.9 * sy, rgba(PASTEL.mist, 0.62));
  }

  fillPx(ctx, u * -0.6 * sx, u * -8.6 * sy, u * 1.2 * sx, u * 2.2 * sy, hat);
  fillPx(ctx, u * -1.8 * sx, u * -7.2 * sy, u * 3.6 * sx, u * 2.4 * sy, hat);
  fillPx(ctx, u * -2.6 * sx, u * -5.4 * sy, u * 5.2 * sx, u * 1.8 * sy, hatDeep);
  fillPx(ctx, u * -3.2 * sx, u * -4.2 * sy, u * 6.4 * sx, u * 1.1 * sy, PASTEL.white);

  fillPx(ctx, u * -2.2 * sx, u * -3.4 * sy, u * 4.4 * sx, u * 3.2 * sy, skin);
  fillPx(ctx, u * -1.6 * sx, u * -2.6 * sy, u * 1.1 * sx, u * 1.3 * sy, ink);
  fillPx(ctx, u * 0.6 * sx, u * -2.6 * sy, u * 1.1 * sx, u * 1.3 * sy, ink);
  fillPx(ctx, u * -1.3 * sx, u * -2.4 * sy, u * 0.5 * sx, u * 0.5 * sy, PASTEL.white);
  fillPx(ctx, u * 0.9 * sx, u * -2.4 * sy, u * 0.5 * sx, u * 0.5 * sy, PASTEL.white);
  fillPx(ctx, u * -0.4 * sx, u * -1.4 * sy, u * 0.8 * sx, u * 0.7 * sy, PASTEL.rose);

  fillPx(ctx, u * -2.8 * sx, u * -0.6 * sy, u * 5.6 * sx, u * 2.4 * sy, beard);
  fillPx(ctx, u * -2.2 * sx, u * 1.2 * sy, u * 4.4 * sx, u * 1.4 * sy, beard);

  fillPx(ctx, u * -2.4 * sx, u * 2.2 * sy, u * 4.8 * sx, u * 3.6 * sy, coat);
  fillPx(ctx, u * -1.6 * sx, u * 2.6 * sy, u * 3.2 * sx, u * 2.4 * sy, coatDeep);
  fillPx(ctx, u * -2.2 * sx, u * 3.4 * sy, u * 4.4 * sx, u * 0.8 * sy, belt);

  fillPx(ctx, u * -3.6 * sx, u * 2.4 * sy, u * 1.4 * sx, u * 1.8 * sy, coat);
  fillPx(ctx, u * 2.2 * sx, u * 2.4 * sy, u * 1.4 * sx, u * 1.8 * sy, coat);

  fillPx(ctx, u * -2.0 * sx, u * 5.6 * sy, u * 1.6 * sx, u * 1.5 * sy, shoe);
  fillPx(ctx, u * 0.4 * sx, u * 5.6 * sy, u * 1.6 * sx, u * 1.5 * sy, shoe);
}
