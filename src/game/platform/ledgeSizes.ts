import type { MaterialId } from '../../audio/materials';

/** Playable ledge sizes — distinct silhouettes, still jump-reachable */
export const MATERIAL_LEDGE: Record<
  MaterialId,
  { minW: number; maxW: number; visualDepth: number; visualSpread: number }
> = {
  jelly: { minW: 90, maxW: 114, visualDepth: 1.15, visualSpread: 1.02 },
  butter: { minW: 118, maxW: 148, visualDepth: 0.92, visualSpread: 1.04 },
  /** queijo */
  mochi: { minW: 96, maxW: 122, visualDepth: 1.08, visualSpread: 1.0 },
  chocolate: { minW: 88, maxW: 112, visualDepth: 1.0, visualSpread: 1.0 },
  citrus: { minW: 82, maxW: 106, visualDepth: 1.05, visualSpread: 1.02 },
  honeycomb: { minW: 92, maxW: 118, visualDepth: 1.12, visualSpread: 1.0 },
  /** sabonete */
  glycerin: { minW: 84, maxW: 108, visualDepth: 0.95, visualSpread: 1.0 },
  /** sabonete batido / espuma */
  whipped: { minW: 94, maxW: 124, visualDepth: 1.35, visualSpread: 1.06 },
  kinetic: { minW: 108, maxW: 138, visualDepth: 1.05, visualSpread: 1.08 },
  /** sabonete gelo — estreito */
  iceSoap: { minW: 68, maxW: 90, visualDepth: 0.98, visualSpread: 0.98 },
  /** chiclete */
  clearSlime: { minW: 78, maxW: 102, visualDepth: 1.02, visualSpread: 1.04 },
  butterSlime: { minW: 100, maxW: 128, visualDepth: 1.1, visualSpread: 1.05 },
};

export function rollLedgeWidth(id: MaterialId, rand: () => number): number {
  const L = MATERIAL_LEDGE[id];
  return L.minW + rand() * (L.maxW - L.minW);
}
