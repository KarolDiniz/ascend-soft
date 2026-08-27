import { MATERIALS, type MaterialId } from '../audio/materials';
import { REACH } from './physics';

export class Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  material: MaterialId;
  moving: boolean;
  moveAmp: number;
  moveSpeed: number;
  movePhase: number;
  fading: boolean;
  /** Countdown only starts after first land (or after grace if never landed). */
  fadeArmed = false;
  fadeLife: number;
  baseX: number;
  landedOnce = false;

  squash = 0;
  squashVel = 0;
  sink = 0;
  alive = true;
  opacity = 1;
  private wobble = Math.random() * Math.PI * 2;

  constructor(opts: {
    x: number;
    y: number;
    w: number;
    material: MaterialId;
    moving?: boolean;
    fading?: boolean;
    moveAmp?: number;
  }) {
    this.x = opts.x;
    this.y = opts.y;
    this.w = opts.w;
    this.h = 16;
    this.material = opts.material;
    this.moving = opts.moving ?? false;
    this.fading = opts.fading ?? false;
    this.fadeLife = REACH.fadeVisibleMin + 0.8;
    this.baseX = opts.x;
    this.moveAmp = opts.moveAmp ?? 12;
    this.moveSpeed = 0.4 + Math.random() * 0.25;
    this.movePhase = Math.random() * Math.PI * 2;
  }

  get left(): number {
    return this.x - this.w / 2;
  }
  get right(): number {
    return this.x + this.w / 2;
  }
  get top(): number {
    return this.y + this.h / 2;
  }
  get bottom(): number {
    return this.y - this.h / 2;
  }

  update(dt: number, time: number): void {
    this.wobble += dt * 2.2;
    if (this.moving) {
      this.x = this.baseX + Math.sin(time * this.moveSpeed + this.movePhase) * this.moveAmp;
    }

    if (this.fading) {
      // Start fade timer only after first land, OR after long grace if somehow skipped
      if (this.landedOnce || this.fadeArmed) {
        this.fadeLife -= dt;
        if (this.fadeLife < 1.1) this.opacity = Math.max(0, this.fadeLife / 1.1);
        if (this.fadeLife <= 0) this.alive = false;
      }
    }

    const k = 95;
    const d = 8.5;
    const force = -this.squash * k - this.squashVel * d;
    this.squashVel += force * dt;
    this.squash += this.squashVel * dt;
    this.sink = Math.max(0, this.squash) * 6.5;
  }

  land(intensity: number): void {
    const mat = MATERIALS[this.material];
    this.squashVel = intensity * 2.8 * mat.squash;
    this.squash = Math.max(this.squash, intensity * 0.45 * mat.squash);
    this.landedOnce = true;
    if (this.fading) {
      this.fadeArmed = true;
      this.fadeLife = Math.min(this.fadeLife, 1.8);
    }
  }

  /** Title-screen idle wobble */
  setPreviewSquash(v: number): void {
    this.squash = v;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    toScreen: (x: number, y: number) => { x: number; y: number },
    time = 0,
  ): void {
    const mat = MATERIALS[this.material];
    const softWobble =
      this.material === 'jelly' || this.material === 'clearSlime' || this.material === 'mochi'
        ? Math.sin(this.wobble) * 0.04
        : 0;
    const squashX = 1 + this.squash * 0.16 + softWobble;
    const squashY = 1 - this.squash * 0.34 - softWobble * 0.5;
    const hw = (this.w / 2) * squashX;
    const hh = (this.h / 2) * squashY;
    const cy = this.y - this.sink;
    const center = toScreen(this.x, cy);
    const left = toScreen(this.x - hw, cy);
    const top = toScreen(this.x, cy + hh);
    const w = (center.x - left.x) * 2;
    const h = Math.max(6, (center.y - top.y) * 2);
    const x = center.x - w / 2;
    const y = center.y - h / 2;
    const r = Math.min(12, h * 0.9);

    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.shadowColor = mat.glow;
    ctx.shadowBlur = 16;

    this.roundRect(ctx, x, y, w, h, r);
    ctx.fillStyle = mat.fill;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = mat.stroke;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    this.drawDetails(ctx, x, y, w, h, r, center.x, time);
    ctx.restore();
  }

  private drawDetails(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    cx: number,
    time: number,
  ): void {
    switch (this.material) {
      case 'jelly': {
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        this.roundRect(ctx, x + w * 0.12, y + 2, w * 0.38, h * 0.38, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.arc(x + w * 0.7, y + h * 0.55, h * 0.22, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case 'butter': {
        ctx.strokeStyle = 'rgba(200, 160, 50, 0.35)';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 3; i++) {
          const ly = y + h * (0.28 + i * 0.22);
          ctx.beginPath();
          ctx.moveTo(x + 6, ly);
          ctx.lineTo(x + w - 6, ly + (i % 2 === 0 ? 1.5 : -1));
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        this.roundRect(ctx, x + 4, y + 2, w * 0.4, h * 0.3, 3);
        ctx.fill();
        break;
      }
      case 'mochi': {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.ellipse(x + w * 0.35, y + h * 0.35, w * 0.22, h * 0.28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(240, 160, 190, 0.25)';
        ctx.beginPath();
        ctx.ellipse(x + w * 0.65, y + h * 0.55, w * 0.12, h * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'chocolate': {
        const g = ctx.createLinearGradient(x, y, x, y + h);
        g.addColorStop(0, 'rgba(255,200,150,0.35)');
        g.addColorStop(0.4, 'rgba(255,200,150,0)');
        g.addColorStop(1, 'rgba(0,0,0,0.15)');
        ctx.fillStyle = g;
        this.roundRect(ctx, x + 1, y + 1, w - 2, h - 2, r - 1);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,180,120,0.2)';
        ctx.beginPath();
        ctx.moveTo(x + 8, y + h * 0.4);
        ctx.quadraticCurveTo(cx, y + h * 0.55, x + w - 8, y + h * 0.35);
        ctx.stroke();
        break;
      }
      case 'citrus': {
        ctx.fillStyle = 'rgba(255, 140, 40, 0.25)';
        for (let i = 0; i < 8; i++) {
          const px = x + 8 + (i / 8) * (w - 16);
          const py = y + h * (0.3 + ((i * 37) % 5) * 0.08);
          ctx.beginPath();
          ctx.arc(px, py, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = 'rgba(255,220,160,0.4)';
        ctx.beginPath();
        ctx.arc(x + w * 0.5, y + h * 0.5, h * 0.35, 0.2, Math.PI * 1.4);
        ctx.stroke();
        break;
      }
      case 'honeycomb': {
        ctx.strokeStyle = 'rgba(160, 100, 30, 0.35)';
        ctx.lineWidth = 1;
        const cell = Math.max(10, w / 6);
        for (let row = 0; row < 2; row++) {
          for (let col = 0; col < 5; col++) {
            const hx = x + 10 + col * cell + (row % 2) * (cell * 0.5);
            const hy = y + h * (0.35 + row * 0.3);
            if (hx > x + w - 8) continue;
            this.hex(ctx, hx, hy, cell * 0.28);
            ctx.stroke();
          }
        }
        ctx.fillStyle = 'rgba(255, 230, 140, 0.25)';
        this.roundRect(ctx, x + w * 0.15, y + 2, w * 0.3, h * 0.3, 3);
        ctx.fill();
        break;
      }
      case 'glycerin': {
        const g = ctx.createLinearGradient(x, y, x + w, y + h);
        g.addColorStop(0, 'rgba(255,255,255,0.55)');
        g.addColorStop(0.45, 'rgba(255,255,255,0.05)');
        g.addColorStop(1, 'rgba(140,200,255,0.3)');
        ctx.fillStyle = g;
        this.roundRect(ctx, x + 2, y + 2, w - 4, h - 4, r - 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        for (let i = 0; i < 5; i++) {
          const gx = x + w * (0.2 + i * 0.15);
          const gy = y + h * (0.3 + Math.sin(time * 2 + i) * 0.15);
          ctx.beginPath();
          ctx.arc(gx, gy, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'whipped': {
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.beginPath();
        ctx.ellipse(x + w * 0.22, y + h * 0.15, w * 0.14, h * 0.55, 0, 0, Math.PI * 2);
        ctx.ellipse(x + w * 0.45, y - h * 0.05, w * 0.16, h * 0.6, 0, 0, Math.PI * 2);
        ctx.ellipse(x + w * 0.7, y + h * 0.1, w * 0.13, h * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 200, 220, 0.2)';
        ctx.beginPath();
        ctx.ellipse(x + w * 0.5, y + h * 0.5, w * 0.2, h * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'kinetic': {
        ctx.fillStyle = 'rgba(150, 110, 80, 0.35)';
        for (let i = 0; i < 18; i++) {
          const px = x + 5 + ((i * 47) % (w - 10));
          const py = y + 3 + ((i * 31) % (h - 4));
          ctx.fillRect(px, py, 1.5, 1.5);
        }
        ctx.fillStyle = 'rgba(255,240,220,0.15)';
        this.roundRect(ctx, x + 3, y + 2, w * 0.45, h * 0.35, 3);
        ctx.fill();
        break;
      }
      case 'iceSoap': {
        const g = ctx.createLinearGradient(x, y, x + w, y + h);
        g.addColorStop(0, 'rgba(255,255,255,0.55)');
        g.addColorStop(0.5, 'rgba(180,220,240,0.15)');
        g.addColorStop(1, 'rgba(120,180,210,0.25)');
        ctx.fillStyle = g;
        this.roundRect(ctx, x + 1, y + 1, w - 2, h - 2, r - 1);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.beginPath();
        ctx.moveTo(x + w * 0.2, y + h * 0.7);
        ctx.lineTo(x + w * 0.45, y + h * 0.25);
        ctx.lineTo(x + w * 0.55, y + h * 0.55);
        ctx.stroke();
        break;
      }
      case 'clearSlime': {
        ctx.strokeStyle = 'rgba(255,255,255,0.45)';
        ctx.lineWidth = 1.2;
        for (const [bx, by, br] of [
          [0.25, 0.4, 0.18],
          [0.55, 0.55, 0.14],
          [0.75, 0.35, 0.12],
        ] as const) {
          ctx.beginPath();
          ctx.arc(x + w * bx, y + h * by, h * br, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        this.roundRect(ctx, x + w * 0.1, y + 2, w * 0.3, h * 0.3, 3);
        ctx.fill();
        break;
      }
      case 'butterSlime': {
        ctx.strokeStyle = 'rgba(220, 140, 100, 0.35)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x + 8, y + h * 0.35);
        ctx.bezierCurveTo(cx, y + h * 0.1, cx, y + h * 0.9, x + w - 8, y + h * 0.45);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 12, y + h * 0.6);
        ctx.quadraticCurveTo(cx, y + h * 0.4, x + w - 10, y + h * 0.65);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.ellipse(x + w * 0.3, y + h * 0.3, w * 0.15, h * 0.2, -0.3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }
  }

  private hex(ctx: CanvasRenderingContext2D, cx: number, cy: number, rad: number): void {
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

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
  ): void {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }
}
