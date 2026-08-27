/**
 * Ascend Soft — Pastel Soft design tokens (single source of truth).
 * Low–medium saturation, cream family, soft highlights. Never neon purple.
 */

export const PASTEL = {
  cream: '#F7F1EA',
  mint: '#C9E4DE',
  seafoam: '#B8D9D0',
  blush: '#F0D5D8',
  rose: '#E8B4BC',
  butter: '#F3E2A8',
  peach: '#F0C9B0',
  sky: '#D2E4F0',
  powder: '#C5D8E8',
  lilac: '#E0D6EA',
  mist: '#E8EEF2',
  ink: '#5A616C',
  inkSoft: '#7A8490',
  coral: '#E8A598',
  white: '#FFFCF8',
  /** Soft caramel — chocolate substitute (never dark brown) */
  caramel: '#E2C4A8',
  caramelDeep: '#D4B090',
  /** Soft citrus — never neon orange */
  citrus: '#F2D4A0',
  citrusSoft: '#F5E0B8',
  honey: '#EBD4A0',
  sand: '#E8D5C4',
  sandSoft: '#F0E4D8',
} as const;

export type PastelKey = keyof typeof PASTEL;

export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** Soft pastel material look — fill/stroke/glow/particle */
export interface PastelMaterialColors {
  fill: string;
  stroke: string;
  glow: string;
  particle: string;
  /** Soft wash over photoreal sprites */
  spriteWash: string;
}

export const MATERIAL_PASTEL: Record<string, PastelMaterialColors> = {
  jelly: {
    fill: '#7EC8B8',
    stroke: '#4A9E8C',
    glow: rgba(PASTEL.seafoam, 0.5),
    particle: '#A8E0D4',
    spriteWash: rgba(PASTEL.mint, 0.28),
  },
  butter: {
    fill: '#FFE08A',
    stroke: '#E0B84A',
    glow: rgba(PASTEL.butter, 0.45),
    particle: '#FFF0B8',
    spriteWash: rgba(PASTEL.butter, 0.32),
  },
  mochi: {
    fill: '#F0B85A',
    stroke: '#C88A28',
    glow: rgba(PASTEL.peach, 0.4),
    particle: '#FFD898',
    spriteWash: rgba(PASTEL.citrus, 0.3),
  },
  chocolate: {
    fill: '#C49A6C',
    stroke: '#8B6540',
    glow: rgba(PASTEL.peach, 0.35),
    particle: '#D4B090',
    spriteWash: rgba(PASTEL.caramel, 0.38),
  },
  citrus: {
    fill: '#FF9E5A',
    stroke: '#E07030',
    glow: rgba(PASTEL.citrusSoft, 0.45),
    particle: '#FFC090',
    spriteWash: rgba(PASTEL.citrusSoft, 0.3),
  },
  honeycomb: {
    fill: '#E8C04A',
    stroke: '#B89020',
    glow: rgba(PASTEL.honey, 0.45),
    particle: '#F5D878',
    spriteWash: rgba(PASTEL.honey, 0.3),
  },
  glycerin: {
    fill: '#F2A8C0',
    stroke: '#D07090',
    glow: rgba(PASTEL.blush, 0.5),
    particle: '#FFE0EC',
    spriteWash: rgba(PASTEL.blush, 0.3),
  },
  whipped: {
    fill: '#FFF8F4',
    stroke: '#E8B4C0',
    glow: rgba(PASTEL.blush, 0.5),
    particle: '#FFFFFF',
    spriteWash: rgba(PASTEL.white, 0.22),
  },
  kinetic: {
    fill: '#D4B898',
    stroke: '#A88868',
    glow: rgba(PASTEL.sand, 0.35),
    particle: '#E8D0B0',
    spriteWash: rgba(PASTEL.sandSoft, 0.34),
  },
  iceSoap: {
    fill: '#B8DCF0',
    stroke: '#70A8C8',
    glow: rgba(PASTEL.mist, 0.55),
    particle: '#E0F4FF',
    spriteWash: rgba(PASTEL.mist, 0.35),
  },
  clearSlime: {
    fill: '#E878A8',
    stroke: '#C04878',
    glow: rgba(PASTEL.rose, 0.5),
    particle: '#F8A8C8',
    spriteWash: rgba(PASTEL.rose, 0.32),
  },
  butterSlime: {
    fill: '#F0B898',
    stroke: '#D08060',
    glow: rgba(PASTEL.peach, 0.4),
    particle: '#FFD0B8',
    spriteWash: rgba(PASTEL.peach, 0.3),
  },
};

export interface BiomePastelPalette {
  top: string;
  mid: string;
  bottom: string;
  accent: string;
  blob: string[];
  scenery: string[];
}

export const BIOME_PASTEL: Record<string, BiomePastelPalette> = {
  garden: {
    top: PASTEL.mint,
    mid: PASTEL.cream,
    bottom: PASTEL.peach,
    accent: PASTEL.butter,
    blob: [rgba(PASTEL.seafoam, 0.34), rgba(PASTEL.butter, 0.3), rgba(PASTEL.blush, 0.26)],
    scenery: [rgba(PASTEL.seafoam, 0.4), rgba(PASTEL.butter, 0.36), rgba(PASTEL.rose, 0.32), rgba(PASTEL.mint, 0.34)],
  },
  bakery: {
    top: PASTEL.blush,
    mid: PASTEL.peach,
    bottom: PASTEL.coral,
    accent: PASTEL.rose,
    blob: [rgba(PASTEL.blush, 0.32), rgba(PASTEL.peach, 0.3), rgba(PASTEL.cream, 0.26)],
    scenery: [rgba(PASTEL.rose, 0.38), rgba(PASTEL.peach, 0.36), rgba(PASTEL.butter, 0.32), rgba(PASTEL.blush, 0.34)],
  },
  spa: {
    top: PASTEL.sky,
    mid: PASTEL.mist,
    bottom: PASTEL.lilac,
    accent: PASTEL.powder,
    blob: [rgba(PASTEL.sky, 0.32), rgba(PASTEL.lilac, 0.28), rgba(PASTEL.mint, 0.26)],
    scenery: [rgba(PASTEL.powder, 0.36), rgba(PASTEL.lilac, 0.32), rgba(PASTEL.sky, 0.34), rgba(PASTEL.seafoam, 0.3)],
  },
  frost: {
    top: PASTEL.powder,
    mid: PASTEL.mist,
    bottom: PASTEL.white,
    accent: PASTEL.sky,
    blob: [rgba(PASTEL.powder, 0.34), rgba(PASTEL.mist, 0.3), rgba(PASTEL.sky, 0.26)],
    scenery: [rgba(PASTEL.sky, 0.38), rgba(PASTEL.mist, 0.34), rgba(PASTEL.powder, 0.32), rgba(PASTEL.white, 0.3)],
  },
  ether: {
    top: PASTEL.cream,
    mid: PASTEL.white,
    bottom: PASTEL.butter,
    accent: PASTEL.honey,
    blob: [rgba(PASTEL.cream, 0.32), rgba(PASTEL.butter, 0.28), rgba(PASTEL.peach, 0.24)],
    scenery: [rgba(PASTEL.honey, 0.36), rgba(PASTEL.butter, 0.32), rgba(PASTEL.peach, 0.3), rgba(PASTEL.cream, 0.28)],
  },
};

/** Ambient particle colors by zone mood */
export const AMBIENT_PASTEL = {
  pollen: PASTEL.butter,
  petal: PASTEL.blush,
  sparkle: PASTEL.white,
  sugar: PASTEL.cream,
  steam: rgba(PASTEL.white, 0.55),
  bubble: PASTEL.sky,
  foam: PASTEL.white,
  frost: PASTEL.powder,
  snow: PASTEL.white,
  orb: PASTEL.butter,
  ember: PASTEL.peach,
  sprinkle: [PASTEL.rose, PASTEL.seafoam, PASTEL.butter, PASTEL.lilac, PASTEL.cream] as const,
  dripBakery: PASTEL.caramel,
  dripSpa: PASTEL.powder,
};

export const UI_PASTEL = {
  bgA: PASTEL.mint,
  bgB: PASTEL.cream,
  bgC: PASTEL.peach,
  ink: PASTEL.ink,
  inkSoft: PASTEL.inkSoft,
  coral: PASTEL.coral,
  amber: PASTEL.honey,
  surface: rgba(PASTEL.white, 0.62),
  btn: PASTEL.ink,
  btnText: PASTEL.cream,
};

export const PLAYER_PASTEL = {
  bodyTop: PASTEL.sky,
  bodyMid: PASTEL.powder,
  bodyBot: '#9BB8C8',
  blush: rgba(PASTEL.coral, 0.35),
  trail: PASTEL.seafoam as string,
  shadow: rgba(PASTEL.inkSoft, 0.12),
};
