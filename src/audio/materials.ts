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
}

export const MATERIALS: Record<MaterialId, MaterialDef> = {
  jelly: {
    id: 'jelly',
    name: 'gelatina',
    fill: 'rgba(120, 210, 190, 0.72)',
    stroke: 'rgba(70, 170, 155, 0.95)',
    glow: 'rgba(120, 210, 190, 0.4)',
    particle: '#7ecfc0',
    particleStyle: 'drip',
    squash: 1.35,
    rarity: 1,
    unlockAt: 0,
  },
  butter: {
    id: 'butter',
    name: 'manteiga',
    fill: 'rgba(245, 220, 120, 0.95)',
    stroke: 'rgba(220, 185, 70, 0.9)',
    glow: 'rgba(245, 220, 120, 0.35)',
    particle: '#f0d878',
    particleStyle: 'crumb',
    squash: 1.2,
    rarity: 1,
    unlockAt: 0,
  },
  mochi: {
    id: 'mochi',
    name: 'mochi',
    fill: 'rgba(255, 214, 230, 0.95)',
    stroke: 'rgba(235, 170, 195, 0.85)',
    glow: 'rgba(255, 214, 230, 0.4)',
    particle: '#ffd0e0',
    particleStyle: 'foam',
    squash: 1.55,
    rarity: 1.1,
    unlockAt: 80,
  },
  chocolate: {
    id: 'chocolate',
    name: 'ganache',
    fill: 'rgba(92, 52, 36, 0.96)',
    stroke: 'rgba(60, 32, 22, 0.9)',
    glow: 'rgba(140, 90, 60, 0.35)',
    particle: '#8b5a3c',
    particleStyle: 'drip',
    squash: 0.95,
    rarity: 1.15,
    unlockAt: 160,
  },
  citrus: {
    id: 'citrus',
    name: 'casca cítrica',
    fill: 'rgba(255, 170, 70, 0.95)',
    stroke: 'rgba(230, 130, 40, 0.9)',
    glow: 'rgba(255, 190, 100, 0.35)',
    particle: '#ffb84d',
    particleStyle: 'zest',
    squash: 0.75,
    rarity: 1.2,
    unlockAt: 250,
  },
  honeycomb: {
    id: 'honeycomb',
    name: 'mel',
    fill: 'rgba(230, 170, 60, 0.9)',
    stroke: 'rgba(190, 130, 40, 0.95)',
    glow: 'rgba(240, 190, 80, 0.4)',
    particle: '#e6b03c',
    particleStyle: 'drip',
    squash: 0.85,
    rarity: 1.25,
    unlockAt: 350,
  },
  glycerin: {
    id: 'glycerin',
    name: 'sabonete glicerina',
    fill: 'rgba(160, 210, 255, 0.55)',
    stroke: 'rgba(120, 180, 230, 0.9)',
    glow: 'rgba(180, 230, 255, 0.5)',
    particle: '#a8d8ff',
    particleStyle: 'glitter',
    squash: 0.9,
    rarity: 1.3,
    unlockAt: 450,
  },
  whipped: {
    id: 'whipped',
    name: 'sabonete batido',
    fill: 'rgba(255, 248, 252, 0.96)',
    stroke: 'rgba(235, 210, 225, 0.8)',
    glow: 'rgba(255, 240, 250, 0.45)',
    particle: '#fff5fa',
    particleStyle: 'foam',
    squash: 1.4,
    rarity: 1.25,
    unlockAt: 550,
  },
  kinetic: {
    id: 'kinetic',
    name: 'areia cinética',
    fill: 'rgba(210, 175, 145, 0.97)',
    stroke: 'rgba(175, 140, 110, 0.9)',
    glow: 'rgba(210, 175, 145, 0.28)',
    particle: '#c9a88a',
    particleStyle: 'sand',
    squash: 1.1,
    rarity: 1.2,
    unlockAt: 700,
  },
  iceSoap: {
    id: 'iceSoap',
    name: 'sabonete gelo',
    fill: 'rgba(200, 230, 245, 0.7)',
    stroke: 'rgba(150, 200, 225, 0.95)',
    glow: 'rgba(210, 240, 255, 0.5)',
    particle: '#c8e8f8',
    particleStyle: 'glitter',
    squash: 0.5,
    rarity: 1.4,
    unlockAt: 850,
  },
  clearSlime: {
    id: 'clearSlime',
    name: 'slime cristal',
    fill: 'rgba(180, 240, 220, 0.4)',
    stroke: 'rgba(120, 210, 185, 0.85)',
    glow: 'rgba(180, 240, 220, 0.45)',
    particle: '#a8f0d8',
    particleStyle: 'bubble',
    squash: 1.45,
    rarity: 1.45,
    unlockAt: 1000,
  },
  butterSlime: {
    id: 'butterSlime',
    name: 'butter slime',
    fill: 'rgba(255, 200, 160, 0.95)',
    stroke: 'rgba(230, 160, 120, 0.9)',
    glow: 'rgba(255, 200, 160, 0.35)',
    particle: '#ffc8a0',
    particleStyle: 'foam',
    squash: 1.5,
    rarity: 1.5,
    unlockAt: 1200,
  },
};

/** Unlock order by height milestones */
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
