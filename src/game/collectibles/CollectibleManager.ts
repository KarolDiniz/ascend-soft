import { PASTEL, rgba } from '../../theme/pastelPalette';
import { PIXEL, fillPx, px, snapPt } from '../../theme/pixel';
import type { Platform } from '../Platform';
import {
  collectibleSeed,
  COLLECTIBLE_MIN_GAP_PLATFORMS,
  COLLECTIBLE_MIN_HEIGHT,
  COLLECTIBLES,
  rollCollectible,
  type CollectibleId,
} from './definitions';

const PICKUP_R = 17;
const COLLECT_R2 = 30 * 30;
const MAGNET_R = 95;
const FLOAT_ABOVE = 22;

interface Pickup {
  platform: Platform;
  id: CollectibleId;
  collected: boolean;
  phase: number;
  offsetX: number;
}

export class CollectibleManager {
  private pickups: Pickup[] = [];
  private seededPlatforms = new Set<number>();
  private platformsSinceSpawn = 999;

  reset(): void {
    this.pickups.length = 0;
    this.seededPlatforms.clear();
    this.platformsSinceSpawn = 999;
  }

  /** Register new platforms once — O(new) per frame, no per-frame allocations */
  syncPlatforms(platforms: readonly Platform[]): void {
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i]!;
      if (this.seededPlatforms.has(p.seed)) continue;
      this.seededPlatforms.add(p.seed);
      this.platformsSinceSpawn += 1;

      if (p.y < COLLECTIBLE_MIN_HEIGHT || !p.alive) continue;
      if (this.platformsSinceSpawn < COLLECTIBLE_MIN_GAP_PLATFORMS) continue;

      const id = rollCollectible(p.seed);
      if (!id) continue;

      this.platformsSinceSpawn = 0;
      const spread = (p.w * 0.5 - 10) * (collectibleSeed(p.seed, 44) * 2 - 1);
      this.pickups.push({
        platform: p,
        id,
        collected: false,
        phase: collectibleSeed(p.seed, 3) * Math.PI * 2,
        offsetX: spread,
      });
    }
  }

  prune(cameraY: number, viewH: number): void {
    const killY = cameraY - viewH * 0.85;
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
  ): CollectibleId | null {
    const nearY = viewH * 0.95;
    let found: CollectibleId | null = null;

    for (let i = 0; i < this.pickups.length; i++) {
      const pk = this.pickups[i]!;
      if (pk.collected || !pk.platform.alive || pk.platform.opacity < 0.2) continue;

      const py = pk.platform.y;
      if (Math.abs(py - cameraY) > nearY) continue;

      pk.phase += dt * 2.4;
      const bob = Math.sin(pk.phase) * 5;
      const x = pk.platform.x + pk.offsetX;
      const y = pk.platform.surfaceY + FLOAT_ABOVE + bob;

      const dx = playerX - x;
      const dy = playerY - y;
      const dist2 = dx * dx + dy * dy;
      if (dist2 < COLLECT_R2) {
        pk.collected = true;
        found = pk.id;
        continue;
      }

      const dist = Math.sqrt(dist2);
      if (dist < MAGNET_R && dist > 1) {
        const pull = (1 - dist / MAGNET_R) * 110 * dt;
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

      const bob = Math.sin(pk.phase + time * 0.5) * 5;
      const pulse = 1 + Math.sin(time * 3.2 + pk.phase) * 0.14;
      const raw = toScreen(pk.platform.x + pk.offsetX, pk.platform.surfaceY + FLOAT_ABOVE + bob);
      const s = snapPt(raw.x, raw.y);
      const r = px(PICKUP_R * pulse);
      const def = COLLECTIBLES[pk.id];

      ctx.save();
      ctx.globalAlpha = 1;
      drawCollectibleGlow(ctx, s.x, s.y, r, u, def, time, pk.phase, pulse);
      drawCollectibleShape(ctx, s.x, s.y, r, u, pk.id, def, time, pk.phase);
      ctx.restore();
    }
  }
}

function drawCollectibleGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  u: number,
  def: (typeof COLLECTIBLES)[CollectibleId],
  time: number,
  phase: number,
  pulse: number,
): void {
  const glowR = r * 1.55;
  fillPx(ctx, x - glowR / 2, y - glowR / 2, glowR, glowR, rgba(def.primary, 0.18 + pulse * 0.08));
  fillPx(ctx, x - r * 0.75, y - u * 1.5, r * 1.5, u * 3, rgba(def.secondary, 0.28));
  fillPx(ctx, x - r * 0.55, y + r * 0.35, r * 1.1, u * 2, rgba(PASTEL.inkSoft, 0.14));

  for (let i = 0; i < 4; i++) {
    const ang = time * 2.8 + phase + (i * Math.PI) / 2;
    const dist = r + u * 2.5 + Math.sin(time * 4 + i) * u;
    const sx = x + Math.cos(ang) * dist;
    const sy = y + Math.sin(ang) * dist * 0.55;
    fillPx(ctx, sx - u, sy - u, u * 2, u * 2, rgba(def.accent, 0.75 + Math.sin(time * 6 + i) * 0.2));
  }
}

function drawCollectibleShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  u: number,
  id: CollectibleId,
  def: (typeof COLLECTIBLES)[CollectibleId],
  time: number,
  phase: number,
): void {
  const twinkle = Math.sin(time * 5 + phase) > 0.45;

  switch (id) {
    case 'droplet':
      fillPx(ctx, x - u, y - r, u * 2, r, def.primary);
      fillPx(ctx, x - u * 2, y - u, u * 4, u * 2, def.secondary);
      fillPx(ctx, x - u, y - r - u * 2, u * 2, u * 2, def.primary);
      break;
    case 'pearl':
    case 'cloud':
      fillPx(ctx, x - r / 2, y - r / 2, r, r, def.primary);
      fillPx(ctx, x - u, y - r / 2 - u, u * 2, u, def.accent);
      break;
    case 'star':
      fillPx(ctx, x - u, y - r, u * 2, u * 2, def.primary);
      fillPx(ctx, x - r / 2, y - u, r, u * 2, def.secondary);
      if (twinkle) fillPx(ctx, x - u, y - u, u * 2, u * 2, def.accent);
      break;
    case 'petal':
      fillPx(ctx, x - r / 2, y - u, r * 0.7, u * 2, def.primary);
      fillPx(ctx, x - u, y - r / 2, u * 2, r * 0.65, def.secondary);
      break;
    case 'crystal':
      fillPx(ctx, x - u, y - r, u * 2, r * 1.6, def.primary);
      fillPx(ctx, x - r / 2, y, r, u * 2, def.secondary);
      if (twinkle) fillPx(ctx, x - u, y - u, u * 2, u * 2, def.accent);
      break;
    case 'moon':
      fillPx(ctx, x - r / 2, y - r / 2, r, r, def.primary);
      fillPx(ctx, x, y - r / 2, r / 2, r, rgba(PASTEL.inkSoft, 0.15));
      break;
    case 'sun':
      fillPx(ctx, x - r / 3, y - r / 3, (r * 2) / 3, (r * 2) / 3, def.primary);
      if (twinkle) {
        fillPx(ctx, x + r / 2, y - u, u, u, def.accent);
        fillPx(ctx, x - r / 2 - u, y, u, u, def.accent);
      }
      break;
    case 'leaf':
      fillPx(ctx, x - r / 2, y - u, r, u * 2, def.primary);
      fillPx(ctx, x, y - r / 2, u * 2, r * 0.8, def.secondary);
      break;
    case 'shell':
      fillPx(ctx, x - r / 2, y - u, r, u * 2, def.primary);
      fillPx(ctx, x - u, y - r / 2, u * 2, r * 0.5, def.secondary);
      break;
    case 'gem':
      fillPx(ctx, x - u, y - r, u * 2, r, def.primary);
      fillPx(ctx, x - r / 2, y - u, r, u * 2, def.secondary);
      fillPx(ctx, x - u, y - u, u * 2, u * 2, def.accent);
      break;
    case 'heart':
      fillPx(ctx, x - r / 2, y - u, r, u * 2, def.primary);
      fillPx(ctx, x - u, y - r / 2, u * 2, r * 0.75, def.secondary);
      fillPx(ctx, x - u * 2, y - u, u, u * 2, def.primary);
      fillPx(ctx, x + u, y - u, u, u * 2, def.primary);
      break;
    case 'coin':
      fillPx(ctx, x - r / 2, y - r / 2, r, r, def.primary);
      fillPx(ctx, x - u, y - u, u * 2, u * 2, def.accent);
      break;
    case 'snowflake':
      fillPx(ctx, x - u, y - r / 2, u * 2, r, def.primary);
      fillPx(ctx, x - r / 2, y - u, r, u * 2, def.secondary);
      if (twinkle) fillPx(ctx, x - u, y - u, u * 2, u * 2, def.accent);
      break;
    case 'mushroom':
      fillPx(ctx, x - r / 2, y - u, r, u * 2, def.secondary);
      fillPx(ctx, x - r * 0.65, y - r / 2, r * 1.3, r * 0.55, def.primary);
      break;
    case 'comet':
      fillPx(ctx, x - r / 2, y - u, r, u * 2, def.primary);
      fillPx(ctx, x + r / 4, y - u / 2, r * 0.7, u, def.accent);
      fillPx(ctx, x + r / 2, y, r * 0.5, u, rgba(def.secondary, 0.7));
      break;
    case 'rainbow':
      fillPx(ctx, x - r / 2, y - u, r, u * 2, def.primary);
      fillPx(ctx, x - r / 2, y - u * 2, r, u, def.secondary);
      fillPx(ctx, x - r / 2, y, r, u, def.accent);
      break;
    default:
      // sparkle + fallback
      fillPx(ctx, x - r / 2, y - u, r, u * 2, def.primary);
      fillPx(ctx, x - u, y - r / 2, u * 2, r, def.secondary);
      fillPx(ctx, x - u, y - u, u * 2, u * 2, def.accent);
      if (twinkle) {
        fillPx(ctx, x + r / 2, y - u, u, u, rgba(def.accent, 0.85));
        fillPx(ctx, x - r / 2 - u, y, u, u, rgba(def.accent, 0.7));
      }
  }
}
