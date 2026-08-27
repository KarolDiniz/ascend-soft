import type { MaterialId } from '../../audio/materials';

export type PlatformBehavior =
  | 'elastic'
  | 'melt'
  | 'shatter'
  | 'crumble'
  | 'foamPop'
  | 'squeeze';

/** Lifecycle phase for destructive behaviors */
export type BehaviorPhase =
  | 'idle'
  | 'pressed'
  | 'anticipate'
  | 'active' // melting / crumbling / cracking
  | 'payoff' // shatter burst / pop / final drip
  | 'gone';

export interface BehaviorDef {
  behavior: PlatformBehavior;
  /** Seconds of press time until destruction (melt/crumble/foam) */
  lifetime: number;
  /** Lands before shatter/squeeze destroy */
  maxLands: number;
  /** Impact above this triggers instant shatter (chocolate/ice) */
  shatterImpact: number;
  /** Floater label in PT-BR */
  floater: string;
  mortal: boolean;
}

export const BEHAVIOR_BY_MATERIAL: Record<MaterialId, BehaviorDef> = {
  jelly: {
    behavior: 'elastic',
    lifetime: Infinity,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: '',
    mortal: false,
  },
  mochi: {
    behavior: 'elastic',
    lifetime: Infinity,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: '',
    mortal: false,
  },
  butterSlime: {
    behavior: 'elastic',
    lifetime: Infinity,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: '',
    mortal: false,
  },
  butter: {
    behavior: 'melt',
    lifetime: 1.35,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: 'derreteu!',
    mortal: true,
  },
  chocolate: {
    behavior: 'melt',
    lifetime: 1.75,
    maxLands: Infinity,
    shatterImpact: 1.05,
    floater: 'derreteu!',
    mortal: true,
  },
  honeycomb: {
    behavior: 'melt',
    lifetime: 1.55,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: 'escorreu!',
    mortal: true,
  },
  iceSoap: {
    behavior: 'shatter',
    lifetime: Infinity,
    maxLands: 2,
    shatterImpact: 0.95,
    floater: 'quebra!',
    mortal: true,
  },
  glycerin: {
    behavior: 'shatter',
    lifetime: Infinity,
    maxLands: 2,
    shatterImpact: 1.1,
    floater: 'quebra!',
    mortal: true,
  },
  kinetic: {
    behavior: 'crumble',
    lifetime: 1.15,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: 'desmanchou!',
    mortal: true,
  },
  whipped: {
    behavior: 'foamPop',
    lifetime: 0.95,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: 'pop!',
    mortal: true,
  },
  clearSlime: {
    behavior: 'foamPop',
    lifetime: 1.1,
    maxLands: Infinity,
    shatterImpact: 99,
    floater: 'estourou!',
    mortal: true,
  },
  citrus: {
    behavior: 'squeeze',
    lifetime: Infinity,
    maxLands: 2,
    shatterImpact: 99,
    floater: 'espremeu!',
    mortal: true,
  },
};

export function isMortalBehavior(b: PlatformBehavior): boolean {
  return b !== 'elastic';
}

export function getBehaviorDef(material: MaterialId): BehaviorDef {
  return BEHAVIOR_BY_MATERIAL[material];
}
