import type { MaterialId } from '../../audio/materials';
import type { VariantDef } from './types';

const VARIANTS: Record<MaterialId, VariantDef[]> = {
  jelly: [
    { id: 'jelly_cube', visualDepth: 1.55, visualSpread: 1.08 },
    { id: 'jelly_dome', visualDepth: 1.35, visualSpread: 1.15 },
  ],
  butter: [
    { id: 'butter_slab', visualDepth: 1.25, visualSpread: 1.05 },
    { id: 'butter_pat', visualDepth: 1.1, visualSpread: 1.12 },
    { id: 'butter_curl', visualDepth: 1.35, visualSpread: 1.18 },
  ],
  mochi: [
    { id: 'mochi_round', visualDepth: 1.45, visualSpread: 1.1 },
    { id: 'mochi_square', visualDepth: 1.3, visualSpread: 1.05 },
  ],
  chocolate: [
    { id: 'chocolate_puddle', visualDepth: 1.2, visualSpread: 1.2 },
    { id: 'chocolate_bar', visualDepth: 1.35, visualSpread: 1.0 },
  ],
  citrus: [
    { id: 'citrus_half', visualDepth: 1.5, visualSpread: 1.05 },
    { id: 'citrus_wedge', visualDepth: 1.25, visualSpread: 1.15 },
  ],
  honeycomb: [
    { id: 'honey_chunk', visualDepth: 1.4, visualSpread: 1.08 },
    { id: 'honey_drip', visualDepth: 1.55, visualSpread: 1.12 },
  ],
  glycerin: [
    { id: 'glycerin_bar', visualDepth: 1.3, visualSpread: 1.0 },
    { id: 'glycerin_gem', visualDepth: 1.45, visualSpread: 1.05 },
  ],
  whipped: [
    { id: 'whipped_peaks', visualDepth: 2.1, visualSpread: 1.15 },
    { id: 'whipped_swirl', visualDepth: 1.85, visualSpread: 1.2 },
  ],
  kinetic: [
    { id: 'kinetic_mound', visualDepth: 1.35, visualSpread: 1.18 },
    { id: 'kinetic_slab', visualDepth: 1.15, visualSpread: 1.1 },
  ],
  iceSoap: [
    { id: 'ice_shard', visualDepth: 1.5, visualSpread: 1.08 },
    { id: 'ice_block', visualDepth: 1.35, visualSpread: 1.0 },
  ],
  clearSlime: [
    { id: 'slime_puddle', visualDepth: 1.25, visualSpread: 1.25 },
    { id: 'slime_blob', visualDepth: 1.55, visualSpread: 1.2 },
  ],
  butterSlime: [
    { id: 'butterSlime_fold', visualDepth: 1.45, visualSpread: 1.15 },
    { id: 'butterSlime_scoop', visualDepth: 1.6, visualSpread: 1.12 },
  ],
  marshmallow: [
    { id: 'marshmallow_puff', visualDepth: 1.55, visualSpread: 1.1 },
    { id: 'marshmallow_cube', visualDepth: 1.4, visualSpread: 1.05 },
  ],
  sponge: [
    { id: 'sponge_block', visualDepth: 1.25, visualSpread: 1.08 },
    { id: 'sponge_soft', visualDepth: 1.15, visualSpread: 1.12 },
  ],
  soapBubble: [
    { id: 'soapBubble_orb', visualDepth: 1.5, visualSpread: 1.05 },
    { id: 'soapBubble_cluster', visualDepth: 1.35, visualSpread: 1.15 },
  ],
  bathFoam: [
    { id: 'bathFoam_cloud', visualDepth: 1.7, visualSpread: 1.18 },
    { id: 'bathFoam_swirl', visualDepth: 1.55, visualSpread: 1.2 },
  ],
  lavenderSoap: [
    { id: 'lavenderSoap_bar', visualDepth: 1.3, visualSpread: 1.0 },
    { id: 'lavenderSoap_gem', visualDepth: 1.4, visualSpread: 1.05 },
  ],
  creamSoap: [
    { id: 'creamSoap_bar', visualDepth: 1.3, visualSpread: 1.0 },
    { id: 'creamSoap_oval', visualDepth: 1.35, visualSpread: 1.08 },
  ],
  keyboard: [
    { id: 'keyboard_row', visualDepth: 1.05, visualSpread: 1.12 },
    { id: 'keyboard_pad', visualDepth: 1.1, visualSpread: 1.08 },
  ],
  bubbleWrap: [
    { id: 'bubbleWrap_sheet', visualDepth: 1.15, visualSpread: 1.1 },
    { id: 'bubbleWrap_pack', visualDepth: 1.25, visualSpread: 1.08 },
  ],
  amoeba: [
    { id: 'amoeba_blob', visualDepth: 0.95, visualSpread: 1.12 },
    { id: 'amoeba_dome', visualDepth: 1.05, visualSpread: 1.08 },
  ],
  plasticBottle: [
    { id: 'plasticBottle_lay', visualDepth: 0.85, visualSpread: 1.15 },
    { id: 'plasticBottle_up', visualDepth: 1.4, visualSpread: 0.9 },
  ],
  paper: [
    { id: 'paper_fold', visualDepth: 0.65, visualSpread: 1.0 },
    { id: 'paper_sheet', visualDepth: 0.58, visualSpread: 1.05 },
  ],
  grass: [
    { id: 'grass_turf', visualDepth: 0.82, visualSpread: 1.06 },
    { id: 'grass_patch', visualDepth: 0.72, visualSpread: 1.1 },
  ],
  cotton: [
    { id: 'cotton_puff', visualDepth: 1.35, visualSpread: 1.1 },
    { id: 'cotton_pad', visualDepth: 1.15, visualSpread: 1.06 },
  ],
  moss: [
    { id: 'moss_mound', visualDepth: 1.0, visualSpread: 1.05 },
    { id: 'moss_clump', visualDepth: 0.88, visualSpread: 1.08 },
  ],
  cloud: [
    { id: 'cloud_puff', visualDepth: 1.28, visualSpread: 1.14 },
    { id: 'cloud_drift', visualDepth: 1.15, visualSpread: 1.18 },
  ],
  velvet: [
    { id: 'velvet_pad', visualDepth: 0.7, visualSpread: 1.0 },
    { id: 'velvet_fold', visualDepth: 0.78, visualSpread: 1.04 },
  ],
  blossom: [
    { id: 'blossom_meadow', visualDepth: 0.85, visualSpread: 1.1 },
    { id: 'blossom_clump', visualDepth: 0.95, visualSpread: 1.06 },
  ],
  marimba: [
    { id: 'marimba_row', visualDepth: 0.68, visualSpread: 1.12 },
    { id: 'marimba_pad', visualDepth: 0.62, visualSpread: 1.08 },
  ],
  crystal: [
    { id: 'crystal_shard', visualDepth: 1.42, visualSpread: 1.02 },
    { id: 'crystal_block', visualDepth: 1.28, visualSpread: 0.98 },
  ],
  ceramic: [
    { id: 'ceramic_plate', visualDepth: 0.72, visualSpread: 1.08 },
    { id: 'ceramic_bowl', visualDepth: 1.05, visualSpread: 1.02 },
  ],
  clay: [
    { id: 'clay_mound', visualDepth: 1.08, visualSpread: 1.1 },
    { id: 'clay_tile', visualDepth: 0.78, visualSpread: 1.04 },
  ],
  silk: [
    { id: 'silk_fold', visualDepth: 0.68, visualSpread: 1.02 },
    { id: 'silk_pad', visualDepth: 0.74, visualSpread: 1.0 },
  ],
  kitten: [
    { id: 'kitten_cushion', visualDepth: 0.82, visualSpread: 1.12 },
    { id: 'kitten_nest', visualDepth: 0.9, visualSpread: 1.08 },
  ],
  mushroom: [
    { id: 'mushroom_cap', visualDepth: 1.35, visualSpread: 1.08 },
    { id: 'mushroom_cluster', visualDepth: 1.2, visualSpread: 1.12 },
  ],
  kalimba: [
    { id: 'kalimba_box', visualDepth: 0.72, visualSpread: 1.06 },
    { id: 'kalimba_wide', visualDepth: 0.68, visualSpread: 1.1 },
  ],
  xylophone: [
    { id: 'xylophone_row', visualDepth: 0.66, visualSpread: 1.12 },
    { id: 'xylophone_pad', visualDepth: 0.6, visualSpread: 1.08 },
  ],
  tambourine: [
    { id: 'tambourine_disc', visualDepth: 0.55, visualSpread: 1.05 },
    { id: 'tambourine_ring', visualDepth: 0.62, visualSpread: 1.08 },
  ],
  popcorn: [
    { id: 'popcorn_bowl', visualDepth: 1.05, visualSpread: 1.1 },
    { id: 'popcorn_mound', visualDepth: 1.2, visualSpread: 1.14 },
  ],
  bamboo: [
    { id: 'bamboo_segment', visualDepth: 1.1, visualSpread: 1.0 },
    { id: 'bamboo_bundle', visualDepth: 1.25, visualSpread: 1.06 },
  ],
  cork: [
    { id: 'cork_plug', visualDepth: 1.15, visualSpread: 0.95 },
    { id: 'cork_disk', visualDepth: 0.75, visualSpread: 1.05 },
  ],
  seashell: [
    { id: 'seashell_spiral', visualDepth: 1.05, visualSpread: 1.02 },
    { id: 'seashell_clam', visualDepth: 0.85, visualSpread: 1.08 },
  ],
  macaron: [
    { id: 'macaron_pair', visualDepth: 0.95, visualSpread: 1.05 },
    { id: 'macaron_stack', visualDepth: 1.15, visualSpread: 1.0 },
  ],
  boba: [
    { id: 'boba_cup', visualDepth: 1.3, visualSpread: 0.98 },
    { id: 'boba_puddle', visualDepth: 0.9, visualSpread: 1.12 },
  ],
  feather: [
    { id: 'feather_puff', visualDepth: 1.4, visualSpread: 1.1 },
    { id: 'feather_drift', visualDepth: 1.25, visualSpread: 1.14 },
  ],
  woodBlock: [
    { id: 'woodBlock_log', visualDepth: 0.88, visualSpread: 1.04 },
    { id: 'woodBlock_stump', visualDepth: 1.05, visualSpread: 1.02 },
  ],
};

export function pickVariant(material: MaterialId, rand: () => number): VariantDef {
  const pool = VARIANTS[material];
  return pool[Math.floor(rand() * pool.length)] ?? pool[0];
}

export function getVariants(material: MaterialId): VariantDef[] {
  return VARIANTS[material];
}
