import { MATERIALS, type MaterialDef, type MaterialId } from '../../audio/materials';
import { materialDetailStroke, rgba } from '../../theme/pastelPalette';

/** Cores distintas de gelatina na fase — verde, rosa, branca, etc. */
const JELLY_FILLS = [
  '#8AD4A8', // verde menta
  '#F0A8C0', // rosa
  '#F8F4EE', // branca / creme
  '#A8E0C0', // verde claro
  '#D8C0F0', // lilás
  '#FFE898', // amarelo suave
  '#A8D8F0', // azul céu
  '#F0C8A8', // pêssego
] as const;

function jellyPaletteIndex(seed: number): number {
  // platforms.length entra no seed (*997) — cicla verde → rosa → branca → …
  return Math.abs(Math.floor(seed / 997)) % JELLY_FILLS.length;
}

function shiftTone(hex: string, lift: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) + Math.round(lift * 255));
  const g = Math.min(255, ((n >> 8) & 255) + Math.round(lift * 255));
  const b = Math.min(255, (n & 255) + Math.round(lift * 255));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function jellyPreset(seed: number): { fill: string; particle: string; glow: string } {
  const fill = JELLY_FILLS[jellyPaletteIndex(seed)];
  return {
    fill,
    particle: shiftTone(fill, 0.35),
    glow: rgba(fill, 0.42),
  };
}

/** Material visual da prateleira — gelatinas têm cor própria por instância */
export function resolvePlatformMaterial(material: MaterialId, seed: number): MaterialDef {
  if (material !== 'jelly') return MATERIALS[material];
  const preset = jellyPreset(seed);
  const base = MATERIALS.jelly;
  return {
    ...base,
    fill: preset.fill,
    stroke: materialDetailStroke(preset.fill),
    particle: preset.particle,
    glow: preset.glow,
    spriteWash: rgba(preset.fill, 0.28),
  };
}

export const JELLY_COLOR_COUNT = JELLY_FILLS.length;
