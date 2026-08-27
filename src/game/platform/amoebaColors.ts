import type { MaterialDef } from '../../audio/materials';
import { MATERIALS } from '../../audio/materials';
import { materialDetailStroke, rgba } from '../../theme/pastelPalette';

const AMOEBA_FILLS = [
  '#88D8B0',
  '#98E0C0',
  '#78C8A0',
  '#A0E8C8',
  '#70C098',
  '#B0F0D0',
] as const;

function seeded(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function shiftTone(hex: string, lift: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) + Math.round(lift * 255));
  const g = Math.min(255, ((n >> 8) & 255) + Math.round(lift * 255));
  const b = Math.min(255, (n & 255) + Math.round(lift * 255));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function amoebaColorPreset(seed: number): { fill: string; particle: string; glow: string } {
  const fill = AMOEBA_FILLS[Math.abs(Math.floor(seed / 967)) % AMOEBA_FILLS.length];
  return {
    fill,
    particle: shiftTone(fill, 0.3),
    glow: rgba(fill, 0.45),
  };
}

export function resolveAmoebaMaterial(seed: number): MaterialDef {
  const preset = amoebaColorPreset(seed);
  const base = MATERIALS.amoeba;
  return {
    ...base,
    fill: preset.fill,
    stroke: materialDetailStroke(preset.fill),
    particle: preset.particle,
    glow: preset.glow,
    spriteWash: rgba(preset.fill, 0.28),
  };
}

export function amoebaNucleusColor(seed: number): string {
  return seeded(seed, 44) < 0.5 ? '#F0A8C8' : '#F8E898';
}
