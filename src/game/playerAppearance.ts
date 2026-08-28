import { PASTEL, PLAYER_PASTEL, rgba } from '../theme/pastelPalette';

export const APPEARANCE_KEY = 'ascend-soft-player';

/** Tons pastel suaves — sempre legíveis com olhos escuros, sem confundir com plataformas */
export type BodyColorId = 'sky' | 'mint' | 'blush' | 'butter' | 'lilac' | 'peach' | 'cloud' | 'sea';

export type AccessoryId =
  | 'none'
  | 'bow'
  | 'beanie'
  | 'sunhat'
  | 'sprout'
  | 'crown'
  | 'alienAntenna'
  | 'santaHat'
  | 'catEars'
  | 'mickeyEars'
  | 'marioCap'
  | 'pirateHat'
  | 'bunnyEars';

export interface PlayerAppearance {
  bodyColor: BodyColorId;
  accessory: AccessoryId;
}

export interface PlayerBodyColors {
  bodyTop: string;
  bodyMid: string;
  bodyBot: string;
  bodySolid: string;
  bodyHi: string;
  bodyShade: string;
  trail: string;
}

export interface BodyColorOption {
  id: BodyColorId;
  label: string;
  swatch: string;
}

export interface AccessoryOption {
  id: AccessoryId;
  label: string;
}

export const DEFAULT_APPEARANCE: PlayerAppearance = {
  bodyColor: 'sky',
  accessory: 'none',
};

/** Paletas derivadas do design system — baixa saturação, contraste seguro */
export const BODY_COLOR_PRESETS: Record<BodyColorId, PlayerBodyColors> = {
  sky: {
    bodyTop: PLAYER_PASTEL.bodyTop,
    bodyMid: PLAYER_PASTEL.bodyMid,
    bodyBot: PLAYER_PASTEL.bodyBot,
    bodySolid: PLAYER_PASTEL.bodySolid,
    bodyHi: PLAYER_PASTEL.bodyHi,
    bodyShade: PLAYER_PASTEL.bodyShade,
    trail: PLAYER_PASTEL.trail,
  },
  mint: {
    bodyTop: PASTEL.mint,
    bodyMid: PASTEL.seafoam,
    bodyBot: '#98C4B4',
    bodySolid: PASTEL.seafoam,
    bodyHi: rgba(PASTEL.white, 0.58),
    bodyShade: rgba('#6A9888', 0.34),
    trail: PASTEL.mint,
  },
  blush: {
    bodyTop: PASTEL.blush,
    bodyMid: PASTEL.rose,
    bodyBot: '#D8A4AC',
    bodySolid: PASTEL.rose,
    bodyHi: rgba(PASTEL.white, 0.55),
    bodyShade: rgba('#B88898', 0.32),
    trail: PASTEL.blush,
  },
  butter: {
    bodyTop: PASTEL.butter,
    bodyMid: '#F5E8B8',
    bodyBot: '#D8C888',
    bodySolid: '#F5E8B8',
    bodyHi: rgba(PASTEL.white, 0.62),
    bodyShade: rgba('#C8B070', 0.3),
    trail: PASTEL.butter,
  },
  lilac: {
    bodyTop: PASTEL.lilac,
    bodyMid: '#D8C8E8',
    bodyBot: '#B8A8C8',
    bodySolid: '#D8C8E8',
    bodyHi: rgba(PASTEL.white, 0.58),
    bodyShade: rgba('#9888A8', 0.32),
    trail: PASTEL.lilac,
  },
  peach: {
    bodyTop: PASTEL.peach,
    bodyMid: '#F8D8C0',
    bodyBot: '#D8B098',
    bodySolid: '#F8D8C0',
    bodyHi: rgba(PASTEL.white, 0.58),
    bodyShade: rgba('#B89878', 0.32),
    trail: PASTEL.peach,
  },
  cloud: {
    bodyTop: PASTEL.white,
    bodyMid: PASTEL.cream,
    bodyBot: '#E8E0D8',
    bodySolid: PASTEL.cream,
    bodyHi: rgba(PASTEL.white, 0.72),
    bodyShade: rgba('#B8B0A8', 0.28),
    trail: PASTEL.mist,
  },
  sea: {
    bodyTop: PASTEL.seafoam,
    bodyMid: '#B0D8C8',
    bodyBot: '#88B8A8',
    bodySolid: '#B0D8C8',
    bodyHi: rgba(PASTEL.white, 0.58),
    bodyShade: rgba('#689888', 0.34),
    trail: PASTEL.seafoam,
  },
};

export const BODY_COLOR_OPTIONS: BodyColorOption[] = [
  { id: 'sky', label: 'Céu', swatch: PLAYER_PASTEL.bodyMid },
  { id: 'mint', label: 'Menta', swatch: PASTEL.mint },
  { id: 'blush', label: 'Blush', swatch: PASTEL.blush },
  { id: 'butter', label: 'Mel', swatch: PASTEL.butter },
  { id: 'lilac', label: 'Lavanda', swatch: PASTEL.lilac },
  { id: 'peach', label: 'Pêssego', swatch: PASTEL.peach },
  { id: 'cloud', label: 'Nuvem', swatch: PASTEL.cream },
  { id: 'sea', label: 'Mar', swatch: PASTEL.seafoam },
];

export const ACCESSORY_OPTIONS: AccessoryOption[] = [
  { id: 'none', label: 'Nenhum' },
  { id: 'bow', label: 'Laço' },
  { id: 'beanie', label: 'Touca' },
  { id: 'sunhat', label: 'Chapéu de palha' },
  { id: 'sprout', label: 'Brotinho' },
  { id: 'crown', label: 'Coroa' },
  { id: 'alienAntenna', label: 'Antenas alien' },
  { id: 'santaHat', label: 'Touca Natal' },
  { id: 'catEars', label: 'Orelhas gato' },
  { id: 'bunnyEars', label: 'Orelhas de coelho' },
  { id: 'mickeyEars', label: 'Orelhas Mickey' },
  { id: 'marioCap', label: 'Boné Mario' },
  { id: 'pirateHat', label: 'Chapéu pirata' },
];

let cachedAppearance: PlayerAppearance = { ...DEFAULT_APPEARANCE };

export function resolveBodyColors(app: PlayerAppearance): PlayerBodyColors {
  return BODY_COLOR_PRESETS[app.bodyColor] ?? BODY_COLOR_PRESETS.sky;
}

export function getPlayerAppearance(): PlayerAppearance {
  return cachedAppearance;
}

export function loadPlayerAppearance(): PlayerAppearance {
  try {
    const raw = localStorage.getItem(APPEARANCE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PlayerAppearance>;
      cachedAppearance = sanitizeAppearance(parsed);
      return cachedAppearance;
    }
  } catch {
    /* ignore */
  }
  cachedAppearance = { ...DEFAULT_APPEARANCE };
  return cachedAppearance;
}

export function savePlayerAppearance(app: PlayerAppearance): void {
  cachedAppearance = sanitizeAppearance(app);
  try {
    localStorage.setItem(APPEARANCE_KEY, JSON.stringify(cachedAppearance));
  } catch {
    /* ignore */
  }
}

function sanitizeAppearance(p: Partial<PlayerAppearance>): PlayerAppearance {
  const bodyColor = BODY_COLOR_OPTIONS.some((o) => o.id === p.bodyColor)
    ? p.bodyColor!
    : DEFAULT_APPEARANCE.bodyColor;
  const rawAccessory =
    (p.accessory as string) === 'star'
      ? 'crown'
      : (p.accessory as string) === 'headphones'
        ? 'none'
        : p.accessory;
  const accessory = ACCESSORY_OPTIONS.some((o) => o.id === rawAccessory)
    ? rawAccessory!
    : DEFAULT_APPEARANCE.accessory;
  return { bodyColor, accessory };
}

// Inicializa cache na importação
loadPlayerAppearance();
