import type { MaterialId } from '../../audio/materials';

/** Per-shelf identity — same theme, unique feel. */
export interface PlatformPersonality {
  toneShift: number;
  hangStyle: 0 | 1 | 2 | 3 | 4;
  hangCount: number;
  sparkleMul: number;
  debrisMul: number;
  dripMul: number;
  edgeBias: number;
  wobblePhase: number;
  lipDepth: number;
  hangLength: number;
}

function seeded(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const HANG_BY_MOOD: Record<string, (0 | 1 | 2 | 3 | 4)[]> = {
  melt: [0, 0, 2, 0],
  food: [0, 2, 2, 3, 4],
  elastic: [2, 3, 4, 1],
  sticky: [1, 1, 2],
  soap: [3, 3, 4, 0],
  frost: [3, 2, 0],
  tactile: [2, 3, 1],
};

function moodPool(material: MaterialId): (0 | 1 | 2 | 3 | 4)[] {
  if (['butter', 'chocolate', 'honeycomb', 'whipped'].includes(material)) return HANG_BY_MOOD.melt;
  if (['clearSlime', 'butterSlime'].includes(material)) return HANG_BY_MOOD.sticky;
  if (['glycerin', 'soapBubble', 'bathFoam', 'lavenderSoap', 'creamSoap', 'iceSoap'].includes(material))
    return HANG_BY_MOOD.soap;
  if (['jelly', 'mochi', 'marshmallow', 'sponge'].includes(material)) return HANG_BY_MOOD.elastic;
  if (material === 'iceSoap') return HANG_BY_MOOD.frost;
  if (['keyboard', 'bubbleWrap', 'kinetic'].includes(material)) return HANG_BY_MOOD.tactile;
  return HANG_BY_MOOD.food;
}

export function buildPlatformPersonality(seed: number, material: MaterialId): PlatformPersonality {
  const pool = moodPool(material);
  const hangStyle = pool[Math.floor(seeded(seed, 1) * pool.length)] ?? 2;
  return {
    toneShift: (seeded(seed, 2) - 0.5) * 0.28,
    hangStyle,
    hangCount: 2 + Math.floor(seeded(seed, 3) * 5),
    sparkleMul: 0.9 + seeded(seed, 4) * 0.9,
    debrisMul: 0.85 + seeded(seed, 5) * 0.95,
    dripMul: 0.8 + seeded(seed, 6) * 1.1,
    edgeBias: (seeded(seed, 7) - 0.5) * 2,
    wobblePhase: seeded(seed, 8) * Math.PI * 2,
    lipDepth: 0.75 + seeded(seed, 9) * 0.55,
    hangLength: 0.65 + seeded(seed, 10) * 0.9,
  };
}

export function scaledCount(base: number, mul: number, min = 1): number {
  return Math.max(min, Math.round(base * mul));
}
