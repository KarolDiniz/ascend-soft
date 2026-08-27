interface Blob {
  x: number;
  y: number;
  r: number;
  layer: number;
  color: string;
  phase: number;
  speed: number;
  kind: 'slice' | 'bubble' | 'flake';
}

export class Background {
  private blobs: Blob[] = [];
  private time = 0;
  private grain: ImageData | null = null;
  private grainCanvas: HTMLCanvasElement | null = null;
  private grainW = 0;
  private grainH = 0;

  constructor() {
    const colors = [
      'rgba(170, 220, 205, 0.32)',
      'rgba(245, 225, 180, 0.28)',
      'rgba(255, 200, 180, 0.26)',
      'rgba(190, 230, 220, 0.24)',
      'rgba(255, 230, 210, 0.22)',
      'rgba(200, 215, 230, 0.2)',
    ];
    const kinds: Blob['kind'][] = ['slice', 'bubble', 'flake'];
    for (let i = 0; i < 16; i++) {
      this.blobs.push({
        x: Math.random(),
        y: Math.random(),
        r: 36 + Math.random() * 110,
        layer: i < 5 ? 0 : i < 11 ? 1 : 2,
        color: colors[i % colors.length],
        phase: Math.random() * Math.PI * 2,
        speed: 0.07 + Math.random() * 0.05,
        kind: kinds[i % 3],
      });
    }
  }

  update(dt: number): void {
    this.time += dt;
  }

  draw(ctx: CanvasRenderingContext2D, w: number, h: number, cameraY: number): void {
    const breath = (Math.sin(this.time * ((Math.PI * 2) / 11)) + 1) * 0.5;
    const g = ctx.createLinearGradient(0, 0, w * 0.15, h);
    g.addColorStop(0, this.lerpColor('#c5e0dc', '#d8ebe4', breath));
    g.addColorStop(0.4, this.lerpColor('#efe6c8', '#f3ebd4', 1 - breath));
    g.addColorStop(1, this.lerpColor('#f3d5c8', '#f7e0d4', breath));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const parallax = [0.07, 0.15, 0.26];
    for (const b of this.blobs) {
      const px = parallax[b.layer];
      const driftX = Math.sin(this.time * b.speed + b.phase) * 28;
      const driftY = Math.cos(this.time * b.speed * 0.7 + b.phase) * 18;
      const scroll = -(cameraY * px);
      const x = b.x * w + driftX;
      const y =
        (((b.y * h + scroll + driftY) % (h + b.r * 2)) + h + b.r) % (h + b.r * 2) - b.r;
      const scale = 1 + Math.sin(this.time * 0.45 + b.phase) * 0.07;

      ctx.fillStyle = b.color;
      ctx.beginPath();
      if (b.kind === 'slice') {
        ctx.ellipse(x, y, b.r * scale, b.r * 0.38 * scale, b.phase * 0.3, 0, Math.PI * 2);
      } else if (b.kind === 'flake') {
        ctx.ellipse(x, y, b.r * 0.55 * scale, b.r * 0.55 * scale, 0, 0, Math.PI * 2);
      } else {
        ctx.ellipse(x, y, b.r * 0.7 * scale, b.r * 0.75 * scale, 0, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    // Soft vignette
    const vig = ctx.createRadialGradient(w / 2, h * 0.45, h * 0.2, w / 2, h / 2, h * 0.85);
    vig.addColorStop(0, 'rgba(255,255,255,0)');
    vig.addColorStop(1, 'rgba(80, 70, 60, 0.12)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

    this.drawGrain(ctx, w, h);
  }

  private drawGrain(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const gw = Math.min(160, Math.floor(w / 4));
    const gh = Math.min(90, Math.floor(h / 4));
    if (!this.grain || !this.grainCanvas || this.grainW !== gw || this.grainH !== gh) {
      this.grainW = gw;
      this.grainH = gh;
      this.grainCanvas = document.createElement('canvas');
      this.grainCanvas.width = gw;
      this.grainCanvas.height = gh;
      const img = ctx.createImageData(gw, gh);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = 220 + ((Math.random() * 35) | 0);
        img.data[i] = v;
        img.data[i + 1] = v;
        img.data[i + 2] = v;
        img.data[i + 3] = 18 + ((Math.random() * 10) | 0);
      }
      this.grain = img;
      this.grainCanvas.getContext('2d')!.putImageData(img, 0, 0);
    }
    if ((this.time * 6) % 1 < 0.05 && this.grain && this.grainCanvas) {
      for (let i = 0; i < this.grain.data.length; i += 20) {
        const v = 220 + ((Math.random() * 35) | 0);
        this.grain.data[i] = v;
        this.grain.data[i + 1] = v;
        this.grain.data[i + 2] = v;
      }
      this.grainCanvas.getContext('2d')!.putImageData(this.grain, 0, 0);
    }
    ctx.save();
    ctx.globalAlpha = 0.045;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.grainCanvas!, 0, 0, w, h);
    ctx.restore();
  }

  private lerpColor(a: string, b: string, t: number): string {
    const pa = this.hex(a);
    const pb = this.hex(b);
    const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
    const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
    const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
    return `rgb(${r},${g},${bl})`;
  }

  private hex(c: string): [number, number, number] {
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
}
