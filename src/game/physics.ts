/** Shared physics derived from Player — used by spawner reachability. */
export const PHYS = {
  gravity: 980,
  jumpVel: 420,
  maxSpeed: 260,
  moveAccel: 2400,
  friction: 1600,
  airFriction: 280,
  playerHalfW: 14,
} as const;

/** Max safe jump height with margin (units). */
export const MAX_JUMP_HEIGHT =
  ((PHYS.jumpVel * PHYS.jumpVel) / (2 * PHYS.gravity)) * 0.85;

/** Approximate air time for full jump (up + down to same height). */
export const MAX_AIR_TIME = (2 * PHYS.jumpVel) / PHYS.gravity;

/** Conservative horizontal reach during a jump (centers, before widths). */
export const MAX_HORIZONTAL_REACH = PHYS.maxSpeed * MAX_AIR_TIME * 0.72;

export const REACH = {
  maxGapY: MAX_JUMP_HEIGHT,
  /** Min vertical gap so platforms don't stack awkwardly */
  minGapY: 42,
  maxCenterGapX: MAX_HORIZONTAL_REACH,
  /** Extra slack using platform half-widths is applied in spawner */
  moveAmpMax: 18,
  fadeVisibleMin: 2.6,
};
