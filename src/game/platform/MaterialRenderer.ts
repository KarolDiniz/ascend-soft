import type { MaterialDef } from '../../audio/materials';
import { traceShape } from './PlatformShape';
import type { PlatformDrawState, PlatformVariant } from './types';

function seeded(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function renderPlatform(
  ctx: CanvasRenderingContext2D,
  variant: PlatformVariant,
  mat: MaterialDef,
  s: PlatformDrawState,
): void {
  ctx.save();
  ctx.globalAlpha = s.opacity;

  // Glow under silhouette
  ctx.shadowColor = mat.glow;
  ctx.shadowBlur = 18;
  traceShape(ctx, variant, s);
  ctx.fillStyle = mat.fill;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Clip to silhouette for inner layers
  traceShape(ctx, variant, s);
  ctx.clip();

  drawBaseGradient(ctx, variant, mat, s);
  drawTexture(ctx, variant, mat, s);
  drawSpecular(ctx, variant, s);
  drawDetail(ctx, variant, mat, s);

  ctx.restore();

  // Outline on top
  ctx.save();
  ctx.globalAlpha = s.opacity;
  traceShape(ctx, variant, s);
  ctx.strokeStyle = mat.stroke;
  ctx.lineWidth = variant.includes('whipped') ? 1.2 : 1.8;
  ctx.stroke();
  ctx.restore();
}

function drawBaseGradient(
  ctx: CanvasRenderingContext2D,
  variant: PlatformVariant,
  mat: MaterialDef,
  s: PlatformDrawState,
): void {
  const { cx, surfaceY, w, h } = s;
  const depth = h * 1.4;
  const g = ctx.createLinearGradient(cx, surfaceY, cx, surfaceY + depth);

  if (variant.startsWith('chocolate') || variant.startsWith('honey')) {
    g.addColorStop(0, lighten(mat.fill, 0.15));
    g.addColorStop(0.35, mat.fill);
    g.addColorStop(1, darken(mat.fill, 0.2));
  } else if (variant.startsWith('glycerin') || variant.startsWith('ice')) {
    g.addColorStop(0, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.4, mat.fill);
    g.addColorStop(1, darken(mat.fill, 0.1));
  } else if (variant.startsWith('jelly') || variant.startsWith('slime')) {
    g.addColorStop(0, lighten(mat.fill, 0.25));
    g.addColorStop(0.5, mat.fill);
    g.addColorStop(1, darken(mat.fill, 0.08));
  } else {
    g.addColorStop(0, lighten(mat.fill, 0.12));
    g.addColorStop(0.55, mat.fill);
    g.addColorStop(1, darken(mat.fill, 0.12));
  }

  ctx.fillStyle = g;
  ctx.fillRect(s.x - w, surfaceY - h, w * 3, depth + h * 2);
}

function drawTexture(
  ctx: CanvasRenderingContext2D,
  variant: PlatformVariant,
  _mat: MaterialDef,
  s: PlatformDrawState,
): void {
  const { cx, surfaceY, w, h, seed, time } = s;
  const spread = w * 1.05;

  if (variant.startsWith('butter')) {
    ctx.strokeStyle = 'rgba(180, 140, 40, 0.35)';
    ctx.lineWidth = 1.3;
    for (let i = 0; i < 4; i++) {
      const ly = surfaceY + h * (0.35 + i * 0.22);
      ctx.beginPath();
      ctx.moveTo(cx - spread * 0.4, ly);
      ctx.lineTo(cx + spread * 0.42, ly + (i % 2 === 0 ? 2 : -1.5));
      ctx.stroke();
    }
    if (variant === 'butter_curl') {
      ctx.strokeStyle = 'rgba(220, 180, 60, 0.4)';
      ctx.beginPath();
      ctx.arc(cx, surfaceY + h * 0.5, spread * 0.25, 0.2, Math.PI * 1.2);
      ctx.stroke();
    }
  } else if (variant.startsWith('citrus')) {
    ctx.strokeStyle = 'rgba(255, 240, 200, 0.55)';
    ctx.lineWidth = 1.2;
    const segments = variant === 'citrus_wedge' ? 4 : 8;
    for (let i = 0; i < segments; i++) {
      const a = Math.PI + (Math.PI / segments) * i;
      ctx.beginPath();
      ctx.moveTo(cx, surfaceY + h * 0.55);
      ctx.lineTo(cx + Math.cos(a) * spread * 0.45, surfaceY + h * 0.55 + Math.sin(a) * h * 0.35);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(255, 160, 60, 0.3)';
    for (let i = 0; i < 12; i++) {
      const px = cx - spread * 0.35 + seeded(seed, i) * spread * 0.7;
      const py = surfaceY + h * (0.35 + seeded(seed, i + 20) * 0.5);
      ctx.beginPath();
      ctx.arc(px, py, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (variant.startsWith('honey')) {
    ctx.strokeStyle = 'rgba(140, 90, 20, 0.4)';
    ctx.lineWidth = 1;
    const cell = spread / 5;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 6; col++) {
        const hx = cx - spread * 0.4 + col * cell + (row % 2) * (cell * 0.5);
        const hy = surfaceY + h * (0.35 + row * 0.22);
        hex(ctx, hx, hy, cell * 0.28);
        ctx.stroke();
      }
    }
  } else if (variant.startsWith('kinetic')) {
    ctx.fillStyle = 'rgba(130, 95, 70, 0.45)';
    for (let i = 0; i < 28; i++) {
      const px = cx - spread * 0.45 + seeded(seed, i) * spread * 0.9;
      const py = surfaceY + h * (0.2 + seeded(seed, i + 30) * 0.9);
      ctx.fillRect(px, py, 1.8, 1.8);
    }
  } else if (variant.startsWith('whipped')) {
    ctx.fillStyle = 'rgba(255, 220, 235, 0.35)';
    for (let i = 0; i < 6; i++) {
      const px = cx - spread * 0.35 + i * (spread * 0.12);
      ctx.beginPath();
      ctx.ellipse(px, surfaceY + h * 0.25, spread * 0.06, h * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (variant.startsWith('glycerin') || variant.startsWith('ice')) {
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    for (let i = 0; i < 6; i++) {
      const gx = cx - spread * 0.3 + i * spread * 0.12;
      const gy = surfaceY + h * (0.25 + Math.sin(time * 2 + i + seed) * 0.12);
      ctx.beginPath();
      ctx.arc(gx, gy, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    if (variant.startsWith('ice')) {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - spread * 0.2, surfaceY + h * 0.7);
      ctx.lineTo(cx, surfaceY + h * 0.25);
      ctx.lineTo(cx + spread * 0.15, surfaceY + h * 0.55);
      ctx.stroke();
    }
  } else if (variant.startsWith('jelly') || variant.startsWith('slime')) {
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    for (const [ox, oy, r] of [
      [-0.2, 0.35, 0.18],
      [0.15, 0.5, 0.14],
      [0.28, 0.3, 0.12],
    ] as const) {
      ctx.beginPath();
      ctx.arc(cx + spread * ox, surfaceY + h * oy, h * r, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (variant.startsWith('mochi')) {
    ctx.fillStyle = 'rgba(255, 200, 220, 0.35)';
    ctx.beginPath();
    ctx.ellipse(cx - spread * 0.15, surfaceY + h * 0.35, spread * 0.12, h * 0.18, -0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (variant.startsWith('chocolate')) {
    ctx.strokeStyle = 'rgba(255, 180, 120, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - spread * 0.35, surfaceY + h * 0.45);
    ctx.quadraticCurveTo(cx, surfaceY + h * 0.6, cx + spread * 0.35, surfaceY + h * 0.4);
    ctx.stroke();
  } else if (variant.startsWith('butterSlime')) {
    ctx.strokeStyle = 'rgba(200, 120, 80, 0.35)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx - spread * 0.35, surfaceY + h * 0.35);
    ctx.bezierCurveTo(cx, surfaceY + h * 0.1, cx, surfaceY + h * 0.85, cx + spread * 0.35, surfaceY + h * 0.4);
    ctx.stroke();
  }
}

function drawSpecular(
  ctx: CanvasRenderingContext2D,
  variant: PlatformVariant,
  s: PlatformDrawState,
): void {
  const { cx, surfaceY, w, h } = s;
  const spread = w * 1.05;

  if (variant.startsWith('glycerin') || variant.startsWith('ice') || variant.startsWith('jelly')) {
    const g = ctx.createLinearGradient(cx - spread * 0.3, surfaceY, cx + spread * 0.2, surfaceY + h);
    g.addColorStop(0, 'rgba(255,255,255,0.65)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.08)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - spread * 0.5, surfaceY, spread, h * 1.5);
  } else if (variant.startsWith('chocolate') || variant.startsWith('butter')) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.ellipse(cx - spread * 0.2, surfaceY + h * 0.18, spread * 0.22, h * 0.12, -0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (variant.startsWith('whipped') || variant.startsWith('mochi')) {
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.ellipse(cx - spread * 0.15, surfaceY + h * 0.12, spread * 0.18, h * 0.1, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDetail(
  ctx: CanvasRenderingContext2D,
  variant: PlatformVariant,
  mat: MaterialDef,
  s: PlatformDrawState,
): void {
  const { cx, surfaceY, w, h, seed } = s;
  const spread = w * 1.05;

  // Surface highlight line (wet top)
  if (
    variant.startsWith('jelly') ||
    variant.startsWith('slime') ||
    variant.startsWith('honey') ||
    variant.startsWith('chocolate')
  ) {
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - spread * 0.38, surfaceY + 2);
    ctx.quadraticCurveTo(cx, surfaceY - 1, cx + spread * 0.38, surfaceY + 2);
    ctx.stroke();
  }

  if (variant === 'butter_pat') {
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.ellipse(cx, surfaceY + h * 0.15, spread * 0.15, h * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (variant === 'honey_drip') {
    ctx.fillStyle = darken(mat.fill, 0.15);
    const dx = cx + (seeded(seed, 5) - 0.5) * spread * 0.25;
    ctx.beginPath();
    ctx.ellipse(dx, surfaceY + h * 1.1, 5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (variant === 'slime_puddle' || variant === 'slime_blob') {
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.arc(cx - spread * 0.2, surfaceY + h * 0.2, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function hex(ctx: CanvasRenderingContext2D, cx: number, cy: number, rad: number): void {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function lighten(rgba: string, amt: number): string {
  const m = rgba.match(/[\d.]+/g);
  if (!m || m.length < 3) return rgba;
  const r = Math.min(255, Number(m[0]) + 255 * amt);
  const g = Math.min(255, Number(m[1]) + 255 * amt);
  const b = Math.min(255, Number(m[2]) + 255 * amt);
  const a = m[3] ?? '1';
  return `rgba(${r | 0},${g | 0},${b | 0},${a})`;
}

function darken(rgba: string, amt: number): string {
  const m = rgba.match(/[\d.]+/g);
  if (!m || m.length < 3) return rgba;
  const r = Math.max(0, Number(m[0]) * (1 - amt));
  const g = Math.max(0, Number(m[1]) * (1 - amt));
  const b = Math.max(0, Number(m[2]) * (1 - amt));
  const a = m[3] ?? '1';
  return `rgba(${r | 0},${g | 0},${b | 0},${a})`;
}
