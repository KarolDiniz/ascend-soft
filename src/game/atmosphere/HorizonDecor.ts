import type { HorizonKind } from './AltitudeZones';

/** Procedural far-horizon silhouettes — one path per biome mood, very subtle. */
export function drawHorizon(
  ctx: CanvasRenderingContext2D,
  kind: HorizonKind,
  w: number,
  _h: number,
  baseY: number,
  color: string,
  phase: number,
): void {
  ctx.save();
  ctx.fillStyle = color;

  if (kind === 'cloudLayers') {
    drawCloudLayers(ctx, w, baseY, phase, color);
    ctx.restore();
    return;
  }
  if (kind === 'bubbleHorizon') {
    drawBubbleHorizon(ctx, w, baseY, phase, color);
    ctx.restore();
    return;
  }

  ctx.beginPath();
  switch (kind) {
    case 'meltHills':
      drawMeltHills(ctx, w, baseY, phase);
      break;
    case 'jellyBlocks':
      drawJellyBlocks(ctx, w, baseY, phase);
      break;
    case 'foamArches':
      drawFoamArches(ctx, w, baseY, phase);
      break;
    case 'leafHills':
      drawLeafHills(ctx, w, baseY, phase);
      break;
    case 'crystalPeaks':
      drawCrystalPeaks(ctx, w, baseY, phase);
      break;
    case 'marimbaSkyline':
      drawMarimbaSkyline(ctx, w, baseY, phase);
      break;
    case 'sandDunes':
      drawSandDunes(ctx, w, baseY, phase);
      break;
    default:
      drawNeutralHills(ctx, w, baseY, phase);
  }

  ctx.fill();
  ctx.restore();
}

function waveY(x: number, w: number, phase: number, amp: number, freq: number): number {
  return Math.sin((x / w) * Math.PI * freq + phase) * amp;
}

function drawMeltHills(ctx: CanvasRenderingContext2D, w: number, baseY: number, phase: number): void {
  ctx.moveTo(0, baseY + 40);
  for (let x = 0; x <= w; x += 12) {
    const y = baseY + waveY(x, w, phase * 0.4, 28, 2.2) + Math.sin(x * 0.008 + phase) * 12;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, hBottom(ctx) + 80);
  ctx.lineTo(0, hBottom(ctx) + 80);
  ctx.closePath();
}

function drawJellyBlocks(ctx: CanvasRenderingContext2D, w: number, baseY: number, phase: number): void {
  const blockW = w / 7;
  ctx.moveTo(0, baseY + 50);
  for (let i = 0; i < 8; i++) {
    const x = i * blockW;
    const bh = 35 + Math.sin(phase + i * 0.9) * 10 + (i % 3) * 8;
    ctx.lineTo(x, baseY + 50 - bh);
    ctx.lineTo(x + blockW * 0.85, baseY + 45 - bh * 0.7);
    ctx.lineTo(x + blockW, baseY + 50);
  }
  ctx.lineTo(w, hBottom(ctx) + 80);
  ctx.lineTo(0, hBottom(ctx) + 80);
  ctx.closePath();
}

function drawFoamArches(ctx: CanvasRenderingContext2D, w: number, baseY: number, phase: number): void {
  ctx.moveTo(0, baseY + 30);
  for (let i = 0; i < 6; i++) {
    const ax = (i / 5) * w;
    const archH = 55 + Math.sin(phase + i) * 8;
    ctx.quadraticCurveTo(ax + w * 0.08, baseY + 30 - archH, ax + w * 0.16, baseY + 30);
  }
  ctx.lineTo(w, hBottom(ctx) + 80);
  ctx.lineTo(0, hBottom(ctx) + 80);
  ctx.closePath();
}

function drawLeafHills(ctx: CanvasRenderingContext2D, w: number, baseY: number, phase: number): void {
  ctx.moveTo(0, baseY + 35);
  for (let x = 0; x <= w; x += 8) {
    const bump = Math.abs(Math.sin(x * 0.025 + phase * 0.3)) * 22;
    const y = baseY + waveY(x, w, phase * 0.35, 18, 3) - bump;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, hBottom(ctx) + 80);
  ctx.lineTo(0, hBottom(ctx) + 80);
  ctx.closePath();
}

function drawCrystalPeaks(ctx: CanvasRenderingContext2D, w: number, baseY: number, phase: number): void {
  ctx.moveTo(0, baseY + 40);
  const peaks = 9;
  for (let i = 0; i <= peaks; i++) {
    const x = (i / peaks) * w;
    const peakH = 45 + (i % 3) * 18 + Math.sin(phase + i * 0.7) * 6;
    ctx.lineTo(x + w / peaks * 0.45, baseY + 40 - peakH);
    ctx.lineTo(x + w / peaks, baseY + 40);
  }
  ctx.lineTo(w, hBottom(ctx) + 80);
  ctx.lineTo(0, hBottom(ctx) + 80);
  ctx.closePath();
}

function drawMarimbaSkyline(ctx: CanvasRenderingContext2D, w: number, baseY: number, phase: number): void {
  ctx.moveTo(0, baseY + 35);
  const bars = 12;
  for (let i = 0; i < bars; i++) {
    const x = (i / bars) * w;
    const barH = 22 + (i % 4) * 10 + Math.sin(phase + i * 0.5) * 4;
    ctx.lineTo(x + 4, baseY + 35 - barH);
    ctx.lineTo(x + w / bars - 4, baseY + 35 - barH * 0.85);
    ctx.lineTo(x + w / bars, baseY + 35);
  }
  ctx.lineTo(w, hBottom(ctx) + 80);
  ctx.lineTo(0, hBottom(ctx) + 80);
  ctx.closePath();
}

function drawSandDunes(ctx: CanvasRenderingContext2D, w: number, baseY: number, phase: number): void {
  ctx.moveTo(0, baseY + 30);
  for (let x = 0; x <= w; x += 10) {
    const y = baseY + Math.sin(x * 0.012 + phase * 0.25) * 20 + Math.cos(x * 0.006 + phase) * 12;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, hBottom(ctx) + 80);
  ctx.lineTo(0, hBottom(ctx) + 80);
  ctx.closePath();
}

function drawNeutralHills(ctx: CanvasRenderingContext2D, w: number, baseY: number, phase: number): void {
  ctx.moveTo(0, baseY + 38);
  for (let x = 0; x <= w; x += 14) {
    ctx.lineTo(x, baseY + waveY(x, w, phase * 0.3, 16, 1.8));
  }
  ctx.lineTo(w, hBottom(ctx) + 80);
  ctx.lineTo(0, hBottom(ctx) + 80);
  ctx.closePath();
}

function drawCloudLayers(
  ctx: CanvasRenderingContext2D,
  w: number,
  baseY: number,
  phase: number,
  color: string,
): void {
  ctx.fillStyle = color;
  for (let row = 0; row < 3; row++) {
    const rowY = baseY - row * 28 + Math.sin(phase + row) * 4;
    for (let i = 0; i < 5; i++) {
      const cx = (i / 4) * w + Math.sin(phase * 0.5 + i + row) * 30;
      const rx = w * 0.14;
      const ry = 18 + row * 4;
      ctx.beginPath();
      ctx.ellipse(cx, rowY, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha *= 0.5;
  ctx.fillRect(0, baseY + 10, w, hBottom(ctx));
}

function drawBubbleHorizon(
  ctx: CanvasRenderingContext2D,
  w: number,
  baseY: number,
  phase: number,
  color: string,
): void {
  ctx.fillStyle = color;
  for (let i = 0; i < 8; i++) {
    const cx = (i / 7) * w + Math.sin(phase + i * 0.8) * 20;
    const r = 28 + (i % 3) * 12 + Math.sin(phase * 0.7 + i) * 5;
    const cy = baseY - r * 0.3;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha *= 0.45;
  ctx.fillRect(0, baseY + 15, w, hBottom(ctx));
}

function hBottom(ctx: CanvasRenderingContext2D): number {
  return (ctx.canvas as HTMLCanvasElement).height || 600;
}
