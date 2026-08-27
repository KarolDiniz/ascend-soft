import type { ParticleStyle } from '../audio/materials';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: ParticleStyle | 'ring';
  active: boolean;
  rot?: number;
  spin?: number;
}

const POOL = 180;

export class Particles {
  private items: Particle[] = [];
  private rings: { x: number; y: number; life: number; maxLife: number; color: string }[] = [];

  constructor() {
    for (let i = 0; i < POOL; i++) {
      this.items.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        size: 2,
        color: '#fff',
        type: 'crumb',
        active: false,
      });
    }
  }

  private alloc(): Particle | null {
    for (const p of this.items) {
      if (!p.active) return p;
    }
    return null;
  }

  burst(
    x: number,
    y: number,
    color: string,
    count: number,
    style: ParticleStyle = 'crumb',
    perfect = false,
  ): void {
    const n = Math.min(count + (perfect ? 5 : 0), 24);
    for (let i = 0; i < n; i++) {
      const p = this.alloc();
      if (!p) break;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
      const speed = 18 + Math.random() * (perfect ? 65 : 40);
      p.active = true;
      p.x = x + (Math.random() - 0.5) * 18;
      p.y = y + Math.random() * 3;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed + 8;
      p.life = 0.55 + Math.random() * 0.75;
      p.maxLife = p.life;
      p.size = style === 'glitter' || style === 'spark' ? 2 + Math.random() * 2 : 3 + Math.random() * 4;
      p.color = perfect && Math.random() > 0.6 ? '#e8a090' : color;
      p.type = perfect && Math.random() > 0.7 ? 'spark' : style;
      p.rot = 0;
      p.spin = (Math.random() - 0.5) * 8;
    }
    if (perfect) {
      this.rings.push({ x, y, life: 0.45, maxLife: 0.45, color: '#e8a090' });
    }
  }

  drip(x: number, y: number, color: string, count = 2): void {
    for (let i = 0; i < count; i++) {
      const p = this.alloc();
      if (!p) break;
      p.active = true;
      p.x = x + (Math.random() - 0.5) * 24;
      p.y = y - 2;
      p.vx = (Math.random() - 0.5) * 12;
      p.vy = -20 - Math.random() * 40;
      p.life = 0.5 + Math.random() * 0.4;
      p.maxLife = p.life;
      p.size = 2.5 + Math.random() * 2.5;
      p.color = color;
      p.type = 'drip';
    }
  }

  sandFall(x: number, y: number, color: string, w: number): void {
    for (let i = 0; i < 4; i++) {
      const p = this.alloc();
      if (!p) break;
      p.active = true;
      p.x = x + (Math.random() - 0.5) * w;
      p.y = y;
      p.vx = (Math.random() - 0.5) * 20;
      p.vy = -15 - Math.random() * 35;
      p.life = 0.4 + Math.random() * 0.35;
      p.maxLife = p.life;
      p.size = 1.5;
      p.color = color;
      p.type = 'sandFall';
    }
  }

  foamBurst(x: number, y: number, color: string): void {
    this.burst(x, y, color, 16, 'foamBurst', true);
    this.burst(x, y, '#ffffff', 8, 'bubble', false);
  }

  juiceArc(x: number, y: number, color: string): void {
    for (let i = 0; i < 8; i++) {
      const p = this.alloc();
      if (!p) break;
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
      const sp = 50 + Math.random() * 70;
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(a) * sp;
      p.vy = Math.sin(a) * sp + 20;
      p.life = 0.45 + Math.random() * 0.3;
      p.maxLife = p.life;
      p.size = 2 + Math.random() * 2;
      p.color = color;
      p.type = 'juice';
    }
  }

  confetti(x: number, y: number): void {
    const colors = ['#e8a090', '#f0d878', '#7ecfc0', '#ffd0e0', '#a8d8ff'];
    for (let i = 0; i < 24; i++) {
      const p = this.alloc();
      if (!p) break;
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 90;
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(a) * sp;
      p.vy = Math.sin(a) * sp + 40;
      p.life = 0.9 + Math.random() * 0.6;
      p.maxLife = p.life;
      p.size = 3 + Math.random() * 3;
      p.color = colors[i % colors.length];
      p.type = 'glitter';
    }
  }

  update(dt: number): void {
    for (const p of this.items) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      // World +Y is up — gravity pulls down
      const g =
        p.type === 'foam' || p.type === 'bubble' || p.type === 'foamBurst'
          ? 40
          : p.type === 'drip' || p.type === 'sandFall' || p.type === 'juice'
            ? 520
            : 180;
      p.vy -= g * dt;
      p.vx *= 1 - 1.2 * dt;
      if (p.type === 'sand' || p.type === 'sandFall') p.vx *= 1 - 0.6 * dt;
      if (p.spin) p.rot = (p.rot ?? 0) + p.spin * dt;
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      this.rings[i].life -= dt;
      if (this.rings[i].life <= 0) this.rings.splice(i, 1);
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    toScreen: (x: number, y: number) => { x: number; y: number },
  ): void {
    for (const ring of this.rings) {
      const s = toScreen(ring.x, ring.y);
      const t = 1 - ring.life / ring.maxLife;
      ctx.globalAlpha = (1 - t) * 0.7;
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 12 + t * 36, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const p of this.items) {
      if (!p.active) continue;
      const s = toScreen(p.x, p.y);
      const a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a * 0.88;
      if (p.type === 'bubble' || p.type === 'foamBurst') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(s.x, s.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.type === 'glitter' || p.type === 'spark') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'zest' || p.type === 'juice') {
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(p.rot ?? p.vx * 0.05);
        ctx.fillRect(-p.size, -1, p.size * 2, 2);
        ctx.restore();
      } else if (p.type === 'sand' || p.type === 'sandFall') {
        ctx.fillStyle = p.color;
        ctx.fillRect(s.x, s.y, 2, 2);
      } else if (p.type === 'drip') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, p.size * 0.45, p.size, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(s.x, s.y, p.size * 0.7, p.size, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  clear(): void {
    for (const p of this.items) p.active = false;
    this.rings.length = 0;
  }
}
