import { cyclicHeight } from '../ThemedPhases';
import {
  ALTITUDE_ZONES,
  ZONE_BLEND,
  zoneIndexAt,
  type AltitudeZone,
  type AmbientPreset,
  type ZoneId,
  type ZonePalette,
} from './AltitudeZones';

export interface ZoneWeight {
  zone: AltitudeZone;
  weight: number;
}

function parseRgb(c: string): [number, number, number] {
  if (c.startsWith('#')) {
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) return [+m[1], +m[2], +m[3]];
  return [220, 210, 200];
}

function smootherstep(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c * c * c * (c * (c * 6 - 15) + 10);
}

export class Atmosphere {
  height = 0;
  private weights: ZoneWeight[] = [];
  /** Temporally smoothed weights for ultra-fluid palette/scenery */
  private smoothMap = new Map<ZoneId, number>();
  windX = 0;
  windY = 0;
  gustX = 0;
  gustY = 0;
  density = 0.55;
  breathPeriod = 11;
  grainAlpha = 0.04;
  particleBudget = 180;
  primaryId: ZoneId = 'butter';
  private lastPrimary: ZoneId = 'butter';
  biomeEntered: ZoneId | null = null;
  enterFlash = 0;
  gustStrength = 0;
  private gustTimer = 3.5 + Math.random() * 2.5;
  private gustRemain = 0;
  private time = 0;
  /** Soft light direction for scenery shadows (screen-space bias) */
  lightDirX = -0.35;
  lightDirY = 0.55;
  lightWarmth = 0.55;

  resetForHeight(h: number): void {
    this.height = Math.max(0, h);
    this.biomeEntered = null;
    this.enterFlash = 0;
    this.weights = this.computeWeights(this.height);
    this.smoothMap.clear();
    for (const w of this.weights) this.smoothMap.set(w.zone.id, w.weight);
    const primary = this.weights.reduce((a, b) => (b.weight > a.weight ? b : a)).zone;
    this.primaryId = primary.id;
    this.lastPrimary = primary.id;
  }

  update(dt: number, height: number): void {
    this.height = Math.max(0, height);
    this.time += dt;
    this.biomeEntered = null;
    const target = this.computeWeights(this.height);

    // Temporal ease — scenery/palette lag slightly behind height for creamier feel
    const ease = 1 - Math.exp(-2.4 * dt);
    const targetMap = new Map<ZoneId, number>();
    for (const w of target) targetMap.set(w.zone.id, w.weight);
    for (const z of ALTITUDE_ZONES) {
      const goal = targetMap.get(z.id) ?? 0;
      const cur = this.smoothMap.get(z.id) ?? 0;
      this.smoothMap.set(z.id, cur + (goal - cur) * ease);
    }

    this.weights = [];
    for (const z of ALTITUDE_ZONES) {
      const w = this.smoothMap.get(z.id) ?? 0;
      if (w > 0.008) this.weights.push({ zone: z, weight: w });
    }
    if (this.weights.length === 0) {
      this.weights = target;
    } else {
      const sum = this.weights.reduce((a, b) => a + b.weight, 0) || 1;
      for (const w of this.weights) w.weight /= sum;
    }

    let wx = 0;
    let wy = 0;
    let dens = 0;
    let breath = 0;
    let grain = 0;
    let budget = 0;
    for (const { zone, weight } of this.weights) {
      wx += zone.windX * weight;
      wy += zone.windY * weight;
      dens += zone.density * weight;
      breath += zone.breathPeriod * weight;
      grain += zone.grainAlpha * weight;
      budget += zone.particleBudget * weight;
    }

    this.gustTimer -= dt;
    if (this.gustRemain > 0) {
      this.gustRemain -= dt;
      this.gustStrength = Math.max(0, this.gustRemain / 0.85);
    } else {
      this.gustStrength = 0;
      this.gustX *= 1 - 2.2 * dt;
      this.gustY *= 1 - 2.2 * dt;
    }
    if (this.gustTimer <= 0) {
      this.gustTimer = 2.8 + Math.random() * 2.2;
      this.gustRemain = 0.85;
      this.gustX = (Math.random() - 0.5) * 55;
      this.gustY = (Math.random() - 0.3) * 24;
      this.gustStrength = 1;
    }

    this.windX = wx + this.gustX * Math.max(this.gustStrength, 0.12);
    this.windY = wy + this.gustY * Math.max(this.gustStrength, 0.12);
    this.density = dens;
    this.breathPeriod = breath || 11;
    this.grainAlpha = grain;
    this.particleBudget = budget || 180;

    // Soft drifting light
    this.lightDirX = -0.32 + Math.sin(this.time * 0.18 + this.height * 0.004) * 0.12;
    this.lightDirY = 0.5 + Math.cos(this.time * 0.14 + this.height * 0.003) * 0.08;
    this.lightWarmth = 0.45 + Math.sin(this.time * 0.11) * 0.12;

    if (this.enterFlash > 0) {
      this.enterFlash = Math.max(0, this.enterFlash - dt * 1.4);
    }

    const primary = this.weights.reduce((a, b) => (b.weight > a.weight ? b : a)).zone;
    this.primaryId = primary.id;
    if (this.primaryId !== this.lastPrimary) {
      this.biomeEntered = this.primaryId;
      this.enterFlash = 1;
      this.lastPrimary = this.primaryId;
    }
  }

  private computeWeights(h: number): ZoneWeight[] {
    const ch = cyclicHeight(h);
    const idx = zoneIndexAt(h);
    const cur = ALTITUDE_ZONES[idx];
    const nextIdx = (idx + 1) % ALTITUDE_ZONES.length;
    const next = ALTITUDE_ZONES[nextIdx];

    const boundary = cur.maxY;
    const isLast = idx >= ALTITUDE_ZONES.length - 1;
    const blendStart = isLast ? boundary - ZONE_BLEND * 2 : boundary - ZONE_BLEND;
    const blendEnd = isLast ? boundary : boundary + ZONE_BLEND;
    const s = smootherstep((ch - blendStart) / (blendEnd - blendStart));

    if (s <= 0.01) return [{ zone: cur, weight: 1 }];
    if (s >= 0.99) return [{ zone: next, weight: 1 }];
    return [
      { zone: cur, weight: 1 - s },
      { zone: next, weight: s },
    ];
  }

  getWeights(): ZoneWeight[] {
    return this.weights;
  }

  getPalette(): ZonePalette {
    if (this.weights.length === 1) return this.weights[0].zone.palette;
    // Multi-weight blend for ultra-smooth palette
    let top = [0, 0, 0];
    let mid = [0, 0, 0];
    let bottom = [0, 0, 0];
    let accent = [0, 0, 0];
    const blobAcc: [number, number, number, number][] = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    for (const { zone, weight } of this.weights) {
      const pt = parseRgb(zone.palette.top);
      const pm = parseRgb(zone.palette.mid);
      const pb = parseRgb(zone.palette.bottom);
      const pa = parseRgb(zone.palette.accent);
      top = [top[0] + pt[0] * weight, top[1] + pt[1] * weight, top[2] + pt[2] * weight];
      mid = [mid[0] + pm[0] * weight, mid[1] + pm[1] * weight, mid[2] + pm[2] * weight];
      bottom = [bottom[0] + pb[0] * weight, bottom[1] + pb[1] * weight, bottom[2] + pb[2] * weight];
      accent = [accent[0] + pa[0] * weight, accent[1] + pa[1] * weight, accent[2] + pa[2] * weight];
      for (let i = 0; i < 3; i++) {
        const src = zone.palette.blob[i % zone.palette.blob.length];
        const c = parseRgb(src);
        const aMatch = src.match(/[\d.]+\s*\)$/);
        const a = aMatch ? parseFloat(aMatch[0]) : 0.3;
        blobAcc[i][0] += c[0] * weight;
        blobAcc[i][1] += c[1] * weight;
        blobAcc[i][2] += c[2] * weight;
        blobAcc[i][3] += a * weight;
      }
    }
    const hex = (rgb: number[]) =>
      '#' +
      rgb
        .map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0'))
        .join('');
    return {
      top: hex(top),
      mid: hex(mid),
      bottom: hex(bottom),
      accent: hex(accent),
      blob: blobAcc.map(
        (b) => `rgba(${Math.round(b[0])},${Math.round(b[1])},${Math.round(b[2])},${b[3].toFixed(3)})`,
      ),
    };
  }

  getAccent(): string {
    return this.getPalette().accent;
  }

  getAmbientMix(): { preset: AmbientPreset; weight: number }[] {
    const out: { preset: AmbientPreset; weight: number }[] = [];
    for (const { zone, weight } of this.weights) {
      for (const p of zone.ambient) {
        out.push({ preset: p, weight: weight * p.weight });
      }
    }
    return out;
  }

  getBlobColors(): string[] {
    return this.getPalette().blob;
  }

  getBlobKinds() {
    return this.getPrimaryZone().blobKinds;
  }

  getPrimaryZone(): AltitudeZone {
    return this.weights.reduce((a, b) => (b.weight > a.weight ? b : a)).zone;
  }

  getDebugLabel(): string {
    return this.getPrimaryZone().name;
  }

  getDebugWeights(): string {
    return this.weights.map((w) => `${w.zone.id}:${w.weight.toFixed(2)}`).join(' ');
  }
}
