import type { AchievementIcon } from '../game/achievements/definitions';

type Px = [number, number, string];

function drawPixels(
  ctx: CanvasRenderingContext2D,
  u: number,
  pixels: Px[],
  ox = 0,
  oy = 0,
): void {
  for (const [x, y, color] of pixels) {
    ctx.fillStyle = color;
    ctx.fillRect((ox + x) * u, (oy + y) * u, u, u);
  }
}

const INK = '#5a616c';
const BUTTER = '#fff6dc';
const MINT = '#c9e4de';
const CORAL = '#e8a090';
const GOLD = '#e2b84a';
const SKY = '#a8d4e6';
const LILAC = '#d4c4e8';
const PEACH = '#f0c8a8';
const GNOME_HAT = '#d07070';
const GNOME_COAT = '#7eb0d4';
const GNOME_BEARD = '#fffcf8';
const POTION = '#6eb5e8';
const POTION_GLOW = '#b8e4ff';
const GRASS = '#b8d4a0';
const ROSE = '#e09090';

/** Fiscal pixelado — chapéu vermelho, casaco azul, barba branca */
function drawFiscalBase(ctx: CanvasRenderingContext2D, u: number, mad = false): void {
  drawPixels(ctx, u, [
    [6, 1, GNOME_HAT], [7, 1, GNOME_HAT], [8, 1, GNOME_HAT], [9, 1, GNOME_HAT],
    [5, 2, GNOME_HAT], [6, 2, GNOME_HAT], [7, 2, GNOME_HAT], [8, 2, GNOME_HAT], [9, 2, GNOME_HAT], [10, 2, GNOME_HAT],
    [7, 3, GNOME_HAT], [8, 3, GNOME_HAT],
    [4, 4, GNOME_BEARD], [5, 4, GNOME_BEARD], [6, 4, GNOME_BEARD], [7, 4, PEACH], [8, 4, PEACH], [9, 4, GNOME_BEARD], [10, 4, GNOME_BEARD], [11, 4, GNOME_BEARD],
    [3, 5, GNOME_BEARD], [4, 5, GNOME_BEARD], [5, 5, GNOME_BEARD], [6, 5, PEACH], [7, 5, PEACH], [8, 5, PEACH], [9, 5, GNOME_BEARD], [10, 5, GNOME_BEARD], [11, 5, GNOME_BEARD], [12, 5, GNOME_BEARD],
    [4, 6, GNOME_BEARD], [5, 6, GNOME_BEARD], [6, 6, mad ? ROSE : INK], [7, 6, INK], [8, 6, INK], [9, 6, mad ? ROSE : INK], [10, 6, GNOME_BEARD], [11, 6, GNOME_BEARD],
    [5, 7, GNOME_COAT], [6, 7, GNOME_COAT], [7, 7, GNOME_COAT], [8, 7, GNOME_COAT], [9, 7, GNOME_COAT], [10, 7, GNOME_COAT],
    [4, 8, GNOME_COAT], [5, 8, GNOME_COAT], [6, 8, GNOME_COAT], [7, 8, GOLD], [8, 8, GOLD], [9, 8, GNOME_COAT], [10, 8, GNOME_COAT], [11, 8, GNOME_COAT],
    [5, 9, INK], [6, 9, INK], [9, 9, INK], [10, 9, INK],
  ]);
}

export function drawAchievementIcon(
  ctx: CanvasRenderingContext2D,
  icon: AchievementIcon,
  size = 32,
): void {
  const u = size / 16;
  ctx.clearRect(0, 0, size, size);
  ctx.imageSmoothingEnabled = false;

  switch (icon) {
    case 'skull':
      drawPixels(ctx, u, [
        [5, 3, INK], [6, 3, INK], [7, 3, INK], [8, 3, INK], [9, 3, INK], [10, 3, INK],
        [4, 4, INK], [11, 4, INK], [4, 5, INK], [11, 5, INK],
        [5, 4, BUTTER], [6, 4, BUTTER], [7, 4, BUTTER], [8, 4, BUTTER], [9, 4, BUTTER], [10, 4, BUTTER],
        [5, 5, BUTTER], [6, 5, BUTTER], [7, 5, BUTTER], [8, 5, BUTTER], [9, 5, BUTTER], [10, 5, BUTTER],
        [6, 6, INK], [9, 6, INK], [7, 8, INK], [8, 8, INK],
        [6, 9, INK], [7, 9, INK], [8, 9, INK], [9, 9, INK],
        [5, 10, INK], [10, 10, INK], [6, 11, INK], [9, 11, INK],
      ]);
      break;
    case 'floor':
      drawPixels(ctx, u, [
        [3, 10, INK], [4, 10, INK], [5, 10, INK], [6, 10, INK], [7, 10, INK], [8, 10, INK], [9, 10, INK], [10, 10, INK], [11, 10, INK], [12, 10, INK],
        [3, 11, GRASS], [4, 11, GRASS], [5, 11, GRASS], [6, 11, GRASS], [7, 11, GRASS], [8, 11, GRASS], [9, 11, GRASS], [10, 11, GRASS], [11, 11, GRASS], [12, 11, GRASS],
        [4, 12, GRASS], [5, 12, GRASS], [6, 12, GRASS], [7, 12, GRASS], [8, 12, GRASS], [9, 12, GRASS], [10, 12, GRASS], [11, 12, GRASS],
        [7, 6, INK], [8, 6, INK], [7, 7, CORAL], [8, 7, CORAL], [7, 8, CORAL], [8, 8, CORAL],
        [6, 9, CORAL], [7, 9, CORAL], [8, 9, CORAL], [9, 9, CORAL],
      ]);
      break;
    case 'gravity':
      drawPixels(ctx, u, [
        [7, 2, INK], [8, 2, INK], [6, 3, SKY], [7, 3, SKY], [8, 3, SKY], [9, 3, SKY],
        [7, 4, INK], [8, 4, INK], [7, 5, INK], [8, 5, INK], [7, 6, INK], [8, 6, INK],
        [6, 7, INK], [7, 7, INK], [8, 7, INK], [9, 7, INK],
        [7, 8, INK], [8, 8, INK], [6, 9, CORAL], [7, 9, CORAL], [8, 9, CORAL], [9, 9, CORAL],
        [7, 10, CORAL], [8, 10, CORAL], [7, 11, CORAL], [8, 11, CORAL], [7, 12, CORAL], [8, 12, CORAL],
      ]);
      break;
    case 'impact':
      drawPixels(ctx, u, [
        [7, 2, INK], [8, 2, INK], [5, 3, INK], [6, 3, INK], [9, 3, INK], [10, 3, INK],
        [4, 4, INK], [11, 4, INK], [3, 5, INK], [12, 5, INK], [3, 6, INK], [12, 6, INK],
        [4, 7, INK], [11, 7, INK], [5, 8, INK], [10, 8, INK],
        [3, 9, INK], [4, 9, INK], [5, 9, INK], [6, 9, INK], [7, 9, INK], [8, 9, INK], [9, 9, INK], [10, 9, INK], [11, 9, INK], [12, 9, INK],
        [4, 10, GRASS], [5, 10, GRASS], [6, 10, GRASS], [7, 10, GRASS], [8, 10, GRASS], [9, 10, GRASS], [10, 10, GRASS], [11, 10, GRASS],
        [6, 11, GRASS], [7, 11, GRASS], [8, 11, GRASS], [9, 11, GRASS],
      ]);
      break;
    case 'respawn':
      drawPixels(ctx, u, [
        [7, 2, LILAC], [8, 2, LILAC], [6, 3, LILAC], [7, 3, BUTTER], [8, 3, BUTTER], [9, 3, LILAC],
        [5, 4, LILAC], [6, 4, BUTTER], [7, 4, BUTTER], [8, 4, BUTTER], [9, 4, BUTTER], [10, 4, LILAC],
        [5, 5, LILAC], [6, 5, INK], [7, 5, BUTTER], [8, 5, BUTTER], [9, 5, INK], [10, 5, LILAC],
        [6, 6, LILAC], [7, 6, LILAC], [8, 6, LILAC], [9, 6, LILAC],
        [7, 7, SKY], [8, 7, SKY], [6, 8, SKY], [7, 8, SKY], [8, 8, SKY], [9, 8, SKY],
        [5, 9, SKY], [6, 9, SKY], [7, 9, SKY], [8, 9, SKY], [9, 9, SKY], [10, 9, SKY],
        [4, 10, SKY], [11, 10, SKY], [3, 11, SKY], [12, 11, SKY],
      ]);
      break;
    case 'height_low':
      drawPixels(ctx, u, [
        [7, 10, INK], [8, 10, INK], [6, 9, INK], [9, 9, INK], [7, 8, INK], [8, 8, INK],
        [7, 7, SKY], [8, 7, SKY], [7, 6, SKY], [8, 6, SKY], [7, 5, SKY], [8, 5, SKY],
        [7, 4, INK], [8, 4, INK], [6, 3, CORAL], [7, 3, CORAL], [8, 3, CORAL], [9, 3, CORAL],
        [3, 11, INK], [4, 11, INK], [5, 11, INK], [6, 11, INK], [7, 11, INK], [8, 11, INK], [9, 11, INK], [10, 11, INK], [11, 11, INK], [12, 11, INK],
      ]);
      break;
    case 'height_mid':
      drawPixels(ctx, u, [
        [4, 11, INK], [5, 11, INK], [6, 11, INK], [7, 11, INK], [8, 11, INK], [9, 11, INK], [10, 11, INK], [11, 11, INK],
        [5, 8, INK], [5, 9, INK], [5, 10, INK], [7, 6, INK], [7, 7, INK], [7, 8, INK], [7, 9, INK], [7, 10, INK],
        [9, 4, INK], [9, 5, INK], [9, 6, INK], [9, 7, INK], [9, 8, INK], [9, 9, INK], [9, 10, INK],
        [5, 7, SKY], [7, 5, SKY], [9, 3, SKY],
        [11, 2, CORAL], [11, 3, CORAL], [12, 3, CORAL], [11, 4, CORAL],
      ]);
      break;
    case 'height_cloud':
      drawPixels(ctx, u, [
        [4, 5, BUTTER], [5, 5, BUTTER], [6, 5, BUTTER], [7, 5, BUTTER], [8, 5, BUTTER], [9, 5, BUTTER], [10, 5, BUTTER], [11, 5, BUTTER],
        [3, 6, BUTTER], [4, 6, BUTTER], [5, 6, BUTTER], [6, 6, BUTTER], [7, 6, BUTTER], [8, 6, BUTTER], [9, 6, BUTTER], [10, 6, BUTTER], [11, 6, BUTTER], [12, 6, BUTTER],
        [4, 7, BUTTER], [5, 7, BUTTER], [6, 7, BUTTER], [7, 7, BUTTER], [8, 7, BUTTER], [9, 7, BUTTER], [10, 7, BUTTER], [11, 7, BUTTER],
        [7, 9, INK], [8, 9, INK], [7, 10, INK], [8, 10, INK], [7, 11, INK], [8, 11, INK],
        [6, 12, INK], [7, 12, INK], [8, 12, INK], [9, 12, INK],
      ]);
      break;
    case 'height_sun':
      drawPixels(ctx, u, [
        [7, 2, GOLD], [8, 2, GOLD], [6, 3, GOLD], [9, 3, GOLD], [5, 4, GOLD], [10, 4, GOLD],
        [6, 4, '#f3e2a8'], [7, 4, '#f3e2a8'], [8, 4, '#f3e2a8'], [9, 4, '#f3e2a8'],
        [6, 5, '#f3e2a8'], [7, 5, GOLD], [8, 5, GOLD], [9, 5, '#f3e2a8'],
        [7, 6, GOLD], [8, 6, GOLD],
        [7, 8, INK], [8, 8, INK], [7, 9, INK], [8, 9, INK], [7, 10, INK], [8, 10, INK],
        [6, 11, INK], [9, 11, INK], [5, 12, INK], [10, 12, INK],
      ]);
      break;
    case 'height_peak':
      drawPixels(ctx, u, [
        [7, 2, INK], [8, 2, INK], [6, 3, SKY], [7, 3, SKY], [8, 3, SKY], [9, 3, SKY],
        [5, 4, SKY], [6, 4, SKY], [7, 4, SKY], [8, 4, SKY], [9, 4, SKY], [10, 4, SKY],
        [4, 5, SKY], [5, 5, SKY], [6, 5, SKY], [7, 5, BUTTER], [8, 5, BUTTER], [9, 5, SKY], [10, 5, SKY], [11, 5, SKY],
        [3, 6, SKY], [4, 6, SKY], [5, 6, SKY], [6, 6, SKY], [7, 6, SKY], [8, 6, SKY], [9, 6, SKY], [10, 6, SKY], [11, 6, SKY], [12, 6, SKY],
        [2, 7, SKY], [3, 7, SKY], [4, 7, SKY], [5, 7, SKY], [6, 7, SKY], [7, 7, SKY], [8, 7, SKY], [9, 7, SKY], [10, 7, SKY], [11, 7, SKY], [12, 7, SKY], [13, 7, SKY],
        [3, 8, INK], [4, 8, INK], [5, 8, INK], [6, 8, INK], [7, 8, INK], [8, 8, INK], [9, 8, INK], [10, 8, INK], [11, 8, INK], [12, 8, INK],
      ]);
      break;
    case 'height_rocket':
      drawPixels(ctx, u, [
        [7, 2, CORAL], [8, 2, CORAL], [6, 3, CORAL], [7, 3, BUTTER], [8, 3, BUTTER], [9, 3, CORAL],
        [6, 4, CORAL], [7, 4, BUTTER], [8, 4, BUTTER], [9, 4, CORAL],
        [6, 5, CORAL], [7, 5, BUTTER], [8, 5, BUTTER], [9, 5, CORAL],
        [6, 6, CORAL], [7, 6, BUTTER], [8, 6, BUTTER], [9, 6, CORAL],
        [6, 7, CORAL], [7, 7, CORAL], [8, 7, CORAL], [9, 7, CORAL],
        [5, 8, INK], [6, 8, INK], [9, 8, INK], [10, 8, INK],
        [6, 9, GOLD], [7, 9, GOLD], [8, 9, GOLD], [9, 9, GOLD],
        [5, 10, CORAL], [6, 10, GOLD], [7, 10, GOLD], [8, 10, GOLD], [9, 10, GOLD], [10, 10, CORAL],
        [4, 11, CORAL], [11, 11, CORAL],
      ]);
      break;
    case 'height_orbit':
      drawPixels(ctx, u, [
        [2, 7, INK], [3, 5, INK], [4, 4, INK], [6, 3, INK], [8, 3, INK], [10, 4, INK], [11, 5, INK], [12, 7, INK],
        [3, 8, INK], [12, 8, INK], [4, 9, INK], [11, 9, INK], [6, 10, INK], [9, 10, INK],
        [7, 6, SKY], [8, 6, SKY], [6, 7, SKY], [7, 7, MINT], [8, 7, MINT], [9, 7, SKY],
        [7, 8, MINT], [8, 8, MINT],
        [7, 1, GOLD], [8, 1, GOLD], [7, 2, GOLD], [8, 2, GOLD],
      ]);
      break;
    case 'height_billion':
      drawPixels(ctx, u, [
        [3, 3, GOLD], [4, 3, GOLD], [5, 3, GOLD], [10, 3, GOLD], [11, 3, GOLD], [12, 3, GOLD],
        [2, 4, GOLD], [3, 4, '#f3e2a8'], [4, 4, '#f3e2a8'], [5, 4, GOLD], [10, 4, GOLD], [11, 4, '#f3e2a8'], [12, 4, '#f3e2a8'], [13, 4, GOLD],
        [2, 5, GOLD], [5, 5, GOLD], [10, 5, GOLD], [13, 5, GOLD],
        [2, 6, GOLD], [3, 6, '#f3e2a8'], [4, 6, '#f3e2a8'], [5, 6, GOLD], [10, 6, GOLD], [11, 6, '#f3e2a8'], [12, 6, '#f3e2a8'], [13, 6, GOLD],
        [3, 7, GOLD], [4, 7, GOLD], [5, 7, GOLD], [10, 7, GOLD], [11, 7, GOLD], [12, 7, GOLD],
        [6, 9, CORAL], [7, 9, CORAL], [8, 9, CORAL], [9, 9, CORAL],
        [7, 8, CORAL], [8, 8, CORAL], [6, 10, GOLD], [7, 10, GOLD], [8, 10, GOLD], [9, 10, GOLD], [10, 10, GOLD],
        [7, 11, GOLD], [8, 11, GOLD],
      ]);
      break;
    case 'target':
      drawPixels(ctx, u, [
        [7, 2, INK], [8, 2, INK], [6, 3, INK], [9, 3, INK], [5, 4, INK], [10, 4, INK],
        [4, 5, INK], [5, 5, MINT], [6, 5, MINT], [7, 5, MINT], [8, 5, MINT], [9, 5, MINT], [10, 5, MINT], [11, 5, INK],
        [4, 6, INK], [5, 6, MINT], [6, 6, GOLD], [7, 6, GOLD], [8, 6, GOLD], [9, 6, GOLD], [10, 6, MINT], [11, 6, INK],
        [4, 7, INK], [5, 7, MINT], [6, 7, GOLD], [7, 7, CORAL], [8, 7, CORAL], [9, 7, GOLD], [10, 7, MINT], [11, 7, INK],
        [5, 8, INK], [6, 8, GOLD], [7, 8, CORAL], [8, 8, CORAL], [9, 8, GOLD], [10, 8, INK],
        [6, 9, INK], [7, 9, INK], [8, 9, INK], [9, 9, INK],
      ]);
      break;
    case 'metronome':
      drawPixels(ctx, u, [
        [7, 2, INK], [8, 2, INK], [6, 3, INK], [9, 3, INK], [5, 4, GOLD], [6, 4, GOLD], [7, 4, GOLD], [8, 4, GOLD], [9, 4, GOLD], [10, 4, GOLD],
        [6, 5, GOLD], [7, 5, '#f3e2a8'], [8, 5, '#f3e2a8'], [9, 5, GOLD],
        [7, 6, INK], [8, 6, INK], [7, 7, INK], [8, 7, INK], [7, 8, INK], [8, 8, INK],
        [5, 9, INK], [6, 9, INK], [9, 9, INK], [10, 9, INK], [4, 10, INK], [11, 10, INK],
        [3, 11, INK], [4, 11, INK], [11, 11, INK], [12, 11, INK],
      ]);
      break;
    case 'mirror':
      drawPixels(ctx, u, [
        [4, 3, INK], [5, 3, INK], [6, 3, INK], [9, 3, INK], [10, 3, INK], [11, 3, INK],
        [4, 4, INK], [5, 4, SKY], [6, 4, SKY], [9, 4, SKY], [10, 4, SKY], [11, 4, INK],
        [4, 5, INK], [5, 5, SKY], [6, 5, MINT], [9, 5, MINT], [10, 5, SKY], [11, 5, INK],
        [4, 6, INK], [5, 6, SKY], [6, 6, MINT], [9, 6, MINT], [10, 6, SKY], [11, 6, INK],
        [4, 7, INK], [5, 7, SKY], [6, 7, SKY], [9, 7, SKY], [10, 7, SKY], [11, 7, INK],
        [4, 8, INK], [5, 8, INK], [6, 8, INK], [9, 8, INK], [10, 8, INK], [11, 8, INK],
        [7, 4, INK], [8, 4, INK], [7, 5, INK], [8, 5, INK], [7, 6, INK], [8, 6, INK], [7, 7, INK], [8, 7, INK],
      ]);
      break;
    case 'perfect_tired':
      drawPixels(ctx, u, [
        [5, 4, GOLD], [6, 4, GOLD], [8, 4, GOLD], [9, 4, GOLD],
        [4, 5, GOLD], [5, 5, GOLD], [6, 5, GOLD], [7, 5, GOLD], [8, 5, GOLD], [9, 5, GOLD], [10, 5, GOLD],
        [4, 6, GOLD], [5, 6, GOLD], [6, 6, INK], [7, 6, INK], [8, 6, INK], [9, 6, GOLD], [10, 6, GOLD],
        [5, 7, GOLD], [6, 7, GOLD], [7, 7, GOLD], [8, 7, GOLD], [9, 7, GOLD],
        [6, 8, INK], [7, 8, INK], [8, 8, INK], [9, 8, INK],
        [5, 9, INK], [6, 9, INK], [9, 9, INK], [10, 9, INK],
        [4, 10, INK], [11, 10, INK],
      ]);
      break;
    case 'fiscal':
      drawFiscalBase(ctx, u);
      break;
    case 'fiscal_shield':
      drawFiscalBase(ctx, u);
      drawPixels(ctx, u, [
        [11, 5, INK], [12, 5, INK], [11, 6, MINT], [12, 6, MINT], [11, 7, MINT], [12, 7, MINT],
        [11, 8, MINT], [12, 8, MINT], [11, 9, INK], [12, 9, INK], [12, 10, INK],
      ]);
      break;
    case 'fiscal_tax':
      drawFiscalBase(ctx, u);
      drawPixels(ctx, u, [
        [11, 4, INK], [12, 4, INK], [13, 4, INK], [11, 5, INK], [13, 5, INK], [11, 6, INK], [12, 6, INK], [13, 6, INK],
        [10, 7, INK], [11, 7, INK], [12, 7, INK], [13, 7, INK], [14, 7, INK],
      ]);
      break;
    case 'fiscal_mad':
      drawFiscalBase(ctx, u, true);
      drawPixels(ctx, u, [
        [2, 3, ROSE], [3, 3, ROSE], [13, 3, ROSE], [14, 3, ROSE],
        [1, 4, ROSE], [14, 4, ROSE],
      ]);
      break;
    case 'coin':
      drawPixels(ctx, u, [
        [6, 3, GOLD], [7, 3, GOLD], [8, 3, GOLD], [9, 3, GOLD],
        [5, 4, GOLD], [6, 4, '#f3e2a8'], [7, 4, '#f3e2a8'], [8, 4, '#f3e2a8'], [9, 4, '#f3e2a8'], [10, 4, GOLD],
        [4, 5, GOLD], [5, 5, '#f3e2a8'], [6, 5, '#f3e2a8'], [7, 5, GOLD], [8, 5, '#f3e2a8'], [9, 5, '#f3e2a8'], [10, 5, '#f3e2a8'], [11, 5, GOLD],
        [4, 6, GOLD], [5, 6, '#f3e2a8'], [6, 6, '#f3e2a8'], [7, 6, '#f3e2a8'], [8, 6, '#f3e2a8'], [9, 6, '#f3e2a8'], [10, 6, '#f3e2a8'], [11, 6, GOLD],
        [5, 7, GOLD], [6, 7, '#f3e2a8'], [7, 7, '#f3e2a8'], [8, 7, '#f3e2a8'], [9, 7, '#f3e2a8'], [10, 7, GOLD],
        [6, 8, GOLD], [7, 8, GOLD], [8, 8, GOLD], [9, 8, GOLD],
      ]);
      break;
    case 'coin_bag':
      drawPixels(ctx, u, [
        [6, 2, INK], [7, 2, INK], [8, 2, INK], [9, 2, INK],
        [5, 3, INK], [6, 3, GOLD], [7, 3, GOLD], [8, 3, GOLD], [9, 3, GOLD], [10, 3, INK],
        [4, 4, INK], [5, 4, GOLD], [6, 4, '#f3e2a8'], [7, 4, '#f3e2a8'], [8, 4, '#f3e2a8'], [9, 4, '#f3e2a8'], [10, 4, GOLD], [11, 4, INK],
        [4, 5, INK], [5, 5, GOLD], [6, 5, '#f3e2a8'], [7, 5, GOLD], [8, 5, '#f3e2a8'], [9, 5, '#f3e2a8'], [10, 5, GOLD], [11, 5, INK],
        [4, 6, INK], [5, 6, GOLD], [6, 6, '#f3e2a8'], [7, 6, '#f3e2a8'], [8, 6, '#f3e2a8'], [9, 6, '#f3e2a8'], [10, 6, GOLD], [11, 6, INK],
        [5, 7, INK], [6, 7, GOLD], [7, 7, GOLD], [8, 7, GOLD], [9, 7, GOLD], [10, 7, INK],
        [6, 8, INK], [7, 8, INK], [8, 8, INK], [9, 8, INK],
      ]);
      break;
    case 'coin_stack':
      drawPixels(ctx, u, [
        [5, 6, GOLD], [6, 6, GOLD], [7, 6, GOLD], [8, 6, GOLD], [9, 6, GOLD], [10, 6, GOLD],
        [4, 7, GOLD], [5, 7, '#f3e2a8'], [6, 7, '#f3e2a8'], [7, 7, '#f3e2a8'], [8, 7, '#f3e2a8'], [9, 7, '#f3e2a8'], [10, 7, '#f3e2a8'], [11, 7, GOLD],
        [4, 8, GOLD], [5, 8, '#f3e2a8'], [6, 8, '#f3e2a8'], [7, 8, '#f3e2a8'], [8, 8, '#f3e2a8'], [9, 8, '#f3e2a8'], [10, 8, '#f3e2a8'], [11, 8, GOLD],
        [5, 9, GOLD], [6, 9, GOLD], [7, 9, GOLD], [8, 9, GOLD], [9, 9, GOLD], [10, 9, GOLD],
        [6, 3, GOLD], [7, 3, GOLD], [8, 3, GOLD], [9, 3, GOLD], [7, 2, GOLD], [8, 2, GOLD],
        [7, 1, CORAL], [8, 1, CORAL], [6, 2, CORAL], [9, 2, CORAL],
      ]);
      break;
    case 'coin_farm':
      drawPixels(ctx, u, [
        [3, 8, GOLD], [4, 8, GOLD], [6, 9, GOLD], [7, 9, GOLD], [9, 8, GOLD], [10, 8, GOLD], [12, 9, GOLD],
        [4, 7, '#f3e2a8'], [7, 8, '#f3e2a8'], [10, 7, '#f3e2a8'],
        [7, 4, INK], [8, 4, INK], [7, 5, INK], [8, 5, INK], [7, 6, INK], [8, 6, INK],
        [6, 7, INK], [7, 7, INK], [8, 7, INK], [9, 7, INK],
        [5, 10, INK], [6, 10, INK], [9, 10, INK], [10, 10, INK],
        [7, 2, CORAL], [8, 2, CORAL], [6, 3, CORAL], [9, 3, CORAL],
      ]);
      break;
    case 'shop':
      drawPixels(ctx, u, [
        [3, 4, INK], [4, 4, INK], [5, 4, INK], [6, 4, INK], [7, 4, INK], [8, 4, INK], [9, 4, INK], [10, 4, INK], [11, 4, INK], [12, 4, INK],
        [3, 5, CORAL], [4, 5, CORAL], [5, 5, CORAL], [6, 5, CORAL], [7, 5, CORAL], [8, 5, CORAL], [9, 5, CORAL], [10, 5, CORAL], [11, 5, CORAL], [12, 5, CORAL],
        [4, 6, BUTTER], [5, 6, BUTTER], [6, 6, BUTTER], [7, 6, BUTTER], [8, 6, BUTTER], [9, 6, BUTTER], [10, 6, BUTTER], [11, 6, BUTTER],
        [5, 7, INK], [6, 7, INK], [7, 7, INK], [8, 7, INK], [9, 7, INK], [10, 7, INK],
        [5, 8, BUTTER], [6, 8, BUTTER], [7, 8, BUTTER], [8, 8, BUTTER], [9, 8, BUTTER], [10, 8, BUTTER],
        [4, 9, INK], [5, 9, INK], [10, 9, INK], [11, 9, INK], [4, 10, INK], [11, 10, INK],
      ]);
      break;
    case 'hat_prop':
      drawPixels(ctx, u, [
        [2, 3, INK], [3, 3, SKY], [4, 3, INK], [11, 3, INK], [12, 3, SKY], [13, 3, INK],
        [1, 4, INK], [2, 4, SKY], [3, 4, SKY], [4, 4, SKY], [5, 4, INK], [10, 4, INK], [11, 4, SKY], [12, 4, SKY], [13, 4, SKY], [14, 4, INK],
        [4, 5, CORAL], [5, 5, CORAL], [6, 5, CORAL], [7, 5, CORAL], [8, 5, CORAL], [9, 5, CORAL], [10, 5, CORAL], [11, 5, CORAL],
        [5, 6, CORAL], [6, 6, CORAL], [7, 6, CORAL], [8, 6, CORAL], [9, 6, CORAL], [10, 6, CORAL],
        [6, 7, PEACH], [7, 7, PEACH], [8, 7, PEACH], [9, 7, PEACH],
        [5, 8, PEACH], [6, 8, PEACH], [7, 8, PEACH], [8, 8, PEACH], [9, 8, PEACH], [10, 8, PEACH],
        [6, 9, INK], [9, 9, INK], [7, 10, INK], [8, 10, INK],
      ]);
      break;
    case 'potion':
      drawPixels(ctx, u, [
        [7, 2, INK], [8, 2, INK], [6, 3, INK], [9, 3, INK],
        [6, 4, POTION_GLOW], [7, 4, POTION_GLOW], [8, 4, POTION_GLOW], [9, 4, POTION_GLOW],
        [5, 5, POTION_GLOW], [6, 5, POTION], [7, 5, POTION], [8, 5, POTION], [9, 5, POTION], [10, 5, POTION_GLOW],
        [5, 6, POTION], [6, 6, POTION], [7, 6, POTION], [8, 6, POTION], [9, 6, POTION], [10, 6, POTION],
        [5, 7, POTION], [6, 7, POTION], [7, 7, POTION], [8, 7, POTION], [9, 7, POTION], [10, 7, POTION],
        [6, 8, POTION], [7, 8, POTION], [8, 8, POTION], [9, 8, POTION],
        [7, 9, INK], [8, 9, INK], [6, 10, INK], [7, 10, INK], [8, 10, INK], [9, 10, INK],
      ]);
      break;
    case 'backpack':
      drawPixels(ctx, u, [
        [6, 2, INK], [7, 2, INK], [8, 2, INK], [9, 2, INK],
        [5, 3, INK], [6, 3, CORAL], [7, 3, CORAL], [8, 3, CORAL], [9, 3, CORAL], [10, 3, INK],
        [4, 4, INK], [5, 4, CORAL], [6, 4, CORAL], [7, 4, CORAL], [8, 4, CORAL], [9, 4, CORAL], [10, 4, CORAL], [11, 4, INK],
        [4, 5, INK], [5, 5, CORAL], [6, 5, '#f3e2a8'], [7, 5, CORAL], [8, 5, CORAL], [9, 5, POTION], [10, 5, CORAL], [11, 5, INK],
        [4, 6, INK], [5, 6, CORAL], [6, 6, CORAL], [7, 6, CORAL], [8, 6, CORAL], [9, 6, CORAL], [10, 6, CORAL], [11, 6, INK],
        [5, 7, INK], [6, 7, INK], [7, 7, INK], [8, 7, INK], [9, 7, INK], [10, 7, INK],
        [6, 8, SKY], [7, 8, SKY], [8, 8, SKY], [9, 8, SKY],
      ]);
      break;
    case 'potion_perfect':
      drawPixels(ctx, u, [
        [7, 2, INK], [8, 2, INK],
        [5, 3, POTION_GLOW], [6, 3, POTION], [7, 3, POTION], [8, 3, POTION], [9, 3, POTION], [10, 3, POTION_GLOW],
        [5, 4, POTION], [6, 4, POTION], [7, 4, POTION], [8, 4, POTION], [9, 4, POTION], [10, 4, POTION],
        [6, 5, POTION], [7, 5, POTION], [8, 5, POTION], [9, 5, POTION],
        [7, 6, INK], [8, 6, INK], [6, 7, INK], [9, 7, INK],
        [11, 4, GOLD], [12, 4, GOLD], [11, 5, GOLD], [12, 5, GOLD], [12, 6, GOLD],
      ]);
      break;
    case 'rank_sign':
      drawPixels(ctx, u, [
        [4, 3, INK], [5, 3, BUTTER], [6, 3, BUTTER], [7, 3, BUTTER], [8, 3, BUTTER], [9, 3, BUTTER], [10, 3, BUTTER], [11, 3, INK],
        [4, 4, INK], [5, 4, BUTTER], [6, 4, INK], [7, 4, BUTTER], [8, 4, INK], [9, 4, BUTTER], [10, 4, INK], [11, 4, INK],
        [4, 5, INK], [5, 5, BUTTER], [6, 5, BUTTER], [7, 5, BUTTER], [8, 5, BUTTER], [9, 5, BUTTER], [10, 5, BUTTER], [11, 5, INK],
        [4, 6, INK], [5, 6, BUTTER], [6, 6, INK], [7, 6, BUTTER], [8, 6, INK], [9, 6, BUTTER], [10, 6, INK], [11, 6, INK],
        [7, 7, INK], [8, 7, INK], [7, 8, INK], [8, 8, INK], [7, 9, INK], [8, 9, INK],
        [6, 10, INK], [7, 10, INK], [8, 10, INK], [9, 10, INK],
      ]);
      break;
    case 'rank_medal':
      drawPixels(ctx, u, [
        [7, 2, CORAL], [8, 2, CORAL], [6, 3, CORAL], [9, 3, CORAL],
        [7, 4, GOLD], [8, 4, GOLD], [6, 5, GOLD], [7, 5, '#f3e2a8'], [8, 5, '#f3e2a8'], [9, 5, GOLD],
        [5, 6, GOLD], [6, 6, '#f3e2a8'], [7, 6, GOLD], [8, 6, GOLD], [9, 6, '#f3e2a8'], [10, 6, GOLD],
        [5, 7, GOLD], [6, 7, '#f3e2a8'], [7, 7, '#f3e2a8'], [8, 7, '#f3e2a8'], [9, 7, '#f3e2a8'], [10, 7, GOLD],
        [6, 8, GOLD], [7, 8, GOLD], [8, 8, GOLD], [9, 8, GOLD],
        [7, 9, GOLD], [8, 9, GOLD], [7, 10, INK], [8, 10, INK],
      ]);
      break;
    case 'rank_crown':
      drawPixels(ctx, u, [
        [4, 5, GOLD], [5, 5, GOLD], [6, 5, GOLD], [7, 5, GOLD], [8, 5, GOLD], [9, 5, GOLD], [10, 5, GOLD], [11, 5, GOLD],
        [4, 4, GOLD], [6, 4, GOLD], [8, 4, GOLD], [10, 4, GOLD], [12, 4, GOLD],
        [5, 3, GOLD], [7, 2, GOLD], [8, 2, GOLD], [9, 3, GOLD],
        [4, 6, GOLD], [5, 6, '#f3e2a8'], [6, 6, '#f3e2a8'], [7, 6, '#f3e2a8'], [8, 6, '#f3e2a8'], [9, 6, '#f3e2a8'], [10, 6, '#f3e2a8'], [11, 6, GOLD],
        [5, 7, INK], [6, 7, INK], [9, 7, INK], [10, 7, INK],
      ]);
      break;
    case 'rank_globe':
      drawPixels(ctx, u, [
        [5, 3, INK], [6, 3, INK], [7, 3, INK], [8, 3, INK], [9, 3, INK], [10, 3, INK],
        [4, 4, INK], [5, 4, SKY], [6, 4, SKY], [7, 4, MINT], [8, 4, MINT], [9, 4, SKY], [10, 4, SKY], [11, 4, INK],
        [4, 5, INK], [5, 5, SKY], [6, 5, MINT], [7, 5, SKY], [8, 5, SKY], [9, 5, MINT], [10, 5, SKY], [11, 5, INK],
        [4, 6, INK], [5, 6, SKY], [6, 6, SKY], [7, 6, MINT], [8, 6, MINT], [9, 6, SKY], [10, 6, SKY], [11, 6, INK],
        [5, 7, INK], [6, 7, INK], [7, 7, INK], [8, 7, INK], [9, 7, INK], [10, 7, INK],
        [6, 8, GOLD], [7, 8, GOLD], [8, 8, GOLD], [9, 8, GOLD], [7, 9, GOLD], [8, 9, GOLD],
      ]);
      break;
    case 'daily':
      drawPixels(ctx, u, [
        [4, 3, INK], [5, 3, INK], [6, 3, INK], [7, 3, INK], [8, 3, INK], [9, 3, INK], [10, 3, INK], [11, 3, INK],
        [4, 4, BUTTER], [5, 4, BUTTER], [6, 4, BUTTER], [7, 4, BUTTER], [8, 4, BUTTER], [9, 4, BUTTER], [10, 4, BUTTER], [11, 4, BUTTER],
        [4, 5, INK], [5, 5, MINT], [6, 5, MINT], [7, 5, MINT], [8, 5, MINT], [9, 5, MINT], [10, 5, MINT], [11, 5, INK],
        [4, 6, INK], [5, 6, BUTTER], [6, 6, INK], [8, 6, INK], [10, 6, INK], [11, 6, INK],
        [4, 7, INK], [5, 7, BUTTER], [6, 7, INK], [7, 7, INK], [8, 7, INK], [9, 7, INK], [10, 7, INK], [11, 7, INK],
        [5, 8, INK], [6, 8, INK], [7, 8, INK], [8, 8, INK], [9, 8, INK], [10, 8, INK],
      ]);
      break;
    case 'daily_done':
      drawPixels(ctx, u, [
        [4, 3, INK], [5, 3, INK], [6, 3, INK], [7, 3, INK], [8, 3, INK], [9, 3, INK], [10, 3, INK], [11, 3, INK],
        [4, 4, BUTTER], [5, 4, BUTTER], [6, 4, BUTTER], [7, 4, BUTTER], [8, 4, BUTTER], [9, 4, BUTTER], [10, 4, BUTTER], [11, 4, BUTTER],
        [4, 5, INK], [5, 5, MINT], [6, 5, MINT], [7, 5, MINT], [8, 5, MINT], [9, 5, MINT], [10, 5, MINT], [11, 5, INK],
        [5, 6, INK], [6, 6, MINT], [7, 6, INK], [9, 6, MINT], [10, 6, INK],
        [5, 7, INK], [6, 7, INK], [7, 7, MINT], [8, 7, INK], [9, 7, INK], [10, 7, MINT], [11, 7, INK],
        [6, 8, INK], [7, 8, MINT], [8, 8, MINT], [9, 8, INK],
      ]);
      break;
    case 'streak_3':
      drawPixels(ctx, u, [
        [4, 3, INK], [5, 3, INK], [6, 3, INK], [7, 3, INK], [8, 3, INK], [9, 3, INK], [10, 3, INK], [11, 3, INK],
        [4, 4, BUTTER], [5, 4, BUTTER], [6, 4, BUTTER], [7, 4, BUTTER], [8, 4, BUTTER], [9, 4, BUTTER], [10, 4, BUTTER], [11, 4, BUTTER],
        [4, 5, INK], [5, 5, CORAL], [6, 5, CORAL], [7, 5, CORAL], [8, 5, MINT], [9, 5, MINT], [10, 5, MINT], [11, 5, INK],
        [4, 6, INK], [5, 6, BUTTER], [6, 6, INK], [7, 6, INK], [8, 6, INK], [9, 6, INK], [10, 6, INK], [11, 6, INK],
        [5, 7, INK], [6, 7, INK], [7, 7, INK], [8, 7, INK], [9, 7, INK], [10, 7, INK],
        [6, 8, CORAL], [7, 8, CORAL], [8, 8, CORAL],
      ]);
      break;
    case 'streak_7':
      drawPixels(ctx, u, [
        [4, 3, INK], [5, 3, INK], [6, 3, INK], [7, 3, INK], [8, 3, INK], [9, 3, INK], [10, 3, INK], [11, 3, INK],
        [4, 4, BUTTER], [5, 4, BUTTER], [6, 4, BUTTER], [7, 4, BUTTER], [8, 4, BUTTER], [9, 4, BUTTER], [10, 4, BUTTER], [11, 4, BUTTER],
        [4, 5, INK], [5, 5, CORAL], [6, 5, CORAL], [7, 5, CORAL], [8, 5, CORAL], [9, 5, CORAL], [10, 5, CORAL], [11, 5, INK],
        [4, 6, INK], [5, 6, BUTTER], [6, 6, INK], [7, 6, INK], [8, 6, INK], [9, 6, INK], [10, 6, INK], [11, 6, INK],
        [5, 7, INK], [6, 7, INK], [7, 7, INK], [8, 7, INK], [9, 7, INK], [10, 7, INK],
        [6, 8, CORAL], [7, 8, CORAL], [8, 8, CORAL], [9, 8, CORAL],
      ]);
      break;
    case 'secret_near':
      drawPixels(ctx, u, [
        [3, 6, INK], [4, 6, INK], [5, 6, INK], [6, 6, INK], [7, 6, INK], [8, 6, INK], [9, 6, INK], [10, 6, INK], [11, 6, INK], [12, 6, INK],
        [11, 5, GOLD], [12, 5, GOLD], [11, 4, GOLD], [12, 4, GOLD], [12, 3, GOLD],
        [7, 4, LILAC], [8, 4, LILAC], [6, 5, LILAC], [7, 5, LILAC], [8, 5, LILAC], [9, 5, LILAC],
        [7, 7, INK], [8, 7, INK], [6, 8, INK], [7, 8, INK], [8, 8, INK], [9, 8, INK],
      ]);
      break;
    case 'secret_idle':
      drawPixels(ctx, u, [
        [4, 5, INK], [5, 5, BUTTER], [6, 5, BUTTER], [9, 5, BUTTER], [10, 5, BUTTER], [11, 5, INK],
        [4, 6, INK], [5, 6, INK], [6, 6, INK], [9, 6, INK], [10, 6, INK], [11, 6, INK],
        [5, 7, INK], [6, 7, INK], [9, 7, INK], [10, 7, INK],
        [7, 8, INK], [8, 8, INK], [7, 9, INK], [8, 9, INK],
        [3, 4, LILAC], [12, 4, LILAC], [2, 5, LILAC], [13, 5, LILAC],
      ]);
      break;
    case 'secret_asmr':
      drawPixels(ctx, u, [
        [7, 3, INK], [8, 3, INK], [6, 4, SKY], [7, 4, SKY], [8, 4, SKY], [9, 4, SKY],
        [5, 5, SKY], [6, 5, SKY], [7, 5, MINT], [8, 5, MINT], [9, 5, SKY], [10, 5, SKY],
        [4, 6, SKY], [5, 6, MINT], [6, 6, MINT], [7, 6, MINT], [8, 6, MINT], [9, 6, MINT], [10, 6, MINT], [11, 6, SKY],
        [3, 7, SKY], [4, 7, MINT], [11, 7, MINT], [12, 7, SKY],
        [2, 8, SKY], [13, 8, SKY], [1, 9, SKY], [14, 9, SKY],
      ]);
      break;
    case 'secret_fall':
      drawPixels(ctx, u, [
        [7, 2, CORAL], [8, 2, CORAL], [6, 3, CORAL], [9, 3, CORAL],
        [7, 4, INK], [8, 4, INK], [7, 5, INK], [8, 5, INK],
        [3, 6, SKY], [4, 6, SKY], [5, 7, SKY], [6, 7, SKY], [7, 8, SKY], [8, 8, SKY], [9, 7, SKY], [10, 7, SKY], [11, 6, SKY], [12, 6, SKY],
        [2, 8, SKY], [13, 8, SKY], [1, 9, SKY], [14, 9, SKY],
      ]);
      break;
    case 'secret_breath':
      drawPixels(ctx, u, [
        [5, 4, CORAL], [6, 4, CORAL], [9, 4, CORAL], [10, 4, CORAL],
        [4, 5, CORAL], [5, 5, CORAL], [6, 5, CORAL], [7, 5, CORAL], [8, 5, CORAL], [9, 5, CORAL], [10, 5, CORAL], [11, 5, CORAL],
        [4, 6, CORAL], [5, 6, CORAL], [6, 6, CORAL], [7, 6, CORAL], [8, 6, CORAL], [9, 6, CORAL], [10, 6, CORAL], [11, 6, CORAL],
        [5, 7, CORAL], [6, 7, CORAL], [7, 7, CORAL], [8, 7, CORAL], [9, 7, CORAL], [10, 7, CORAL],
        [2, 6, SKY], [3, 6, SKY], [12, 6, SKY], [13, 6, SKY], [1, 7, SKY], [14, 7, SKY],
      ]);
      break;
    case 'clock':
      drawPixels(ctx, u, [
        [7, 2, INK], [8, 2, INK], [6, 3, INK], [9, 3, INK], [5, 4, INK], [10, 4, INK],
        [4, 5, INK], [5, 5, BUTTER], [6, 5, BUTTER], [7, 5, BUTTER], [8, 5, BUTTER], [9, 5, BUTTER], [10, 5, BUTTER], [11, 5, INK],
        [4, 6, INK], [5, 6, BUTTER], [6, 6, BUTTER], [7, 6, INK], [8, 6, BUTTER], [9, 6, BUTTER], [10, 6, BUTTER], [11, 6, INK],
        [4, 7, INK], [5, 7, BUTTER], [6, 7, BUTTER], [7, 7, INK], [8, 7, INK], [9, 7, BUTTER], [10, 7, BUTTER], [11, 7, INK],
        [5, 8, INK], [6, 8, BUTTER], [7, 8, BUTTER], [8, 8, BUTTER], [9, 8, BUTTER], [10, 8, INK],
        [6, 9, INK], [7, 9, INK], [8, 9, INK], [9, 9, INK],
      ]);
      break;
    case 'moon':
      drawPixels(ctx, u, [
        [8, 3, LILAC], [9, 3, LILAC], [7, 4, LILAC], [8, 4, LILAC], [9, 4, LILAC], [10, 4, LILAC],
        [6, 5, LILAC], [7, 5, LILAC], [8, 5, LILAC], [9, 5, LILAC], [10, 5, LILAC],
        [6, 6, LILAC], [7, 6, LILAC], [8, 6, LILAC], [9, 6, BUTTER],
        [6, 7, LILAC], [7, 7, LILAC], [8, 7, LILAC], [9, 7, BUTTER],
        [7, 8, LILAC], [8, 8, LILAC], [9, 8, LILAC],
        [8, 9, LILAC], [9, 9, LILAC],
        [5, 5, INK], [5, 6, INK], [5, 7, INK], [6, 4, INK],
        [2, 4, BUTTER], [3, 4, BUTTER], [12, 6, BUTTER], [13, 6, BUTTER],
      ]);
      break;
    case 'secret_shop':
      drawPixels(ctx, u, [
        [3, 4, INK], [4, 4, INK], [5, 4, INK], [6, 4, INK], [7, 4, INK], [8, 4, INK], [9, 4, INK], [10, 4, INK], [11, 4, INK], [12, 4, INK],
        [3, 5, CORAL], [4, 5, CORAL], [5, 5, CORAL], [6, 5, CORAL], [7, 5, CORAL], [8, 5, CORAL], [9, 5, CORAL], [10, 5, CORAL], [11, 5, CORAL], [12, 5, CORAL],
        [5, 6, BUTTER], [6, 6, BUTTER], [7, 6, INK], [8, 6, INK], [9, 6, BUTTER], [10, 6, BUTTER],
        [5, 7, BUTTER], [6, 7, BUTTER], [7, 7, INK], [8, 7, INK], [9, 7, BUTTER], [10, 7, BUTTER],
        [4, 3, INK], [5, 3, INK], [6, 3, INK], [7, 3, INK], [8, 3, INK], [9, 3, INK], [10, 3, INK], [11, 3, INK],
        [6, 2, INK], [7, 2, INK], [8, 2, INK], [9, 2, INK],
      ]);
      break;
    default:
      drawPixels(ctx, u, [
        [7, 2, INK], [8, 2, INK], [6, 3, LILAC], [7, 3, LILAC], [8, 3, LILAC], [9, 3, LILAC],
        [5, 4, LILAC], [6, 4, LILAC], [7, 4, LILAC], [8, 4, LILAC], [9, 4, LILAC], [10, 4, LILAC],
        [7, 6, INK], [8, 6, INK], [7, 7, INK], [8, 7, INK],
      ]);
      break;
  }
}

export function paintAchievementIcon(canvas: HTMLCanvasElement, icon: AchievementIcon): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  drawAchievementIcon(ctx, icon, canvas.width);
}
