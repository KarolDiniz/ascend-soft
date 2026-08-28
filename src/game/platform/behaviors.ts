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
  /** Pode oscilar horizontalmente ao spawnar */
  canMove: boolean;
}

const immortal = (
  behavior: PlatformBehavior,
  jumpBoost = 1,
  canMove = false,
): BehaviorDef => ({
  behavior,
  lifetime: Infinity,
  maxLands: Infinity,
  shatterImpact: 99,
  floater: '',
  mortal: false,
  jumpBoost,
  canMove,
});

export const BEHAVIOR_BY_MATERIAL: Record<MaterialId, BehaviorDef> = {
  jelly: immortal('elastic', 1, true),
  /** queijo — bounce leve, flutua devagar */
  mochi: immortal('elastic', 1.06, true),
  marshmallow: immortal('elastic', 1.12, true),
  sponge: immortal('elastic', 1, true),
  butterSlime: immortal('elastic', 1, true),
  keyboard: immortal('elastic'),
  /** chiclete — gruda e ajuda a subir */
  clearSlime: immortal('sticky', 1.32, true),
  amoeba: immortal('elastic', 1.05, true),
  moss: immortal('elastic', 1, true),
  grass: immortal('elastic', 1, true),
  cotton: immortal('elastic', 1.1, true),

  butter: {
    behavior: 'melt',
    lifetime: 1.45,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: 'derreteu!',
    mortal: true,
    jumpBoost: 1,
    canMove: false,
  },
  chocolate: {
    behavior: 'melt',
    lifetime: 1.75,
    maxLands: Infinity,
    shatterImpact: 1.05,
    floater: 'derreteu!',
    mortal: true,
    jumpBoost: 1,
    canMove: false,
  },
  honeycomb: {
    behavior: 'melt',
    lifetime: 1.55,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: 'escorreu!',
    mortal: true,
    jumpBoost: 1,
    canMove: false,
  },
  iceSoap: {
    behavior: 'shatter',
    lifetime: Infinity,
    maxLands: 2,
    shatterImpact: 0.95,
    floater: 'quebra!',
    mortal: true,
    jumpBoost: 1,
    canMove: false,
  },
  glycerin: {
    behavior: 'shatter',
    lifetime: Infinity,
    maxLands: 2,
    shatterImpact: 1.1,
    floater: 'quebra!',
    mortal: true,
    jumpBoost: 1,
    canMove: false,
  },
  lavenderSoap: {
    behavior: 'shatter',
    lifetime: Infinity,
    maxLands: 2,
    shatterImpact: 1.0,
    floater: 'quebra!',
    mortal: true,
    jumpBoost: 1,
    canMove: false,
  },
  creamSoap: {
    behavior: 'shatter',
    lifetime: Infinity,
    maxLands: 2,
    shatterImpact: 1.05,
    floater: 'quebra!',
    mortal: true,
    jumpBoost: 1,
    canMove: false,
  },
  plasticBottle: {
    behavior: 'shatter',
    lifetime: Infinity,
    maxLands: 2,
    shatterImpact: 1.0,
    floater: 'esmagou!',
    mortal: true,
    jumpBoost: 1,
    canMove: false,
  },
  kinetic: {
    behavior: 'crumble',
    lifetime: 1.15,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: 'desmanchou!',
    mortal: true,
    jumpBoost: 1,
    canMove: false,
  },
  whipped: {
    behavior: 'foamPop',
    lifetime: 0.95,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: 'pop!',
    mortal: true,
    jumpBoost: 1,
    canMove: false,
  },
  soapBubble: {
    behavior: 'foamPop',
    lifetime: 0.7,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: 'estourou!',
    mortal: true,
    jumpBoost: 1,
    canMove: false,
  },
  bathFoam: {
    behavior: 'foamPop',
    lifetime: 1.05,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: 'pop!',
    mortal: true,
    jumpBoost: 1,
    canMove: false,
  },
  bubbleWrap: {
    behavior: 'foamPop',
    lifetime: 0.85,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: 'pop!',
    mortal: true,
    jumpBoost: 1,
    canMove: false,
  },
  cloud: {
    behavior: 'foamPop',
    lifetime: 0.75,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: 'dispersou!',
    mortal: true,
    jumpBoost: 1,
    canMove: true,
  },
  paper: {
    behavior: 'crumble',
    lifetime: 1.05,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: 'amassou!',
    mortal: true,
    jumpBoost: 1,
    canMove: false,
  },
  citrus: {
    behavior: 'squeeze',
    lifetime: Infinity,
    maxLands: 2,
    shatterImpact: 99,
    floater: 'espremeu!',
    mortal: true,
    jumpBoost: 1,
    canMove: false,
  },
  velvet: {
    behavior: 'squeeze',
    lifetime: Infinity,
    maxLands: 2,
    shatterImpact: 99,
    floater: 'achatou!',
    mortal: true,
    jumpBoost: 1,
    canMove: false,
  },
  blossom: immortal('elastic', 1.04, true),
  marimba: immortal('elastic', 1.02, true),
  crystal: {
    behavior: 'shatter',
    lifetime: Infinity,
    maxLands: 2,
    shatterImpact: 0.92,
    floater: 'estilhaçou!',
    mortal: true,
    jumpBoost: 1,
    canMove: false,
  },
  ceramic: {
    behavior: 'shatter',
    lifetime: Infinity,
    maxLands: 2,
    shatterImpact: 1.0,
    floater: 'rachou!',
    mortal: true,
    jumpBoost: 1,
    canMove: false,
  },
  clay: {
    behavior: 'crumble',
    lifetime: 1.2,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: 'amassou!',
    mortal: true,
    jumpBoost: 1,
    canMove: false,
  },
  silk: {
    behavior: 'squeeze',
    lifetime: Infinity,
    maxLands: 2,
    shatterImpact: 99,
    floater: 'deslizou!',
    mortal: true,
    jumpBoost: 1.05,
    canMove: false,
  },
  kitten: immortal('elastic', 1.08, true),
  mushroom: immortal('elastic', 1.04, true),
  kalimba: immortal('elastic', 1.02, true),
  xylophone: immortal('elastic', 1.02, true),
  tambourine: immortal('elastic', 1.05, true),
  popcorn: {
    behavior: 'foamPop',
    lifetime: 0.9,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: 'pop!',
    mortal: true,
    jumpBoost: 1,
    canMove: false,
  },
  bamboo: immortal('elastic', 1, true),
  cork: {
    behavior: 'squeeze',
    lifetime: Infinity,
    maxLands: 2,
    shatterImpact: 99,
    floater: 'pop!',
    mortal: true,
    jumpBoost: 1,
    canMove: false,
  },
  seashell: immortal('elastic', 1.03, true),
  macaron: {
    behavior: 'crumble',
    lifetime: 1.1,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: 'esfarela!',
    mortal: true,
    jumpBoost: 1,
    canMove: false,
  },
  boba: immortal('sticky', 1.15, true),
  feather: immortal('elastic', 1.14, true),
  woodBlock: immortal('elastic', 1, true),
};

export function isMortalBehavior(b: PlatformBehavior): boolean {
  return b !== 'elastic' && b !== 'sticky';
}

export function getBehaviorDef(material: MaterialId): BehaviorDef {
  return BEHAVIOR_BY_MATERIAL[material];
}
