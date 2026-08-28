import { accessoryLayers, drawPlayerAccessory } from '../game/playerAccessories';
import { drawPlayerHairIfAny } from '../game/playerHair';
import {
  drawPlayerPixelBody,
  drawPlayerPixelFace,
  drawPlayerPixelShadow,
  PLAYER_DRAW_H,
  PLAYER_DRAW_W,
} from '../game/playerPixelArt';
import {
  resolveBodyColors,
  type PlayerAppearance,
} from '../game/playerAppearance';
import { PASTEL, rgba } from '../theme/pastelPalette';
import { enablePixelMode, fillPx, px } from '../theme/pixel';

/** Preview animado do blob no editor de personagem */
export class CharacterPreview {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private raf = 0;
  private active = false;
  private animT = 0;
  private blinkT = 0;
  private appearance: PlayerAppearance;
  private squash = 1;
  private stretch = 1;
  private mouthOpen = false;
  private mouthT = 0;
  private sparkle = 0;

  constructor(canvasId = 'char-preview') {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.appearance = { bodyColor: 'sky', hairStyle: 'pigtails', accessory: 'none' };
  }

  setAppearance(app: PlayerAppearance): void {
    this.appearance = app;
  }

  /** Squash feliz ao trocar tom ou acessório */
  nudge(): void {
    this.squash = 0.76;
    this.stretch = 1.24;
    this.mouthOpen = true;
    this.mouthT = 0.32;
    this.sparkle = 0.55;
  }

  start(app: PlayerAppearance): void {
    this.appearance = app;
    this.active = true;
    this.animT = 0;
    this.blinkT = 0.4 + Math.random() * 0.3;
    this.squash = 1;
    this.stretch = 1;
    this.mouthOpen = false;
    this.mouthT = 0;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.tick();
  }

  stop(): void {
    this.active = false;
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    this.drawFrame(0);
  }

  private tick = (): void => {
    if (!this.active) return;
    const dt = 1 / 60;
    this.animT += dt;
    this.blinkT -= dt;
    if (this.blinkT < -2) this.blinkT = 0.1 + Math.random() * 0.12;

    this.mouthT -= dt;
    if (this.mouthT <= 0) this.mouthOpen = false;

    this.sparkle = Math.max(0, this.sparkle - dt * 1.4);

    this.squash += (1 - this.squash) * 0.16;
    this.stretch += (1 - this.stretch) * 0.16;

    this.drawFrame(this.animT);
    this.raf = requestAnimationFrame(this.tick);
  };

  private drawFrame(t: number): void {
    const ctx = this.ctx;
    const u = 2;
    const W = this.canvas.width;
    const H = this.canvas.height;
    enablePixelMode(ctx);
    ctx.clearRect(0, 0, W, H);

    const colors = resolveBodyColors(this.appearance);
    const accessory = this.appearance.accessory;
    const scale = 3.35;
    const bw = px(PLAYER_DRAW_W * scale);
    const bh = px(PLAYER_DRAW_H * scale);
    const cx = W / 2;
    const bob = Math.sin(t * 4.2) * 2.8;
    const sway = Math.sin(t * 2.4) * 2.2;
    const baseY = H - u * 5 + bob;

    fillPx(ctx, cx - u * 14, H - u * 3, u * 28, u * 2, rgba(PASTEL.inkSoft, 0.09));
    fillPx(ctx, cx - u * 10, H - u * 4, u * 20, u, rgba(PASTEL.inkSoft, 0.06));

    ctx.save();
    ctx.translate(cx + sway, baseY);
    ctx.scale(this.squash, this.stretch);

    drawPlayerPixelShadow(ctx, bw, bh, 1 + this.sparkle * 0.06);
    drawPlayerPixelBody(ctx, bw, bh, t, {
      boldOutline: true,
      colors,
    });

    drawPlayerHairIfAny(ctx, bw, bh, this.appearance, t);

    for (const layer of accessoryLayers(accessory)) {
      if (layer === 'underFace') {
        drawPlayerAccessory(ctx, bw, bh, accessory, 'underFace', t, 1);
      }
    }

    drawPlayerPixelFace(ctx, bw, bh, {
      facing: 1,
      blinking: this.blinkT > 0,
      animT: t,
      showSparkle: true,
      mouthOpen: this.mouthOpen,
      excited: this.mouthOpen,
      titleBold: true,
    });

    for (const layer of accessoryLayers(accessory)) {
      if (layer === 'overFace') {
        drawPlayerAccessory(ctx, bw, bh, accessory, 'overFace', t, 1);
      }
    }

    if (this.sparkle > 0.08) {
      const sx = Math.sin(t * 12) * bw * 0.22;
      const sy = -bh * 0.38 + Math.cos(t * 10) * 3;
      fillPx(ctx, sx - u, sy, u, u, rgba(PASTEL.butter, 0.45 + this.sparkle * 0.4));
      fillPx(ctx, sx + u * 3, sy + u * 2, u, u, rgba(PASTEL.white, 0.35 + this.sparkle * 0.35));
    }

    ctx.restore();
  }
}
