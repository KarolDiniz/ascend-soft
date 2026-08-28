import type { AccessoryId } from './playerAppearance';
import { PASTEL, rgba } from '../theme/pastelPalette';
import { fillPx, px, PIXEL } from '../theme/pixel';

const u = PIXEL.unit;

export type AccessoryLayer = 'underFace' | 'overFace';

export function accessoryLayers(id: AccessoryId): AccessoryLayer[] {
  if (id === 'none') return [];
  if (id === 'bow' || id === 'headphones') return ['overFace'];
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
      if (over) drawBow(ctx, bw, bh, facing, animT);
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
  bw: number,
  bh: number,
  facing: number,
  animT: number,
): void {
  const wobble = Math.sin(animT * 5) * u * 0.15;
  const side = facing >= 0 ? 1 : -1;
  const cx = side * bw * 0.34 + wobble;
  const cy = -bh * 0.18;
  const pink = PASTEL.rose;
  const pinkHi = rgba(PASTEL.blush, 0.95);
  const pinkLo = '#D898A8';
  const knot = rgba(PASTEL.inkSoft, 0.55);

  fillPx(ctx, cx - u * 3, cy - u, u * 2.5, u * 2, pinkLo);
  fillPx(ctx, cx + u * 0.5, cy - u, u * 2.5, u * 2, pinkLo);
  fillPx(ctx, cx - u * 2.5, cy - u * 1.2, u * 2, u * 2.4, pink);
  fillPx(ctx, cx + u * 0.5, cy - u * 1.2, u * 2, u * 2.4, pink);
  fillPx(ctx, cx - u * 0.5, cy - u * 0.5, u, u * 1.5, knot);
  fillPx(ctx, cx - u * 2, cy - u * 1.5, u, u, pinkHi);
  fillPx(ctx, cx + u * 1.5, cy - u * 1.5, u, u, pinkHi);
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
  bw: number,
  bh: number,
  animT: number,
): void {
  const sway = Math.sin(animT * 4) * u * 0.25;
  const cx = bw * 0.06 + sway;
  const cy = -bh * 0.44;
  const stem = '#78B868';
  const leaf = PASTEL.mint;
  const leafHi = '#A8E0A0';

  fillPx(ctx, cx - u * 0.5, cy, u, u * 3, stem);
  fillPx(ctx, cx - u * 2.5, cy - u * 2, u * 2.5, u * 2, leaf);
  fillPx(ctx, cx + u * 0.5, cy - u * 3, u * 2.5, u * 2, leafHi);
  fillPx(ctx, cx - u * 0.5, cy - u * 3.5, u, u, rgba(PASTEL.white, 0.5));
}

function drawStarClip(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  animT: number,
): void {
  const twinkle = Math.sin(animT * 6) > 0.4;
  const cx = -bw * 0.22;
  const cy = -bh * 0.44;
  const gold = PASTEL.butter;
  const goldHi = rgba(PASTEL.white, 0.85);

  fillPx(ctx, cx - u, cy - u, u * 2, u * 2, gold);
  fillPx(ctx, cx - u * 1.5, cy - u * 0.5, u * 3, u, gold);
  fillPx(ctx, cx - u * 0.5, cy - u * 1.5, u, u * 3, gold);
  if (twinkle) {
    fillPx(ctx, cx - u * 0.5, cy - u * 0.5, u, u, goldHi);
  }
}

function drawHeadphones(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  animT: number,
): void {
  const bounce = Math.sin(animT * 3.5) * u * 0.08;
  const cy = -bh * 0.22 + bounce;
  const band = rgba(PASTEL.inkSoft, 0.65);
  const cup = PASTEL.lilac;
  const cupHi = rgba(PASTEL.white, 0.45);
  const pad = PASTEL.blush;

  fillPx(ctx, -bw * 0.34, cy - bh * 0.18, bw * 0.68, u, band);
  fillPx(ctx, -bw * 0.38, cy - u, u * 2.5, u * 3.5, cup);
  fillPx(ctx, bw * 0.26, cy - u, u * 2.5, u * 3.5, cup);
  fillPx(ctx, -bw * 0.36, cy, u * 2, u * 2.5, pad);
  fillPx(ctx, bw * 0.28, cy, u * 2, u * 2.5, pad);
  fillPx(ctx, -bw * 0.35, cy - u * 0.5, u, u, cupHi);
  fillPx(ctx, bw * 0.29, cy - u * 0.5, u, u, cupHi);
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
  const bw = px(size * 0.72);
  const bh = px(size * 0.72);
  if (id === 'none') {
    ctx.fillStyle = rgba(PASTEL.inkSoft, 0.25);
    ctx.fillRect(size / 2 - 6, size / 2 - 1, 12, 2);
  } else {
    drawPlayerAccessory(ctx, bw, bh, id, accessoryLayers(id)[0] ?? 'underFace', 0, 1);
  }
  ctx.restore();
}
