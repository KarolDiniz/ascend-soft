import type { AudioBus } from '../audio/AudioBus';
import {
  drawPlayerPixelBody,
  drawPlayerPixelFace,
  drawPlayerPixelShadow,
  defaultBodyColors,
  getLeavePleaTearOrigins,
  PLAYER_DRAW_H,
  PLAYER_DRAW_W,
} from '../game/playerPixelArt';
import { getPlayerAppearance } from '../game/playerAppearance';
import { accessoryLayers, drawPlayerAccessory } from '../game/playerAccessories';
import { PASTEL, rgba } from '../theme/pastelPalette';
import { enablePixelMode, fillPx, px } from '../theme/pixel';

interface Tear {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface LeavePose {
  cx: number;
  baseY: number;
  sway: number;
  squash: number;
  stretch: number;
  tilt: number;
}

/** Modal ao tentar fechar a aba — personagem com olhos enormes e lágrimas */
export class LeaveGuard {
  private root: HTMLElement;
  private backdrop: HTMLButtonElement;
  private stayBtn: HTMLButtonElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private audio: AudioBus | null;
  private raf = 0;
  private visible = false;
  private animT = 0;
  private tears: Tear[] = [];
  private tearSpawn = 0;
  private whimpered = false;
  private pose: LeavePose = { cx: 0, baseY: 0, sway: 0, squash: 1, stretch: 1, tilt: 0 };

  constructor(audio?: AudioBus) {
    this.root = document.getElementById('leave-guard')!;
    this.backdrop = document.getElementById('leave-guard-backdrop') as HTMLButtonElement;
    this.stayBtn = document.getElementById('leave-guard-stay') as HTMLButtonElement;
    this.canvas = document.getElementById('leave-guard-mascot') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.audio = audio ?? null;

    const close = () => this.hide();
    this.backdrop.addEventListener('click', close);
    this.stayBtn.addEventListener('click', close);
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.visible) {
        e.preventDefault();
        close();
      }
    });
  }

  promptLeave(): void {
    this.show();
  }

  isVisible(): boolean {
    return this.visible;
  }

  private show(): void {
    if (this.visible) return;
    this.visible = true;
    this.animT = 0;
    this.tears.length = 0;
    this.tearSpawn = 0;
    this.whimpered = false;
    this.root.classList.remove('hidden');
    this.root.setAttribute('aria-hidden', 'false');
    if (this.raf) cancelAnimationFrame(this.raf);
    this.tick();
  }

  hide(): void {
    if (!this.visible) return;
    this.visible = false;
    this.root.classList.add('hidden');
    this.root.setAttribute('aria-hidden', 'true');
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    this.drawIdle();
  }

  private tick = (): void => {
    if (!this.visible) return;
    const dt = 1 / 60;
    this.animT += dt;

    if (!this.whimpered && this.audio) {
      this.whimpered = true;
      this.audio.playFallWhimper();
    }

    this.tearSpawn -= dt;
    if (this.tearSpawn <= 0) {
      this.tearSpawn = 0.14 + Math.random() * 0.12;
      this.spawnTears();
    }

    for (let i = this.tears.length - 1; i >= 0; i--) {
      const t = this.tears[i]!;
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.vy += 36 * dt;
      t.life -= dt;
      if (t.life <= 0 || t.y > this.canvas.height + 10) this.tears.splice(i, 1);
    }

    this.render();
    this.raf = requestAnimationFrame(this.tick);
  };

  private spawnTears(): void {
    const origins = this.localTearOrigins();
    for (const o of origins) {
      this.tears.push({
        x: o.x + (Math.random() - 0.5) * 4,
        y: o.y,
        vx: (Math.random() - 0.5) * 10,
        vy: 18 + Math.random() * 14,
        life: 0.95 + Math.random() * 0.35,
      });
    }
  }

  private localTearOrigins(): { x: number; y: number }[] {
    const local = getLeavePleaTearOrigins(1, 0);
    const { cx, baseY, sway, squash, stretch, tilt } = this.pose;
    const cos = Math.cos(tilt);
    const sin = Math.sin(tilt);
    return local.map(({ x, y }) => ({
      x: cx + sway + x * squash * cos - y * sin * stretch,
      y: baseY + x * squash * sin + y * stretch * cos,
    }));
  }

  private drawIdle(): void {
    enablePixelMode(this.ctx);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private render(): void {
    const ctx = this.ctx;
    const u = 2;
    const W = this.canvas.width;
    const H = this.canvas.height;
    enablePixelMode(ctx);
    ctx.clearRect(0, 0, W, H);

    const t = this.animT;
    const sob = Math.sin(t * 4.6);
    const bob = sob * 3.5 + (sob > 0.82 ? 1.2 : 0);
    const squash = 1 + Math.max(0, sob) * 0.05;
    const stretch = 1 - Math.max(0, sob) * 0.04;
    const tilt = Math.sin(t * 2.3) * 0.04 - 0.03;
    const sway = Math.sin(t * 1.7) * 2.5;
    const earDroop = -Math.max(0, sob) * 1.1 - 0.35;

    const scale = 3.25;
    const bw = px(PLAYER_DRAW_W * scale);
    const bh = px(PLAYER_DRAW_H * scale);
    const cx = W / 2;
    const baseY = H - u * 10 + bob;

    this.pose = { cx, baseY, sway, squash, stretch, tilt };

    const glow = ctx.createRadialGradient(cx, baseY - bh * 0.25, 6, cx, baseY, bw);
    glow.addColorStop(0, rgba(PASTEL.mint, 0.28));
    glow.addColorStop(0.55, rgba(PASTEL.sky, 0.12));
    glow.addColorStop(1, rgba(PASTEL.sky, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    fillPx(ctx, cx - u * 14, H - u * 4, u * 28, u * 2, rgba(PASTEL.inkSoft, 0.1));
    fillPx(ctx, cx - u * 10, H - u * 5, u * 20, u, rgba(PASTEL.inkSoft, 0.06));

    ctx.save();
    ctx.translate(cx + sway, baseY);
    ctx.rotate(tilt);
    ctx.scale(squash, stretch);

    drawPlayerPixelShadow(ctx, bw, bh, 1 + Math.max(0, sob) * 0.05);
    const colors = defaultBodyColors();
    const accessory = getPlayerAppearance().accessory;
    drawPlayerPixelBody(ctx, bw, bh, t, {
      boldOutline: true,
      earWiggle: earDroop,
      colors,
    });
    for (const layer of accessoryLayers(accessory)) {
      if (layer === 'underFace') {
        drawPlayerAccessory(ctx, bw, bh, accessory, 'underFace', t, 1);
      }
    }
    drawPlayerPixelFace(ctx, bw, bh, {
      facing: 1,
      leavePlea: true,
      animT: t,
      titleBold: true,
    });
    for (const layer of accessoryLayers(accessory)) {
      if (layer === 'overFace') {
        drawPlayerAccessory(ctx, bw, bh, accessory, 'overFace', t, 1);
      }
    }
    ctx.restore();

    for (const tear of this.tears) {
      const alpha = Math.min(1, tear.life);
      fillPx(ctx, tear.x, tear.y, u, u * 2, rgba(PASTEL.sky, 0.45 + alpha * 0.45));
      fillPx(ctx, tear.x + u * 0.2, tear.y + u, u, u, rgba(PASTEL.powder, 0.35 + alpha * 0.35));
      fillPx(ctx, tear.x - u * 0.2, tear.y + u * 1.8, u, u, rgba(PASTEL.sky, 0.2 + alpha * 0.25));
    }
  }
}
