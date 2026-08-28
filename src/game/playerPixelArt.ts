import { PASTEL, PLAYER_PASTEL, rgba } from '../theme/pastelPalette';
import { PIXEL, fillPx, fillPixelCircle, px } from '../theme/pixel';

export const PLAYER_DRAW_W = 30;
export const PLAYER_DRAW_H = 30;

const u = PIXEL.unit;

/** Anéis horizontais do corpo — largura relativa × posição Y */
const BODY_ROWS: readonly [number, number][] = [
  [0.44, -0.44],
  [0.66, -0.36],
  [0.84, -0.24],
  [0.98, -0.1],
  [1.0, 0.04],
  [1.0, 0.18],
  [0.96, 0.3],
  [0.8, 0.38],
  [0.58, 0.42],
];

export interface PlayerBodyOptions {
  /** Corpo liso — uma cor só, sem faixas (banner) */
  solid?: boolean;
  /** Orelhinhas balançando (banner falando) */
  earWiggle?: number;
  /** Contorno mais forte (tela inicial) */
  boldOutline?: boolean;
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
  /** Olhos marejados e boca triste (legado) */
  crying?: boolean;
  /** Semblante de derrota — só tela game over */
  defeatSad?: boolean;
  /** Olhos fechados de prazer — veludo, seda, algodão */
  landBliss?: boolean;
  /** Boca “O” — sabonete, esponja */
  landOoh?: boolean;
  /** Olhos arregalados — pop, marimba */
  landPop?: boolean;
  /** Semicerrado — grudento */
  landSticky?: boolean;
  /** Rosto com contraste alto (tela inicial) */
  titleBold?: boolean;
  /** Olhos enormes lacrimejando — aviso ao sair */
  leavePlea?: boolean;
}

/** Pontos de origem das lágrimas na derrota (espaço local do rosto) */
export function getDefeatEyeTearOrigins(facing = 1, look = 0): { x: number; y: number }[] {
  const eyeOff = 5 * facing;
  const lookFull = look + facing;
  const eyeY = -u * 5;
  const eyeFill = u * 3;
  const tearY = eyeY + eyeFill - u * 0.5;
  return [
    { x: eyeOff - u * 1.5 + lookFull, y: tearY },
    { x: eyeOff + u * 3.5 + lookFull, y: tearY },
  ];
}

/** Origem das lágrimas no modal “já vai?” */
export function getLeavePleaTearOrigins(facing = 1, look = 0): { x: number; y: number }[] {
  const eyeOff = 5 * facing;
  const lookFull = look + facing;
  const eyeY = -u * 5.5;
  const bigH = u * 7;
  const tearY = eyeY + bigH - u * 0.5;
  return [
    { x: eyeOff - u * 2.5 + lookFull, y: tearY },
    { x: eyeOff + u * 3.5 + lookFull, y: tearY },
  ];
}

/** @deprecated use getDefeatEyeTearOrigins */
export function getCryingEyeTearOrigins(facing = 1, look = 0): { x: number; y: number }[] {
  return getDefeatEyeTearOrigins(facing, look);
}

/** Escala do galo na derrota — quanto mais alto caiu, maior o catombo (~0.55–3.4) */
export function defeatHeadBumpScale(height: number): number {
  const h = Math.max(0, height);
  const core = 1 - Math.exp(-h / 200);
  const tall = h > 140 ? 1 - Math.exp(-(h - 140) / 480) : 0;
  return 0.55 + core * 2.05 + tall * 0.95;
}

/** Galo rosado na cabeça — machucado de queda, só tela game over */
export function drawPlayerDefeatHeadBump(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  animT = 0,
  bumpScale = 1,
): void {
  const scale = Math.max(0.55, bumpScale);
  const wobble = Math.sin(animT * 4.5) * u * 0.2 * scale;
  const bx = bw * 0.08 + wobble;
  const by = -bh * 0.41 - u * (scale - 1) * 1.4;
  const bruise = rgba(PASTEL.rose, 0.96);
  const bruiseHi = rgba('#F8D0D8', 0.92);
  const bruiseLo = rgba('#C97A8A', 0.94);
  const bruiseInk = rgba('#B86A7A', 0.55);

  ctx.save();
  ctx.translate(bx, by);
  ctx.scale(scale, scale);
  ctx.translate(-bx, -by);

  fillPx(ctx, bx - u * 2, by + u, u * 4, u * 2, bruiseLo);
  fillPx(ctx, bx - u * 2.5, by - u * 0.5, u * 5, u * 3, bruise);
  fillPx(ctx, bx - u * 2, by - u * 1.5, u * 4, u * 2, bruise);
  fillPx(ctx, bx - u * 1.5, by - u * 2.5, u * 3, u * 2, bruiseHi);
  fillPx(ctx, bx - u * 0.5, by - u * 2, u, u, rgba(PASTEL.white, 0.48));
  fillPx(ctx, bx - u * 2.5, by + u, u, u, bruiseInk);
  fillPx(ctx, bx + u * 1.5, by, u, u, bruiseInk);
  fillPx(ctx, bx - u * 3, by + u * 0.5, u * 2, u, rgba(PASTEL.coral, 0.35));

  if (scale >= 1.55) {
    fillPx(ctx, bx - u * 3.5, by - u * 3, u * 2, u * 2, bruiseLo);
    fillPx(ctx, bx + u * 2, by - u * 2.5, u * 2, u, rgba(PASTEL.coral, 0.4));
  }
  if (scale >= 2) {
    fillPx(ctx, bx - u * 0.5, by - u * 3.5, u * 2, u * 2, bruiseHi);
    fillPx(ctx, bx - u * 4, by - u * 1, u, u * 2, bruiseInk);
  }

  ctx.restore();
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
  bold = false,
): void {
  const ink = bold ? rgba(PASTEL.ink, 0.82) : PLAYER_PASTEL.outline;
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
  boldOutline = false,
): void {
  const fill = PLAYER_PASTEL.bodySolid;
  const total = BODY_ROWS.length;

  for (let i = 0; i < total; i++) {
    const [ww, yy] = BODY_ROWS[i]!;
    const rw = px(bw * ww);
    const ry = px(bh * yy);
    fillPx(ctx, -rw / 2, ry, rw, rowHeight(bh, i), fill);
  }

  fillPixelCircle(ctx, 0, bh * 0.02, bw * 0.5, fill);

  const earBounce = earWiggle * u;
  fillPx(ctx, -bw * 0.36, -bh * 0.38 - earBounce, u * 2, u * 2, fill);
  fillPx(ctx, bw * 0.28, -bh * 0.38 + earBounce * 0.6, u * 2, u * 2, fill);
  fillPx(ctx, -bw * 0.34, -bh * 0.36 - earBounce, u, u, PLAYER_PASTEL.bodyHi);

  fillPx(ctx, -bw * 0.16, -bh * 0.32, bw * 0.32, u * 2, PLAYER_PASTEL.bodyHi);
  if (Math.sin(animT * 4) > 0.6) {
    fillPx(ctx, -bw * 0.06, -bh * 0.28, bw * 0.14, u, rgba(PASTEL.white, 0.4));
  }

  drawBodyOutline(ctx, bw, bh, boldOutline);
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
    drawSolidBlobBody(ctx, bw, bh, animT, opts.earWiggle ?? 0, opts.boldOutline);
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

  drawBodyOutline(ctx, bw, bh, opts.boldOutline);
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
  const crying = opts.crying ?? false;
  const defeatSad = opts.defeatSad ?? false;
  const landBliss = opts.landBliss ?? false;
  const landOoh = opts.landOoh ?? false;
  const landPop = opts.landPop ?? false;
  const landSticky = opts.landSticky ?? false;
  const titleBold = opts.titleBold ?? false;
  const eyeLine = titleBold ? PASTEL.ink : PLAYER_PASTEL.eyeLine;
  const eyeFill = titleBold ? PASTEL.ink : PLAYER_PASTEL.eyeFill;
  const look = (opts.look ?? 0) + facing;
  const eyeOff = 5 * facing;
  const eyeY = -u * 5;
  const eyeW = u * 4;
  const eyeH = excited && mouthOpen && !crying && !defeatSad ? u * 6 : u * 5;
  const mouthY = u * 2.5;
  const blushY = u * 1.5;

  fillPx(ctx, -bw * 0.14, -bh * 0.32, bw * 0.28, u, rgba(PASTEL.white, 0.35));

  const blushAlpha = defeatSad ? 0.38 : crying ? 0.42 : excited && mouthOpen ? 0.65 : 0.55;
  const blush = rgba(PASTEL.rose, blushAlpha);
  fillPx(ctx, -u * 5, blushY, u * 2, u, blush);
  fillPx(ctx, -u * 4, blushY + u, u, u, blush);
  fillPx(ctx, u * 3, blushY, u * 2, u, blush);
  fillPx(ctx, u * 4, blushY + u, u, u, blush);

  if (opts.leavePlea) {
    const blushStrong = rgba(PASTEL.rose, 0.68);
    fillPx(ctx, -u * 6, blushY - u * 0.5, u * 2, u, blushStrong);
    fillPx(ctx, -u * 5, blushY + u * 0.5, u, u, blushStrong);
    fillPx(ctx, u * 4, blushY - u * 0.5, u * 2, u, blushStrong);
    fillPx(ctx, u * 5, blushY + u * 0.5, u, u, blushStrong);

    const bigW = u * 5;
    const bigH = u * 7;
    const eyeYBig = eyeY - u * 0.5;
    const leftX = eyeOff - u * 4 + look;
    const rightX = eyeOff + u * 1 + look;

    fillPx(ctx, leftX, eyeYBig, bigW, bigH, PASTEL.white);
    fillPx(ctx, rightX, eyeYBig, bigW, bigH, PASTEL.white);
    fillPx(ctx, leftX, eyeYBig, bigW, u, eyeLine);
    fillPx(ctx, rightX, eyeYBig, bigW, u, eyeLine);
    fillPx(ctx, leftX, eyeYBig + bigH - u, bigW, u, eyeLine);
    fillPx(ctx, rightX, eyeYBig + bigH - u, bigW, u, eyeLine);
    fillPx(ctx, leftX, eyeYBig, u, bigH, eyeLine);
    fillPx(ctx, leftX + bigW - u, eyeYBig, u, bigH, eyeLine);
    fillPx(ctx, rightX, eyeYBig, u, bigH, eyeLine);
    fillPx(ctx, rightX + bigW - u, eyeYBig, u, bigH, eyeLine);

    fillPx(ctx, leftX + u * 0.8, eyeYBig + u * 1.2, u * 3, u * 4, eyeFill);
    fillPx(ctx, rightX + u * 0.8, eyeYBig + u * 1.2, u * 3, u * 4, eyeFill);
    fillPx(ctx, leftX + u * 1.2, eyeYBig + u * 0.8, u * 1.5, u * 1.5, PASTEL.white);
    fillPx(ctx, rightX + u * 1.2, eyeYBig + u * 0.8, u * 1.5, u * 1.5, PASTEL.white);
    fillPx(ctx, leftX + u * 2.2, eyeYBig + u * 2.8, u, u, rgba(PASTEL.white, 0.75));
    fillPx(ctx, rightX + u * 2.2, eyeYBig + u * 2.8, u, u, rgba(PASTEL.white, 0.75));

    fillPx(ctx, leftX - u * 0.5, eyeYBig - u * 1.2, u * 3, u, eyeLine);
    fillPx(ctx, rightX + u * 1.5, eyeYBig - u * 1.2, u * 3, u, eyeLine);

    fillPx(ctx, leftX + u * 1.5, eyeYBig + bigH, u, u * 2, rgba(PASTEL.sky, 0.92));
    fillPx(ctx, rightX + u * 1.5, eyeYBig + bigH, u, u * 2, rgba(PASTEL.sky, 0.92));

    fillPx(ctx, eyeOff - u * 2.5, mouthY + u * 2, u * 2, u, eyeLine);
    fillPx(ctx, eyeOff + u * 1.5, mouthY + u * 2, u * 2, u, eyeLine);
    fillPx(ctx, eyeOff - u * 0.5, mouthY + u, u * 2, u, eyeLine);
    fillPx(ctx, eyeOff - u, mouthY + u * 1.5, u, u, rgba(PASTEL.rose, 0.45));
    return;
  }

  if (defeatSad) {
    fillPx(ctx, eyeOff - u * 4 + look, eyeY - u, eyeW, eyeH + u, eyeLine);
    fillPx(ctx, eyeOff + u * 1 + look, eyeY - u, eyeW, eyeH + u, eyeLine);
    fillPx(ctx, eyeOff - u * 3 + look, eyeY, u * 3, u * 3, eyeFill);
    fillPx(ctx, eyeOff + u * 2 + look, eyeY, u * 3, u * 3, eyeFill);
    fillPx(ctx, eyeOff - u * 3 + look, eyeY, u, u, PASTEL.white);
    fillPx(ctx, eyeOff + u * 2 + look, eyeY, u, u, PASTEL.white);
    fillPx(ctx, eyeOff - u * 4 + look, eyeY + eyeH - u, eyeW, u, eyeLine);

    fillPx(ctx, eyeOff - u * 3, mouthY + u, u * 2, u, eyeLine);
    fillPx(ctx, eyeOff + u * 2, mouthY + u, u * 2, u, eyeLine);
    fillPx(ctx, eyeOff - u * 2, mouthY, u, u, eyeLine);
    fillPx(ctx, eyeOff + u * 3, mouthY, u, u, eyeLine);
    fillPx(ctx, eyeOff - u, mouthY - u * 0.5, u * 2, u, eyeLine);
    return;
  }

  if (crying) {
    fillPx(ctx, eyeOff - u * 4 + look, eyeY, eyeW, eyeH, eyeLine);
    fillPx(ctx, eyeOff + u * 1 + look, eyeY, eyeW, eyeH, eyeLine);
    fillPx(ctx, eyeOff - u * 3 + look, eyeY - u, u * 3, u * 3, eyeFill);
    fillPx(ctx, eyeOff + u * 2 + look, eyeY - u, u * 3, u * 3, eyeFill);
    fillPx(ctx, eyeOff - u * 3 + look, eyeY - u, u, u, PASTEL.white);
    fillPx(ctx, eyeOff + u * 2 + look, eyeY - u, u, u, PASTEL.white);

    fillPx(ctx, eyeOff - u * 2, mouthY, u * 2, u, eyeLine);
    fillPx(ctx, eyeOff + u * 2, mouthY, u * 2, u, eyeLine);
    fillPx(ctx, eyeOff - u, mouthY - u * 0.5, u * 2, u, eyeLine);
    return;
  }

  if (blinking) {
    fillPx(ctx, eyeOff - u * 4, eyeY + u * 2, eyeW, u, eyeLine);
    fillPx(ctx, eyeOff + u * 1, eyeY + u * 2, eyeW, u, eyeLine);
  } else if (landBliss) {
    fillPx(ctx, eyeOff - u * 4 + look, eyeY + u * 2, eyeW, u, eyeLine);
    fillPx(ctx, eyeOff + u * 1 + look, eyeY + u * 2, eyeW, u, eyeLine);
    fillPx(ctx, eyeOff - u * 3 + look, eyeY + u, u * 2, u, rgba(PASTEL.rose, 0.35));
    fillPx(ctx, eyeOff + u * 2 + look, eyeY + u, u * 2, u, rgba(PASTEL.rose, 0.35));
  } else if (landPop) {
    fillPx(ctx, eyeOff - u * 4 + look, eyeY - u, eyeW, eyeH + u, eyeLine);
    fillPx(ctx, eyeOff + u * 1 + look, eyeY - u, eyeW, eyeH + u, eyeLine);
    fillPx(ctx, eyeOff - u * 2 + look, eyeY, u * 2, u * 2, eyeFill);
    fillPx(ctx, eyeOff + u * 3 + look, eyeY, u * 2, u * 2, eyeFill);
    fillPx(ctx, eyeOff - u * 2 + look, eyeY, u, u, PASTEL.white);
    fillPx(ctx, eyeOff + u * 3 + look, eyeY, u, u, PASTEL.white);
  } else if (landSticky) {
    fillPx(ctx, eyeOff - u * 4 + look, eyeY + u, eyeW, u * 3, eyeLine);
    fillPx(ctx, eyeOff + u * 1 + look, eyeY + u, eyeW, u * 3, eyeLine);
    fillPx(ctx, eyeOff - u * 2 + look, eyeY + u, u * 2, u, eyeFill);
    fillPx(ctx, eyeOff + u * 3 + look, eyeY + u, u * 2, u, eyeFill);
  } else {
    fillPx(ctx, eyeOff - u * 4 + look, eyeY, eyeW, eyeH, eyeLine);
    fillPx(ctx, eyeOff + u * 1 + look, eyeY, eyeW, eyeH, eyeLine);
    fillPx(ctx, eyeOff - u * 3 + look, eyeY - u, u * 3, u * 3, eyeFill);
    fillPx(ctx, eyeOff + u * 2 + look, eyeY - u, u * 3, u * 3, eyeFill);
    fillPx(ctx, eyeOff - u * 3 + look, eyeY - u, u, u, PASTEL.white);
    fillPx(ctx, eyeOff + u * 2 + look, eyeY - u, u, u, PASTEL.white);
    if (Math.sin(animT * 5) > 0.7) {
      fillPx(ctx, eyeOff - u * 2 + look, eyeY + u, u, u, rgba(PASTEL.white, 0.6));
      fillPx(ctx, eyeOff + u * 3 + look, eyeY + u, u, u, rgba(PASTEL.white, 0.6));
    }
  }

  if (landOoh || mouthOpen) {
    const mouthH = landOoh || excited ? u * 3 : u * 2;
    fillPx(ctx, eyeOff - u * 2, mouthY, u * 5, mouthH, eyeLine);
    fillPx(ctx, eyeOff - u, mouthY + u, u * 3, u, rgba(PASTEL.rose, 0.45));
    fillPx(ctx, eyeOff - u * 0.5, mouthY + u * 0.5, u * 2, u, rgba(PASTEL.white, 0.35));
  } else if (landBliss) {
    fillPx(ctx, eyeOff - u * 2, mouthY + u, u * 2, u, eyeLine);
    fillPx(ctx, eyeOff + u * 2, mouthY + u, u * 2, u, eyeLine);
    fillPx(ctx, eyeOff - u, mouthY, u * 3, u, eyeLine);
  } else {
    fillPx(ctx, eyeOff - u, mouthY, u * 2, u, eyeLine);
    fillPx(ctx, eyeOff + u * 2, mouthY, u * 2, u, eyeLine);
  }

  if (opts.showSparkle && Math.sin(animT * 4) > 0.94) {
    fillPx(ctx, bw * 0.3, -bh * 0.38, u, u, PASTEL.butter);
    fillPx(ctx, bw * 0.32, -bh * 0.4, u, u, rgba(PASTEL.white, 0.8));
  }
}
