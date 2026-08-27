import type { MaterialDef, MaterialId } from '../../audio/materials';
import { PASTEL, rgba } from '../../theme/pastelPalette';
import { PIXEL, fillPx, px } from '../../theme/pixel';
import { MATERIAL_LEDGE } from './ledgeSizes';
import type { PlatformBehavior } from './behaviors';
import type { PlatformDrawState, PlatformVariant } from './types';

export interface PixelPlatformOverlay {
  crackLevel: number;
  meltProgress: number;
  flash: number;
  integrity: number;
  behavior: PlatformBehavior;
  pressAmount: number;
  squashX: number;
  squashY: number;
}

function seeded(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Each material = unique silhouette + palette + micro-animation.
 * Still a walkable platform, but instantly readable as the item.
 */
export function renderPixelPlatform(
  ctx: CanvasRenderingContext2D,
  material: MaterialId,
  _variant: PlatformVariant,
  mat: MaterialDef,
  s: PlatformDrawState,
  overlay?: PixelPlatformOverlay,
): void {
  const u = PIXEL.unit;
  const melt = overlay?.meltProgress ?? 0;
  const integrity = overlay?.integrity ?? 1;
  const ledge = MATERIAL_LEDGE[material];
  const cx = s.cx;
  const sy = s.surfaceY;
  const w = Math.max(u * 12, px(s.w * ledge.visualSpread * (1 + melt * 0.3)));
  const h = Math.max(
    u * 4,
    px(
      s.h *
        ledge.visualDepth *
        (1.4 + (1 - Math.max(0.2, s.squashY)) * 0.45) *
        Math.max(0.35, integrity),
    ),
  );

  ctx.save();
  ctx.globalAlpha = s.opacity;
  ctx.imageSmoothingEnabled = false;

  // Shadow (shape-aware width)
  fillPx(ctx, cx - w * 0.42, sy + h - u, w * 0.84, u * 2, rgba(PASTEL.inkSoft, 0.22));

  const args = { ctx, cx, sy, w, h, mat, u, seed: s.seed, time: s.time, wobble: s.wobble, overlay, melt };

  switch (material) {
    case 'jelly':
      drawJelly(args);
      break;
    case 'butter':
      drawButter(args);
      break;
    case 'mochi':
      drawCheese(args);
      break;
    case 'chocolate':
      drawChocolate(args);
      break;
    case 'citrus':
      drawCitrus(args);
      break;
    case 'honeycomb':
      drawHoney(args);
      break;
    case 'glycerin':
      drawSoapPink(args);
      break;
    case 'whipped':
      drawWhipped(args);
      break;
    case 'kinetic':
      drawSand(args);
      break;
    case 'iceSoap':
      drawIce(args);
      break;
    case 'clearSlime':
      drawGum(args);
      break;
    case 'butterSlime':
      drawDough(args);
      break;
    default:
      drawButter(args);
  }

  // Shared crack overlay for shatter materials
  const crack = overlay?.crackLevel ?? 0;
  if (crack > 0.05 && (material === 'glycerin' || material === 'iceSoap' || material === 'chocolate')) {
    ctx.globalAlpha = s.opacity * Math.min(1, crack * 1.3);
    for (let i = 0; i < 4 + Math.floor(crack * 4); i++) {
      fillPx(
        ctx,
        cx - w * 0.35 + (i / 7) * w * 0.7,
        sy + h * (0.15 + seeded(s.seed, i) * 0.55),
        u,
        u * (2 + (i % 3)),
        PASTEL.white,
      );
    }
  }

  if ((overlay?.flash ?? 0) > 0.05) {
    ctx.globalAlpha = s.opacity * overlay!.flash * 0.5;
    fillPx(ctx, cx - w / 2, sy - u * 2, w, h + u * 4, PASTEL.white);
  }

  ctx.restore();
}

type DrawArgs = {
  ctx: CanvasRenderingContext2D;
  cx: number;
  sy: number;
  w: number;
  h: number;
  mat: MaterialDef;
  u: number;
  seed: number;
  time: number;
  wobble: number;
  overlay?: PixelPlatformOverlay;
  melt: number;
};

/** Static debris chips at base — shift slightly when pressed */
function drawDebris(a: DrawArgs, count: number, color: string): void {
  const { ctx, cx, sy, w, h, u, seed, time, wobble } = a;
  const press = a.overlay?.pressAmount ?? 0;
  const baseY = sy + h;
  for (let i = 0; i < count; i++) {
    const side = seeded(seed, i + 40) > 0.45 ? 1 : -1;
    const spread = w * (0.28 + seeded(seed, i + 50) * 0.22);
    const push = press * u * (2 + i * 0.5);
    const fx = cx + side * spread + push * side;
    const bob = Math.sin(time * 2.8 + i * 1.3 + wobble) * u * 0.35;
    const sz = u * (1 + Math.floor(seeded(seed, i + 60) * 2));
    fillPx(ctx, fx, baseY + u * 0.5 + bob, sz, sz, color);
  }
}

/** Twinkling 1px floaters around the platform (idle juice) */
function drawAmbientSpecks(a: DrawArgs, count: number, color: string): void {
  const { ctx, cx, sy, w, h, u, seed, time, wobble } = a;
  for (let i = 0; i < count; i++) {
    const phase = time * 3.2 + i * 2.1 + wobble;
    if (Math.sin(phase) < -0.15) continue;
    const fx = cx + (seeded(seed, i + 70) - 0.5) * w * 1.05;
    const fy = sy - u - seeded(seed, i + 80) * h * 0.55 + Math.sin(phase * 1.4) * u * 1.2;
    fillPx(ctx, fx, fy, u, u, rgba(color, 0.45 + seeded(seed, i + 90) * 0.45));
  }
}

/** Footprint / press indent on top surface */
function drawPressIndent(a: DrawArgs): void {
  const press = a.overlay?.pressAmount ?? 0;
  if (press < 0.06) return;
  const { ctx, cx, sy, w, u, mat } = a;
  const indentW = w * (0.22 + press * 0.12);
  const depth = u * (1 + Math.floor(press * 3));
  fillPx(ctx, cx - indentW / 2, sy, indentW, depth, rgba(mat.stroke, 0.28 + press * 0.25));
  fillPx(ctx, cx - indentW * 0.35, sy + depth, u * 2, u, rgba(mat.particle, 0.4));
  fillPx(ctx, cx + indentW * 0.2, sy + depth, u, u, rgba(mat.particle, 0.35));
}

/** Animated drip strand from bottom edge */
function drawIdleDrip(a: DrawArgs, color: string, phase = 0): void {
  const { ctx, cx, sy, w, h, u, time, melt } = a;
  const pulse = 0.5 + Math.sin(time * 4 + phase) * 0.5;
  const len = u * (2 + Math.floor((melt + pulse * 0.35) * 5));
  const ox = cx + w * (0.12 + phase * 0.18);
  fillPx(ctx, ox - u / 2, sy + h - u, u, len, color);
  fillPx(ctx, ox - u, sy + h - u + len, u * 2, u, color);
}

/** Ring bubble (hollow center) */
function drawBubbleRing(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  u: number,
  color: string,
): void {
  fillPx(ctx, x, y, r, r, color);
  fillPx(ctx, x + u, y + u, Math.max(u, r - u * 2), Math.max(u, r - u * 2), rgba(PASTEL.white, 0.15));
}

/** Gelatina — topo ondulado, bolhas, wobble sheen */
function drawJelly(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, wobble, seed, time } = a;
  const x = cx - w / 2;
  const wave = Math.sin(wobble) * u;
  const press = a.overlay?.pressAmount ?? 0;

  for (let row = 0; row < h; row += u) {
    const t = row / h;
    const waveW = w * (0.92 + Math.sin(t * 4 + wobble) * 0.08);
    const ox = Math.sin(wobble + t * 2) * u + press * u * t * 0.4;
    fillPx(ctx, cx - waveW / 2 + ox, sy + row, waveW, u, mat.fill);
  }
  // Wet meniscus lip
  for (let i = 0; i < 6; i++) {
    const bx = x + u + (i / 5) * (w - u * 2);
    const lip = sy - u * (1 + (i % 3)) + Math.sin(wobble + i) * u * 0.5;
    fillPx(ctx, bx, lip, u * 3, u * 2, mat.fill);
  }
  // Inner bubbles — rings + cores
  for (let i = 0; i < 10; i++) {
    const bx = x + u * 2 + seeded(seed, i) * (w - u * 8);
    const by = sy + u * 2 + seeded(seed, i + 3) * (h - u * 5);
    const br = u * (2 + Math.floor(seeded(seed, i + 6) * 2));
    drawBubbleRing(ctx, bx, by, br, u, rgba(mat.particle, 0.65));
    if (i % 3 === 0) fillPx(ctx, bx + u, by + u, u, u, rgba(PASTEL.white, 0.7));
  }
  // Caustic flecks
  for (let i = 0; i < 5; i++) {
    if (Math.sin(time * 2 + i + seed) > 0.1) {
      fillPx(
        ctx,
        x + u * 4 + seeded(seed, i + 12) * (w - u * 10),
        sy + u + seeded(seed, i + 15) * (h * 0.5),
        u,
        u,
        rgba(PASTEL.mint, 0.55),
      );
    }
  }
  // Moving highlight band
  fillPx(ctx, cx - u * 4 + wave, sy + u, u * 5, u, rgba(PASTEL.white, 0.55));
  fillPx(ctx, cx - u * 2 + wave * 0.5, sy + u * 2, u * 2, u, rgba(PASTEL.white, 0.35));
  fillPx(ctx, x, sy + u, u, h - u * 2, mat.stroke);
  fillPx(ctx, x + w - u, sy + u, u, h - u * 2, mat.stroke);
  fillPx(ctx, x + u, sy + h - u, w - u * 2, u, mat.stroke);

  drawPressIndent(a);
  drawIdleDrip(a, mat.particle, 0);
  drawIdleDrip(a, mat.particle, 1.8);
  drawDebris(a, 3, mat.particle);
  drawAmbientSpecks(a, 4, mat.particle);
}

/** Manteiga — laje larga, cantos retos, marcas de faca, derrete */
function drawButter(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, melt, seed, time, wobble } = a;
  const x = cx - w / 2;

  fillPx(ctx, x, sy, w, h, mat.fill);
  fillPx(ctx, x, sy, w, u, rgba(PASTEL.white, 0.55));
  fillPx(ctx, x, sy + h - u, w, u, mat.stroke);
  fillPx(ctx, x, sy, u, h, mat.stroke);
  fillPx(ctx, x + w - u, sy, u, h, mat.stroke);
  // Knife scores + oily sheen in grooves
  for (let i = 0; i < 6; i++) {
    const gy = sy + u * (1.5 + i * 1.8);
    fillPx(ctx, x + u * 3, gy, w - u * 6, u, rgba(mat.stroke, 0.45));
    if (Math.sin(time * 2 + i + wobble) > 0) {
      fillPx(ctx, x + u * 5, gy, w - u * 10, u, rgba(mat.particle, 0.35));
    }
  }
  // Salt flecks
  for (let i = 0; i < 8; i++) {
    fillPx(
      ctx,
      x + u * 2 + seeded(seed, i + 2) * (w - u * 6),
      sy + u * 2 + seeded(seed, i + 12) * (h - u * 4),
      u,
      u,
      rgba(mat.particle, 0.5 + seeded(seed, i) * 0.3),
    );
  }
  drawPressIndent(a);
  if (melt > 0.05) {
    const pw = w * (1 + melt * 0.4);
    fillPx(ctx, cx - pw / 2, sy + h - u, pw, u * (1 + Math.floor(melt * 3)), mat.fill);
    for (let i = 0; i < 3 + Math.floor(melt * 5); i++) {
      fillPx(
        ctx,
        cx + (seeded(seed, i) - 0.5) * pw * 0.85,
        sy + h,
        u * 2,
        u * (2 + Math.floor(melt * 4)),
        mat.fill,
      );
    }
  }
  drawDebris(a, 4, mat.particle);
  drawAmbientSpecks(a, 3, mat.particle);
}

/** Queijo — irregular + furos grandes atravessando */
function drawCheese(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, wobble, time } = a;
  const x = cx - w / 2;
  const hop = Math.sin(wobble * 0.95) * u;

  fillPx(ctx, x + u, sy + hop, w - u * 2, h, mat.fill);
  fillPx(ctx, x, sy + u + hop, w, h - u * 2, mat.fill);
  fillPx(ctx, x + u * 2, sy - u + hop, w - u * 4, u, mat.fill);
  fillPx(ctx, x + u, sy + hop, w - u * 2, u, rgba(PASTEL.white, 0.35));
  fillPx(ctx, x, sy + h - u + hop, w, u, mat.stroke);
  // Matte rind dots
  for (let i = 0; i < 10; i++) {
    fillPx(
      ctx,
      x + seeded(seed, i + 20) * w,
      sy + u + seeded(seed, i + 25) * (h - u * 2) + hop,
      u,
      u,
      rgba(mat.stroke, 0.25),
    );
  }
  const holes = [
    [0.25, 0.35, 3],
    [0.55, 0.25, 4],
    [0.72, 0.5, 3],
    [0.4, 0.6, 2],
    [0.15, 0.55, 2],
  ] as const;
  for (let i = 0; i < holes.length; i++) {
    const [nx, ny, r] = holes[i];
    const hx = x + w * nx + (seeded(seed, i) - 0.5) * u * 2;
    const hy = sy + h * ny + hop;
    fillPx(ctx, hx, hy, u * r, u * r, '#F7E8C8');
    fillPx(ctx, hx + u, hy + u, u * Math.max(1, r - 1), u * Math.max(1, r - 1), rgba(mat.stroke, 0.35));
  }
  // Powder puff cloud (animated)
  const puff = Math.sin(time * 2.5 + wobble) * u;
  for (let i = 0; i < 5; i++) {
    fillPx(
      ctx,
      cx - w * 0.2 + i * u * 2 + puff,
      sy - u * 2 + Math.sin(time + i) * u * 0.5,
      u,
      u,
      rgba(mat.particle, 0.4 + i * 0.08),
    );
  }
  drawPressIndent(a);
  drawDebris(a, 4, mat.particle);
  drawAmbientSpecks(a, 5, mat.particle);
}

/** Chocolate — barra com sulcos de tablete */
function drawChocolate(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, melt, seed } = a;
  const x = cx - w / 2;
  fillPx(ctx, x + u, sy, w - u * 2, h, mat.fill);
  fillPx(ctx, x, sy + u, w, h - u * 2, mat.fill);
  fillPx(ctx, x + u * 2, sy, w - u * 4, u, rgba(PASTEL.white, 0.35));
  fillPx(ctx, x + u * 2, sy + u, w - u * 4, u, rgba(mat.particle, 0.3));
  const cols = 3;
  const rows = 2;
  for (let c = 1; c < cols; c++) {
    fillPx(ctx, x + (w * c) / cols, sy + u, u, h - u * 2, mat.stroke);
  }
  for (let r = 1; r < rows; r++) {
    fillPx(ctx, x + u * 2, sy + (h * r) / rows, w - u * 4, u, mat.stroke);
  }
  // Segment corner crumbs
  for (let i = 0; i < 6; i++) {
    fillPx(
      ctx,
      x + u * 3 + (i % 3) * (w / 3.5) + seeded(seed, i) * u,
      sy + u * 2 + Math.floor(i / 3) * (h * 0.4),
      u,
      u,
      rgba(mat.particle, 0.45),
    );
  }
  fillPx(ctx, x + u, sy + h - u, w - u * 2, u, mat.stroke);
  drawPressIndent(a);
  if (melt > 0.1) {
    for (let i = 0; i < 5; i++) {
      fillPx(ctx, x + u * 3 + i * (w / 5.5), sy + h - u, u * 2, u * (2 + Math.floor(melt * 3)), mat.fill);
    }
  }
  drawIdleDrip(a, mat.particle, 0.5);
  drawDebris(a, 3, mat.particle);
  drawAmbientSpecks(a, 3, mat.particle);
}

/** Cítrico — cunha / meia-lua com casca e polpa */
function drawCitrus(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, time, wobble } = a;
  const x = cx - w / 2;
  for (let row = 0; row < h; row += u) {
    const t = row / Math.max(1, h - u);
    const ww = w * (0.45 + t * 0.55);
    fillPx(ctx, cx - ww / 2, sy + row, ww, u, mat.fill);
  }
  fillPx(ctx, x + w * 0.15, sy, w * 0.7, u, PASTEL.white);
  fillPx(ctx, x + w * 0.05, sy + h - u * 2, w * 0.9, u * 2, mat.stroke);
  // Peel pores
  for (let i = 0; i < 6; i++) {
    fillPx(
      ctx,
      x + w * 0.08 + seeded(seed, i + 30) * w * 0.84,
      sy + h - u * 3 + seeded(seed, i + 35) * u * 2,
      u,
      u,
      rgba(mat.stroke, 0.5),
    );
  }
  for (let i = 0; i < 6; i++) {
    fillPx(ctx, cx - u / 2 + (i - 3) * u * 2.5, sy + u * 2, u, h - u * 4, rgba(PASTEL.white, 0.4));
  }
  // Pulsing juice nucleus
  const pulse = 1 + Math.sin(time * 5 + wobble) * 0.3;
  fillPx(ctx, cx - u * pulse, sy + h * 0.35, u * 2 * pulse, u * 2 * pulse, PASTEL.white);
  fillPx(ctx, cx - u / 2, sy + h * 0.4, u, u, mat.particle);
  drawPressIndent(a);
  drawDebris(a, 4, mat.particle);
  drawAmbientSpecks(a, 4, mat.particle);
}

/** Mel — borda dentada hex + células */
function drawHoney(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, melt, seed, time } = a;
  const x = cx - w / 2;
  for (let i = 0; i < 6; i++) {
    const bx = x + (i / 5) * (w - u * 4);
    fillPx(ctx, bx, sy - u * (i % 2 === 0 ? 2 : 1), u * 4, h + u * 2, mat.fill);
  }
  fillPx(ctx, x, sy + u, w, h - u, mat.fill);
  for (let i = 0; i < 14; i++) {
    const hx = x + u * 2 + (i % 6) * (w / 6.5);
    const hy = sy + u * 2 + Math.floor(i / 6) * (h * 0.38);
    fillPx(ctx, hx, hy, u * 3, u, mat.stroke);
    fillPx(ctx, hx + u, hy - u, u, u * 3, rgba(PASTEL.butter, 0.5));
    const pool = seeded(seed, i) > 0.35;
    if (pool) {
      fillPx(ctx, hx + u, hy, u, u, rgba(mat.particle, 0.55 + Math.sin(time * 3 + i) * 0.2));
    } else {
      fillPx(ctx, hx + u, hy + u, u, u, rgba(PASTEL.white, 0.35 + seeded(seed, i) * 0.2));
    }
  }
  drawIdleDrip(a, mat.particle, 0);
  drawIdleDrip(a, mat.particle, 2.2);
  if (melt > 0.05) {
    const drip = u * (2 + Math.floor(melt * 5));
    fillPx(ctx, cx + w * 0.15, sy + h - u, u * 2, drip, mat.fill);
  }
  drawDebris(a, 3, mat.particle);
  drawAmbientSpecks(a, 4, mat.particle);
}

/** Sabonete rosa — barra chanfrada + glitter */
function drawSoapPink(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, time, wobble } = a;
  const x = cx - w / 2;
  fillPx(ctx, x + u * 2, sy, w - u * 4, h, mat.fill);
  fillPx(ctx, x + u, sy + u, w - u * 2, h - u * 2, mat.fill);
  fillPx(ctx, x, sy + u * 2, w, h - u * 4, mat.fill);
  fillPx(ctx, x + u * 3, sy, w - u * 6, u, rgba(PASTEL.white, 0.65));
  fillPx(ctx, x + u * 2, sy + h - u, w - u * 4, u, mat.stroke);
  fillPx(ctx, x + u * 4, sy + h * 0.45, w - u * 8, u, rgba(PASTEL.white, 0.4));
  // Twinkling glitter field
  for (let i = 0; i < 12; i++) {
    const tw = Math.sin(time * 4 + i * 1.8 + wobble);
    if (tw < -0.2) continue;
    fillPx(
      ctx,
      x + u * 3 + seeded(seed, i) * (w - u * 8),
      sy + u * 2 + seeded(seed, i + 4) * (h * 0.55),
      u,
      u,
      i % 3 === 0 ? PASTEL.white : i % 3 === 1 ? PASTEL.lilac : mat.particle,
    );
  }
  // Trapped bubbles
  for (let i = 0; i < 3; i++) {
    drawBubbleRing(
      ctx,
      x + u * 5 + seeded(seed, i + 8) * (w - u * 12),
      sy + h * 0.55,
      u * 2,
      u,
      rgba(mat.particle, 0.5),
    );
  }
  drawPressIndent(a);
  drawDebris(a, 3, mat.particle);
  drawAmbientSpecks(a, 5, mat.particle);
}

/** Espuma — picos altos tipo chantilly */
function drawWhipped(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, wobble } = a;
  const x = cx - w / 2;
  const press = a.overlay?.pressAmount ?? 0;
  const collapse = Math.min(1, press * 1.2);

  fillPx(ctx, x + u, sy + h * 0.35, w - u * 2, h * 0.65, mat.fill);
  fillPx(ctx, x, sy + h * 0.5, w, h * 0.5, mat.fill);
  const peaks = 6;
  for (let i = 0; i < peaks; i++) {
    const px0 = x + u * 2 + (i / (peaks - 1)) * (w - u * 4);
    const ph = h * (0.55 + seeded(seed, i) * 0.45) * (1 - collapse * 0.55) + Math.sin(wobble + i) * u;
    for (let row = 0; row < ph; row += u) {
      const tw = u * 2 + (row / ph) * u * 5;
      fillPx(ctx, px0 - tw / 2, sy + h * 0.4 - row, tw, u, i === 2 || i === 4 ? PASTEL.blush : mat.fill);
    }
    fillPx(ctx, px0 - u, sy + h * 0.4 - ph, u * 2, u, PASTEL.white);
    // Air pores
    if (seeded(seed, i + 10) > 0.4) {
      fillPx(ctx, px0, sy + h * 0.4 - ph * 0.5, u, u, rgba(PASTEL.white, 0.35));
    }
  }
  // Collapsed foam crumbs when pressed
  if (press > 0.3) {
    for (let i = 0; i < 4 + Math.floor(press * 4); i++) {
      fillPx(
        ctx,
        cx + (seeded(seed, i + 16) - 0.5) * w * 0.8,
        sy + h * 0.35 + seeded(seed, i + 20) * h * 0.3,
        u,
        u,
        i % 2 ? PASTEL.white : mat.particle,
      );
    }
  }
  fillPx(ctx, x, sy + h - u, w, u, mat.stroke);
  drawDebris(a, 4, PASTEL.white);
  drawAmbientSpecks(a, 5, mat.particle);
}

/** Areia — monte irregular granuloso */
function drawSand(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, overlay, time } = a;
  const integ = overlay?.integrity ?? 1;
  const press = overlay?.pressAmount ?? 0;
  const hh = h * Math.max(0.3, integ);
  for (let row = 0; row < hh; row += u) {
    const t = 1 - row / hh;
    const ww = w * (0.4 + t * 0.6);
    fillPx(ctx, cx - ww / 2, sy + h - row - u, ww, u, mat.fill);
  }
  for (let i = 0; i < 24; i++) {
    if (seeded(seed, i) > integ) continue;
    fillPx(
      ctx,
      cx + (seeded(seed, i + 10) - 0.5) * w * 0.75,
      sy + h - hh * (0.15 + seeded(seed, i + 20) * 0.75),
      u,
      u,
      i % 3 === 0 ? mat.stroke : i % 3 === 1 ? PASTEL.sandSoft : mat.particle,
    );
  }
  // Footprint + crumbling edge grains
  if (press > 0.08 || integ < 0.95) {
    fillPx(ctx, cx - w * 0.18, sy + h - hh + u, w * 0.36, u * 2, mat.stroke);
    fillPx(ctx, cx - w * 0.1, sy + h - hh + u * 2, w * 0.2, u, rgba(mat.particle, 0.5));
  }
  if (integ < 1) {
    for (let i = 0; i < 4; i++) {
      const fall = ((time * 3 + i) % 1) * u * 4;
      fillPx(
        ctx,
        cx + (seeded(seed, i + 30) - 0.5) * w * 0.6,
        sy + h + fall,
        u,
        u,
        mat.particle,
      );
    }
  }
  drawDebris(a, 5, mat.particle);
  drawAmbientSpecks(a, 3, mat.particle);
}

/** Gelo — cristais irregulares, pontas */
function drawIce(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, time, overlay } = a;
  const x = cx - w / 2;
  const crack = overlay?.crackLevel ?? 0;
  fillPx(ctx, x + u * 2, sy, w - u * 4, h, mat.fill);
  fillPx(ctx, x, sy + u * 2, w, h - u * 3, mat.fill);
  for (let i = 0; i < 5; i++) {
    const sx = x + u * 2 + (i / 4) * (w - u * 8);
    const sh = u * (2 + Math.floor(seeded(seed, i) * 4));
    fillPx(ctx, sx, sy - sh, u * 2, sh + u, PASTEL.white);
    fillPx(ctx, sx + u, sy - sh - u, u, u, mat.fill);
  }
  for (let i = 0; i < 6; i++) {
    fillPx(
      ctx,
      x + seeded(seed, i + 40) * (w - u * 4),
      sy + u * 2 + seeded(seed, i + 45) * (h - u * 4),
      u * 2,
      u,
      rgba(PASTEL.mist, 0.55),
    );
  }
  if (crack > 0.02) {
    for (let i = 0; i < 2 + Math.floor(crack * 4); i++) {
      fillPx(
        ctx,
        cx - w * 0.3 + (i / 5) * w * 0.6,
        sy + h * (0.2 + seeded(seed, i + 50) * 0.5),
        u,
        u * (2 + Math.floor(crack * 3)),
        rgba(PASTEL.white, 0.6 + crack * 0.3),
      );
    }
  }
  for (let i = 0; i < 6; i++) {
    if (Math.sin(time * 5 + seed + i * 2) > 0.15) {
      fillPx(ctx, cx + (seeded(seed, i + 55) - 0.5) * w * 0.7, sy + seeded(seed, i + 60) * h * 0.6, u, u, PASTEL.white);
      fillPx(ctx, cx + (seeded(seed, i + 65) - 0.5) * w * 0.5, sy + seeded(seed, i + 70) * h * 0.4, u, u, mat.particle);
    }
  }
  fillPx(ctx, x + u, sy + h - u, w - u * 2, u, mat.stroke);
  fillPx(ctx, cx - u, sy + u * 2, u, h - u * 4, rgba(PASTEL.white, 0.45));
  drawPressIndent(a);
  drawDebris(a, 3, mat.particle);
  drawAmbientSpecks(a, 6, mat.particle);
}

/** Chiclete — blob irregular, manchas mascadas, fios */
function drawGum(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, overlay, wobble, time } = a;
  const x = cx - w / 2;
  const press = overlay?.pressAmount ?? 0;
  fillPx(ctx, x + u * 2, sy, w - u * 4, h, mat.fill);
  fillPx(ctx, x, sy + u * 2, w, h - u * 3, mat.fill);
  fillPx(ctx, x + u, sy + u, u * 3, h - u * 2, mat.fill);
  fillPx(ctx, x + w - u * 4, sy + u, u * 3, h - u * 2, mat.fill);
  for (let i = 0; i < 10; i++) {
    const bx = x + u * 2 + seeded(seed, i) * (w - u * 6);
    const by = sy + u + seeded(seed, i + 5) * (h - u * 3);
    fillPx(ctx, bx, by, u * (2 + (i % 3)), u * 2, i % 2 ? mat.stroke : PASTEL.blush);
  }
  fillPx(ctx, cx - u * 2, sy + u, u * 3, u, rgba(PASTEL.white, 0.55));
  const pull = Math.sin(wobble) * u * (1 + press);
  fillPx(ctx, cx - u * 4 + pull, sy - u * 2, u * 2, u * 2, mat.fill);
  fillPx(ctx, cx + u * 3, sy - u, u * 2, u, mat.stroke);
  // Sticky strands — always visible, stretch when pressed/sticky
  const strandBase = overlay?.behavior === 'sticky' ? 5 : 3;
  const strand = u * (strandBase + Math.floor((Math.sin(wobble * 2 + time) * 0.5 + 0.5) * 3 + press * 2));
  fillPx(ctx, cx - u * 3 + pull, sy - strand, u, strand, mat.particle);
  fillPx(ctx, cx + u * 2, sy - strand * 0.75, u, strand * 0.75, mat.fill);
  fillPx(ctx, cx - u * 3 + pull, sy - strand - u, u * 2, u, mat.particle);
  drawPressIndent(a);
  drawDebris(a, 4, mat.particle);
  drawAmbientSpecks(a, 4, mat.particle);
}

/** Massa — dobras cremosas */
function drawDough(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, wobble, time } = a;
  const x = cx - w / 2;
  const fold = Math.sin(wobble * 0.6) * u;
  const press = a.overlay?.pressAmount ?? 0;

  fillPx(ctx, x + u, sy, w - u * 2, h, mat.fill);
  fillPx(ctx, x, sy + u, w, h - u * 2, mat.fill);
  fillPx(ctx, x - u, sy + u * 2, u * 2, h - u * 4, mat.fill);
  fillPx(ctx, x + w - u, sy + u * 2, u * 2, h - u * 4, mat.fill);
  for (let i = 0; i < 5; i++) {
    fillPx(
      ctx,
      x + u * 3 + i * (w / 5.5) + fold * (1 + press),
      sy + u * (1.5 + i * 0.9),
      w * 0.38,
      u,
      rgba(mat.stroke, 0.35 + press * 0.15),
    );
  }
  // Flour dust specks
  for (let i = 0; i < 8; i++) {
    if (Math.sin(time * 1.5 + i + seed) > -0.3) {
      fillPx(
        ctx,
        x + u * 2 + seeded(seed, i + 90) * (w - u * 6),
        sy + u + seeded(seed, i + 95) * (h - u * 3),
        u,
        u,
        rgba(mat.particle, 0.45),
      );
    }
  }
  fillPx(ctx, x + u * 3, sy, w - u * 6, u, rgba(PASTEL.white, 0.4));
  fillPx(ctx, x + u, sy + h - u, w - u * 2, u, mat.stroke);
  fillPx(ctx, cx + (seeded(seed, 1) - 0.5) * w * 0.15, sy + h * 0.38, u * (3 + press * 2), u * (2 + press), rgba(mat.stroke, 0.35 + press * 0.2));
  drawPressIndent(a);
  drawDebris(a, 4, mat.particle);
  drawAmbientSpecks(a, 3, mat.particle);
}
