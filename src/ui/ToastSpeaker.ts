import {
  drawPlayerPixelBody,
  drawPlayerPixelFace,
  drawPlayerPixelShadow,
  PLAYER_DRAW_H,
  PLAYER_DRAW_W,
} from '../game/playerPixelArt';
import { PASTEL, rgba } from '../theme/pastelPalette';
import { enablePixelMode, fillPx, px } from '../theme/pixel';

/** Bonequinho pixelado no banner — mesma arte do jogador, animação de fala */
export class ToastSpeaker {
  private canvas: HTMLCanvasElement;
  private panel: HTMLElement;
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private active = false;
  private startTime = 0;
  private duration = 5600;
  private blinkT = -2.5;
  private animT = 0;

  constructor(canvasId = 'toast-speaker', panelId = 'toast-speaker-panel') {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.panel = document.getElementById(panelId)!;
    this.ctx = this.canvas.getContext('2d')!;
  }

  start(durationMs = 5600): void {
    this.active = true;
    this.startTime = performance.now();
    this.duration = durationMs;
    this.animT = 0;
    this.blinkT = 0.12 + Math.random() * 0.08;
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
    this.drawIdle();
  }

  private tick = (): void => {
    if (!this.active) return;
    const elapsed = performance.now() - this.startTime;
    if (elapsed >= this.duration) {
      this.stop();
      return;
    }
    const dt = 1 / 60;
    this.animT += dt;
    this.blinkT -= dt;
    if (this.blinkT < -2.2) this.blinkT = 0.12 + Math.random() * 0.08;

    const t = elapsed / 1000;
    const syllable = Math.floor(elapsed / 135);
    const mouthOpen = syllable % 2 === 0;
    const bob = Math.sin(t * 5.5) * 2;
    this.draw(mouthOpen, bob, this.blinkT > 0);
    this.raf = requestAnimationFrame(this.tick);
  };

  private drawIdle(): void {
    this.draw(false, 0, false);
  }

  private draw(mouthOpen: boolean, bob: number, blinking: boolean): void {
    const ctx = this.ctx;
    const u = 2;
    const W = this.canvas.width;
    const H = this.canvas.height;
    enablePixelMode(ctx);
    ctx.clearRect(0, 0, W, H);

    const scale = 3;
    const bw = px(PLAYER_DRAW_W * scale);
    const bh = px(PLAYER_DRAW_H * scale);
    const cx = W / 2;
    const baseY = H - u * 6 + bob;

    fillPx(ctx, cx - u * 12, H - u * 3, u * 24, u * 2, rgba(PASTEL.inkSoft, 0.1));
    fillPx(ctx, cx - u * 9, H - u * 4, u * 18, u, rgba(PASTEL.inkSoft, 0.07));

    ctx.save();
    ctx.translate(cx, baseY);
    drawPlayerPixelShadow(ctx, bw, bh);
    drawPlayerPixelBody(ctx, bw, bh);
    drawPlayerPixelFace(ctx, bw, bh, {
      facing: 1,
      blinking,
      mouthOpen,
      animT: this.animT,
      showSparkle: true,
    });
    ctx.restore();
  }
}
