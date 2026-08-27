import { PASTEL, PLAYER_PASTEL, rgba } from '../theme/pastelPalette';
import { enablePixelMode, fillPx, px } from '../theme/pixel';

/** Bonequinho pixelado no banner — animação de fala sincronizada com o murmúrio */
export class ToastSpeaker {
  private canvas: HTMLCanvasElement;
  private panel: HTMLElement;
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private active = false;
  private startTime = 0;
  private duration = 5600;

  constructor(canvasId = 'toast-speaker', panelId = 'toast-speaker-panel') {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.panel = document.getElementById(panelId)!;
    this.ctx = this.canvas.getContext('2d')!;
  }

  start(durationMs = 5600): void {
    this.active = true;
    this.startTime = performance.now();
    this.duration = durationMs;
    this.panel.classList.add('is-talking');
    if (this.raf) cancelAnimationFrame(this.raf);
    this.tick();
  }

  stop(): void {
    this.active = false;
    this.panel.classList.remove('is-talking');
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    this.draw(0, false, 0);
  }

  private tick = (): void => {
    if (!this.active) return;
    const elapsed = performance.now() - this.startTime;
    if (elapsed >= this.duration) {
      this.stop();
      return;
    }
    const t = elapsed / 1000;
    const syllable = Math.floor(elapsed / 135);
    const mouthOpen = syllable % 2 === 0;
    const bob = Math.sin(t * 5.5) * 1.5;
    const armWave = Math.sin(t * 4.2 + syllable * 0.4) * 0.6;
    this.draw(bob, mouthOpen, armWave);
    this.raf = requestAnimationFrame(this.tick);
  };

  private draw(bob: number, mouthOpen: boolean, armWave: number): void {
    const ctx = this.ctx;
    const u = 2;
    const W = this.canvas.width;
    const H = this.canvas.height;
    enablePixelMode(ctx);
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const baseY = H - u * 4 + bob;
    const bw = 28;
    const bh = 26;

    ctx.save();
    ctx.translate(cx, baseY);

    // Sombra
    fillPx(ctx, -bw * 0.35, bh * 0.38, bw * 0.7, u * 2, PLAYER_PASTEL.shadow);

    // Corpo (mesmo blob do jogador)
    const rows: [number, number][] = [
      [0.45, -0.42],
      [0.7, -0.3],
      [0.88, -0.14],
      [0.95, 0.02],
      [0.95, 0.18],
      [0.82, 0.32],
      [0.55, 0.42],
    ];
    for (const [ww, yy] of rows) {
      const rw = px(bw * ww, u);
      const ry = px(bh * yy, u);
      fillPx(ctx, -rw / 2, ry, rw, u * 2, PLAYER_PASTEL.bodyMid);
    }
    fillPx(ctx, -bw * 0.28, -bh * 0.28, bw * 0.55, u * 2, PLAYER_PASTEL.bodyTop);
    fillPx(ctx, -bw * 0.35, bh * 0.28, bw * 0.7, u * 2, PLAYER_PASTEL.bodyBot);
    fillPx(ctx, -bw * 0.42, -bh * 0.1, u, u, rgba(PASTEL.inkSoft, 0.35));
    fillPx(ctx, bw * 0.38, -bh * 0.1, u, u, rgba(PASTEL.inkSoft, 0.35));

    // Brilho
    fillPx(ctx, -bw * 0.22, -bh * 0.28, u * 3, u * 2, rgba(PASTEL.white, 0.75));

    // Bochechas
    fillPx(ctx, -u * 4, u, u * 2, u, PLAYER_PASTEL.blush);
    fillPx(ctx, u * 2, u, u * 2, u, PLAYER_PASTEL.blush);

    // Olhos — pisca ocasional
    const blink = Math.floor(performance.now() / 2800) % 5 === 0;
    if (blink) {
      fillPx(ctx, -u * 5, -u, u * 3, u, rgba(PASTEL.ink, 0.55));
      fillPx(ctx, u * 2, -u, u * 3, u, rgba(PASTEL.ink, 0.55));
    } else {
      fillPx(ctx, -u * 5, -u * 2, u * 2, u * 3, rgba(PASTEL.ink, 0.55));
      fillPx(ctx, u * 3, -u * 2, u * 2, u * 3, rgba(PASTEL.ink, 0.55));
      fillPx(ctx, -u * 4, -u * 3, u, u, PASTEL.white);
      fillPx(ctx, u * 4, -u * 3, u, u, PASTEL.white);
    }

    // Boca — abre/fecha ao falar
    if (mouthOpen) {
      fillPx(ctx, -u * 3, u * 2, u * 6, u * 2, rgba(PASTEL.ink, 0.45));
      fillPx(ctx, -u * 2, u * 3, u * 4, u, rgba(PASTEL.inkSoft, 0.35));
    } else {
      fillPx(ctx, -u * 2, u * 2.5, u * 4, u, rgba(PASTEL.ink, 0.35));
    }

    // Mãozinhas gesticulando enquanto fala
    const armY = u * 3 + armWave * u;
    fillPx(ctx, -bw * 0.52, armY, u * 2, u * 2, PLAYER_PASTEL.bodyMid);
    fillPx(ctx, bw * 0.38, armY - u, u * 2, u * 2, PLAYER_PASTEL.bodyMid);

    ctx.restore();

    // Notinhas / vibração de voz ao lado da boca
    if (mouthOpen) {
      const side = syllableFrame() % 3;
      const nx = cx + bw * 0.38 + side * u * 2;
      const ny = baseY - bh * 0.05 + bob;
      fillPx(ctx, nx, ny, u, u, rgba(PASTEL.butter, 0.85));
      fillPx(ctx, nx + u * 2, ny - u, u, u, rgba(PASTEL.butter, 0.55));
      if (side === 1) fillPx(ctx, nx + u, ny + u, u, u, rgba(PASTEL.peach, 0.5));
    }
  }
}

function syllableFrame(): number {
  return Math.floor(performance.now() / 135);
}
