import { PASTEL, rgba } from '../../theme/pastelPalette';
import { PIXEL, fillPx, fillPixelCircle } from '../../theme/pixel';

const HAT = '#D07070';
const HAT_DEEP = '#C05C5C';
const HAT_LIGHT = '#E09090';
const COAT = '#7EB0D4';
const COAT_DEEP = '#6A9CC4';
const COAT_LIGHT = '#A8CEE6';
const BELT = PASTEL.caramelDeep;
const BUCKLE = PASTEL.butter;
const SKIN = PASTEL.peach;
const BEARD = PASTEL.white;
const SHOE = PASTEL.inkSoft;

export interface GnomePose {
  flap: number;
  stretch: number;
  squash: number;
  smirk: boolean;
}

function drawWing(
  ctx: CanvasRenderingContext2D,
  u: number,
  ax: number,
  ay: number,
  spread: number,
  back: boolean,
): void {
  const open = 0.18 + spread * 0.82;
  const dir = back ? -1 : 1;
  const ww = u * (9 + open * 3);
  const lift = (open - 0.5) * u * 10;
  const thick = u * (1.6 + (1 - open) * 1.8);
  const membrane = rgba(PASTEL.white, back ? 0.55 : 0.82);
  const edge = rgba(PASTEL.sky, back ? 0.4 : 0.62);
  const ink = rgba(PASTEL.ink, back ? 0.16 : 0.28);

  const x0 = ax;
  const y0 = ay + lift * 0.15;
  fillPx(ctx, x0 - u * 0.4, y0 - thick * 0.3, u * 1.2, thick, ink);
  fillPx(ctx, x0 - ww * 0.35, y0 - thick * 0.15 + lift * 0.2, ww * 0.55, thick * 0.9, edge);
  fillPx(ctx, x0 - ww * 0.92, y0 + lift * 0.55, ww * 0.7, thick * 0.72, membrane);
  fillPx(ctx, x0 - ww * 1.05, y0 + lift * 0.85, ww * 0.42, thick * 0.5, rgba(PASTEL.mist, 0.7));
  fillPx(ctx, x0 - ww * 0.55, y0 + lift * 0.35, u * 0.7, thick * 0.35, rgba(PASTEL.sky, 0.35));
  fillPx(ctx, x0 - ww * 0.78, y0 + lift * 0.62, u * 0.55, thick * 0.28, rgba(PASTEL.white, 0.5));

  if (dir > 0) {
    fillPx(ctx, x0 - ww * 0.2, y0 - u * 0.4 + lift * 0.1, u * 0.9, u * 0.7, rgba(PASTEL.white, 0.35));
  }
}

/** Perfil voando para +X. Origem no peito. */
export function drawFiscalGnome(ctx: CanvasRenderingContext2D, pose: GnomePose): void {
  const u = PIXEL.unit;
  const sq = pose.squash;
  const st = pose.stretch;
  const flapA = 0.5 + 0.5 * Math.sin(pose.flap);
  const flapB = 0.5 + 0.5 * Math.sin(pose.flap + 0.85);
  const ink = rgba(PASTEL.ink, 0.42);
  const smirk = pose.smirk;

  ctx.save();
  ctx.scale(1.55 * sq, 1.55 * st);

  drawWing(ctx, u, u * -2.2, u * 0.4, flapB, true);

  fillPx(ctx, u * -1.2, u * 4.2, u * 2.4, u * 1.6, SHOE);
  fillPx(ctx, u * 1.4, u * 4.6, u * 2.2, u * 1.4, SHOE);
  fillPx(ctx, u * -0.6, u * 3.2, u * 4.8, u * 2.2, COAT_DEEP);
  fillPx(ctx, u * -0.2, u * 1.4, u * 5.6, u * 3.4, COAT);
  fillPx(ctx, u * 0.6, u * 1.8, u * 3.6, u * 2.2, COAT_LIGHT);
  fillPx(ctx, u * -0.1, u * 3.5, u * 5.2, u * 0.9, BELT);
  fillPx(ctx, u * 2.1, u * 3.4, u * 1.1, u * 1.1, BUCKLE);

  fillPx(ctx, u * 4.2, u * 1.8, u * 1.6, u * 1.4, COAT);
  fillPx(ctx, u * 5.4, u * 2.4, u * 1.2, u * 1.1, SKIN);

  fillPx(ctx, u * -2.8, u * -0.2, u * 4.2, u * 3.4, BEARD);
  fillPx(ctx, u * -3.6, u * 0.8, u * 2.4, u * 2.2, BEARD);
  fillPx(ctx, u * -4.2, u * 1.6, u * 1.6, u * 1.4, rgba(BEARD, 0.85));
  fillPx(ctx, u * -0.4, u * -1.6, u * 4.4, u * 3.8, SKIN);
  fillPx(ctx, u * 2.6, u * -0.4, u * 1.8, u * 2.2, SKIN);
  fillPx(ctx, u * 3.8, u * 0.2, u * 1.1, u * 1.2, SKIN);

  fillPx(ctx, u * 1.4, u * -0.6, u * 1.3, u * 1.3, ink);
  fillPx(ctx, u * 1.7, u * -0.45, u * 0.55, u * 0.55, PASTEL.white);
  if (smirk) {
    fillPx(ctx, u * 3.2, u * 1.15, u * 1.4, u * 0.55, PASTEL.rose);
  } else {
    fillPx(ctx, u * 3.1, u * 1.2, u * 1.1, u * 0.45, rgba(PASTEL.rose, 0.8));
  }

  fillPx(ctx, u * -1.8, u * -10.4, u * 2.2, u * 2.4, HAT);
  fillPx(ctx, u * -1.2, u * -9.2, u * 3.6, u * 3.2, HAT);
  fillPx(ctx, u * -0.4, u * -7.4, u * 5.2, u * 3.6, HAT);
  fillPx(ctx, u * 0.4, u * -5.4, u * 6.4, u * 2.8, HAT_LIGHT);
  fillPx(ctx, u * -1.6, u * -8.6, u * 1.6, u * 5.2, HAT_DEEP);
  fillPx(ctx, u * -2.2, u * -3.2, u * 8.4, u * 1.5, HAT);
  fillPx(ctx, u * -2.4, u * -2.6, u * 8.8, u * 0.7, rgba(PASTEL.white, 0.55));

  fillPx(ctx, u * -0.6, u * -1.8, u * 4.8, u * 0.55, ink);
  fillPx(ctx, u * 3.6, u * -0.2, u * 0.7, u * 0.7, ink);

  drawWing(ctx, u, u * -1.4, u * 0.2, flapA, false);

  fillPixelCircle(ctx, u * 2.8, u * -6.2, u * 0.7, rgba(PASTEL.white, 0.45));

  ctx.restore();
}
