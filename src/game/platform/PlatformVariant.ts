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
};

export function pickVariant(material: MaterialId, rand: () => number): VariantDef {
  const pool = VARIANTS[material];
  return pool[Math.floor(rand() * pool.length)] ?? pool[0];
}

export function getVariants(material: MaterialId): VariantDef[] {
  return VARIANTS[material];
}
