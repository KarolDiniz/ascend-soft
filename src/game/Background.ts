import type { Atmosphere } from './atmosphere/Atmosphere';
import type { OverlayKind, ZoneId } from './atmosphere/AltitudeZones';

/**
 * Sky gradient, soft shafts, vignette/grain, and cinematic biome overlays.
 * Heavy silhouettes live in SceneryLayer.
 */
export class Background {
  private time = 0;
  private grain: ImageData | null = null;
  private grainCanvas: HTMLCanvasElement | null = null;
  private grainW = 0;
  private grainH = 0;
  private grainAlpha = 0.04;

  update(dt: number, atm?: Atmosphere): void {
    this.time += dt;
    if (atm) this.grainAlpha = atm.grainAlpha;
  }

  /** Layer 1: banded pixel sky + soft flash */
  drawSky(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    atm?: Atmosphere,
  ): void {
    ctx.imageSmoothingEnabled = false;
    const period = atm?.breathPeriod ?? 11;
    const breath = (Math.sin(this.time * ((Math.PI * 2) / period)) + 1) * 0.5;
    const pal = atm?.getPalette();
    const flash = atm?.enterFlash ?? 0;

    const topA = pal?.top ?? '#c5e0dc';
    const midA = pal?.mid ?? '#efe6c8';
    const botA = pal?.bottom ?? '#f3d5c8';

    // Horizontal color bands (classic pixel sky)
    const bands = 12;
    for (let i = 0; i < bands; i++) {
      const t = i / (bands - 1);
      const c =
        t < 0.42
          ? this.lerpColor(topA, midA, t / 0.42)
          : this.lerpColor(midA, botA, (t - 0.42) / 0.58);
      const breatheShift = this.lerpColor(c, this.shift(c, breath * 8 + flash * 12), 0.35);
      const y0 = Math.floor((h * i) / bands);
      const y1 = Math.floor((h * (i + 1)) / bands);
      ctx.fillStyle = breatheShift;
      ctx.fillRect(0, y0, w, Math.max(1, y1 - y0));
    }

    if (flash > 0) {
      ctx.fillStyle = `rgba(255,252,245,${flash * 0.14})`;
      ctx.fillRect(0, 0, w, h);
    }

    // Pixel light band
    const bandY = Math.floor(h * (0.22 + breath * 0.08));
    ctx.fillStyle = `rgba(255, 250, 240, ${0.08 + breath * 0.05})`;
    ctx.fillRect(0, bandY, w, 6);
    ctx.fillStyle = `rgba(255, 250, 240, ${0.04 + breath * 0.03})`;
    ctx.fillRect(0, bandY + 6, w, 10);
  }

  /** Soft light — disabled (kept for call-site compatibility) */
  drawLightOverlay(
    _ctx: CanvasRenderingContext2D,
    _w: number,
    _h: number,
    _atm?: Atmosphere,
  ): void {
    // Was a visible soft rectangle behind platforms — left invisible on purpose.
  }

  /** Weather / cinematic overlays after near particles */
  drawBiomeOverlays(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    atm?: Atmosphere,
  ): void {
    if (!atm) return;
    for (const { zone, weight } of atm.getWeights()) {
      if (weight < 0.04) continue;
      ctx.save();
      ctx.globalAlpha = weight;
      this.drawOverlay(ctx, w, h, zone.overlay, zone.id);
      ctx.restore();
    }
  }

  drawVignetteAndGrain(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    atm?: Atmosphere,
  ): void {
    ctx.imageSmoothingEnabled = false;
    const frostish = atm?.primaryId === 'frost' ? 0.2 : 0.14;
    // Pixel vignette — edge bands instead of soft radial
    ctx.fillStyle = `rgba(70, 60, 55, ${frostish})`;
    ctx.fillRect(0, 0, w, 8);
    ctx.fillRect(0, h - 10, w, 10);
    ctx.fillRect(0, 0, 8, h);
    ctx.fillRect(w - 8, 0, 8, h);
    ctx.fillStyle = `rgba(70, 60, 55, ${frostish * 0.5})`;
    ctx.fillRect(0, 8, w, 6);
    ctx.fillRect(0, h - 16, w, 6);

    if (atm?.primaryId === 'ether') {
      ctx.fillStyle = 'rgba(255, 235, 200, 0.08)';
      ctx.fillRect(Math.floor(w * 0.3), Math.floor(h * 0.3), Math.floor(w * 0.4), Math.floor(h * 0.2));
    }

    this.drawGrain(ctx, w, h);
  }

  /** @deprecated use drawSky — kept for any old call sites */
  draw(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    _cameraY: number,
    atm?: Atmosphere,
  ): void {
    this.drawSky(ctx, w, h, atm);
    this.drawVignetteAndGrain(ctx, w, h, atm);
  }

  private drawOverlay(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    kind: OverlayKind,
    _id: ZoneId,
  ): void {
    switch (kind) {
      case 'mottle': {
        for (let i = 0; i < 8; i++) {
          const x = ((i * 137 + this.time * 12) % (w + 80)) - 40;
          const y = ((i * 89 + Math.sin(this.time * 0.3 + i) * 40) % h);
          const r = 40 + (i % 4) * 18;
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, 'rgba(255,255,240,0.14)');
          g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'sugarVeil': {
        ctx.fillStyle = 'rgba(255,255,255,0.07)';
        for (let i = 0; i < 55; i++) {
          const x = ((i * 47 + this.time * 22) % (w + 20)) - 10;
          const y = ((i * 73 + this.time * 11) % (h + 20)) - 10;
          ctx.fillRect(x, y, 1.8, 1.8);
        }
        break;
      }
      case 'caustics': {
        ctx.strokeStyle = 'rgba(200, 230, 235, 0.16)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          const baseY = h * (0.2 + i * 0.15);
          for (let x = 0; x <= w; x += 16) {
            const yy =
              baseY +
              Math.sin(x * 0.02 + this.time * 1.2 + i) * 10 +
              Math.sin(x * 0.045 + this.time * 0.7) * 5;
            if (x === 0) ctx.moveTo(x, yy);
            else ctx.lineTo(x, yy);
          }
          ctx.stroke();
        }
        break;
      }
      case 'frostEdge': {
        const edge = 70;
        const top = ctx.createLinearGradient(0, 0, 0, edge);
        top.addColorStop(0, 'rgba(255,255,255,0.28)');
        top.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = top;
        ctx.fillRect(0, 0, w, edge);
        const bot = ctx.createLinearGradient(0, h, 0, h - edge);
        bot.addColorStop(0, 'rgba(255,255,255,0.24)');
        bot.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = bot;
        ctx.fillRect(0, h - edge, w, edge);
        const left = ctx.createLinearGradient(0, 0, edge, 0);
        left.addColorStop(0, 'rgba(230,245,255,0.2)');
        left.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = left;
        ctx.fillRect(0, 0, edge, h);
        const right = ctx.createLinearGradient(w, 0, w - edge, 0);
        right.addColorStop(0, 'rgba(230,245,255,0.2)');
        right.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = right;
        ctx.fillRect(w - edge, 0, edge, h);
        // Corner crystals
        ctx.strokeStyle = 'rgba(210,230,245,0.35)';
        ctx.lineWidth = 1;
        this.cornerCrystal(ctx, 28, 28, 14);
        this.cornerCrystal(ctx, w - 28, 32, 12);
        this.cornerCrystal(ctx, 34, h - 30, 11);
        this.cornerCrystal(ctx, w - 30, h - 28, 13);
        break;
      }
      case 'goldBloom': {
        const g = ctx.createRadialGradient(w * 0.5, h * 0.42, 10, w * 0.5, h * 0.42, h * 0.6);
        g.addColorStop(0, 'rgba(255, 230, 190, 0.14)');
        g.addColorStop(0.5, 'rgba(255, 220, 180, 0.06)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        break;
      }
    }
  }

  private cornerCrystal(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x + s * 0.5, y);
    ctx.lineTo(x, y + s);
    ctx.lineTo(x - s * 0.5, y);
    ctx.closePath();
    ctx.stroke();
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
    if ((this.time * 5) % 1 < 0.04 && this.grain && this.grainCanvas) {
      for (let i = 0; i < this.grain.data.length; i += 24) {
        const v = 220 + ((Math.random() * 35) | 0);
        this.grain.data[i] = v;
        this.grain.data[i + 1] = v;
        this.grain.data[i + 2] = v;
      }
      this.grainCanvas.getContext('2d')!.putImageData(this.grain, 0, 0);
    }
    ctx.save();
    ctx.globalAlpha = this.grainAlpha;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.grainCanvas!, 0, 0, w, h);
    ctx.restore();
  }

  private shift(hex: string, amt: number): string {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, Math.min(255, ((n >> 16) & 255) + amt));
    const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
    const b = Math.max(0, Math.min(255, (n & 255) + amt));
    return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
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
