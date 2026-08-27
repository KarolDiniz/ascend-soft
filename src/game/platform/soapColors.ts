import type { MaterialId } from '../../audio/materials';
import { rgba } from '../../theme/pastelPalette';

/** Sabonetes — cada instância com cor pastel distinta */
const SOAP_PRESETS = [
  { fill: '#F2A8C0', accent: '#FFE0EC' },
  { fill: '#C8B0E8', accent: '#E8D8F8' },
  { fill: '#FFF5E8', accent: '#FFE8D0' },
  { fill: '#98D8B8', accent: '#D0F0E0' },
  { fill: '#98C8F0', accent: '#D0E8FF' },
  { fill: '#F0C0A0', accent: '#FFE0C8' },
  { fill: '#F0E898', accent: '#FFF8C0' },
  { fill: '#E8A0C8', accent: '#F8D0E8' },
  { fill: '#B8E0D0', accent: '#E0F8F0' },
  { fill: '#F8B8C8', accent: '#FFE8F0' },
] as const;

export const SOAP_BAR_MATERIALS: MaterialId[] = ['glycerin', 'lavenderSoap', 'creamSoap'];

export function isSoapBarMaterial(material: MaterialId): boolean {
  return SOAP_BAR_MATERIALS.includes(material);
}

function soapPaletteIndex(seed: number): number {
  return Math.abs(Math.floor(seed / 983)) % SOAP_PRESETS.length;
}

function shiftTone(hex: string, lift: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((n >> 16) & 255) + Math.round(lift * 255));
  const g = Math.min(255, ((n >> 8) & 255) + Math.round(lift * 255));
  const b = Math.min(255, (n & 255) + Math.round(lift * 255));
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function soapColorPreset(seed: number): { fill: string; accent: string; particle: string; glow: string } {
  const p = SOAP_PRESETS[soapPaletteIndex(seed)];
  return {
    fill: p.fill,
    accent: p.accent,
    particle: shiftTone(p.fill, 0.28),
    glow: rgba(p.fill, 0.42),
  };
}

export const SOAP_COLOR_COUNT = SOAP_PRESETS.length;
