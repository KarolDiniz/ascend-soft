import type { PlatformDrawState, PlatformVariant } from './types';

function seeded(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function cxMid(l: number, r: number): number {
  return (l + r) / 2;
}

function getDepthMul(v: PlatformVariant): number {
  if (v.startsWith('whipped')) return 2.0;
  if (v.includes('dome') || v.includes('blob') || v.includes('scoop')) return 1.55;
  if (v.includes('puddle') || v.includes('pat')) return 1.15;
  return 1.35;
}

function getSpreadMul(v: PlatformVariant): number {
  if (v.includes('puddle') || v.includes('wedge') || v.includes('curl')) return 1.22;
  if (v.includes('peaks') || v.includes('swirl')) return 1.18;
  return 1.05;
}

/** Trace silhouette path — landing surface at surfaceY. */
export function traceShape(
  ctx: CanvasRenderingContext2D,
  variant: PlatformVariant,
  s: PlatformDrawState,
): void {
  const { cx, w, h, surfaceY, wobble, seed } = s;
  const depth = h * getDepthMul(variant);
  const spread = w * getSpreadMul(variant);
  const left = cx - spread / 2;
  const right = cx + spread / 2;
  const bottom = surfaceY + depth;

  ctx.beginPath();

  switch (variant) {
    case 'jelly_cube':
      traceJellyCube(ctx, left, right, surfaceY, bottom, wobble);
      break;
    case 'jelly_dome':
      traceJellyDome(ctx, cx, left, right, surfaceY, bottom, wobble);
      break;
    case 'butter_slab':
      traceButterSlab(ctx, left, right, surfaceY, bottom, w);
      break;
    case 'butter_pat':
      traceButterPat(ctx, cx, surfaceY, bottom, spread);
      break;
    case 'butter_curl':
      traceButterCurl(ctx, cx, left, right, surfaceY, bottom, w);
      break;
    case 'mochi_round':
      traceMochiRound(ctx, cx, surfaceY, bottom, spread, depth);
      break;
    case 'mochi_square':
      traceMochiSquare(ctx, left, right, surfaceY, bottom);
      break;
    case 'chocolate_puddle':
      traceChocolatePuddle(ctx, cx, left, right, surfaceY, bottom, wobble);
      break;
    case 'chocolate_bar':
      traceChocolateBar(ctx, left, right, surfaceY, bottom);
      break;
    case 'citrus_half':
      traceCitrusHalf(ctx, cx, left, right, surfaceY, bottom, spread, depth);
      break;
    case 'citrus_wedge':
      traceCitrusWedge(ctx, cx, left, right, surfaceY, bottom);
      break;
    case 'honey_chunk':
      traceHoneyChunk(ctx, left, right, surfaceY, bottom, seed);
      break;
    case 'honey_drip':
      traceHoneyDrip(ctx, cx, left, right, surfaceY, bottom, seed);
      break;
    case 'glycerin_bar':
      traceGlycerinBar(ctx, left, right, surfaceY, bottom);
      break;
    case 'glycerin_gem':
      traceGlycerinGem(ctx, cx, surfaceY, bottom, spread, depth);
      break;
    case 'whipped_peaks':
      traceWhippedPeaks(ctx, left, right, surfaceY, bottom, w, seed);
      break;
    case 'whipped_swirl':
      traceWhippedSwirl(ctx, cx, left, right, surfaceY, bottom, w);
      break;
    case 'kinetic_mound':
      traceKineticMound(ctx, cx, left, right, surfaceY, bottom, wobble);
      break;
    case 'kinetic_slab':
      traceKineticSlab(ctx, left, right, surfaceY, bottom);
      break;
    case 'ice_shard':
      traceIceShard(ctx, cx, left, right, surfaceY, bottom, seed);
      break;
    case 'ice_block':
      traceIceBlock(ctx, left, right, surfaceY, bottom);
      break;
    case 'slime_puddle':
      traceSlimePuddle(ctx, cx, left, right, surfaceY, bottom, wobble, seed);
      break;
    case 'slime_blob':
      traceSlimeBlob(ctx, cx, left, right, surfaceY, bottom, wobble);
      break;
    case 'butterSlime_fold':
      traceButterSlimeFold(ctx, cx, left, right, surfaceY, bottom, w);
      break;
    case 'butterSlime_scoop':
      traceButterSlimeScoop(ctx, cx, surfaceY, bottom, spread, depth);
      break;
    default:
      ctx.rect(left, surfaceY, spread, depth);
  }
  ctx.closePath();
}

function traceJellyCube(
  ctx: CanvasRenderingContext2D,
  l: number,
  r: number,
  top: number,
  bot: number,
  wobble: number,
): void {
  const wob = Math.sin(wobble) * 3;
  ctx.moveTo(l + 4, top);
  ctx.lineTo(r - 4, top);
  ctx.quadraticCurveTo(r + wob, top + (bot - top) * 0.35, r - 2 + wob, bot - 6);
  ctx.quadraticCurveTo(cxMid(l, r), bot + 2, l + 2 - wob, bot - 6);
  ctx.quadraticCurveTo(l - wob, top + (bot - top) * 0.35, l + 4, top);
}

function traceJellyDome(
  ctx: CanvasRenderingContext2D,
  cx: number,
  l: number,
  r: number,
  top: number,
  bot: number,
  wobble: number,
): void {
  const wob = Math.sin(wobble) * 4;
  ctx.moveTo(l, top + 2);
  ctx.bezierCurveTo(l - wob, top + (bot - top) * 0.5, cx - wob, bot + 4, cx, bot);
  ctx.bezierCurveTo(cx + wob, bot + 4, r + wob, top + (bot - top) * 0.5, r, top + 2);
  ctx.quadraticCurveTo(cx, top - (bot - top) * 0.15, l, top + 2);
}

function traceButterSlab(
  ctx: CanvasRenderingContext2D,
  l: number,
  r: number,
  top: number,
  bot: number,
  w: number,
): void {
  const chamfer = w * 0.06;
  ctx.moveTo(l + chamfer, top);
  ctx.lineTo(r - chamfer * 0.5, top);
  ctx.lineTo(r, top + chamfer);
  ctx.lineTo(r - 3, bot);
  ctx.lineTo(l + 3, bot);
  ctx.lineTo(l, top + chamfer);
  ctx.closePath();
}

function traceButterPat(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  bot: number,
  spread: number,
): void {
  ctx.ellipse(cx, top + (bot - top) * 0.45, spread * 0.48, (bot - top) * 0.55, 0, 0, Math.PI * 2);
}

function traceButterCurl(
  ctx: CanvasRenderingContext2D,
  cx: number,
  l: number,
  r: number,
  top: number,
  bot: number,
  w: number,
): void {
  ctx.moveTo(l, top + 3);
  ctx.quadraticCurveTo(cx, top - w * 0.08, r, top + 3);
  ctx.bezierCurveTo(r + w * 0.05, top + (bot - top) * 0.5, cx + w * 0.15, bot, cx, bot - 4);
  ctx.bezierCurveTo(cx - w * 0.15, bot, l - w * 0.05, top + (bot - top) * 0.5, l, top + 3);
}

function traceMochiRound(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  _bot: number,
  spread: number,
  depth: number,
): void {
  ctx.ellipse(cx, top + depth * 0.42, spread * 0.46, depth * 0.52, 0, Math.PI, 0);
  ctx.lineTo(cx + spread * 0.46, top + 1);
  ctx.quadraticCurveTo(cx, top - depth * 0.12, cx - spread * 0.46, top + 1);
}

function traceMochiSquare(
  ctx: CanvasRenderingContext2D,
  l: number,
  r: number,
  top: number,
  bot: number,
): void {
  const p = (r - l) * 0.12;
  ctx.moveTo(l + p, top);
  ctx.lineTo(r - p, top);
  ctx.quadraticCurveTo(r, top + p, r - p, bot - p);
  ctx.quadraticCurveTo(cxMid(l, r), bot + 2, l + p, bot - p);
  ctx.quadraticCurveTo(l, top + p, l + p, top);
}

function traceChocolatePuddle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  l: number,
  r: number,
  top: number,
  bot: number,
  wobble: number,
): void {
  const wob = Math.sin(wobble) * 2;
  ctx.moveTo(l + 6, top + 2);
  ctx.bezierCurveTo(cx - (r - l) * 0.2, top - 4, cx + (r - l) * 0.25, top - 2, r - 4, top + 3);
  ctx.quadraticCurveTo(r + 8 + wob, bot, cx, bot + 3);
  ctx.quadraticCurveTo(l - 8 - wob, bot, l + 6, top + 2);
}

function traceChocolateBar(
  ctx: CanvasRenderingContext2D,
  l: number,
  r: number,
  top: number,
  bot: number,
): void {
  ctx.moveTo(l + 2, top);
  ctx.lineTo(r - 2, top);
  ctx.lineTo(r, bot - 2);
  ctx.lineTo(l, bot - 2);
  ctx.closePath();
}

function traceCitrusHalf(
  ctx: CanvasRenderingContext2D,
  cx: number,
  l: number,
  r: number,
  top: number,
  _bot: number,
  spread: number,
  depth: number,
): void {
  ctx.moveTo(l + 4, top + 2);
  ctx.arc(cx, top + depth * 0.55, spread * 0.46, Math.PI, 0, false);
  ctx.lineTo(r - 4, top + 2);
  ctx.quadraticCurveTo(cx, top - depth * 0.08, l + 4, top + 2);
}

function traceCitrusWedge(
  ctx: CanvasRenderingContext2D,
  cx: number,
  l: number,
  r: number,
  top: number,
  bot: number,
): void {
  ctx.moveTo(cx, top);
  ctx.lineTo(r, bot);
  ctx.quadraticCurveTo(cx, bot + 4, l, bot);
  ctx.closePath();
}

function traceHoneyChunk(
  ctx: CanvasRenderingContext2D,
  l: number,
  r: number,
  top: number,
  bot: number,
  seed: number,
): void {
  const n = 6;
  const cx = cxMid(l, r);
  const rad = (r - l) * 0.42;
  const cy = top + (bot - top) * 0.5;
  for (let i = 0; i <= n; i++) {
    const a = (Math.PI / n) * i - Math.PI / 2 + seeded(seed, i) * 0.15;
    const px = cx + Math.cos(a) * rad * (i % 2 === 0 ? 1 : 0.92);
    const py = cy + Math.sin(a) * (bot - top) * 0.48;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
}

function traceHoneyDrip(
  ctx: CanvasRenderingContext2D,
  cx: number,
  l: number,
  r: number,
  top: number,
  bot: number,
  seed: number,
): void {
  ctx.moveTo(l + 4, top);
  ctx.lineTo(r - 4, top);
  ctx.lineTo(r - 2, bot - 8);
  const dripX = cx + (seeded(seed, 1) - 0.5) * (r - l) * 0.3;
  ctx.quadraticCurveTo(dripX, bot + 10, dripX - 6, bot + 2);
  ctx.quadraticCurveTo(dripX, bot - 4, l + 2, bot - 8);
  ctx.closePath();
}

function traceGlycerinBar(
  ctx: CanvasRenderingContext2D,
  l: number,
  r: number,
  top: number,
  bot: number,
): void {
  const inset = (r - l) * 0.08;
  ctx.moveTo(l + inset, top);
  ctx.lineTo(r - inset, top);
  ctx.lineTo(r, top + inset);
  ctx.lineTo(r - inset, bot);
  ctx.lineTo(l + inset, bot);
  ctx.lineTo(l, top + inset);
  ctx.closePath();
}

function traceGlycerinGem(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  bot: number,
  spread: number,
  depth: number,
): void {
  const hw = spread * 0.42;
  ctx.moveTo(cx, top - depth * 0.05);
  ctx.lineTo(cx + hw, top + depth * 0.35);
  ctx.lineTo(cx + hw * 0.7, bot);
  ctx.lineTo(cx - hw * 0.7, bot);
  ctx.lineTo(cx - hw, top + depth * 0.35);
  ctx.closePath();
}

function traceWhippedPeaks(
  ctx: CanvasRenderingContext2D,
  l: number,
  r: number,
  top: number,
  bot: number,
  w: number,
  seed: number,
): void {
  const peaks = 4 + Math.floor(seeded(seed, 0) * 2);
  ctx.moveTo(l, bot);
  for (let i = 0; i <= peaks; i++) {
    const t = i / peaks;
    const px = l + t * (r - l);
    const peakH = top - w * (0.12 + seeded(seed, i + 1) * 0.18);
    if (i === 0) ctx.lineTo(px, top + 2);
    else {
      const prevX = l + ((i - 1) / peaks) * (r - l);
      const midX = (prevX + px) / 2;
      ctx.quadraticCurveTo(midX, peakH, px, top + 2 + seeded(seed, i + 3) * 4);
    }
  }
  ctx.lineTo(r, bot);
  ctx.closePath();
}

function traceWhippedSwirl(
  ctx: CanvasRenderingContext2D,
  cx: number,
  l: number,
  r: number,
  top: number,
  bot: number,
  w: number,
): void {
  ctx.moveTo(l, bot);
  ctx.lineTo(l + 4, top + 4);
  ctx.bezierCurveTo(cx - w * 0.1, top - w * 0.15, cx + w * 0.15, top + 6, r - 4, top + 4);
  ctx.lineTo(r, bot);
  ctx.quadraticCurveTo(cx, bot + 6, l, bot);
}

function traceKineticMound(
  ctx: CanvasRenderingContext2D,
  cx: number,
  l: number,
  r: number,
  top: number,
  bot: number,
  wobble: number,
): void {
  const wob = Math.sin(wobble) * 2;
  ctx.moveTo(l, top + 4);
  ctx.quadraticCurveTo(cx - wob, top - 2, r, top + 4);
  ctx.quadraticCurveTo(r + 6, bot, cx, bot + 3);
  ctx.quadraticCurveTo(l - 6, bot, l, top + 4);
}

function traceKineticSlab(
  ctx: CanvasRenderingContext2D,
  l: number,
  r: number,
  top: number,
  bot: number,
): void {
  ctx.moveTo(l + 3, top);
  ctx.lineTo(r - 3, top);
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const px = r - 3 - t * (r - l - 6);
    ctx.lineTo(px, top + 3 + (i % 2) * 2);
  }
  ctx.lineTo(l + 3, bot);
  ctx.closePath();
}

function traceIceShard(
  ctx: CanvasRenderingContext2D,
  cx: number,
  l: number,
  r: number,
  top: number,
  bot: number,
  seed: number,
): void {
  const tilt = (seeded(seed, 2) - 0.5) * 0.2;
  ctx.moveTo(cx + (r - l) * 0.05, top - 2);
  ctx.lineTo(r - 2, top + (bot - top) * 0.3);
  ctx.lineTo(r - 6 + tilt * 20, bot);
  ctx.lineTo(l + 6, bot - 2);
  ctx.lineTo(l + 2, top + (bot - top) * 0.25);
  ctx.closePath();
}

function traceIceBlock(
  ctx: CanvasRenderingContext2D,
  l: number,
  r: number,
  top: number,
  bot: number,
): void {
  const step = (r - l) * 0.12;
  ctx.moveTo(l + step, top);
  ctx.lineTo(r, top + step * 0.5);
  ctx.lineTo(r - step, bot);
  ctx.lineTo(l, bot - step * 0.5);
  ctx.closePath();
}

function traceSlimePuddle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  l: number,
  r: number,
  top: number,
  bot: number,
  wobble: number,
  _seed: number,
): void {
  const wob = Math.sin(wobble) * 5;
  ctx.moveTo(l + 8, top + 2);
  ctx.bezierCurveTo(cx - 10, top - 6 + wob, cx + 12, top - 4 - wob, r - 6, top + 3);
  ctx.bezierCurveTo(r + 12 + wob, bot - 4, cx + wob, bot + 8, cx - wob, bot + 6);
  ctx.bezierCurveTo(l - 12 - wob, bot - 4, l + 4, top + 6, l + 8, top + 2);
}

function traceSlimeBlob(
  ctx: CanvasRenderingContext2D,
  cx: number,
  l: number,
  r: number,
  top: number,
  bot: number,
  wobble: number,
): void {
  const wob = Math.sin(wobble) * 6;
  ctx.moveTo(l, top + 6);
  ctx.bezierCurveTo(l - 8 - wob, top + (bot - top) * 0.4, cx - wob, bot + 10, cx, bot);
  ctx.bezierCurveTo(cx + wob, bot + 10, r + 8 + wob, top + (bot - top) * 0.4, r, top + 6);
  ctx.quadraticCurveTo(cx, top - (bot - top) * 0.2, l, top + 6);
}

function traceButterSlimeFold(
  ctx: CanvasRenderingContext2D,
  cx: number,
  l: number,
  r: number,
  top: number,
  bot: number,
  w: number,
): void {
  ctx.moveTo(l, top + 4);
  ctx.bezierCurveTo(cx - w * 0.2, top - w * 0.06, cx + w * 0.25, top + 8, r, top + 5);
  ctx.bezierCurveTo(r + 4, top + (bot - top) * 0.6, cx + w * 0.1, bot + 4, cx, bot);
  ctx.bezierCurveTo(cx - w * 0.1, bot + 4, l - 4, top + (bot - top) * 0.55, l, top + 4);
}

function traceButterSlimeScoop(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  _bot: number,
  spread: number,
  depth: number,
): void {
  ctx.ellipse(cx, top + depth * 0.4, spread * 0.44, depth * 0.5, 0, Math.PI * 0.95, Math.PI * 2.05);
  ctx.quadraticCurveTo(cx, top - depth * 0.1, cx - spread * 0.44, top + depth * 0.15);
}
