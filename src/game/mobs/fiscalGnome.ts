import { enablePixelMode } from '../../theme/pixel';
import type { Player } from '../Player';
import { drawFiscalGnome } from './fiscalGnomeVisual';

export const GNOME = {
  dwellS: 5,
  debugDwellS: 3,
  approachS: 1.22,
  fleeS: 0.82,
  strikeRadius: 38,
  pushSpeed: 390,
  pushLift: 228,
  spawnMargin: 72,
} as const;

export type GnomeEvent = 'none' | 'approach' | 'strike';

type GnomePhase = 'idle' | 'approach' | 'flee';

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Um único gnomo fiscal reutilizado. Sem array, sem spawn extra:
 * o timer só corre no chão, na mesma `platform.seed`.
 */
export class FiscalGnome {
  private phase: GnomePhase = 'idle';
  private dwellT = 0;
  private trackedSeed = -1;
  private x = 0;
  private y = 0;
  private vx = 0;
  private vy = 0;
  private facing = 1;
  private pushDir = 1;
  private approachT = 0;
  private fleeT = 0;
  private spawnX = 0;
  private spawnY = 0;
  private arcX = 0;
  private arcY = 0;
  private tilt = 0;
  private flap = 0;
  private squash = 1;
  private stretch = 1;
  private alpha = 1;

  reset(): void {
    this.phase = 'idle';
    this.dwellT = 0;
    this.trackedSeed = -1;
    this.approachT = 0;
    this.fleeT = 0;
    this.vx = 0;
    this.vy = 0;
    this.tilt = 0;
    this.flap = 0;
    this.squash = 1;
    this.stretch = 1;
    this.alpha = 1;
  }

  debugLine(): string {
    if (this.phase === 'approach') return 'gnome=approach';
    if (this.phase === 'flee') return 'gnome=flee';
    return `gnome=${this.dwellT.toFixed(1)}s`;
  }

  update(
    dt: number,
    player: Player,
    playing: boolean,
    viewHalfW: number,
    debug: boolean,
    reduceMotion: boolean,
  ): GnomeEvent {
    if (!playing) {
      this.reset();
      return 'none';
    }

    if (this.phase === 'approach') return this.tickApproach(dt, player, reduceMotion);
    if (this.phase === 'flee') {
      this.tickFlee(dt, viewHalfW, reduceMotion);
      return 'none';
    }
    return this.tickIdle(dt, player, viewHalfW, debug);
  }

  draw(
    ctx: CanvasRenderingContext2D,
    toScreen: (x: number, y: number) => { x: number; y: number },
  ): void {
    if (this.phase === 'idle') return;
    enablePixelMode(ctx);
    const s = toScreen(this.x, this.y);
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(s.x, s.y);
    ctx.scale(this.facing, 1);
    ctx.rotate(this.tilt);
    drawFiscalGnome(ctx, {
      flap: this.flap,
      squash: this.squash,
      stretch: this.stretch,
      smirk: this.phase === 'flee',
    });
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  private tickIdle(
    dt: number,
    player: Player,
    viewHalfW: number,
    debug: boolean,
  ): GnomeEvent {
    const plat = player.groundedPlatform;
    const camping =
      player.onGround &&
      plat != null &&
      plat.alive &&
      plat.solid &&
      !player.trampolineWindup &&
      Math.abs(player.vx) < 28;

    if (!plat || !camping) {
      this.dwellT = 0;
      this.trackedSeed = -1;
      return 'none';
    }

    if (plat.seed !== this.trackedSeed) {
      this.trackedSeed = plat.seed;
      this.dwellT = 0;
    }

    this.dwellT += dt;
    const need = debug ? GNOME.debugDwellS : GNOME.dwellS;
    if (this.dwellT < need) return 'none';

    this.beginApproach(player, plat.left, plat.right, viewHalfW);
    return 'approach';
  }

  private beginApproach(
    player: Player,
    platLeft: number,
    platRight: number,
    viewHalfW: number,
  ): void {
    const distL = player.x - platLeft;
    const distR = platRight - player.x;
    this.pushDir = distL <= distR ? -1 : 1;
    const comeFrom = -this.pushDir;
    this.spawnX = player.x + comeFrom * (viewHalfW + GNOME.spawnMargin);
    this.spawnY = player.y + 36;
    this.arcX = (this.spawnX + player.x) * 0.5 + comeFrom * 18;
    this.arcY = Math.max(this.spawnY, player.y) + 62;
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.vx = 0;
    this.vy = 0;
    this.facing = this.pushDir;
    this.tilt = comeFrom * 0.2;
    this.approachT = 0;
    this.flap = 0;
    this.squash = 1;
    this.stretch = 1;
    this.alpha = 1;
    this.phase = 'approach';
  }

  private tickApproach(dt: number, player: Player, reduceMotion: boolean): GnomeEvent {
    this.approachT += dt;
    const dur = reduceMotion ? GNOME.approachS * 0.55 : GNOME.approachS;
    const t = Math.min(1, this.approachT / dur);
    const e = easeInOutCubic(t);

    const tx = player.x;
    const ty = player.y + 8;
    const omt = 1 - e;
    const nx = omt * omt * this.spawnX + 2 * omt * e * this.arcX + e * e * tx;
    const ny =
      omt * omt * this.spawnY +
      2 * omt * e * this.arcY +
      e * e * ty +
      (reduceMotion ? 0 : Math.sin(this.approachT * 9.5) * (5.5 * (1 - e * 0.35)));

    this.vx = (nx - this.x) / Math.max(dt, 0.001);
    this.vy = (ny - this.y) / Math.max(dt, 0.001);
    this.x = nx;
    this.y = ny;
    this.facing = this.pushDir;
    this.flap += dt * (18 + e * 10);
    this.bankTowardVelocity(dt);
    this.squash = lerp(this.squash, 1.02, Math.min(1, 8 * dt));
    this.stretch = lerp(this.stretch, 0.98, Math.min(1, 8 * dt));
    this.alpha = Math.min(1, t * 4);

    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const close = dx * dx + dy * dy <= GNOME.strikeRadius * GNOME.strikeRadius;
    if (!close && t < 1) return 'none';

    player.shove(this.pushDir, GNOME.pushSpeed, GNOME.pushLift);
    this.x = player.x - this.pushDir * 12;
    this.y = player.y + 6;
    this.vx = this.pushDir * 260;
    this.vy = 70;
    this.squash = 1.08;
    this.stretch = 0.94;
    this.fleeT = 0;
    this.phase = 'flee';
    this.dwellT = 0;
    this.trackedSeed = -1;
    return 'strike';
  }

  private tickFlee(dt: number, viewHalfW: number, reduceMotion: boolean): void {
    this.fleeT += dt;
    this.vx += this.pushDir * 90 * dt;
    this.vy += 55 * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt + (reduceMotion ? 0 : Math.sin(this.fleeT * 11) * 22 * dt);
    this.flap += dt * 22;
    this.bankTowardVelocity(dt);
    this.squash = lerp(this.squash, 0.96, Math.min(1, 6 * dt));
    this.stretch = lerp(this.stretch, 1.04, Math.min(1, 6 * dt));
    const fade = Math.min(1, this.fleeT / GNOME.fleeS);
    this.alpha = 1 - fade * fade;
    const gone = this.fleeT >= GNOME.fleeS || Math.abs(this.x) > viewHalfW + 90;
    if (gone) this.reset();
  }

  private bankTowardVelocity(dt: number): void {
    const target = -Math.atan2(this.vy, Math.abs(this.vx) + 12) * 0.42;
    this.tilt += (target - this.tilt) * Math.min(1, 9 * dt);
  }
}
