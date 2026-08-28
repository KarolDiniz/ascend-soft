import type { Atmosphere } from './atmosphere/Atmosphere';
import { materialMood } from './ThemedPhases';
import type { OverlayKind } from './atmosphere/AltitudeZones';

/**
 * Sky gradient, themed blobs, vignette/grain, and cinematic biome overlays.
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

    const topA = pal?.top ?? '#d8ebe4';
    const midA = pal?.mid ?? '#f0e8c8';
    const botA = pal?.bottom ?? '#f5dcc8';

    const bands = 16;
    for (let i = 0; i < bands; i++) {
      const t = i / (bands - 1);
      const c =
        t < 0.42
          ? this.lerpColor(topA, midA, t / 0.42)
          : this.lerpColor(midA, botA, (t - 0.42) / 0.58);
      const shifted = this.shiftRgb(c, breath * 4 + flash * 10);
      const breatheShift = this.lerpColor(c, shifted, 0.38);
      const y0 = Math.floor((h * i) / bands);
      const y1 = Math.floor((h * (i + 1)) / bands);
      ctx.fillStyle = breatheShift;
      ctx.fillRect(0, y0, w, Math.max(1, y1 - y0));
    }

    this.drawThemedBlobs(ctx, w, h, atm, breath);

    // Soft atmospheric depth haze (pre-light)
    if (atm) {
      const haze = ctx.createLinearGradient(0, 0, 0, h);
      haze.addColorStop(0, this.withAlpha(pal?.top ?? '#fff', 0.0));
      haze.addColorStop(0.5, this.withAlpha(pal?.mid ?? '#fff', 0.04));
      haze.addColorStop(1, this.withAlpha(pal?.bottom ?? '#fff', 0.1));
      ctx.fillStyle = haze;
      ctx.fillRect(0, 0, w, h);
    }

    if (flash > 0) {
      ctx.fillStyle = `rgba(255,252,245,${flash * 0.16})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  private drawThemedBlobs(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    atm: Atmosphere | undefined,
    breath: number,
  ): void {
    const colors = atm?.getPalette().blob ?? [
      'rgba(255,240,200,0.28)',
      'rgba(200,230,220,0.24)',
      'rgba(255,220,200,0.2)',
    ];
    const accent = atm?.getAccent() ?? '#f3e2a8';
    for (let i = 0; i < 9; i++) {
      const col = colors[i % colors.length];
      const phase = this.time * (0.15 + i * 0.04) + i * 1.7;
      const bx = ((i * 0.19 + Math.sin(phase) * 0.08 + 0.1) % 1) * w;
      const by = ((i * 0.13 + Math.cos(phase * 0.7) * 0.06 + 0.08) % 1) * h;
      const r = (h * 0.12 + (i % 4) * h * 0.04) * (0.92 + breath * 0.08);
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, r);
      g.addColorStop(0, col);
      g.addColorStop(0.55, this.withAlpha(accent, 0.08));
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const glowY = h * (0.55 + breath * 0.05);
    const hg = ctx.createLinearGradient(0, glowY - h * 0.2, 0, glowY + h * 0.15);
    hg.addColorStop(0, 'rgba(255,255,255,0)');
    hg.addColorStop(0.5, this.withAlpha(accent, 0.12));
    hg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hg;
    ctx.fillRect(0, glowY - h * 0.2, w, h * 0.35);
  }

  drawLightOverlay(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    atm?: Atmosphere,
  ): void {
    const accent = atm?.getAccent() ?? '#f3e2a8';
    const lx = atm?.lightDirX ?? -0.35;
    const ly = atm?.lightDirY ?? 0.55;
    const warmth = atm?.lightWarmth ?? 0.55;
    const breath = (Math.sin(this.time * 0.35) + 1) * 0.5;

    // Soft key light wash from top-left
    ctx.save();
    const keyX = w * (0.28 + lx * 0.15);
    const keyY = h * (0.12 - ly * 0.05);
    const key = ctx.createRadialGradient(keyX, keyY, 0, keyX, keyY, h * 0.85);
    key.addColorStop(0, this.withAlpha('#fffaf0', 0.16 + breath * 0.04));
    key.addColorStop(0.35, this.withAlpha(accent, 0.08 + warmth * 0.04));
    key.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = key;
    ctx.fillRect(0, 0, w, h);

    // Volumetric light shafts
    ctx.globalCompositeOperation = 'soft-light';
    for (let i = 0; i < 5; i++) {
      const drift = Math.sin(this.time * 0.22 + i * 1.1) * 18;
      const ax = w * (0.15 + i * 0.16) + drift + lx * 40;
      const topW = 18 + i * 6;
      const botW = 55 + i * 22;
      const g = ctx.createLinearGradient(ax, 0, ax + lx * 80, h * 0.92);
      g.addColorStop(0, this.withAlpha('#fff8ee', 0.14 + breath * 0.05));
      g.addColorStop(0.45, this.withAlpha(accent, 0.06));
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(ax - topW, -10);
      ctx.lineTo(ax + topW, -10);
      ctx.lineTo(ax + botW + lx * 30, h);
      ctx.lineTo(ax - botW + lx * 30, h);
      ctx.closePath();
      ctx.fill();
    }

    // Soft floor shadow / ambient occlusion at bottom
    ctx.globalCompositeOperation = 'source-over';
    const pal = atm?.getPalette();
    const floorTint = pal?.bottom ?? '#a89888';
    const floor = ctx.createLinearGradient(0, h * 0.62, 0, h);
    floor.addColorStop(0, this.withAlpha(floorTint, 0));
    floor.addColorStop(0.55, this.withAlpha(floorTint, 0.05));
    floor.addColorStop(1, this.withAlpha(floorTint, 0.12));
    ctx.fillStyle = floor;
    ctx.fillRect(0, h * 0.62, w, h * 0.38);

    // Side fill light (opposite of key)
    const fill = ctx.createRadialGradient(w * 0.85, h * 0.55, 0, w * 0.85, h * 0.55, w * 0.55);
    fill.addColorStop(0, this.withAlpha(accent, 0.05));
    fill.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  drawBiomeOverlays(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    atm?: Atmosphere,
  ): void {
    if (!atm) return;
    const accent = atm.getAccent();
    for (const { zone, weight } of atm.getWeights()) {
      if (weight < 0.03) continue;
      ctx.save();
      ctx.globalAlpha = weight * 0.92;
      this.drawOverlay(ctx, w, h, zone.overlay, accent);
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
    const frostish = atm && materialMood(atm.primaryId) === 'frost' ? 0.14 : 0.08;
    const vignette = atm?.getPalette()?.bottom ?? '#c8b8a8';
    ctx.fillStyle = this.withAlpha(vignette, frostish);
    ctx.fillRect(0, 0, w, 6);
    ctx.fillRect(0, h - 8, w, 8);
    ctx.fillRect(0, 0, 6, h);
    ctx.fillRect(w - 6, 0, 6, h);

    if (atm && materialMood(atm.primaryId) === 'ethereal') {
      ctx.fillStyle = 'rgba(255, 235, 200, 0.1)';
      ctx.fillRect(Math.floor(w * 0.3), Math.floor(h * 0.3), Math.floor(w * 0.4), Math.floor(h * 0.2));
    }

    this.drawGrain(ctx, w, h);
  }

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
    accent: string,
  ): void {
    switch (kind) {
      case 'mottle': {
        for (let i = 0; i < 10; i++) {
          const x = ((i * 137 + this.time * 12) % (w + 80)) - 40;
          const y = (i * 89 + Math.sin(this.time * 0.3 + i) * 40) % h;
          const r = 44 + (i % 4) * 20;
          const g = ctx.createRadialGradient(x, y, 0, x, y, r);
          g.addColorStop(0, this.withAlpha(accent, 0.2));
          g.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'sugarVeil': {
        ctx.fillStyle = this.withAlpha(accent, 0.14);
        for (let i = 0; i < 65; i++) {
          const x = ((i * 47 + this.time * 22) % (w + 20)) - 10;
          const y = ((i * 73 + this.time * 11) % (h + 20)) - 10;
          ctx.fillRect(x, y, 2, 2);
        }
        break;
      }
      case 'caustics': {
        ctx.strokeStyle = this.withAlpha(accent, 0.22);
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          const baseY = h * (0.18 + i * 0.14);
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
        top.addColorStop(0, 'rgba(255,255,255,0.32)');
        top.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = top;
        ctx.fillRect(0, 0, w, edge);
        const bot = ctx.createLinearGradient(0, h, 0, h - edge);
        bot.addColorStop(0, 'rgba(255,255,255,0.26)');
        bot.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = bot;
        ctx.fillRect(0, h - edge, w, edge);
        break;
      }
      case 'goldBloom': {
        const g = ctx.createRadialGradient(w * 0.5, h * 0.42, 10, w * 0.5, h * 0.42, h * 0.65);
        g.addColorStop(0, this.withAlpha(accent, 0.22));
        g.addColorStop(0.5, this.withAlpha(accent, 0.08));
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        break;
      }
    }
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

  private parseRgb(c: string): [number, number, number] {
    if (c.startsWith('#')) {
      const n = parseInt(c.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    const m = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (m) return [+m[1], +m[2], +m[3]];
    return [220, 210, 200];
  }

  private shiftRgb(c: string, amt: number): string {
    const [r, g, b] = this.parseRgb(c);
    return `rgb(${Math.max(0, Math.min(255, r + amt))},${Math.max(0, Math.min(255, g + amt))},${Math.max(0, Math.min(255, b + amt))})`;
  }

  private lerpColor(a: string, b: string, t: number): string {
    const pa = this.parseRgb(a);
    const pb = this.parseRgb(b);
    return `rgb(${Math.round(pa[0] + (pb[0] - pa[0]) * t)},${Math.round(pa[1] + (pb[1] - pa[1]) * t)},${Math.round(pa[2] + (pb[2] - pa[2]) * t)})`;
  }

  private withAlpha(color: string, alpha: number): string {
    const [r, g, b] = this.parseRgb(color);
    return `rgba(${r},${g},${b},${alpha})`;
  }
}
