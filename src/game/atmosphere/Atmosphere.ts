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

function hexToRgb(c: string): [number, number, number] {
  const n = parseInt(c.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0'))
      .join('')
  );
}

function lerpHex(a: string, b: string, t: number): string {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  return rgbToHex(
    pa[0] + (pb[0] - pa[0]) * t,
    pa[1] + (pb[1] - pa[1]) * t,
    pa[2] + (pb[2] - pa[2]) * t,
  );
}

export class Atmosphere {
  height = 0;
  private weights: ZoneWeight[] = [];
  windX = 0;
  windY = 0;
  /** Gust overlay on wind */
  gustX = 0;
  gustY = 0;
  density = 0.55;
  breathPeriod = 11;
  grainAlpha = 0.04;
  particleBudget = 180;
  primaryId: ZoneId = 'garden';
  private lastPrimary: ZoneId = 'garden';
  /** True for one frame when crossing into a new primary zone */
  biomeEntered: ZoneId | null = null;
  /** Brightness flash 0→1 on biome enter */
  enterFlash = 0;
  private gustTimer = 4 + Math.random() * 3;

  update(dt: number, height: number): void {
    this.height = Math.max(0, height);
    this.biomeEntered = null;
    this.weights = this.computeWeights(this.height);

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
    if (this.gustTimer <= 0) {
      this.gustTimer = 4 + Math.random() * 3;
      this.gustX = (Math.random() - 0.5) * 40;
      this.gustY = (Math.random() - 0.3) * 18;
    } else {
      this.gustX *= 1 - 1.8 * dt;
      this.gustY *= 1 - 1.8 * dt;
    }

    this.windX = wx + this.gustX;
    this.windY = wy + this.gustY;
    this.density = dens;
    this.breathPeriod = breath || 11;
    this.grainAlpha = grain;
    this.particleBudget = budget || 180;

    if (this.enterFlash > 0) {
      this.enterFlash = Math.max(0, this.enterFlash - dt * 2.5);
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
    const idx = zoneIndexAt(h);
    const cur = ALTITUDE_ZONES[idx];
    const next = ALTITUDE_ZONES[idx + 1];
    if (!next) return [{ zone: cur, weight: 1 }];

    const boundary = cur.maxY;
    const t = Math.min(1, Math.max(0, (h - (boundary - ZONE_BLEND)) / (ZONE_BLEND * 2)));
    const s = t * t * (3 - 2 * t);
    if (s <= 0.02) return [{ zone: cur, weight: 1 }];
    if (s >= 0.98) return [{ zone: next, weight: 1 }];
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
    const a = this.weights[0];
    const b = this.weights[1];
    const t = b.weight;
    return {
      top: lerpHex(a.zone.palette.top, b.zone.palette.top, t),
      mid: lerpHex(a.zone.palette.mid, b.zone.palette.mid, t),
      bottom: lerpHex(a.zone.palette.bottom, b.zone.palette.bottom, t),
      accent: lerpHex(a.zone.palette.accent, b.zone.palette.accent, t),
      blob: a.zone.palette.blob.map((c, i) =>
        lerpHex(c, b.zone.palette.blob[i % b.zone.palette.blob.length], t),
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
    if (this.weights.length === 1) return this.weights[0].zone.palette.blob;
    const a = this.weights[0].zone.palette.blob;
    const b = this.weights[1]?.zone.palette.blob ?? a;
    const t = this.weights[1]?.weight ?? 0;
    return t > 0.5 ? b : a;
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
