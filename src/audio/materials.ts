import { MATERIAL_PASTEL } from '../theme/pastelPalette';

export type MaterialId =
  | 'jelly'
  | 'butter'
  | 'mochi'
  | 'chocolate'
  | 'citrus'
  | 'honeycomb'
  | 'glycerin'
  | 'whipped'
  | 'kinetic'
  | 'iceSoap'
  | 'clearSlime'
  | 'butterSlime';

export type ParticleStyle =
  | 'drip'
  | 'crumb'
  | 'foam'
  | 'glitter'
  | 'sand'
  | 'zest'
  | 'bubble'
  | 'spark'
  | 'juice'
  | 'foamBurst'
  | 'sandFall'
  | 'shard';

export interface MaterialDef {
  id: MaterialId;
  name: string;
  fill: string;
  stroke: string;
  glow: string;
  particle: string;
  particleStyle: ParticleStyle;
  squash: number;
  rarity: number;
  unlockAt: number;
  /** Soft wash over photoreal sprites — keeps pastel family */
  spriteWash: string;
}

function mat(
  id: MaterialId,
  name: string,
  particleStyle: ParticleStyle,
  squash: number,
  rarity: number,
  unlockAt: number,
): MaterialDef {
  const p = MATERIAL_PASTEL[id];
  return {
    id,
    name,
    fill: p.fill,
    stroke: p.stroke,
    glow: p.glow,
    particle: p.particle,
    particleStyle,
    squash,
    rarity,
    unlockAt,
    spriteWash: p.spriteWash,
  };
}

export const MATERIALS: Record<MaterialId, MaterialDef> = {
  jelly: mat('jelly', 'gelatina', 'drip', 1.35, 1, 0),
  butter: mat('butter', 'manteiga', 'crumb', 1.2, 1, 0),
  mochi: mat('mochi', 'queijo', 'foam', 1.25, 1.1, 80),
  chocolate: mat('chocolate', 'chocolate', 'drip', 0.95, 1.15, 160),
  citrus: mat('citrus', 'cítrico', 'zest', 0.75, 1.2, 250),
  honeycomb: mat('honeycomb', 'mel', 'drip', 0.85, 1.25, 350),
  glycerin: mat('glycerin', 'sabonete', 'bubble', 0.9, 1.2, 200),
  whipped: mat('whipped', 'espuma', 'foamBurst', 1.4, 1.25, 320),
  kinetic: mat('kinetic', 'areia', 'sand', 1.1, 1.2, 700),
  iceSoap: mat('iceSoap', 'sabonete gelo', 'glitter', 0.5, 1.4, 850),
  clearSlime: mat('clearSlime', 'chiclete', 'foam', 1.35, 1.3, 280),
  butterSlime: mat('butterSlime', 'massa', 'foam', 1.5, 1.5, 1200),
};

export const MATERIAL_ORDER: MaterialId[] = [
  'jelly',
  'butter',
  'mochi',
  'chocolate',
  'citrus',
  'honeycomb',
  'glycerin',
  'whipped',
  'kinetic',
  'iceSoap',
  'clearSlime',
  'butterSlime',
];

export function unlockedMaterials(height: number): MaterialId[] {
  return MATERIAL_ORDER.filter((id) => MATERIALS[id].unlockAt <= height);
}

export function pickMaterial(height: number, rand: () => number): MaterialId {
  const pool = unlockedMaterials(height);
  const weights = pool.map((id) => 1 / MATERIALS[id].rarity);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}
