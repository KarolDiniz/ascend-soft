import { MATERIAL_PASTEL, materialDetailStroke } from '../theme/pastelPalette';

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
  | 'butterSlime'
  | 'marshmallow'
  | 'sponge'
  | 'soapBubble'
  | 'bathFoam'
  | 'lavenderSoap'
  | 'creamSoap'
  | 'keyboard'
  | 'bubbleWrap'
  | 'amoeba'
  | 'plasticBottle'
  | 'paper'
  | 'grass'
  | 'cotton'
  | 'moss'
  | 'cloud'
  | 'velvet'
  | 'blossom'
  | 'marimba'
  | 'crystal'
  | 'ceramic'
  | 'clay'
  | 'silk';

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
    stroke: materialDetailStroke(p.fill),
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
  marshmallow: mat('marshmallow', 'marshmallow', 'foam', 1.45, 1.1, 100),
  chocolate: mat('chocolate', 'chocolate', 'drip', 0.95, 1.15, 160),
  sponge: mat('sponge', 'esponja', 'foam', 1.3, 1.15, 180),
  glycerin: mat('glycerin', 'sabonete', 'bubble', 0.9, 1.2, 200),
  citrus: mat('citrus', 'cítrico', 'zest', 0.75, 1.2, 250),
  clearSlime: mat('clearSlime', 'chiclete', 'foam', 1.35, 1.3, 280),
  whipped: mat('whipped', 'espuma', 'foamBurst', 1.4, 1.25, 320),
  honeycomb: mat('honeycomb', 'mel', 'drip', 0.85, 1.25, 350),
  soapBubble: mat('soapBubble', 'bolha', 'bubble', 1.15, 1.25, 380),
  bathFoam: mat('bathFoam', 'espuma banho', 'foamBurst', 1.35, 1.3, 420),
  lavenderSoap: mat('lavenderSoap', 'sabonete lavanda', 'glitter', 0.75, 1.3, 480),
  creamSoap: mat('creamSoap', 'sabonete creme', 'bubble', 0.85, 1.35, 540),
  keyboard: mat('keyboard', 'teclado', 'crumb', 0.7, 1.35, 600),
  bubbleWrap: mat('bubbleWrap', 'plástico bolha', 'foamBurst', 0.95, 1.4, 680),
  kinetic: mat('kinetic', 'areia', 'sand', 1.1, 1.2, 700),
  iceSoap: mat('iceSoap', 'sabonete gelo', 'glitter', 0.5, 1.4, 850),
  butterSlime: mat('butterSlime', 'massa', 'foam', 1.5, 1.5, 1200),
  amoeba: mat('amoeba', 'ameba', 'foam', 1.4, 1.35, 1350),
  moss: mat('moss', 'musgo', 'foam', 1.2, 1.3, 1450),
  grass: mat('grass', 'grama', 'crumb', 1.15, 1.3, 1550),
  cotton: mat('cotton', 'algodão', 'foam', 1.35, 1.35, 1650),
  cloud: mat('cloud', 'nuvem', 'foamBurst', 1.5, 1.4, 1750),
  paper: mat('paper', 'papel', 'crumb', 0.9, 1.25, 1850),
  plasticBottle: mat('plasticBottle', 'garrafa PET', 'spark', 0.65, 1.4, 1950),
  velvet: mat('velvet', 'veludo', 'foam', 1.25, 1.45, 2100),
  blossom: mat('blossom', 'flores', 'glitter', 1.2, 1.35, 2200),
  marimba: mat('marimba', 'marimba', 'spark', 0.72, 1.38, 2280),
  crystal: mat('crystal', 'cristal', 'glitter', 0.55, 1.42, 2360),
  ceramic: mat('ceramic', 'cerâmica', 'shard', 0.68, 1.4, 2440),
  clay: mat('clay', 'argila', 'sand', 1.05, 1.32, 2520),
  silk: mat('silk', 'seda', 'foam', 1.22, 1.44, 2600),
};

export const MATERIAL_ORDER: MaterialId[] = [
  'jelly',
  'butter',
  'mochi',
  'marshmallow',
  'chocolate',
  'sponge',
  'glycerin',
  'citrus',
  'clearSlime',
  'whipped',
  'honeycomb',
  'soapBubble',
  'bathFoam',
  'lavenderSoap',
  'creamSoap',
  'keyboard',
  'bubbleWrap',
  'kinetic',
  'iceSoap',
  'butterSlime',
  'amoeba',
  'moss',
  'grass',
  'cotton',
  'cloud',
  'paper',
  'plasticBottle',
  'velvet',
  'blossom',
  'marimba',
  'crystal',
  'ceramic',
  'clay',
  'silk',
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
