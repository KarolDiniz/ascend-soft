import { PIXEL, enablePixelMode, snapPt } from '../../theme/pixel';
import type { Player } from '../Player';
import { drawFiscalGnome } from './fiscalGnomeVisual';

export const GNOME = {
  /** Tempo parado na mesma plataforma até o gnomo aparecer. */
  dwellS: 10,
  /** Com `?debug` na URL, para poder testar sem esperar. */
  debugDwellS: 3,
  approachS: 0.78,
  fleeS: 0.58,
  strikeRadius: 34,
  pushSpeed: 390,
  pushLift: 228,
  spawnMargin: 52,
} as const;

export type GnomeEvent = 'none' | 'approach' | 'strike';

type GnomePhase = 'idle' | 'approach' | 'flee';

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
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
  private facing = 1;
  private pushDir = 1;
  private approachT = 0;
  private fleeT = 0;
  private spawnX = 0;
  private spawnY = 0;
  private squash = 1;
  private stretch = 1;

  reset(): void {
    this.phase = 'idle';
    this.dwellT = 0;
    this.trackedSeed = -1;
    this.approachT = 0;
    this.fleeT = 0;
    this.squash = 1;
    this.stretch = 1;
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
      this.tickFlee(dt, viewHalfW);
      return 'none';
    }
    return this.tickIdle(dt, player, viewHalfW, debug);
  }

  draw(
    ctx: CanvasRenderingContext2D,
    toScreen: (x: number, y: number) => { x: number; y: number },
    time: number,
  ): void {
    if (this.phase === 'idle') return;
    enablePixelMode(ctx);
    const raw = toScreen(this.x, this.y);
    const s = snapPt(raw.x, raw.y);
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.scale(this.facing, 1);
    drawFiscalGnome(ctx, PIXEL.unit, time, this.squash, this.stretch);
    ctx.restore();
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
      !player.trampolineWindup;

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
    this.spawnY = player.y + 28;
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.facing = this.pushDir;
    this.approachT = 0;
    this.squash = 1;
    this.stretch = 1;
    this.phase = 'approach';
  }

  private tickApproach(dt: number, player: Player, reduceMotion: boolean): GnomeEvent {
    this.approachT += dt;
    const dur = reduceMotion ? GNOME.approachS * 0.42 : GNOME.approachS;
    const t = Math.min(1, this.approachT / dur);
    const e = easeOutCubic(t);
    const bob = reduceMotion ? 0 : Math.sin(this.approachT * 14) * 5;
    this.x = this.spawnX + (player.x - this.spawnX) * e;
    this.y = this.spawnY + (player.y + 10 - this.spawnY) * e + bob;
    this.facing = this.pushDir;
    this.squash = 1.04;
    this.stretch = 0.96;

    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const close = dx * dx + dy * dy <= GNOME.strikeRadius * GNOME.strikeRadius;
    if (!close && t < 1) return 'none';

    player.shove(this.pushDir, GNOME.pushSpeed, GNOME.pushLift);
    this.x = player.x - this.pushDir * 10;
    this.y = player.y + 8;
    this.squash = 1.28;
    this.stretch = 0.78;
    this.fleeT = 0;
    this.phase = 'flee';
    this.dwellT = 0;
    this.trackedSeed = -1;
    return 'strike';
  }

  private tickFlee(dt: number, viewHalfW: number): void {
    this.fleeT += dt;
    this.x += this.pushDir * 420 * dt;
    this.y += 48 * dt + Math.sin(this.fleeT * 18) * 10 * dt;
    this.squash = 0.9;
    this.stretch = 1.12;
    const gone = this.fleeT >= GNOME.fleeS || Math.abs(this.x) > viewHalfW + 80;
    if (gone) this.reset();
  }
}
