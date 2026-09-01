import { getAltitudeZones, type DecorKind, type ZoneId } from './AltitudeZones';
import type { Atmosphere } from './Atmosphere';
import { materialSceneryColors } from '../ThemedPhases';
import { rgba, PASTEL } from '../../theme/pastelPalette';
import { drawDecor } from './BiomeDecor';
import { drawHorizon } from './HorizonDecor';

interface SceneryProp {
  zoneId: ZoneId;
  kind: DecorKind;
  nx: number;
  ny: number;
  scale: number;
  layer: 0 | 1 | 2 | 3;
  phase: number;
  speed: number;
  color: string;
  alpha: number;
  targetAlpha: number;
  /** Horizontal flight — pássaros na fase grama */
  flyDir: 1 | -1;
  flySpeed: number;
}

interface BiomeSpriteSet {
  far: HTMLImageElement | null;
  mid: HTMLImageElement | null;
  accent: HTMLImageElement | null;
}

const PARALLAX = [0.05, 0.1, 0.18, 0.26];
const PROP_COUNT = 90;
/** Slow crossfade — scenery melts between phases */
const FADE_SPEED = 0.32;
/** Far layers appear first during phase transitions */
const LAYER_FADE = [1.45, 1.25, 0.92, 0.78];

function decorMotion(kind: DecorKind, phase: number): { scaleMul: number; extraBob: number; extraSway: number } {
  switch (kind) {
    case 'bigBubble':
    case 'slimeStretch':
    case 'bubbleCell':
      return { scaleMul: 1 + Math.sin(phase * 1.4) * 0.06, extraBob: Math.sin(phase * 0.9) * 8, extraSway: 0 };
    case 'sandDune':
    case 'ribbon':
      return { scaleMul: 1, extraBob: 0, extraSway: Math.sin(phase * 0.5) * 14 };
    case 'snowflake':
    case 'iceBlock':
      return { scaleMul: 1, extraBob: 0, extraSway: 0 };
    case 'marimbaBar':
    case 'windChime':
      return { scaleMul: 1 + Math.sin(phase * 2.2) * 0.03, extraBob: Math.sin(phase * 3) * 4, extraSway: 0 };
    case 'steamWisp':
      return { scaleMul: 1, extraBob: -Math.abs(Math.sin(phase * 0.7)) * 12, extraSway: Math.sin(phase * 0.4) * 6 };
    case 'yarnBall':
    case 'cottonPuff':
      return { scaleMul: 1 + Math.sin(phase * 0.8) * 0.04, extraBob: Math.cos(phase * 0.6) * 6, extraSway: 0 };
    default:
      return { scaleMul: 1, extraBob: 0, extraSway: 0 };
  }
}

function zoneColors(id: ZoneId): string[] {
  return materialSceneryColors(id);
}

export class SceneryLayer {
  private props: SceneryProp[] = [];
  private sprites = new Map<ZoneId, BiomeSpriteSet>();
  private time = 0;
  private skipFar = false;
  private maxDraw = 9999;
  activeCount = 0;
  lastEmitterCount = 0;
  private startZone: ZoneId = 'butter';

  private biomeSpritesLoaded = false;

  constructor() {
    this.seedProps(this.startZone);
  }

  configurePerf(opts: { skipBiomeSprites?: boolean; maxDraw?: number; forceLow?: boolean }): void {
    if (opts.maxDraw !== undefined) this.maxDraw = opts.maxDraw;
    if (opts.forceLow === true) this.skipFar = true;
    else if (opts.forceLow === false) this.skipFar = false;
    if (opts.skipBiomeSprites === false && !this.biomeSpritesLoaded) {
      this.preloadSprites();
      this.biomeSpritesLoaded = true;
    }
  }

  /** Re-seed decor for a new run — first phase aleatória */
  resetForRun(startMaterial: ZoneId): void {
    this.startZone = startMaterial;
    this.seedProps(startMaterial);
  }

  private seedProps(startZone: ZoneId): void {
    const zones = getAltitudeZones();
    this.props.length = 0;
    let i = 0;
    for (const zone of zones) {
      const perZone = Math.max(3, Math.floor(PROP_COUNT / zones.length));
      for (let k = 0; k < perZone; k++) {
        const kind = zone.scenery[k % zone.scenery.length];
        const isBird = kind === 'bird';
        const layer = (isBird ? 2 + (k % 2) : k % 4) as 0 | 1 | 2 | 3;
        const colors = zoneColors(zone.id);
        this.props.push({
          zoneId: zone.id,
          kind,
          nx: isBird ? Math.random() : (i * 0.17 + k * 0.23 + Math.random() * 0.1) % 1,
          ny: isBird ? 0.05 + (k * 0.09 + Math.random() * 0.08) : 0.12 + ((i * 0.31 + k * 0.19) % 0.76),
          scale: isBird ? 52 + Math.random() * 28 : layer < 2 ? 70 + Math.random() * 90 : 40 + Math.random() * 55,
          layer,
          phase: Math.random() * Math.PI * 2,
          speed: isBird ? 0.55 + Math.random() * 0.35 : 0.35 + Math.random() * 0.55,
          color: isBird ? rgba(PASTEL.seafoam, 0.58) : colors[k % colors.length],
          alpha: zone.id === startZone ? 0.85 : 0,
          targetAlpha: zone.id === startZone ? 0.85 : 0,
          flyDir: isBird ? (Math.random() > 0.5 ? 1 : -1) : 1,
          flySpeed: isBird ? 0.028 + Math.random() * 0.022 : 0,
        });
        i++;
      }
    }
    for (const zone of zones) {
      const hero = zone.scenery[0];
      const colors = zoneColors(zone.id);
      this.props.push({
        zoneId: zone.id,
        kind: hero,
        nx: 0.18 + Math.random() * 0.2,
        ny: 0.35 + Math.random() * 0.2,
        scale: 110 + Math.random() * 50,
        layer: 2,
        phase: Math.random() * 10,
        speed: 0.25 + Math.random() * 0.2,
        color: colors[0],
        alpha: zone.id === startZone ? 0.9 : 0,
        targetAlpha: zone.id === startZone ? 0.9 : 0,
        flyDir: 1,
        flySpeed: 0,
      });
      this.props.push({
        zoneId: zone.id,
        kind: zone.scenery[1] ?? hero,
        nx: 0.62 + Math.random() * 0.2,
        ny: 0.4 + Math.random() * 0.2,
        scale: 95 + Math.random() * 40,
        layer: 3,
        phase: Math.random() * 10,
        speed: 0.3 + Math.random() * 0.25,
        color: colors[1],
        alpha: zone.id === startZone ? 0.85 : 0,
        targetAlpha: zone.id === startZone ? 0.85 : 0,
        flyDir: 1,
        flySpeed: 0,
      });
    }
    // Pássaros extras sobrevoando a grama
    if (zones.some((z) => z.id === 'grass')) {
      for (let b = 0; b < 3; b++) {
        this.props.push({
          zoneId: 'grass',
          kind: 'bird',
          nx: Math.random(),
          ny: 0.04 + b * 0.07 + Math.random() * 0.05,
          scale: 48 + Math.random() * 32,
          layer: (2 + (b % 2)) as 2 | 3,
          phase: Math.random() * Math.PI * 2,
          speed: 0.6 + Math.random() * 0.4,
          color: rgba(PASTEL.sky, 0.52),
          alpha: 0,
          targetAlpha: 0,
          flyDir: b % 2 === 0 ? 1 : -1,
          flySpeed: 0.032 + Math.random() * 0.018,
        });
      }
    }
  }

  private preloadSprites(): void {
    for (const z of getAltitudeZones()) {
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
      p.targetAlpha = w * 0.95 * layerMul;
      const diff = p.targetAlpha - p.alpha;
      const fadeMul = LAYER_FADE[p.layer] ?? 1;
      const step = Math.min(Math.abs(diff), FADE_SPEED * dt * (0.35 + Math.abs(diff) * 1.6) * fadeMul);
      p.alpha += Math.sign(diff) * step;
      p.phase += dt * p.speed;
      if (p.kind === 'snowflake' || p.kind === 'iceBlock') {
        p.phase += dt * 0.12;
      }
      if (p.kind === 'bird' && p.flySpeed > 0) {
        p.nx += p.flyDir * p.flySpeed * dt;
        if (p.nx < -0.14) p.nx += 1.28;
        if (p.nx > 1.14) p.nx -= 1.28;
      }
      if (p.alpha > 0.015) this.activeCount++;
    }
  }

  collectEmitters(w: number, h: number, cameraY: number): { x: number; y: number; color: string; kind: string }[] {
    const out: { x: number; y: number; color: string; kind: string }[] = [];
    for (const p of this.props) {
      if (p.alpha < 0.12) continue;
      const { x, y } = this.propScreenPos(p, w, h, cameraY);
      if (y < -40 || y > h + 40 || x < -40 || x > w + 40) continue;
      out.push({ x, y, color: p.color, kind: p.kind });
    }
    this.lastEmitterCount = out.length;
    return out;
  }

  drawFar(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    cameraY: number,
    atm: Atmosphere,
  ): void {
    ctx.imageSmoothingEnabled = false;
    this.drawHorizons(ctx, w, h, cameraY, atm);
    this.drawSpriteLayer(ctx, w, h, cameraY, atm, 'far', 0.07);
    this.drawProps(ctx, w, h, cameraY, 0, 1, atm);
  }

  drawMid(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    cameraY: number,
    atm: Atmosphere,
  ): void {
    ctx.imageSmoothingEnabled = false;
    this.drawSpriteLayer(ctx, w, h, cameraY, atm, 'mid', 0.18);
    this.drawProps(ctx, w, h, cameraY, 2, 3, atm);
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
      if (weight < 0.04) continue;
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

  private drawHorizons(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    cameraY: number,
    atm: Atmosphere,
  ): void {
    const scroll = -((cameraY * 0.04) % (h * 0.35));
    for (const { zone, weight } of atm.getWeights()) {
      if (weight < 0.04) continue;
      const colors = zoneColors(zone.id);
      const baseY = h * 0.58 + scroll;
      ctx.save();
      ctx.globalAlpha = weight * 0.22;
      drawHorizon(ctx, zone.horizon, w, h, baseY, colors[1] ?? colors[0], this.time + zone.id.length);
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
    atm: Atmosphere,
  ): void {
    const lx = atm.lightDirX;
    const ly = atm.lightDirY;
    const accent = atm.getAccent();
    let drawn = 0;

    for (const p of this.props) {
      if (drawn >= this.maxDraw) break;
      if (p.layer < layerMin || p.layer > layerMax || p.alpha < 0.015) continue;
      const { x, y } = this.propScreenPos(p, w, h, cameraY);

      if (y < -p.scale * 2 || y > h + p.scale * 2) continue;
      if (x < -p.scale * 2 || x > w + p.scale * 2) continue;

      const vis = p.alpha * (0.62 + p.layer * 0.1);
      const motion = decorMotion(p.kind, p.phase);
      const s = p.scale * motion.scaleMul;
      const isBird = p.kind === 'bird';

      // Soft contact shadow (light-driven offset) — skip for birds and low-perf
      if (!isBird && !this.skipFar) {
        ctx.save();
        ctx.globalAlpha = vis * 0.28;
        const sx = x - lx * s * 0.35;
        const sy = y + s * 0.52 + ly * s * 0.08;
        const sh = ctx.createRadialGradient(sx, sy, 0, sx, sy, s * 0.55);
        sh.addColorStop(0, rgba(accent, 0.32));
        sh.addColorStop(0.55, rgba(accent, 0.1));
        sh.addColorStop(1, rgba(accent, 0));
        ctx.fillStyle = sh;
        ctx.beginPath();
        ctx.ellipse(sx, sy, s * 0.52, s * 0.14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Prop body
      ctx.save();
      ctx.globalAlpha = vis;
      drawDecor(ctx, p.kind, x, y, s, p.phase, p.color, p.flyDir);
      ctx.restore();
      drawn++;

      if (isBird) continue;
      if (this.skipFar) continue;

      // Soft rim light / highlight from top-left
      ctx.save();
      ctx.globalAlpha = vis * 0.22;
      ctx.globalCompositeOperation = 'soft-light';
      const hx = x + lx * s * 0.15;
      const hy = y - s * 0.25;
      const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, s * 0.7);
      hg.addColorStop(0, 'rgba(255, 252, 245, 0.85)');
      hg.addColorStop(0.4, accent);
      hg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.arc(x, y, s * 0.72, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Gentle ambient occlusion under prop
      ctx.save();
      ctx.globalAlpha = vis * 0.12;
      ctx.globalCompositeOperation = 'multiply';
      const ao = ctx.createRadialGradient(x, y + s * 0.35, 0, x, y + s * 0.35, s * 0.5);
      ao.addColorStop(0, rgba(accent, 0.22));
      ao.addColorStop(1, rgba(accent, 0));
      ctx.fillStyle = ao;
      ctx.beginPath();
      ctx.ellipse(x, y + s * 0.4, s * 0.4, s * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private propScreenPos(
    p: SceneryProp,
    w: number,
    h: number,
    cameraY: number,
  ): { x: number; y: number } {
    const px = PARALLAX[p.layer];
    const motion = decorMotion(p.kind, p.phase);
    const sway =
      p.kind === 'bird'
        ? Math.sin(p.phase * 0.7) * 5
        : Math.sin(p.phase) * (12 + p.layer * 4) + motion.extraSway;
    const bob =
      p.kind === 'bird'
        ? Math.sin(p.phase * 0.45) * 6 + Math.cos(p.phase * 0.22) * 3
        : Math.cos(p.phase * 0.85) * (8 + p.layer * 3) + motion.extraBob;
    const scroll = -(cameraY * px);
    const x = p.nx * w + sway;
    const band = h + p.scale * 2;
    const y = ((((p.ny * h + scroll + bob) % band) + band) % band) - p.scale;
    return { x, y };
  }
}
