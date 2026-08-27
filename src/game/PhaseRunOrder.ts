import type { MaterialId } from '../audio/materials';
import {
  buildThemedZonesForOrder,
  CYCLE_LENGTH,
  PHASE_COUNT,
  PHASE_HEIGHT,
  PHASE_ORDER,
  type ThemedPhaseZone,
} from './ThemedPhases';

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates com seed — ordem única por run, determinística dentro da partida */
function shufflePhaseOrder(source: readonly MaterialId[], seed: number): MaterialId[] {
  const arr = [...source];
  const rand = mulberry32(seed >>> 0);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

function blendProgress(ch: number, idx: number): number {
  const boundary = (idx + 1) * PHASE_HEIGHT;
  const isLast = idx >= PHASE_COUNT - 1;
  const blendStart = isLast ? boundary - 140 : boundary - 70;
  const blendEnd = isLast ? boundary : boundary + 70;
  if (ch <= blendStart) return 0;
  if (ch >= blendEnd) return 1;
  const t = (ch - blendStart) / (blendEnd - blendStart);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

let activeRun: PhaseRunOrder | null = null;

export function setPhaseRun(run: PhaseRunOrder): void {
  activeRun = run;
}

export function getPhaseRun(): PhaseRunOrder {
  if (!activeRun) {
    activeRun = new PhaseRunOrder(Date.now() >>> 0);
  }
  return activeRun;
}

/** Spawn material for current run order */
export function pickPhaseMaterial(height: number, rand: () => number): MaterialId {
  return getPhaseRun().pickPhaseMaterial(height, rand);
}

export function phaseAt(height: number): MaterialId {
  return getPhaseRun().phaseAt(height);
}

/** Ordem embaralhada das fases temáticas — uma sequência por partida */
export class PhaseRunOrder {
  readonly order: readonly MaterialId[];
  readonly zones: readonly ThemedPhaseZone[];

  constructor(seed: number) {
    this.order = shufflePhaseOrder(PHASE_ORDER, seed);
    this.zones = buildThemedZonesForOrder(this.order);
  }

  starterMaterial(): MaterialId {
    return this.order[0]!;
  }

  cyclicHeight(h: number): number {
    const mod = h % CYCLE_LENGTH;
    return mod < 0 ? mod + CYCLE_LENGTH : mod;
  }

  phaseIndexAt(height: number): number {
    return Math.min(PHASE_COUNT - 1, Math.floor(this.cyclicHeight(height) / PHASE_HEIGHT));
  }

  phaseAt(height: number): MaterialId {
    return this.order[this.phaseIndexAt(height)]!;
  }

  indexOf(id: MaterialId): number {
    const idx = this.order.indexOf(id);
    return idx >= 0 ? idx : 0;
  }

  pickPhaseMaterial(height: number, rand: () => number): MaterialId {
    const ch = this.cyclicHeight(height);
    const idx = this.phaseIndexAt(height);
    const cur = this.order[idx]!;
    const next = this.order[(idx + 1) % PHASE_COUNT]!;
    const t = blendProgress(ch, idx);
    if (t <= 0.02) return cur;
    if (t >= 0.98) return next;
    return rand() < t ? next : cur;
  }
}
