import { pickMaterial, type MaterialId } from '../audio/materials';
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

/** Max center-to-center X gap that remains landable given widths. */
function maxReachableCenterGap(fromW: number, toW: number, gapY: number): number {
  // Vertical cost reduces horizontal budget (simple ellipse-ish reach)
  const yFactor = 1 - Math.min(0.55, (gapY / REACH.maxGapY) * 0.55);
  const widthBonus = fromW * 0.35 + toW * 0.35 - PHYS.playerHalfW;
  const base = REACH.maxCenterGapX * yFactor + Math.max(0, widthBonus);
  return Math.max(48, Math.min(base, REACH.maxCenterGapX + 40));
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

    const starters: { x: number; y: number; w: number; material: MaterialId }[] = [
      { x: 0, y: 0, w: 150, material: 'butter' },
      { x: -36, y: 58, w: 110, material: 'jelly' },
      { x: 42, y: 112, w: 100, material: 'mochi' },
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
    const difficulty = Math.min(1, height / 3200);

    const last = this.platforms[this.platforms.length - 1];

    // Difficulty changes rhythm/variety — NEVER exceeds reachable jump height
    const gapYMin = REACH.minGapY;
    const gapYMax = REACH.maxGapY * (0.72 + difficulty * 0.2); // up to ~0.92 of max
    let gapY = gapYMin + this.rand() * (gapYMax - gapYMin);
    gapY = Math.min(gapY, REACH.maxGapY);
    const y = this.highestY + gapY;

    const wMin = 72 - difficulty * 10;
    const wMax = 118 - difficulty * 20;
    const w = Math.max(64, wMin + this.rand() * (wMax - wMin));

    const maxGapX = maxReachableCenterGap(last.w, w, gapY);
    // Prefer continuing direction with occasional flip
    if (this.rand() < 0.28) this.lastDir *= -1;
    const desired = 22 + this.rand() * Math.max(10, maxGapX - 22);
    let x = last.x + this.lastDir * desired;

    const margin = Math.max(w / 2 + 8, 36);
    const maxX = this.worldHalfW - margin;

    // Reflect / pull toward last — never teleport to opposite wall
    if (x > maxX) {
      x = maxX;
      this.lastDir = -1;
      if (Math.abs(x - last.x) > maxGapX) {
        x = last.x + Math.min(maxGapX * 0.85, maxX - last.x);
      }
    } else if (x < -maxX) {
      x = -maxX;
      this.lastDir = 1;
      if (Math.abs(x - last.x) > maxGapX) {
        x = last.x - Math.min(maxGapX * 0.85, last.x + maxX);
      }
    }

    // Final hard clamp on center distance
    const dx = x - last.x;
    if (Math.abs(dx) > maxGapX) {
      x = last.x + Math.sign(dx || this.lastDir) * maxGapX * 0.92;
      x = Math.max(-maxX, Math.min(maxX, x));
    }

    const material = pickMaterial(height, this.rand);

    // Moving: small amp, and still reachable at worst extreme
    let moving = height > 380 && this.rand() < 0.1 + difficulty * 0.06;
    let moveAmp = 10 + this.rand() * 8;
    if (moving) {
      moveAmp = Math.min(moveAmp, REACH.moveAmpMax);
      const worstDx = Math.abs(x - last.x) + moveAmp;
      if (worstDx > maxGapX * 0.95) {
        // Too risky — either shrink amp or disable
        moveAmp = Math.max(0, maxGapX * 0.9 - Math.abs(x - last.x));
        if (moveAmp < 8) moving = false;
      }
    }

    // Fading: never consecutive, generous visible time, starts after land OR long timer
    let fading = false;
    if (
      height > 650 &&
      !moving &&
      !this.lastWasFading &&
      this.rand() < 0.07 + difficulty * 0.04
    ) {
      fading = true;
    }

    const plat = new Platform({
      x,
      y,
      w,
      material,
      moving,
      fading,
      moveAmp: moving ? moveAmp : 0,
    });
    this.platforms.push(plat);
    this.highestY = y;
    this.lastWasFading = fading;
  }

  setWorldHalfWidth(w: number): void {
    this.worldHalfW = w;
  }
}
