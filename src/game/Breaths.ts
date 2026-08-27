export class BreathOrb {
  x: number;
  y: number;
  r = 8;
  collected = false;
  private phase: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.phase = Math.random() * Math.PI * 2;
  }

  update(dt: number, playerX: number, playerY: number): void {
    this.phase += dt * 2.2;
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 70 && dist > 1) {
      const pull = (1 - dist / 70) * 90 * dt;
      this.x += (dx / dist) * pull;
      this.y += (dy / dist) * pull;
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    toScreen: (x: number, y: number) => { x: number; y: number },
    time: number,
  ): void {
    if (this.collected) return;
    const bob = Math.sin(this.phase + time) * 4;
    const s = toScreen(this.x, this.y + bob);
    const pulse = 1 + Math.sin(time * 3 + this.phase) * 0.08;

    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.shadowColor = 'rgba(232, 160, 144, 0.55)';
    ctx.shadowBlur = 12;
    const g = ctx.createRadialGradient(s.x - 2, s.y - 2, 1, s.x, s.y, this.r * pulse);
    g.addColorStop(0, 'rgba(255, 245, 235, 0.95)');
    g.addColorStop(0.5, 'rgba(232, 176, 160, 0.75)');
    g.addColorStop(1, 'rgba(212, 165, 116, 0.15)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s.x, s.y, this.r * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class BreathSpawner {
  orbs: BreathOrb[] = [];
  private nextAt = 200;

  reset(): void {
    this.orbs = [];
    this.nextAt = 120 + Math.random() * 80;
  }

  update(platformsY: number, playerX: number): void {
    while (this.nextAt < platformsY) {
      const x = playerX + (Math.random() - 0.5) * 140;
      this.orbs.push(new BreathOrb(x, this.nextAt + 20));
      this.nextAt += 150 + Math.random() * 160;
    }
    this.orbs = this.orbs.filter((o) => !o.collected && o.y > platformsY - 600);
  }
}
