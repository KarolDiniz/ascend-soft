import type { HairStyleId, PlayerAppearance } from './playerAppearance';
import { PASTEL, rgba } from '../theme/pastelPalette';
import { fillPx, px, PIXEL } from '../theme/pixel';

const u = PIXEL.unit;

/** Paleta fixa de cabelo — marrom quente com profundidade */
const HAIR = {
  deep: '#2A2018',
  shadow: '#3A2E24',
  main: '#5C4536',
  mid: '#6E5444',
  hi: '#8B6B52',
  shine: rgba(PASTEL.white, 0.45),
  ribbonDeep: '#A86078',
  ribbon: PASTEL.rose,
  ribbonBlush: PASTEL.blush,
  ribbonHi: rgba(PASTEL.white, 0.72),
} as const;

export interface HairColors {
  main: string;
  hi: string;
  shadow: string;
  ribbon: string;
}

export type HairLayer = 'underFace' | 'overFace';

export function resolveHairColors(_app?: PlayerAppearance): HairColors {
  return {
    main: HAIR.main,
    hi: HAIR.hi,
    shadow: HAIR.shadow,
    ribbon: HAIR.ribbon,
  };
}

export function hairLayers(_id: HairStyleId): HairLayer[] {
  return ['underFace'];
}

export function drawPlayerHairIfAny(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  app: PlayerAppearance,
  animT: number,
): void {
  if (app.hairStyle === 'none') return;
  drawPlayerHair(ctx, bw, bh, app.hairStyle, 'underFace', animT, resolveHairColors(app));
}

export function drawPlayerHair(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  style: HairStyleId,
  layer: HairLayer,
  animT: number,
  colors: HairColors,
): void {
  if (style === 'none' || layer !== 'underFace') return;

  switch (style) {
    case 'pigtails':
      drawPigtails(ctx, bw, bh, animT, colors);
      break;
    case 'mohawk':
      drawMohawk(ctx, bw, bh, animT, colors);
      break;
    case 'mullet':
      drawMullet(ctx, bw, bh, animT, colors);
      break;
  }
}

/* ── Helpers de desenho ── */

/** Domo arredondado no topo da cabeça */
function drawHairCrown(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  c: HairColors,
  y = -bh * 0.46,
): void {
  fillPx(ctx, -bw * 0.36, y + u * 2.4, bw * 0.72, u * 4.6, HAIR.deep);
  fillPx(ctx, -bw * 0.34, y + u * 1.6, bw * 0.68, u * 4, c.shadow);
  fillPx(ctx, -bw * 0.32, y + u * 0.8, bw * 0.64, u * 3.6, c.main);
  fillPx(ctx, -bw * 0.28, y + u * 0.2, bw * 0.56, u * 3.2, HAIR.mid);
  fillPx(ctx, -bw * 0.22, y - u * 0.2, bw * 0.44, u * 2.8, c.hi);
  fillPx(ctx, -bw * 0.14, y, bw * 0.28, u * 2, c.hi);
  fillPx(ctx, -bw * 0.08, y + u * 0.8, bw * 0.16, u, HAIR.shine);
}

/** Franja suave na testa */
function drawHairBangs(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  c: HairColors,
): void {
  const y = -bh * 0.34;
  fillPx(ctx, -bw * 0.26, y, bw * 0.52, u * 2.4, c.shadow);
  fillPx(ctx, -bw * 0.24, y + u * 0.2, bw * 0.48, u * 2, c.main);
  fillPx(ctx, -bw * 0.2, y + u * 0.4, u * 1.6, u * 1.6, c.main);
  fillPx(ctx, bw * 0.12, y + u * 0.4, u * 1.6, u * 1.6, c.main);
  fillPx(ctx, -bw * 0.1, y + u * 0.6, bw * 0.2, u, c.hi);
  fillPx(ctx, -u * 1.8, y + u * 0.3, u * 1.2, u, HAIR.shine);
}

/** Pico de cabelo com camadas — `scale` engrossa (ex.: moicano) */
function drawHairSpike(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  height: number,
  c: HairColors,
  sway = 0,
  scale = 1,
): void {
  const h = px(height);
  fillPx(ctx, x - u * 0.7 * scale + sway, baseY - h, u * 1.4 * scale, h + u * 0.5, HAIR.deep);
  fillPx(ctx, x - u * 0.55 * scale + sway, baseY - h + u * 0.25, u * 1.1 * scale, h - u * 0.1, c.shadow);
  fillPx(ctx, x - u * 0.42 * scale + sway, baseY - h + u * 0.45, u * 0.85 * scale, h - u * 0.35, c.main);
  fillPx(ctx, x - u * 0.22 * scale + sway, baseY - h + u * 0.6, u * 0.5 * scale, h * 0.5, c.hi);
  fillPx(ctx, x - u * 0.12 * scale + sway, baseY - h + u * 0.45, u * 0.3 * scale, u * 0.8, HAIR.shine);
}

/** Mecha fluida com ponta fina */
function drawHairStrand(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  len: number,
  w: number,
  c: HairColors,
  side: number,
): void {
  fillPx(ctx, x - w * 0.5, y, w, len * 0.55, c.shadow);
  fillPx(ctx, x - w * 0.38, y + u * 0.2, w * 0.76, len * 0.48, c.main);
  fillPx(ctx, x + side * w * 0.15, y + u * 0.4, w * 0.35, len * 0.35, c.hi);
  fillPx(ctx, x - w * 0.2 + side * u * 0.3, y + len * 0.45, w * 0.55, len * 0.22, c.main);
  fillPx(ctx, x + side * w * 0.1, y + len * 0.62, w * 0.35, u * 1.8, c.shadow);
  fillPx(ctx, x + side * w * 0.15, y + len * 0.78, w * 0.22, u * 1.2, HAIR.deep);
}

/** Laço mini para maria-chiquinha */
function drawMiniRibbon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  flip: number,
): void {
  const lx = cx - u * 2.2;
  const rx = cx + u * 0.4;

  fillPx(ctx, lx - u * 0.3, cy - u * 1.4, u * 3.2, u * 2.6, HAIR.ribbonDeep);
  fillPx(ctx, lx, cy - u * 1.2, u * 2.6, u * 2.2, HAIR.ribbon);
  fillPx(ctx, lx + u * 0.5, cy - u * 1.1, u * 1.6, u * 1.8, HAIR.ribbonBlush);
  fillPx(ctx, lx + u * 0.9, cy - u * 1.3, u * 0.7, u * 0.8, HAIR.ribbonHi);

  fillPx(ctx, rx - u * 0.3, cy - u * 1.4, u * 3.2, u * 2.6, HAIR.ribbonDeep);
  fillPx(ctx, rx + u * 0.2, cy - u * 1.2, u * 2.6, u * 2.2, HAIR.ribbon);
  fillPx(ctx, rx + u * 0.7, cy - u * 1.1, u * 1.6, u * 1.8, HAIR.ribbonBlush);
  fillPx(ctx, rx + u * 1.1, cy - u * 1.3, u * 0.7, u * 0.8, HAIR.ribbonHi);

  fillPx(ctx, cx - u * 0.7, cy - u * 0.4, u * 1.4, u * 1.4, HAIR.ribbonDeep);
  fillPx(ctx, cx - u * 0.5, cy - u * 0.25, u * 1, u * 1, HAIR.ribbon);
  fillPx(ctx, cx - u * 0.3, cy - u * 0.15, u * 0.55, u * 0.55, HAIR.ribbonHi);

  fillPx(ctx, cx - u * 0.9 + flip * u * 0.2, cy + u * 0.5, u * 0.9, u * 2.2, HAIR.ribbonBlush);
  fillPx(ctx, cx + u * 0.1 - flip * u * 0.2, cy + u * 0.5, u * 0.9, u * 2.2, HAIR.ribbonBlush);
}

/* ── Penteados ── */

/** Maria-chiquinha — duas chiquinhas verticais apontando pra cima */
function drawPigtails(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  animT: number,
  c: HairColors,
): void {
  const bounceL = Math.sin(animT * 5.2) * u * 0.35;
  const bounceR = Math.sin(animT * 5.2 + 1.4) * u * 0.35;
  const swayL = Math.sin(animT * 3.8) * u * 0.1;
  const swayR = Math.sin(animT * 3.8 + 0.9) * u * 0.1;

  drawHairCrown(ctx, bw, bh, c);
  drawHairBangs(ctx, bw, bh, c);

  // risco central
  fillPx(ctx, -u * 0.4, -bh * 0.47, u * 0.8, u * 2.8, HAIR.deep);
  fillPx(ctx, -u * 0.15, -bh * 0.46, u * 0.3, u * 2.4, rgba(HAIR.hi, 0.35));

  const pigtail = (tieX: number, tieY: number, bounce: number, sway: number, flip: number): void => {
    const x = tieX + sway;
    const y = tieY + bounce * 0.15;
    const shaftH = u * 6.2;
    const topY = y - shaftH;

    // elástico na base
    fillPx(ctx, x - u * 1.2, y - u * 0.5, u * 2.4, u * 1.3, HAIR.deep);
    fillPx(ctx, x - u * 0.95, y - u * 0.35, u * 1.9, u * 1, c.shadow);
    drawMiniRibbon(ctx, x, y, flip);

    // mecha vertical pra cima
    fillPx(ctx, x - u * 0.95, topY + u * 0.4, u * 1.9, shaftH - u * 0.2, HAIR.deep);
    fillPx(ctx, x - u * 0.72, topY + u * 0.6, u * 1.45, shaftH - u * 0.5, c.shadow);
    fillPx(ctx, x - u * 0.58, topY + u * 0.8, u * 1.15, shaftH - u * 0.9, c.main);
    fillPx(ctx, x - u * 0.32, topY + u * 1.1, u * 0.65, shaftH - u * 1.4, c.hi);
    fillPx(ctx, x - u * 0.18, topY + u * 1.5, u * 0.38, shaftH * 0.45, HAIR.shine);

    // coque fofo no topo — apontando pra cima
    const puffY = topY - u * 1.6 + bounce * 0.4;
    fillPx(ctx, x - u * 2.1, puffY - u * 1.2, u * 4.2, u * 4, HAIR.deep);
    fillPx(ctx, x - u * 1.85, puffY - u * 0.95, u * 3.7, u * 3.5, c.shadow);
    fillPx(ctx, x - u * 1.55, puffY - u * 0.7, u * 3.1, u * 3, c.main);
    fillPx(ctx, x - u * 1.15, puffY - u * 1.15, u * 2.3, u * 2.2, c.hi);
    fillPx(ctx, x - u * 0.45, puffY - u * 0.75, u * 1, u * 1, HAIR.shine);

    // ponta vertical no topo
    fillPx(ctx, x - u * 0.32, puffY - u * 2.4, u * 0.65, u * 1.6, c.main);
    fillPx(ctx, x - u * 0.2, puffY - u * 3.5, u * 0.42, u * 1.3, c.hi);
    fillPx(ctx, x - u * 0.12, puffY - u * 4.5, u * 0.28, u * 0.9, HAIR.shine);

    // mecha curta saindo do elástico (direção ↑)
    fillPx(ctx, x + flip * u * 0.35, y - u * 1.2, u * 0.55, u * 1.4, c.main);
    fillPx(ctx, x + flip * u * 0.45, y - u * 2.2, u * 0.4, u * 1.1, c.hi);
  };

  // bases altas nas laterais do topo — chiquinhas sobem verticalmente
  pigtail(-bw * 0.22, -bh * 0.34, bounceL, swayL, -1);
  pigtail(bw * 0.14, -bh * 0.34, bounceR, swayR, 1);
}

/** Moicano — laterais raspadas e crista alta */
function drawMohawk(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  animT: number,
  c: HairColors,
): void {
  const base = -bh * 0.44;

  // laterais raspadas — sombra sutil
  fillPx(ctx, -bw * 0.34, -bh * 0.36, u * 2.4, u * 2.8, rgba(HAIR.deep, 0.55));
  fillPx(ctx, bw * 0.22, -bh * 0.36, u * 2.4, u * 2.8, rgba(HAIR.deep, 0.55));

  // faixa central mais larga
  fillPx(ctx, -u * 2.8, base + u * 0.5, u * 5.6, u * 2.4, c.shadow);
  fillPx(ctx, -u * 2.3, base + u * 0.25, u * 4.6, u * 2, c.main);
  fillPx(ctx, -u * 1.6, base + u * 0.1, u * 3.2, u * 1.4, c.hi);

  const spikes = [
    { i: -2, h: 7.8 },
    { i: -1, h: 10.2 },
    { i: 0, h: 12.5 },
    { i: 1, h: 10.2 },
    { i: 2, h: 7.8 },
  ];

  for (const { i, h } of spikes) {
    const sway = Math.sin(animT * 7 + i * 0.9) * u * (0.14 + Math.abs(i) * 0.05);
    drawHairSpike(ctx, i * u * 2, base - u * 0.35, u * h, c, sway, 1.35);
  }

  // brilho gel no topo
  fillPx(ctx, -u * 0.65, base - u * 11.8, u * 1.3, u * 2.4, HAIR.shine);
}

/** Mullet — topo curto, cauda longa nas laterais */
function drawMullet(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  animT: number,
  c: HairColors,
): void {
  const sway = Math.sin(animT * 3.2) * u * 0.25;

  // topo texturizado
  fillPx(ctx, -bw * 0.3, -bh * 0.44, bw * 0.6, u * 3.2, HAIR.deep);
  fillPx(ctx, -bw * 0.28, -bh * 0.42, bw * 0.56, u * 2.8, c.shadow);
  fillPx(ctx, -bw * 0.24, -bh * 0.4, bw * 0.48, u * 2.4, c.main);
  fillPx(ctx, -bw * 0.16, -bh * 0.42, bw * 0.32, u * 2, c.hi);

  // franja curta estilo anos 80
  fillPx(ctx, -bw * 0.22, -bh * 0.32, bw * 0.44, u * 1.8, c.main);
  fillPx(ctx, -bw * 0.18, -bh * 0.3, bw * 0.36, u * 1.2, c.hi);
  fillPx(ctx, -u * 2, -bh * 0.28, u * 4, u, HAIR.shine);

  const tail = (side: number): void => {
    const x = side * bw * 0.36 + sway * side;
    const layers = [
      { ox: 0, len: bh * 0.42, w: u * 2.2 },
      { ox: side * u * 0.6, len: bh * 0.36, w: u * 1.8 },
      { ox: -side * u * 0.4, len: bh * 0.3, w: u * 1.5 },
    ];
    for (const layer of layers) {
      drawHairStrand(ctx, x + layer.ox, -bh * 0.06, layer.len, layer.w, c, side);
    }
    // ponta em camadas
    fillPx(ctx, x + side * u * 0.2, bh * 0.28, u * 1.4, u * 2.2, c.shadow);
    fillPx(ctx, x + side * u * 0.35, bh * 0.34, u, u * 1.6, HAIR.deep);
  };

  tail(-1);
  tail(1);
}

/** Ícone mini para o editor */
export function drawHairIcon(
  ctx: CanvasRenderingContext2D,
  id: HairStyleId,
  size: number,
  app: PlayerAppearance,
): void {
  ctx.clearRect(0, 0, size, size);
  if (id === 'none') {
    fillPx(ctx, size / 2 - u * 3, size / 2 - u * 0.5, u * 6, u, rgba(PASTEL.inkSoft, 0.22));
    fillPx(ctx, size / 2 - u * 2, size / 2 + u * 0.5, u * 4, u * 0.5, rgba(PASTEL.inkSoft, 0.15));
    return;
  }
  ctx.save();
  ctx.translate(size / 2, size * 0.58);
  const bw = px(size * 0.92);
  const bh = px(size * 0.92);
  const colors = resolveHairColors(app);
  drawPlayerHair(ctx, bw, bh, id, 'underFace', 0, colors);
  ctx.restore();
}
