import {
  drawPlayerPixelBody,
  drawPlayerPixelFace,
  drawPlayerPixelShadow,
  PLAYER_DRAW_H,
  PLAYER_DRAW_W,
} from '../game/playerPixelArt';
import { PASTEL, rgba } from '../theme/pastelPalette';
import { enablePixelMode, fillPx, px } from '../theme/pixel';

interface BannerPose {
  mouthOpen: boolean;
  bob: number;
  sway: number;
  squash: number;
  stretch: number;
  tilt: number;
  blinking: boolean;
  facing: number;
  look: number;
  earWiggle: number;
  shadowScale: number;
  jumpPop: number;
}

/** Bonequinho pixelado no banner — cor lisa + animações de fala */
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
  private mouthOpen = false;
  private ttsDriven = false;

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
    this.mouthOpen = false;
    this.ttsDriven = false;
    this.blinkT = 0.12 + Math.random() * 0.08;
    this.panel.classList.add('is-talking');
    if (this.raf) cancelAnimationFrame(this.raf);
    this.tick();
  }

  /** Boca sincronizada com TTS */
  setMouthOpen(open: boolean): void {
    this.ttsDriven = true;
    this.mouthOpen = open;
  }

  stop(): void {
    this.active = false;
    this.mouthOpen = false;
    this.ttsDriven = false;
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
    const syllable = Math.floor(elapsed / 120);
    const mouthOpen = this.ttsDriven ? this.mouthOpen : syllable % 2 === 0;
    const talkPulse = mouthOpen ? 1.25 : 0.85;

    this.render({
      mouthOpen,
      bob: Math.sin(t * 6.2) * 3.5 + (mouthOpen ? -1.5 : 0),
      sway: Math.sin(t * 2.8) * 3,
      squash: 1 + Math.sin(t * 9) * 0.07 * talkPulse,
      stretch: 1 - Math.sin(t * 9) * 0.05 * talkPulse + Math.sin(t * 2) * 0.03,
      tilt: Math.sin(t * 3.4) * 0.07,
      blinking: this.blinkT > 0,
      facing: Math.sin(t * 1.35) >= 0 ? 1 : -1,
      look: Math.round(Math.sin(t * 4.1) * 1.2),
      earWiggle: Math.sin(t * 10) * (mouthOpen ? 1 : 0.35),
      shadowScale: 1 + Math.sin(t * 6.2) * 0.08,
      jumpPop: mouthOpen ? Math.max(0, Math.sin(t * 18) * 2) : 0,
    });

    this.raf = requestAnimationFrame(this.tick);
  };

  private drawIdle(): void {
    this.render({
      mouthOpen: false,
      bob: 0,
      sway: 0,
      squash: 1,
      stretch: 1,
      tilt: 0,
      blinking: false,
      facing: 1,
      look: 0,
      earWiggle: 0,
      shadowScale: 1,
      jumpPop: 0,
    });
  }

  private render(pose: BannerPose): void {
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
    const baseY = H - u * 6 + pose.bob - pose.jumpPop;

    fillPx(ctx, cx - u * 12, H - u * 3, u * 24, u * 2, rgba(PASTEL.inkSoft, 0.1));
    fillPx(ctx, cx - u * 9, H - u * 4, u * 18, u, rgba(PASTEL.inkSoft, 0.07));

    ctx.save();
    ctx.translate(cx + pose.sway, baseY);
    ctx.rotate(pose.tilt);
    ctx.scale(pose.squash, pose.stretch);

    drawPlayerPixelShadow(ctx, bw, bh, pose.shadowScale);
    drawPlayerPixelBody(ctx, bw, bh, this.animT, {
      solid: true,
      earWiggle: pose.earWiggle,
    });
    drawPlayerPixelFace(ctx, bw, bh, {
      facing: pose.facing,
      look: pose.look,
      blinking: pose.blinking,
      mouthOpen: pose.mouthOpen,
      animT: this.animT,
      showSparkle: true,
      excited: this.active,
    });
    ctx.restore();
  }
}
