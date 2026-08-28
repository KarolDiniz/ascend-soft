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
  | 'gem'
  | 'feather'
  | 'snowflake'
  | 'berry'
  | 'coin'
  | 'bell'
  | 'heart'
  | 'mushroom'
  | 'acorn'
  | 'comet'
  | 'candy'
  | 'button'
  | 'rainbow'
  | 'honey';

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
  'feather',
  'snowflake',
  'berry',
  'coin',
  'bell',
  'heart',
  'mushroom',
  'acorn',
  'comet',
  'candy',
  'button',
  'rainbow',
  'honey',
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
  feather: {
    id: 'feather',
    name: 'Pena',
    hint: 'levíssima no ar',
    primary: '#E8E0F8',
    secondary: '#F0E8FF',
    accent: PASTEL.white,
  },
  snowflake: {
    id: 'snowflake',
    name: 'Floco',
    hint: 'frio e delicado',
    primary: '#D8EEFF',
    secondary: '#E8F6FF',
    accent: PASTEL.white,
  },
  berry: {
    id: 'berry',
    name: 'Baga',
    hint: 'doce e brilhante',
    primary: '#D87898',
    secondary: '#F0A0B8',
    accent: '#FFE0E8',
  },
  coin: {
    id: 'coin',
    name: 'Moeda',
    hint: 'tilinta ao coletar',
    primary: PASTEL.butter,
    secondary: '#F8D060',
    accent: '#FFF0C0',
  },
  bell: {
    id: 'bell',
    name: 'Sino',
    hint: 'som suave de vitória',
    primary: '#F0D878',
    secondary: '#F8E8A8',
    accent: PASTEL.white,
  },
  heart: {
    id: 'heart',
    name: 'Coração',
    hint: 'aquece a subida',
    primary: '#F0A0A8',
    secondary: '#F8C0C8',
    accent: '#FFE8EC',
  },
  mushroom: {
    id: 'mushroom',
    name: 'Cogumelo',
    hint: 'escondido na sombra',
    primary: '#F0C8B0',
    secondary: '#F8E0D0',
    accent: '#FFFFFF',
  },
  acorn: {
    id: 'acorn',
    name: 'Bolota',
    hint: 'tesouro da floresta',
    primary: '#C8A878',
    secondary: '#E0C8A0',
    accent: '#F0E0C8',
  },
  comet: {
    id: 'comet',
    name: 'Cometa',
    hint: 'rastro de luz rápida',
    primary: '#A8C8F0',
    secondary: '#C8E0F8',
    accent: PASTEL.white,
  },
  candy: {
    id: 'candy',
    name: 'Doce',
    hint: 'açúcar em pixel',
    primary: '#F0A8D0',
    secondary: '#F8C8E8',
    accent: PASTEL.white,
  },
  button: {
    id: 'button',
    name: 'Botão',
    hint: 'costura fofa',
    primary: '#B8D0F0',
    secondary: '#D0E4F8',
    accent: '#F0F8FF',
  },
  rainbow: {
    id: 'rainbow',
    name: 'Arco-íris',
    hint: 'sorte rara nas alturas',
    primary: '#F0B0C8',
    secondary: '#B8E0F0',
    accent: PASTEL.butter,
  },
  honey: {
    id: 'honey',
    name: 'Mel',
    hint: 'dourado e pegajoso',
    primary: '#F0C848',
    secondary: '#F8E080',
    accent: '#FFF8D0',
  },
};

/** Deterministic 0..1 from platform seed */
export function collectibleSeed(seed: number, salt: number): number {
  const x = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/** ~6% das plataformas elegíveis — aparecem com espaçamento, não em toda partida */
export const COLLECTIBLE_SPAWN_CHANCE = 0.06;
/** Só após sair da zona inicial confortável */
export const COLLECTIBLE_MIN_HEIGHT = 160;
/** Mínimo de plataformas entre um colecionável e outro */
export const COLLECTIBLE_MIN_GAP_PLATFORMS = 5;

export function rollCollectible(seed: number): CollectibleId | null {
  if (collectibleSeed(seed, 77) > COLLECTIBLE_SPAWN_CHANCE) return null;
  const idx = Math.floor(collectibleSeed(seed, 88) * COLLECTIBLE_ORDER.length);
  return COLLECTIBLE_ORDER[idx]!;
}
