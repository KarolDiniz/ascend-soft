import type { ShopItemId } from '../shop/catalog';

export type TowerPickupKind = ShopItemId;

/** Versão da torre — mesma potência da loja, menos tempo. */
export const TOWER_GEAR = {
  jetFuelS: 4.5,
  potionS: 25,
  hatS: 25,
} as const;

export const TOWER_PICKUP_LABEL: Record<TowerPickupKind, string> = {
  jetpack: 'jato curto',
  lightPotion: 'poção curta',
  propHat: 'hélice curta',
};

/** Primeiro pickup só a partir desta altura (m). */
export const TOWER_PICKUP_MIN_HEIGHT = 1_000;
/** Distância mínima vertical entre um pickup e o próximo (m). */
export const TOWER_PICKUP_GAP_Y = 10_000;
/** Após gap + slack, força spawn se o sorteio falhar. */
export const TOWER_PICKUP_GAP_SLACK = 3_000;
/** Chance de spawn quando a plataforma já passou do gap mínimo. */
export const TOWER_PICKUP_CHANCE = 0.38;

function mixSeed(seed: number, salt: number): number {
  return ((seed * 1103515245 + salt * 12345) >>> 0) / 0xffffffff;
}

function rollKind(platformSeed: number): TowerPickupKind {
  const r = mixSeed(platformSeed, 82);
  if (r < 0.42) return 'propHat';
  if (r < 0.84) return 'lightPotion';
  return 'jetpack';
}

export function rollTowerPickup(platformSeed: number, force = false): TowerPickupKind | null {
  if (!force && mixSeed(platformSeed, 71) > TOWER_PICKUP_CHANCE) return null;
  return rollKind(platformSeed);
}
