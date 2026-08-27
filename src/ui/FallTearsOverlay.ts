import type { FallMascot } from './FallMascot';
import { enablePixelMode } from '../theme/pixel';

interface Tear {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

interface PanelRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Lágrimas dos olhos caindo ao redor do modal de derrota */
export class FallTearsOverlay {
  private canvas: HTMLCanvasElement;
  private container: HTMLElement;
  private tears: Tear[] = [];
  private spawnTimer = 0;
  private raf = 0;
  private active = false;
  private viewW = 0;
  private viewH = 0;
  private ctx: CanvasRenderingContext2D;

  constructor(
    private mascot: FallMascot,
    canvasId = 'fall-tears',
    containerId = 'fall-tears-overlay',
  ) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.container = document.getElementById(containerId)!;
    this.ctx = this.canvas.getContext('2d')!;
  }

  start(): void {
    if (document.documentElement.classList.contains('reduce-motion')) return;
    this.active = true;
    this.tears.length = 0;
    this.spawnTimer = 0.05;
    if (this.raf) cancelAnimationFrame(this.raf);
    requestAnimationFrame(() => {
      this.resize();
      this.tick();
    });
  }

  stop(): void {
    this.active = false;
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    this.tears.length = 0;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private resize(): void {
    const rect = this.container.getBoundingClientRect();
    this.viewW = Math.max(1, Math.floor(rect.width));
    this.viewH = Math.max(1, Math.floor(rect.height));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.floor(this.viewW * dpr);
    this.canvas.height = Math.floor(this.viewH * dpr);
    this.canvas.style.width = `${this.viewW}px`;
    this.canvas.style.height = `${this.viewH}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private getPanelRect(): PanelRect | null {
    const panel = document.querySelector('.fall-panel');
    if (!panel) return null;
    const overlayRect = this.container.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const pad = 8;
    return {
      left: panelRect.left - overlayRect.left - pad,
      top: panelRect.top - overlayRect.top - pad,
      right: panelRect.right - overlayRect.left + pad,
      bottom: panelRect.bottom - overlayRect.top + pad,
    };
  }

  private isInsidePanel(x: number, y: number, panel: PanelRect): boolean {
    return x >= panel.left && x <= panel.right && y >= panel.top && y <= panel.bottom;
  }

  private spawnFromEyes(): void {
    const eyes = this.mascot.getEyeOriginsInOverlay(this.container);
    if (eyes.length === 0) return;

    const spawnBoth = Math.random() > 0.4;
    const pick = spawnBoth ? eyes : [eyes[Math.random() > 0.5 ? 1 : 0]!];

    for (const eye of pick) {
      const outward = eye.side === 'left' ? -1 : 1;
      this.tears.push({
        x: eye.x + (Math.random() - 0.5) * 2,
        y: eye.y + Math.random() * 2,
        vx: outward * (28 + Math.random() * 22),
        vy: 48 + Math.random() * 36,
        size: Math.random() > 0.45 ? 5 : 4,
      });
    }
  }

  private nudgeAroundPanel(tear: Tear, panel: PanelRect, dt: number): void {
    if (tear.y < panel.top) return;
    if (!this.isInsidePanel(tear.x, tear.y, panel)) return;

    const mid = (panel.left + panel.right) * 0.5;
    const push = tear.x <= mid ? -1 : 1;
    tear.vx = push * Math.max(Math.abs(tear.vx), 52);
    tear.x += push * 90 * dt;
  }

  private tick = (): void => {
    if (!this.active) return;

    const dt = 1 / 60;
    const panel = this.getPanelRect();

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnTimer = 0.14 + Math.random() * 0.12;
      this.spawnFromEyes();
    }

    for (let i = this.tears.length - 1; i >= 0; i--) {
      const tear = this.tears[i]!;
      tear.x += tear.vx * dt;
      tear.y += tear.vy * dt;
      tear.vy += 85 * dt;
      if (panel) this.nudgeAroundPanel(tear, panel, dt);
      if (tear.y > this.viewH + 12 || tear.x < -16 || tear.x > this.viewW + 16) {
        this.tears.splice(i, 1);
      }
    }

    this.draw(panel);
    this.raf = requestAnimationFrame(this.tick);
  };

  private draw(panel: PanelRect | null): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    enablePixelMode(ctx);

    for (const tear of this.tears) {
      if (panel && this.isInsidePanel(tear.x, tear.y, panel)) continue;

      const x = Math.floor(tear.x);
      const y = Math.floor(tear.y);
      const w = tear.size;
      const h = tear.size * 2;
      ctx.fillStyle = 'rgba(126, 200, 232, 0.9)';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(168, 223, 240, 0.65)';
      ctx.fillRect(x, y + h, w, Math.max(2, w - 1));
    }
  }
}
