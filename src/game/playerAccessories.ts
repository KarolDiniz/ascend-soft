import type { AccessoryId } from './playerAppearance';
import { PASTEL, rgba } from '../theme/pastelPalette';
import { fillPx, px, PIXEL } from '../theme/pixel';

const u = PIXEL.unit;

export type AccessoryLayer = 'underFace' | 'overFace';

export function accessoryLayers(id: AccessoryId): AccessoryLayer[] {
  if (id === 'none') return [];
  if (id === 'headphones') return ['overFace'];
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
): void {
  if (accessory === 'none') return;

  const under = layer === 'underFace';
  const over = layer === 'overFace';

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
    case 'star':
      if (under) drawStarClip(ctx, bw, bh, animT);
      break;
    case 'headphones':
      if (over) drawHeadphones(ctx, bw, bh, animT);
      break;
    default:
      break;
  }
}

function drawBow(
  ctx: CanvasRenderingContext2D,
  _bw: number,
  bh: number,
  _facing: number,
  animT: number,
): void {
  const sway = Math.sin(animT * 4.5) * u * 0.1;
  const tilt = Math.sin(animT * 3.2) * 0.04;
  const cx = sway;
  const cy = -bh * 0.41;

  const rose = PASTEL.rose;
  const blush = PASTEL.blush;
  const deep = '#C87890';
  const shadow = '#B06878';
  const hi = rgba(PASTEL.white, 0.72);
  const knot = '#A86078';
  const ribbon = '#E8A8B8';

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(tilt);
  ctx.translate(-cx, -cy);

  const lx = cx - u * 4.2;
  const rx = cx + u * 1.4;

  // sombra suave atrás
  fillPx(ctx, lx - u, cy + u * 0.2, u * 4.8, u * 3.2, rgba(shadow, 0.35));
  fillPx(ctx, rx - u * 0.5, cy + u * 0.2, u * 4.8, u * 3.2, rgba(shadow, 0.35));

  // loop esquerdo — camadas (borda → corpo → brilho)
  fillPx(ctx, lx - u * 0.5, cy - u * 2.6, u * 4.2, u * 3.4, deep);
  fillPx(ctx, lx, cy - u * 2.4, u * 3.6, u * 3, rose);
  fillPx(ctx, lx + u * 0.4, cy - u * 2.1, u * 2.8, u * 2.4, blush);
  fillPx(ctx, lx + u * 0.8, cy - u * 2.5, u * 1.2, u * 1.4, hi);
  fillPx(ctx, lx + u * 2.2, cy - u * 0.4, u * 1.4, u * 1.8, rose);

  // loop direito
  fillPx(ctx, rx - u * 0.5, cy - u * 2.6, u * 4.2, u * 3.4, deep);
  fillPx(ctx, rx + u * 0.1, cy - u * 2.4, u * 3.6, u * 3, rose);
  fillPx(ctx, rx + u * 0.5, cy - u * 2.1, u * 2.8, u * 2.4, blush);
  fillPx(ctx, rx + u * 0.9, cy - u * 2.5, u * 1.2, u * 1.4, hi);
  fillPx(ctx, rx - u * 0.8, cy - u * 0.4, u * 1.4, u * 1.8, rose);

  // nó central — pérola fofa
  fillPx(ctx, cx - u * 1.1, cy - u * 0.55, u * 2.2, u * 2.4, knot);
  fillPx(ctx, cx - u * 0.85, cy - u * 0.35, u * 1.7, u * 1.8, deep);
  fillPx(ctx, cx - u * 0.55, cy - u * 0.2, u * 1.1, u * 1.2, rose);
  fillPx(ctx, cx - u * 0.35, cy - u * 0.45, u * 0.6, u * 0.6, hi);

  // fitas com ponta em V
  fillPx(ctx, cx - u * 1.6, cy + u * 1.2, u * 1.3, u * 3.2, ribbon);
  fillPx(ctx, cx - u * 1.35, cy + u * 3.8, u * 0.9, u * 1.2, blush);
  fillPx(ctx, cx - u * 1.75, cy + u * 4.6, u * 0.7, u * 0.7, rose);
  fillPx(ctx, cx + u * 0.35, cy + u * 1.2, u * 1.3, u * 3.2, ribbon);
  fillPx(ctx, cx + u * 0.6, cy + u * 3.8, u * 0.9, u * 1.2, blush);
  fillPx(ctx, cx + u * 0.2, cy + u * 4.6, u * 0.7, u * 0.7, rose);

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
  const sway = Math.sin(animT * 2.2) * u * 0.2;
  const cy = -bh * 0.38;
  const brim = PASTEL.butter;
  const brimLo = '#E8C878';
  const band = PASTEL.coral;
  const crown = '#F5E8C8';

  fillPx(ctx, -bw * 0.52 + sway, cy + u, bw * 1.04, u * 1.5, brimLo);
  fillPx(ctx, -bw * 0.48 + sway, cy + u * 0.5, bw * 0.96, u * 2, brim);
  fillPx(ctx, -bw * 0.22 + sway, cy - u, bw * 0.44, u * 2.5, crown);
  fillPx(ctx, -bw * 0.18 + sway, cy - u * 2.5, bw * 0.36, u * 2, crown);
  fillPx(ctx, -bw * 0.2 + sway, cy + u * 0.2, bw * 0.4, u, band);
  fillPx(ctx, -bw * 0.12 + sway, cy - u * 3, u * 2, u, rgba(PASTEL.white, 0.55));
}

function drawSprout(
  ctx: CanvasRenderingContext2D,
  _bw: number,
  bh: number,
  animT: number,
): void {
  const sway = Math.sin(animT * 4) * u * 0.4;
  const cx = sway;
  const cy = -bh * 0.5;
  const stem = '#78B868';
  const stemLo = '#5A9850';
  const stemHi = '#98D088';
  const leaf = PASTEL.mint;
  const leafHi = '#B8F0A8';
  const leafLo = '#68B058';
  const s = 1.48;

  // vaso / base no topo da cabeça
  fillPx(ctx, cx - u * 1.4, cy + u * 5.2, u * 2.8, u * 1.2, stemLo);
  fillPx(ctx, cx - u * 1.1, cy + u * 4.6, u * 2.2, u * 1.4, stem);

  // caule grosso
  fillPx(ctx, cx - u * 0.85, cy + u * 0.5, u * 1.7, u * 5.2 * s, stemLo);
  fillPx(ctx, cx - u * 0.55, cy, u * 1.1, u * 5.6 * s, stem);
  fillPx(ctx, cx - u * 0.25, cy + u * 1.5, u * 0.5, u * 3.5 * s, stemHi);

  // folha esquerda grande
  fillPx(ctx, cx - u * 5.2 * s, cy - u * 0.5, u * 4.8 * s, u * 3.6 * s, leafLo);
  fillPx(ctx, cx - u * 4.6 * s, cy - u * 1.2, u * 4.2 * s, u * 3.2 * s, leaf);
  fillPx(ctx, cx - u * 3.8 * s, cy - u * 0.8, u * 2.4 * s, u * 1.8 * s, leafHi);
  fillPx(ctx, cx - u * 3.2 * s, cy - u * 2, u * 1.2, u * 1.2, rgba(PASTEL.white, 0.45));

  // folha direita grande
  fillPx(ctx, cx + u * 0.2, cy - u * 2.8, u * 4.6 * s, u * 3.4 * s, leafLo);
  fillPx(ctx, cx + u * 0.6, cy - u * 3.5, u * 4 * s, u * 3 * s, leafHi);
  fillPx(ctx, cx + u * 1.2, cy - u * 2.6, u * 2.8 * s, u * 2 * s, leaf);
  fillPx(ctx, cx + u * 2.2, cy - u * 3.8, u * 1.2, u * 1.2, rgba(PASTEL.white, 0.5));

  // brotinho do topo
  fillPx(ctx, cx - u * 0.6, cy - u * 4.2 * s, u * 1.8, u * 1.8, leafHi);
  fillPx(ctx, cx - u * 0.35, cy - u * 5 * s, u * 1.2, u * 1.2, rgba(PASTEL.white, 0.6));
}

function drawStarClip(
  ctx: CanvasRenderingContext2D,
  _bw: number,
  bh: number,
  animT: number,
): void {
  const twinkle = Math.sin(animT * 6) > 0.35;
  const bob = Math.sin(animT * 3.2) * u * 0.18;
  const cx = 0;
  const cy = -bh * 0.5 + bob;
  const gold = PASTEL.butter;
  const goldMid = '#F5D878';
  const goldLo = '#E8C050';
  const goldHi = rgba(PASTEL.white, 0.92);
  const clip = rgba(PASTEL.inkSoft, 0.45);
  const s = 2.15;

  // presilha
  fillPx(ctx, cx - u * 1.6, cy + u * 2.8 * s, u * 3.2, u * 1.2, clip);
  fillPx(ctx, cx - u * 1.2, cy + u * 2.4 * s, u * 2.4, u * 0.8, rgba(PASTEL.inkSoft, 0.28));

  // corpo da estrela — 5 pontas em blocos pixel
  fillPx(ctx, cx - u * 1.4 * s, cy - u * 1.4 * s, u * 2.8 * s, u * 2.8 * s, goldMid);
  fillPx(ctx, cx - u * 2.4 * s, cy - u * 0.4 * s, u * 4.8 * s, u * 1.4 * s, gold);
  fillPx(ctx, cx - u * 0.8 * s, cy - u * 2.6 * s, u * 1.6 * s, u * 5.2 * s, gold);
  fillPx(ctx, cx - u * 3 * s, cy + u * 0.8 * s, u * 1.4 * s, u * 2 * s, goldLo);
  fillPx(ctx, cx + u * 1.6 * s, cy + u * 0.8 * s, u * 1.4 * s, u * 2 * s, goldLo);
  fillPx(ctx, cx - u * 2.6 * s, cy + u * 2.2 * s, u * 1.2 * s, u * 1.6 * s, goldMid);
  fillPx(ctx, cx + u * 1.4 * s, cy + u * 2.2 * s, u * 1.2 * s, u * 1.6 * s, goldMid);

  // brilho central
  fillPx(ctx, cx - u * 0.7 * s, cy - u * 0.5 * s, u * 1.4 * s, u * 1.4 * s, goldHi);
  if (twinkle) {
    fillPx(ctx, cx - u * 2.8 * s, cy - u * 1.8 * s, u * 1.2, u * 1.2, goldHi);
    fillPx(ctx, cx + u * 2.2 * s, cy - u * 1.2 * s, u, u, goldHi);
    fillPx(ctx, cx - u * 0.4 * s, cy - u * 3.2 * s, u, u, goldHi);
    fillPx(ctx, cx + u * 1.8 * s, cy + u * 1.6 * s, u, u, rgba(PASTEL.white, 0.7));
  }
}

function drawHeadphones(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  animT: number,
): void {
  const bounce = Math.sin(animT * 3.5) * u * 0.1;
  const lx = -bw * 0.36;
  const rx = bw * 0.28;
  const cupY = -bh * 0.26 + bounce;

  const band = '#8A7898';
  const bandHi = PASTEL.cream;
  const bandLo = rgba(PASTEL.inkSoft, 0.55);
  const shell = PASTEL.lilac;
  const shellLo = '#C0A8D0';
  const shellHi = rgba(PASTEL.white, 0.55);
  const pad = PASTEL.blush;
  const padIn = '#E8B0BC';
  const cable = rgba(PASTEL.inkSoft, 0.42);
  const led = PASTEL.mint;

  const bandTop = -bh * 0.44 + bounce;

  // arco da faixa — curva sobre a cabeça
  fillPx(ctx, -u * 2, bandTop, u * 4, u * 1.6, bandHi);
  fillPx(ctx, -bw * 0.14, bandTop + u * 0.4, bw * 0.28, u * 1.2, band);
  fillPx(ctx, -bw * 0.24, bandTop + u * 1.1, u * 2.5, u, bandLo);
  fillPx(ctx, bw * 0.16, bandTop + u * 1.1, u * 2.5, u, bandLo);
  fillPx(ctx, lx - u, bandTop + u * 2.2, u * 3.5, u * 1.1, band);
  fillPx(ctx, rx - u * 2.5, bandTop + u * 2.2, u * 3.5, u * 1.1, band);
  fillPx(ctx, lx + u * 0.5, bandTop + u * 2.8, u, u * 1.8, bandLo);
  fillPx(ctx, rx + u * 0.5, bandTop + u * 2.8, u, u * 1.8, bandLo);

  const drawCup = (cx: number, side: 'L' | 'R'): void => {
    const out = side === 'L' ? -1 : 1;
    // concha externa
    fillPx(ctx, cx - u * 1.7, cupY - u * 2, u * 3.4, u * 4.2, shellLo);
    fillPx(ctx, cx - u * 1.5, cupY - u * 1.8, u * 3, u * 3.8, shell);
    fillPx(ctx, cx - u * 1.2, cupY - u * 1.5, u * 2.4, u * 3.2, shellHi);
    // aro acolchoado
    fillPx(ctx, cx - u * 1.35, cupY - u * 1.2, u * 2.7, u * 2.9, pad);
    fillPx(ctx, cx - u * 1.05, cupY - u * 0.7, u * 2.1, u * 2.1, padIn);
    // grelha / driver
    fillPx(ctx, cx - u * 0.75, cupY - u * 0.35, u * 1.5, u * 1.5, rgba(PASTEL.inkSoft, 0.12));
    fillPx(ctx, cx - u * 0.45, cupY - u * 0.15, u * 0.8, u * 0.8, rgba(PASTEL.inkSoft, 0.18));
    // brilho
    fillPx(ctx, cx - u * 1.25 * out, cupY - u * 1.55, u, u, shellHi);
    // LED ASMR
    fillPx(ctx, cx + u * 0.9 * out, cupY + u * 0.9, u * 0.7, u * 0.7, led);
  };

  drawCup(lx, 'L');
  drawCup(rx, 'R');

  // cabo macio pendendo
  fillPx(ctx, lx - u * 0.5, cupY + u * 2.2, u, u * 2.2, cable);
  fillPx(ctx, lx + u * 0.2, cupY + u * 4.2, u, u * 1.8, cable);
  fillPx(ctx, lx + u * 0.8, cupY + u * 5.6, u * 1.2, u, cable);

  // ondas sonoras sutis (ASMR)
  if (Math.sin(animT * 5.5) > 0.25) {
    const wave = rgba(PASTEL.powder, 0.55);
    fillPx(ctx, lx - u * 3.2, cupY - u * 0.2, u, u, wave);
    fillPx(ctx, lx - u * 4, cupY + u * 0.5, u, u, wave);
    fillPx(ctx, rx + u * 2.8, cupY - u * 0.1, u, u, wave);
    fillPx(ctx, rx + u * 3.6, cupY + u * 0.6, u, u, wave);
  }
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
  const boost = id === 'bow' || id === 'sprout' || id === 'star' || id === 'headphones' ? 1 : 0.72;
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
