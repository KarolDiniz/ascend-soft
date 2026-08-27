import type { MaterialId } from '../../audio/materials';

export type PlatformBehavior =
  | 'elastic'
  | 'melt'
  | 'shatter'
  | 'crumble'
  | 'foamPop'
  | 'squeeze'
  | 'sticky';

export type BehaviorPhase =
  | 'idle'
  | 'pressed'
  | 'anticipate'
  | 'active'
  | 'payoff'
  | 'gone';

export interface BehaviorDef {
  behavior: PlatformBehavior;
  lifetime: number;
  maxLands: number;
  shatterImpact: number;
  floater: string;
  mortal: boolean;
  /** Extra jump multiplier when leaving this platform (sticky gum) */
  jumpBoost: number;
}

const immortal = (
  behavior: PlatformBehavior,
  jumpBoost = 1,
): BehaviorDef => ({
  behavior,
  lifetime: Infinity,
  maxLands: Infinity,
  shatterImpact: 99,
  floater: '',
  mortal: false,
  jumpBoost,
});

export const BEHAVIOR_BY_MATERIAL: Record<MaterialId, BehaviorDef> = {
  jelly: immortal('elastic'),
  /** queijo — bounce leve */
  mochi: immortal('elastic', 1.06),
  marshmallow: immortal('elastic', 1.12),
  sponge: immortal('elastic'),
  butterSlime: immortal('elastic'),
  keyboard: immortal('elastic'),
  /** chiclete — gruda e ajuda a subir */
  clearSlime: immortal('sticky', 1.32),
  amoeba: immortal('elastic', 1.05),
  moss: immortal('elastic'),
  grass: immortal('elastic'),
  cotton: immortal('elastic', 1.1),

  butter: {
    behavior: 'melt',
    lifetime: 1.45,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: 'derreteu!',
    mortal: true,
    jumpBoost: 1,
  },
  chocolate: {
    behavior: 'melt',
    lifetime: 1.75,
    maxLands: Infinity,
    shatterImpact: 1.05,
    floater: 'derreteu!',
    mortal: true,
    jumpBoost: 1,
  },
  honeycomb: {
    behavior: 'melt',
    lifetime: 1.55,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: 'escorreu!',
    mortal: true,
    jumpBoost: 1,
  },
  iceSoap: {
    behavior: 'shatter',
    lifetime: Infinity,
    maxLands: 2,
    shatterImpact: 0.95,
    floater: 'quebra!',
    mortal: true,
    jumpBoost: 1,
  },
  glycerin: {
    behavior: 'shatter',
    lifetime: Infinity,
    maxLands: 2,
    shatterImpact: 1.1,
    floater: 'quebra!',
    mortal: true,
    jumpBoost: 1,
  },
  lavenderSoap: {
    behavior: 'shatter',
    lifetime: Infinity,
    maxLands: 2,
    shatterImpact: 1.0,
    floater: 'quebra!',
    mortal: true,
    jumpBoost: 1,
  },
  creamSoap: {
    behavior: 'shatter',
    lifetime: Infinity,
    maxLands: 2,
    shatterImpact: 1.05,
    floater: 'quebra!',
    mortal: true,
    jumpBoost: 1,
  },
  plasticBottle: {
    behavior: 'shatter',
    lifetime: Infinity,
    maxLands: 2,
    shatterImpact: 1.0,
    floater: 'esmagou!',
    mortal: true,
    jumpBoost: 1,
  },
  kinetic: {
    behavior: 'crumble',
    lifetime: 1.15,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: 'desmanchou!',
    mortal: true,
    jumpBoost: 1,
  },
  whipped: {
    behavior: 'foamPop',
    lifetime: 0.95,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: 'pop!',
    mortal: true,
    jumpBoost: 1,
  },
  soapBubble: {
    behavior: 'foamPop',
    lifetime: 0.7,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: 'estourou!',
    mortal: true,
    jumpBoost: 1,
  },
  bathFoam: {
    behavior: 'foamPop',
    lifetime: 1.05,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: 'pop!',
    mortal: true,
    jumpBoost: 1,
  },
  bubbleWrap: {
    behavior: 'foamPop',
    lifetime: 0.85,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: 'pop!',
    mortal: true,
    jumpBoost: 1,
  },
  cloud: {
    behavior: 'foamPop',
    lifetime: 0.75,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: 'dispersou!',
    mortal: true,
    jumpBoost: 1,
  },
  paper: {
    behavior: 'crumble',
    lifetime: 1.05,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: 'amassou!',
    mortal: true,
    jumpBoost: 1,
  },
  citrus: {
    behavior: 'squeeze',
    lifetime: Infinity,
    maxLands: 2,
    shatterImpact: 99,
    floater: 'espremeu!',
    mortal: true,
    jumpBoost: 1,
  },
  velvet: {
    behavior: 'squeeze',
    lifetime: Infinity,
    maxLands: 2,
    shatterImpact: 99,
    floater: 'achatou!',
    mortal: true,
    jumpBoost: 1,
  },
};

export function isMortalBehavior(b: PlatformBehavior): boolean {
  return b !== 'elastic' && b !== 'sticky';
}

export function getBehaviorDef(material: MaterialId): BehaviorDef {
  return BEHAVIOR_BY_MATERIAL[material];
}
