const MAX_SHARDS = 48;

export interface Shard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  spin: number;
  w: number;
  h: number;
  life: number;
  maxLife: number;
  color: string;
  active: boolean;
}

export class ShardField {
  private shards: Shard[] = [];

  constructor() {
    for (let i = 0; i < MAX_SHARDS; i++) {
      this.shards.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        rot: 0,
        spin: 0,
        w: 6,
        h: 8,
        life: 0,
        maxLife: 1,
        color: '#fff',
        active: false,
      });
    }
  }

  burst(x: number, y: number, color: string, count = 10, spread = 40): void {
    let spawned = 0;
    for (const s of this.shards) {
      if (s.active) continue;
      const a = (Math.PI * 2 * spawned) / count + Math.random() * 0.4;
      const sp = 60 + Math.random() * 140;
      s.active = true;
      s.x = x + (Math.random() - 0.5) * spread;
      s.y = y + (Math.random() - 0.5) * 8;
      s.vx = Math.cos(a) * sp;
      s.vy = Math.sin(a) * sp * 0.6 + 40;
      s.rot = Math.random() * Math.PI;
      s.spin = (Math.random() - 0.5) * 14;
      s.w = 5 + Math.random() * 10;
      s.h = 4 + Math.random() * 8;
      s.life = 0.55 + Math.random() * 0.45;
      s.maxLife = s.life;
      s.color = color;
      spawned++;
      if (spawned >= count) break;
    }
  }

  update(dt: number): void {
    for (const s of this.shards) {
      if (!s.active) continue;
      s.life -= dt;
      if (s.life <= 0) {
        s.active = false;
        continue;
      }
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy -= 520 * dt;
      s.vx *= 1 - 0.6 * dt;
      s.rot += s.spin * dt;
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    toScreen: (x: number, y: number) => { x: number; y: number },
  ): void {
    for (const s of this.shards) {
      if (!s.active) continue;
      const p = toScreen(s.x, s.y);
      const a = Math.max(0, s.life / s.maxLife);
      ctx.save();
      ctx.globalAlpha = a * 0.9;
      ctx.translate(p.x, p.y);
      ctx.rotate(s.rot);
      ctx.fillStyle = s.color;
      ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h);
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillRect(-s.w / 2, -s.h / 2, s.w * 0.4, s.h * 0.35);
      ctx.restore();
    }
  }

  clear(): void {
    for (const s of this.shards) s.active = false;
  }
}
