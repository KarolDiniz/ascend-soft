import type { AccessoryId } from './playerAppearance';
import { PLAYER_DRAW_W } from './playerPixelArt';
import { PASTEL, rgba } from '../theme/pastelPalette';
import { fillPx, px, PIXEL } from '../theme/pixel';

const u = PIXEL.unit;

/** Largura de referência do preview/editor (CharacterPreview scale 3.35). */
const ACCESSORY_REF_BW = PLAYER_DRAW_W * 3.35;

/** Escala para acessórios no gameplay (preview/editor usa 1). */
export function accessoryInGameScale(_bodyW: number, accessory?: AccessoryId): number {
  if (accessory === 'bow') return 0.74;
  return 1;
}

export type AccessoryLayer = 'underFace' | 'overFace';

export function accessoryLayers(id: AccessoryId): AccessoryLayer[] {
  if (id === 'none') return [];
  if (id === 'bow') return ['underFace'];
  return ['underFace'];
}

/** Acessórios pixel — desenhados no espaço local do corpo */
export function drawPlayerAccessory(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  accessory: AccessoryId,
  layer: AccessoryLayer,
  animT = 0,
  facing = 1,
  itemScale = 1,
  headHopX = 0,
  headHopY = 0,
): void {
  if (accessory === 'none') return;

  ctx.save();
  if (headHopX !== 0 || headHopY !== 0) ctx.translate(headHopX, headHopY);
  if (itemScale !== 1) ctx.scale(itemScale, itemScale);

  const under = layer === 'underFace';

  switch (accessory) {
    case 'bow':
      if (under) drawBow(ctx, bw, bh, facing, animT);
      break;
    case 'beanie':
      if (under) drawBeanie(ctx, bw, bh, animT);
      break;
    case 'sunhat':
      if (under) drawSunhat(ctx, bw, bh, animT);
      break;
    case 'sprout':
      if (under) drawSprout(ctx, bw, bh, animT);
      break;
    case 'crown':
      if (under) drawCrown(ctx, bw, bh, animT);
      break;
    case 'alienAntenna':
      if (under) drawAlienAntenna(ctx, bw, bh, animT);
      break;
    case 'santaHat':
      if (under) drawSantaHat(ctx, bw, bh, animT);
      break;
    case 'catEars':
      if (under) drawCatEars(ctx, bw, bh, animT);
      break;
    case 'bunnyEars':
      if (under) drawBunnyEars(ctx, bw, bh, animT);
      break;
    case 'mickeyEars':
      if (under) drawMickeyEars(ctx, bw, bh, animT);
      break;
    case 'marioCap':
      if (under) drawMarioCap(ctx, bw, bh, animT, facing);
      break;
    case 'pirateHat':
      if (under) drawPirateHat(ctx, bw, bh, animT, facing);
      break;
    default:
      break;
  }

  ctx.restore();
}

/** Laço vermelho — sprite 22×18 extraído da referência */
const BOW_SPRITE = [
  '..BBBBB........BBBBB..',
  '.BBRRRRBB....BBRRRRBB.',
  'BBRRRRRBBBBBBBBRRRRRBB',
  'BRRRRRRRBBBBBBRRRRRRRB',
  'BRRRRRBRBRRRRBRBRRRRRB',
  '.BRRRRRBBRRRRBBRRRRRB.',
  'BRRRRRBRBRRRRBRBRRRRRB',
  'BRRRRRRRBBBBBBRRRRRRRB',
  'BBRRRRRBRBBBBRBRRRRRBB',
  '.BBBBBBRRBBBBRRBBBBBB.',
  '..BBBBBRRBBBBRRBBBBB..',
  '...BBBRRRBBBBRRRBBB...',
  '..BBBRRRBB..BBRRRBBB..',
  '..BBRRRRBB..BBRRRRBB..',
  '..BBBRRRBB..BBRRRBBB..',
  '...BBBRRBB..BBRRBBB...',
  '...BBBBBBB..BBBBBBB...',
  '....BBBBB....BBBBB....',
] as const;

const BOW_COLORS: Record<string, string> = {
  R: '#F00000',
  B: '#000000',
};

function drawBow(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  facing: number,
  animT: number,
): void {
  const sway = Math.sin(animT * 4.5) * u * 0.1;
  const tilt = Math.sin(animT * 3.2) * 0.04;
  const inGame = isInGameBody(bw);
  const backX = -facing * bw * (inGame ? 0.24 : 0.16);
  ctx.save();
  ctx.translate(sway + backX, 0);
  ctx.rotate(tilt);
  // Linha 5 = nó central; in-game sobe e encolhe para não cobrir os olhos
  drawSpriteHat(
    ctx,
    bw,
    bh,
    animT,
    BOW_SPRITE,
    BOW_COLORS,
    facing,
    inGame ? 0.51 : 0.43,
    inGame ? 4 : 5,
    inGame ? -3.2 : -1,
  );
  ctx.restore();
}

function drawBeanie(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  animT: number,
): void {
  const bob = Math.sin(animT * 3) * u * 0.12;
  const cx = 0;
  const cy = -bh * 0.42 + bob;
  const knit = '#C88898';
  const knitHi = '#E8B0C0';
  const knitLo = '#A87080';
  const pom = PASTEL.cream;

  fillPx(ctx, cx - bw * 0.28, cy + u, bw * 0.56, u * 2.5, knitLo);
  fillPx(ctx, cx - bw * 0.3, cy, bw * 0.6, u * 3, knit);
  fillPx(ctx, cx - bw * 0.26, cy - u, bw * 0.52, u * 2.5, knit);
  fillPx(ctx, cx - bw * 0.2, cy - u * 2, bw * 0.4, u * 2, knitHi);
  fillPx(ctx, cx - u * 1.5, cy - u * 3.5, u * 3, u * 2.5, knit);
  fillPx(ctx, cx - u, cy - u * 4.5, u * 2, u * 2, pom);
  fillPx(ctx, cx - u * 0.5, cy - u * 5, u, u, rgba(PASTEL.white, 0.7));
  // listras de tricô
  fillPx(ctx, cx - bw * 0.22, cy + u * 0.5, u * 2, u, knitHi);
  fillPx(ctx, cx + bw * 0.08, cy + u * 0.5, u * 2, u, knitHi);
}

function drawSunhat(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  animT: number,
): void {
  drawSpriteHat(ctx, bw, bh, animT, STRAW_HAT_SPRITE, STRAW_HAT_COLORS, 1, 0.38, 11, 0.4);
}

/** Brotinho — sprite 21×18 extraído da referência */
const SPROUT_SPRITE = [
  '............MMMMMMMM.',
  '...........MMDDDMMMDD',
  '..........DMDDMMMDDDD',
  '....MMMMM.DDDMMMDDM..',
  '..MDDDDDDMDDMMDDDD...',
  '.MMDDMMMMMDMMDDDD....',
  '.MDMMMMMMMDMDDDD.....',
  'MMMDDDDDDDDDDL.......',
  'MDDDDDDDDMM..........',
  'M....DD..DD..........',
  '........DDD..........',
  '........DDD..........',
  '........DDD..........',
  '.......MMDD..........',
  '.......MMM...........',
  '.......MMMM..........',
  '.......MMDD..........',
  '........DDD..........',
] as const;

const SPROUT_COLORS: Record<string, string> = {
  L: '#F0FBE3',
  M: '#A3D063',
  D: '#80B437',
};

function drawSprout(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  animT: number,
): void {
  const sway = Math.sin(animT * 4) * u * 0.15;
  ctx.save();
  ctx.translate(sway, 0);
  // Linha 17 = base do caule encostada no topo da cabeça
  drawSpriteHat(ctx, bw, bh, animT, SPROUT_SPRITE, SPROUT_COLORS, 1, 0.38, 17, 0.05);
  ctx.restore();
}

/** Coroa dourada — sprite 24×26 extraído da referência */
const CROWN_SPRITE = [
  '...O.Y....O.Y....O.Y....',
  '........OOSSLYOO........',
  '.......OOOSYYOOO........',
  '.........OOOOOO.........',
  '.........OOOOO..........',
  '...........OOO..........',
  '..........OOOOOO........',
  '..........OOYYOO........',
  '..OOO.....OOYYOO.....OOO',
  '..OOO....OOYYOOO....OOO..',
  'OOOsOOO.OOYYYSSSOO.OOOsO',
  'OOOsOOO.OOYYYYSSOO.OOOss',
  'OOOsOOO.OOYYSSSYOO.OOOss',
  'OOOsOOO.OOYYSYSSOO.OOOss',
  'OsssssOOYYYYSSSSSSOOssss',
  'OsssssOOYYYYSYYYYSOOssss',
  'SssssssSYYLYSSYYYSSsssss',
  'SsssssSSYYYYSSSYYSSSssss',
  'YSsssSYYYYSSSSSSYYSSSSss',
  'YSsssSYYYYSSSSSSSSSSSSss',
  'YSssssYYSSDDDDSSSSSSSSss',
  'YSSsSSSYssDDDDSSSSSSSSss',
  '..YYYSYYSSRRDDDDSSSYSSSS..',
  '..YYYSYYSSRRDDDDSSSSSSSS..',
  'YYYYYYSSRRRRDDDDSSSSYSSY',
  'YYYYYYSSRRRRDDDDSSSSYSSY',
] as const;

const CROWN_COLORS: Record<string, string> = {
  O: '#141010',
  Y: '#FAD028',
  L: '#FFF0A0',
  S: '#E89828',
  s: '#C87830',
  B: '#885820',
  R: '#C83838',
  D: '#882828',
};

function drawCrown(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  animT: number,
): void {
  drawSpriteHat(ctx, bw, bh, animT, CROWN_SPRITE, CROWN_COLORS, 1, 0.4, 24, 0.2);
}

/** Antenas alien — sprite 32×18 extraído da referência */
const ALIEN_ANTENNA_SPRITE = [
  '.DDDDL....................LDDDD.',
  'DDDDDD....................DDDDDD',
  'DDDDDD....................DDDDDD',
  'DDDDDD....................DDDDDD',
  'DDDDDDD..................DDDDDDD',
  'DDDDDDMD................DMDDDDDD',
  'DDDDDDDDD..............DDDDDDDDD',
  'DDDDDDDDDD............DDDDDDDDDD',
  '.DDDD..DDDDD........DDDDD..DDDD.',
  '........DDDD........DDDD........',
  '........DDDDD......DDDDD........',
  '.........DDDDD....DDDDD.........',
  '.........DDDDD....DDDDD.........',
  '..........DDDDD..DDDDD..........',
  '..........DDDDD..DDDDD..........',
  '..........DDDDDMMDDDDD..........',
  '...........DDDDDDDDDD...........',
  '...........DD......DD...........',
] as const;

const ALIEN_ANTENNA_COLORS: Record<string, string> = {
  L: '#B9D2A5',
  M: '#91AD72',
  D: '#479607',
};

function drawAlienAntenna(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  animT: number,
): void {
  const sway = Math.sin(animT * 4.2) * u * 0.1;
  ctx.save();
  ctx.translate(sway, 0);
  // Linha 17 = bases escuras apoiadas no topo da cabeça
  drawSpriteHat(ctx, bw, bh, animT, ALIEN_ANTENNA_SPRITE, ALIEN_ANTENNA_COLORS, 1, 0.38, 17, 0.05);
  ctx.restore();
}

function drawSantaHat(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  animT: number,
): void {
  const s = 1.4;
  const sway = Math.sin(animT * 2.8) * u * 0.2;
  const brimY = -bh * 0.36;
  const red = '#D85858';
  const redLo = '#B84040';
  const redHi = '#E87878';
  const fur = PASTEL.cream;
  const furLo = '#E8E0D8';
  const furHi = rgba(PASTEL.white, 0.9);
  const pom = PASTEL.cream;

  // barra de pelúcia
  fillPx(ctx, -bw * 0.38 + sway, brimY + u * 0.25, bw * 0.76, u * 2.8 * s, furLo);
  fillPx(ctx, -bw * 0.36 + sway, brimY, bw * 0.72, u * 2.5 * s, fur);
  fillPx(ctx, -bw * 0.28 + sway, brimY + u * 0.35, bw * 0.56, u * 1.2, furHi);

  // corpo do gorro inclinado
  fillPx(ctx, -bw * 0.26 + sway, brimY - u * 3.2 * s, bw * 0.44, u * 4 * s, redLo);
  fillPx(ctx, -bw * 0.22 + sway, brimY - u * 3.8 * s, bw * 0.38, u * 4.5 * s, red);
  fillPx(ctx, -bw * 0.12 + sway, brimY - u * 5.6 * s, bw * 0.28, u * 3.5 * s, red);
  fillPx(ctx, bw * 0.02 + sway, brimY - u * 7.2 * s, u * 3.5 * s, u * 3 * s, redLo);
  fillPx(ctx, bw * 0.1 + sway, brimY - u * 8.5 * s, u * 2.8 * s, u * 2.6 * s, red);
  fillPx(ctx, bw * 0.16 + sway, brimY - u * 9.8 * s, u * 2.4 * s, u * 2.2 * s, redHi);

  // pompom
  const pomX = bw * 0.26 + sway;
  const pomY = brimY - u * 10.8 * s + Math.sin(animT * 3.5) * u * 0.15;
  fillPx(ctx, pomX - u * 1.8 * s, pomY - u * 1.5 * s, u * 3.6 * s, u * 3.2 * s, furLo);
  fillPx(ctx, pomX - u * 1.45 * s, pomY - u * 1.15 * s, u * 2.9 * s, u * 2.6 * s, pom);
  fillPx(ctx, pomX - u * 0.75 * s, pomY - u * 0.7 * s, u * 1.5 * s, u * 1.5 * s, furHi);
}

function drawCatEars(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  animT: number,
): void {
  const s = 1.05;
  const twitchL = Math.sin(animT * 5.5) * u * 0.22;
  const twitchR = Math.sin(animT * 5.5 + 1.2) * u * 0.22;
  const fur = '#988878';
  const furLo = '#786858';
  const furHi = '#B8A898';
  const inner = PASTEL.blush;
  const innerHi = '#F8C8D0';
  const baseY = -bh * 0.42;

  const lx = -bw * 0.32 + twitchL;
  fillPx(ctx, lx - u * 3 * s, baseY - u * 4.2 * s, u * 3.8 * s, u * 5.4 * s, furLo);
  fillPx(ctx, lx - u * 2.55 * s, baseY - u * 4.9 * s, u * 3.1 * s, u * 6.1 * s, fur);
  fillPx(ctx, lx - u * 1.85 * s, baseY - u * 6.6 * s, u * 2.2 * s, u * 3.8 * s, furHi);
  fillPx(ctx, lx - u * 1.5 * s, baseY - u * 9 * s, u * 1.5 * s, u * 2.6 * s, fur);
  fillPx(ctx, lx - u * 1.15 * s, baseY - u * 10.6 * s, u * 1.1 * s, u * 1.7 * s, furHi);
  fillPx(ctx, lx - u * 2.35 * s, baseY - u * 4 * s, u * 2 * s, u * 3.8 * s, inner);
  fillPx(ctx, lx - u * 1.95 * s, baseY - u * 5.2 * s, u * 1.5 * s, u * 2.9 * s, innerHi);

  const rx = bw * 0.24 + twitchR;
  fillPx(ctx, rx - u * 0.8 * s, baseY - u * 4.2 * s, u * 3.8 * s, u * 5.4 * s, furLo);
  fillPx(ctx, rx - u * 0.55 * s, baseY - u * 4.9 * s, u * 3.1 * s, u * 6.1 * s, fur);
  fillPx(ctx, rx - u * 0.25 * s, baseY - u * 6.6 * s, u * 2.2 * s, u * 3.8 * s, furHi);
  fillPx(ctx, rx + u * 0.05, baseY - u * 9 * s, u * 1.5 * s, u * 2.6 * s, fur);
  fillPx(ctx, rx + u * 0.3 * s, baseY - u * 10.6 * s, u * 1.1 * s, u * 1.7 * s, furHi);
  fillPx(ctx, rx + u * 0.25 * s, baseY - u * 4 * s, u * 2 * s, u * 3.8 * s, inner);
  fillPx(ctx, rx + u * 0.55 * s, baseY - u * 5.2 * s, u * 1.5 * s, u * 2.9 * s, innerHi);
}

/** Orelhas redondas clássicas — estilo Mickey */
function drawMickeyEars(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  animT: number,
): void {
  const s = 1.35;
  const bob = Math.sin(animT * 3.2) * u * 0.12;
  const bandY = -bh * 0.36 + bob;
  const black = '#2E2C34';
  const blackLo = '#1E1C24';
  const shine = rgba(PASTEL.white, 0.22);

  // faixa na cabeça
  fillPx(ctx, -bw * 0.3, bandY + u * 0.4, bw * 0.6, u * 1.6 * s, blackLo);
  fillPx(ctx, -bw * 0.28, bandY + u * 0.55, bw * 0.56, u * 1.2 * s, black);

  const ear = (cx: number, phase: number): void => {
    const wob = Math.sin(animT * 4 + phase) * u * 0.08;
    const x = cx + wob;
    const cy = bandY - u * 2.2 * s;

    fillPx(ctx, x - u * 3 * s, cy - u * 2.8 * s, u * 6 * s, u * 5.6 * s, blackLo);
    fillPx(ctx, x - u * 2.65 * s, cy - u * 2.45 * s, u * 5.3 * s, u * 5 * s, black);
    fillPx(ctx, x - u * 2.1 * s, cy - u * 2.1 * s, u * 4.2 * s, u * 4 * s, black);
    fillPx(ctx, x - u * 1.4 * s, cy - u * 2.4 * s, u * 1.4 * s, u * 1.2 * s, shine);
  };

  ear(-bw * 0.34, 0);
  ear(bw * 0.28, 1.5);
}

/** Boné Mario — sprite lateral extraído da referência (18×12 px lógicos) */
const MARIO_CAP_SPRITE = [
  '......RRRRRRRR....',
  '......RRRRRRRR....',
  '...RRRRRRRWWRRR...',
  '...RRRRRRRWWRRR...',
  '.RRRRRRRWWRRWWR...',
  '.RRRRRRRWWRRWWR...',
  'RRRRRRRRWWRRWWR...',
  'RRRRRRRRWWRRWWR...',
  'RRRRRRRDDDDDDDD...',
  'RRRRRRRDDDDDDDD...',
  '.RRRDDDDDDDDDDDDDD',
  '.RRRDDDDDDDDDDDDDD',
] as const;

const MARIO_CAP_COLORS: Record<string, string> = {
  R: '#D43030',
  D: '#72090A',
  W: '#FFFFFF',
};

/** Chapéu de palha — sprite 26×13 extraído da referência */
const STRAW_HAT_SPRITE = [
  '........OOOOOOOOOO........',
  '.......OSySySyyYYO........',
  '.......OSSSSSyyYYSO.......',
  '....OOOORSSSyyyYYYO.......',
  '.OOOSRRORRSyyYYyySO.......',
  'OSSSRRRORRSSSyyyySOOOOS...',
  'OSSSRRRORRSSSyyySROyyyOO..',
  'OSSSSRRRRRRSSSyRRRyyyyySO.',
  'OSSSSSSRRRRRRRRRRyyyyyyyyO',
  '.OSSSSSSSSRRSSyyyyyyyySyyO',
  '..OOOSSSSSSyyyyyyyyyyyyySO',
  '...SSOOSySSSSSSyyyyySyyOS.',
  '......SOOOSSSSSSSSSOSOOO..',
] as const;

const STRAW_HAT_COLORS: Record<string, string> = {
  O: '#141010',
  Y: '#FAD040',
  y: '#F8C33A',
  L: '#FCE868',
  S: '#E88B36',
  s: '#C87830',
  R: '#C84838',
  D: '#882828',
  B: '#985820',
};

/** Chapéu pirata — sprite 26×24 extraído da referência */
const PIRATE_HAT_SPRITE = [
  '.......HYH.....YYY........',
  '....HHYHLLH...YYBYYYH.....',
  '....HYLLBLHYYYYBBBBYY.....',
  '....HYLLLBBYYYBBBBBYY.....',
  'HYH..HHLBLBBBBBBBBBBH..YYH',
  'HYHH.HLLBBBBWKWBBBBB..HYYH',
  'LBYHHBBBBBBWwWBBBBBBHHYBBB',
  'LBBBBBBBBBBLBLBBBBBBBBBBBB',
  'HHHHHHHHHHHHHHHHHHHHHHHHHH',
  'HHHHHDDDDDDDDDDDDDDDHHHHHH',
  'HBBDDRRRRRRRRRRRRRRRDDDBBL',
  '.BDRRRRRRRRRRRRRRRRRRDDDB.',
  '..DDR...............RDDD..',
  '..RD......................',
  '..RR......................',
  '..RD......................',
  '..HD......................',
  '..RDH.....................',
  '..RRD.....................',
  '..RRD.....................',
  '..HRR.....................',
  '...R......................',
  '...R......................',
  '...R......................',
] as const;

const PIRATE_HAT_COLORS: Record<string, string> = {
  B: '#3C3C3C',
  H: '#585858',
  L: '#808080',
  Y: '#FFAB18',
  O: '#FFC363',
  W: '#FFFFFF',
  w: '#C8C8C8',
  K: '#3A3A3A',
  R: '#E05E5E',
  D: '#8E1617',
  r: '#BB2D2C',
};

/** Orelhas de coelho — sprite 28×39 extraído da referência */
const BUNNY_EARS_SPRITE = [
  'WWW......................WWW',
  'WWWWW..................WWWWW',
  'WWWWWp................pWWWWW',
  'WWWWWp................pWWWWW',
  'WWWWWWW..............WWWWWWW',
  'WWWWWWW..............WWWWWWW',
  'WWWWWWWW............WWWWWWWW',
  'WWWpWWWW............WWWWpWWW',
  'WWWppWWW............WWWppWWW',
  'WWWppWWWWW........WWWWWppWWW',
  'WWWpppWWWW........WWWWpppWWW',
  'WWWppppWWWW......WWWWppppWWW',
  'WWWpppppWWW......WWWpppppWWW',
  'WWWppppppWW......WWppppppWWW',
  'WWWppppppWW......WWppppppWWW',
  'WWWppppppWWW....WWWppppppWWW',
  'WWWppppppWWW....WWWppppppWWW',
  '.WWpppppppWW....WWpppppppWW.',
  '.WWpppppppWW....WWpppppppWW.',
  '.WWpppppPpWW....WWpPpppppWW.',
  '.WWWppppPpWW....WWpPppppWWW.',
  '.WWWpppRPpWW....WWpPPpppWWW.',
  '..WWppPRPpWW....WWpPPRppWW..',
  '..WWppPPPpWW....WWpPPPppWW..',
  '...WWpPPPpWW....WWpPPPpWW...',
  '...WWppPPPWW....WWPPPppWW...',
  '...WWWpppPWW....WWPpppWWW...',
  '.....WWPpPWW....WWPpPWW.....',
  '.....WpPPpWW....WWpPPpW.....',
  '......WWPpWWWWWWWWpPWW......',
  '......WWWWWWWWWWWWWWWW......',
  '.....WWWWWWWWWWWWWWWWWW.....',
  '.....WWWWWppppppppWWWWW.....',
  '.....WWWppp......pppWWW.....',
  '...WWWpp............ppWWW...',
  '...WWWpp............ppWWW...',
  '..WWWpp..............ppWWW..',
  '..WWpp................ppWW..',
  '..WWW..................WWW..',
] as const;

const BUNNY_EARS_COLORS: Record<string, string> = {
  W: '#FDF8FA',
  p: '#FAD4DD',
  P: '#F9A9BE',
  R: '#E87898',
};

function isInGameBody(bw: number): boolean {
  return bw < px(ACCESSORY_REF_BW) * 0.9;
}

function spriteHatPixel(bw: number): number {
  const refBw = px(ACCESSORY_REF_BW);
  const inGame = isInGameBody(bw);
  return u * (bw / refBw) * (inGame ? 1.45 : 1);
}

function drawSpriteHat(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  animT: number,
  sprite: readonly string[],
  colors: Record<string, string>,
  facing: number,
  anchorYFactor = 0.38,
  anchorRow?: number,
  yOffsetMul = 0,
): void {
  const bob = Math.sin(animT * 2.6) * u * 0.08;
  const pixel = spriteHatPixel(bw);
  const cols = sprite[0]!.length;
  const rows = sprite.length;
  const headRow = anchorRow ?? rows - 1;
  const anchorY = -bh * anchorYFactor + bob;
  const ox = -px((cols * pixel) / 2);
  const oy = anchorY - headRow * pixel + pixel * yOffsetMul;

  drawPixelAccessorySprite(ctx, sprite, ox, oy, colors, facing, pixel);
}

function drawPixelAccessorySprite(
  ctx: CanvasRenderingContext2D,
  sprite: readonly string[],
  ox: number,
  oy: number,
  colors: Record<string, string>,
  facing: number,
  pixel: number = u,
): void {
  const rows = sprite.length;
  const cols = sprite[0]?.length ?? 0;
  const mirror = facing < 0;

  for (let y = 0; y < rows; y++) {
    const row = sprite[y]!;
    for (let x = 0; x < cols; x++) {
      const sx = mirror ? cols - 1 - x : x;
      const ch = row[sx];
      if (!ch || ch === '.') continue;
      const color = colors[ch];
      if (!color) continue;
      fillPx(ctx, ox + x * pixel, oy + y * pixel, pixel, pixel, color);
    }
  }
}

/** Boné vermelho estilo Mario — perfil lateral com aba e emblema branco */
function drawMarioCap(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  animT: number,
  facing = 1,
): void {
  const bob = Math.sin(animT * 2.6) * u * 0.08;
  const pixel = spriteHatPixel(bw);
  const cols = MARIO_CAP_SPRITE[0]!.length;
  const rows = MARIO_CAP_SPRITE.length;
  const anchorY = -bh * 0.36 + bob;
  const lean = facing * pixel * 0.35;
  const ox = lean - px((cols * pixel) / 2);
  const oy = anchorY - rows * pixel;

  drawPixelAccessorySprite(ctx, MARIO_CAP_SPRITE, ox, oy, MARIO_CAP_COLORS, facing, pixel);
}

/** Tiara com orelhas altas — interior rosa em gradiente */
function drawBunnyEars(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  animT: number,
): void {
  const sway = Math.sin(animT * 4.8) * u * 0.05;
  ctx.save();
  ctx.translate(sway, 0);
  // Linha 31 = faixa branca que encosta na cabeça
  drawSpriteHat(ctx, bw, bh, animT, BUNNY_EARS_SPRITE, BUNNY_EARS_COLORS, 1, 0.38, 31, 0.12);
  ctx.restore();
}

/** Chapéu pirata — bicorne com caveira, borda dourada e bandana */
function drawPirateHat(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  animT: number,
  facing = 1,
): void {
  // Linha 11 = base da faixa vermelha; bandana pendente fica abaixo da cabeça
  drawSpriteHat(ctx, bw, bh, animT, PIRATE_HAT_SPRITE, PIRATE_HAT_COLORS, facing, 0.38, 11, 0.2);
}

/** Mini ícone para botões do editor */
export function drawAccessoryIcon(
  ctx: CanvasRenderingContext2D,
  id: AccessoryId,
  size: number,
): void {
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.translate(size / 2, size * 0.62);
  const bigIcon =
    id === 'bow' ||
    id === 'sprout' ||
    id === 'crown' ||
    id === 'alienAntenna' ||
    id === 'santaHat' ||
    id === 'sunhat' ||
    id === 'catEars' ||
    id === 'bunnyEars' ||
    id === 'mickeyEars' ||
    id === 'marioCap' ||
    id === 'pirateHat';
  const boost =
    id === 'bow' ||
    id === 'sprout' ||
    id === 'alienAntenna' ||
    id === 'santaHat' ||
    id === 'sunhat' ||
    id === 'catEars' ||
    id === 'bunnyEars' ||
    id === 'mickeyEars' ||
    id === 'marioCap' ||
    id === 'pirateHat' ||
    id === 'crown'
      ? 1.12
      : bigIcon
        ? 1
        : 0.72;
  const bw = px(size * boost);
  const bh = px(size * boost);
  if (id === 'none') {
    ctx.fillStyle = rgba(PASTEL.inkSoft, 0.32);
    const w = Math.max(14, size * 0.32);
    ctx.fillRect(-w / 2, -1, w, 3);
  } else {
    drawPlayerAccessory(ctx, bw, bh, id, accessoryLayers(id)[0] ?? 'underFace', 0, 1);
  }
  ctx.restore();
}
