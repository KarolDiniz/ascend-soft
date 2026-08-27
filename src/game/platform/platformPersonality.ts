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
  /** Largura/altura únicas por instância */
  widthStretch: number;
  heightStretch: number;
  /** Inclinação lateral da silhueta (-1…1) */
  lean: number;
  /** Marca superficial exclusiva (0–5) */
  surfaceMark: 0 | 1 | 2 | 3 | 4 | 5;
  /** Perfil do topo (0–3) */
  topProfile: 0 | 1 | 2 | 3;
  /** Quantidade de ornamento extra */
  ornamentExtra: number;
}

function seeded(seed: number, i: number): number {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function buildPlatformPersonality(seed: number, material: MaterialId): PlatformPersonality {
  return {
    toneShift: material === 'jelly' ? 0 : (seeded(seed, 2) - 0.5) * 0.32,
    hangStyle: Math.floor(seeded(seed, 1) * 5) as 0 | 1 | 2 | 3 | 4,
    hangCount: 1 + Math.floor(seeded(seed, 3) * 7),
    sparkleMul: 0.75 + seeded(seed, 4) * 1.15,
    debrisMul: 0.85 + seeded(seed, 5) * 0.95,
    dripMul: 0.7 + seeded(seed, 6) * 1.25,
    edgeBias: (seeded(seed, 7) - 0.5) * 2.4,
    wobblePhase: seeded(seed, 8) * Math.PI * 2,
    lipDepth: 0.55 + seeded(seed, 9) * 0.85,
    hangLength: 0.55 + seeded(seed, 10) * 1.05,
    widthStretch: 0.86 + seeded(seed, 11) * 0.28,
    heightStretch: 0.82 + seeded(seed, 12) * 0.32,
    lean: (seeded(seed, 13) - 0.5) * 0.22,
    surfaceMark: Math.floor(seeded(seed, 14) * 6) as 0 | 1 | 2 | 3 | 4 | 5,
    topProfile: Math.floor(seeded(seed, 15) * 4) as 0 | 1 | 2 | 3,
    ornamentExtra: Math.floor(seeded(seed, 16) * 5),
  };
}

export function scaledCount(base: number, mul: number, min = 1): number {
  return Math.max(min, Math.round(base * mul));
}
