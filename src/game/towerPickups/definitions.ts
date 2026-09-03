import type { ShopItemId } from '../shop/catalog';

export type TowerPickupKind = ShopItemId;

/** Versão da torre — mesma potência da loja, menos tempo; jato um pouco mais forte que antes. */
export const TOWER_GEAR = {
  jetFuelS: 4.2,
  jetSpinS: 1.15,
  jetAccel: 3100,
  jetMaxVy: 3350,
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
  // Multiplicadores bem distintos — salts próximos (ex.: 71 e 82) não podem
  // correlacionar spawn e tipo (antes todo pickup virava chapéu).
  let x = (Math.imul(seed ^ salt, 0x9e3779b1) >>> 0) ^ (salt * 0x85ebca6b);
  x = Math.imul(x ^ (x >>> 16), 0x7feb352d) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 0x846ca68b) >>> 0;
  return (x >>> 0) / 0xffffffff;
}

function rollKind(platformSeed: number): TowerPickupKind {
  const r = mixSeed(platformSeed, 0xc0ffee);
  // Chapéu e poção iguais; foguete 25%.
  if (r < 0.375) return 'propHat';
  if (r < 0.75) return 'lightPotion';
  return 'jetpack';
}

export function rollTowerPickup(platformSeed: number, force = false): TowerPickupKind | null {
  if (!force && mixSeed(platformSeed, 0xa11ce) > TOWER_PICKUP_CHANCE) return null;
  return rollKind(platformSeed);
}
