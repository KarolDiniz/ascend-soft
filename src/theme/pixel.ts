/**
 * Ascend Soft — Pixel Soft aesthetic helpers.
 * Nearest-neighbor, snapped coords, chunky fills. Keep animations springy in logic;
 * only the *draw* snaps to the pixel grid for that crunchy feel.
 */

export const PIXEL = {
  /** Logical “pixel” size on screen (visual chunkiness) */
  unit: 2,
  font: "10px 'Press Start 2P', monospace",
  fontLg: "14px 'Press Start 2P', monospace",
} as const;

export function px(n: number, unit = PIXEL.unit): number {
  return Math.round(n / unit) * unit;
}

export function snapPt(x: number, y: number, unit = PIXEL.unit): { x: number; y: number } {
  return { x: px(x, unit), y: px(y, unit) };
}

/** Call once at the start of each frame for crisp sprites & fills */
export function enablePixelMode(ctx: CanvasRenderingContext2D): void {
  ctx.imageSmoothingEnabled = false;
  // Vendor prefixes for older WebKit
  const anyCtx = ctx as CanvasRenderingContext2D & {
    mozImageSmoothingEnabled?: boolean;
    webkitImageSmoothingEnabled?: boolean;
  };
  anyCtx.mozImageSmoothingEnabled = false;
  anyCtx.webkitImageSmoothingEnabled = false;
}

export function fillPx(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(px(x), px(y), Math.max(PIXEL.unit, px(w)), Math.max(PIXEL.unit, px(h)));
}

/** Draw a soft circle as stepped rings (pixel blob) */
export function fillPixelCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
): void {
  const u = PIXEL.unit;
  const R = Math.max(u, px(r));
  ctx.fillStyle = color;
  for (let dy = -R; dy <= R; dy += u) {
    for (let dx = -R; dx <= R; dx += u) {
      // Squircle-ish for cute blob (slightly softer than pure circle)
      const d = (dx * dx + dy * dy) / (R * R);
      if (d <= 1.05) {
        ctx.fillRect(px(cx + dx), px(cy + dy), u, u);
      }
    }
  }
}

/** Hollow pixel ring (land juice) */
export function strokePixelRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color: string,
  thickness = PIXEL.unit,
): void {
  const u = PIXEL.unit;
  const R = Math.max(u * 2, px(r));
  const Ri = Math.max(0, R - thickness);
  ctx.fillStyle = color;
  for (let dy = -R; dy <= R; dy += u) {
    for (let dx = -R; dx <= R; dx += u) {
      const d2 = dx * dx + dy * dy;
      if (d2 <= R * R && d2 >= Ri * Ri) {
        ctx.fillRect(px(cx + dx), px(cy + dy), u, u);
      }
    }
  }
}
