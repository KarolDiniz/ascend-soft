export class Camera {
  x = 0;
  y = 0;
  private targetY = 0;
  private vy = 0;
  private readonly stiffness = 16;
  private readonly damping = 7.5;
  punch = 0;

  follow(worldY: number, lookAhead = 80): void {
    this.targetY = worldY - lookAhead;
  }

  update(dt: number): void {
    const dy = this.targetY - this.y;
    const accel = dy * this.stiffness - this.vy * this.damping;
    this.vy += accel * dt;
    this.y += this.vy * dt;
    if (this.punch > 0) {
      this.punch = Math.max(0, this.punch - dt * 3.2);
    }
  }

  /** Subtle overshoot nudge on perfect land */
  nudgePerfect(amount = 6): void {
    this.vy += amount;
    this.punch = Math.min(1, this.punch + 0.55);
  }

  snapTo(worldY: number, lookAhead = 80): void {
    this.targetY = worldY - lookAhead;
    this.y = this.targetY;
    this.vy = 0;
    this.punch = 0;
  }

  /** Posiciona a câmera sem spring — usado na transição título → jogo. */
  setPosition(worldY: number, lookAhead = 80): void {
    this.targetY = worldY - lookAhead;
    this.y = this.targetY;
    this.vy = 0;
  }

  worldToScreen(wx: number, wy: number, canvasW: number, canvasH: number): { x: number; y: number } {
    return {
      x: wx - this.x + canvasW / 2,
      y: canvasH / 2 - (wy - this.y),
    };
  }
}
