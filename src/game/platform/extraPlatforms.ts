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

/** Garrafa PET — cilindro translúcido com rótulo */
export function drawPlasticBottle(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed } = a;
  const x = cx - w / 2;
  const body = mat.fill;
  const label = rgba(mat.particle, 0.55);

  fillPx(ctx, x + u * 2, sy + u * 2, w - u * 4, h - u * 2, body);
  fillPx(ctx, x + u, sy + u * 3, w - u * 2, h - u * 4, rgba(body, 0.85));
  fillPx(ctx, cx - u * 2, sy - u * 3, u * 4, u * 3, body);
  fillPx(ctx, cx - u, sy - u * 5, u * 2, u * 2, rgba(body, 0.9));
  fillPx(ctx, cx - u * 0.5, sy - u * 6, u, u * 2, mat.stroke);
  fillPx(ctx, x + u * 3, sy + h * 0.35, w - u * 6, h * 0.35, label);
  fillPx(ctx, x + u * 4, sy + h * 0.42, w - u * 8, u, rgba('#FFFFFF', 0.45));
  fillPx(ctx, x + u * 2, sy + u, u, h - u * 2, rgba('#FFFFFF', 0.22));
  fillPx(ctx, x + w - u * 3, sy + u, u, h - u * 2, rgba(mat.stroke, 0.25));
  fillPx(ctx, cx + w * 0.28, sy + u * 2, u, u * 2, rgba('#FFFFFF', 0.35));
  for (let i = 0; i < 5; i++) {
    fillPx(ctx, x + u * 3 + seeded(seed, i) * (w - u * 8), sy + u * 4 + i * u, u, u, rgba('#FFFFFF', 0.18));
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

/** Nuvem — puff etéreo */
export function drawCloud(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, time, wobble } = a;
  const press = a.overlay?.pressAmount ?? 0;
  const lumps = 5;
  for (let i = 0; i < lumps; i++) {
    const lx = cx + (i - lumps / 2) * w * 0.22 + Math.sin(time * 1.8 + i + wobble) * u;
    const lh = h * (0.55 + (i % 3) * 0.12) * (1 - press * 0.2);
    fillPx(ctx, lx - w * 0.22, sy + h - lh, w * 0.44, lh, mat.fill);
  }
  fillPx(ctx, cx - w * 0.38, sy + h * 0.35, w * 0.76, h * 0.5, mat.fill);
  fillPx(ctx, cx - w * 0.28, sy + h * 0.15, w * 0.56, u * 2, rgba('#FFFFFF', 0.65));
  for (let i = 0; i < 4; i++) {
    fillPx(
      ctx,
      cx + (seeded(a.seed, i + 40) - 0.5) * w * 0.5,
      sy + u + i * u * 0.5,
      u * 2,
      u,
      rgba('#FFFFFF', 0.35),
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

/** Cristal — facetas translúcidas */
export function drawCrystal(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, time, wobble, seed } = a;
  const x = cx - w / 2;
  const shimmer = Math.sin(time * 3.5 + wobble) * u;
  fillPx(ctx, x + u * 2, sy + h * 0.25, w - u * 4, h * 0.75, rgba(mat.fill, 0.72));
  fillPx(ctx, cx - u * 2 + shimmer, sy + u, u * 4, h - u * 2, rgba(mat.particle, 0.55));
  fillPx(ctx, cx - w * 0.35, sy + u * 2, w * 0.7, h * 0.55, mat.fill);
  fillPx(ctx, cx - u + shimmer, sy + u, u * 2, h * 0.4, rgba('#FFFFFF', 0.45));
  for (let i = 0; i < 5; i++) {
    const fx = x + u * 3 + seeded(seed, i) * (w - u * 6);
    const fy = sy + u * 2 + seeded(seed, i + 5) * (h - u * 5);
    fillPx(ctx, fx, fy, u, u * (2 + (i % 2)), rgba(PASTEL.white, 0.35 + Math.sin(time * 4 + i) * 0.15));
  }
  fillPx(ctx, x + u, sy + h - u, w - u * 2, u, rgba(mat.stroke, 0.4));
}

/** Cerâmica — prato esmaltado */
export function drawCeramic(a: ExtraDrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed } = a;
  const x = cx - w / 2;
  const press = a.overlay?.pressAmount ?? 0;
  fillPx(ctx, x + u, sy + h * 0.35, w - u * 2, h * 0.65, mat.fill);
  fillPx(ctx, x, sy + h * 0.5, w, h * 0.5, rgba(mat.particle, 0.65));
  fillPx(ctx, x + u * 2, sy + h * 0.42, w - u * 4, u * 2, rgba('#FFFFFF', 0.35));
  for (let i = 0; i < 6; i++) {
    fillPx(
      ctx,
      x + u * 2 + seeded(seed, i) * (w - u * 6),
      sy + h * 0.48 + (i % 2) * u,
      u * 2,
      u,
      rgba(mat.stroke, 0.22 + press * 0.15),
    );
  }
  fillPx(ctx, cx - w * 0.28, sy + h * 0.55, w * 0.56, u, rgba(mat.stroke, 0.3));
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
