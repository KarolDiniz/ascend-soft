import type { Atmosphere } from './Atmosphere';
import type { AmbientType } from './AltitudeZones';

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

const WORLD_POOL = 280;
const SCREEN_POOL = 180;
const SPRINKLE_COLORS = ['#ff9eb5', '#8fd4c8', '#ffd07a', '#c9b6ff', '#fff5f0'];

export class AmbientParticles {
  private items: AmbientParticle[] = [];
  private screen: ScreenMote[] = [];
  private spawnAcc = 0;
  private screenAcc = 0;
  private sceneryAcc = 0;
  private densityScale = 1;
  private warmed = false;
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
    const maxWorld = Math.min(WORLD_POOL, Math.max(50, Math.floor(budget * 0.55)));
    const maxScreen = Math.min(SCREEN_POOL, Math.max(40, Math.floor(budget * 0.5)));

    // Warm start: fill the view immediately
    if (!this.warmed) {
      this.warmed = true;
      for (let i = 0; i < maxWorld * 0.7; i++) this.spawnWorld(atm, cameraY, viewW, viewH);
      for (let i = 0; i < maxScreen * 0.8; i++) this.spawnScreen(atm, viewW, viewH, true);
    }

    this.spawnAcc += dt * (32 + atm.density * 55) * this.densityScale;
    while (this.spawnAcc >= 1 && this.countWorld() < maxWorld) {
      this.spawnAcc -= 1;
      this.spawnWorld(atm, cameraY, viewW, viewH);
    }

    this.screenAcc += dt * (40 + atm.density * 60) * this.densityScale;
    while (this.screenAcc >= 1 && this.countScreen() < maxScreen) {
      this.screenAcc -= 1;
      this.spawnScreen(atm, viewW, viewH, false);
    }

    this.updateWorld(dt, atm, cameraY, viewW, viewH);
    this.updateScreen(dt, viewW, viewH);
    this.activeCount = this.countWorld() + this.countScreen();
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
    this.sceneryAcc += dt * (10 + atm.density * 14) * this.densityScale;
    const mix = atm.getAmbientMix();
    while (this.sceneryAcc >= 1) {
      this.sceneryAcc -= 1;
      if (this.countScreen() >= SCREEN_POOL - 4) break;
      const e = emitters[(Math.random() * emitters.length) | 0];
      if (e.x < -20 || e.x > viewW + 20 || e.y < -20 || e.y > viewH + 20) continue;
      const p = this.allocScreen();
      if (!p) break;
      const preset = mix[(Math.random() * mix.length) | 0]?.preset;
      p.active = true;
      p.type = preset?.type ?? 'sparkleIdle';
      p.color = preset?.color ?? e.color;
      p.x = e.x + (Math.random() - 0.5) * 36;
      p.y = e.y + (Math.random() - 0.5) * 36;
      p.vx = (Math.random() - 0.5) * 100;
      p.vy = -40 - Math.random() * 80;
      p.size = 2 + Math.random() * 4.5;
      p.alpha = 0.42 + Math.random() * 0.28;
      p.life = 1.4 + Math.random() * 1.8;
      p.maxLife = p.life;
      p.phase = Math.random() * 10;
      p.layer = 2;
      p.rot = Math.random() * Math.PI;
      p.spin = (Math.random() - 0.5) * 4;
    }
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
        ? (14 + Math.random() * 20) * layerSize
        : preset.type === 'lightOrb'
          ? (6 + Math.random() * 10) * layerSize
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
    for (let i = 0; i < 72; i++) {
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
    switch (type) {
      case 'bubbleFloat': {
        const pulse = 1 + Math.sin(phase * 2.2) * 0.06;
        const r = size * pulse;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(x - r * 0.32, y - r * 0.32, r * 0.22, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'steam': {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x, y, size, size * 0.5, rot, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha *= 0.45;
        ctx.beginPath();
        ctx.ellipse(x + size * 0.2, y - size * 0.15, size * 0.7, size * 0.35, rot + 0.3, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'foamSpeck': {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.arc(x + size * 0.6, y - size * 0.2, size * 0.7, 0, Math.PI * 2);
        ctx.arc(x - size * 0.4, y + size * 0.3, size * 0.55, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'frost': {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.1;
        ctx.lineCap = 'round';
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * size, Math.sin(a) * size);
          ctx.stroke();
        }
        ctx.restore();
        break;
      }
      case 'lightOrb':
      case 'emberSoft':
      case 'pollen': {
        const pulse = 1 + Math.sin(phase * 1.8) * 0.1;
        const r = size * pulse * (type === 'pollen' ? 1.6 : 1);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, type === 'pollen' ? color : 'rgba(255,248,235,0.75)');
        g.addColorStop(0.5, color);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'petal': {
        ctx.fillStyle = color;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 1.5, size * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha *= 0.55;
        ctx.beginPath();
        ctx.ellipse(0, size * 0.15, size * 1.1, size * 0.28, 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;
      }
      case 'sugarDust': {
        ctx.fillStyle = color;
        for (let i = 0; i < 4; i++) {
          const ox = Math.sin(phase + i * 1.7) * size * 1.2;
          const oy = Math.cos(phase * 0.8 + i) * size;
          ctx.beginPath();
          ctx.arc(x + ox, y + oy, 0.8 + (i % 2) * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'sprinkle': {
        ctx.fillStyle = color;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.fillRect(-size * 0.35, -size * 1.2, size * 0.7, size * 2.4);
        ctx.restore();
        break;
      }
      case 'dripAmbient': {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(x, y, size * 0.4, size * 1.1, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'snowMote': {
        ctx.fillStyle = color;
        ctx.globalAlpha *= 0.65 + Math.sin(phase * 4) * 0.35;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      default: {
        const tw = 0.55 + Math.sin(phase * 5.5) * 0.45;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size * tw, 0, Math.PI * 2);
        ctx.fill();
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
