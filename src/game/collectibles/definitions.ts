import { PASTEL } from '../../theme/pastelPalette';

export type CollectibleId =
  | 'sparkle'
  | 'droplet'
  | 'pearl'
  | 'star'
  | 'petal'
  | 'crystal'
  | 'moon'
  | 'sun'
  | 'cloud'
  | 'leaf'
  | 'shell'
  | 'gem';

export interface CollectibleDef {
  id: CollectibleId;
  name: string;
  hint: string;
  primary: string;
  secondary: string;
  accent: string;
}

export const COLLECTIBLE_ORDER: readonly CollectibleId[] = [
  'sparkle',
  'droplet',
  'pearl',
  'star',
  'petal',
  'crystal',
  'moon',
  'sun',
  'cloud',
  'leaf',
  'shell',
  'gem',
] as const;

export const COLLECTIBLES: Record<CollectibleId, CollectibleDef> = {
  sparkle: {
    id: 'sparkle',
    name: 'Brilho',
    hint: 'pisca quando você pousa certo',
    primary: PASTEL.butter,
    secondary: PASTEL.peach,
    accent: PASTEL.white,
  },
  droplet: {
    id: 'droplet',
    name: 'Gota',
    hint: 'gelatinosa e fresca',
    primary: '#9EC8E8',
    secondary: '#C8E4F8',
    accent: PASTEL.white,
  },
  pearl: {
    id: 'pearl',
    name: 'Pérola',
    hint: 'macia como nuvem',
    primary: '#F0E8E0',
    secondary: '#E8D8D0',
    accent: PASTEL.white,
  },
  star: {
    id: 'star',
    name: 'Estrela',
    hint: 'guia os pulos altos',
    primary: PASTEL.coral,
    secondary: PASTEL.butter,
    accent: PASTEL.white,
  },
  petal: {
    id: 'petal',
    name: 'Pétala',
    hint: 'leve como vento',
    primary: '#F0B8C8',
    secondary: '#F8D0D8',
    accent: '#FFE8F0',
  },
  crystal: {
    id: 'crystal',
    name: 'Cristal',
    hint: 'transparente e tilintante',
    primary: '#B8D8F0',
    secondary: '#D0E8F8',
    accent: PASTEL.white,
  },
  moon: {
    id: 'moon',
    name: 'Lua',
    hint: 'brilha nas noites suaves',
    primary: '#D8D0F0',
    secondary: '#E8E0F8',
    accent: PASTEL.white,
  },
  sun: {
    id: 'sun',
    name: 'Sol',
    hint: 'aquece os pousos perfeitos',
    primary: PASTEL.butter,
    secondary: '#F8D878',
    accent: PASTEL.coral,
  },
  cloud: {
    id: 'cloud',
    name: 'Nuvem',
    hint: 'flutua sem peso',
    primary: PASTEL.white,
    secondary: '#E8F0F8',
    accent: '#D0E0F0',
  },
  leaf: {
    id: 'leaf',
    name: 'Folha',
    hint: 'cheiro de grama molhada',
    primary: '#98C898',
    secondary: '#B8E0B8',
    accent: '#D8F0D0',
  },
  shell: {
    id: 'shell',
    name: 'Concha',
    hint: 'eco de mar distante',
    primary: '#F0C8C0',
    secondary: '#F8E0D8',
    accent: PASTEL.white,
  },
  gem: {
    id: 'gem',
    name: 'Gema',
    hint: 'rara e cintilante',
    primary: '#C8A8E8',
    secondary: '#E0C8F8',
    accent: PASTEL.white,
  },
};

/** Deterministic 0..1 from platform seed */
export function collectibleSeed(seed: number, salt: number): number {
  const x = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** ~18% das plataformas acima do chão inicial */
export const COLLECTIBLE_SPAWN_CHANCE = 0.18;
export const COLLECTIBLE_MIN_HEIGHT = 100;

export function rollCollectible(seed: number): CollectibleId | null {
  if (collectibleSeed(seed, 77) > COLLECTIBLE_SPAWN_CHANCE) return null;
  const idx = Math.floor(collectibleSeed(seed, 88) * COLLECTIBLE_ORDER.length);
  return COLLECTIBLE_ORDER[idx]!;
}
