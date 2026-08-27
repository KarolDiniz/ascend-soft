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

/** Gelatina — topo ondulado, bolhas, wobble sheen */
function drawJelly(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, wobble, seed } = a;
  const x = cx - w / 2;
  const wave = Math.sin(wobble) * u;

  // Layered gelatin body with wavy top
  for (let row = 0; row < h; row += u) {
    const t = row / h;
    const waveW = w * (0.92 + Math.sin(t * 4 + wobble) * 0.06);
    const ox = Math.sin(wobble + t * 2) * u;
    fillPx(ctx, cx - waveW / 2 + ox, sy + row, waveW, u, mat.fill);
  }
  // Top jelly dome bumps
  for (let i = 0; i < 5; i++) {
    const bx = x + u * 2 + (i / 4) * (w - u * 4);
    fillPx(ctx, bx, sy - u * 2 + (i % 2) * u, u * 3, u * 2, mat.fill);
  }
  // Inner bubbles
  for (let i = 0; i < 7; i++) {
    fillPx(
      ctx,
      x + u * 3 + seeded(seed, i) * (w - u * 8),
      sy + u * 2 + seeded(seed, i + 3) * (h - u * 4),
      u,
      u,
      rgba(PASTEL.white, 0.55),
    );
  }
  // Moving highlight
  fillPx(ctx, cx - u * 3 + wave, sy + u, u * 4, u, rgba(PASTEL.white, 0.5));
  // Outline accents
  fillPx(ctx, x, sy + u, u, h - u * 2, mat.stroke);
  fillPx(ctx, x + w - u, sy + u, u, h - u * 2, mat.stroke);
  fillPx(ctx, x + u, sy + h - u, w - u * 2, u, mat.stroke);
}

/** Manteiga — laje larga, cantos retos, marcas de faca, derrete */
function drawButter(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, melt, seed } = a;
  const x = cx - w / 2;
  // Sharp slab (no rounded sides)
  fillPx(ctx, x, sy, w, h, mat.fill);
  fillPx(ctx, x, sy, w, u, rgba(PASTEL.white, 0.55));
  fillPx(ctx, x, sy + h - u, w, u, mat.stroke);
  fillPx(ctx, x, sy, u, h, mat.stroke);
  fillPx(ctx, x + w - u, sy, u, h, mat.stroke);
  // Knife scores
  for (let i = 0; i < 5; i++) {
    fillPx(ctx, x + u * 3, sy + u * (2 + i * 2), w - u * 6, u, rgba(mat.stroke, 0.45));
  }
  // Melt puddle spread
  if (melt > 0.05) {
    const pw = w * (1 + melt * 0.4);
    fillPx(ctx, cx - pw / 2, sy + h - u, pw, u * (1 + Math.floor(melt * 3)), mat.fill);
    for (let i = 0; i < 3 + Math.floor(melt * 4); i++) {
      fillPx(
        ctx,
        cx + (seeded(seed, i) - 0.5) * pw * 0.8,
        sy + h,
        u * 2,
        u * (2 + Math.floor(melt * 4)),
        mat.fill,
      );
    }
  }
}

/** Queijo — irregular + furos grandes atravessando */
function drawCheese(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, wobble } = a;
  const x = cx - w / 2;
  const hop = Math.sin(wobble * 0.95) * u;

  // Slightly irregular top
  fillPx(ctx, x + u, sy + hop, w - u * 2, h, mat.fill);
  fillPx(ctx, x, sy + u + hop, w, h - u * 2, mat.fill);
  fillPx(ctx, x + u * 2, sy - u + hop, w - u * 4, u, mat.fill);
  fillPx(ctx, x + u, sy + hop, w - u * 2, u, rgba(PASTEL.white, 0.35));
  fillPx(ctx, x, sy + h - u + hop, w, u, mat.stroke);

  // Big holes (through-platform look)
  const holes = [
    [0.25, 0.35, 3],
    [0.55, 0.25, 4],
    [0.72, 0.5, 3],
    [0.4, 0.6, 2],
  ] as const;
  for (let i = 0; i < holes.length; i++) {
    const [nx, ny, r] = holes[i];
    const hx = x + w * nx + (seeded(seed, i) - 0.5) * u * 2;
    const hy = sy + h * ny + hop;
    fillPx(ctx, hx, hy, u * r, u * r, '#F7E8C8');
    fillPx(ctx, hx + u, hy + u, u * Math.max(1, r - 1), u * Math.max(1, r - 1), rgba(mat.stroke, 0.35));
  }
}

/** Chocolate — barra com sulcos de tablete */
function drawChocolate(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, melt } = a;
  const x = cx - w / 2;
  fillPx(ctx, x + u, sy, w - u * 2, h, mat.fill);
  fillPx(ctx, x, sy + u, w, h - u * 2, mat.fill);
  fillPx(ctx, x + u * 2, sy, w - u * 4, u, rgba(PASTEL.white, 0.35));
  // Tablet segments 2x3
  const cols = 3;
  const rows = 2;
  for (let c = 1; c < cols; c++) {
    fillPx(ctx, x + (w * c) / cols, sy + u, u, h - u * 2, mat.stroke);
  }
  for (let r = 1; r < rows; r++) {
    fillPx(ctx, x + u * 2, sy + (h * r) / rows, w - u * 4, u, mat.stroke);
  }
  fillPx(ctx, x + u, sy + h - u, w - u * 2, u, mat.stroke);
  if (melt > 0.1) {
    for (let i = 0; i < 4; i++) {
      fillPx(ctx, x + u * 4 + i * (w / 5), sy + h - u, u * 2, u * (2 + Math.floor(melt * 3)), mat.fill);
    }
  }
}

/** Cítrico — cunha / meia-lua com casca e polpa */
function drawCitrus(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u } = a;
  const x = cx - w / 2;
  // Wedge: wider at bottom
  for (let row = 0; row < h; row += u) {
    const t = row / Math.max(1, h - u);
    const ww = w * (0.45 + t * 0.55);
    fillPx(ctx, cx - ww / 2, sy + row, ww, u, mat.fill);
  }
  // White pith rim on top curve
  fillPx(ctx, x + w * 0.15, sy, w * 0.7, u, PASTEL.white);
  // Peel edge (darker)
  fillPx(ctx, x + w * 0.05, sy + h - u * 2, w * 0.9, u * 2, mat.stroke);
  // Pulp rays
  for (let i = 0; i < 5; i++) {
    const a0 = 0.2 + i * 0.15;
    fillPx(ctx, cx - u / 2 + (i - 2) * u * 3, sy + u * 2, u, h - u * 4, rgba(PASTEL.white, 0.4));
    void a0;
  }
  // Center pith
  fillPx(ctx, cx - u, sy + h * 0.35, u * 2, u * 2, PASTEL.white);
}

/** Mel — borda dentada hex + células */
function drawHoney(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, melt, seed } = a;
  const x = cx - w / 2;
  // Hex-scalloped top
  for (let i = 0; i < 6; i++) {
    const bx = x + (i / 5) * (w - u * 4);
    fillPx(ctx, bx, sy - u * (i % 2 === 0 ? 2 : 1), u * 4, h + u * 2, mat.fill);
  }
  fillPx(ctx, x, sy + u, w, h - u, mat.fill);
  // Cells
  for (let i = 0; i < 10; i++) {
    const hx = x + u * 3 + (i % 5) * (w / 5.5);
    const hy = sy + u * 2 + Math.floor(i / 5) * (h * 0.4);
    fillPx(ctx, hx, hy, u * 3, u, mat.stroke);
    fillPx(ctx, hx + u, hy - u, u, u * 3, rgba(PASTEL.butter, 0.5));
    fillPx(ctx, hx + u, hy + u, u, u, rgba(PASTEL.white, 0.35 + seeded(seed, i) * 0.2));
  }
  // Honey drip
  if (melt > 0.05 || true) {
    const drip = u * (2 + Math.floor((melt + 0.15) * 4));
    fillPx(ctx, cx - u, sy + h - u, u * 2, drip, mat.fill);
    fillPx(ctx, cx + w * 0.2, sy + h - u, u * 2, drip * 0.7, mat.fill);
  }
}

/** Sabonete rosa — barra chanfrada + glitter */
function drawSoapPink(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed } = a;
  const x = cx - w / 2;
  // Chamfered bar
  fillPx(ctx, x + u * 2, sy, w - u * 4, h, mat.fill);
  fillPx(ctx, x + u, sy + u, w - u * 2, h - u * 2, mat.fill);
  fillPx(ctx, x, sy + u * 2, w, h - u * 4, mat.fill);
  fillPx(ctx, x + u * 3, sy, w - u * 6, u, rgba(PASTEL.white, 0.65));
  fillPx(ctx, x + u * 2, sy + h - u, w - u * 4, u, mat.stroke);
  // Emboss line
  fillPx(ctx, x + u * 4, sy + h * 0.45, w - u * 8, u, rgba(PASTEL.white, 0.4));
  // Glitter
  for (let i = 0; i < 6; i++) {
    fillPx(
      ctx,
      x + u * 4 + seeded(seed, i) * (w - u * 10),
      sy + u * 3 + seeded(seed, i + 4) * (h * 0.45),
      u,
      u,
      i % 2 ? PASTEL.white : PASTEL.lilac,
    );
  }
}

/** Espuma — picos altos tipo chantilly */
function drawWhipped(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, wobble } = a;
  const x = cx - w / 2;
  // Base cloud
  fillPx(ctx, x + u, sy + h * 0.35, w - u * 2, h * 0.65, mat.fill);
  fillPx(ctx, x, sy + h * 0.5, w, h * 0.5, mat.fill);
  // Tall soft peaks
  const peaks = 5;
  for (let i = 0; i < peaks; i++) {
    const px0 = x + u * 3 + (i / (peaks - 1)) * (w - u * 6);
    const ph = h * (0.55 + seeded(seed, i) * 0.45) + Math.sin(wobble + i) * u;
    for (let row = 0; row < ph; row += u) {
      const tw = u * 2 + (row / ph) * u * 5;
      fillPx(ctx, px0 - tw / 2, sy + h * 0.4 - row, tw, u, i === 2 ? PASTEL.blush : mat.fill);
    }
    fillPx(ctx, px0 - u, sy + h * 0.4 - ph, u * 2, u, PASTEL.white);
  }
  fillPx(ctx, x, sy + h - u, w, u, mat.stroke);
}

/** Areia — monte irregular granuloso */
function drawSand(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, overlay } = a;
  const integ = overlay?.integrity ?? 1;
  const hh = h * Math.max(0.3, integ);
  // Mound steps
  for (let row = 0; row < hh; row += u) {
    const t = 1 - row / hh;
    const ww = w * (0.4 + t * 0.6);
    fillPx(ctx, cx - ww / 2, sy + h - row - u, ww, u, mat.fill);
  }
  // Grains
  for (let i = 0; i < 16; i++) {
    if (seeded(seed, i) > integ) continue;
    fillPx(
      ctx,
      cx + (seeded(seed, i + 10) - 0.5) * w * 0.7,
      sy + h - hh * (0.2 + seeded(seed, i + 20) * 0.7),
      u,
      u,
      i % 3 === 0 ? mat.stroke : PASTEL.sandSoft,
    );
  }
  // Footprint dip when pressed
  if ((overlay?.integrity ?? 1) < 0.95) {
    fillPx(ctx, cx - w * 0.15, sy + h - hh + u, w * 0.3, u * 2, mat.stroke);
  }
}

/** Gelo — cristais irregulares, pontas */
function drawIce(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, time } = a;
  const x = cx - w / 2;
  // Jagged body
  fillPx(ctx, x + u * 2, sy, w - u * 4, h, mat.fill);
  fillPx(ctx, x, sy + u * 2, w, h - u * 3, mat.fill);
  // Crystal spikes on top
  for (let i = 0; i < 4; i++) {
    const sx = x + u * 3 + (i / 3) * (w - u * 8);
    const sh = u * (2 + Math.floor(seeded(seed, i) * 3));
    fillPx(ctx, sx, sy - sh, u * 2, sh + u, PASTEL.white);
    fillPx(ctx, sx + u, sy - sh - u, u, u, mat.fill);
  }
  // Frost sparkle
  if (Math.sin(time * 5 + seed) > 0.3) {
    fillPx(ctx, cx + w * 0.15, sy + h * 0.3, u, u, PASTEL.white);
    fillPx(ctx, cx - w * 0.2, sy + h * 0.5, u, u, PASTEL.white);
  }
  fillPx(ctx, x + u, sy + h - u, w - u * 2, u, mat.stroke);
  // Inner facet
  fillPx(ctx, cx - u, sy + u * 2, u, h - u * 4, rgba(PASTEL.white, 0.45));
}

/** Chiclete — blob irregular, manchas mascadas, fios */
function drawGum(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, overlay, wobble } = a;
  const x = cx - w / 2;
  // Lumpy silhouette
  fillPx(ctx, x + u * 2, sy, w - u * 4, h, mat.fill);
  fillPx(ctx, x, sy + u * 2, w, h - u * 3, mat.fill);
  fillPx(ctx, x + u, sy + u, u * 3, h - u * 2, mat.fill);
  fillPx(ctx, x + w - u * 4, sy + u, u * 3, h - u * 2, mat.fill);
  // Chewed darker patches
  for (let i = 0; i < 7; i++) {
    const bx = x + u * 2 + seeded(seed, i) * (w - u * 6);
    const by = sy + u + seeded(seed, i + 5) * (h - u * 3);
    fillPx(ctx, bx, by, u * (2 + (i % 3)), u * 2, i % 2 ? mat.stroke : PASTEL.blush);
  }
  // Shine
  fillPx(ctx, cx - u * 2, sy + u, u * 3, u, rgba(PASTEL.white, 0.55));
  const pull = Math.sin(wobble) * u;
  fillPx(ctx, cx - u * 4 + pull, sy - u * 2, u * 2, u * 2, mat.fill);
  fillPx(ctx, cx + u * 3, sy - u, u * 2, u, mat.stroke);

  // Sticky strands
  if (overlay?.behavior === 'sticky') {
    const strand = u * (3 + Math.floor((Math.sin(wobble * 2) * 0.5 + 0.5) * 4));
    fillPx(ctx, cx - u * 2, sy - strand, u, strand, mat.fill);
    fillPx(ctx, cx + u * 4, sy - strand * 0.7, u, strand * 0.7, mat.stroke);
  }
}

/** Massa — dobras cremosas */
function drawDough(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, wobble } = a;
  const x = cx - w / 2;
  const fold = Math.sin(wobble * 0.6) * u;

  fillPx(ctx, x + u, sy, w - u * 2, h, mat.fill);
  fillPx(ctx, x, sy + u, w, h - u * 2, mat.fill);
  // Soft rounded ends
  fillPx(ctx, x - u, sy + u * 2, u * 2, h - u * 4, mat.fill);
  fillPx(ctx, x + w - u, sy + u * 2, u * 2, h - u * 4, mat.fill);
  // Fold swirls
  for (let i = 0; i < 4; i++) {
    fillPx(
      ctx,
      x + u * 4 + i * (w / 5) + fold,
      sy + u * (2 + i),
      w * 0.35,
      u,
      rgba(mat.stroke, 0.4),
    );
  }
  fillPx(ctx, x + u * 3, sy, w - u * 6, u, rgba(PASTEL.white, 0.4));
  fillPx(ctx, x + u, sy + h - u, w - u * 2, u, mat.stroke);
  // Knead dimple
  fillPx(ctx, cx + seeded(seed, 1) * w * 0.2, sy + h * 0.4, u * 3, u * 2, rgba(mat.stroke, 0.35));
}
