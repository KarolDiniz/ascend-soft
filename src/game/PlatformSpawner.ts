import type { MaterialId } from '../audio/materials';
import { pickPhaseMaterial, phaseDifficultyScale } from './ThemedPhases';
import { getBehaviorDef } from './platform/behaviors';
import { rollLedgeWidth } from './platform/ledgeSizes';
import { Platform } from './Platform';
import { PHYS, REACH } from './physics';

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Max center-to-center X gap that remains landable given widths + vertical cost. */
function maxReachableCenterGap(fromW: number, toW: number, gapY: number): number {
  const yFactor = 1 - Math.min(0.5, (gapY / REACH.maxGapY) * 0.5);
  const widthBonus = fromW * 0.35 + toW * 0.35 - PHYS.playerHalfW;
  const base = REACH.maxCenterGapX * yFactor + Math.max(0, widthBonus);
  return Math.max(REACH.minCenterGapX + 8, Math.min(base, REACH.maxCenterGapX + 36));
}

/** Minimum |dx| so AABBs (and a bit of visual overflow) don't look glued. */
function minCenterGapX(fromW: number, toW: number, gapY: number): number {
  // Edge clearance: centers must be at least half-widths + padding apart
  const edgeSep = fromW / 2 + toW / 2 + REACH.minEdgeClearance;
  // If vertical gap is generous, allow slightly closer horizontally
  const yRelief = Math.max(0, (gapY - REACH.minGapY) / (REACH.maxGapY - REACH.minGapY));
  const padded = edgeSep * (1 - yRelief * 0.22);
  return Math.max(REACH.minCenterGapX, Math.min(padded, edgeSep));
}

function tooClose(
  ax: number,
  ay: number,
  aw: number,
  bx: number,
  by: number,
  bw: number,
): boolean {
  const dy = Math.abs(by - ay);
  const dx = Math.abs(bx - ax);
  if (dy < REACH.minGapY - 2) return true;
  const minX = minCenterGapX(aw, bw, dy);
  // Separation ellipse: if both axes are near-min, still too clustered
  const nx = dx / Math.max(1, minX);
  const ny = dy / Math.max(1, REACH.minGapY);
  return nx * nx + ny * ny < 1.05;
}

export class PlatformSpawner {
  platforms: Platform[] = [];
  private rand: () => number;
  private highestY = 0;
  private worldHalfW = 180;
  private lastWasFading = false;
  private lastDir = 1;

  constructor(seed = Date.now()) {
    this.rand = mulberry32(seed);
  }

  reset(worldHalfW: number): void {
    this.worldHalfW = worldHalfW;
    this.platforms = [];
    this.highestY = 0;
    this.lastWasFading = false;
    this.lastDir = 1;

    // Starters: butter-only intro — cozy, readable, always reachable
    const starters: { x: number; y: number; w: number; material: MaterialId }[] = [
      { x: 0, y: 0, w: 62, material: 'butter' },
      { x: -40, y: 56, w: 56, material: 'butter' },
      { x: 38, y: 112, w: 58, material: 'butter' },
    ];
    for (const s of starters) {
      this.platforms.push(new Platform(s));
    }
    this.highestY = 112;
  }

  update(playerY: number, cameraY: number, viewH: number): void {
    const spawnAhead = cameraY + viewH * 0.75;
    while (this.highestY < spawnAhead + 220) {
      this.spawnNext();
    }

    const killBelow = Math.min(cameraY - viewH * 0.7, playerY - 480);
    this.platforms = this.platforms.filter((p) => p.alive && p.y > killBelow - 40);
  }

  private spawnNext(): void {
    const height = this.highestY;
    const difficulty = phaseDifficultyScale(height);
    const last = this.platforms[this.platforms.length - 1];

    const gapYMin = REACH.minGapY;
    const gapYMax = Math.min(
      REACH.maxGapY * 0.92,
      REACH.comfortGapY + difficulty * (REACH.maxGapY - REACH.comfortGapY) * 0.85,
    );
    let gapY = gapYMin + this.rand() * Math.max(4, gapYMax - gapYMin);
    gapY = Math.min(Math.max(gapY, REACH.minGapY), REACH.maxGapY);

    const wMin = 70 - difficulty * 8;
    const wMax = 112 - difficulty * 18;
    // Placeholder width for reach calc — replaced after material pick
    let w = Math.max(64, wMin + this.rand() * (wMax - wMin));

    const maxGapX = maxReachableCenterGap(last.w, w, gapY);
    const minGapX = Math.min(minCenterGapX(last.w, w, gapY), maxGapX * 0.92);

    if (this.rand() < 0.3) this.lastDir *= -1;

    let x = this.pickX(last.x, minGapX, maxGapX, w);
    let y = this.highestY + gapY;

    // Resolve crowding vs recent platforms (N-1 and N-2), keep jumpable from last
    for (let attempt = 0; attempt < 6; attempt++) {
      let crowded = false;
      const recent = this.platforms.slice(-3);
      for (const p of recent) {
        if (tooClose(p.x, p.y, p.w, x, y, w)) {
          crowded = true;
          break;
        }
      }
      if (!crowded) break;

      gapY = Math.min(REACH.maxGapY, gapY + 4 + this.rand() * 6);
      y = this.highestY + gapY;
      const maxX2 = maxReachableCenterGap(last.w, w, gapY);
      const minX2 = Math.min(minCenterGapX(last.w, w, gapY), maxX2 * 0.92);
      this.lastDir *= -1;
      x = this.pickX(last.x, minX2, maxX2, w);
    }

    // Hard guarantee: reachable from previous platform
    let finalMaxX = maxReachableCenterGap(last.w, w, y - last.y);
    if (Math.abs(x - last.x) > finalMaxX) {
      x = last.x + Math.sign(x - last.x || this.lastDir) * finalMaxX * 0.9;
    }
    if (y - last.y > REACH.maxGapY) {
      y = last.y + REACH.maxGapY;
    }
    if (y - last.y < REACH.minGapY) {
      y = last.y + REACH.minGapY;
    }

    // Ensure min horizontal separation from last after clamps
    let needMinX = Math.min(minCenterGapX(last.w, w, y - last.y), finalMaxX * 0.9);
    if (Math.abs(x - last.x) < needMinX) {
      x = last.x + this.lastDir * needMinX;
      const margin = Math.max(w / 2 + 8, 36);
      const maxX = this.worldHalfW - margin;
      if (x > maxX) {
        x = last.x - needMinX;
        this.lastDir = -1;
      } else if (x < -maxX) {
        x = last.x + needMinX;
        this.lastDir = 1;
      }
      x = Math.max(-maxX, Math.min(maxX, x));
      if (Math.abs(x - last.x) > finalMaxX) {
        x = last.x + Math.sign(x - last.x) * finalMaxX * 0.88;
      }
    }

    const material = pickPhaseMaterial(height, this.rand);
    // Distinct ledge width per material identity
    w = rollLedgeWidth(material, this.rand);
    // Re-clamp X for new width
    finalMaxX = maxReachableCenterGap(last.w, w, y - last.y);
    needMinX = Math.min(minCenterGapX(last.w, w, y - last.y), finalMaxX * 0.9);
    if (Math.abs(x - last.x) > finalMaxX) {
      x = last.x + Math.sign(x - last.x || this.lastDir) * finalMaxX * 0.88;
    }
    if (Math.abs(x - last.x) < needMinX) {
      x = last.x + this.lastDir * needMinX;
    }
    {
      const margin = Math.max(w / 2 + 8, 36);
      const maxX = this.worldHalfW - margin;
      x = Math.max(-maxX, Math.min(maxX, x));
    }

    let moving =
      height > 380 && difficulty > 0.45 && this.rand() < 0.1 + difficulty * 0.06;
    let moveAmp = 10 + this.rand() * 8;
    if (moving) {
      moveAmp = Math.min(moveAmp, REACH.moveAmpMax);
      const worstDx = Math.abs(x - last.x) + moveAmp;
      if (worstDx > finalMaxX * 0.95) {
        moveAmp = Math.max(0, finalMaxX * 0.9 - Math.abs(x - last.x));
        if (moveAmp < 8) moving = false;
      }
    }

    let fading = false;
    const mortal = getBehaviorDef(material).mortal;
    if (
      !mortal &&
      height > 650 &&
      difficulty > 0.5 &&
      !moving &&
      !this.lastWasFading &&
      this.rand() < 0.07 + difficulty * 0.04
    ) {
      fading = true;
    }

    this.platforms.push(
      new Platform({
        x,
        y,
        w,
        material,
        moving,
        fading,
        moveAmp: moving ? moveAmp : 0,
      }),
    );
    this.highestY = y;
    this.lastWasFading = fading;
  }

  private pickX(fromX: number, minGapX: number, maxGapX: number, w: number): number {
    const span = Math.max(4, maxGapX - minGapX);
    const desired = minGapX + this.rand() * span;
    let x = fromX + this.lastDir * desired;

    const margin = Math.max(w / 2 + 8, 36);
    const maxX = this.worldHalfW - margin;

    if (x > maxX) {
      x = maxX;
      this.lastDir = -1;
      if (Math.abs(x - fromX) < minGapX) {
        x = Math.max(-maxX, fromX - minGapX);
      }
      if (Math.abs(x - fromX) > maxGapX) {
        x = fromX - Math.min(maxGapX * 0.9, fromX + maxX);
      }
    } else if (x < -maxX) {
      x = -maxX;
      this.lastDir = 1;
      if (Math.abs(x - fromX) < minGapX) {
        x = Math.min(maxX, fromX + minGapX);
      }
      if (Math.abs(x - fromX) > maxGapX) {
        x = fromX + Math.min(maxGapX * 0.9, maxX - fromX);
      }
    }

    const dx = x - fromX;
    if (Math.abs(dx) > maxGapX) {
      x = fromX + Math.sign(dx || this.lastDir) * maxGapX * 0.92;
      x = Math.max(-maxX, Math.min(maxX, x));
    }
    return x;
  }

  setWorldHalfWidth(w: number): void {
    this.worldHalfW = w;
  }
}
