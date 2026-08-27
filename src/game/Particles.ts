import type { MaterialId, ParticleStyle } from '../audio/materials';
import { PASTEL } from '../theme/pastelPalette';
import { isSoapBarMaterial } from './platform/soapColors';

export type GameplayFx =
  | ParticleStyle
  | 'dustRing'
  | 'shockSoft'
  | 'footSpeck'
  | 'pressAura'
  | 'releasePuff'
  | 'meltRibbon'
  | 'butterSpread'
  | 'crackSpark'
  | 'ring';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: GameplayFx;
  active: boolean;
  rot: number;
  spin: number;
}

interface RingFx {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  color: string;
  kind: 'land' | 'dust' | 'shock';
}

interface DelayedWave {
  active: boolean;
  t: number;
  x: number;
  y: number;
  color: string;
  tint: string;
  style: ParticleStyle;
  count: number;
  mode: 'mist' | 'residual' | 'glitter' | 'confetti';
}

const POOL = 420;
const WAVE_SLOTS = 24;

/** Material → secondary juice style for land waves */
const MAT_SECONDARY: Partial<Record<MaterialId, ParticleStyle>> = {
  jelly: 'foam',
  mochi: 'foam',
  marshmallow: 'foam',
  sponge: 'foam',
  whipped: 'foamBurst',
  soapBubble: 'bubble',
  bathFoam: 'foamBurst',
  bubbleWrap: 'foamBurst',
  clearSlime: 'foam',
  butterSlime: 'foam',
  butter: 'drip',
  chocolate: 'drip',
  honeycomb: 'drip',
  kinetic: 'sand',
  iceSoap: 'bubble',
  glycerin: 'bubble',
  lavenderSoap: 'glitter',
  creamSoap: 'bubble',
  citrus: 'zest',
  keyboard: 'crumb',
};

export class Particles {
  private items: Particle[] = [];
  private rings: RingFx[] = [];
  private waves: DelayedWave[] = [];
  private densityScale = 1;
  private allowContinuous = true;
  activeCount = 0;
  windX = 0;
  windY = 0;

  private footAcc = 0;
  private pressAcc = 0;
  private airTrailAcc = 0;
  private squeezeAcc = 0;

  constructor() {
    for (let i = 0; i < POOL; i++) {
      this.items.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        size: 2,
        color: '#fff',
        type: 'crumb',
        active: false,
        rot: 0,
        spin: 0,
      });
    }
    for (let i = 0; i < WAVE_SLOTS; i++) {
      this.waves.push({
        active: false,
        t: 0,
        x: 0,
        y: 0,
        color: '#fff',
        tint: '#fff',
        style: 'crumb',
        count: 8,
        mode: 'mist',
      });
    }
  }

  setMobileScale(scale: number): void {
    this.densityScale = Math.max(0.45, Math.min(1, scale));
  }

  setAllowContinuous(ok: boolean): void {
    this.allowContinuous = ok;
  }

  setWind(x: number, y: number): void {
    this.windX = x;
    this.windY = y;
  }

  private alloc(): Particle | null {
    for (const p of this.items) {
      if (!p.active) return p;
    }
    return null;
  }

  private allocWave(): DelayedWave | null {
    for (const w of this.waves) {
      if (!w.active) return w;
    }
    return null;
  }

  private cap(n: number): number {
    return Math.max(1, Math.floor(n * this.densityScale));
  }

  private spawn(
    x: number,
    y: number,
    color: string,
    type: GameplayFx,
    opts: {
      vx?: number;
      vy?: number;
      life?: number;
      size?: number;
      spin?: number;
    } = {},
  ): void {
    const p = this.alloc();
    if (!p) return;
    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = opts.vx ?? 0;
    p.vy = opts.vy ?? 0;
    p.life = opts.life ?? 0.6;
    p.maxLife = p.life;
    p.size = opts.size ?? 3;
    p.color = color;
    p.type = type;
    p.rot = Math.random() * Math.PI;
    p.spin = opts.spin ?? (Math.random() - 0.5) * 6;
  }

  /** Layered land burst — Wave A immediate + delayed B/C */
  landBurst(
    x: number,
    y: number,
    color: string,
    style: ParticleStyle,
    impact: number,
    perfect: boolean,
    zoneAccent: string,
    materialId?: MaterialId,
  ): void {
    const tint = zoneAccent;
    const secondary = (materialId && MAT_SECONDARY[materialId]) || style;
    const nA = this.cap(18 + Math.floor(impact * 14) + (perfect ? 8 : 0));

    // Wave A — impact
    for (let i = 0; i < nA; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
      const speed = 26 + Math.random() * (perfect ? 90 : 58);
      this.spawn(x + (Math.random() - 0.5) * 24, y + Math.random() * 3, Math.random() > 0.6 ? tint : color, style, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 10,
        life: 0.55 + Math.random() * 0.75,
        size: style === 'glitter' || style === 'spark' ? 2 + Math.random() * 2.5 : 3 + Math.random() * 4.5,
      });
    }

    // Extra shard ring on strong impact
    if (impact > 0.45) {
      for (let i = 0; i < this.cap(6 + Math.floor(impact * 6)); i++) {
        const a = (i / 8) * Math.PI * 2;
        this.spawn(x, y, color, style, {
          vx: Math.cos(a) * (35 + impact * 40),
          vy: Math.sin(a) * (25 + impact * 30) + 15,
          life: 0.4 + Math.random() * 0.35,
          size: 2 + Math.random() * 2,
        });
      }
    }

    // Dust ring always on land
    this.rings.push({
      x,
      y,
      life: 0.45 + impact * 0.15,
      maxLife: 0.45 + impact * 0.15,
      color: tint,
      kind: 'dust',
    });

    // Wave B — mist / secondary
    const wB = this.allocWave();
    if (wB) {
      wB.active = true;
      wB.t = 0.05 + Math.random() * 0.03;
      wB.x = x;
      wB.y = y;
      wB.color = color;
      wB.tint = tint;
      wB.style = secondary;
      wB.count = this.cap(12 + Math.floor(impact * 8));
      wB.mode = 'mist';
    }

    // Wave C — residual floaters
    const wC = this.allocWave();
    if (wC) {
      wC.active = true;
      wC.t = 0.12 + Math.random() * 0.05;
      wC.x = x;
      wC.y = y;
      wC.color = color;
      wC.tint = tint;
      wC.style = 'foam';
      wC.count = this.cap(10 + Math.floor(impact * 6));
      wC.mode = 'residual';
    }

    if (perfect) {
      this.rings.push({ x, y, life: 0.55, maxLife: 0.55, color: tint, kind: 'land' });
      this.rings.push({ x, y, life: 0.4, maxLife: 0.4, color: tint, kind: 'shock' });
      for (let i = 0; i < this.cap(10); i++) {
        const a = Math.random() * Math.PI * 2;
        this.spawn(x, y, tint, 'shockSoft', {
          vx: Math.cos(a) * (30 + Math.random() * 50),
          vy: Math.sin(a) * (20 + Math.random() * 40) + 20,
          life: 0.5 + Math.random() * 0.35,
          size: 2 + Math.random() * 2,
        });
      }
      const wG = this.allocWave();
      if (wG) {
        wG.active = true;
        wG.t = 0.1;
        wG.x = x;
        wG.y = y;
        wG.color = tint;
        wG.tint = tint;
        wG.style = 'glitter';
        wG.count = this.cap(12);
        wG.mode = 'glitter';
      }
      const wCf = this.allocWave();
      if (wCf) {
        wCf.active = true;
        wCf.t = 0.18;
        wCf.x = x;
        wCf.y = y;
        wCf.color = tint;
        wCf.tint = tint;
        wCf.style = 'glitter';
        wCf.count = this.cap(10);
        wCf.mode = 'confetti';
      }
    }
  }

  /** Legacy burst API — still used by behaviors / breath */
  burst(
    x: number,
    y: number,
    color: string,
    count: number,
    style: ParticleStyle = 'crumb',
    perfect = false,
    zoneAccent?: string,
  ): void {
    if (perfect) {
      this.landBurst(x, y, color, style, 1, true, zoneAccent ?? color);
      return;
    }
    const n = this.cap(Math.min(count + 2, 28));
    const tint = zoneAccent ?? color;
    for (let i = 0; i < n; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
      const speed = 20 + Math.random() * 50;
      this.spawn(x + (Math.random() - 0.5) * 18, y, Math.random() > 0.7 ? tint : color, style, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 8,
        life: 0.5 + Math.random() * 0.7,
        size: 2.5 + Math.random() * 3.5,
      });
    }
  }

  releasePuff(x: number, y: number, color: string, accent: string): void {
    const n = this.cap(14);
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6;
      const sp = 35 + Math.random() * 70;
      this.spawn(x + (Math.random() - 0.5) * 16, y, Math.random() > 0.5 ? accent : color, 'releasePuff', {
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp + 30,
        life: 0.45 + Math.random() * 0.4,
        size: 2.5 + Math.random() * 3,
      });
    }
    this.rings.push({ x, y, life: 0.28, maxLife: 0.28, color: accent, kind: 'dust' });
  }

  /** Continuous while grounded — call each frame with dt */
  emitGrounded(
    dt: number,
    x: number,
    surfaceY: number,
    vx: number,
    pressAmount: number,
    squash: number,
    color: string,
    _style: ParticleStyle,
    materialId: MaterialId,
    behavior: string,
    accent: string,
  ): void {
    if (!this.allowContinuous) return;
    if (isSoapBarMaterial(materialId)) return;

    const speed = Math.abs(vx);
    this.footAcc += dt * (speed * 0.08 + 1.2) * this.densityScale;
    while (this.footAcc >= 1) {
      this.footAcc -= 1;
      this.spawn(x + (Math.random() - 0.5) * 16, surfaceY + 1, color, 'footSpeck', {
        vx: -vx * 0.15 + (Math.random() - 0.5) * 28 + this.windX * 0.4,
        vy: 8 + Math.random() * 28,
        life: 0.35 + Math.random() * 0.4,
        size: 1.5 + Math.random() * 2.2,
      });
    }

    const press = Math.max(0, pressAmount) * squash;
    this.pressAcc += dt * (4.5 + press * 14) * this.densityScale;
    while (this.pressAcc >= 1) {
      this.pressAcc -= 1;
      this.spawn(x + (Math.random() - 0.5) * 26, surfaceY, Math.random() > 0.55 ? accent : color, 'pressAura', {
        vx: (Math.random() - 0.5) * 22,
        vy: 12 + Math.random() * 32,
        life: 0.4 + Math.random() * 0.4,
        size: 2 + Math.random() * 3,
      });
    }

    // Behavior-specific continuous juice
    if (behavior === 'melt') {
      if (Math.random() < dt * 26) {
        this.drip(x + (Math.random() - 0.5) * 32, surfaceY - 2, color, this.cap(3 + Math.floor(press * 2)));
        this.meltRibbon(x, surfaceY, color);
      }
      if (Math.random() < dt * 12) {
        this.spawn(x + (Math.random() - 0.5) * 22, surfaceY, accent, 'foam', {
          vx: (Math.random() - 0.5) * 18,
          vy: 30 + Math.random() * 45,
          life: 0.55,
          size: 4 + Math.random() * 6,
        });
      }
    } else if (behavior === 'crumble') {
      if (Math.random() < dt * 22) {
        this.sandFall(x + (Math.random() < 0.5 ? -1 : 1) * (18 + Math.random() * 24), surfaceY, color, 10);
      }
    } else if (behavior === 'foamPop') {
      if (Math.random() < dt * 20) {
        this.spawn(x + (Math.random() - 0.5) * 30, surfaceY, '#ffffff', 'bubble', {
          vx: (Math.random() - 0.5) * 14,
          vy: 28 + Math.random() * 50,
          life: 0.65 + Math.random() * 0.45,
          size: 2 + Math.random() * 4.5,
        });
      }
    } else if (behavior === 'squeeze') {
      this.squeezeAcc += dt;
      if (this.squeezeAcc >= 0.2) {
        this.squeezeAcc = 0;
        for (let i = 0; i < this.cap(2); i++) {
          this.spawn(x + (Math.random() - 0.5) * 18, surfaceY, color, 'zest', {
            vx: (Math.random() - 0.5) * 55,
            vy: 20 + Math.random() * 45,
            life: 0.4,
            size: 2 + Math.random() * 2.5,
            spin: (Math.random() - 0.5) * 12,
          });
        }
      }
    } else if (behavior === 'shatter') {
      if (Math.random() < dt * 14) this.crackSpark(x, surfaceY, accent);
    } else if (behavior === 'elastic' && materialId !== 'jelly') {
      if (Math.random() < dt * 9) {
        this.spawn(x + (Math.random() - 0.5) * 26, surfaceY, color, _style, {
          vx: (Math.random() - 0.5) * 24,
          vy: 10 + Math.random() * 26,
          life: 0.4 + Math.random() * 0.3,
          size: 1.5 + Math.random() * 2.5,
        });
      }
    } else if (behavior === 'sticky') {
      if (Math.random() < dt * 14) {
        this.spawn(x + (Math.random() - 0.5) * 20, surfaceY - 1, color, 'foam', {
          vx: (Math.random() - 0.5) * 28,
          vy: 8 + Math.random() * 20,
          life: 0.5 + Math.random() * 0.3,
          size: 2 + Math.random() * 3,
        });
      }
    }

    // Material accents while standing — denser
    const rateBoost = 1 + press * 0.8;
    if (materialId === 'citrus' && Math.random() < dt * 6 * rateBoost) {
      this.spawn(x, surfaceY, color, 'zest', {
        vx: (Math.random() - 0.5) * 45,
        vy: 15 + Math.random() * 35,
        life: 0.4,
        size: 2 + Math.random(),
      });
    } else if (materialId === 'butter' && Math.random() < dt * 5.5 * rateBoost) {
      this.spawn(x + (Math.random() - 0.5) * 28, surfaceY, color, 'crumb', {
        vx: (Math.random() - 0.5) * 20,
        vy: 6 + Math.random() * 18,
        life: 0.35 + Math.random() * 0.3,
        size: 1.5 + Math.random() * 2,
      });
    } else if (materialId === 'honeycomb' && Math.random() < dt * 5.5 * rateBoost) {
      this.drip(x + (Math.random() - 0.5) * 26, surfaceY, color, this.cap(2));
    } else if (materialId === 'whipped' && Math.random() < dt * 7 * rateBoost) {
      this.spawn(x + (Math.random() - 0.5) * 24, surfaceY, '#ffffff', 'foam', {
        vx: (Math.random() - 0.5) * 14,
        vy: 16 + Math.random() * 28,
        life: 0.4,
        size: 1.5 + Math.random() * 2.5,
      });
    } else if (materialId === 'iceSoap' && Math.random() < dt * 5 * rateBoost) {
      this.spawn(x + (Math.random() - 0.5) * 22, surfaceY, accent, 'glitter', {
        vx: (Math.random() - 0.5) * 18,
        vy: 10 + Math.random() * 22,
        life: 0.35 + Math.random() * 0.25,
        size: 1.5 + Math.random() * 2,
      });
    } else if (materialId === 'clearSlime' && Math.random() < dt * 7 * rateBoost) {
      this.spawn(x + (Math.random() - 0.5) * 16, surfaceY, color, 'foam', {
        vx: (Math.random() - 0.5) * 26,
        vy: 6 + Math.random() * 16,
        life: 0.45,
        size: 2 + Math.random() * 2.5,
      });
    } else if (materialId === 'butterSlime' && Math.random() < dt * 5.5 * rateBoost) {
      this.spawn(x + (Math.random() - 0.5) * 22, surfaceY, color, 'crumb', {
        vx: (Math.random() - 0.5) * 18,
        vy: 8 + Math.random() * 16,
        life: 0.4,
        size: 1.5 + Math.random() * 2.2,
      });
    } else if (materialId === 'chocolate' && Math.random() < dt * 4.5 * rateBoost) {
      this.drip(x + (Math.random() - 0.5) * 20, surfaceY, color, 1);
    } else if (materialId === 'kinetic' && Math.random() < dt * 6 * rateBoost) {
      this.sandFall(x + (Math.random() - 0.5) * 28, surfaceY, color, 8);
    } else if (materialId === 'sponge' && Math.random() < dt * 4.5 * rateBoost) {
      this.spawn(x + (Math.random() - 0.5) * 22, surfaceY, color, 'foam', {
        vx: (Math.random() - 0.5) * 16,
        vy: 8 + Math.random() * 18,
        life: 0.35,
        size: 1.5 + Math.random() * 2,
      });
    } else if (materialId === 'soapBubble' && Math.random() < dt * 6 * rateBoost) {
      this.spawn(x + (Math.random() - 0.5) * 18, surfaceY, accent, 'bubble', {
        vx: (Math.random() - 0.5) * 12,
        vy: 22 + Math.random() * 40,
        life: 0.6,
        size: 2 + Math.random() * 3,
      });
    } else if (materialId === 'bathFoam' && Math.random() < dt * 6 * rateBoost) {
      this.spawn(x + (Math.random() - 0.5) * 24, surfaceY, '#ffffff', 'foam', {
        vx: (Math.random() - 0.5) * 14,
        vy: 16 + Math.random() * 28,
        life: 0.45,
        size: 2 + Math.random() * 3,
      });
    } else if (materialId === 'keyboard' && Math.random() < dt * 3.5 * rateBoost) {
      this.spawn(x + (Math.random() - 0.5) * 30, surfaceY, color, 'crumb', {
        vx: (Math.random() - 0.5) * 20,
        vy: 6 + Math.random() * 14,
        life: 0.3,
        size: 1.5 + Math.random(),
      });
    } else if (materialId === 'bubbleWrap' && Math.random() < dt * 5 * rateBoost) {
      this.spawn(x + (Math.random() - 0.5) * 22, surfaceY, accent, 'bubble', {
        vx: (Math.random() - 0.5) * 16,
        vy: 14 + Math.random() * 26,
        life: 0.4,
        size: 2 + Math.random() * 2,
      });
    }
  }

  /** Soft idle aura from platforms near the camera / player */
  emitPlatformIdle(
    dt: number,
    x: number,
    surfaceY: number,
    color: string,
    style: ParticleStyle,
    materialId: MaterialId,
  ): void {
    if (!this.allowContinuous) return;
    if (materialId === 'jelly' || materialId === 'marshmallow' || isSoapBarMaterial(materialId)) return;
    const rates: Partial<Record<MaterialId, number>> = {
      jelly: 2.8,
      butter: 1.8,
      mochi: 2.2,
      marshmallow: 2.4,
      chocolate: 1.6,
      sponge: 2.0,
      citrus: 2.4,
      honeycomb: 2.6,
      glycerin: 2.0,
      whipped: 2.5,
      soapBubble: 3.0,
      bathFoam: 2.6,
      lavenderSoap: 2.2,
      creamSoap: 2.0,
      keyboard: 1.4,
      bubbleWrap: 2.4,
      kinetic: 2.2,
      iceSoap: 2.8,
      clearSlime: 2.4,
      butterSlime: 1.8,
    };
    const rate = rates[materialId] ?? 1.5;
    if (Math.random() > dt * rate * this.densityScale) return;

    const kind: ParticleStyle =
      style === 'drip'
        ? 'drip'
        : style === 'glitter'
          ? 'glitter'
          : style === 'zest'
            ? 'zest'
            : style === 'sand'
              ? 'sand'
              : style === 'bubble'
                ? 'bubble'
                : style === 'foamBurst'
                  ? 'foam'
                  : 'foam';

    this.spawn(x + (Math.random() - 0.5) * 36, surfaceY + (Math.random() - 0.3) * 8, color, kind, {
      vx: (Math.random() - 0.5) * 14 + this.windX * 0.3,
      vy: kind === 'drip' ? -12 - Math.random() * 20 : 8 + Math.random() * 22,
      life: 0.45 + Math.random() * 0.4,
      size: 1.5 + Math.random() * 2.2,
    });
  }

  emitAirTrail(dt: number, x: number, y: number, color: string): void {
    if (!this.allowContinuous) return;
    this.airTrailAcc += dt * 7 * this.densityScale;
    while (this.airTrailAcc >= 1) {
      this.airTrailAcc -= 1;
      this.spawn(x + (Math.random() - 0.5) * 8, y - 4, color, 'pressAura', {
        vx: (Math.random() - 0.5) * 20,
        vy: -10 - Math.random() * 20,
        life: 0.25 + Math.random() * 0.2,
        size: 1.5 + Math.random() * 1.5,
      });
    }
  }

  meltRibbon(x: number, y: number, color: string): void {
    for (let i = 0; i < this.cap(3); i++) {
      this.spawn(x + (Math.random() - 0.5) * 18, y, color, 'meltRibbon', {
        vx: (Math.random() - 0.5) * 20,
        vy: -25 - Math.random() * 50,
        life: 0.55 + Math.random() * 0.4,
        size: 3 + Math.random() * 4,
        spin: (Math.random() - 0.5) * 3,
      });
    }
  }

  /** Manteiga — mancha espalhando lateralmente ao pisar */
  butterSpread(x: number, y: number, color: string, impact: number, width: number): void {
    const n = this.cap(16 + Math.floor(impact * 14));
    for (let i = 0; i < n; i++) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const speed = 32 + Math.random() * (42 + impact * 38);
      this.spawn(x + (Math.random() - 0.5) * 10, y + Math.random() * 3, color, 'butterSpread', {
        vx: side * speed,
        vy: -6 + Math.random() * 14,
        life: 0.32 + Math.random() * 0.38,
        size: 2.5 + Math.random() * 3.5,
      });
    }
    for (let i = 0; i < Math.floor(n * 0.45); i++) {
      const side = i % 2 === 0 ? -1 : 1;
      this.spawn(x, y + 1, color, 'butterSpread', {
        vx: side * (48 + Math.random() * 36),
        vy: 4 + Math.random() * 10,
        life: 0.4 + Math.random() * 0.3,
        size: 3 + Math.random() * 4,
      });
    }
    for (let i = 0; i < this.cap(4 + Math.floor(impact * 3)); i++) {
      this.spawn(x + (Math.random() - 0.5) * width * 0.35, y, color, 'crumb', {
        vx: (Math.random() - 0.5) * 24,
        vy: 10 + Math.random() * 22,
        life: 0.35 + Math.random() * 0.25,
        size: 1.5 + Math.random() * 2,
      });
    }
    this.rings.push({
      x,
      y,
      life: 0.32 + impact * 0.12,
      maxLife: 0.32 + impact * 0.12,
      color,
      kind: 'dust',
    });
  }

  crackSpark(x: number, y: number, color: string): void {
    for (let i = 0; i < this.cap(5); i++) {
      const a = Math.random() * Math.PI * 2;
      this.spawn(x + (Math.random() - 0.5) * 20, y, color, 'crackSpark', {
        vx: Math.cos(a) * (40 + Math.random() * 60),
        vy: Math.sin(a) * (30 + Math.random() * 50),
        life: 0.18 + Math.random() * 0.2,
        size: 1.5 + Math.random() * 2,
      });
    }
  }

  shatterFollowThrough(x: number, y: number, color: string, accent: string): void {
    this.crackSpark(x, y, accent);
    this.burst(x, y, '#ffffff', this.cap(16), 'glitter', false, accent);
    const w = this.allocWave();
    if (w) {
      w.active = true;
      w.t = 0.08;
      w.x = x;
      w.y = y;
      w.color = color;
      w.tint = accent;
      w.style = 'glitter';
      w.count = this.cap(14);
      w.mode = 'glitter';
    }
    const w2 = this.allocWave();
    if (w2) {
      w2.active = true;
      w2.t = 0.35;
      w2.x = x;
      w2.y = y;
      w2.color = accent;
      w2.tint = accent;
      w2.style = 'glitter';
      w2.count = this.cap(10);
      w2.mode = 'residual';
    }
  }

  meltFinish(x: number, y: number, color: string): void {
    this.drip(x, y, color, this.cap(14));
    for (let i = 0; i < this.cap(8); i++) this.meltRibbon(x + (Math.random() - 0.5) * 24, y, color);
  }

  foamPopStorm(x: number, y: number, color: string): void {
    this.foamBurst(x, y, color);
    for (let i = 0; i < this.cap(18); i++) {
      this.spawn(x + (Math.random() - 0.5) * 40, y, '#ffffff', 'bubble', {
        vx: (Math.random() - 0.5) * 50,
        vy: 40 + Math.random() * 90,
        life: 0.7 + Math.random() * 0.5,
        size: 2 + Math.random() * 5,
      });
    }
    for (let i = 0; i < this.cap(12); i++) {
      this.spawn(x + (Math.random() - 0.5) * 36, y, color, 'foam', {
        vx: (Math.random() - 0.5) * 40,
        vy: 20 + Math.random() * 50,
        life: 0.5 + Math.random() * 0.4,
        size: 3 + Math.random() * 4,
      });
    }
  }

  floaterOrbit(x: number, y: number, color: string): void {
    for (let i = 0; i < this.cap(4); i++) {
      const a = (i / 4) * Math.PI * 2;
      this.spawn(x + Math.cos(a) * 12, y + Math.sin(a) * 8, color, 'glitter', {
        vx: Math.cos(a + 1.2) * 35,
        vy: Math.sin(a + 1.2) * 25 + 20,
        life: 0.55,
        size: 2,
      });
    }
  }

  exhale(x: number, y: number, color: string): void {
    for (let i = 0; i < this.cap(14); i++) {
      this.spawn(x + (Math.random() - 0.5) * 40, y, color, 'foam', {
        vx: (Math.random() - 0.5) * 30,
        vy: 40 + Math.random() * 60,
        life: 0.6 + Math.random() * 0.5,
        size: 2 + Math.random() * 3,
      });
    }
  }

  inhale(x: number, y: number, color: string): void {
    for (let i = 0; i < this.cap(10); i++) {
      this.spawn(x + (Math.random() - 0.5) * 16, y + (Math.random() - 0.5) * 16, color, 'glitter', {
        vx: (Math.random() - 0.5) * 40,
        vy: 20 + Math.random() * 50,
        life: 0.4 + Math.random() * 0.3,
        size: 2 + Math.random() * 2,
      });
    }
  }

  drip(x: number, y: number, color: string, count = 2): void {
    for (let i = 0; i < this.cap(count); i++) {
      this.spawn(x + (Math.random() - 0.5) * 24, y - 2, color, 'drip', {
        vx: (Math.random() - 0.5) * 12,
        vy: -20 - Math.random() * 40,
        life: 0.5 + Math.random() * 0.4,
        size: 2.5 + Math.random() * 2.5,
      });
    }
  }

  /** Gotas melecosas de gelatina caindo ao pisar */
  jellySlimeDrops(x: number, y: number, color: string, platformW: number, impact = 1): void {
    const spread = Math.max(28, platformW * 0.9);
    const count = this.cap(10 + Math.floor(impact * 10));
    for (let i = 0; i < count; i++) {
      const t = count > 1 ? i / (count - 1) - 0.5 : 0;
      this.spawn(x + t * spread + (Math.random() - 0.5) * 14, y + 2, color, 'drip', {
        vx: (Math.random() - 0.5) * 22 + t * 8,
        vy: -45 - Math.random() * 75 * impact,
        life: 0.7 + Math.random() * 0.75,
        size: 3.5 + Math.random() * 5,
      });
    }
    for (let i = 0; i < this.cap(5); i++) {
      const side = i % 2 === 0 ? -1 : 1;
      this.spawn(x + side * spread * 0.42 + (Math.random() - 0.5) * 10, y, color, 'drip', {
        vx: side * (10 + Math.random() * 20),
        vy: -35 - Math.random() * 55,
        life: 0.85 + Math.random() * 0.55,
        size: 4 + Math.random() * 3.5,
      });
    }
  }

  /** Esguicho forte de água ao espremer esponja — cai para baixo */
  waterSquirt(x: number, y: number, platformW: number, impact = 1): void {
    const spread = Math.max(40, platformW * 1.05);
    const water = '#72C4F0';
    const waterDeep = '#4898D8';
    const mist = '#B8E4FC';
    const imp = 0.85 + Math.min(1.4, impact) * 0.55;

    const streamCount = this.cap(28 + Math.floor(imp * 16));
    for (let i = 0; i < streamCount; i++) {
      const t = (Math.random() - 0.5) * spread;
      this.spawn(x + t, y + Math.random() * 8, i % 3 === 0 ? waterDeep : water, 'drip', {
        vx: (Math.random() - 0.5) * 55,
        vy: 90 + Math.random() * 140 * imp,
        life: 0.65 + Math.random() * 0.55,
        size: 3.5 + Math.random() * 4,
      });
    }

    const jetCount = this.cap(14 + Math.floor(imp * 10));
    for (let i = 0; i < jetCount; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      this.spawn(x + side * spread * (0.18 + Math.random() * 0.28), y + 2, mist, 'juice', {
        vx: side * (25 + Math.random() * 55),
        vy: 70 + Math.random() * 110 * imp,
        life: 0.55 + Math.random() * 0.45,
        size: 3 + Math.random() * 3.5,
      });
    }

    for (let i = 0; i < this.cap(12); i++) {
      const t = (Math.random() - 0.5) * spread * 0.7;
      this.spawn(x + t, y + 4, water, 'drip', {
        vx: t * 0.35,
        vy: 120 + Math.random() * 160 * imp,
        life: 0.75 + Math.random() * 0.55,
        size: 4 + Math.random() * 3.5,
      });
    }

    for (let i = 0; i < this.cap(8); i++) {
      this.spawn(x + (Math.random() - 0.5) * spread * 0.5, y + 6, waterDeep, 'drip', {
        vx: (Math.random() - 0.5) * 30,
        vy: 150 + Math.random() * 120,
        life: 0.85 + Math.random() * 0.45,
        size: 3 + Math.random() * 2.5,
      });
    }
  }

  sandFall(x: number, y: number, color: string, w: number): void {
    for (let i = 0; i < this.cap(6); i++) {
      this.spawn(x + (Math.random() - 0.5) * w, y, color, 'sandFall', {
        vx: (Math.random() - 0.5) * 20,
        vy: -15 - Math.random() * 35,
        life: 0.4 + Math.random() * 0.35,
        size: 1.5,
      });
    }
  }

  foamBurst(x: number, y: number, color: string): void {
    this.burst(x, y, color, 18, 'foamBurst', false);
    this.burst(x, y, '#ffffff', 10, 'bubble', false);
  }

  /** Sabonete — espuma + bolhas ao pisar */
  soapStepFoam(x: number, y: number, color: string, impact: number, width: number): void {
    const spread = width * 0.48;
    const foamN = this.cap(16 + Math.floor(impact * 14));
    const bubbleN = this.cap(18 + Math.floor(impact * 16));

    for (let i = 0; i < foamN; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.85;
      const speed = 22 + Math.random() * (38 + impact * 40);
      this.spawn(x + (Math.random() - 0.5) * spread, y + Math.random() * 3, '#ffffff', 'foam', {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + 18,
        life: 0.5 + Math.random() * 0.45,
        size: 3 + Math.random() * 4,
      });
    }
    for (let i = 0; i < Math.floor(foamN * 0.45); i++) {
      this.spawn(x + (Math.random() - 0.5) * spread * 0.85, y, color, 'foam', {
        vx: (Math.random() - 0.5) * 42,
        vy: 14 + Math.random() * 36,
        life: 0.45 + Math.random() * 0.35,
        size: 2.5 + Math.random() * 3,
      });
    }
    for (let i = 0; i < bubbleN; i++) {
      this.spawn(x + (Math.random() - 0.5) * spread, y + Math.random() * 2, color, 'bubble', {
        vx: (Math.random() - 0.5) * 36,
        vy: 28 + Math.random() * 72,
        life: 0.65 + Math.random() * 0.55,
        size: 2.5 + Math.random() * 4.5,
      });
    }
    for (let i = 0; i < Math.floor(bubbleN * 0.55); i++) {
      this.spawn(x + (Math.random() - 0.5) * spread * 0.9, y, '#ffffff', 'bubble', {
        vx: (Math.random() - 0.5) * 28,
        vy: 32 + Math.random() * 65,
        life: 0.7 + Math.random() * 0.5,
        size: 2 + Math.random() * 3.5,
      });
    }
    this.rings.push({
      x,
      y,
      life: 0.35 + impact * 0.12,
      maxLife: 0.35 + impact * 0.12,
      color: '#ffffff',
      kind: 'dust',
    });
  }

  /** Sabonete / espuma — bolhas sobem ao pisar */
  risingBubbles(x: number, y: number, color: string, count = 14): void {
    const n = this.cap(count);
    for (let i = 0; i < n; i++) {
      this.spawn(x + (Math.random() - 0.5) * 28, y + Math.random() * 4, color, 'bubble', {
        vx: (Math.random() - 0.5) * 18,
        vy: 35 + Math.random() * 70,
        life: 0.7 + Math.random() * 0.55,
        size: 2 + Math.random() * 3.5,
      });
    }
    // Foam flecks
    for (let i = 0; i < this.cap(Math.floor(n * 0.5)); i++) {
      this.spawn(x + (Math.random() - 0.5) * 22, y, '#ffffff', 'foam', {
        vx: (Math.random() - 0.5) * 30,
        vy: 20 + Math.random() * 40,
        life: 0.45 + Math.random() * 0.35,
        size: 2 + Math.random() * 2,
      });
    }
  }

  /** Chiclete — fiapos/pedaços grudentos */
  gumStretch(x: number, y: number, color: string): void {
    for (let i = 0; i < this.cap(8); i++) {
      this.spawn(x + (Math.random() - 0.5) * 16, y, color, 'foam', {
        vx: (Math.random() - 0.5) * 40,
        vy: 15 + Math.random() * 35,
        life: 0.5 + Math.random() * 0.35,
        size: 2 + Math.random() * 2,
      });
    }
  }

  juiceArc(x: number, y: number, color: string): void {
    for (let i = 0; i < this.cap(10); i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
      const sp = 50 + Math.random() * 70;
      this.spawn(x, y, color, 'juice', {
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp + 20,
        life: 0.45 + Math.random() * 0.3,
        size: 2 + Math.random() * 2,
      });
    }
  }

  confetti(x: number, y: number): void {
    const colors = [PASTEL.coral, PASTEL.butter, PASTEL.seafoam, PASTEL.blush, PASTEL.sky];
    for (let i = 0; i < this.cap(28); i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 90;
      this.spawn(x, y, colors[i % colors.length], 'glitter', {
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp + 40,
        life: 0.9 + Math.random() * 0.6,
        size: 3 + Math.random() * 3,
      });
    }
  }

  update(dt: number): void {
    for (const w of this.waves) {
      if (!w.active) continue;
      w.t -= dt;
      if (w.t > 0) continue;
      w.active = false;
      this.fireWave(w);
    }

    this.activeCount = 0;
    for (const p of this.items) {
      if (!p.active) continue;
      this.activeCount++;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        this.activeCount--;
        continue;
      }

      const windMul =
        p.type === 'drip' ||
        p.type === 'foam' ||
        p.type === 'bubble' ||
        p.type === 'foamBurst' ||
        p.type === 'pressAura' ||
        p.type === 'footSpeck' ||
        p.type === 'releasePuff'
          ? 0.4
          : 0.12;
      p.x += (p.vx + this.windX * windMul) * dt;
      p.y += (p.vy + this.windY * windMul * 0.2) * dt;

      let g = 180;
      if (
        p.type === 'foam' ||
        p.type === 'bubble' ||
        p.type === 'foamBurst' ||
        p.type === 'pressAura' ||
        p.type === 'releasePuff'
      ) {
        g = 35;
      } else if (p.type === 'drip' || p.type === 'sandFall' || p.type === 'juice' || p.type === 'meltRibbon') {
        g = 520;
      } else if (p.type === 'butterSpread') {
        g = 140;
      } else if (p.type === 'shockSoft' || p.type === 'crackSpark') {
        g = 60;
      } else if (p.type === 'footSpeck') {
        g = 220;
      }
      p.vy -= g * dt;
      p.vx *= 1 - (p.type === 'butterSpread' ? 2.8 : 1.2) * dt;
      if (p.type === 'sand' || p.type === 'sandFall') p.vx *= 1 - 0.6 * dt;
      p.rot += p.spin * dt;
    }

    for (let i = this.rings.length - 1; i >= 0; i--) {
      this.rings[i].life -= dt;
      if (this.rings[i].life <= 0) this.rings.splice(i, 1);
    }
  }

  private fireWave(w: DelayedWave): void {
    const n = w.count;
    for (let i = 0; i < n; i++) {
      if (w.mode === 'mist') {
        this.spawn(w.x + (Math.random() - 0.5) * 28, w.y, Math.random() > 0.5 ? w.tint : w.color, w.style, {
          vx: (Math.random() - 0.5) * 40,
          vy: 15 + Math.random() * 45,
          life: 0.6 + Math.random() * 0.5,
          size: 2 + Math.random() * 3,
        });
      } else if (w.mode === 'residual') {
        this.spawn(w.x + (Math.random() - 0.5) * 36, w.y + Math.random() * 8, w.tint, 'foam', {
          vx: (Math.random() - 0.5) * 18,
          vy: 8 + Math.random() * 22,
          life: 0.9 + Math.random() * 0.5,
          size: 2 + Math.random() * 2.5,
        });
      } else if (w.mode === 'glitter') {
        this.spawn(w.x + (Math.random() - 0.5) * 40, w.y, w.tint, 'glitter', {
          vx: (Math.random() - 0.5) * 50,
          vy: 20 + Math.random() * 55,
          life: 0.7 + Math.random() * 0.4,
          size: 1.5 + Math.random() * 2,
        });
      } else {
        const colors = [w.tint, w.color, '#fff5e0', '#ffd0e0'];
        this.spawn(w.x, w.y, colors[i % colors.length], 'glitter', {
          vx: (Math.random() - 0.5) * 80,
          vy: 30 + Math.random() * 70,
          life: 0.8 + Math.random() * 0.5,
          size: 2.5 + Math.random() * 2.5,
        });
      }
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    toScreen: (x: number, y: number) => { x: number; y: number },
  ): void {
    ctx.imageSmoothingEnabled = false;
    for (const ring of this.rings) {
      const s = toScreen(ring.x, ring.y);
      const t = 1 - ring.life / ring.maxLife;
      ctx.globalAlpha = (1 - t) * (ring.kind === 'land' ? 0.75 : 0.4);
      ctx.fillStyle = ring.color;
      const r = Math.round(8 + t * (ring.kind === 'shock' ? 40 : 32));
      // Pixel ring as 8 points on octagon
      const pts = 8;
      for (let i = 0; i < pts; i++) {
        const a = (i / pts) * Math.PI * 2;
        const x = Math.round(s.x + Math.cos(a) * r);
        const y = Math.round(s.y + Math.sin(a) * r * (ring.kind === 'dust' ? 0.45 : 1));
        ctx.fillRect(x, y, 2, 2);
      }
    }

    for (const p of this.items) {
      if (!p.active) continue;
      const s = toScreen(p.x, p.y);
      const a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a * (p.type === 'pressAura' || p.type === 'footSpeck' ? 0.55 : 0.92);
      ctx.fillStyle = p.color;
      const sz = Math.max(2, Math.round(p.size));

      if (p.type === 'bubble' || p.type === 'foamBurst') {
        ctx.fillRect(Math.round(s.x) - sz, Math.round(s.y) - 1, sz * 2, 2);
        ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y) - sz, 2, sz * 2);
      } else if (
        p.type === 'glitter' ||
        p.type === 'spark' ||
        p.type === 'crackSpark' ||
        p.type === 'shockSoft'
      ) {
        ctx.fillRect(Math.round(s.x), Math.round(s.y), Math.max(2, sz), Math.max(2, sz));
      } else if (p.type === 'zest' || p.type === 'juice' || p.type === 'meltRibbon' || p.type === 'butterSpread') {
        ctx.fillRect(Math.round(s.x) - sz, Math.round(s.y), sz * 2, 2);
        if (p.type === 'meltRibbon') {
          ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y) - sz, 2, sz * 2);
        }
        if (p.type === 'butterSpread') {
          ctx.fillRect(Math.round(s.x) - sz * 1.4, Math.round(s.y) + 1, Math.round(sz * 2.8), 2);
        }
      } else if (p.type === 'sand' || p.type === 'sandFall' || p.type === 'footSpeck') {
        ctx.fillRect(Math.round(s.x), Math.round(s.y), 2, 2);
      } else if (p.type === 'drip') {
        const blobW = Math.max(2, Math.round(sz * 0.9));
        ctx.fillRect(Math.round(s.x), Math.round(s.y), blobW, sz + 2);
        if (sz >= 4) {
          ctx.fillRect(Math.round(s.x) - 1, Math.round(s.y) + sz + 1, blobW + 2, 2);
        }
      } else {
        ctx.fillRect(Math.round(s.x - sz * 0.5), Math.round(s.y - sz * 0.5), sz, sz);
      }
    }
    ctx.globalAlpha = 1;
  }

  clear(): void {
    for (const p of this.items) p.active = false;
    for (const w of this.waves) w.active = false;
    this.rings.length = 0;
    this.activeCount = 0;
    this.footAcc = 0;
    this.pressAcc = 0;
    this.airTrailAcc = 0;
    this.squeezeAcc = 0;
  }
}
