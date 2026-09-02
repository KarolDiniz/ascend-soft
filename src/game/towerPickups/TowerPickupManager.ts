import { PASTEL, rgba } from '../../theme/pastelPalette';
import { PIXEL, fillPx, px, snapPt } from '../../theme/pixel';
import type { Platform } from '../Platform';
import { drawTowerPickupIcon } from '../shop/runGearVisual';
import {
  rollTowerPickup,
  TOWER_PICKUP_GAP_SLACK,
  TOWER_PICKUP_GAP_Y,
  TOWER_PICKUP_MIN_HEIGHT,
  type TowerPickupKind,
} from './definitions';

const FLOAT_ABOVE = 24;
const COLLECT_R2 = 38 * 38;
const MAGNET_R = 96;
const ICON_BOX = 46;

interface Pickup {
  platform: Platform;
  kind: TowerPickupKind;
  collected: boolean;
  phase: number;
  offsetX: number;
}

function mixSeed(seed: number, salt: number): number {
  return ((seed * 1103515245 + salt * 12345) >>> 0) / 0xffffffff;
}

export class TowerPickupManager {
  private pickups: Pickup[] = [];
  private seededPlatforms = new Set<number>();
  /** Altura (y) do último pickup spawnado; -1 = nenhum ainda. */
  private lastSpawnY = -1;

  reset(): void {
    this.pickups.length = 0;
    this.seededPlatforms.clear();
    this.lastSpawnY = -1;
  }

  syncPlatforms(platforms: readonly Platform[]): void {
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i]!;
      if (this.seededPlatforms.has(p.seed)) continue;
      this.seededPlatforms.add(p.seed);

      if (p.y < TOWER_PICKUP_MIN_HEIGHT || !p.alive || p.fading) continue;

      const sinceLast =
        this.lastSpawnY < 0 ? p.y - TOWER_PICKUP_MIN_HEIGHT : p.y - this.lastSpawnY;
      if (this.lastSpawnY >= 0 && sinceLast < TOWER_PICKUP_GAP_Y) continue;

      const isFirst = this.lastSpawnY < 0;
      const force = isFirst || sinceLast >= TOWER_PICKUP_GAP_Y + TOWER_PICKUP_GAP_SLACK;
      const kind = rollTowerPickup(p.seed, force);
      if (!kind) continue;

      this.lastSpawnY = p.y;
      const spread = (p.w * 0.5 - 12) * (mixSeed(p.seed, 44) * 2 - 1);
      this.pickups.push({
        platform: p,
        kind,
        collected: false,
        phase: mixSeed(p.seed, 3) * Math.PI * 2,
        offsetX: spread,
      });
    }
  }

  prune(cameraY: number, viewH: number): void {
    const killY = cameraY - viewH * 0.9;
    let w = 0;
    for (let i = 0; i < this.pickups.length; i++) {
      const pk = this.pickups[i]!;
      if (!pk.collected && pk.platform.alive && pk.platform.y > killY) {
        this.pickups[w++] = pk;
      }
    }
    this.pickups.length = w;
  }

  update(
    dt: number,
    playerX: number,
    playerY: number,
    cameraY: number,
    viewH: number,
  ): TowerPickupKind | null {
    const nearY = viewH * 0.95;
    let found: TowerPickupKind | null = null;

    for (let i = 0; i < this.pickups.length; i++) {
      const pk = this.pickups[i]!;
      if (pk.collected || !pk.platform.alive || pk.platform.opacity < 0.2) continue;

      const py = pk.platform.y;
      if (Math.abs(py - cameraY) > nearY) continue;

      pk.phase += dt * 2.2;
      const bob = Math.sin(pk.phase) * 4;
      const x = pk.platform.x + pk.offsetX;
      const y = pk.platform.surfaceY + FLOAT_ABOVE + bob;

      const dx = playerX - x;
      const dy = playerY - y;
      const dist2 = dx * dx + dy * dy;
      if (dist2 < COLLECT_R2) {
        pk.collected = true;
        found = pk.kind;
        continue;
      }

      const dist = Math.sqrt(dist2);
      if (dist < MAGNET_R && dist > 1) {
        const pull = (1 - dist / MAGNET_R) * 100 * dt;
        pk.offsetX += (dx / dist) * pull;
      }
    }

    return found;
  }

  draw(
    ctx: CanvasRenderingContext2D,
    toScreen: (x: number, y: number) => { x: number; y: number },
    time: number,
    cameraY: number,
    viewH: number,
  ): void {
    const nearY = viewH * 0.95;
    const u = PIXEL.unit;

    for (let i = 0; i < this.pickups.length; i++) {
      const pk = this.pickups[i]!;
      if (pk.collected || !pk.platform.alive || pk.platform.opacity < 0.2) continue;
      if (Math.abs(pk.platform.y - cameraY) > nearY) continue;

      const bob = Math.sin(pk.phase + time * 0.45) * 4;
      const pulse = 1 + Math.sin(time * 2.8 + pk.phase) * 0.1;
      const raw = toScreen(pk.platform.x + pk.offsetX, pk.platform.surfaceY + FLOAT_ABOVE + bob);
      const s = snapPt(raw.x, raw.y);
      const box = px(ICON_BOX * pulse);

      ctx.save();
      ctx.translate(s.x - box / 2, s.y - box / 2);
      fillPx(ctx, -u, -u, box + u * 2, box + u * 2, rgba(PASTEL.butter, 0.35));
      fillPx(ctx, 0, 0, box, box, rgba(PASTEL.white, 0.58));
      fillPx(ctx, 0, 0, box, u, rgba(PASTEL.sky, 0.55));
      fillPx(ctx, 0, box - u, box, u, rgba(PASTEL.inkSoft, 0.2));

      drawTowerPickupIcon(ctx, pk.kind, box);
      ctx.restore();
    }
  }
}
