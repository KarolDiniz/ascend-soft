import { ALTITUDE_ZONES, type DecorKind, type ZoneId } from './AltitudeZones';
import type { Atmosphere } from './Atmosphere';
import { drawDecor } from './BiomeDecor';

interface SceneryProp {
  zoneId: ZoneId;
  kind: DecorKind;
  nx: number;
  ny: number;
  scale: number;
  /** 0 far … 3 near-mid */
  layer: 0 | 1 | 2 | 3;
  phase: number;
  speed: number;
  color: string;
  alpha: number;
  targetAlpha: number;
}

interface BiomeSpriteSet {
  far: HTMLImageElement | null;
  mid: HTMLImageElement | null;
  accent: HTMLImageElement | null;
}

const PARALLAX = [0.05, 0.1, 0.18, 0.26];
const PROP_COUNT = 36;
const FADE_SPEED = 1.15;

const ZONE_COLORS: Record<ZoneId, string[]> = {
  garden: [
    'rgba(120, 180, 155, 0.42)',
    'rgba(230, 190, 140, 0.38)',
    'rgba(255, 170, 170, 0.35)',
    'rgba(200, 220, 160, 0.36)',
  ],
  bakery: [
    'rgba(255, 190, 205, 0.4)',
    'rgba(240, 200, 170, 0.38)',
    'rgba(255, 220, 190, 0.36)',
    'rgba(230, 170, 150, 0.34)',
  ],
  spa: [
    'rgba(160, 210, 220, 0.38)',
    'rgba(190, 185, 215, 0.34)',
    'rgba(200, 230, 235, 0.36)',
    'rgba(175, 200, 210, 0.32)',
  ],
  frost: [
    'rgba(180, 210, 230, 0.4)',
    'rgba(210, 225, 240, 0.36)',
    'rgba(160, 195, 220, 0.34)',
    'rgba(230, 240, 250, 0.32)',
  ],
  ether: [
    'rgba(235, 210, 180, 0.38)',
    'rgba(255, 230, 200, 0.34)',
    'rgba(220, 195, 170, 0.32)',
    'rgba(250, 235, 210, 0.3)',
  ],
};

export class SceneryLayer {
  private props: SceneryProp[] = [];
  private sprites = new Map<ZoneId, BiomeSpriteSet>();
  private time = 0;
  private skipFar = false;
  activeCount = 0;

  constructor() {
    this.seedProps();
    this.preloadSprites();
  }

  private seedProps(): void {
    this.props.length = 0;
    let i = 0;
    for (const zone of ALTITUDE_ZONES) {
      const perZone = Math.floor(PROP_COUNT / ALTITUDE_ZONES.length);
      for (let k = 0; k < perZone; k++) {
        const kind = zone.scenery[k % zone.scenery.length];
        const layer = (k % 4) as 0 | 1 | 2 | 3;
        const colors = ZONE_COLORS[zone.id];
        this.props.push({
          zoneId: zone.id,
          kind,
          nx: (i * 0.17 + k * 0.23 + Math.random() * 0.1) % 1,
          ny: (0.12 + ((i * 0.31 + k * 0.19) % 0.76)),
          scale: layer < 2 ? 70 + Math.random() * 90 : 40 + Math.random() * 55,
          layer,
          phase: Math.random() * Math.PI * 2,
          speed: 0.35 + Math.random() * 0.55,
          color: colors[k % colors.length],
          alpha: zone.id === 'garden' ? 0.85 : 0,
          targetAlpha: zone.id === 'garden' ? 0.85 : 0,
        });
        i++;
      }
    }
    // Extra props to reach ~36
    while (this.props.length < PROP_COUNT) {
      const zone = ALTITUDE_ZONES[this.props.length % ALTITUDE_ZONES.length];
      const k = this.props.length;
      this.props.push({
        zoneId: zone.id,
        kind: zone.scenery[k % zone.scenery.length],
        nx: Math.random(),
        ny: 0.1 + Math.random() * 0.8,
        scale: 50 + Math.random() * 70,
        layer: (k % 4) as 0 | 1 | 2 | 3,
        phase: Math.random() * 10,
        speed: 0.4 + Math.random() * 0.4,
        color: ZONE_COLORS[zone.id][k % 4],
        alpha: 0,
        targetAlpha: 0,
      });
    }
  }

  private preloadSprites(): void {
    for (const z of ALTITUDE_ZONES) {
      const set: BiomeSpriteSet = { far: null, mid: null, accent: null };
      for (const key of ['far', 'mid', 'accent'] as const) {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          set[key] = img;
        };
        img.onerror = () => {
          set[key] = null;
        };
        img.src = `/assets/biomes/${z.id}/${key}.png`;
      }
      this.sprites.set(z.id, set);
    }
  }

  setPerfMode(low: boolean): void {
    this.skipFar = low;
  }

  update(dt: number, atm: Atmosphere): void {
    this.time += dt;
    const weights = new Map<ZoneId, number>();
    for (const w of atm.getWeights()) {
      weights.set(w.zone.id, (weights.get(w.zone.id) ?? 0) + w.weight);
    }

    this.activeCount = 0;
    for (const p of this.props) {
      const w = weights.get(p.zoneId) ?? 0;
      const layerMul = this.skipFar && p.layer < 2 ? 0 : 1;
      p.targetAlpha = w * 0.9 * layerMul;
      const diff = p.targetAlpha - p.alpha;
      p.alpha += Math.sign(diff) * Math.min(Math.abs(diff), FADE_SPEED * dt);
      p.phase += dt * p.speed;
      if (p.alpha > 0.02) this.activeCount++;
    }
  }

  /** Screen-space positions of visible props — for particle emitters */
  collectEmitters(w: number, h: number, cameraY: number): { x: number; y: number; color: string }[] {
    const out: { x: number; y: number; color: string }[] = [];
    for (const p of this.props) {
      if (p.alpha < 0.15) continue;
      const px = PARALLAX[p.layer];
      const sway = Math.sin(p.phase) * (12 + p.layer * 4);
      const bob = Math.cos(p.phase * 0.85) * (8 + p.layer * 3);
      const scroll = -(cameraY * px);
      const x = p.nx * w + sway;
      const band = h + p.scale * 2;
      const y = ((((p.ny * h + scroll + bob) % band) + band) % band) - p.scale;
      if (y < -40 || y > h + 40 || x < -40 || x > w + 40) continue;
      out.push({ x, y, color: p.color });
    }
    return out;
  }

  drawFar(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    cameraY: number,
    atm: Atmosphere,
  ): void {
    this.drawSpriteLayer(ctx, w, h, cameraY, atm, 'far', 0.07);
    this.drawProps(ctx, w, h, cameraY, 0, 1);
  }

  drawMid(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    cameraY: number,
    atm: Atmosphere,
  ): void {
    this.drawSpriteLayer(ctx, w, h, cameraY, atm, 'mid', 0.18);
    this.drawProps(ctx, w, h, cameraY, 2, 3);
    this.drawSpriteLayer(ctx, w, h, cameraY, atm, 'accent', 0.22);
  }

  private drawSpriteLayer(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    cameraY: number,
    atm: Atmosphere,
    key: 'far' | 'mid' | 'accent',
    parallax: number,
  ): void {
    for (const { zone, weight } of atm.getWeights()) {
      if (weight < 0.05) continue;
      const set = this.sprites.get(zone.id);
      const img = set?.[key];
      if (!img || !img.complete || img.naturalWidth === 0) continue;
      const scroll = -((cameraY * parallax) % (h * 0.5));
      ctx.save();
      ctx.globalAlpha = weight * (key === 'accent' ? 0.35 : 0.45);
      const iw = Math.min(w * 0.95, img.naturalWidth);
      const ih = (iw / img.naturalWidth) * img.naturalHeight;
      ctx.drawImage(img, (w - iw) * 0.5, h * 0.15 + scroll * 0.3, iw, ih);
      ctx.restore();
    }
  }

  private drawProps(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    cameraY: number,
    layerMin: number,
    layerMax: number,
  ): void {
    for (const p of this.props) {
      if (p.layer < layerMin || p.layer > layerMax || p.alpha < 0.02) continue;
      const px = PARALLAX[p.layer];
      const sway = Math.sin(p.phase) * (12 + p.layer * 4);
      const bob = Math.cos(p.phase * 0.85) * (8 + p.layer * 3);
      const scroll = -(cameraY * px);
      const x = p.nx * w + sway;
      const band = h + p.scale * 2;
      const y = ((((p.ny * h + scroll + bob) % band) + band) % band) - p.scale;

      // Early out roughly offscreen
      if (y < -p.scale * 2 || y > h + p.scale * 2) continue;
      if (x < -p.scale * 2 || x > w + p.scale * 2) continue;

      ctx.save();
      ctx.globalAlpha = p.alpha * (0.55 + p.layer * 0.1);
      drawDecor(ctx, p.kind, x, y, p.scale, p.phase, p.color);
      ctx.restore();
    }
  }
}
