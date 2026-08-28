/** Shared physics derived from Player — used by spawner reachability. */
export const PHYS = {
  gravity: 980,
  jumpVel: 420,
  maxSpeed: 260,
  moveAccel: 2400,
  friction: 1600,
  airFriction: 280,
  playerHalfW: 14,
  /** Pulos extras no ar (recuperação após plataforma que derrete/quebra). */
  maxAirJumps: 1,
  /** Impulso do pulo aéreo — altura plena para alcançar o próximo gap após queda. */
  airJumpMul: 1,
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
  /** Min vertical gap — keeps sprite bodies from stacking on each other */
  minGapY: 54,
  /** Prefer gaps in this band for readable rhythm */
  comfortGapY: 62,
  maxCenterGapX: MAX_HORIZONTAL_REACH,
  /** Min center-to-center X so platforms don't nestle side-by-side */
  minCenterGapX: 50,
  /** Extra edge clearance (world units) between AABB boxes when projecting on X */
  minEdgeClearance: 22,
  moveAmpMax: 18,
  fadeVisibleMin: 2.6,
};
