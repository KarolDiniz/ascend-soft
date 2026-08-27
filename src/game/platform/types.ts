export interface PlatformDrawState {
  /** Top-left of collision AABB */
  x: number;
  y: number;
  /** Collision box size on screen */
  w: number;
  h: number;
  cx: number;
  /** Landing surface Y (top of hitbox) */
  surfaceY: number;
  time: number;
  wobble: number;
  seed: number;
  opacity: number;
  squashX: number;
  squashY: number;
}

export type PlatformVariant =
  | 'jelly_cube'
  | 'jelly_dome'
  | 'butter_slab'
  | 'butter_pat'
  | 'butter_curl'
  | 'mochi_round'
  | 'mochi_square'
  | 'chocolate_puddle'
  | 'chocolate_bar'
  | 'citrus_half'
  | 'citrus_wedge'
  | 'honey_chunk'
  | 'honey_drip'
  | 'glycerin_bar'
  | 'glycerin_gem'
  | 'whipped_peaks'
  | 'whipped_swirl'
  | 'kinetic_mound'
  | 'kinetic_slab'
  | 'ice_shard'
  | 'ice_block'
  | 'slime_puddle'
  | 'slime_blob'
  | 'butterSlime_fold'
  | 'butterSlime_scoop';

export interface VariantDef {
  id: PlatformVariant;
  visualDepth: number;
  visualSpread: number;
}
