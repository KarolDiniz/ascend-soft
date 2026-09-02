import { allAchievementIds } from './definitions';

const KEY = 'ascend-soft-achievements';

export interface AchievementStats {
  falls: number;
  fallTimes: number[];
  gnomeHits: number;
  gnomeSurvives: number;
  totalPerfects: number;
  shopPurchases: number;
  shopOpens: number;
  dailyClaims: number;
  rankSubmitted: boolean;
  totalPlayMs: number;
  usedHelicopter: boolean;
  usedPotion: boolean;
}

export interface AchievementState {
  unlocked: string[];
  stats: AchievementStats;
}

function emptyStats(): AchievementStats {
  return {
    falls: 0,
    fallTimes: [],
    gnomeHits: 0,
    gnomeSurvives: 0,
    totalPerfects: 0,
    shopPurchases: 0,
    shopOpens: 0,
    dailyClaims: 0,
    rankSubmitted: false,
    totalPlayMs: 0,
    usedHelicopter: false,
    usedPotion: false,
  };
}

function emptyState(): AchievementState {
  return { unlocked: [], stats: emptyStats() };
}

const validIds = new Set(allAchievementIds());

export function loadAchievementState(): AchievementState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as Partial<AchievementState>;
    const unlocked = Array.isArray(parsed.unlocked)
      ? parsed.unlocked.filter((id): id is string => typeof id === 'string' && validIds.has(id))
      : [];
    const s = (parsed.stats ?? {}) as Partial<AchievementStats>;
    return {
      unlocked,
      stats: {
        falls: Math.max(0, Number(s.falls) || 0),
        fallTimes: Array.isArray(s.fallTimes)
          ? s.fallTimes.filter((t: unknown): t is number => typeof t === 'number').slice(-20)
          : [],
        gnomeHits: Math.max(0, Number(s.gnomeHits) || 0),
        gnomeSurvives: Math.max(0, Number(s.gnomeSurvives) || 0),
        totalPerfects: Math.max(0, Number(s.totalPerfects) || 0),
        shopPurchases: Math.max(0, Number(s.shopPurchases) || 0),
        shopOpens: Math.max(0, Number(s.shopOpens) || 0),
        dailyClaims: Math.max(0, Number(s.dailyClaims) || 0),
        rankSubmitted: Boolean(s.rankSubmitted),
        totalPlayMs: Math.max(0, Number(s.totalPlayMs) || 0),
        usedHelicopter: Boolean(s.usedHelicopter),
        usedPotion: Boolean(s.usedPotion),
      },
    };
  } catch {
    return emptyState();
  }
}

export function saveAchievementState(state: AchievementState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

export function isUnlocked(state: AchievementState, id: string): boolean {
  return state.unlocked.includes(id);
}

/** Retorna true se desbloqueou agora. */
export function unlockAchievement(state: AchievementState, id: string): boolean {
  if (!validIds.has(id) || isUnlocked(state, id)) return false;
  state.unlocked.push(id);
  saveAchievementState(state);
  return true;
}

export function unlockedCount(state: AchievementState): number {
  return state.unlocked.length;
}
