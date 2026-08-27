/**
 * Cheap soft-focus: paint at low res, then bilinear upscale.
 * Looks softly blurred without per-frame canvas filter (which freezes the game).
 */
export class SoftPass {
  private canvas = document.createElement('canvas');
  private ctx: CanvasRenderingContext2D;
  private bw = 0;
  private bh = 0;
  /** Lower = softer (and cheaper). ~0.4 reads as mild blur. */
  private scale: number;

  constructor(scale = 0.4) {
    const ctx = this.canvas.getContext('2d', { alpha: true });
    if (!ctx) throw new Error('2d unavailable');
    this.ctx = ctx;
    this.scale = scale;
  }

  paint(
    main: CanvasRenderingContext2D,
    w: number,
    h: number,
    paint: (ctx: CanvasRenderingContext2D) => void,
    alpha = 1,
  ): void {
    const bw = Math.max(1, Math.ceil(w * this.scale));
    const bh = Math.max(1, Math.ceil(h * this.scale));
    if (this.bw !== bw || this.bh !== bh) {
      this.canvas.width = bw;
      this.canvas.height = bh;
      this.bw = bw;
      this.bh = bh;
    }

    const s = this.ctx;
    s.setTransform(1, 0, 0, 1, 0, 0);
    s.clearRect(0, 0, bw, bh);
    s.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    s.imageSmoothingEnabled = false;
    paint(s);

    main.save();
    main.globalAlpha = alpha;
    main.imageSmoothingEnabled = true;
    main.drawImage(this.canvas, 0, 0, bw, bh, 0, 0, w, h);
    main.restore();
  }
}
