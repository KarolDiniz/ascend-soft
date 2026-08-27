import { materialMood } from '../ThemedPhases';
import type { Atmosphere } from './Atmosphere';
import type { AmbientType } from './AltitudeZones';
import { AMBIENT_PASTEL } from '../../theme/pastelPalette';

interface AmbientParticle {
  active: boolean;
  type: AmbientType;
  /** world space */
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  phase: number;
  layer: 0 | 1 | 2;
  rot: number;
  spin: number;
  flag: number;
}

/** Screen-space motes — always move across the canvas (cenário vivo) */
interface ScreenMote {
  active: boolean;
  type: AmbientType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  phase: number;
  layer: 0 | 1 | 2;
  rot: number;
  spin: number;
}

const WORLD_POOL = 560;
const SCREEN_POOL = 480;
const SPRINKLE_COLORS = [...AMBIENT_PASTEL.sprinkle];

export class AmbientParticles {
  private items: AmbientParticle[] = [];
  private screen: ScreenMote[] = [];
  private spawnAcc = 0;
  private screenAcc = 0;
  private sceneryAcc = 0;
  private microAcc = 0;
  private densityScale = 1;
  private warmed = false;
  private preferTiny = false;
  activeCount = 0;

  constructor() {
    for (let i = 0; i < WORLD_POOL; i++) {
      this.items.push({
        active: false,
        type: 'pollen',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 2,
        color: '#fff',
        alpha: 0.4,
        life: 0,
        maxLife: 1,
        phase: 0,
        layer: 1,
        rot: 0,
        spin: 0,
        flag: 0,
      });
    }
    for (let i = 0; i < SCREEN_POOL; i++) {
      this.screen.push({
        active: false,
        type: 'pollen',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 2,
        color: '#fff',
        alpha: 0.35,
        life: 0,
        maxLife: 1,
        phase: 0,
        layer: 1,
        rot: 0,
        spin: 0,
      });
    }
  }

  setMobileScale(scale: number): void {
    this.densityScale = Math.max(0.4, Math.min(1, scale));
  }

  private allocWorld(): AmbientParticle | null {
    for (const p of this.items) if (!p.active) return p;
    return null;
  }

  private allocScreen(): ScreenMote | null {
    for (const p of this.screen) if (!p.active) return p;
    return null;
  }

  update(
    dt: number,
    atm: Atmosphere,
    cameraY: number,
    viewW: number,
    viewH: number,
  ): void {
    const budget = Math.floor(atm.particleBudget * this.densityScale);
    const maxWorld = Math.min(WORLD_POOL, Math.max(90, Math.floor(budget * 0.62)));
    const maxScreen = Math.min(SCREEN_POOL, Math.max(80, Math.floor(budget * 0.58)));

    // Warm start: fill the view immediately
    if (!this.warmed) {
      this.warmed = true;
      for (let i = 0; i < maxWorld * 0.85; i++) this.spawnWorld(atm, cameraY, viewW, viewH);
      for (let i = 0; i < maxScreen * 0.9; i++) this.spawnScreen(atm, viewW, viewH, true);
    }

    this.spawnAcc += dt * (55 + atm.density * 95) * this.densityScale;
    while (this.spawnAcc >= 1 && this.countWorld() < maxWorld) {
      this.spawnAcc -= 1;
      this.spawnWorld(atm, cameraY, viewW, viewH);
    }

    this.screenAcc += dt * (70 + atm.density * 110) * this.densityScale;
    while (this.screenAcc >= 1 && this.countScreen() < maxScreen) {
      this.screenAcc -= 1;
      this.spawnScreen(atm, viewW, viewH, false);
    }

    this.updateWorld(dt, atm, cameraY, viewW, viewH);
    this.updateScreen(dt, viewW, viewH);
    this.tickMicroEvent(dt, atm, cameraY, viewW, viewH);
    this.activeCount = this.countWorld() + this.countScreen();
    this.preferTiny = this.activeCount > atm.particleBudget * 0.85 * this.densityScale;
  }

  private tickMicroEvent(
    dt: number,
    atm: Atmosphere,
    _cameraY: number,
    viewW: number,
    viewH: number,
  ): void {
    // ~1% chance per second scaled → accumulate
    this.microAcc += dt * 0.045;
    if (this.microAcc < 1) return;
    this.microAcc = 0;
    const id = atm.primaryId;
    const mood = materialMood(id);
    const n = Math.floor(36 * this.densityScale);
    for (let i = 0; i < n; i++) {
      const p = this.allocScreen();
      if (!p) break;
      p.active = true;
      p.layer = 1;
      p.phase = Math.random() * 10;
      p.rot = Math.random() * Math.PI;
      p.spin = (Math.random() - 0.5) * 3;
      p.x = Math.random() * viewW;
      p.life = 0.7 + Math.random() * 0.5;
      p.maxLife = p.life;
      p.alpha = 0.4;
      if (mood === 'food') {
        p.type = Math.random() > 0.45 ? 'sprinkle' : 'pollen';
        p.color = p.type === 'sprinkle' ? SPRINKLE_COLORS[i % SPRINKLE_COLORS.length] : AMBIENT_PASTEL.pollen;
        p.y = Math.random() > 0.5 ? -10 : viewH * 0.7 + Math.random() * 40;
        p.vx = (Math.random() - 0.5) * 35;
        p.vy = p.y < 0 ? 60 + Math.random() * 80 : -50 - Math.random() * 40;
        p.size = 2 + Math.random() * 3;
      } else if (mood === 'soap') {
        p.type = 'bubbleFloat';
        p.color = AMBIENT_PASTEL.bubble;
        p.y = viewH + 10;
        p.vx = (Math.random() - 0.5) * 25;
        p.vy = -70 - Math.random() * 50;
        p.size = 4 + Math.random() * 8;
      } else if (mood === 'frost') {
        p.type = 'snowMote';
        p.color = '#ffffff';
        p.y = -5;
        p.vx = 20 + Math.random() * 40;
        p.vy = 40 + Math.random() * 50;
        p.size = 2 + Math.random() * 3;
        p.alpha = 0.55;
      } else if (mood === 'ethereal') {
        p.type = 'lightOrb';
        p.color = AMBIENT_PASTEL.orb;
        p.y = -10;
        p.vx = (Math.random() - 0.5) * 20;
        p.vy = 35 + Math.random() * 40;
        p.size = 5 + Math.random() * 8;
        p.alpha = 0.28;
      } else {
        p.type = Math.random() > 0.5 ? 'sparkleIdle' : 'pollen';
        p.color = AMBIENT_PASTEL.sparkle;
        p.y = viewH * 0.5 + Math.random() * 30;
        p.vx = (Math.random() - 0.5) * 40;
        p.vy = -40 - Math.random() * 30;
        p.size = 3 + Math.random() * 4;
      }
    }
  }

  /** Emit particles from scenery prop screen positions (cenário) */
  emitFromScenery(
    emitters: { x: number; y: number; color: string }[],
    atm: Atmosphere,
    viewW: number,
    viewH: number,
    dt = 1 / 60,
  ): void {
    if (emitters.length === 0) return;
    this.sceneryAcc += dt * (55 + atm.density * 70) * this.densityScale * (1 + atm.gustStrength * 0.6);
    const mix = atm.getAmbientMix();
    while (this.sceneryAcc >= 1) {
      this.sceneryAcc -= 1;
      if (this.countScreen() >= SCREEN_POOL - 4) break;
      const e = emitters[(Math.random() * emitters.length) | 0] as {
        x: number;
        y: number;
        color: string;
        kind?: string;
      };
      if (e.x < -20 || e.x > viewW + 20 || e.y < -20 || e.y > viewH + 20) continue;
      const p = this.allocScreen();
      if (!p) break;
      const forced = this.typeForDecor(e.kind);
      const preset = forced
        ? { type: forced, color: e.color }
        : mix[(Math.random() * mix.length) | 0]?.preset;
      p.active = true;
      p.type = preset?.type ?? 'sparkleIdle';
      p.color = preset?.color ?? e.color;
      p.x = e.x + (Math.random() - 0.5) * 40;
      p.y = e.y + (Math.random() - 0.5) * 40;
      p.vx = (Math.random() - 0.5) * 110 + atm.windX * 0.5;
      p.vy = -45 - Math.random() * 90 + atm.windY * 0.2;
      p.size = 2 + Math.random() * 5;
      p.alpha = 0.45 + Math.random() * 0.3;
      p.life = 1.5 + Math.random() * 2;
      p.maxLife = p.life;
      p.phase = Math.random() * 10;
      p.layer = 2;
      p.rot = Math.random() * Math.PI;
      p.spin = (Math.random() - 0.5) * 4;
    }
  }

  private typeForDecor(kind?: string): AmbientType | null {
    if (!kind) return null;
    if (kind === 'leaf' || kind === 'hibiscus') return Math.random() > 0.5 ? 'petal' : 'pollen';
    if (kind === 'cake' || kind === 'donut' || kind === 'creamCloud' || kind === 'spoon') {
      return Math.random() > 0.5 ? 'sprinkle' : 'sugarDust';
    }
    if (kind === 'bottle' || kind === 'bigBubble' || kind === 'towel') return 'bubbleFloat';
    if (kind === 'crystal' || kind === 'iceBlock' || kind === 'snowflake') {
      return Math.random() > 0.5 ? 'frost' : 'sparkleIdle';
    }
    if (kind === 'lightRing' || kind === 'softOrb') return Math.random() > 0.5 ? 'lightOrb' : 'emberSoft';
    if (kind === 'citrus') return 'petal';
    if (kind === 'bird') return Math.random() > 0.6 ? 'pollen' : 'petal';
    return null;
  }

  private countWorld(): number {
    let n = 0;
    for (const p of this.items) if (p.active) n++;
    return n;
  }

  private countScreen(): number {
    let n = 0;
    for (const p of this.screen) if (p.active) n++;
    return n;
  }

  private updateWorld(
    dt: number,
    atm: Atmosphere,
    cameraY: number,
    viewW: number,
    viewH: number,
  ): void {
    const halfW = viewW * 0.6;
    for (const p of this.items) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        if (p.type === 'bubbleFloat' && p.flag < 1 && Math.random() > 0.5) {
          p.flag = 1;
          p.life = 0.2;
          p.maxLife = 0.2;
          p.type = 'sparkleIdle';
          p.size *= 1.3;
        } else {
          p.active = false;
        }
        continue;
      }

      const windMul = p.layer === 0 ? 0.35 : p.layer === 1 ? 0.7 : 1.1;
      p.x += (p.vx + atm.windX * windMul) * dt;
      p.y += (p.vy + atm.windY * windMul * 0.2) * dt;
      p.phase += dt;
      p.rot += p.spin * dt;

      switch (p.type) {
        case 'pollen':
          p.x += Math.sin(p.phase * 1.6 + p.size) * 38 * dt;
          p.y += 28 * dt;
          break;
        case 'petal':
          p.x += Math.sin(p.phase * 1.2) * 48 * dt;
          p.y -= 32 * dt;
          break;
        case 'bubbleFloat':
        case 'steam':
        case 'lightOrb':
        case 'emberSoft':
          p.y += 42 * dt;
          p.x += Math.sin(p.phase * 1.1 + p.size) * 28 * dt;
          break;
        case 'frost':
          p.y -= 55 * dt;
          p.x += 32 * dt + Math.sin(p.phase) * 12 * dt;
          break;
        case 'snowMote':
          p.y -= 38 * dt;
          p.x += Math.sin(p.phase * 0.8) * 24 * dt;
          break;
        case 'sugarDust':
        case 'foamSpeck':
          p.y -= 18 * dt;
          p.x += Math.sin(p.phase * 0.6) * 16 * dt;
          break;
        case 'sprinkle':
          p.y -= 70 * dt;
          p.x += Math.sin(p.phase) * 12 * dt;
          break;
        case 'dripAmbient':
          p.y -= 90 * dt;
          break;
        default:
          p.x += Math.sin(p.phase * 2) * 20 * dt;
          break;
      }

      const relY = p.y - cameraY;
      if (Math.abs(p.x) > halfW + 120 || relY > viewH * 0.8 || relY < -viewH * 0.8) {
        p.active = false;
      }
    }
  }

  private updateScreen(dt: number, viewW: number, viewH: number): void {
    for (const p of this.screen) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.phase += dt;
      p.rot += p.spin * dt;
      // gentle sway on top of velocity
      p.x += Math.sin(p.phase * 1.3) * 18 * dt;
      p.y += Math.cos(p.phase * 0.9) * 10 * dt;

      if (p.x < -60 || p.x > viewW + 60 || p.y < -60 || p.y > viewH + 60) {
        p.active = false;
      }
    }
  }

  private pickPreset(atm: Atmosphere) {
    const mix = atm.getAmbientMix();
    if (mix.length === 0) return null;
    let total = 0;
    for (const m of mix) total += m.weight;
    let r = Math.random() * total;
    for (const m of mix) {
      r -= m.weight;
      if (r <= 0) return m.preset;
    }
    return mix[0].preset;
  }

  private spawnWorld(
    atm: Atmosphere,
    cameraY: number,
    viewW: number,
    viewH: number,
  ): void {
    const preset = this.pickPreset(atm);
    if (!preset) return;
    const p = this.allocWorld();
    if (!p) return;

    const layer = (Math.random() < 0.28 ? 0 : Math.random() < 0.55 ? 1 : 2) as 0 | 1 | 2;
    p.active = true;
    p.type = preset.type;
    p.color =
      preset.type === 'sprinkle'
        ? SPRINKLE_COLORS[(Math.random() * SPRINKLE_COLORS.length) | 0]
        : preset.color;
    p.layer = layer;
    p.flag = 0;

    // Edge / path spawn so they travel across the view
    const mode = Math.random();
    const hw = viewW * 0.55;
    if (mode < 0.3) {
      // from left or right
      const side = Math.random() < 0.5 ? -1 : 1;
      p.x = side * (hw + 20);
      p.y = cameraY + (Math.random() - 0.5) * viewH * 0.9;
      p.vx = -side * (50 + Math.random() * 90);
      p.vy = (Math.random() - 0.5) * 50;
    } else if (mode < 0.55) {
      // rising from below
      p.x = (Math.random() - 0.5) * viewW;
      p.y = cameraY - viewH * 0.55;
      p.vx = (Math.random() - 0.5) * 40;
      p.vy = 55 + Math.random() * 80;
    } else if (mode < 0.75) {
      // falling from above
      p.x = (Math.random() - 0.5) * viewW;
      p.y = cameraY + viewH * 0.55;
      p.vx = (Math.random() - 0.5) * 35;
      p.vy = -(40 + Math.random() * 70);
    } else {
      p.x = (Math.random() - 0.5) * viewW * 1.1;
      p.y = cameraY + (Math.random() - 0.5) * viewH * 1.1;
      p.vx = (Math.random() - 0.5) * 70;
      p.vy = (Math.random() - 0.5) * 60;
    }

    this.applySizeAlpha(p, preset.type, layer);
    p.life = 4 + Math.random() * 7;
    p.maxLife = p.life;
    p.phase = Math.random() * Math.PI * 2;
    p.rot = Math.random() * Math.PI;
    p.spin = (Math.random() - 0.5) * (preset.type === 'sprinkle' ? 7 : 2.2);
  }

  private spawnScreen(
    atm: Atmosphere,
    viewW: number,
    viewH: number,
    fillCenter: boolean,
  ): void {
    const preset = this.pickPreset(atm);
    if (!preset) return;
    const p = this.allocScreen();
    if (!p) return;

    const layer = (Math.random() < 0.3 ? 0 : Math.random() < 0.5 ? 1 : 2) as 0 | 1 | 2;
    p.active = true;
    p.type = preset.type;
    p.color =
      preset.type === 'sprinkle'
        ? SPRINKLE_COLORS[(Math.random() * SPRINKLE_COLORS.length) | 0]
        : preset.color;
    p.layer = layer;

    if (fillCenter) {
      p.x = Math.random() * viewW;
      p.y = Math.random() * viewH;
      p.vx = (Math.random() - 0.5) * 80;
      p.vy = (Math.random() - 0.5) * 70;
    } else {
      const mode = Math.random();
      if (mode < 0.35) {
        const side = Math.random() < 0.5 ? 0 : viewW;
        p.x = side;
        p.y = Math.random() * viewH;
        p.vx = (side === 0 ? 1 : -1) * (55 + Math.random() * 100);
        p.vy = (Math.random() - 0.5) * 55;
      } else if (mode < 0.65) {
        p.x = Math.random() * viewW;
        p.y = viewH + 10;
        p.vx = (Math.random() - 0.5) * 40;
        p.vy = -(50 + Math.random() * 90);
      } else {
        p.x = Math.random() * viewW;
        p.y = -10;
        p.vx = (Math.random() - 0.5) * 45;
        p.vy = 45 + Math.random() * 85;
      }
    }

    const layerSize = layer === 0 ? 1.4 : layer === 1 ? 1 : 0.8;
    p.size =
      preset.type === 'steam'
        ? (this.preferTiny ? 8 : 14 + Math.random() * 20) * layerSize
        : preset.type === 'lightOrb'
          ? (this.preferTiny ? 4 : 6 + Math.random() * 10) * layerSize
          : preset.type === 'bubbleFloat'
            ? (4 + Math.random() * 7) * layerSize
            : (2 + Math.random() * 4) * layerSize;
    p.alpha =
      preset.type === 'steam' || preset.type === 'lightOrb'
        ? 0.14 + Math.random() * 0.18
        : 0.32 + Math.random() * 0.35;
    p.life = 3 + Math.random() * 5;
    p.maxLife = p.life;
    p.phase = Math.random() * Math.PI * 2;
    p.rot = Math.random() * Math.PI;
    p.spin = (Math.random() - 0.5) * 3;
  }

  private applySizeAlpha(
    p: AmbientParticle,
    type: AmbientType,
    layer: 0 | 1 | 2,
  ): void {
    const layerSize = layer === 0 ? 1.35 : layer === 1 ? 1 : 0.8;
    switch (type) {
      case 'lightOrb':
        p.size = (7 + Math.random() * 12) * layerSize;
        break;
      case 'steam':
        p.size = (12 + Math.random() * 22) * layerSize;
        break;
      case 'bubbleFloat':
        p.size = (3.5 + Math.random() * 7) * layerSize;
        break;
      case 'petal':
        p.size = (2.5 + Math.random() * 4.5) * layerSize;
        break;
      case 'frost':
        p.size = (3 + Math.random() * 5) * layerSize;
        break;
      default:
        p.size = (1.6 + Math.random() * 3.5) * layerSize;
    }
    p.alpha =
      type === 'steam' || type === 'lightOrb'
        ? 0.12 + Math.random() * 0.18
        : 0.3 + Math.random() * 0.35;
  }

  biomeBurst(x: number, y: number, atm: Atmosphere): void {
    const mix = atm.getAmbientMix();
    for (let i = 0; i < 84; i++) {
      const p = this.allocWorld();
      if (!p) break;
      const preset = mix[i % mix.length]?.preset ?? mix[0]?.preset;
      if (!preset) break;
      const a = Math.random() * Math.PI * 2;
      const sp = 50 + Math.random() * 130;
      p.active = true;
      p.type = preset.type;
      p.color =
        preset.type === 'sprinkle'
          ? SPRINKLE_COLORS[i % SPRINKLE_COLORS.length]
          : preset.color;
      p.layer = 2;
      p.x = x + (Math.random() - 0.5) * 24;
      p.y = y + (Math.random() - 0.5) * 24;
      p.vx = Math.cos(a) * sp;
      p.vy = Math.sin(a) * sp;
      p.size = 2.5 + Math.random() * 6;
      p.alpha = 0.55;
      p.life = 0.9 + Math.random() * 0.7;
      p.maxLife = p.life;
      p.phase = Math.random() * 10;
      p.rot = Math.random() * Math.PI;
      p.spin = (Math.random() - 0.5) * 5;
      p.flag = 0;
    }
  }

  drawFar(
    ctx: CanvasRenderingContext2D,
    toScreen: (x: number, y: number) => { x: number; y: number },
  ): void {
    this.drawWorldLayer(ctx, toScreen, 0);
    this.drawScreenLayer(ctx, 0);
  }

  drawMid(
    ctx: CanvasRenderingContext2D,
    toScreen: (x: number, y: number) => { x: number; y: number },
  ): void {
    this.drawWorldLayer(ctx, toScreen, 1);
    this.drawScreenLayer(ctx, 1);
  }

  drawNear(
    ctx: CanvasRenderingContext2D,
    toScreen: (x: number, y: number) => { x: number; y: number },
  ): void {
    this.drawWorldLayer(ctx, toScreen, 2);
    this.drawScreenLayer(ctx, 2);
  }

  private drawWorldLayer(
    ctx: CanvasRenderingContext2D,
    toScreen: (x: number, y: number) => { x: number; y: number },
    layer: 0 | 1 | 2,
  ): void {
    const layerA = layer === 0 ? 0.55 : layer === 1 ? 0.78 : 0.95;
    for (const p of this.items) {
      if (!p.active || p.layer !== layer) continue;
      const s = toScreen(p.x, p.y);
      const lifeFade = Math.min(1, p.life / Math.min(1.1, p.maxLife), p.life * 2);
      ctx.globalAlpha = p.alpha * lifeFade * layerA;
      this.drawShape(ctx, p.type, s.x, s.y, p.size, p.color, p.rot, p.phase);
    }
    ctx.globalAlpha = 1;
  }

  private drawScreenLayer(ctx: CanvasRenderingContext2D, layer: 0 | 1 | 2): void {
    const layerA = layer === 0 ? 0.5 : layer === 1 ? 0.75 : 0.95;
    for (const p of this.screen) {
      if (!p.active || p.layer !== layer) continue;
      const lifeFade = Math.min(1, p.life / Math.min(1.1, p.maxLife), p.life * 2);
      ctx.globalAlpha = p.alpha * lifeFade * layerA;
      this.drawShape(ctx, p.type, p.x, p.y, p.size, p.color, p.rot, p.phase);
    }
    ctx.globalAlpha = 1;
  }

  private drawShape(
    ctx: CanvasRenderingContext2D,
    type: AmbientType,
    x: number,
    y: number,
    size: number,
    color: string,
    rot: number,
    phase: number,
  ): void {
    ctx.imageSmoothingEnabled = false;
    const px = Math.round(x);
    const py = Math.round(y);
    const sz = Math.max(2, Math.round(size));
    ctx.fillStyle = color;

    switch (type) {
      case 'bubbleFloat': {
        const r = Math.max(2, Math.round(sz * (1 + Math.sin(phase * 2.2) * 0.06)));
        ctx.fillRect(px - r, py - 1, r * 2, 2);
        ctx.fillRect(px - 1, py - r, 2, r * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.fillRect(px - r + 1, py - r + 1, 2, 2);
        break;
      }
      case 'steam': {
        ctx.fillRect(px - sz, py, sz * 2, 2);
        ctx.globalAlpha *= 0.5;
        ctx.fillRect(px - sz + 2, py - 3, sz, 2);
        break;
      }
      case 'foamSpeck': {
        ctx.fillRect(px - sz, py - 1, sz * 2, 2);
        ctx.fillRect(px + 1, py - sz, 2, sz);
        ctx.fillRect(px - sz - 1, py + 1, 2, 2);
        break;
      }
      case 'frost': {
        for (let i = 0; i < 4; i++) {
          const a = rot + (i / 4) * Math.PI * 2;
          ctx.fillRect(
            px + Math.round(Math.cos(a) * sz),
            py + Math.round(Math.sin(a) * sz),
            2,
            2,
          );
        }
        ctx.fillRect(px, py, 2, 2);
        break;
      }
      case 'lightOrb':
      case 'emberSoft':
      case 'pollen': {
        const r = Math.max(2, Math.round(sz * (type === 'pollen' ? 1.4 : 1)));
        ctx.fillRect(px - Math.floor(r / 2), py - 1, r, 2);
        ctx.fillRect(px - 1, py - Math.floor(r / 2), 2, r);
        break;
      }
      case 'petal': {
        ctx.fillRect(px - sz, py - 1, sz * 2, 2);
        ctx.fillRect(px - 1, py - Math.floor(sz / 2), 2, sz);
        break;
      }
      case 'sugarDust': {
        for (let i = 0; i < 4; i++) {
          const ox = Math.round(Math.sin(phase + i * 1.7) * size * 1.2);
          const oy = Math.round(Math.cos(phase * 0.8 + i) * size);
          ctx.fillRect(px + ox, py + oy, 2, 2);
        }
        break;
      }
      case 'sprinkle': {
        ctx.fillRect(px - 1, py - sz, 2, sz * 2);
        break;
      }
      case 'dripAmbient': {
        ctx.fillRect(px, py, 2, sz + 2);
        break;
      }
      case 'snowMote': {
        ctx.globalAlpha *= 0.65 + Math.sin(phase * 4) * 0.35;
        ctx.fillRect(px, py, Math.max(2, sz), Math.max(2, sz));
        break;
      }
      default: {
        const tw = Math.max(2, Math.round(sz * (0.55 + Math.sin(phase * 5.5) * 0.45)));
        ctx.fillRect(px, py, tw, tw);
      }
    }
  }

  clear(): void {
    for (const p of this.items) p.active = false;
    for (const p of this.screen) p.active = false;
    this.activeCount = 0;
    this.spawnAcc = 0;
    this.screenAcc = 0;
    this.sceneryAcc = 0;
    this.warmed = false;
  }
}
