import { consumeCharge, stockOf } from './wallet';
import type { ShopItemId } from './catalog';

export const GEAR = {
  jetFuelS: 9.5,
  jetSpinS: 1.65,
  jetAccel: 2400,
  jetMaxVy: 2700,
  potionS: 60,
  potionJumpMul: 1.36,
  hatS: 60,
  hatFallGravMul: 0.22,
} as const;

export type GearLoadout = Record<ShopItemId, boolean>;

export function emptyGearLoadout(): GearLoadout {
  return { jetpack: false, lightPotion: false, propHat: false };
}

export function loadoutFromPick(id: ShopItemId | null): GearLoadout {
  const load = emptyGearLoadout();
  if (id) load[id] = true;
  return load;
}

/** Garante no máximo 1 flag true. */
export function sanitizeLoadout(loadout: GearLoadout): GearLoadout {
  const order = ['jetpack', 'lightPotion', 'propHat'] as const;
  let keep: ShopItemId | null = null;
  for (const id of order) {
    if (loadout[id]) {
      keep = id;
      break;
    }
  }
  return loadoutFromPick(keep);
}

export function stockLoadout(): GearLoadout {
  return {
    jetpack: stockOf('jetpack') > 0,
    lightPotion: stockOf('lightPotion') > 0,
    propHat: stockOf('propHat') > 0,
  };
}

/** Tem algum item no bolso — abre o seletor antes de subir. */
export function hasGearToPick(): boolean {
  const s = stockLoadout();
  return s.jetpack || s.lightPotion || s.propHat;
}

/** Carga desta subida — 3 flags, sem alocação no loop. */
export class RunGear {
  jetFuel = 0;
  jetMax = GEAR.jetFuelS;
  jetArmed = false;
  jetFiring = false;
  jetSpinT = 0;
  private jetWasFiring = false;
  private jetCharged = false;
  potionReady = false;
  potionT = 0;
  hatReady = false;
  hatT = 0;
  hatWorn = false;

  reset(): void {
    this.jetFuel = 0;
    this.jetArmed = false;
    this.jetFiring = false;
    this.jetSpinT = 0;
    this.jetWasFiring = false;
    this.jetCharged = false;
    this.potionReady = false;
    this.potionT = 0;
    this.hatReady = false;
    this.hatT = 0;
    this.hatWorn = false;
  }

  /** Equipa no máximo 1 item escolhido (e ainda em estoque). */
  equipForRun(loadout: GearLoadout = emptyGearLoadout()): void {
    this.reset();
    const clean = sanitizeLoadout(loadout);
    let picked: ShopItemId | null = null;
    for (const id of ['jetpack', 'lightPotion', 'propHat'] as const) {
      if (clean[id] && stockOf(id) > 0) {
        picked = id;
        break;
      }
    }
    if (!picked) return;
    if (picked === 'jetpack') this.jetFuel = GEAR.jetFuelS;
    else if (picked === 'lightPotion') this.potionReady = true;
    else this.hatReady = true;
  }

  wearHat(): boolean {
    if (!this.hatReady || this.hatWorn) return false;
    if (!consumeCharge('propHat')) {
      this.hatReady = false;
      return false;
    }
    this.hatReady = false;
    this.hatWorn = true;
    this.hatT = GEAR.hatS;
    return true;
  }

  armJet(): void {
    if (this.jetFuel > 0) this.jetArmed = true;
  }

  disarmJet(): void {
    this.jetArmed = false;
    this.jetFiring = false;
    this.jetSpinT = 0;
  }

  /** true na borda de ignição (som uma vez). */
  consumeJetIgnite(): boolean {
    const edge = this.jetFiring && !this.jetWasFiring;
    this.jetWasFiring = this.jetFiring;
    if (edge && !this.jetCharged) {
      this.jetCharged = true;
      if (!consumeCharge('jetpack')) {
        this.jetFuel = 0;
        this.jetArmed = false;
        this.jetFiring = false;
        return false;
      }
    }
    return edge;
  }

  drinkPotion(): boolean {
    if (!this.potionReady || this.potionT > 0) return false;
    if (!consumeCharge('lightPotion')) {
      this.potionReady = false;
      return false;
    }
    this.potionReady = false;
    this.potionT = GEAR.potionS;
    return true;
  }

  get potionActive(): boolean {
    return this.potionT > 0;
  }

  tickTimers(dt: number): { hatExpired: boolean } {
    let hatExpired = false;
    if (this.potionT > 0) {
      this.potionT = Math.max(0, this.potionT - dt);
    }
    if (this.hatWorn) {
      this.hatT = Math.max(0, this.hatT - dt);
      if (this.hatT <= 0) {
        this.hatWorn = false;
        hatExpired = true;
      }
    }
    return { hatExpired };
  }
}
