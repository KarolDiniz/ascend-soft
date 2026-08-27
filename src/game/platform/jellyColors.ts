import { MATERIALS, type MaterialDef, type MaterialId } from '../../audio/materials';
import { materialDetailStroke, rgba } from '../../theme/pastelPalette';
import { isSoapBarMaterial, soapColorPreset } from './soapColors';
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
/** Listras pastel nos marshmallows — rosa/azul e variações */
const MARSHMALLOW_STRIPE_PRESETS = [
  { fill: '#FFF8F5', stripeA: '#F0B8D0', stripeB: '#A8D0F0' },
  { fill: '#FFFAF8', stripeA: '#E8A0C0', stripeB: '#90C0E8' },
  { fill: '#FFF5FA', stripeA: '#F5C8E0', stripeB: '#B0D8F8' },
  { fill: '#F8F5FF', stripeA: '#D8B8E8', stripeB: '#98C8F0' },
  { fill: '#FFF8F2', stripeA: '#F0C0B8', stripeB: '#A8E0D8' },
  { fill: '#FFFAF5', stripeA: '#F8D0A8', stripeB: '#C0D8F0' },
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

function marshmallowPaletteIndex(seed: number): number {
  return Math.abs(Math.floor(seed / 991)) % MARSHMALLOW_STRIPE_PRESETS.length;
}

function marshmallowPreset(seed: number): {
  fill: string;
  stripeA: string;
  stripeB: string;
} {
  const p = MARSHMALLOW_STRIPE_PRESETS[marshmallowPaletteIndex(seed)];
  return { fill: p.fill, stripeA: p.stripeA, stripeB: p.stripeB };
}

/** Material visual da prateleira — gelatinas e marshmallows têm cor própria por instância */
export function resolvePlatformMaterial(material: MaterialId, seed: number): MaterialDef {
  if (material === 'jelly') {
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
  if (material === 'marshmallow') {
    const preset = marshmallowPreset(seed);
    const base = MATERIALS.marshmallow;
    return {
      ...base,
      fill: preset.fill,
      particle: preset.stripeA,
      stroke: preset.stripeB,
      glow: rgba(preset.stripeA, 0.42),
      spriteWash: rgba(preset.fill, 0.28),
    };
  }
  if (isSoapBarMaterial(material)) {
    const preset = soapColorPreset(seed);
    const base = MATERIALS[material];
    return {
      ...base,
      fill: preset.fill,
      stroke: materialDetailStroke(preset.fill),
      particle: preset.particle,
      glow: preset.glow,
      spriteWash: rgba(preset.fill, 0.28),
    };
  }
  return MATERIALS[material];
}

export const JELLY_COLOR_COUNT = JELLY_FILLS.length;
