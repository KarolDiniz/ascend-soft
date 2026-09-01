import { MATERIALS, type MaterialId } from '../audio/materials';
import { collectedCount, loadCollected, totalCollectibles } from './collectibles/storage';
import { getBehaviorDef } from './platform/behaviors';
import { loadSeenMaterials, totalTextures } from './seenMaterials';
import { PHASE_ORDER } from './ThemedPhases';

const RETURN_KEY = 'ascend-soft-return';

export interface ReturnState {
  lastPlayDay: string;
  streak: number;
  bestPerfect: number;
}

function emptyState(): ReturnState {
  return { lastPlayDay: '', streak: 0, bestPerfect: 0 };
}

export function localDayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function shiftDay(key: string, delta: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y!, (m ?? 1) - 1, d ?? 1);
  dt.setDate(dt.getDate() + delta);
  return localDayKey(dt);
}

function dateIndex(d: Date): number {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000);
}

export function loadReturnState(): ReturnState {
  try {
    const raw = localStorage.getItem(RETURN_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<ReturnState>;
    return {
      lastPlayDay: typeof parsed.lastPlayDay === 'string' ? parsed.lastPlayDay : '',
      streak: Math.max(0, Math.floor(Number(parsed.streak) || 0)),
      bestPerfect: Math.max(0, Math.floor(Number(parsed.bestPerfect) || 0)),
    };
  } catch {
    return emptyState();
  }
}

function saveReturnState(state: ReturnState): void {
  try {
    localStorage.setItem(RETURN_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

/** Conta um dia de jogo — sequência só cresce em dias locais consecutivos. */
export function noteDailyPlay(): ReturnState {
  const today = localDayKey();
  const state = loadReturnState();
  if (state.lastPlayDay === today) return state;
  state.streak = state.lastPlayDay === shiftDay(today, -1) ? state.streak + 1 : 1;
  state.lastPlayDay = today;
  saveReturnState(state);
  return state;
}

/** Persiste o melhor combo perfeito. Retorna true se bateu o recorde pessoal. */
export function noteBestPerfect(n: number): boolean {
  if (n < 2) return false;
  const state = loadReturnState();
  if (n <= state.bestPerfect) return false;
  state.bestPerfect = n;
  saveReturnState(state);
  return true;
}

let immortalPool: MaterialId[] | null = null;

function immortalOpeners(): MaterialId[] {
  if (!immortalPool) {
    immortalPool = PHASE_ORDER.filter((id) => !getBehaviorDef(id).mortal);
  }
  return immortalPool.length > 0 ? immortalPool : ['jelly'];
}

export function featuredOpenerFor(d: Date): MaterialId {
  const pool = immortalOpeners();
  const i = (Math.imul(dateIndex(d), 2654435761) >>> 0) % pool.length;
  return pool[i]!;
}

export function todaysOpener(): MaterialId {
  return featuredOpenerFor(new Date());
}

export function tomorrowsOpener(): MaterialId {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return featuredOpenerFor(d);
}

export function titleReturnLine(seenCount: number): string {
  const bits: string[] = [];
  const state = loadReturnState();
  const openerName = MATERIALS[todaysOpener()].name;
  const col = collectedCount(loadCollected());
  const lootTotal = totalCollectibles();
  const texTotal = totalTextures();

  if (state.streak >= 2) bits.push(`${state.streak} dias seguidos`);
  bits.push(`hoje: ${openerName}`);

  if (seenCount < texTotal && seenCount > 0) bits.push(`${seenCount}/${texTotal} texturas`);
  else if (col >= lootTotal && lootTotal > 0 && seenCount >= texTotal) bits.push('álbum completo');
  else if (col > 0) bits.push(`${col}/${lootTotal} tesouros`);
  else if (state.bestPerfect >= 5) bits.push(`combo ${state.bestPerfect}×`);

  return bits.join(' · ');
}

export function fallReturnHook(input: {
  newFindNames: readonly string[];
  newHeardNames: readonly string[];
  runBestPerfect: number;
  perfectRecord: boolean;
}): string {
  const col = collectedCount(loadCollected());
  const lootTotal = totalCollectibles();
  const lootRemain = lootTotal - col;
  const seen = loadSeenMaterials();
  const heard = seen.size;
  const texTotal = totalTextures();
  const texRemain = texTotal - heard;
  const tomorrow = MATERIALS[tomorrowsOpener()].name;
  const state = loadReturnState();
  const names = input.newFindNames;
  const heardNames = input.newHeardNames;

  if (names.length === 1) return `novo: ${names[0]} · ${col}/${lootTotal} tesouros`;
  if (names.length > 1) return `${names.length} tesouros novos · ${col}/${lootTotal}`;
  if (heardNames.length === 1) return `nova textura: ${heardNames[0]} · ${heard}/${texTotal}`;
  if (heardNames.length > 1) return `${heardNames.length} texturas novas · ${heard}/${texTotal}`;
  if (input.perfectRecord && input.runBestPerfect >= 3) {
    return `combo ${input.runBestPerfect}× — teu melhor pouso`;
  }
  if (heard >= texTotal && col >= lootTotal && lootTotal > 0) {
    return `álbum completo · amanhã: ${tomorrow}`;
  }
  if (texRemain > 0 && texRemain <= 5 && heard > 0) {
    return texRemain === 1
      ? `falta 1 textura no álbum`
      : `faltam ${texRemain} texturas no álbum`;
  }
  if (lootRemain > 0 && lootRemain <= 5 && col > 0) {
    return lootRemain === 1
      ? `falta 1 tesouro no catálogo`
      : `faltam ${lootRemain} tesouros no catálogo`;
  }
  if (state.streak >= 2) return `${state.streak} dias seguidos · amanhã: ${tomorrow}`;
  return `amanhã a torre começa em ${tomorrow}`;
}
