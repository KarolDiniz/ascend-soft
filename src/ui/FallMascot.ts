import {
  drawPlayerDefeatCloud,
  drawPlayerDefeatHeadBump,
  drawPlayerPixelBody,
  drawPlayerPixelFace,
  drawPlayerPixelShadow,
  getDefeatEyeTearOrigins,
  PLAYER_DRAW_H,
  PLAYER_DRAW_W,
} from '../game/playerPixelArt';
import { PASTEL, rgba } from '../theme/pastelPalette';
import { enablePixelMode, fillPx, px } from '../theme/pixel';

interface FallMascotPose {
  cx: number;
  baseY: number;
  sway: number;
  squash: number;
  stretch: number;
  tilt: number;
}

/** Personagem triste na tela de derrota */
export class FallMascot {
  private canvas: HTMLCanvasElement;
  private wrap: HTMLElement;
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private active = false;
  private animT = 0;
  private pose: FallMascotPose = { cx: 0, baseY: 0, sway: 0, squash: 1, stretch: 1, tilt: 0 };

  constructor(canvasId = 'fall-mascot', wrapId = 'fall-mascot-wrap') {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.wrap = document.getElementById(wrapId)!;
    this.ctx = this.canvas.getContext('2d')!;
  }

  isActive(): boolean {
    return this.active;
  }

  /** Origem das lágrimas em coordenadas do overlay (px) */
  getEyeOriginsInOverlay(overlay: HTMLElement): { x: number; y: number; side: 'left' | 'right' }[] {
    if (!this.active) return [];

    const local = getDefeatEyeTearOrigins(1, 0);
    const { cx, baseY, sway, squash, stretch, tilt } = this.pose;
    const cos = Math.cos(tilt);
    const sin = Math.sin(tilt);

    const canvasRect = this.canvas.getBoundingClientRect();
    const overlayRect = overlay.getBoundingClientRect();
    const scaleX = canvasRect.width / this.canvas.width;
    const scaleY = canvasRect.height / this.canvas.height;

    return local.map(({ x, y }, i) => {
      const sx = cx + sway + x * squash * cos - y * sin * stretch;
      const sy = baseY + x * squash * sin + y * stretch * cos;
      return {
        x: canvasRect.left - overlayRect.left + sx * scaleX,
        y: canvasRect.top - overlayRect.top + sy * scaleY,
        side: i === 0 ? 'left' : 'right',
      };
    });
  }

  start(): void {
    this.active = true;
    this.animT = 0;
    this.wrap.classList.add('is-crying');
    if (this.raf) cancelAnimationFrame(this.raf);
    this.tick();
  }

  stop(): void {
    this.active = false;
    this.wrap.classList.remove('is-crying');
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private tick = (): void => {
    if (!this.active) return;
    this.animT += 1 / 60;
    this.render();
    this.raf = requestAnimationFrame(this.tick);
  };

  private render(): void {
    const ctx = this.ctx;
    const u = 2;
    const W = this.canvas.width;
    const H = this.canvas.height;
    enablePixelMode(ctx);
    ctx.clearRect(0, 0, W, H);

    const scale = 3.2;
    const bw = px(PLAYER_DRAW_W * scale);
    const bh = px(PLAYER_DRAW_H * scale);
    const cx = W / 2;
    const t = this.animT;
    const sob = Math.sin(t * 4.2);
    const bob = sob * 3 + (sob > 0.85 ? 1.5 : 0);
    const baseY = H - u * 8 + bob;
    const squash = 1 + Math.max(0, sob) * 0.07;
    const stretch = 1 - Math.max(0, sob) * 0.045;
    const tilt = Math.sin(t * 2.1) * 0.045 - 0.035;
    const sway = Math.sin(t * 1.8) * 1.5;

    this.pose = { cx, baseY, sway, squash, stretch, tilt };

    const glow = ctx.createRadialGradient(cx, baseY - bh * 0.2, 4, cx, baseY, bw * 0.9);
    glow.addColorStop(0, rgba(PASTEL.sky, 0.18));
    glow.addColorStop(1, rgba(PASTEL.sky, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    fillPx(ctx, cx - u * 12, H - u * 3, u * 24, u * 2, rgba(PASTEL.inkSoft, 0.1));
    fillPx(ctx, cx - u * 9, H - u * 4, u * 18, u, rgba(PASTEL.inkSoft, 0.07));

    ctx.save();
    ctx.translate(cx + sway, baseY);
    ctx.rotate(tilt);
    ctx.scale(squash, stretch);

    drawPlayerPixelShadow(ctx, bw, bh, 1 + Math.max(0, sob) * 0.06);
    drawPlayerPixelBody(ctx, bw, bh, this.animT, {
      solid: true,
      earWiggle: -Math.max(0, sob) * 0.9,
    });
    drawPlayerDefeatHeadBump(ctx, bw, bh, this.animT);
    drawPlayerDefeatCloud(ctx, bw, bh, this.animT);
    drawPlayerPixelFace(ctx, bw, bh, {
      facing: 1,
      animT: this.animT,
      defeatSad: true,
    });
    ctx.restore();
  }
}
