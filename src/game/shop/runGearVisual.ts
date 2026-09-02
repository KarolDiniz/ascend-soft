import { PASTEL, rgba } from '../../theme/pastelPalette';
import { PIXEL, fillPx, px } from '../../theme/pixel';

/** Mochila + chama — só rects, zero alloc. */
export function drawJetpack(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  facing: number,
  firing: boolean,
  animT: number,
): void {
  const back = -facing;
  const x = back * (bw * 0.42);
  drawJetpackAt(ctx, x, -bh * 0.02, firing, animT);
}

/** Mochila centralizada — ícones de loja / torre. */
export function drawJetpackIcon(
  ctx: CanvasRenderingContext2D,
  _bw: number,
  bh: number,
  firing: boolean,
  animT: number,
): void {
  drawJetpackAt(ctx, 0, bh * 0.06, firing, animT);
}

function drawJetpackAt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  firing: boolean,
  animT: number,
): void {
  const u = PIXEL.unit;
  fillPx(ctx, x - u * 2, y - u * 3, u * 4, u * 7, '#6A7A88');
  fillPx(ctx, x - u, y - u * 2, u * 2, u * 4, '#8A9AAC');
  fillPx(ctx, x - u * 1.5, y + u * 3, u * 3, u * 2, '#5A6570');
  if (!firing) return;
  const flicker = 0.65 + (Math.sin(animT * 38) * 0.5 + 0.5) * 0.35;
  const fh = u * (3 + flicker * 4);
  fillPx(ctx, x - u, y + u * 5, u * 2, fh, '#F3E2A8');
  fillPx(ctx, x - u * 0.5, y + u * 5, u, fh * 0.7, '#E2B84A');
  fillPx(ctx, x - u * 0.5, y + u * 5 + fh * 0.45, u, fh * 0.4, '#C96A52');
}

const HAT_GREEN = '#5BB85A';
const HAT_RED = '#E05050';
const HAT_YELLOW = '#F0D040';
const HAT_BLUE = '#4A90E0';

/** Chapéu-hélice — copa em 4 quartos; pás brancas. */
export function drawPropHat(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  animT: number,
  _facing: number,
): void {
  drawPropHatAt(ctx, bw, bh, animT, -bh * 0.52);
}

/** Chapéu centralizado no ícone — abaixo do eixo para caber a hélice. */
export function drawPropHatIcon(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  animT: number,
): void {
  ctx.translate(0, bh * 0.05);
  drawPropHatAt(ctx, bw, bh, animT, bh * 0.03, true);
}

function drawPropHatAt(
  ctx: CanvasRenderingContext2D,
  bw: number,
  _bh: number,
  animT: number,
  top: number,
  compact = false,
): void {
  const u = PIXEL.unit;
  const brimW = bw * 0.56;
  const crownW = bw * 0.38;
  const crownH = u * 3.4;
  fillPx(ctx, -brimW / 2, top, brimW / 2, u * 2.5, HAT_YELLOW);
  fillPx(ctx, 0, top, brimW / 2, u * 2.5, HAT_BLUE);
  fillPx(ctx, -crownW / 2, top - crownH, crownW / 2, crownH / 2, HAT_GREEN);
  fillPx(ctx, 0, top - crownH, crownW / 2, crownH / 2, HAT_RED);
  fillPx(ctx, -crownW / 2, top - crownH / 2, crownW / 2, crownH / 2, HAT_YELLOW);
  fillPx(ctx, 0, top - crownH / 2, crownW / 2, crownH / 2, HAT_BLUE);
  const mastH = compact ? 2.2 : 3.2;
  const hubDrop = compact ? 4.1 : 7.6;
  fillPx(ctx, -u, top - u * mastH, u * 2, u * mastH, '#5A616C');
  const hubY = top - u * hubDrop;
  const t = animT * 14;
  const reach = compact ? px(4.5) : px(8);
  const hx = Math.max(u, Math.abs(Math.cos(t)) * reach);
  const hy = Math.max(u, Math.abs(Math.sin(t)) * reach);
  fillPx(ctx, -hx, hubY - u * 0.5, hx * 2, u, PASTEL.white);
  fillPx(ctx, -u * 0.5, hubY - hy, u, hy * 2, PASTEL.white);
  fillPx(ctx, -u * 0.6, hubY - u * 0.6, u * 1.2, u * 1.2, PASTEL.white);
}

/** Brilho azul claro forte — halo saindo do blob. */
export function drawPotionAura(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  animT: number,
): void {
  const u = PIXEL.unit;
  const pulse = 0.82 + Math.sin(animT * 4.6) * 0.18;
  const coreR = Math.max(bw, bh) * (0.58 + pulse * 0.16);
  const glow = ctx.createRadialGradient(0, -bh * 0.05, coreR * 0.06, 0, 0, coreR);
  glow.addColorStop(0, rgba('#E8FAFF', 0.72 + pulse * 0.18));
  glow.addColorStop(0.28, rgba('#8FE2FF', 0.48 + pulse * 0.14));
  glow.addColorStop(0.55, rgba('#5AD0FF', 0.22 + pulse * 0.1));
  glow.addColorStop(1, rgba('#5AD0FF', 0));
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, coreR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  for (let ring = 0; ring < 3; ring++) {
    const phase = (animT * 0.85 + ring * 0.31) % 1;
    const expand = 0.86 + ring * 0.14 + phase * 0.12;
    const alpha = (0.48 - ring * 0.1) * (0.75 + pulse * 0.25) * (1 - phase * 0.35);
    const pts = 14 + ring * 3;
    for (let i = 0; i < pts; i++) {
      const a = (i / pts) * Math.PI * 2 + animT * (0.55 + ring * 0.12);
      const rx = bw * 0.64 * expand;
      const ry = bh * 0.66 * expand;
      const sx = Math.cos(a) * rx;
      const sy = Math.sin(a) * ry - bh * 0.04;
      const bright = i % 3 === 0;
      const color = bright ? rgba('#D6F6FF', alpha) : rgba('#6AD8FF', alpha * 0.9);
      const sz = bright ? u * 1.5 : u;
      fillPx(ctx, sx - sz / 2, sy - sz / 2, sz, sz, color);
    }
  }
}

/** Faíscas azul-claro que sobem do blob. */
export function drawPotionSparkles(
  ctx: CanvasRenderingContext2D,
  bw: number,
  bh: number,
  animT: number,
): void {
  const u = PIXEL.unit;
  for (let i = 0; i < 10; i++) {
    const drift = (animT * 0.55 + i * 0.17) % 1;
    const a = i * 0.79 + animT * 0.9;
    const reach = 0.42 + drift * 0.7;
    const sx = Math.cos(a) * bw * reach * 0.72;
    const sy = -bh * (0.08 + drift * 0.62) + Math.sin(a * 1.4) * bh * 0.08;
    const fade = 1 - drift;
    const spark = i % 2 === 0 ? rgba('#E8FAFF', 0.9 * fade) : rgba('#6AD8FF', 0.72 * fade);
    fillPx(ctx, sx, sy, u, u, spark);
    if (fade > 0.4) {
      fillPx(ctx, sx, sy - u, u, u, rgba('#FFFFFF', 0.5 * fade));
    }
  }
}

/** Ícone de loja / seletor — frasco azul, jato ou chapéu. */
export function drawShopItemIcon(
  ctx: CanvasRenderingContext2D,
  id: 'jetpack' | 'lightPotion' | 'propHat',
  size: number,
): void {
  ctx.save();
  ctx.translate(size / 2, size / 2);
  const s = size / 48;
  ctx.scale(s, s);
  if (id === 'jetpack') {
    drawJetpackIcon(ctx, 32, 28, true, 0.4);
  } else if (id === 'propHat') {
    ctx.translate(0, 1);
    drawPropHatIcon(ctx, 34, 32, 0.35);
  } else {
    drawPotionFlaskIcon(ctx);
  }
  ctx.restore();
}

/** Ícone maior na torre — preenche quase todo o quadrado. */
export function drawTowerPickupIcon(
  ctx: CanvasRenderingContext2D,
  id: 'jetpack' | 'lightPotion' | 'propHat',
  box: number,
): void {
  const pad = box * 0.08;
  const inner = box - pad * 2;
  const cx = pad + inner * 0.5;
  const cy = pad + inner * 0.5;

  ctx.save();

  if (id === 'jetpack') {
    ctx.translate(cx, cy);
    const s = inner / 34;
    ctx.scale(s, s);
    drawJetpackIcon(ctx, 40, 36, true, 0.4);
  } else if (id === 'propHat') {
    ctx.translate(cx, cy + inner * 0.06);
    const s = inner / 44;
    ctx.scale(s, s);
    drawPropHatIcon(ctx, 42, 38, 0.35);
  } else {
    ctx.translate(cx, cy + inner * 0.04);
    const s = inner / 34;
    ctx.scale(s, s);
    drawPotionFlaskIcon(ctx);
  }

  ctx.restore();
}

function drawPotionFlaskIcon(ctx: CanvasRenderingContext2D): void {
  const u = PIXEL.unit;
  fillPx(ctx, -u * 2, -u * 10, u * 4, u * 2, '#C9A06A');
  fillPx(ctx, -u * 1.5, -u * 8, u * 3, u * 2, '#8FE2FF');
  fillPx(ctx, -u * 3, -u * 6, u * 6, u * 2, '#6AD8FF');
  fillPx(ctx, -u * 4, -u * 4, u * 8, u * 10, '#5AD0FF');
  fillPx(ctx, -u * 3, -u * 3, u * 6, u * 8, '#8FE2FF');
  fillPx(ctx, -u * 2.5, -u * 2, u * 2, u * 5, '#E8FAFF');
  fillPx(ctx, -u * 4, u * 6, u * 8, u * 2, '#4AB8E8');
  fillPx(ctx, -u * 5, -u * 7, u * 2, u * 2, rgba('#E8FAFF', 0.55));
  fillPx(ctx, u * 3, -u * 1, u, u * 3, rgba('#E8FAFF', 0.45));
}
