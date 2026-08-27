import type { MaterialDef, MaterialId } from '../../audio/materials';
import { PASTEL, materialDetailStroke, rgba } from '../../theme/pastelPalette';
import { PIXEL, fillPx, px } from '../../theme/pixel';
import { MATERIAL_LEDGE } from './ledgeSizes';
import type { PlatformBehavior } from './behaviors';
import { scaledCount, type PlatformPersonality } from './platformPersonality';
import { drawVariantAccent, getVariantScale } from './platformVariantAccent';
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
  personality?: PlatformPersonality;
}

function parseTone(c: string): [number, number, number] {
  if (c.startsWith('#')) {
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) return [+m[1], +m[2], +m[3]];
  return [200, 200, 200];
}

function shiftTone(color: string, shift: number): string {
  const [r, g, b] = parseTone(color);
  const a = shift * 32;
  const rr = Math.max(0, Math.min(255, Math.round(r + a)));
  const rg = Math.max(0, Math.min(255, Math.round(g + a * 0.92)));
  const rb = Math.max(0, Math.min(255, Math.round(b + a * 0.78)));
  return `#${[rr, rg, rb].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function softShadow(mat: MaterialDef, alpha = 0.22): string {
  return rgba(mat.fill, alpha);
}

function tonedMat(mat: MaterialDef, shift: number): MaterialDef {
  const fill = Math.abs(shift) < 0.01 ? mat.fill : shiftTone(mat.fill, shift);
  return {
    ...mat,
    fill,
    stroke: materialDetailStroke(fill),
    particle: Math.abs(shift) < 0.01 ? mat.particle : shiftTone(mat.particle, shift * 0.7),
    glow: mat.glow,
  };
}

/**
 * Each material = unique silhouette + palette + micro-animation.
 * Still a walkable platform, but instantly readable as the item.
 */
export function renderPixelPlatform(
  ctx: CanvasRenderingContext2D,
  material: MaterialId,
  variant: PlatformVariant,
  mat: MaterialDef,
  s: PlatformDrawState,
  overlay?: PixelPlatformOverlay,
): void {
  const u = PIXEL.unit;
  const melt = overlay?.meltProgress ?? 0;
  const integrity = overlay?.integrity ?? 1;
  const personality = overlay?.personality;
  const ledge = MATERIAL_LEDGE[material];
  const vScale = getVariantScale(variant);
  const pW = personality?.widthStretch ?? 1;
  const pH = personality?.heightStretch ?? 1;
  const cx = s.cx;
  const sy = s.surfaceY;
  const w = Math.max(
    u * 10,
    px(s.w * ledge.visualSpread * vScale.wMul * pW * (1 + melt * 0.3)),
  );
  const h = Math.max(
    u * 4,
    px(
      s.h *
        ledge.visualDepth *
        vScale.hMul *
        pH *
        (1.4 + (1 - Math.max(0.2, s.squashY)) * 0.45) *
        Math.max(0.35, integrity),
    ),
  );

  ctx.save();
  ctx.globalAlpha = s.opacity;
  ctx.imageSmoothingEnabled = false;

  const matT = tonedMat(mat, personality?.toneShift ?? 0);
  const shadowA = personality ? 0.18 + Math.abs(personality.toneShift) * 0.08 : 0.14;
  fillPx(ctx, cx - w * 0.42, sy + h - u, w * 0.84, u * 2, softShadow(matT, shadowA));

  const args = {
    ctx,
    cx,
    sy,
    w,
    h,
    mat: matT,
    u,
    seed: s.seed,
    time: s.time,
    wobble: s.wobble,
    overlay,
    melt,
    personality,
  };

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
    case 'marshmallow':
      drawMarshmallow(args);
      break;
    case 'sponge':
      drawSponge(args);
      break;
    case 'soapBubble':
      drawSoapBubble(args);
      break;
    case 'bathFoam':
      drawBathFoam(args);
      break;
    case 'lavenderSoap':
      drawLavenderSoap(args);
      break;
    case 'creamSoap':
      drawCreamSoap(args);
      break;
    case 'keyboard':
      drawKeyboard(args);
      break;
    case 'bubbleWrap':
      drawBubbleWrap(args);
      break;
    default:
      drawButter(args);
  }

  drawVariantAccent(args, variant);
  drawPersonalitySurfaceMark(args);
  drawPersonalityTopProfile(args);

  drawShelfFrontFace(args);
  drawHangingDetails(args);
  drawRelaxSparkles(args);

  // Shared crack overlay for shatter materials
  const crack = overlay?.crackLevel ?? 0;
  if (
    crack > 0.05 &&
    (material === 'glycerin' ||
      material === 'iceSoap' ||
      material === 'chocolate' ||
      material === 'lavenderSoap' ||
      material === 'creamSoap')
  ) {
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
  personality?: PlatformPersonality;
};

/** Marca superficial única por seed — cada prateleira ganha um detalhe diferente */
function drawPersonalitySurfaceMark(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, u, mat, seed, time, personality } = a;
  if (!personality) return;
  const x = cx - w / 2;
  const mark = personality.surfaceMark;
  const n = 2 + personality.ornamentExtra;

  switch (mark) {
    case 0: {
      for (let i = 0; i < n; i++) {
        fillPx(
          ctx,
          x + u * 2 + seeded(seed, i + 700) * (w - u * 4),
          sy + u * 2 + seeded(seed, i + 710) * (h - u * 4),
          u,
          u,
          rgba(mat.particle, 0.55 + seeded(seed, i + 720) * 0.3),
        );
      }
      break;
    }
    case 1: {
      const side = personality.edgeBias > 0 ? 1 : -1;
      fillPx(ctx, cx + side * w * 0.38, sy + h * 0.35, u * 2, u * 2, rgba(PASTEL.white, 0.45));
      fillPx(ctx, cx + side * w * 0.36, sy + h * 0.38, u, u, mat.particle);
      break;
    }
    case 2: {
      for (let i = 0; i < n + 1; i++) {
        fillPx(
          ctx,
          x + u + i * ((w - u * 2) / (n + 1)),
          sy + h * 0.45,
          u,
          u * 2,
          rgba(mat.stroke, 0.35),
        );
      }
      break;
    }
    case 3: {
      if (Math.sin(time * 2.5 + seed) > 0) {
        fillPx(ctx, cx - u, sy - u * 2, u * 2, u, rgba(PASTEL.white, 0.65));
        fillPx(ctx, cx, sy - u * 3, u, u, mat.particle);
      }
      break;
    }
    case 4: {
      const ly = sy + h * (0.3 + seeded(seed, 730) * 0.35);
      fillPx(ctx, cx - w * 0.28, ly, w * 0.56, u, rgba(mat.particle, 0.5));
      fillPx(ctx, cx - u * 2, ly - u, u * 4, u, rgba(PASTEL.white, 0.35));
      break;
    }
    case 5: {
      drawBubbleRing(ctx, cx + (seeded(seed, 740) - 0.5) * w * 0.5, sy + h * 0.4, u * 2, u, rgba(mat.particle, 0.6));
      if (seeded(seed, 741) > 0.45) {
        drawBubbleRing(ctx, cx + (seeded(seed, 742) - 0.5) * w * 0.4, sy + h * 0.55, u * 2, u, rgba(mat.fill, 0.55));
      }
      break;
    }
  }
}

/** Perfil de topo exclusivo — domo, dentes, inclinado ou ondulado */
function drawPersonalityTopProfile(a: DrawArgs): void {
  const { ctx, cx, sy, w, u, mat, wobble, personality } = a;
  if (!personality) return;
  const lean = personality.lean;
  const x = cx - w / 2 + lean * w * 0.08;

  switch (personality.topProfile) {
    case 1: {
      for (let i = 0; i < 4; i++) {
        const tw = w * (0.5 + i * 0.1);
        fillPx(ctx, cx - tw / 2 + lean * u * i, sy - u * (i + 1), tw, u, rgba(mat.fill, 0.9 - i * 0.1));
      }
      break;
    }
    case 2: {
      for (let i = 0; i < 5; i++) {
        const px0 = x + (i / 4) * (w - u * 2);
        const ph = u * (2 + (i % 2));
        fillPx(ctx, px0, sy - ph, u * 2, ph, mat.fill);
      }
      break;
    }
    case 3: {
      for (let i = 0; i < 6; i++) {
        const wave = Math.sin(wobble + i * 0.9) * u;
        fillPx(ctx, x + (i / 5) * w, sy - u + wave, u * 2, u, rgba(mat.particle, 0.55));
      }
      break;
    }
    default:
      if (Math.abs(lean) > 0.06) {
        fillPx(ctx, cx + lean * w * 0.35, sy - u, u * 2, u, rgba(PASTEL.white, 0.35));
      }
      break;
  }
}

/** Front lip + under-shelf shadow for depth */
function drawShelfFrontFace(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, u, mat, personality } = a;
  const lip = u * (2 + (personality?.lipDepth ?? 1) * 1.5);
  const x = cx - w / 2;
  fillPx(ctx, x, sy + h - lip, w, lip, rgba(mat.fill, 0.72));
  fillPx(ctx, x + u, sy + h - lip + u * 0.5, w - u * 2, u, rgba(mat.particle, 0.55));
  fillPx(ctx, x, sy + h, w, u, softShadow(mat, 0.14));
}

/** Penduricalhos únicos por prateleira */
function drawHangingDetails(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, u, mat, seed, time, wobble, personality } = a;
  if (!personality) return;

  const count = personality.hangCount;
  const style = personality.hangStyle;
  const lenMul = personality.hangLength;
  const bias = personality.edgeBias;

  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count + bias * 0.08 * (seeded(seed, i + 300) - 0.5);
    const hx = cx - w * 0.42 + t * w * 0.84;
    const sway = Math.sin(time * 2.2 + wobble + personality.wobblePhase + i * 1.4) * u * 1.8;
    const baseY = sy + h + u;
    const strandLen = u * (3 + Math.floor(seeded(seed, i + 310) * 5) * lenMul);

    switch (style) {
      case 0: {
        // Gotas penduradas
        fillPx(ctx, hx + sway - u / 2, baseY, u, strandLen, mat.particle);
        fillPx(ctx, hx + sway - u, baseY + strandLen - u, u * 2, u * 2, mat.fill);
        if (Math.sin(time * 3 + i) > 0.2) {
          fillPx(ctx, hx + sway, baseY + strandLen + u, u, u, rgba(mat.particle, 0.65));
        }
        break;
      }
      case 1: {
        // Fios elásticos (chiclete / slime)
        const pull = Math.sin(wobble * 1.5 + i) * u;
        fillPx(ctx, hx + sway, baseY, u, strandLen + pull, mat.particle);
        fillPx(ctx, hx + sway - u, baseY + strandLen + pull, u * 2, u, rgba(mat.particle, 0.7));
        fillPx(ctx, hx + sway - u * 0.5, baseY + strandLen + pull + u, u, u, mat.fill);
        break;
      }
      case 2: {
        // Gotas suaves (sem migalhas)
        fillPx(ctx, hx + sway - u / 2, baseY, u, strandLen, mat.particle);
        fillPx(ctx, hx + sway - u, baseY + strandLen - u, u * 2, u * 2, mat.fill);
        break;
      }
      case 3: {
        // Bolhinhas
        const by = baseY + Math.sin(time * 1.8 + i) * u;
        fillPx(ctx, hx + sway - u, by, u * 3, u * 3, rgba(mat.particle, 0.55));
        fillPx(ctx, hx + sway, by + u, u, u, rgba(PASTEL.white, 0.65));
        fillPx(ctx, hx + sway - u / 2, by + u * 3, u, u * 2, rgba(mat.particle, 0.4));
        break;
      }
      case 4: {
        // Pontas de espuma / nuvem
        for (let row = 0; row < 3; row++) {
          const tw = u * (2 + row);
          fillPx(ctx, hx + sway - tw / 2, baseY + row * u, tw, u, row === 0 ? PASTEL.white : mat.fill);
        }
        fillPx(ctx, hx + sway - u, baseY - u, u * 2, u, rgba(PASTEL.white, 0.5));
        break;
      }
    }
  }
}

/** Partículas relaxantes bem visíveis ao redor da prateleira */
function drawRelaxSparkles(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, u, mat, seed, time, wobble, personality } = a;
  const mul = personality?.sparkleMul ?? 1;
  const count = scaledCount(14, mul, 8);

  for (let i = 0; i < count; i++) {
    const phase = time * 2.8 + i * 1.7 + wobble + (personality?.wobblePhase ?? 0);
    const vis = 0.45 + (Math.sin(phase) + 1) * 0.28;
    if (vis < 0.35) continue;

    const side = seeded(seed, i + 400) > 0.5 ? 1 : -1;
    const fx = cx + (seeded(seed, i + 410) - 0.5) * w * 1.2 + side * u * 2;
    const drift = Math.sin(phase * 0.7) * u * 2.5;
    const fy = sy - u * 2 - seeded(seed, i + 420) * h * 0.5 + drift;
    const sz = u * (1 + (i % 3 === 0 ? 1 : 0));

    fillPx(ctx, fx, fy, sz, sz, rgba(mat.particle, vis));
    if (Math.sin(phase * 1.3) > 0.15) {
      fillPx(ctx, fx + side * u, fy - u, u, u, rgba(PASTEL.white, vis * 0.85));
    }
  }
}

function seeded(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** Static debris chips at base — disabled (sem migalhas escuras nas bordas) */
function drawDebris(_a: DrawArgs, _count: number, _color: string): void {}

/** Side flecks / rim crumbs — disabled */
function drawEdgeFlecks(_a: DrawArgs, _count: number, _color: string): void {}

/** Dense surface microdots — disabled */
function drawSurfaceGrain(_a: DrawArgs, _count: number, _color: string, _alpha = 0.4): void {}

/** Twinkling floaters around the platform (idle juice) */
function drawAmbientSpecks(a: DrawArgs, count: number, color: string): void {
  const { ctx, cx, sy, w, h, u, seed, time, wobble, personality } = a;
  const n = scaledCount(count, personality?.sparkleMul ?? 1, Math.max(5, count - 2));
  for (let i = 0; i < n; i++) {
    const phase = time * 3.6 + i * 2.1 + wobble + (personality?.wobblePhase ?? 0);
    if (Math.sin(phase) < -0.45) continue;
    const fx = cx + (seeded(seed, i + 70) - 0.5) * w * 1.25;
    const fy = sy - u * 2 - seeded(seed, i + 80) * h * 0.85 + Math.sin(phase * 1.5) * u * 2.2;
    const alpha = 0.55 + seeded(seed, i + 90) * 0.42;
    fillPx(ctx, fx, fy, u, u, rgba(color, alpha));
    if (Math.sin(phase * 1.7) > 0.35) {
      fillPx(ctx, fx + u, fy - u, u, u, rgba(PASTEL.white, 0.72));
      fillPx(ctx, fx - u * 0.5, fy + u * 0.5, u, u, rgba(color, alpha * 0.65));
    }
  }
}

/** Press splash crumbs around feet */
function drawPressSplash(a: DrawArgs, color: string): void {
  const press = a.overlay?.pressAmount ?? 0;
  if (press < 0.12) return;
  const { ctx, cx, sy, w, u, seed, time } = a;
  const n = 3 + Math.floor(press * 6);
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI - Math.PI / 2;
    const r = w * (0.18 + press * 0.2) + Math.sin(time * 6 + i) * u;
    fillPx(
      ctx,
      cx + Math.cos(ang) * r,
      sy - u + Math.sin(ang) * r * 0.35,
      u,
      u,
      rgba(color, 0.35 + press * 0.35),
    );
    if (seeded(seed, i + 150) > 0.5) {
      fillPx(ctx, cx + Math.cos(ang) * r * 1.25, sy + Math.sin(ang) * u, u, u, rgba(color, 0.45));
    }
  }
}

/** Footprint / press indent on top surface */
function drawPressIndent(a: DrawArgs): void {
  const press = a.overlay?.pressAmount ?? 0;
  if (press < 0.06) return;
  const { ctx, cx, sy, w, u, mat } = a;
  const indentW = w * (0.22 + press * 0.14);
  const depth = u * (1 + Math.floor(press * 3.5));
  fillPx(ctx, cx - indentW / 2, sy, indentW, depth, rgba(mat.stroke, 0.28 + press * 0.25));
  fillPx(ctx, cx - indentW * 0.35, sy + depth, u * 2, u, rgba(mat.particle, 0.45));
  fillPx(ctx, cx + indentW * 0.2, sy + depth, u, u, rgba(mat.particle, 0.4));
  fillPx(ctx, cx - indentW * 0.1, sy + depth + u, u, u, rgba(mat.particle, 0.3));
  drawPressSplash(a, mat.particle);
}

/** Animated drip strand from bottom edge */
function drawIdleDrip(a: DrawArgs, color: string, phase = 0): void {
  const { ctx, cx, sy, w, h, u, time, melt, personality } = a;
  const press = a.overlay?.pressAmount ?? 0;
  const dripMul = personality?.dripMul ?? 1;
  const pulse = 0.5 + Math.sin(time * 4.5 + phase + (personality?.wobblePhase ?? 0)) * 0.5;
  const len = u * (2 + Math.floor((melt + pulse * 0.4 + press * 0.5) * 5 * dripMul));
  const ox = cx + w * (0.08 + phase * 0.16) + (personality?.edgeBias ?? 0) * u * 2;
  fillPx(ctx, ox - u / 2, sy + h - u, u, len, color);
  fillPx(ctx, ox - u, sy + h - u + len, u * 2, u, color);
  fillPx(ctx, ox - u * 0.5, sy + h + len, u, u, rgba(color, 0.75));
  if (pulse > 0.55) {
    fillPx(ctx, ox, sy + h + len + u, u, u, rgba(color, 0.7));
  }
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

/** Soft highlight shimmer band that slides */
function drawShimmerBand(a: DrawArgs, yOff = 1): void {
  const { ctx, cx, sy, u, time, wobble } = a;
  const slide = Math.sin(time * 2.4 + wobble) * u * 3;
  fillPx(ctx, cx - u * 4 + slide, sy + u * yOff, u * 6, u, rgba(PASTEL.white, 0.4));
  fillPx(ctx, cx - u * 2 + slide * 0.6, sy + u * (yOff + 1), u * 3, u, rgba(PASTEL.white, 0.25));
}

/** Gelatina — topo ondulado, bolhas, wobble sheen */
function drawJelly(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, wobble, seed, time } = a;
  const x = cx - w / 2;
  const press = a.overlay?.pressAmount ?? 0;

  for (let row = 0; row < h; row += u) {
    const t = row / h;
    const waveW = w * (0.92 + Math.sin(t * 4 + wobble) * 0.08);
    const ox = Math.sin(wobble + t * 2) * u + press * u * t * 0.4;
    fillPx(ctx, cx - waveW / 2 + ox, sy + row, waveW, u, mat.fill);
  }
  for (let i = 0; i < 7; i++) {
    const bx = x + u + (i / 6) * (w - u * 2);
    const lip = sy - u * (1 + (i % 3)) + Math.sin(wobble + i) * u * 0.5;
    fillPx(ctx, bx, lip, u * 3, u * 2, mat.fill);
  }
  for (let i = 0; i < 14; i++) {
    const bx = x + u * 2 + seeded(seed, i) * (w - u * 8);
    const by = sy + u * 2 + seeded(seed, i + 3) * (h - u * 5);
    const br = u * (2 + Math.floor(seeded(seed, i + 6) * 2));
    const bob = Math.sin(time * 2.5 + i) * u * 0.4;
    drawBubbleRing(ctx, bx, by + bob, br, u, rgba(mat.particle, 0.65));
    if (i % 2 === 0) fillPx(ctx, bx + u, by + bob + u, u, u, rgba(PASTEL.white, 0.7));
  }
  for (let i = 0; i < 8; i++) {
    if (Math.sin(time * 2.2 + i + seed) > 0) {
      fillPx(
        ctx,
        x + u * 3 + seeded(seed, i + 12) * (w - u * 8),
        sy + u + seeded(seed, i + 15) * (h * 0.55),
        u,
        u,
        rgba(mat.particle, 0.55),
      );
    }
  }
  drawShimmerBand(a, 1);
  fillPx(ctx, x, sy + u, u, h - u * 2, mat.stroke);
  fillPx(ctx, x + w - u, sy + u, u, h - u * 2, mat.stroke);
  fillPx(ctx, x + u, sy + h - u, w - u * 2, u, mat.stroke);

  drawPressIndent(a);
  drawIdleDrip(a, mat.particle, 0);
  drawIdleDrip(a, mat.particle, 1.2);
  drawIdleDrip(a, mat.particle, 2.4);
  drawSurfaceGrain(a, 10, mat.particle, 0.25);
  drawEdgeFlecks(a, 6, mat.particle);
  drawDebris(a, 5, mat.particle);
  drawAmbientSpecks(a, 8, mat.particle);
}

/** Manteiga — laje larga, cantos retos, marcas de faca, derrete */
function drawButter(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, melt, seed, time, wobble } = a;
  const x = cx - w / 2;
  const press = a.overlay?.pressAmount ?? 0;

  fillPx(ctx, x, sy, w, h, mat.fill);
  fillPx(ctx, x, sy, w, u, rgba(PASTEL.white, 0.55));
  fillPx(ctx, x, sy + h - u, w, u, mat.stroke);
  fillPx(ctx, x, sy, u, h, mat.stroke);
  fillPx(ctx, x + w - u, sy, u, h, mat.stroke);
  for (let i = 0; i < 7; i++) {
    const gy = sy + u * (1.2 + i * 1.6);
    fillPx(ctx, x + u * 3, gy, w - u * 6, u, rgba(mat.stroke, 0.45));
    if (Math.sin(time * 2.4 + i + wobble) > -0.2) {
      fillPx(ctx, x + u * 5, gy, w - u * 10, u, rgba(mat.particle, 0.4));
    }
  }
  for (let i = 0; i < 14; i++) {
    fillPx(
      ctx,
      x + u * 2 + seeded(seed, i + 2) * (w - u * 6),
      sy + u * 2 + seeded(seed, i + 12) * (h - u * 4),
      u,
      u,
      rgba(mat.particle, 0.45 + seeded(seed, i) * 0.35),
    );
  }
  // Soft curl edge crumbs when pressed
  if (press > 0.15) {
    for (let i = 0; i < 3 + Math.floor(press * 4); i++) {
      fillPx(ctx, x + seeded(seed, i + 200) * w, sy + h - u, u * 2, u * (1 + press * 2), mat.fill);
    }
  }
  drawShimmerBand(a, 0);
  drawPressIndent(a);
  if (melt > 0.05) {
    const pw = w * (1 + melt * 0.45);
    fillPx(ctx, cx - pw / 2, sy + h - u, pw, u * (1 + Math.floor(melt * 3)), mat.fill);
    for (let i = 0; i < 4 + Math.floor(melt * 6); i++) {
      fillPx(
        ctx,
        cx + (seeded(seed, i) - 0.5) * pw * 0.9,
        sy + h,
        u * 2,
        u * (2 + Math.floor(melt * 4)),
        mat.fill,
      );
    }
  }
  drawIdleDrip(a, mat.particle, 0.8);
  drawSurfaceGrain(a, 8, mat.stroke, 0.2);
  drawEdgeFlecks(a, 6, mat.particle);
  drawDebris(a, 6, mat.particle);
  drawAmbientSpecks(a, 6, mat.particle);
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
  for (let i = 0; i < 16; i++) {
    fillPx(
      ctx,
      x + seeded(seed, i + 20) * w,
      sy + u + seeded(seed, i + 25) * (h - u * 2) + hop,
      u,
      u,
      rgba(mat.stroke, 0.28),
    );
  }
  const holes = [
    [0.25, 0.35, 3],
    [0.55, 0.25, 4],
    [0.72, 0.5, 3],
    [0.4, 0.6, 2],
    [0.15, 0.55, 2],
    [0.62, 0.68, 2],
  ] as const;
  for (let i = 0; i < holes.length; i++) {
    const [nx, ny, r] = holes[i];
    const hx = x + w * nx + (seeded(seed, i) - 0.5) * u * 2;
    const hy = sy + h * ny + hop;
    fillPx(ctx, hx, hy, u * r, u * r, '#F7E8C8');
    fillPx(ctx, hx + u, hy + u, u * Math.max(1, r - 1), u * Math.max(1, r - 1), rgba(mat.stroke, 0.35));
    // Hole rim crumb
    fillPx(ctx, hx - u, hy + u, u, u, rgba(mat.particle, 0.5));
  }
  const puff = Math.sin(time * 2.5 + wobble) * u;
  for (let i = 0; i < 8; i++) {
    fillPx(
      ctx,
      cx - w * 0.25 + i * u * 1.8 + puff,
      sy - u * 2 + Math.sin(time * 1.5 + i) * u * 0.7,
      u,
      u,
      rgba(mat.particle, 0.35 + i * 0.06),
    );
  }
  drawPressIndent(a);
  drawSurfaceGrain(a, 8, '#F7E8C8', 0.35);
  drawEdgeFlecks(a, 5, mat.particle);
  drawDebris(a, 6, mat.particle);
  drawAmbientSpecks(a, 8, mat.particle);
}

/** Chocolate — barra com sulcos de tablete */
function drawChocolate(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, melt, seed, time } = a;
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
  for (let i = 0; i < 10; i++) {
    fillPx(
      ctx,
      x + u * 3 + (i % 5) * (w / 5.5) + seeded(seed, i) * u,
      sy + u * 2 + Math.floor(i / 5) * (h * 0.4),
      u,
      u,
      rgba(mat.particle, 0.5),
    );
  }
  // Specular glitter on top
  if (Math.sin(time * 3 + seed) > 0) {
    fillPx(ctx, cx + w * 0.1, sy + u * 2, u * 2, u, rgba(PASTEL.white, 0.45));
  }
  fillPx(ctx, x + u, sy + h - u, w - u * 2, u, mat.stroke);
  drawShimmerBand(a, 1);
  drawPressIndent(a);
  if (melt > 0.1) {
    for (let i = 0; i < 6; i++) {
      fillPx(ctx, x + u * 2 + i * (w / 6), sy + h - u, u * 2, u * (2 + Math.floor(melt * 3)), mat.fill);
    }
  }
  drawIdleDrip(a, mat.particle, 0.3);
  drawIdleDrip(a, mat.particle, 1.6);
  drawSurfaceGrain(a, 8, mat.stroke, 0.22);
  drawEdgeFlecks(a, 5, mat.particle);
  drawDebris(a, 5, mat.particle);
  drawAmbientSpecks(a, 5, mat.particle);
}

/** Cítrico — cunha / meia-lua com casca e polpa */
function drawCitrus(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, time, wobble } = a;
  const x = cx - w / 2;
  const press = a.overlay?.pressAmount ?? 0;
  for (let row = 0; row < h; row += u) {
    const t = row / Math.max(1, h - u);
    const ww = w * (0.45 + t * 0.55);
    fillPx(ctx, cx - ww / 2, sy + row, ww, u, mat.fill);
  }
  fillPx(ctx, x + w * 0.15, sy, w * 0.7, u, PASTEL.white);
  fillPx(ctx, x + w * 0.18, sy + u, w * 0.64, u, rgba(PASTEL.white, 0.45));
  fillPx(ctx, x + w * 0.05, sy + h - u * 2, w * 0.9, u * 2, mat.stroke);
  for (let i = 0; i < 10; i++) {
    fillPx(
      ctx,
      x + w * 0.08 + seeded(seed, i + 30) * w * 0.84,
      sy + h - u * 3 + seeded(seed, i + 35) * u * 2,
      u,
      u,
      rgba(mat.stroke, 0.55),
    );
  }
  for (let i = 0; i < 7; i++) {
    fillPx(ctx, cx - u / 2 + (i - 3) * u * 2.2, sy + u * 2, u, h - u * 4, rgba(PASTEL.white, 0.4));
  }
  const pulse = 1 + Math.sin(time * 5 + wobble) * 0.35;
  fillPx(ctx, cx - u * pulse, sy + h * 0.35, u * 2 * pulse, u * 2 * pulse, PASTEL.white);
  fillPx(ctx, cx - u / 2, sy + h * 0.4, u, u, mat.particle);
  // Juice beads when pressed
  if (press > 0.1) {
    for (let i = 0; i < 2 + Math.floor(press * 4); i++) {
      fillPx(
        ctx,
        cx + (seeded(seed, i + 210) - 0.5) * w * 0.5,
        sy - u * (1 + i % 3),
        u,
        u,
        mat.particle,
      );
    }
  }
  drawPressIndent(a);
  drawSurfaceGrain(a, 6, PASTEL.white, 0.3);
  drawEdgeFlecks(a, 6, mat.particle);
  drawDebris(a, 6, mat.particle);
  drawAmbientSpecks(a, 7, mat.particle);
}

/** Mel — borda dentada hex + células */
function drawHoney(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, melt, seed, time } = a;
  const x = cx - w / 2;
  for (let i = 0; i < 7; i++) {
    const bx = x + (i / 6) * (w - u * 4);
    fillPx(ctx, bx, sy - u * (i % 2 === 0 ? 2 : 1), u * 4, h + u * 2, mat.fill);
  }
  fillPx(ctx, x, sy + u, w, h - u, mat.fill);
  for (let i = 0; i < 18; i++) {
    const hx = x + u * 2 + (i % 6) * (w / 6.5);
    const hy = sy + u * 2 + Math.floor(i / 6) * (h * 0.32);
    fillPx(ctx, hx, hy, u * 3, u, mat.stroke);
    fillPx(ctx, hx + u, hy - u, u, u * 3, rgba(PASTEL.butter, 0.5));
    const pool = seeded(seed, i) > 0.3;
    if (pool) {
      fillPx(ctx, hx + u, hy, u, u, rgba(mat.particle, 0.55 + Math.sin(time * 3.2 + i) * 0.25));
      fillPx(ctx, hx + u, hy + u, u, u, rgba(mat.fill, 0.4));
    } else {
      fillPx(ctx, hx + u, hy + u, u, u, rgba(PASTEL.white, 0.35 + seeded(seed, i) * 0.2));
    }
  }
  drawIdleDrip(a, mat.particle, 0);
  drawIdleDrip(a, mat.particle, 1.1);
  drawIdleDrip(a, mat.particle, 2.3);
  if (melt > 0.05) {
    const drip = u * (2 + Math.floor(melt * 5));
    fillPx(ctx, cx + w * 0.15, sy + h - u, u * 2, drip, mat.fill);
    fillPx(ctx, cx - w * 0.2, sy + h - u, u * 2, drip * 0.8, mat.particle);
  }
  drawShimmerBand(a, 1);
  drawSurfaceGrain(a, 6, PASTEL.butter, 0.35);
  drawEdgeFlecks(a, 5, mat.particle);
  drawDebris(a, 5, mat.particle);
  drawAmbientSpecks(a, 7, mat.particle);
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
  fillPx(ctx, x + w * 0.72, sy + u * 2, u * 2, u * 3, rgba(PASTEL.blush, 0.4));
  for (let i = 0; i < 18; i++) {
    const tw = Math.sin(time * 4.5 + i * 1.8 + wobble);
    if (tw < -0.35) continue;
    fillPx(
      ctx,
      x + u * 3 + seeded(seed, i) * (w - u * 8),
      sy + u * 2 + seeded(seed, i + 4) * (h * 0.55),
      u,
      u,
      i % 3 === 0 ? PASTEL.white : i % 3 === 1 ? PASTEL.lilac : mat.particle,
    );
  }
  for (let i = 0; i < 5; i++) {
    const by = sy + h * (0.35 + seeded(seed, i + 8) * 0.4) + Math.sin(time * 2 + i) * u * 0.5;
    drawBubbleRing(
      ctx,
      x + u * 4 + seeded(seed, i + 9) * (w - u * 12),
      by,
      u * 2,
      u,
      rgba(mat.particle, 0.55),
    );
  }
  drawShimmerBand(a, 0);
  drawPressIndent(a);
  drawSurfaceGrain(a, 6, PASTEL.white, 0.3);
  drawEdgeFlecks(a, 5, mat.particle);
  drawDebris(a, 5, mat.particle);
  drawAmbientSpecks(a, 8, mat.particle);
}

/** Espuma — picos altos tipo chantilly */
function drawWhipped(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, wobble, time } = a;
  const x = cx - w / 2;
  const press = a.overlay?.pressAmount ?? 0;
  const collapse = Math.min(1, press * 1.2);

  fillPx(ctx, x + u, sy + h * 0.35, w - u * 2, h * 0.65, mat.fill);
  fillPx(ctx, x, sy + h * 0.5, w, h * 0.5, mat.fill);
  const peaks = 7;
  for (let i = 0; i < peaks; i++) {
    const px0 = x + u * 2 + (i / (peaks - 1)) * (w - u * 4);
    const ph = h * (0.55 + seeded(seed, i) * 0.45) * (1 - collapse * 0.55) + Math.sin(wobble + i) * u;
    for (let row = 0; row < ph; row += u) {
      const tw = u * 2 + (row / ph) * u * 5;
      fillPx(ctx, px0 - tw / 2, sy + h * 0.4 - row, tw, u, i === 2 || i === 4 ? PASTEL.blush : mat.fill);
    }
    fillPx(ctx, px0 - u, sy + h * 0.4 - ph, u * 2, u, PASTEL.white);
    fillPx(ctx, px0, sy + h * 0.4 - ph * 0.5, u, u, rgba(PASTEL.white, 0.4));
    fillPx(ctx, px0 - u, sy + h * 0.4 - ph * 0.3, u, u, rgba(mat.particle, 0.35));
  }
  // Floating foam flecks above peaks
  for (let i = 0; i < 6; i++) {
    if (Math.sin(time * 3 + i) > 0) {
      fillPx(
        ctx,
        cx + (seeded(seed, i + 220) - 0.5) * w * 0.8,
        sy + h * 0.1 - Math.sin(time + i) * u * 2,
        u,
        u,
        PASTEL.white,
      );
    }
  }
  if (press > 0.25) {
    for (let i = 0; i < 6 + Math.floor(press * 6); i++) {
      fillPx(
        ctx,
        cx + (seeded(seed, i + 16) - 0.5) * w * 0.85,
        sy + h * 0.35 + seeded(seed, i + 20) * h * 0.3,
        u,
        u,
        i % 2 ? PASTEL.white : mat.particle,
      );
    }
  }
  fillPx(ctx, x, sy + h - u, w, u, mat.stroke);
  drawEdgeFlecks(a, 6, PASTEL.white);
  drawDebris(a, 6, PASTEL.white);
  drawAmbientSpecks(a, 8, mat.particle);
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
  for (let i = 0; i < 36; i++) {
    if (seeded(seed, i) > integ) continue;
    fillPx(
      ctx,
      cx + (seeded(seed, i + 10) - 0.5) * w * 0.8,
      sy + h - hh * (0.1 + seeded(seed, i + 20) * 0.8),
      u,
      u,
      i % 3 === 0 ? mat.stroke : i % 3 === 1 ? PASTEL.sandSoft : mat.particle,
    );
  }
  if (press > 0.08 || integ < 0.95) {
    fillPx(ctx, cx - w * 0.2, sy + h - hh + u, w * 0.4, u * 2, mat.stroke);
    fillPx(ctx, cx - w * 0.12, sy + h - hh + u * 2, w * 0.24, u, rgba(mat.particle, 0.55));
  }
  // Always a few tumbling grains at base
  for (let i = 0; i < 6; i++) {
    const fall = ((time * 2.5 + i * 0.37) % 1) * u * (2 + press * 3);
    fillPx(
      ctx,
      cx + (seeded(seed, i + 30) - 0.5) * w * 0.7,
      sy + h + fall,
      u,
      u,
      mat.particle,
    );
  }
  drawEdgeFlecks(a, 6, mat.particle);
  drawDebris(a, 7, mat.particle);
  drawAmbientSpecks(a, 5, mat.particle);
}

/** Gelo — cristais irregulares, pontas */
function drawIce(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, time, overlay } = a;
  const x = cx - w / 2;
  const crack = overlay?.crackLevel ?? 0;
  fillPx(ctx, x + u * 2, sy, w - u * 4, h, mat.fill);
  fillPx(ctx, x, sy + u * 2, w, h - u * 3, mat.fill);
  for (let i = 0; i < 6; i++) {
    const sx = x + u * 2 + (i / 5) * (w - u * 8);
    const sh = u * (2 + Math.floor(seeded(seed, i) * 4));
    fillPx(ctx, sx, sy - sh, u * 2, sh + u, PASTEL.white);
    fillPx(ctx, sx + u, sy - sh - u, u, u, mat.fill);
  }
  for (let i = 0; i < 10; i++) {
    fillPx(
      ctx,
      x + seeded(seed, i + 40) * (w - u * 4),
      sy + u * 2 + seeded(seed, i + 45) * (h - u * 4),
      u * (1 + (i % 2)),
      u,
      rgba(PASTEL.mist, 0.55),
    );
  }
  if (crack > 0.02) {
    for (let i = 0; i < 3 + Math.floor(crack * 5); i++) {
      fillPx(
        ctx,
        cx - w * 0.35 + (i / 6) * w * 0.7,
        sy + h * (0.15 + seeded(seed, i + 50) * 0.55),
        u,
        u * (2 + Math.floor(crack * 3)),
        rgba(PASTEL.white, 0.6 + crack * 0.3),
      );
    }
  }
  for (let i = 0; i < 10; i++) {
    if (Math.sin(time * 5.5 + seed + i * 1.7) > 0.05) {
      fillPx(ctx, cx + (seeded(seed, i + 55) - 0.5) * w * 0.75, sy + seeded(seed, i + 60) * h * 0.65, u, u, PASTEL.white);
      fillPx(ctx, cx + (seeded(seed, i + 65) - 0.5) * w * 0.55, sy + seeded(seed, i + 70) * h * 0.45, u, u, mat.particle);
    }
  }
  fillPx(ctx, x + u, sy + h - u, w - u * 2, u, mat.stroke);
  fillPx(ctx, cx - u, sy + u * 2, u, h - u * 4, rgba(PASTEL.white, 0.45));
  drawShimmerBand(a, 1);
  drawPressIndent(a);
  drawEdgeFlecks(a, 5, mat.particle);
  drawDebris(a, 5, mat.particle);
  drawAmbientSpecks(a, 9, mat.particle);
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
  for (let i = 0; i < 14; i++) {
    const bx = x + u * 2 + seeded(seed, i) * (w - u * 6);
    const by = sy + u + seeded(seed, i + 5) * (h - u * 3);
    fillPx(ctx, bx, by, u * (2 + (i % 3)), u * 2, i % 2 ? mat.stroke : PASTEL.blush);
  }
  fillPx(ctx, cx - u * 2, sy + u, u * 3, u, rgba(PASTEL.white, 0.55));
  fillPx(ctx, cx + u, sy + u * 2, u * 2, u, rgba(mat.particle, 0.45));
  const pull = Math.sin(wobble) * u * (1 + press);
  fillPx(ctx, cx - u * 4 + pull, sy - u * 2, u * 2, u * 2, mat.fill);
  fillPx(ctx, cx + u * 3, sy - u, u * 2, u, mat.stroke);
  const strandBase = overlay?.behavior === 'sticky' ? 5 : 3;
  const strand = u * (strandBase + Math.floor((Math.sin(wobble * 2 + time) * 0.5 + 0.5) * 3 + press * 2));
  fillPx(ctx, cx - u * 3 + pull, sy - strand, u, strand, mat.particle);
  fillPx(ctx, cx + u * 2, sy - strand * 0.75, u, strand * 0.75, mat.fill);
  fillPx(ctx, cx + u * 5 - pull * 0.5, sy - strand * 0.5, u, strand * 0.5, mat.stroke);
  fillPx(ctx, cx - u * 3 + pull, sy - strand - u, u * 2, u, mat.particle);
  // Chewed flecks dripping
  for (let i = 0; i < 4; i++) {
    fillPx(
      ctx,
      cx + (seeded(seed, i + 230) - 0.5) * w * 0.6,
      sy + h + Math.sin(time * 2 + i) * u,
      u,
      u,
      mat.particle,
    );
  }
  drawPressIndent(a);
  drawSurfaceGrain(a, 8, PASTEL.blush, 0.3);
  drawEdgeFlecks(a, 6, mat.particle);
  drawDebris(a, 6, mat.particle);
  drawAmbientSpecks(a, 7, mat.particle);
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
  for (let i = 0; i < 7; i++) {
    fillPx(
      ctx,
      x + u * 2 + i * (w / 7.5) + fold * (1 + press),
      sy + u * (1.2 + i * 0.75),
      w * 0.4,
      u,
      rgba(mat.stroke, 0.35 + press * 0.15),
    );
  }
  for (let i = 0; i < 14; i++) {
    if (Math.sin(time * 1.8 + i + seed) > -0.4) {
      fillPx(
        ctx,
        x + u * 2 + seeded(seed, i + 90) * (w - u * 6),
        sy + u + seeded(seed, i + 95) * (h - u * 3),
        u,
        u,
        rgba(mat.particle, 0.5),
      );
    }
  }
  fillPx(ctx, x + u * 3, sy, w - u * 6, u, rgba(PASTEL.white, 0.4));
  fillPx(ctx, x + u, sy + h - u, w - u * 2, u, mat.stroke);
  fillPx(
    ctx,
    cx + (seeded(seed, 1) - 0.5) * w * 0.15,
    sy + h * 0.38,
    u * (3 + press * 2),
    u * (2 + press),
    rgba(mat.stroke, 0.35 + press * 0.2),
  );
  // Soft fold ribbons peeling
  if (press > 0.2) {
    for (let i = 0; i < 3; i++) {
      fillPx(ctx, x + w * 0.1 + i * u * 3, sy + h - u * 2, u * 3, u, rgba(mat.particle, 0.5));
    }
  }
  drawPressIndent(a);
  drawSurfaceGrain(a, 8, mat.stroke, 0.2);
  drawEdgeFlecks(a, 5, mat.particle);
  drawDebris(a, 6, mat.particle);
  drawAmbientSpecks(a, 6, mat.particle);
}

/** Marshmallow — cubo fofo branco-blush */
function drawMarshmallow(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, wobble, time } = a;
  const x = cx - w / 2;
  const squash = (a.overlay?.pressAmount ?? 0) * u;
  fillPx(ctx, x + u, sy + squash, w - u * 2, h - squash, mat.fill);
  fillPx(ctx, x, sy + u + squash, w, h - u * 2 - squash, mat.fill);
  fillPx(ctx, x + u * 2, sy + squash, w - u * 4, u, rgba(PASTEL.white, 0.7));
  fillPx(ctx, x + u, sy + h - u, w - u * 2, u, mat.stroke);
  // Soft toasted edge flecks
  for (let i = 0; i < 8; i++) {
    fillPx(
      ctx,
      x + u * 2 + seeded(seed, i) * (w - u * 6),
      sy + u * 2 + seeded(seed, i + 5) * (h - u * 4) + squash,
      u,
      u,
      i % 2 ? PASTEL.blush : rgba(mat.stroke, 0.35),
    );
  }
  // Bounce puff
  for (let i = 0; i < 5; i++) {
    if (Math.sin(time * 2.5 + i + wobble) > 0.2) {
      fillPx(ctx, cx + (i - 2) * u * 2, sy - u + Math.sin(time + i) * u * 0.5, u, u, mat.particle);
    }
  }
  drawShimmerBand(a, 1);
  drawPressIndent(a);
  drawEdgeFlecks(a, 4, mat.particle);
  drawDebris(a, 4, PASTEL.white);
  drawAmbientSpecks(a, 6, mat.particle);
}

/** Esponja — bloco amarelo com poros */
function drawSponge(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed } = a;
  const x = cx - w / 2;
  const press = a.overlay?.pressAmount ?? 0;
  fillPx(ctx, x, sy, w, h, mat.fill);
  fillPx(ctx, x, sy, w, u, rgba(PASTEL.white, 0.4));
  fillPx(ctx, x, sy + h - u, w, u, mat.stroke);
  fillPx(ctx, x, sy, u, h, mat.stroke);
  fillPx(ctx, x + w - u, sy, u, h, mat.stroke);
  // Pore grid
  for (let i = 0; i < 20; i++) {
    const px0 = x + u * 2 + (i % 5) * (w / 5.2);
    const py = sy + u * 2 + Math.floor(i / 5) * (h / 4.5);
    fillPx(ctx, px0, py, u * (1 + (i % 2)), u * (1 + (i % 2)), rgba(mat.stroke, 0.45));
    if (seeded(seed, i) > 0.55) fillPx(ctx, px0 + u, py + u, u, u, rgba(PASTEL.white, 0.25));
  }
  if (press > 0.15) {
    for (let i = 0; i < 4; i++) {
      fillPx(ctx, cx + (seeded(seed, i + 40) - 0.5) * w * 0.5, sy - u, u, u, mat.particle);
    }
  }
  drawPressIndent(a);
  drawSurfaceGrain(a, 6, mat.particle, 0.3);
  drawEdgeFlecks(a, 5, mat.particle);
  drawDebris(a, 5, mat.particle);
  drawAmbientSpecks(a, 4, mat.particle);
}

/** Bolha de sabão — orbe translúcida irisada */
function drawSoapBubble(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, time, wobble, seed } = a;
  const r = Math.min(w, h) * 0.55;
  // Stepped circle body
  for (let row = 0; row < h; row += u) {
    const t = (row - h / 2) / (h / 2);
    const ww = w * Math.max(0.25, Math.sqrt(Math.max(0, 1 - t * t)) * 0.95);
    fillPx(ctx, cx - ww / 2, sy + row, ww, u, rgba(mat.fill, 0.55));
  }
  // Rainbow shimmer rim
  const slide = Math.sin(time * 3 + wobble) * u * 2;
  fillPx(ctx, cx - r * 0.4 + slide, sy + u * 2, u * 3, u, rgba(PASTEL.white, 0.7));
  fillPx(ctx, cx + r * 0.2, sy + h * 0.35, u * 2, u, rgba(PASTEL.lilac, 0.5));
  fillPx(ctx, cx - r * 0.15, sy + h * 0.55, u, u, rgba(PASTEL.mint, 0.45));
  // Satellite bubbles
  for (let i = 0; i < 4; i++) {
    const bx = cx + (seeded(seed, i) - 0.5) * w * 0.9;
    const by = sy + h + Math.sin(time * 2 + i) * u;
    drawBubbleRing(ctx, bx, by, u * 2, u, rgba(mat.particle, 0.6));
  }
  drawAmbientSpecks(a, 8, mat.particle);
  drawDebris(a, 3, mat.particle);
}

/** Espuma de banho — nuvem lilac fofa */
function drawBathFoam(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, wobble, time } = a;
  const x = cx - w / 2;
  const press = a.overlay?.pressAmount ?? 0;
  fillPx(ctx, x + u, sy + h * 0.35, w - u * 2, h * 0.65, mat.fill);
  fillPx(ctx, x, sy + h * 0.5, w, h * 0.5, mat.fill);
  for (let i = 0; i < 7; i++) {
    const px0 = x + u * 2 + (i / 6) * (w - u * 4);
    const ph = h * (0.4 + seeded(seed, i) * 0.45) * (1 - press * 0.4) + Math.sin(wobble + i) * u;
    for (let row = 0; row < ph; row += u) {
      const tw = u * 3 + (row / Math.max(1, ph)) * u * 4;
      fillPx(ctx, px0 - tw / 2, sy + h * 0.45 - row, tw, u, i % 3 === 1 ? PASTEL.lilac : mat.fill);
    }
    fillPx(ctx, px0 - u, sy + h * 0.45 - ph, u * 2, u, PASTEL.white);
  }
  for (let i = 0; i < 8; i++) {
    if (Math.sin(time * 3 + i) > 0) {
      drawBubbleRing(
        ctx,
        cx + (seeded(seed, i + 20) - 0.5) * w * 0.8,
        sy + seeded(seed, i + 25) * h * 0.5,
        u * 2,
        u,
        rgba(mat.particle, 0.5),
      );
    }
  }
  fillPx(ctx, x, sy + h - u, w, u, mat.stroke);
  drawDebris(a, 6, PASTEL.white);
  drawAmbientSpecks(a, 8, mat.particle);
}

/** Sabonete lavanda — barra lilás com glitter */
function drawLavenderSoap(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, time, wobble } = a;
  const x = cx - w / 2;
  fillPx(ctx, x + u * 2, sy, w - u * 4, h, mat.fill);
  fillPx(ctx, x + u, sy + u, w - u * 2, h - u * 2, mat.fill);
  fillPx(ctx, x, sy + u * 2, w, h - u * 4, mat.fill);
  fillPx(ctx, x + u * 3, sy, w - u * 6, u, rgba(PASTEL.white, 0.6));
  fillPx(ctx, x + u * 2, sy + h - u, w - u * 4, u, mat.stroke);
  fillPx(ctx, x + u * 4, sy + h * 0.45, w - u * 8, u, rgba(PASTEL.white, 0.35));
  for (let i = 0; i < 14; i++) {
    if (Math.sin(time * 4 + i + wobble) < -0.3) continue;
    fillPx(
      ctx,
      x + u * 3 + seeded(seed, i) * (w - u * 8),
      sy + u * 2 + seeded(seed, i + 4) * (h * 0.55),
      u,
      u,
      i % 2 ? PASTEL.white : mat.particle,
    );
  }
  fillPx(ctx, cx, sy + h * 0.28, u, u * 3, rgba(PASTEL.lilac, 0.45));
  fillPx(ctx, cx - u * 2, sy + h * 0.35, u * 5, u, rgba(PASTEL.lilac, 0.35));
  drawShimmerBand(a, 0);
  drawPressIndent(a);
  drawEdgeFlecks(a, 4, mat.particle);
  drawDebris(a, 4, mat.particle);
  drawAmbientSpecks(a, 7, mat.particle);
}

/** Sabonete creme — barra creme oval */
function drawCreamSoap(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, time } = a;
  const x = cx - w / 2;
  for (let row = 0; row < h; row += u) {
    const t = row / Math.max(1, h - u);
    const ww = w * (0.85 + Math.sin(t * Math.PI) * 0.15);
    fillPx(ctx, cx - ww / 2, sy + row, ww, u, mat.fill);
  }
  fillPx(ctx, x + u * 3, sy, w - u * 6, u, rgba(PASTEL.white, 0.65));
  fillPx(ctx, x + u * 2, sy + h - u, w - u * 4, u, mat.stroke);
  fillPx(ctx, x + u * 4, sy + h * 0.4, w - u * 8, u, rgba(PASTEL.white, 0.35));
  for (let i = 0; i < 8; i++) {
    if (Math.sin(time * 3 + i) > 0) {
      fillPx(
        ctx,
        x + u * 4 + seeded(seed, i) * (w - u * 10),
        sy + u * 3 + seeded(seed, i + 6) * (h * 0.4),
        u,
        u,
        mat.particle,
      );
    }
  }
  for (let i = 0; i < 3; i++) {
    drawBubbleRing(ctx, x + u * 5 + i * u * 5, sy + h * 0.55, u * 2, u, rgba(mat.particle, 0.45));
  }
  drawPressIndent(a);
  drawDebris(a, 4, mat.particle);
  drawAmbientSpecks(a, 5, mat.particle);
}

/** Teclado — fileira de teclas cinza pastel */
function drawKeyboard(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed } = a;
  const x = cx - w / 2;
  const press = a.overlay?.pressAmount ?? 0;
  fillPx(ctx, x, sy + u, w, h - u, mat.stroke);
  fillPx(ctx, x + u, sy + u * 2, w - u * 2, h - u * 3, rgba(mat.fill, 0.85));
  const cols = 6;
  const rows = 2;
  const kw = (w - u * 4) / cols;
  const kh = (h - u * 4) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const kx = x + u * 2 + c * kw;
      const ky = sy + u * 2 + r * kh;
      const sunk = press > 0.35 && seeded(seed, r * 10 + c) > 0.7 ? u : 0;
      fillPx(ctx, kx + u * 0.3, ky + sunk, kw - u * 0.6, kh - u * 0.6, mat.fill);
      fillPx(ctx, kx + u * 0.5, ky + u * 0.3 + sunk, kw - u, u, rgba(PASTEL.white, 0.45));
      fillPx(ctx, kx + u, ky + kh - u * 1.2 + sunk, kw - u * 2, u, rgba(mat.stroke, 0.4));
      // Letter speck
      if (seeded(seed, c + r * 7) > 0.4) {
        fillPx(ctx, kx + kw * 0.35, ky + kh * 0.35 + sunk, u, u, rgba(mat.stroke, 0.5));
      }
    }
  }
  drawPressIndent(a);
  drawDebris(a, 3, mat.particle);
  drawAmbientSpecks(a, 3, mat.particle);
}

/** Plástico bolha — laje com grade de bolhas */
function drawBubbleWrap(a: DrawArgs): void {
  const { ctx, cx, sy, w, h, mat, u, seed, time } = a;
  const x = cx - w / 2;
  const press = a.overlay?.pressAmount ?? 0;
  fillPx(ctx, x, sy, w, h, mat.fill);
  fillPx(ctx, x, sy, w, u, rgba(PASTEL.white, 0.45));
  fillPx(ctx, x, sy + h - u, w, u, mat.stroke);
  const cols = 5;
  const rows = 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const bx = x + u * 2 + c * ((w - u * 4) / cols);
      const by = sy + u * 2 + r * ((h - u * 4) / rows);
      const popped = press > 0.4 && seeded(seed, c + r * 9) > 0.55;
      if (popped) {
        fillPx(ctx, bx + u, by + u, u * 2, u, rgba(mat.stroke, 0.35));
      } else {
        drawBubbleRing(ctx, bx, by, u * 3, u, rgba(mat.particle, 0.65));
        fillPx(ctx, bx + u, by + u, u, u, rgba(PASTEL.white, 0.55));
        if (Math.sin(time * 2.5 + c + r) > 0.4) {
          fillPx(ctx, bx + u * 2, by, u, u, rgba(PASTEL.sky, 0.4));
        }
      }
    }
  }
  drawPressIndent(a);
  drawEdgeFlecks(a, 4, mat.particle);
  drawDebris(a, 4, mat.particle);
  drawAmbientSpecks(a, 5, mat.particle);
}
