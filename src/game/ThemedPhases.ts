import { MATERIALS, type MaterialId } from '../audio/materials';
import { MATERIAL_PASTEL, materialDetailStroke, PASTEL, rgba } from '../theme/pastelPalette';

/**
 * Catálogo completo de materiais/fases — ordem de gameplay vem de PhaseRunOrder (embaralhada por run).
 */
export const PHASE_ORDER: MaterialId[] = [
  'butter',
  'jelly',
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
  'kitten',
];

/** Altitude span per themed phase (player.y). */
export const PHASE_HEIGHT = 200;

/** Smooth blend window at each phase boundary — long for ultra-fluid crossfade. */
export const PHASE_BLEND = 70;

export const PHASE_COUNT = PHASE_ORDER.length;

export const CYCLE_LENGTH = PHASE_HEIGHT * PHASE_COUNT;

export type AmbientType =
  | 'pollen'
  | 'sugarDust'
  | 'steam'
  | 'bubbleFloat'
  | 'foamSpeck'
  | 'frost'
  | 'snowMote'
  | 'lightOrb'
  | 'petal'
  | 'sparkleIdle'
  | 'sprinkle'
  | 'dripAmbient'
  | 'emberSoft';

export type BlobKind = 'slice' | 'petal' | 'scoop' | 'bubble' | 'crystal' | 'orb' | 'flake';

export type DecorKind =
  | 'leaf'
  | 'hibiscus'
  | 'citrus'
  | 'cake'
  | 'spoon'
  | 'creamCloud'
  | 'donut'
  | 'bottle'
  | 'bigBubble'
  | 'towel'
  | 'stone'
  | 'crystal'
  | 'iceBlock'
  | 'snowflake'
  | 'lightRing'
  | 'softOrb'
  | 'abstractMote'
  | 'bird'
  | 'flowerBouquet'
  | 'windChime'
  | 'marimbaBar'
  | 'pottery'
  | 'honeyDrip'
  | 'keyCap'
  | 'bubbleCell'
  | 'sandDune'
  | 'yarnBall'
  | 'pawPrint'
  | 'ribbon'
  | 'origami'
  | 'whippedSpiral'
  | 'slimeStretch'
  | 'lavenderSprig'
  | 'cottonPuff'
  | 'steamWisp';

export type OverlayKind =
  | 'mottle'
  | 'sugarVeil'
  | 'caustics'
  | 'frostEdge'
  | 'goldBloom'
  | 'hexVeil'
  | 'dotMatrix'
  | 'bubbleGrid'
  | 'sandDrift'
  | 'foldLines'
  | 'staffLines'
  | 'speckleField'
  | 'refraction';

export type HorizonKind =
  | 'meltHills'
  | 'jellyBlocks'
  | 'foamArches'
  | 'leafHills'
  | 'cloudLayers'
  | 'crystalPeaks'
  | 'marimbaSkyline'
  | 'sandDunes'
  | 'bubbleHorizon'
  | 'neutral';

export interface ZonePalette {
  top: string;
  mid: string;
  bottom: string;
  accent: string;
  blob: string[];
}

export interface AmbientPreset {
  type: AmbientType;
  weight: number;
  color: string;
}

/** Map absolute height to position within the repeating cycle. */
export function cyclicHeight(h: number): number {
  const mod = h % CYCLE_LENGTH;
  return mod < 0 ? mod + CYCLE_LENGTH : mod;
}

export function phaseIndexAt(height: number): number {
  return Math.min(PHASE_COUNT - 1, Math.floor(cyclicHeight(height) / PHASE_HEIGHT));
}

export function cycleCount(height: number): number {
  return Math.floor(Math.max(0, height) / CYCLE_LENGTH);
}

/** Smoothstep blend 0→1 across the boundary between phase A and B. */
export function phaseTransitionT(height: number): number {
  const ch = cyclicHeight(height);
  const idx = phaseIndexAt(height);
  const boundary = (idx + 1) * PHASE_HEIGHT;
  if (idx >= PHASE_COUNT - 1) {
    // Last phase → wraps to phase 0
    const wrapBoundary = CYCLE_LENGTH;
    const dist = ch - (wrapBoundary - PHASE_BLEND);
    if (dist <= 0) return 0;
    const t = Math.min(1, dist / (PHASE_BLEND * 2));
    return t * t * (3 - 2 * t);
  }
  const t = Math.min(1, Math.max(0, (ch - (boundary - PHASE_BLEND)) / (PHASE_BLEND * 2)));
  return t * t * (3 - 2 * t);
}

function darken(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 255) - amt);
  const g = Math.max(0, ((n >> 8) & 255) - amt);
  const b = Math.max(0, (n & 255) - amt);
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

/** Céu mais escuro que as plataformas — contraste suave para ler prateleiras/partículas. */
export function materialPalette(id: MaterialId): ZonePalette {
  const m = MATERIAL_PASTEL[id];
  return {
    top: darken(m.fill, 22),
    mid: darken(m.fill, 36),
    bottom: darken(m.fill, 48),
    accent: m.particle,
    blob: [rgba(m.particle, 0.22), rgba(m.fill, 0.18), rgba(m.particle, 0.12)],
  };
}

/** Frases motivacionais — uma por mundo temático. */
export const PHASE_QUOTES: Record<MaterialId, string> = {
  butter: 'Derreta devagar. O caminho também pode ser macio.',
  jelly: 'Balance sem medo — a vida também tremula bonito.',
  mochi: 'Seja macio por fora e firme por dentro.',
  marshmallow: 'Flutue leve. Nem tudo precisa pesar.',
  chocolate: 'Doce com profundidade — mergulhe no momento.',
  sponge: 'Absorva o que importa. Deixe o resto escorrer.',
  glycerin: 'Transpareça. Deixe a luz passar por você.',
  citrus: 'Esprema o dia. Cada gota conta.',
  clearSlime: 'Seja maleável como ele — estique, adapte, volte.',
  whipped: 'Monte sua leveza camada por camada.',
  honeycomb: 'Organize-se em hexágonos de calma.',
  soapBubble: 'Brilhe frágil e bonito, ainda que por um instante.',
  bathFoam: 'Mergulhe no agora. Deixe tudo mais suave.',
  lavenderSoap: 'Acalme o corpo. A mente vem junto.',
  creamSoap: 'Gentileza também limpa.',
  keyboard: 'Cada toque importa. Toque com intenção.',
  bubbleWrap: 'Estoure a tensão. Um estalo de cada vez.',
  kinetic: 'Molde-se. Você decide a forma.',
  iceSoap: 'Fique fresco. Clareza também é cuidado.',
  butterSlime: 'Estique seus limites — eles voltam.',
  amoeba: 'Flua. A forma é só temporária.',
  moss: 'Cresça devagar. A calma também é vida.',
  grass: 'Balance com o vento. Flexibilidade é força.',
  cotton: 'Leveza não é fragilidade — é descanso.',
  cloud: 'Flutue. Nem todo chão precisa ser sólido.',
  paper: 'Dobre, desdobre. Você também pode recomeçar.',
  plasticBottle: 'Transpareça o essencial. Menos peso, mais ar.',
  velvet: 'Toque com carinho. Suavidade também sustenta.',
  blossom: 'Floresce onde você pisa. Beleza também é caminho.',
  marimba: 'Cada passo é uma nota. Ritmo também acalma.',
  crystal: 'Brilhe com clareza. Transparência também é força.',
  ceramic: 'Formado com cuidado. Imperfeição também é arte.',
  clay: 'Modele o instante. Tudo pode ser refeito.',
  silk: 'Deslize com graça. Leveza também sustenta.',
  kitten: 'Miau com calma. Carinho também é caminho.',
};

export function phaseQuote(id: MaterialId): string {
  return PHASE_QUOTES[id];
}

export function materialSceneryColors(id: MaterialId): string[] {
  const m = MATERIAL_PASTEL[id];
  return [
    rgba(m.particle, 0.42),
    rgba(m.fill, 0.38),
    rgba(materialDetailStroke(m.fill), 0.34),
    rgba(m.glow, 0.36),
  ];
}

/** Themed decor props per material world. */
const DECOR: Record<MaterialId, DecorKind[]> = {
  butter: ['creamCloud', 'spoon', 'honeyDrip', 'creamCloud', 'spoon'],
  jelly: ['bigBubble', 'slimeStretch', 'bigBubble', 'softOrb'],
  mochi: ['donut', 'creamCloud', 'softOrb', 'donut'],
  marshmallow: ['creamCloud', 'cottonPuff', 'softOrb', 'creamCloud'],
  chocolate: ['cake', 'spoon', 'honeyDrip', 'creamCloud'],
  sponge: ['towel', 'stone', 'steamWisp', 'towel'],
  glycerin: ['bottle', 'bigBubble', 'softOrb', 'bottle'],
  citrus: ['citrus', 'leaf', 'citrus', 'leaf'],
  clearSlime: ['bigBubble', 'slimeStretch', 'softOrb', 'bigBubble'],
  whipped: ['whippedSpiral', 'spoon', 'creamCloud', 'whippedSpiral'],
  honeycomb: ['honeyDrip', 'donut', 'creamCloud', 'honeyDrip'],
  soapBubble: ['bigBubble', 'softOrb', 'bigBubble', 'steamWisp'],
  bathFoam: ['towel', 'bigBubble', 'steamWisp', 'stone'],
  lavenderSoap: ['bottle', 'lavenderSprig', 'hibiscus', 'bottle'],
  creamSoap: ['bottle', 'towel', 'creamCloud', 'steamWisp'],
  keyboard: ['keyCap', 'stone', 'keyCap', 'abstractMote'],
  bubbleWrap: ['bubbleCell', 'bigBubble', 'bubbleCell', 'softOrb'],
  kinetic: ['sandDune', 'stone', 'sandDune', 'abstractMote'],
  iceSoap: ['iceBlock', 'snowflake', 'crystal', 'snowflake'],
  butterSlime: ['slimeStretch', 'bigBubble', 'softOrb', 'creamCloud'],
  amoeba: ['softOrb', 'slimeStretch', 'bigBubble', 'softOrb'],
  moss: ['leaf', 'stone', 'lavenderSprig', 'leaf'],
  grass: ['bird', 'leaf', 'bird', 'stone'],
  cotton: ['cottonPuff', 'softOrb', 'creamCloud', 'cottonPuff'],
  cloud: ['creamCloud', 'softOrb', 'bigBubble', 'cottonPuff'],
  paper: ['origami', 'abstractMote', 'origami', 'spoon'],
  plasticBottle: ['bottle', 'bigBubble', 'bottle', 'softOrb'],
  velvet: ['ribbon', 'softOrb', 'creamCloud', 'ribbon'],
  blossom: ['flowerBouquet', 'hibiscus', 'leaf', 'flowerBouquet'],
  marimba: ['marimbaBar', 'windChime', 'softOrb', 'marimbaBar'],
  crystal: ['crystal', 'lightRing', 'snowflake', 'softOrb'],
  ceramic: ['pottery', 'spoon', 'stone', 'pottery'],
  clay: ['pottery', 'stone', 'leaf', 'pottery'],
  silk: ['ribbon', 'softOrb', 'flowerBouquet', 'lightRing'],
  kitten: ['yarnBall', 'pawPrint', 'softOrb', 'yarnBall'],
};

const OVERLAY: Record<MaterialId, OverlayKind> = {
  butter: 'mottle',
  jelly: 'caustics',
  mochi: 'sugarVeil',
  marshmallow: 'sugarVeil',
  chocolate: 'mottle',
  sponge: 'speckleField',
  glycerin: 'caustics',
  citrus: 'mottle',
  clearSlime: 'caustics',
  whipped: 'sugarVeil',
  honeycomb: 'hexVeil',
  soapBubble: 'caustics',
  bathFoam: 'caustics',
  lavenderSoap: 'caustics',
  creamSoap: 'mottle',
  keyboard: 'dotMatrix',
  bubbleWrap: 'bubbleGrid',
  kinetic: 'sandDrift',
  iceSoap: 'frostEdge',
  butterSlime: 'goldBloom',
  amoeba: 'caustics',
  moss: 'speckleField',
  grass: 'speckleField',
  cotton: 'sugarVeil',
  cloud: 'sugarVeil',
  paper: 'foldLines',
  plasticBottle: 'refraction',
  velvet: 'goldBloom',
  blossom: 'mottle',
  marimba: 'staffLines',
  crystal: 'caustics',
  ceramic: 'mottle',
  clay: 'speckleField',
  silk: 'goldBloom',
  kitten: 'sugarVeil',
};

const HORIZON: Record<MaterialId, HorizonKind> = {
  butter: 'meltHills',
  jelly: 'jellyBlocks',
  mochi: 'meltHills',
  marshmallow: 'cloudLayers',
  chocolate: 'meltHills',
  sponge: 'foamArches',
  glycerin: 'bubbleHorizon',
  citrus: 'leafHills',
  clearSlime: 'jellyBlocks',
  whipped: 'cloudLayers',
  honeycomb: 'meltHills',
  soapBubble: 'bubbleHorizon',
  bathFoam: 'foamArches',
  lavenderSoap: 'foamArches',
  creamSoap: 'foamArches',
  keyboard: 'marimbaSkyline',
  bubbleWrap: 'bubbleHorizon',
  kinetic: 'sandDunes',
  iceSoap: 'crystalPeaks',
  butterSlime: 'cloudLayers',
  amoeba: 'jellyBlocks',
  moss: 'leafHills',
  grass: 'leafHills',
  cotton: 'cloudLayers',
  cloud: 'cloudLayers',
  paper: 'neutral',
  plasticBottle: 'bubbleHorizon',
  velvet: 'cloudLayers',
  blossom: 'leafHills',
  marimba: 'marimbaSkyline',
  crystal: 'crystalPeaks',
  ceramic: 'neutral',
  clay: 'sandDunes',
  silk: 'cloudLayers',
  kitten: 'cloudLayers',
};

const BLOBS: Record<MaterialId, BlobKind[]> = {
  butter: ['slice', 'scoop', 'flake'],
  jelly: ['bubble', 'orb', 'flake'],
  mochi: ['scoop', 'petal', 'flake'],
  marshmallow: ['scoop', 'petal', 'flake'],
  chocolate: ['slice', 'scoop', 'flake'],
  sponge: ['scoop', 'flake', 'petal'],
  glycerin: ['bubble', 'orb', 'flake'],
  citrus: ['slice', 'petal', 'flake'],
  clearSlime: ['bubble', 'orb', 'flake'],
  whipped: ['scoop', 'petal', 'flake'],
  honeycomb: ['slice', 'scoop', 'flake'],
  soapBubble: ['bubble', 'orb', 'flake'],
  bathFoam: ['bubble', 'orb', 'flake'],
  lavenderSoap: ['petal', 'orb', 'flake'],
  creamSoap: ['scoop', 'orb', 'flake'],
  keyboard: ['slice', 'flake', 'orb'],
  bubbleWrap: ['bubble', 'orb', 'flake'],
  kinetic: ['flake', 'slice', 'orb'],
  iceSoap: ['crystal', 'flake', 'orb'],
  butterSlime: ['scoop', 'bubble', 'orb'],
  amoeba: ['orb', 'bubble', 'flake'],
  moss: ['petal', 'flake', 'orb'],
  grass: ['petal', 'flake', 'slice'],
  cotton: ['scoop', 'petal', 'flake'],
  cloud: ['orb', 'bubble', 'flake'],
  paper: ['slice', 'flake', 'orb'],
  plasticBottle: ['bubble', 'orb', 'crystal'],
  velvet: ['petal', 'scoop', 'flake'],
  blossom: ['petal', 'orb', 'flake'],
  marimba: ['slice', 'orb', 'flake'],
  crystal: ['crystal', 'orb', 'flake'],
  ceramic: ['slice', 'scoop', 'flake'],
  clay: ['flake', 'slice', 'orb'],
  silk: ['petal', 'scoop', 'flake'],
  kitten: ['orb', 'petal', 'flake'],
};

/** Per-phase wind / particle mood — dense ASMR particle field. */
const WIND: Record<MaterialId, { windX: number; windY: number; density: number; breathPeriod: number; grainAlpha: number; particleBudget: number }> = {
  butter: { windX: 10, windY: 6, density: 1.55, breathPeriod: 12, grainAlpha: 0.038, particleBudget: 720 },
  jelly: { windX: 8, windY: 10, density: 1.6, breathPeriod: 11, grainAlpha: 0.035, particleBudget: 760 },
  mochi: { windX: 14, windY: 5, density: 1.55, breathPeriod: 10, grainAlpha: 0.034, particleBudget: 740 },
  marshmallow: { windX: 12, windY: 8, density: 1.5, breathPeriod: 13, grainAlpha: 0.032, particleBudget: 700 },
  chocolate: { windX: 16, windY: 4, density: 1.62, breathPeriod: 10, grainAlpha: 0.036, particleBudget: 750 },
  sponge: { windX: 9, windY: 12, density: 1.65, breathPeriod: 11, grainAlpha: 0.034, particleBudget: 730 },
  glycerin: { windX: 7, windY: 14, density: 1.7, breathPeriod: 12, grainAlpha: 0.03, particleBudget: 780 },
  citrus: { windX: 18, windY: 6, density: 1.58, breathPeriod: 9, grainAlpha: 0.035, particleBudget: 720 },
  clearSlime: { windX: 11, windY: 9, density: 1.68, breathPeriod: 11, grainAlpha: 0.033, particleBudget: 770 },
  whipped: { windX: 14, windY: 7, density: 1.6, breathPeriod: 10, grainAlpha: 0.032, particleBudget: 740 },
  honeycomb: { windX: 15, windY: 5, density: 1.65, breathPeriod: 10, grainAlpha: 0.037, particleBudget: 750 },
  soapBubble: { windX: 6, windY: 16, density: 1.75, breathPeriod: 13, grainAlpha: 0.028, particleBudget: 800 },
  bathFoam: { windX: 8, windY: 12, density: 1.72, breathPeriod: 12, grainAlpha: 0.03, particleBudget: 790 },
  lavenderSoap: { windX: 10, windY: 10, density: 1.62, breathPeriod: 13, grainAlpha: 0.032, particleBudget: 720 },
  creamSoap: { windX: 9, windY: 11, density: 1.65, breathPeriod: 12, grainAlpha: 0.031, particleBudget: 730 },
  keyboard: { windX: 20, windY: 3, density: 1.45, breathPeriod: 8, grainAlpha: 0.04, particleBudget: 650 },
  bubbleWrap: { windX: 13, windY: 7, density: 1.55, breathPeriod: 9, grainAlpha: 0.034, particleBudget: 700 },
  kinetic: { windX: 22, windY: -4, density: 1.7, breathPeriod: 11, grainAlpha: 0.042, particleBudget: 740 },
  iceSoap: { windX: 20, windY: -8, density: 1.78, breathPeriod: 12, grainAlpha: 0.05, particleBudget: 800 },
  butterSlime: { windX: 8, windY: 12, density: 1.48, breathPeriod: 14, grainAlpha: 0.025, particleBudget: 700 },
  amoeba: { windX: 6, windY: 14, density: 1.72, breathPeriod: 13, grainAlpha: 0.032, particleBudget: 780 },
  moss: { windX: 8, windY: 8, density: 1.58, breathPeriod: 14, grainAlpha: 0.034, particleBudget: 720 },
  grass: { windX: 16, windY: 6, density: 1.62, breathPeriod: 10, grainAlpha: 0.036, particleBudget: 740 },
  cotton: { windX: 10, windY: 10, density: 1.52, breathPeriod: 13, grainAlpha: 0.028, particleBudget: 710 },
  cloud: { windX: 5, windY: 18, density: 1.78, breathPeriod: 14, grainAlpha: 0.024, particleBudget: 820 },
  paper: { windX: 18, windY: 4, density: 1.42, breathPeriod: 11, grainAlpha: 0.03, particleBudget: 660 },
  plasticBottle: { windX: 9, windY: 12, density: 1.68, breathPeriod: 12, grainAlpha: 0.028, particleBudget: 760 },
  velvet: { windX: 7, windY: 9, density: 1.55, breathPeriod: 13, grainAlpha: 0.026, particleBudget: 700 },
  blossom: { windX: 12, windY: 8, density: 1.68, breathPeriod: 10, grainAlpha: 0.034, particleBudget: 760 },
  marimba: { windX: 18, windY: 4, density: 1.48, breathPeriod: 9, grainAlpha: 0.036, particleBudget: 680 },
  crystal: { windX: 8, windY: 14, density: 1.76, breathPeriod: 12, grainAlpha: 0.032, particleBudget: 790 },
  ceramic: { windX: 10, windY: 7, density: 1.52, breathPeriod: 11, grainAlpha: 0.03, particleBudget: 710 },
  clay: { windX: 20, windY: -2, density: 1.65, breathPeriod: 11, grainAlpha: 0.04, particleBudget: 730 },
  silk: { windX: 6, windY: 11, density: 1.58, breathPeriod: 13, grainAlpha: 0.024, particleBudget: 720 },
  kitten: { windX: 8, windY: 9, density: 1.54, breathPeriod: 12, grainAlpha: 0.028, particleBudget: 710 },
};

function ambientFor(id: MaterialId): AmbientPreset[] {
  const m = MATERIAL_PASTEL[id];
  const p = m.particle;
  const fill = m.fill;

  const foodLike: MaterialId[] = [
    'butter', 'jelly', 'mochi', 'marshmallow', 'chocolate', 'citrus', 'honeycomb', 'whipped',
  ];
  const soapLike: MaterialId[] = [
    'glycerin', 'soapBubble', 'bathFoam', 'lavenderSoap', 'creamSoap', 'iceSoap',
  ];
  const frostLike: MaterialId[] = ['iceSoap'];
  const ethereal: MaterialId[] = ['butterSlime', 'cloud', 'cotton'];
  const natureLike: MaterialId[] = ['amoeba', 'moss', 'grass', 'blossom'];

  if (ethereal.includes(id)) {
    return [
      { type: 'lightOrb', weight: 0.35, color: PASTEL.butter },
      { type: 'sparkleIdle', weight: 0.28, color: PASTEL.white },
      { type: 'emberSoft', weight: 0.2, color: PASTEL.peach },
      { type: 'petal', weight: 0.17, color: fill },
    ];
  }
  if (natureLike.includes(id)) {
    return [
      { type: 'pollen', weight: 0.3, color: p },
      { type: 'petal', weight: 0.26, color: fill },
      { type: 'sparkleIdle', weight: 0.24, color: PASTEL.white },
      { type: 'sugarDust', weight: 0.2, color: PASTEL.cream },
    ];
  }
  if (frostLike.includes(id)) {
    return [
      { type: 'frost', weight: 0.32, color: PASTEL.powder },
      { type: 'snowMote', weight: 0.38, color: PASTEL.white },
      { type: 'sparkleIdle', weight: 0.22, color: p },
      { type: 'steam', weight: 0.08, color: PASTEL.mist },
    ];
  }
  if (soapLike.includes(id)) {
    return [
      { type: 'bubbleFloat', weight: 0.36, color: p },
      { type: 'foamSpeck', weight: 0.24, color: PASTEL.white },
      { type: 'steam', weight: 0.18, color: PASTEL.mist },
      { type: 'sparkleIdle', weight: 0.14, color: fill },
      { type: 'dripAmbient', weight: 0.08, color: p },
    ];
  }
  if (foodLike.includes(id)) {
    return [
      { type: 'sugarDust', weight: 0.28, color: PASTEL.cream },
      { type: 'sprinkle', weight: 0.22, color: p },
      { type: 'pollen', weight: 0.2, color: PASTEL.butter },
      { type: 'petal', weight: 0.16, color: fill },
      { type: 'sparkleIdle', weight: 0.14, color: PASTEL.white },
    ];
  }
  // kinetic, keyboard, bubbleWrap, sponge, clearSlime
  if (id === 'kinetic') {
    return [
      { type: 'sparkleIdle', weight: 0.3, color: p },
      { type: 'pollen', weight: 0.25, color: PASTEL.sand },
      { type: 'emberSoft', weight: 0.25, color: fill },
      { type: 'sugarDust', weight: 0.2, color: PASTEL.cream },
    ];
  }
  if (id === 'keyboard') {
    return [
      { type: 'sparkleIdle', weight: 0.4, color: PASTEL.mist },
      { type: 'pollen', weight: 0.3, color: fill },
      { type: 'emberSoft', weight: 0.3, color: p },
    ];
  }
  if (id === 'bubbleWrap') {
    return [
      { type: 'bubbleFloat', weight: 0.35, color: p },
      { type: 'sparkleIdle', weight: 0.3, color: PASTEL.white },
      { type: 'foamSpeck', weight: 0.2, color: fill },
      { type: 'sprinkle', weight: 0.15, color: p },
    ];
  }
  if (id === 'clearSlime') {
    return [
      { type: 'bubbleFloat', weight: 0.32, color: p },
      { type: 'sparkleIdle', weight: 0.28, color: fill },
      { type: 'petal', weight: 0.22, color: PASTEL.rose },
      { type: 'foamSpeck', weight: 0.18, color: PASTEL.white },
    ];
  }
  if (id === 'paper') {
    return [
      { type: 'sugarDust', weight: 0.35, color: PASTEL.cream },
      { type: 'pollen', weight: 0.25, color: fill },
      { type: 'sparkleIdle', weight: 0.22, color: PASTEL.white },
      { type: 'emberSoft', weight: 0.18, color: p },
    ];
  }
  if (id === 'plasticBottle') {
    return [
      { type: 'bubbleFloat', weight: 0.38, color: p },
      { type: 'sparkleIdle', weight: 0.28, color: PASTEL.white },
      { type: 'foamSpeck', weight: 0.2, color: fill },
      { type: 'dripAmbient', weight: 0.14, color: p },
    ];
  }
  if (id === 'velvet') {
    return [
      { type: 'petal', weight: 0.32, color: p },
      { type: 'sparkleIdle', weight: 0.28, color: fill },
      { type: 'emberSoft', weight: 0.22, color: PASTEL.rose },
      { type: 'lightOrb', weight: 0.18, color: PASTEL.lilac },
    ];
  }
  if (id === 'marimba') {
    return [
      { type: 'sparkleIdle', weight: 0.35, color: PASTEL.butter },
      { type: 'emberSoft', weight: 0.28, color: p },
      { type: 'pollen', weight: 0.22, color: fill },
      { type: 'lightOrb', weight: 0.15, color: PASTEL.peach },
    ];
  }
  if (id === 'crystal') {
    return [
      { type: 'sparkleIdle', weight: 0.38, color: PASTEL.white },
      { type: 'frost', weight: 0.28, color: p },
      { type: 'lightOrb', weight: 0.2, color: fill },
      { type: 'snowMote', weight: 0.14, color: PASTEL.powder },
    ];
  }
  if (id === 'ceramic') {
    return [
      { type: 'sugarDust', weight: 0.3, color: PASTEL.cream },
      { type: 'pollen', weight: 0.26, color: fill },
      { type: 'sparkleIdle', weight: 0.24, color: p },
      { type: 'emberSoft', weight: 0.2, color: PASTEL.peach },
    ];
  }
  if (id === 'clay') {
    return [
      { type: 'pollen', weight: 0.32, color: PASTEL.sand },
      { type: 'sparkleIdle', weight: 0.28, color: p },
      { type: 'emberSoft', weight: 0.22, color: fill },
      { type: 'sugarDust', weight: 0.18, color: PASTEL.cream },
    ];
  }
  if (id === 'silk') {
    return [
      { type: 'petal', weight: 0.3, color: p },
      { type: 'lightOrb', weight: 0.28, color: PASTEL.lilac },
      { type: 'sparkleIdle', weight: 0.24, color: fill },
      { type: 'emberSoft', weight: 0.18, color: PASTEL.blush },
    ];
  }
  // sponge default
  return [
    { type: 'pollen', weight: 0.3, color: p },
    { type: 'foamSpeck', weight: 0.28, color: PASTEL.white },
    { type: 'sparkleIdle', weight: 0.22, color: fill },
    { type: 'sugarDust', weight: 0.2, color: PASTEL.cream },
  ];
}

export interface ThemedPhaseZone {
  id: MaterialId;
  name: string;
  label: string;
  quote: string;
  minY: number;
  maxY: number;
  palette: ZonePalette;
  ambient: AmbientPreset[];
  windX: number;
  windY: number;
  density: number;
  breathPeriod: number;
  grainAlpha: number;
  blobKinds: BlobKind[];
  scenery: DecorKind[];
  overlay: OverlayKind;
  horizon: HorizonKind;
  particleBudget: number;
}

export function buildThemedZonesForOrder(order: readonly MaterialId[]): ThemedPhaseZone[] {
  return order.map((id, idx) => {
    const w = WIND[id];
    return {
      id,
      name: `Mundo ${MATERIALS[id].name}`,
      label: MATERIALS[id].name,
      quote: PHASE_QUOTES[id],
      minY: idx * PHASE_HEIGHT,
      maxY: (idx + 1) * PHASE_HEIGHT,
      palette: materialPalette(id),
      ambient: ambientFor(id),
      windX: w.windX,
      windY: w.windY,
      density: w.density,
      breathPeriod: w.breathPeriod,
      grainAlpha: w.grainAlpha,
      blobKinds: BLOBS[id],
      scenery: DECOR[id],
      overlay: OVERLAY[id],
      horizon: HORIZON[id],
      particleBudget: w.particleBudget,
    };
  });
}

/** Ordem fixa — só para fallback / ferramentas */
export function buildThemedZones(): ThemedPhaseZone[] {
  return buildThemedZonesForOrder(PHASE_ORDER);
}

/** Material categories for contextual juice / particles. */
export type MaterialMood = 'food' | 'soap' | 'frost' | 'ethereal' | 'tactile';

export function materialMood(id: MaterialId): MaterialMood {
  const food: MaterialId[] = [
    'butter', 'jelly', 'mochi', 'marshmallow', 'chocolate', 'citrus', 'honeycomb', 'whipped',
  ];
  const nature: MaterialId[] = ['amoeba', 'moss', 'grass', 'cotton', 'blossom', 'kitten'];
  const soap: MaterialId[] = [
    'glycerin', 'soapBubble', 'bathFoam', 'lavenderSoap', 'creamSoap', 'sponge',
  ];
  if (id === 'iceSoap') return 'frost';
  if (id === 'butterSlime' || id === 'cloud' || id === 'velvet' || id === 'silk') return 'ethereal';
  if (nature.includes(id)) return 'tactile';
  if (food.includes(id)) return 'food';
  if (soap.includes(id)) return 'soap';
  return 'tactile';
}

/** Easier onboarding in phase 1 — wider ledges, gentler gaps. */
export function phaseDifficultyScale(height: number): number {
  const ch = cyclicHeight(height);
  if (ch < PHASE_HEIGHT * 0.85) return 0.35;
  if (ch < PHASE_HEIGHT * 1.15) return 0.5;
  return Math.min(1, height / 3200);
}
