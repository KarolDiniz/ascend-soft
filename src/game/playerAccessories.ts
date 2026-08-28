import type { AccessoryId } from './playerAppearance';
import { PLAYER_DRAW_W } from './playerPixelArt';
import { PASTEL, rgba } from '../theme/pastelPalette';
import { fillPx, px, PIXEL } from '../theme/pixel';

const u = PIXEL.unit;

/** Largura de referência do preview/editor (CharacterPreview scale 3.35). */
const ACCESSORY_REF_BW = PLAYER_DRAW_W * 3.35;

/** Escala para acessórios/cabelo no gameplay.
 *  O corpo in-game já é menor (bw ~36 vs ~100 no editor); coords relativas a bw
 *  bastam — reduzir de novo deixava tudo minúsculo frente ao boné Mario. */
export function accessoryInGameScale(_bodyW: number): number {
  return 1;
}

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
  itemScale = 1,
): void {
  if (accessory === 'none') return;

  if (itemScale !== 1) {
    ctx.save();
    ctx.scale(itemScale, itemScale);
  }

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
    case 'alienAntenna':
      if (under) drawAlienAntenna(ctx, bw, bh, animT);
      break;
    case 'santaHat':
      if (under) drawSantaHat(ctx, bw, bh, animT);
      break;
    case 'catEars':
      if (under) drawCatEars(ctx, bw, bh, animT);
      break;
    case 'mickeyEars':
      if (under) drawMickeyEars(ctx, bw, bh, animT);
      break;
    case 'marioCap':
      if (under) drawMarioCap(ctx, bw, bh, animT, facing);
      break;
    default:
      break;
  }

  if (itemScale !== 1) {
    ctx.restore();
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

function drawAlienAntenna(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  animT: number,
): void {
  const s = 1.42;
  const pulse = Math.sin(animT * 5.5) * 0.15 + 0.85;
  const stem = '#7A8898';
  const stemLo = '#5A6878';
  const glow = PASTEL.mint;
  const glowHi = rgba(PASTEL.white, 0.75);
  const glowCore = '#98F0C0';

  const antenna = (bx: number, phase: number): void => {
    const wob = Math.sin(animT * 4.2 + phase) * u * 0.45;
    const tilt = Math.sin(animT * 3.1 + phase) * u * 0.28;
    const x = bx + wob;
    const baseY = -bh * 0.4;

    fillPx(ctx, x - u * 0.6 * s + tilt, baseY - u * 7.2 * s, u * 1.2 * s, u * 7.5 * s, stemLo);
    fillPx(ctx, x - u * 0.42 * s + tilt * 0.6, baseY - u * 6.8 * s, u * 0.9 * s, u * 7 * s, stem);
    fillPx(ctx, x - u * 0.24 * s + tilt * 0.4, baseY - u * 6.2 * s, u * 0.5 * s, u * 6 * s, rgba(stem, 0.85));

    const orbY = baseY - u * 8 * s + Math.sin(animT * 6 + phase) * u * 0.35;
    const r = u * (1.85 + pulse * 0.35) * s;
    fillPx(ctx, x - r - u * 0.25, orbY - r, r * 2 + u * 0.5, r * 2 + u * 0.4, rgba(glow, 0.35));
    fillPx(ctx, x - r, orbY - r + u * 0.2, r * 2, r * 2, glow);
    fillPx(ctx, x - r * 0.65, orbY - r * 0.65, r * 1.3, r * 1.3, glowCore);
    fillPx(ctx, x - u * 0.6, orbY - u * 0.7, u * 0.75, u * 0.75, glowHi);
  };

  antenna(-bw * 0.18, 0);
  antenna(bw * 0.14, 1.8);
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
  const refBw = px(ACCESSORY_REF_BW);
  const inGame = bw < refBw * 0.9;
  const pixel = u * (bw / refBw) * (inGame ? 1.45 : 1);
  const cols = MARIO_CAP_SPRITE[0]!.length;
  const rows = MARIO_CAP_SPRITE.length;
  const anchorY = -bh * 0.36 + bob;
  const lean = facing * pixel * 0.35;
  const ox = lean - px((cols * pixel) / 2);
  const oy = anchorY - rows * pixel;

  drawPixelAccessorySprite(ctx, MARIO_CAP_SPRITE, ox, oy, MARIO_CAP_COLORS, facing, pixel);
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
    id === 'star' ||
    id === 'headphones' ||
    id === 'alienAntenna' ||
    id === 'santaHat' ||
    id === 'catEars' ||
    id === 'mickeyEars' ||
    id === 'marioCap';
  const boost =
    id === 'alienAntenna' ||
    id === 'santaHat' ||
    id === 'catEars' ||
    id === 'mickeyEars' ||
    id === 'marioCap'
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
