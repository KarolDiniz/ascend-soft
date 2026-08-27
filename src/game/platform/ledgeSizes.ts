import type { MaterialId } from '../../audio/materials';

/**
 * Distinct playable sizes — silhouette must read uniquely at a glance.
 * visualDepth drives body height; visualSpread stretches draw width.
 * Sized ~1.4–2.2× the player (30px) so ledges feel compact but landable.
 */
export const MATERIAL_LEDGE: Record<
  MaterialId,
  { minW: number; maxW: number; visualDepth: number; visualSpread: number }
> = {
  /** gelatina — média, alta, ondulada */
  jelly: { minW: 44, maxW: 54, visualDepth: 1.2, visualSpread: 1.0 },
  /** manteiga — mais larga e baixa */
  butter: { minW: 56, maxW: 68, visualDepth: 0.68, visualSpread: 1.04 },
  /** queijo — média */
  mochi: { minW: 48, maxW: 58, visualDepth: 0.95, visualSpread: 1.0 },
  /** chocolate — barra segmentada */
  chocolate: { minW: 46, maxW: 56, visualDepth: 0.82, visualSpread: 0.98 },
  /** cítrico — mais estreita */
  citrus: { minW: 42, maxW: 50, visualDepth: 1.02, visualSpread: 1.0 },
  /** mel — média com células */
  honeycomb: { minW: 46, maxW: 56, visualDepth: 1.05, visualSpread: 1.0 },
  /** sabonete — barra clássica */
  glycerin: { minW: 42, maxW: 52, visualDepth: 0.78, visualSpread: 0.98 },
  /** espuma — um pouco mais alta */
  whipped: { minW: 48, maxW: 60, visualDepth: 1.4, visualSpread: 1.04 },
  /** areia — mais larga, monte */
  kinetic: { minW: 54, maxW: 66, visualDepth: 1.0, visualSpread: 1.08 },
  /** gelo — estreita */
  iceSoap: { minW: 40, maxW: 48, visualDepth: 0.9, visualSpread: 0.96 },
  /** chiclete — compacta */
  clearSlime: { minW: 42, maxW: 50, visualDepth: 0.82, visualSpread: 1.02 },
  /** massa — média */
  butterSlime: { minW: 48, maxW: 58, visualDepth: 0.98, visualSpread: 1.02 },
};

export function rollLedgeWidth(id: MaterialId, rand: () => number): number {
  const L = MATERIAL_LEDGE[id];
  return L.minW + rand() * (L.maxW - L.minW);
}
