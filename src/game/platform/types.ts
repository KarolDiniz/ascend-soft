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
  | 'butterSlime_scoop'
  | 'marshmallow_puff'
  | 'marshmallow_cube'
  | 'sponge_block'
  | 'sponge_soft'
  | 'soapBubble_orb'
  | 'soapBubble_cluster'
  | 'bathFoam_cloud'
  | 'bathFoam_swirl'
  | 'lavenderSoap_bar'
  | 'lavenderSoap_gem'
  | 'creamSoap_bar'
  | 'creamSoap_oval'
  | 'keyboard_row'
  | 'keyboard_pad'
  | 'bubbleWrap_sheet'
  | 'bubbleWrap_pack'
  | 'amoeba_blob'
  | 'amoeba_dome'
  | 'plasticBottle_lay'
  | 'plasticBottle_up'
  | 'paper_fold'
  | 'paper_sheet'
  | 'grass_turf'
  | 'grass_patch'
  | 'cotton_puff'
  | 'cotton_pad'
  | 'moss_mound'
  | 'moss_clump'
  | 'cloud_puff'
  | 'cloud_drift'
  | 'velvet_pad'
  | 'velvet_fold'
  | 'blossom_meadow'
  | 'blossom_clump'
  | 'marimba_row'
  | 'marimba_pad'
  | 'crystal_shard'
  | 'crystal_block'
  | 'ceramic_plate'
  | 'ceramic_bowl'
  | 'clay_mound'
  | 'clay_tile'
  | 'silk_fold'
  | 'silk_pad'
  | 'kitten_cushion'
  | 'kitten_nest';

export interface VariantDef {
  id: PlatformVariant;
  visualDepth: number;
  visualSpread: number;
}
