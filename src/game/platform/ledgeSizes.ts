import type { MaterialId } from '../../audio/materials';

/**
 * Distinct playable sizes — silhouette must read uniquely at a glance.
 * visualDepth drives body height; visualSpread stretches draw width.
 */
export const MATERIAL_LEDGE: Record<
  MaterialId,
  { minW: number; maxW: number; visualDepth: number; visualSpread: number }
> = {
  /** gelatina — média, alta, ondulada */
  jelly: { minW: 86, maxW: 108, visualDepth: 1.45, visualSpread: 1.0 },
  /** manteiga — bem larga e baixa */
  butter: { minW: 124, maxW: 156, visualDepth: 0.78, visualSpread: 1.06 },
  /** queijo — média-larga, furos */
  mochi: { minW: 100, maxW: 128, visualDepth: 1.12, visualSpread: 1.02 },
  /** chocolate — barra segmentada média */
  chocolate: { minW: 92, maxW: 116, visualDepth: 0.95, visualSpread: 0.98 },
  /** cítrico — mais estreita, cunha */
  citrus: { minW: 78, maxW: 100, visualDepth: 1.2, visualSpread: 1.0 },
  /** mel — média com células */
  honeycomb: { minW: 94, maxW: 120, visualDepth: 1.25, visualSpread: 1.0 },
  /** sabonete — barra clássica */
  glycerin: { minW: 80, maxW: 104, visualDepth: 0.88, visualSpread: 0.98 },
  /** espuma — larga e ALTA (picos) */
  whipped: { minW: 100, maxW: 130, visualDepth: 1.75, visualSpread: 1.08 },
  /** areia — bem larga, monte */
  kinetic: { minW: 116, maxW: 150, visualDepth: 1.2, visualSpread: 1.12 },
  /** gelo — estreita e rígida */
  iceSoap: { minW: 64, maxW: 86, visualDepth: 1.05, visualSpread: 0.96 },
  /** chiclete — compacta, irregular */
  clearSlime: { minW: 72, maxW: 96, visualDepth: 0.95, visualSpread: 1.06 },
  /** massa — média-larga, dobras */
  butterSlime: { minW: 98, maxW: 126, visualDepth: 1.15, visualSpread: 1.04 },
};

export function rollLedgeWidth(id: MaterialId, rand: () => number): number {
  const L = MATERIAL_LEDGE[id];
  return L.minW + rand() * (L.maxW - L.minW);
}
