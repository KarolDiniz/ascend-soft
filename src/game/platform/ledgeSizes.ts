import type { MaterialId } from '../../audio/materials';

/** Playable width clamp — player is 30px wide; min stays landable, max fits world margins. */
export const LEDGE_WIDTH_ABS = { min: 36, max: 90 } as const;

/** Weighted size tiers — some ledges clearly smaller or larger than the material baseline. */
const SIZE_TIERS = [
  { weight: 0.3, mulMin: 0.7, mulMax: 0.84 },
  { weight: 0.4, mulMin: 0.94, mulMax: 1.06 },
  { weight: 0.3, mulMin: 1.14, mulMax: 1.34 },
] as const;

function rollSizeTier(rand: () => number): (typeof SIZE_TIERS)[number] {
  let r = rand();
  for (const tier of SIZE_TIERS) {
    r -= tier.weight;
    if (r <= 0) return tier;
  }
  return SIZE_TIERS[1];
}

/**
 * Distinct playable sizes — silhouette must read uniquely at a glance.
 * visualDepth drives body height; visualSpread stretches draw width.
 * Sized ~1.2–3× the player (30px) with tiered small / medium / large rolls.
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
  /** marshmallow — alta e fofa */
  marshmallow: { minW: 44, maxW: 54, visualDepth: 1.25, visualSpread: 1.0 },
  /** esponja — retangular porosa */
  sponge: { minW: 50, maxW: 62, visualDepth: 0.9, visualSpread: 1.04 },
  /** bolha de sabão — redonda */
  soapBubble: { minW: 40, maxW: 50, visualDepth: 1.15, visualSpread: 1.0 },
  /** espuma de banho — nuvem */
  bathFoam: { minW: 52, maxW: 66, visualDepth: 1.2, visualSpread: 1.08 },
  /** sabonete lavanda — barra */
  lavenderSoap: { minW: 42, maxW: 52, visualDepth: 0.78, visualSpread: 0.98 },
  /** sabonete creme — barra oval */
  creamSoap: { minW: 44, maxW: 54, visualDepth: 0.82, visualSpread: 1.0 },
  /** teclado — largo e baixo */
  keyboard: { minW: 58, maxW: 72, visualDepth: 0.62, visualSpread: 1.06 },
  /** plástico bolha — laje com bolhas */
  bubbleWrap: { minW: 52, maxW: 64, visualDepth: 0.72, visualSpread: 1.04 },
  /** ameba — blob baixo e largo */
  amoeba: { minW: 50, maxW: 62, visualDepth: 0.88, visualSpread: 1.1 },
  /** garrafa PET — estreita e alta */
  plasticBottle: { minW: 40, maxW: 50, visualDepth: 1.35, visualSpread: 0.92 },
  /** papel — folha fina */
  paper: { minW: 48, maxW: 60, visualDepth: 0.62, visualSpread: 1.02 },
  /** grama — torf baixo */
  grass: { minW: 52, maxW: 66, visualDepth: 0.78, visualSpread: 1.06 },
  /** algodão — puff alto */
  cotton: { minW: 46, maxW: 58, visualDepth: 1.28, visualSpread: 1.08 },
  /** musgo — monte médio */
  moss: { minW: 50, maxW: 62, visualDepth: 0.95, visualSpread: 1.04 },
  /** nuvem — puff aéreo */
  cloud: { minW: 54, maxW: 68, visualDepth: 1.22, visualSpread: 1.12 },
  /** veludo — placa baixa */
  velvet: { minW: 48, maxW: 58, visualDepth: 0.72, visualSpread: 1.0 },
  /** flores — canteiro largo */
  blossom: { minW: 54, maxW: 68, visualDepth: 0.88, visualSpread: 1.1 },
  /** marimba — larga e baixa */
  marimba: { minW: 58, maxW: 72, visualDepth: 0.64, visualSpread: 1.08 },
  /** cristal — estreita e alta */
  crystal: { minW: 40, maxW: 50, visualDepth: 1.38, visualSpread: 0.96 },
  /** cerâmica — prato médio */
  ceramic: { minW: 46, maxW: 56, visualDepth: 0.8, visualSpread: 1.02 },
  /** argila — monte largo */
  clay: { minW: 52, maxW: 64, visualDepth: 1.02, visualSpread: 1.08 },
  /** seda — placa suave */
  silk: { minW: 48, maxW: 58, visualDepth: 0.7, visualSpread: 1.02 },
};

export function rollLedgeWidth(id: MaterialId, rand: () => number): number {
  const L = MATERIAL_LEDGE[id];
  const base = (L.minW + L.maxW) / 2;
  const tier = rollSizeTier(rand);
  const mul = tier.mulMin + rand() * (tier.mulMax - tier.mulMin);
  const jitter = (rand() - 0.5) * (L.maxW - L.minW) * 0.4;
  const w = base * mul + jitter;
  return Math.round(Math.max(LEDGE_WIDTH_ABS.min, Math.min(LEDGE_WIDTH_ABS.max, w)));
}

/** Typical width band for spawner reach previews before material is picked. */
export function estimateLedgeWidth(rand: () => number): number {
  const tier = rollSizeTier(rand);
  const mul = tier.mulMin + rand() * (tier.mulMax - tier.mulMin);
  const base = 52;
  const w = base * mul + (rand() - 0.5) * 10;
  return Math.round(Math.max(LEDGE_WIDTH_ABS.min, Math.min(LEDGE_WIDTH_ABS.max, w)));
}
