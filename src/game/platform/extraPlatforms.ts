import type { MaterialDef } from '../../audio/materials';
import { PASTEL, rgba } from '../../theme/pastelPalette';
import { fillPx } from '../../theme/pixel';
import { amoebaNucleusColor } from './amoebaColors';
import type { PixelPlatformOverlay } from './PixelPlatformRenderer';
import { drawKittenPlatform } from './kittenPlatform';
import type { PlatformPersonality } from './platformPersonality';

export interface ExtraDrawArgs {
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
  melt?: number;
  personality?: PlatformPersonality;
}

function seeded(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Ameba — blob orgânico com núcleo e pseudópodes */
export function drawAmoeba(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, time, wobble } = a;
  const press = a.overlay?.pressAmount ?? 0;
  const nucleus = amoebaNucleusColor(seed);
  const wob = Math.sin(time * 2.8 + wobble) * u * 1.2;

  for (let row = 0; row < h; row += u) {
    const t = row / Math.max(1, h - u);
    const bulge = Math.sin(t * Math.PI * 2 + time * 1.6 + seed * 0.01) * u * 1.5;
    const ww = w * (0.62 + Math.sin(t * Math.PI) * 0.38) + bulge;
    fillPx(ctx, cx - ww / 2 + wob * (1 - t), sy + row, ww, u, mat.fill);
  }
  fillPx(ctx, cx - u * 1.5 + wob, sy + h * 0.35, u * 3, u * 2.5, nucleus);
  fillPx(ctx, cx + u * 0.2 + wob, sy + h * 0.42, u, u, rgba('#FFFFFF', 0.5));
  for (let i = 0; i < 4; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const px = cx + side * w * 0.38 + Math.sin(time * 3 + i + wobble) * u;
    const py = sy + h * (0.55 + i * 0.1);
    fillPx(ctx, px, py, u * (1.5 + (i % 2)), u, rgba(mat.particle, 0.75));
  }
  if (press > 0.2) {
    fillPx(ctx, cx - u * 2, sy + h - u, u * 4, u, rgba(mat.stroke, 0.4));
  }
}

/** Garrafa PET — corpo translúcido, rótulo, tampa e nervuras */
export function drawPlasticBottle(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, time, wobble, overlay } = a;
  const press = overlay?.pressAmount ?? 0;
  const crack = overlay?.crackLevel ?? 0;
  const squash = 1 - press * 0.1;
  const body = mat.fill;
  const shimmer = Math.sin(time * 2.8 + wobble) * u * 0.55;
  const bodyTop = sy + u * 3;
  const bodyH = h * 0.86 * squash;

  fillPx(ctx, cx - w * 0.3, sy + h - u * 0.5, w * 0.6, u, rgba(mat.stroke, 0.22));

  for (let row = 0; row < bodyH; row += u) {
    const t = row / Math.max(u, bodyH);
    const bulge = 1 + Math.sin(t * Math.PI) * 0.14;
    const halfW = w * 0.39 * bulge;
    fillPx(ctx, cx - halfW, bodyTop + row, halfW * 2, u, rgba(body, 0.9));
    fillPx(ctx, cx - halfW, bodyTop + row, u, u, rgba(PASTEL.white, 0.24));
    fillPx(ctx, cx + halfW - u, bodyTop + row, u, u, rgba(mat.stroke, 0.16));
  }

  fillPx(ctx, cx - w * 0.3, sy + u * 2, w * 0.6, u * 2, rgba(body, 0.92));
  fillPx(ctx, cx - w * 0.22, sy + u, w * 0.44, u * 2, rgba(body, 0.94));
  fillPx(ctx, cx - u * 1.9, sy - u * 2, u * 3.8, u * 4, rgba(body, 0.96));
  fillPx(ctx, cx - u * 1.3, sy - u * 4, u * 2.6, u * 2, rgba(body, 0.98));

  fillPx(ctx, cx - u * 1.6, sy - u * 5.5, u * 3.2, u * 2, '#6AB0D8');
  fillPx(ctx, cx - u * 1.1, sy - u * 6, u * 2.2, u, rgba(PASTEL.white, 0.4));
  fillPx(ctx, cx - u * 0.5, sy - u * 6.5, u, u * 2, rgba('#4A98C8', 0.55));

  const labelY = bodyTop + bodyH * 0.3;
  const labelH = bodyH * 0.3;
  fillPx(ctx, cx - w * 0.33, labelY, w * 0.66, labelH, rgba(mat.particle, 0.64));
  fillPx(ctx, cx - w * 0.27, labelY + u, w * 0.54, u * 2, rgba(PASTEL.white, 0.58));
  fillPx(ctx, cx - w * 0.2, labelY + u * 3.5, w * 0.4, u * 1.5, rgba(PASTEL.seafoam, 0.48));
  fillPx(ctx, cx - w * 0.14, labelY + u * 5, w * 0.28, u, rgba(PASTEL.mint, 0.42));

  for (let i = 0; i < 5; i++) {
    const ry = bodyTop + bodyH * (0.6 + i * 0.075);
    fillPx(ctx, cx - w * 0.35, ry, w * 0.7, u, rgba(mat.stroke, 0.24));
    fillPx(ctx, cx - w * 0.31, ry + u * 0.45, w * 0.62, u, rgba(PASTEL.white, 0.14));
  }

  fillPx(ctx, cx - w * 0.14 + shimmer, bodyTop + u * 2, u * 2, bodyH * 0.52, rgba(PASTEL.white, 0.16));
  fillPx(ctx, cx + w * 0.1 + shimmer * 0.45, bodyTop + u * 5, u, bodyH * 0.32, rgba(PASTEL.white, 0.1));

  for (let i = 0; i < 5; i++) {
    if (Math.sin(time * 3.2 + i + seed * 0.01) <= 0.15) continue;
    fillPx(
      ctx,
      cx - w * 0.28 + seeded(seed, i) * w * 0.56,
      bodyTop + seeded(seed, i + 5) * bodyH * 0.55,
      u,
      u,
      rgba(PASTEL.sky, 0.42),
    );
  }

  if (crack > 0.02) {
    for (let i = 0; i < 2 + Math.floor(crack * 4); i++) {
      fillPx(
        ctx,
        cx + (seeded(seed, i + 40) - 0.5) * w * 0.38,
        bodyTop + seeded(seed, i + 45) * bodyH * 0.65,
        u,
        u * 2,
        rgba(PASTEL.white, 0.48 + crack * 0.38),
      );
    }
  }
}

/** Papel — folha dobrada com vincos */
export function drawPaper(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed } = a;
  const x = cx - w / 2;
  fillPx(ctx, x + u, sy + u, w - u * 2, h - u, mat.fill);
  fillPx(ctx, x, sy + u * 2, w, h - u * 2, mat.fill);
  fillPx(ctx, x + u * 2, sy, w - u * 4, u, rgba('#FFFFFF', 0.55));
  fillPx(ctx, cx - u * 0.5, sy + u, u, h - u * 2, rgba(mat.stroke, 0.35));
  fillPx(ctx, cx + u * 0.5, sy + u * 2, u, h - u * 4, rgba(mat.stroke, 0.22));
  fillPx(ctx, x + w * 0.62, sy + u, u * 2, h - u * 2, rgba(mat.particle, 0.18));
  for (let i = 0; i < 6; i++) {
    fillPx(
      ctx,
      x + u * 2 + seeded(seed, i + 3) * (w - u * 6),
      sy + u * 2 + seeded(seed, i + 9) * (h - u * 4),
      u,
      u,
      rgba(mat.stroke, 0.15 + seeded(seed, i) * 0.15),
    );
  }
  fillPx(ctx, x + w - u * 3, sy + u * 2, u * 2, u * 3, rgba(mat.particle, 0.25));
}

/** Grama — torf block com lâminas */
export function drawGrass(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, time, wobble } = a;
  const x = cx - w / 2;
  fillPx(ctx, x, sy + h * 0.35, w, h * 0.65, mat.stroke);
  fillPx(ctx, x + u, sy + h * 0.4, w - u * 2, h * 0.55, mat.fill);
  const blades = 11;
  for (let i = 0; i < blades; i++) {
    const bx = x + u + (i / (blades - 1)) * (w - u * 2);
    const sway = Math.sin(time * 3.5 + i * 0.9 + wobble) * u * 0.8;
    const bh = h * (0.45 + seeded(seed, i) * 0.35);
    for (let row = 0; row < bh; row += u) {
      const t = row / bh;
      const bw = u * (1.2 - t * 0.5);
      fillPx(ctx, bx + sway - bw / 2, sy + h - row - u, bw, u, i % 3 === 0 ? mat.particle : mat.fill);
    }
    fillPx(ctx, bx + sway - u / 2, sy + h - bh - u, u, u, rgba(mat.particle, 0.85));
  }
  fillPx(ctx, x + u * 2, sy + h - u, w - u * 4, u, rgba(mat.stroke, 0.5));
}

/** Algodão — tufo fofo irregular */
export function drawCotton(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, time, wobble } = a;
  const press = a.overlay?.pressAmount ?? 0;
  for (let i = 0; i < 9; i++) {
    const ox = (seeded(seed, i) - 0.5) * w * 0.7;
    const oy = (seeded(seed, i + 10) - 0.5) * h * 0.35;
    const r = u * (2 + seeded(seed, i + 20) * 2) * (1 - press * 0.25);
    fillPx(ctx, cx + ox - r / 2, sy + oy, r, r, mat.fill);
  }
  fillPx(ctx, cx - w * 0.35, sy + h * 0.2, w * 0.7, h * 0.55, mat.fill);
  for (let i = 0; i < 8; i++) {
    if (Math.sin(time * 2 + i + wobble) > 0) {
      fillPx(
        ctx,
        cx + (seeded(seed, i + 30) - 0.5) * w * 0.8,
        sy - u * (1 + Math.sin(time + i) * 1.5),
        u,
        u,
        rgba('#FFFFFF', 0.7),
      );
    }
  }
}

/** Musgo — monte felpudo verde */
export function drawMoss(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, time } = a;
  for (let row = 0; row < h; row += u) {
    const t = 1 - row / h;
    const ww = w * (0.55 + t * 0.45);
    fillPx(ctx, cx - ww / 2, sy + h - row - u, ww, u, mat.fill);
  }
  for (let i = 0; i < 22; i++) {
    const fx = cx + (seeded(seed, i) - 0.5) * w * 0.85;
    const fy = sy + h * (0.15 + seeded(seed, i + 5) * 0.65);
    fillPx(ctx, fx, fy, u, u, seeded(seed, i + 15) > 0.5 ? mat.particle : rgba(mat.fill, 0.85));
  }
  fillPx(ctx, cx - w * 0.2, sy + h * 0.3, w * 0.4, u, rgba('#FFFFFF', 0.12 + Math.sin(time * 2) * 0.06));
}

function fillPxPuff(
  ctx: CanvasRenderingContext2D,
  cx: number,
  baseY: number,
  width: number,
  height: number,
  u: number,
  color: string,
): void {
  const hw = width / 2;
  const rows = Math.max(1, Math.ceil(height / u));
  for (let row = 0; row < rows; row++) {
    const t = rows <= 1 ? 0 : row / (rows - 1);
    const y = baseY - (row + 1) * u;
    const halfW = hw * Math.sqrt(Math.max(0, 1 - t * t * 0.9));
    if (halfW >= u * 0.35) fillPx(ctx, cx - halfW, y, halfW * 2, u, color);
  }
}

/** Nuvem — silhueta clássica com bolhas arredondadas sobrepostas */
export function drawCloud(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, time, wobble, seed } = a;
  const press = a.overlay?.pressAmount ?? 0;
  const squash = 1 - press * 0.22;
  const drift = Math.sin(time * 1.35 + wobble) * u * 0.55;
  const baseY = sy + h * 0.78;

  const puffs: { x: number; rw: number; rh: number }[] = [
    { x: -0.36, rw: 0.24, rh: 0.34 },
    { x: -0.17, rw: 0.3, rh: 0.5 },
    { x: 0.02, rw: 0.38, rh: 0.72 },
    { x: 0.2, rw: 0.28, rh: 0.46 },
    { x: 0.37, rw: 0.22, rh: 0.3 },
  ];

  // Base achatada — superfície de apoio
  fillPx(ctx, cx - w * 0.48, baseY - u, w * 0.96, h * 0.28, mat.fill);
  fillPx(ctx, cx - w * 0.4, baseY - h * 0.18, w * 0.8, h * 0.16, mat.fill);

  for (let i = 0; i < puffs.length; i++) {
    const p = puffs[i]!;
    const px = cx + p.x * w + drift * (0.25 + Math.abs(p.x) * 0.5);
    const pw = w * p.rw * squash;
    const ph = h * p.rh * squash;
    fillPxPuff(ctx, px, baseY, pw, ph, u, mat.fill);
  }

  // Volume central — junta os puffs num corpo contínuo
  fillPx(ctx, cx - w * 0.44, baseY - h * 0.34 * squash, w * 0.88, h * 0.28 * squash, mat.fill);
  fillPx(ctx, cx - w * 0.3, baseY - h * 0.48 * squash, w * 0.6, h * 0.18 * squash, mat.fill);

  // Brilho no topo das cúpulas
  const highlights = [
    { x: -0.16, y: 0.52, ww: 0.22 },
    { x: 0.02, y: 0.68, ww: 0.28 },
    { x: 0.2, y: 0.46, ww: 0.18 },
  ];
  for (let i = 0; i < highlights.length; i++) {
    const hl = highlights[i]!;
    const hx = cx + hl.x * w + drift * 0.4;
    const hy = baseY - h * hl.y * squash;
    fillPx(ctx, hx - w * hl.ww * 0.5, hy, w * hl.ww, u * 2, rgba('#FFFFFF', 0.62 - i * 0.06));
    fillPx(ctx, hx - w * hl.ww * 0.28, hy - u, w * hl.ww * 0.56, u, rgba('#FFFFFF', 0.38));
  }

  // Sombra suave na base
  fillPx(ctx, cx - w * 0.34, baseY + u * 0.5, w * 0.68, u, rgba(mat.stroke, 0.18));

  // Brilhos cintilantes
  for (let i = 0; i < 5; i++) {
    if (Math.sin(time * 2.1 + i + wobble + seed * 0.01) <= 0.1) continue;
    fillPx(
      ctx,
      cx + (seeded(seed, i + 40) - 0.5) * w * 0.62 + drift,
      sy + u + seeded(seed, i + 44) * h * 0.35,
      u,
      u,
      rgba('#FFFFFF', 0.42 + seeded(seed, i + 48) * 0.25),
    );
  }
}

/** Veludo — placa plush com nap */
export function drawVelvet(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed } = a;
  const x = cx - w / 2;
  fillPx(ctx, x, sy, w, h, mat.fill);
  fillPx(ctx, x, sy, w, u, rgba(mat.particle, 0.45));
  fillPx(ctx, x, sy + h - u, w, u, mat.stroke);
  for (let i = 0; i < w; i += u * 2) {
    fillPx(ctx, x + i, sy + u, u, h - u * 2, rgba(mat.stroke, 0.12 + (i % 4 === 0 ? 0.08 : 0)));
  }
  for (let i = 0; i < 10; i++) {
    fillPx(
      ctx,
      x + u + seeded(seed, i + 50) * (w - u * 4),
      sy + u + seeded(seed, i + 60) * (h - u * 3),
      u,
      u * 2,
      rgba(mat.particle, 0.35 + seeded(seed, i) * 0.2),
    );
  }
  fillPx(ctx, cx - w * 0.15, sy + u, w * 0.3, h * 0.5, rgba('#FFFFFF', 0.08));
}

const BLOSSOM_PETALS = ['#F0A8C0', '#F8C0D8', '#F8E0A8', '#E8B8D8', '#FFB8C8'];
const STEM_GREEN = '#78B868';

/** Canteiro de flores — pétalas e caules balançando */
export function drawBlossom(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, time, wobble } = a;
  const x = cx - w / 2;
  fillPx(ctx, x + u, sy + h * 0.55, w - u * 2, h * 0.45, mat.stroke);
  fillPx(ctx, x + u * 2, sy + h * 0.6, w - u * 4, h * 0.38, mat.fill);
  const flowers = 7;
  for (let i = 0; i < flowers; i++) {
    const fx = x + u * 2 + (i / Math.max(1, flowers - 1)) * (w - u * 4);
    const sway = Math.sin(time * 2.8 + i + wobble) * u * 0.5;
    const stemH = h * (0.35 + seeded(seed, i) * 0.25);
    fillPx(ctx, fx + sway, sy + h - stemH, u, stemH, STEM_GREEN);
    const petalColor = BLOSSOM_PETALS[i % BLOSSOM_PETALS.length]!;
    for (let p = 0; p < 4; p++) {
      const pa = (p / 4) * Math.PI * 2;
      fillPx(
        ctx,
        fx + sway + Math.cos(pa) * u * 1.2 - u / 2,
        sy + h - stemH - u + Math.sin(pa) * u * 0.6,
        u,
        u,
        petalColor,
      );
    }
    fillPx(ctx, fx + sway - u / 2, sy + h - stemH - u, u, u, '#F8E878');
  }
  fillPx(ctx, x + u * 2, sy + h - u, w - u * 4, u, rgba(mat.particle, 0.45));
}

/** Marimba — barras de madeira ressonantes */
export function drawMarimba(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed } = a;
  const x = cx - w / 2;
  const press = a.overlay?.pressAmount ?? 0;
  fillPx(ctx, x, sy + h - u * 2, w, u * 2, mat.stroke);
  const bars = 7;
  const hitBar = a.overlay?.marimbaBarIndex ?? -1;
  const barFlash = a.overlay?.marimbaBarFlash ?? 0;
  for (let i = 0; i < bars; i++) {
    const bw = w / bars - u * 0.4;
    const bx = x + (i / bars) * w + u * 0.2;
    const barH = h * (0.55 + (i % 3) * 0.12) * (1 - press * 0.08);
    const wood = i % 2 === 0 ? mat.fill : mat.particle;
    fillPx(ctx, bx, sy + h - barH - u, bw, barH, wood);
    fillPx(ctx, bx, sy + h - barH - u, bw, u, rgba('#FFFFFF', 0.22));
    if (seeded(seed, i) > 0.6) {
      fillPx(ctx, bx + bw * 0.3, sy + h - barH - u * 2, u, u, rgba(mat.stroke, 0.35));
    }
    if (i === hitBar && barFlash > 0.05) {
      fillPx(ctx, bx, sy + h - barH - u, bw, barH, rgba('#FFFFFF', 0.28 * barFlash));
      fillPx(ctx, bx, sy + h - barH - u * 3, bw, u * 2, rgba(PASTEL.butter, 0.55 * barFlash));
    }
  }
  fillPx(ctx, cx - w * 0.45, sy + h - u, w * 0.9, u, rgba(mat.stroke, 0.5));
}

/** Faceta de gema — trapézio em scanlines pixel */
function fillPxCrystalShard(
  ctx: CanvasRenderingContext2D,
  apexX: number,
  apexY: number,
  baseLeftX: number,
  baseRightX: number,
  baseY: number,
  u: number,
  color: string,
): void {
  const height = baseY - apexY;
  const rows = Math.max(1, Math.ceil(height / u));
  for (let row = 0; row < rows; row++) {
    const t = (row + 1) / rows;
    const y = apexY + row * u;
    const left = apexX + (baseLeftX - apexX) * t;
    const right = apexX + (baseRightX - apexX) * t;
    const ww = right - left;
    if (ww >= u * 0.35) fillPx(ctx, left, y, ww, u, color);
  }
}

/** Cristal — gema facetada com brilho prismático */
export function drawCrystal(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, time, wobble, seed, overlay } = a;
  const press = overlay?.pressAmount ?? 0;
  const crack = overlay?.crackLevel ?? 0;
  const shimmer = Math.sin(time * 3.8 + wobble) * u * 1.1;
  const baseY = sy + h * 0.9;
  const apexY = sy - h * (0.3 - press * 0.05);

  fillPx(ctx, cx - w * 0.26, baseY, w * 0.52, u, rgba(mat.stroke, 0.24));

  fillPxCrystalShard(
    ctx,
    cx - w * 0.06,
    apexY + h * 0.06,
    cx - w * 0.46,
    cx - w * 0.04,
    baseY,
    u,
    rgba(mat.stroke, 0.58),
  );
  fillPxCrystalShard(
    ctx,
    cx + w * 0.05,
    apexY + h * 0.04,
    cx + w * 0.02,
    cx + w * 0.46,
    baseY,
    u,
    rgba(mat.fill, 0.76),
  );
  fillPxCrystalShard(
    ctx,
    cx,
    apexY,
    cx - w * 0.2,
    cx + w * 0.24,
    baseY,
    u,
    rgba(mat.fill, 0.9),
  );

  fillPx(
    ctx,
    cx - w * 0.1 + shimmer * 0.18,
    apexY + u * 2,
    u,
    baseY - apexY - u * 4,
    rgba(mat.stroke, 0.32),
  );
  fillPx(
    ctx,
    cx + w * 0.11 + shimmer * 0.12,
    apexY + u * 3,
    u,
    baseY - apexY - u * 5,
    rgba(PASTEL.white, 0.28),
  );

  fillPx(ctx, cx - u, apexY, u * 2, u * 2, rgba(PASTEL.white, 0.88));
  fillPx(ctx, cx - u * 0.5, apexY - u, u, u, rgba(PASTEL.white, 0.96));

  fillPx(ctx, cx - w * 0.4, sy, w * 0.8, u * 2, rgba(mat.particle, 0.62));
  fillPx(ctx, cx - w * 0.3 + shimmer * 0.25, sy, w * 0.6, u, rgba(PASTEL.white, 0.78));

  const satellites = [
    { ox: -0.4, scale: 0.52, tilt: -0.1 },
    { ox: 0.38, scale: 0.46, tilt: 0.09 },
  ];
  for (let i = 0; i < satellites.length; i++) {
    const s = satellites[i]!;
    const sx = cx + s.ox * w;
    const shardH = h * s.scale;
    const say = sy + h * 0.06 - shardH * 0.32;
    const sbase = sy + h * 0.7;
    fillPxCrystalShard(
      ctx,
      sx + s.tilt * w,
      say,
      sx - w * 0.11 * s.scale,
      sx + w * 0.13 * s.scale,
      sbase,
      u,
      rgba(mat.fill, 0.68 - i * 0.06),
    );
    fillPx(ctx, sx - u, say + u, u * 2, u, rgba(PASTEL.white, 0.52));
    fillPx(ctx, sx + u * 0.2, say + shardH * 0.35, u, u * 2, rgba(PASTEL.lilac, 0.22));
  }

  const bandY = sy + h * (0.28 + Math.sin(time * 2.3 + wobble) * 0.07);
  fillPx(ctx, cx - w * 0.24 + shimmer, bandY, w * 0.48, u, rgba(PASTEL.white, 0.42));
  fillPx(ctx, cx - w * 0.14 + shimmer * 0.55, bandY + u, w * 0.28, u, rgba(PASTEL.lilac, 0.3));
  fillPx(ctx, cx + w * 0.04 + shimmer * 0.35, bandY + u * 2, w * 0.16, u, rgba(PASTEL.mint, 0.26));

  for (let i = 0; i < 9; i++) {
    if (Math.sin(time * 4.8 + i * 1.25 + seed * 0.01) < 0.12) continue;
    const fx = cx + (seeded(seed, i) - 0.5) * w * 0.52;
    const fy = sy + u * 2 + seeded(seed, i + 5) * h * 0.58;
    fillPx(ctx, fx, fy, u, u, rgba(PASTEL.white, 0.5 + seeded(seed, i + 10) * 0.38));
    if (i % 3 === 0) {
      fillPx(ctx, fx + u, fy - u, u, u, rgba(PASTEL.mint, 0.42));
      fillPx(ctx, fx - u, fy, u, u, rgba(PASTEL.lilac, 0.35));
    }
  }

  if (crack > 0.02) {
    for (let i = 0; i < 2 + Math.floor(crack * 5); i++) {
      const ox = cx + (seeded(seed, i + 50) - 0.5) * w * 0.38;
      const oy = sy + h * (0.12 + seeded(seed, i + 55) * 0.52);
      const segs = 2 + Math.floor(crack * 3);
      for (let j = 0; j < segs; j++) {
        fillPx(ctx, ox + j * u, oy + j * u * 1.15, u, u * 2, rgba(PASTEL.white, 0.48 + crack * 0.42));
      }
    }
    fillPx(ctx, cx - w * 0.08, sy + h * 0.35, u * 2, u * 3, rgba(PASTEL.white, 0.35 * crack));
  }

  if (press > 0.15) {
    fillPx(ctx, cx - w * 0.34, sy + u, w * 0.68, u, rgba(PASTEL.white, 0.22 + press * 0.18));
  }

  fillPx(ctx, cx - w * 0.42, baseY - u, w * 0.84, u, rgba(mat.stroke, 0.36));
}

/** Cerâmica — tigela esmaltada com borda e pés */
export function drawCeramic(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, time, wobble, overlay } = a;
  const press = overlay?.pressAmount ?? 0;
  const crack = overlay?.crackLevel ?? 0;
  const footY = sy + h * 0.9;
  const bowlH = footY - sy;
  const shimmer = Math.sin(time * 2.4 + wobble) * u * 0.35;

  for (let row = 0; row < bowlH; row += u) {
    const t = row / Math.max(u, bowlH);
    const halfW = w * (0.47 - t * t * 0.26);
    const wall = u * 2.4;
    fillPx(ctx, cx - halfW, sy + row, halfW * 2, u, mat.stroke);
    const inner = halfW - wall;
    if (inner > u * 1.5) {
      fillPx(ctx, cx - inner, sy + row, inner * 2, u, row < u * 3 ? rgba(mat.particle, 0.72) : mat.fill);
    }
  }

  fillPx(ctx, cx - w * 0.49, sy - u, w * 0.98, u * 2, mat.fill);
  fillPx(ctx, cx - w * 0.45, sy - u, w * 0.9, u, rgba(PASTEL.white, 0.48));
  fillPx(ctx, cx - w * 0.4, sy, w * 0.8, u, rgba(mat.particle, 0.55));

  fillPx(ctx, cx - w * 0.19, footY - u, w * 0.38, u * 2, mat.stroke);
  fillPx(ctx, cx - w * 0.15, footY, w * 0.3, u, rgba(mat.stroke, 0.58));
  fillPx(ctx, cx - u * 2, footY + u * 0.5, u * 4, u, rgba(mat.stroke, 0.35));

  const motifY = sy + bowlH * 0.42;
  for (let i = 0; i < 5; i++) {
    const mx = cx - w * 0.3 + i * w * 0.15;
    fillPx(ctx, mx, motifY, u * 1.6, u * 1.6, rgba(PASTEL.caramelDeep, 0.42));
    fillPx(ctx, mx + u * 0.3, motifY + u * 0.3, u, u, rgba(PASTEL.white, 0.38));
  }
  fillPx(ctx, cx - w * 0.28, motifY + u * 2, w * 0.56, u, rgba(PASTEL.caramel, 0.32));
  fillPx(ctx, cx - w * 0.12, motifY + u * 3, u * 3, u, rgba(PASTEL.caramelDeep, 0.28));

  fillPx(ctx, cx - w * 0.2 + shimmer, sy + u * 2, w * 0.32, bowlH * 0.38, rgba(PASTEL.white, 0.1));
  fillPx(ctx, cx + w * 0.08 + shimmer * 0.5, sy + u * 3, u * 2, u * 3, rgba(PASTEL.white, 0.22));

  if (press > 0.12) {
    fillPx(ctx, cx - w * 0.28, sy + u, w * 0.56, u, rgba(mat.particle, 0.22 + press * 0.18));
  }

  if (crack > 0.02) {
    for (let i = 0; i < 2 + Math.floor(crack * 5); i++) {
      const ox = cx + (seeded(seed, i + 60) - 0.5) * w * 0.32;
      const oy = sy + bowlH * (0.18 + seeded(seed, i + 65) * 0.52);
      for (let j = 0; j < 2 + Math.floor(crack * 2); j++) {
        fillPx(ctx, ox + j * u, oy + j * u, u, u * 2, rgba(PASTEL.white, 0.42 + crack * 0.38));
      }
    }
  }
}

/** Argila — torrão modelável */
export function drawClay(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, wobble } = a;
  const x = cx - w / 2;
  const hop = Math.sin(wobble * 0.8) * u * 0.4;
  for (let row = 0; row < h; row += u) {
    const t = row / Math.max(1, h - u);
    const ww = w * (0.78 + Math.sin(t * 3 + seed) * 0.12);
    fillPx(ctx, cx - ww / 2 + hop * t, sy + row, ww, u, mat.fill);
  }
  for (let i = 0; i < 10; i++) {
    fillPx(
      ctx,
      x + seeded(seed, i) * w,
      sy + h * (0.2 + seeded(seed, i + 8) * 0.55),
      u,
      u,
      rgba(mat.particle, 0.45 + seeded(seed, i + 16) * 0.25),
    );
  }
  fillPx(ctx, x + u, sy + h - u, w - u * 2, u, rgba(mat.stroke, 0.45));
}

/** Seda — tecido com brilho suave */
export function drawSilk(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, time } = a;
  const x = cx - w / 2;
  fillPx(ctx, x, sy, w, h, mat.fill);
  for (let i = 0; i < w; i += u * 2) {
    const wave = Math.sin(time * 2.2 + i * 0.08) * u * 0.3;
    fillPx(ctx, x + i, sy + u + wave, u, h - u * 2, rgba(mat.stroke, 0.1 + (i % 4 === 0 ? 0.06 : 0)));
  }
  fillPx(ctx, cx - w * 0.35, sy + u, w * 0.7, h * 0.45, rgba('#FFFFFF', 0.1 + Math.sin(time * 1.8) * 0.04));
  for (let i = 0; i < 8; i++) {
    fillPx(
      ctx,
      x + u + seeded(seed, i + 70) * (w - u * 4),
      sy + u + seeded(seed, i + 80) * (h - u * 3),
      u,
      u,
      rgba(mat.particle, 0.3 + seeded(seed, i) * 0.2),
    );
  }
  fillPx(ctx, x, sy + h - u, w, u, mat.stroke);
}

/** Almofada com gatinhos — miam ao serem pisados */
export function drawKitten(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, time, wobble, overlay } = a;
  const press = overlay?.pressAmount ?? 0;
  drawKittenPlatform(
    ctx,
    u,
    seed,
    time,
    wobble,
    cx,
    sy,
    w,
    h,
    mat,
    press,
    overlay?.kittenMeowFlash ?? 0,
    overlay?.kittenMeowIdx ?? 0,
  );
}

function drawBarFlash(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  bw: number,
  barH: number,
  u: number,
  i: number,
  hitBar: number,
  barFlash: number,
): void {
  if (i !== hitBar || barFlash <= 0.05) return;
  fillPx(ctx, bx, by, bw, barH, rgba('#FFFFFF', 0.28 * barFlash));
  fillPx(ctx, bx, by - u * 2, bw, u * 2, rgba(PASTEL.butter, 0.55 * barFlash));
}

/** Kalimba — caixa de madeira com lâminas metálicas */
export function drawKalimba(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed } = a;
  const x = cx - w / 2;
  const press = a.overlay?.pressAmount ?? 0;
  const hitBar = a.overlay?.marimbaBarIndex ?? -1;
  const barFlash = a.overlay?.marimbaBarFlash ?? 0;
  const boxH = h * 0.42;
  fillPx(ctx, x + u, sy + h - boxH - u, w - u * 2, boxH, mat.fill);
  fillPx(ctx, x + u * 2, sy + h - boxH, w - u * 4, u, rgba('#FFFFFF', 0.14));
  fillPx(ctx, cx - u * 2, sy + h - boxH * 0.55, u * 4, u * 3, rgba(mat.stroke, 0.35));
  const tines = 5;
  for (let i = 0; i < tines; i++) {
    const tw = u * 1.4;
    const tx = x + u * 2 + (i / (tines - 1)) * (w - u * 5);
    const tineH = h * (0.38 + (i % 3) * 0.08) * (1 - press * 0.06);
    fillPx(ctx, tx, sy + h - boxH - tineH - u, tw, tineH, rgba(PASTEL.caramelDeep, 0.88));
    fillPx(ctx, tx, sy + h - boxH - tineH - u, tw, u, rgba('#FFFFFF', 0.35));
    if (seeded(seed, i + 40) > 0.5) {
      fillPx(ctx, tx + u * 0.2, sy + h - boxH - u * 2, u * 0.6, u, rgba(PASTEL.butter, 0.5));
    }
    drawBarFlash(ctx, tx, sy + h - boxH - tineH - u, tw, tineH, u, i, hitBar, barFlash);
  }
  fillPx(ctx, x, sy + h - u, w, u, mat.stroke);
}

const XYLO_COLORS = [PASTEL.coral, PASTEL.citrus, PASTEL.butter, PASTEL.mint, PASTEL.sky, PASTEL.lilac, PASTEL.rose, PASTEL.peach];

/** Xilofone — barras coloridas com ressonadores */
export function drawXylophone(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed } = a;
  const x = cx - w / 2;
  const press = a.overlay?.pressAmount ?? 0;
  const hitBar = a.overlay?.marimbaBarIndex ?? -1;
  const barFlash = a.overlay?.marimbaBarFlash ?? 0;
  fillPx(ctx, x, sy + h - u * 2, w, u * 2, mat.stroke);
  const bars = 8;
  for (let i = 0; i < bars; i++) {
    const bw = w / bars - u * 0.35;
    const bx = x + (i / bars) * w + u * 0.18;
    const barH = h * (0.42 + (i % 4) * 0.1) * (1 - press * 0.07);
    const color = XYLO_COLORS[i % XYLO_COLORS.length]!;
    fillPx(ctx, bx, sy + h - barH - u * 2, bw, barH, color);
    fillPx(ctx, bx, sy + h - barH - u * 2, bw, u, rgba('#FFFFFF', 0.28));
    fillPx(ctx, bx + bw * 0.25, sy + h - u * 2, bw * 0.5, u * 1.8, rgba(mat.particle, 0.55));
    if (seeded(seed, i + 50) > 0.65) {
      fillPx(ctx, bx + bw * 0.4, sy + h - barH - u * 3, u, u, rgba(mat.stroke, 0.3));
    }
    drawBarFlash(ctx, bx, sy + h - barH - u * 2, bw, barH, u, i, hitBar, barFlash);
  }
}

/** Bloco de madeira — taiko oco com veios */
export function drawWoodBlock(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, time, wobble } = a;
  const x = cx - w / 2;
  const press = a.overlay?.pressAmount ?? 0;
  const hitBar = a.overlay?.marimbaBarIndex ?? -1;
  const barFlash = a.overlay?.marimbaBarFlash ?? 0;
  fillPx(ctx, x, sy + h - u * 2, w, u * 2, rgba(mat.stroke, 0.65));
  const blocks = 4;
  for (let i = 0; i < blocks; i++) {
    const bw = w / blocks - u * 0.5;
    const bx = x + (i / blocks) * w + u * 0.25;
    const blockH = h * (0.5 + (i % 2) * 0.18 + Math.sin(time * 1.2 + wobble + i) * 0.015) * (1 - press * 0.05);
    fillPx(ctx, bx, sy + h - blockH - u, bw, blockH, i % 2 === 0 ? mat.fill : mat.particle);
    fillPx(ctx, bx + u, sy + h - blockH, bw - u * 2, u, rgba('#FFFFFF', 0.12));
    fillPx(ctx, bx + bw * 0.35, sy + h - blockH * 0.55, u, blockH * 0.35, rgba(mat.stroke, 0.22));
    fillPx(ctx, bx + bw * 0.15, sy + h - u * 2.5, bw * 0.7, u * 0.8, rgba(mat.stroke, 0.45));
    drawBarFlash(ctx, bx, sy + h - blockH - u, bw, blockH, u, i, hitBar, barFlash);
  }
}

/** Cogumelo — chapéu macio com esporos ao pisar */
export function drawMushroom(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, time, wobble } = a;
  const x = cx - w / 2;
  const press = a.overlay?.pressAmount ?? 0;
  const stemW = w * (0.26 - press * 0.04);
  const stemTop = sy + h * 0.38 + press * u * 2;
  fillPx(ctx, cx - stemW / 2, stemTop, stemW, h - (stemTop - sy), rgba('#F8F0E8', 0.96));
  fillPx(ctx, cx - stemW / 2, stemTop, stemW, u, rgba(mat.stroke, 0.3));
  fillPx(ctx, cx - u * 0.4, stemTop + u, u * 0.8, h * 0.35, rgba('#FFFFFF', 0.1));
  const capW = w * (0.98 - press * 0.12);
  const capH = h * (0.52 + Math.sin(time * 1.6 + wobble) * 0.02 - press * 0.06);
  fillPx(ctx, cx - capW / 2, stemTop - capH, capW, capH, mat.fill);
  fillPx(ctx, cx - capW * 0.38, stemTop - capH + u, capW * 0.76, u * 2, rgba('#FFFFFF', 0.2));
  for (let i = 0; i < 6; i++) {
    fillPx(
      ctx,
      cx - capW * 0.32 + seeded(seed, i + 90) * capW * 0.64,
      stemTop - capH + u + seeded(seed, i + 91) * capH * 0.55,
      u,
      u,
      rgba('#FFFFFF', 0.32 + (i % 2) * 0.12),
    );
  }
  if (press > 0.08) {
    for (let i = 0; i < 4; i++) {
      fillPx(
        ctx,
        cx - w * 0.3 + seeded(seed, i + 95) * w * 0.6,
        stemTop - u - i * u * 0.8,
        u,
        u,
        rgba(mat.particle, 0.45 * press),
      );
    }
  }
  fillPx(ctx, x, sy + h - u, w, u, mat.stroke);
}

/** Pipoca — balde com flores estouradas */
export function drawPopcorn(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, time, overlay } = a;
  const x = cx - w / 2;
  const press = overlay?.pressAmount ?? 0;
  const pop = Math.min(1, press * 2.5 + Math.sin(time * 6) * 0.08);
  fillPx(ctx, x + u, sy + h * 0.5, w - u * 2, h * 0.5 - u, rgba(mat.stroke, 0.55));
  fillPx(ctx, x + u * 1.5, sy + h * 0.52, w - u * 3, u, rgba('#FFFFFF', 0.12));
  for (let i = 0; i < 16; i++) {
    const px = x + u + seeded(seed, i + 100) * (w - u * 4);
    const baseY = sy + h * 0.22 + seeded(seed, i + 110) * h * 0.45;
    const py = baseY - pop * u * (1 + (i % 3));
    const pw = u * (1.8 + (i % 3) * 0.6 + pop * 0.4);
    fillPx(ctx, px, py, pw, pw, i % 3 === 0 ? mat.particle : mat.fill);
    fillPx(ctx, px + u * 0.25, py - u * 0.35, u * 0.8, u * 0.8, rgba('#FFFFFF', 0.58));
    if (pop > 0.35 && i % 4 === 0) {
      fillPx(ctx, px + pw * 0.3, py - u, u, u, rgba(PASTEL.butter, 0.65 * pop));
    }
  }
  fillPx(ctx, x, sy + h - u, w, u, mat.stroke);
}

/** Bambu — caules com folhas e balanço */
export function drawBamboo(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, time, wobble, seed } = a;
  const x = cx - w / 2;
  const sway = Math.sin(time * 1.4 + wobble) * u * 0.6;
  const segments = 3;
  const segH = (h - u) / segments;
  for (let s = 0; s < segments; s++) {
    const sy0 = sy + s * segH;
    const segSway = sway * (1 + s * 0.15);
    fillPx(ctx, x + u + segSway, sy0, w - u * 2, segH - u * 0.5, mat.fill);
    fillPx(ctx, x + u + segSway, sy0 + segH - u * 1.2, w - u * 2, u * 1.1, mat.stroke);
    fillPx(ctx, x + u * 2 + segSway, sy0 + u, u, segH - u * 2, rgba(mat.particle, 0.22 + (s % 2) * 0.12));
    if (s === segments - 1) {
      fillPx(ctx, cx + w * 0.28 + segSway, sy0 - u, u * 3, u * 1.5, rgba('#7AB858', 0.75));
      fillPx(ctx, cx - w * 0.1 + segSway, sy0 - u * 0.5, u * 2, u, rgba('#98C878', 0.65));
    }
  }
  if (seeded(seed, 12) > 0.4) {
    fillPx(ctx, cx - u, sy + u, u * 2, u, rgba(mat.particle, 0.35));
  }
  fillPx(ctx, x, sy + h - u, w, u, rgba(mat.stroke, 0.6));
}

/** Rolha — cilindro que comprime ao pisar */
export function drawCork(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed } = a;
  const press = a.overlay?.pressAmount ?? 0;
  const squeeze = 1 + press * 0.14;
  const squish = 1 - press * 0.08;
  const bw = (w - u * 2) * squeeze;
  const bh = (h - u * 2) * squish;
  const x = cx - bw / 2;
  const y = sy + u + (h - u * 2 - bh);
  fillPx(ctx, x, y, bw, bh, mat.fill);
  for (let i = 0; i < 5; i++) {
    fillPx(
      ctx,
      x + u + seeded(seed, i + 70) * (bw - u * 3),
      y + u + seeded(seed, i + 71) * (bh - u * 3),
      u,
      u,
      rgba(mat.particle, 0.28 + (i % 2) * 0.1),
    );
  }
  fillPx(ctx, cx - u, y + u, u * 2, bh - u * 2, rgba('#FFFFFF', 0.14));
  fillPx(ctx, x, y, bw, u, mat.stroke);
  fillPx(ctx, x, y + bh - u, bw, u, mat.stroke);
  if (press > 0.2) {
    fillPx(ctx, cx - u, sy, u * 2, u * 2, rgba(mat.particle, 0.5 * press));
  }
}

/** Concha — espiral com brilho perolado */
export function drawSeashell(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, time, wobble, seed } = a;
  const shimmer = Math.sin(time * 2.5 + wobble) * u * 0.4;
  fillPx(ctx, cx - w * 0.44, sy + h * 0.18, w * 0.88, h * 0.74, mat.fill);
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const ridgeW = w * (0.14 - t * 0.06);
    fillPx(
      ctx,
      cx - w * 0.38 + t * w * 0.58 + shimmer * 0.3,
      sy + h * (0.22 + t * 0.58),
      ridgeW,
      u,
      rgba(mat.particle, 0.38 - t * 0.04),
    );
  }
  fillPx(ctx, cx - u * 1.2, sy + h * 0.32, u * 2.4, h * 0.38, rgba('#FFFFFF', 0.24));
  fillPx(ctx, cx - u * 0.5 + shimmer, sy + h * 0.28, u, h * 0.12, rgba(PASTEL.blush, 0.35));
  for (let i = 0; i < 3; i++) {
    if (seeded(seed, i + 140) > 0.55) {
      fillPx(ctx, cx + (seeded(seed, i + 141) - 0.5) * w * 0.5, sy + h * 0.35 + i * u, u, u, rgba(PASTEL.white, 0.5));
    }
  }
  fillPx(ctx, cx - w / 2, sy + h - u, w, u, mat.stroke);
}

/** Macaron — duas metades com pés de merengue */
export function drawMacaron(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, overlay } = a;
  const x = cx - w / 2;
  const press = overlay?.pressAmount ?? 0;
  const crack = overlay?.crackLevel ?? 0;
  const r = h * (0.36 - press * 0.04);
  fillPx(ctx, x + u, sy + h - r - u, w - u * 2, r, mat.fill);
  for (let i = 0; i < 5; i++) {
    fillPx(ctx, x + u * 2 + i * ((w - u * 4) / 4), sy + h - u * 2.2, u, u * 1.2, rgba('#FFFFFF', 0.35));
  }
  fillPx(ctx, x + u, sy + h - u * 2 - press * u, w - u * 2, u * (1.2 + press * 0.5), mat.particle);
  fillPx(ctx, x + u, sy + h - r * 2 - u * 2 - press * u, w - u * 2, r, mat.fill);
  fillPx(ctx, x + u * 2, sy + h - r - u, w - u * 4, u, rgba('#FFFFFF', 0.22));
  if (crack > 0.05) {
    fillPx(ctx, cx - u, sy + h - r - u * 2, u * 2, u, rgba(mat.stroke, 0.35 * crack));
    fillPx(ctx, cx + u, sy + h - r * 1.5, u, u * 2, rgba(mat.stroke, 0.25 * crack));
  }
  fillPx(ctx, x, sy + h - u, w, u, mat.stroke);
}

/** Boba — copo com canudo e pérolas subindo */
export function drawBoba(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, time } = a;
  const x = cx - w / 2;
  fillPx(ctx, x + u, sy + u, w - u * 2, h - u * 2, mat.fill);
  fillPx(ctx, x + u * 2, sy + u * 2, w - u * 4, h * 0.12, rgba('#FFFFFF', 0.1));
  fillPx(ctx, x + w * 0.62, sy - u * 2, u * 1.5, h * 0.55, rgba(mat.particle, 0.85));
  fillPx(ctx, x + w * 0.6, sy - u * 3, u * 2, u, rgba(mat.particle, 0.7));
  for (let i = 0; i < 12; i++) {
    const bx = x + u * 2 + seeded(seed, i + 120) * (w - u * 5);
    const bob = Math.sin(time * 2.2 + i * 1.7 + seed * 0.01) * u * 0.5;
    const by = sy + h * 0.32 + ((time * 18 + i * 19 + seed) % (h * 0.52)) + bob;
    fillPx(ctx, bx, by, u * 1.6, u * 1.6, mat.particle);
    fillPx(ctx, bx + u * 0.35, by + u * 0.25, u * 0.55, u * 0.55, rgba('#FFFFFF', 0.4));
  }
  fillPx(ctx, x + u, sy + u * 2, u * 2, h - u * 4, rgba('#FFFFFF', 0.06));
  fillPx(ctx, x, sy + h - u, w, u, rgba(mat.particle, 0.85));
}

/** Pena — pluma levitando sobre base macia */
export function drawFeather(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, time, wobble } = a;
  const drift = Math.sin(time * 1.4 + wobble) * u * 1.2;
  const lift = Math.sin(time * 2.1 + wobble * 0.5) * u * 0.5;
  fillPx(ctx, cx - w * 0.42, sy + h - u * 2, w * 0.84, u * 2, rgba(mat.particle, 0.35));
  fillPx(ctx, cx - u, sy + u + lift + drift * 0.3, u * 2, h - u * 4, rgba(mat.stroke, 0.32));
  for (let i = 0; i < 8; i++) {
    const t = i / 7;
    const fw = w * (0.62 - t * 0.22);
    const fy = sy + u + t * (h - u * 5) + drift + lift;
    fillPx(ctx, cx - fw / 2, fy, fw, u, mat.fill);
    fillPx(ctx, cx - fw / 2 + u, fy, fw - u * 2, u, rgba('#FFFFFF', 0.18 - t * 0.04));
    if (i % 2 === 0) {
      fillPx(ctx, cx + fw * 0.22, fy - u * 0.3, u, u, rgba(PASTEL.lilac, 0.35));
    }
  }
  fillPx(ctx, cx - u * 1.5, sy + h - u, u * 3, u, rgba(mat.stroke, 0.4));
}

/** Pandeiro — disco dourado com platinelas */
export function drawTambourine(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, time, overlay } = a;
  const press = overlay?.pressAmount ?? 0;
  const rx = w * 0.44;
  const ry = h * 0.38 * (1 - press * 0.06);
  const cy = sy + h * 0.42;
  for (let row = -3; row <= 3; row++) {
    for (let col = -4; col <= 4; col++) {
      const nx = col / 4;
      const ny = row / 3;
      if (nx * nx + ny * ny > 1.05) continue;
      fillPx(ctx, cx + nx * rx - u, cy + ny * ry - u, u * 2, u * 2, mat.fill);
    }
  }
  fillPx(ctx, cx - rx + u, cy - ry + u, (rx - u) * 2, (ry - u) * 2, mat.particle);
  fillPx(ctx, cx - rx * 0.55, cy - ry * 0.4, rx * 1.1, u, rgba('#FFFFFF', 0.18));
  for (let i = 0; i < 10; i++) {
    const a0 = (i / 10) * Math.PI * 2 + time * 0.6;
    const jx = cx + Math.cos(a0) * rx * 0.82;
    const jy = cy + Math.sin(a0) * ry * 0.72;
    fillPx(ctx, jx - u / 2, jy - u / 2, u, u, rgba(PASTEL.butter, 0.8));
    fillPx(ctx, jx, jy - u, u * 0.5, u * 0.5, rgba('#FFFFFF', 0.55));
  }
  fillPx(ctx, cx - u, cy + ry - u, u * 2, u, mat.stroke);
}
