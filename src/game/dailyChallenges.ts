import { localDayKey } from './returnLoop';
import { addCoins } from './shop/wallet';

export type ChallengeKind = 'height' | 'survive' | 'gnome';

export interface DailyChallengePick {
  id: string;
  kind: ChallengeKind;
  title: string;
  hint: string;
  reward: number;
  goalLabel: string;
  heightGoal?: number;
  surviveMs?: number;
}

const KEY = 'ascend-soft-daily-challenges';
const PICK_COUNT = 3;
const DAILY_KINDS: ChallengeKind[] = ['height', 'survive', 'gnome'];

interface DailyChallengesState {
  dayKey: string;
  picks: DailyChallengePick[];
  done: string[];
  claimed: string[];
}

function hashDay(dayKey: string): number {
  let h = 2166136261;
  for (let i = 0; i < dayKey.length; i++) {
    h ^= dayKey.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

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

function pickIndex(rng: () => number, len: number): number {
  return Math.min(len - 1, Math.floor(rng() * len));
}

function buildHeight(rng: () => number, dayKey: string, slot: number): DailyChallengePick {
  const tiers = [
    { goal: 3000, reward: 6, title: 'subindo bem', label: '3 000' },
    { goal: 5000, reward: 8, title: 'metade do céu', label: '5 000' },
    { goal: 7500, reward: 12, title: 'quase lá em cima', label: '7 500' },
    { goal: 10_000, reward: 16, title: 'alto lá em cima', label: '10 000' },
    { goal: 15_000, reward: 22, title: 'nas nuvens', label: '15 000' },
    { goal: 50_000, reward: 50, title: 'quase no topo', label: '50 000' },
  ];
  const t = tiers[pickIndex(rng, tiers.length)]!;
  return {
    id: `${dayKey}-h${t.goal}-${slot}`,
    kind: 'height',
    title: t.title,
    hint: `alcance ${t.label} de altura numa partida`,
    reward: t.reward,
    goalLabel: t.label,
    heightGoal: t.goal,
  };
}

function buildSurvive(rng: () => number, dayKey: string, slot: number): DailyChallengePick {
  const tiers = [
    { ms: 60_000, reward: 10, label: '1 min', title: 'firme no ar' },
    { ms: 90_000, reward: 15, label: '1 min 30', title: 'sem pressa' },
    { ms: 120_000, reward: 22, label: '2 min', title: 'sem cair' },
    { ms: 180_000, reward: 30, label: '3 min', title: 'longa subida' },
  ];
  const t = tiers[pickIndex(rng, tiers.length)]!;
  return {
    id: `${dayKey}-s${t.ms}-${slot}`,
    kind: 'survive',
    title: t.title,
    hint: `fique ${t.label} vivo sem morrer numa partida`,
    reward: t.reward,
    goalLabel: t.label,
    surviveMs: t.ms,
  };
}

function buildGnome(dayKey: string, slot: number): DailyChallengePick {
  return {
    id: `${dayKey}-gnome-${slot}`,
    kind: 'gnome',
    title: 'empurrão sob controle',
    hint: 'sobreviva ao empurrão do fiscal e pouse em segurança',
    reward: 20,
    goalLabel: '1 empurrão',
  };
}

function buildPick(
  kind: ChallengeKind,
  rng: () => number,
  dayKey: string,
  slot: number,
): DailyChallengePick {
  switch (kind) {
    case 'height':
      return buildHeight(rng, dayKey, slot);
    case 'survive':
      return buildSurvive(rng, dayKey, slot);
    case 'gnome':
      return buildGnome(dayKey, slot);
  }
}

function generateDailyPicks(dayKey: string): DailyChallengePick[] {
  const rng = mulberry32(hashDay(dayKey));
  const kinds = [...DAILY_KINDS];
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j]!, kinds[i]!];
  }
  return kinds.slice(0, PICK_COUNT).map((kind, slot) => buildPick(kind, rng, dayKey, slot));
}

function emptyState(dayKey = localDayKey()): DailyChallengesState {
  return {
    dayKey,
    picks: generateDailyPicks(dayKey),
    done: [],
    claimed: [],
  };
}

function sanitizePicks(raw: unknown, dayKey: string): DailyChallengePick[] {
  if (!Array.isArray(raw) || raw.length === 0) return generateDailyPicks(dayKey);
  const picks: DailyChallengePick[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Partial<DailyChallengePick>;
    if (
      typeof o.id !== 'string' ||
      typeof o.kind !== 'string' ||
      !DAILY_KINDS.includes(o.kind as ChallengeKind) ||
      typeof o.title !== 'string' ||
      typeof o.hint !== 'string' ||
      typeof o.reward !== 'number' ||
      typeof o.goalLabel !== 'string'
    ) {
      continue;
    }
    picks.push({
      id: o.id,
      kind: o.kind as ChallengeKind,
      title: o.title,
      hint: o.hint,
      reward: Math.max(1, Math.floor(o.reward)),
      goalLabel: o.goalLabel,
      heightGoal: o.heightGoal,
      surviveMs: o.surviveMs,
    });
  }
  return picks.length === PICK_COUNT ? picks : generateDailyPicks(dayKey);
}

function sanitizeIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((id): id is string => typeof id === 'string');
}

function sanitize(raw: unknown): DailyChallengesState {
  if (!raw || typeof raw !== 'object') return emptyState();
  const o = raw as Partial<DailyChallengesState>;
  const dayKey = typeof o.dayKey === 'string' ? o.dayKey : localDayKey();
  return {
    dayKey,
    picks: sanitizePicks(o.picks, dayKey),
    done: sanitizeIds(o.done),
    claimed: sanitizeIds(o.claimed),
  };
}

let cache: DailyChallengesState | null = null;

function persist(state: DailyChallengesState): DailyChallengesState {
  cache = state;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
  return state;
}

export function loadDailyChallenges(): DailyChallengesState {
  const today = localDayKey();
  if (cache && cache.dayKey === today) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? sanitize(JSON.parse(raw)) : emptyState(today);
    if (parsed.dayKey !== today) {
      cache = emptyState(today);
      persist(cache);
      return cache;
    }
    cache = parsed;
    return cache;
  } catch {
    cache = emptyState(today);
    persist(cache);
    return cache;
  }
}

export type ChallengeStatus = 'pending' | 'ready' | 'claimed';

export interface ChallengeView {
  pick: DailyChallengePick;
  status: ChallengeStatus;
}

export function getChallengeViews(): ChallengeView[] {
  const s = loadDailyChallenges();
  return s.picks.map((pick) => {
    let status: ChallengeStatus = 'pending';
    if (s.claimed.includes(pick.id)) status = 'claimed';
    else if (s.done.includes(pick.id)) status = 'ready';
    return { pick, status };
  });
}

export function claimableCount(): number {
  const s = loadDailyChallenges();
  return s.picks.filter((p) => s.done.includes(p.id) && !s.claimed.includes(p.id)).length;
}

export function allDailyClaimedToday(): boolean {
  const s = loadDailyChallenges();
  return s.picks.length > 0 && s.picks.every((p) => s.claimed.includes(p.id));
}

function markChallengeDone(id: string): boolean {
  const s = loadDailyChallenges();
  if (s.done.includes(id)) return false;
  if (!s.picks.some((p) => p.id === id)) return false;
  persist({ ...s, done: [...s.done, id] });
  return true;
}

export type ClaimResult = 'ok' | 'not_done' | 'already';

export function claimChallenge(id: string): ClaimResult {
  const s = loadDailyChallenges();
  if (s.claimed.includes(id)) return 'already';
  if (!s.done.includes(id)) return 'not_done';
  const pick = s.picks.find((p) => p.id === id);
  if (!pick) return 'not_done';
  persist({ ...s, claimed: [...s.claimed, id] });
  addCoins(pick.reward);
  return 'ok';
}

export interface RunChallengeSnapshot {
  height: number;
  runMs: number;
  gnomeSurvived: boolean;
}

function isPickComplete(pick: DailyChallengePick, snap: RunChallengeSnapshot): boolean {
  switch (pick.kind) {
    case 'height':
      return snap.height >= (pick.heightGoal ?? 0);
    case 'survive':
      return snap.runMs >= (pick.surviveMs ?? 0);
    case 'gnome':
      return snap.gnomeSurvived;
  }
}

/** Durante a partida — checa metas do dia. */
export function noteRunProgress(snap: RunChallengeSnapshot): boolean {
  const s = loadDailyChallenges();
  let anyNew = false;
  for (const pick of s.picks) {
    if (s.done.includes(pick.id)) continue;
    if (isPickComplete(pick, snap) && markChallengeDone(pick.id)) anyNew = true;
  }
  return anyNew;
}

export function getPickById(id: string): DailyChallengePick | undefined {
  return loadDailyChallenges().picks.find((p) => p.id === id);
}
