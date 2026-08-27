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

export function parseColor(color: string): [number, number, number] {
  if (color.startsWith('#')) {
    const n = parseInt(color.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const m = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) return [+m[1], +m[2], +m[3]];
  return [200, 200, 200];
}

export function hexToRgb(hex: string): [number, number, number] {
  return parseColor(hex);
}

export function rgba(color: string, a: number): string {
  const [r, g, b] = parseColor(color);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/** Tom de detalhe/borda — um pouco mais escuro que o fill, nunca preto ou muito escuro */
export function materialDetailStroke(fill: string, amount = 20): string {
  const [r, g, b] = parseColor(fill);
  const factor = 1 - amount / 255;
  const dr = Math.round(r * factor);
  const dg = Math.round(g * factor);
  const db = Math.round(b * factor);
  const floor = 0.78;
  const rr = Math.max(Math.round(r * floor), dr);
  const rg = Math.max(Math.round(g * floor), dg);
  const rb = Math.max(Math.round(b * floor), db);
  return `#${[rr, rg, rb].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function matColors(
  fill: string,
  glow: string,
  particle: string,
  spriteWash: string,
): PastelMaterialColors {
  return {
    fill,
    stroke: materialDetailStroke(fill),
    glow,
    particle,
    spriteWash,
  };
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
  jelly: matColors(
    '#7EC8B8',
    rgba(PASTEL.seafoam, 0.5),
    '#A8E0D4',
    rgba(PASTEL.mint, 0.28),
  ),
  butter: matColors(
    '#FFE08A',
    rgba(PASTEL.butter, 0.45),
    '#FFF0B8',
    rgba(PASTEL.butter, 0.32),
  ),
  mochi: matColors(
    '#F0B85A',
    rgba(PASTEL.peach, 0.4),
    '#FFD898',
    rgba(PASTEL.citrus, 0.3),
  ),
  chocolate: matColors(
    '#C49A6C',
    rgba(PASTEL.peach, 0.35),
    '#D4B090',
    rgba(PASTEL.caramel, 0.38),
  ),
  citrus: matColors(
    '#FF9E5A',
    rgba(PASTEL.citrusSoft, 0.45),
    '#FFC090',
    rgba(PASTEL.citrusSoft, 0.3),
  ),
  honeycomb: matColors(
    '#E8C04A',
    rgba(PASTEL.honey, 0.45),
    '#F5D878',
    rgba(PASTEL.honey, 0.3),
  ),
  glycerin: matColors(
    '#F2A8C0',
    rgba(PASTEL.blush, 0.5),
    '#FFE0EC',
    rgba(PASTEL.blush, 0.3),
  ),
  whipped: matColors(
    '#FFF8F4',
    rgba(PASTEL.blush, 0.5),
    '#FFFFFF',
    rgba(PASTEL.white, 0.22),
  ),
  kinetic: matColors(
    '#D4B898',
    rgba(PASTEL.sand, 0.35),
    '#E8D0B0',
    rgba(PASTEL.sandSoft, 0.34),
  ),
  iceSoap: matColors(
    '#B8DCF0',
    rgba(PASTEL.mist, 0.55),
    '#E0F4FF',
    rgba(PASTEL.mist, 0.35),
  ),
  clearSlime: matColors(
    '#E878A8',
    rgba(PASTEL.rose, 0.5),
    '#F8A8C8',
    rgba(PASTEL.rose, 0.32),
  ),
  butterSlime: matColors(
    '#F0B898',
    rgba(PASTEL.peach, 0.4),
    '#FFD0B8',
    rgba(PASTEL.peach, 0.3),
  ),
  marshmallow: matColors(
    '#FFF5F0',
    rgba(PASTEL.blush, 0.45),
    '#FFFFFF',
    rgba(PASTEL.white, 0.28),
  ),
  sponge: matColors(
    '#F2C878',
    rgba(PASTEL.butter, 0.4),
    '#FFE8A8',
    rgba(PASTEL.butter, 0.3),
  ),
  soapBubble: matColors(
    '#C8E8F8',
    rgba(PASTEL.sky, 0.55),
    '#E8F8FF',
    rgba(PASTEL.sky, 0.28),
  ),
  bathFoam: matColors(
    '#F8F0F8',
    rgba(PASTEL.lilac, 0.5),
    '#FFFFFF',
    rgba(PASTEL.lilac, 0.26),
  ),
  lavenderSoap: matColors(
    '#D0B8E8',
    rgba(PASTEL.lilac, 0.55),
    '#F0E0FF',
    rgba(PASTEL.lilac, 0.32),
  ),
  creamSoap: matColors(
    '#F8E8D0',
    rgba(PASTEL.cream, 0.5),
    '#FFF8EC',
    rgba(PASTEL.cream, 0.3),
  ),
  keyboard: matColors(
    '#D8DEE8',
    rgba(PASTEL.mist, 0.4),
    '#F0F4F8',
    rgba(PASTEL.mist, 0.28),
  ),
  bubbleWrap: matColors(
    '#E0F0F0',
    rgba(PASTEL.seafoam, 0.45),
    '#F0FFFF',
    rgba(PASTEL.mint, 0.26),
  ),
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
