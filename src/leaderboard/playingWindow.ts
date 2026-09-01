import { LEADERBOARD_NEARBY } from './config';
import type { LeaderboardEntry } from './types';

export interface RankedRow {
  rank: number;
  entry: LeaderboardEntry;
  isYou: boolean;
}

function isAhead(other: LeaderboardEntry, me: LeaderboardEntry): boolean {
  if (other.height !== me.height) return other.height > me.height;
  return other.displayName.localeCompare(me.displayName) < 0;
}

function aheadCount(others: LeaderboardEntry[], me: LeaderboardEntry): number {
  let lo = 0;
  let hi = others.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (isAhead(others[mid]!, me)) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Janela da partida: você + 3 imediatamente acima.
 * Se você é o 1º, você + 3 imediatamente abaixo.
 * `others` precisa estar ordenado (altura desc, nome asc) e sem o jogador local.
 */
export function playingWindow(
  others: LeaderboardEntry[],
  me: LeaderboardEntry,
  nearby = LEADERBOARD_NEARBY,
): RankedRow[] {
  const idx = aheadCount(others, me);
  const rank = idx + 1;

  if (rank === 1) {
    const rows: RankedRow[] = [{ rank: 1, entry: me, isYou: true }];
    const below = Math.min(nearby, others.length);
    for (let i = 0; i < below; i++) {
      rows.push({ rank: 2 + i, entry: others[i]!, isYou: false });
    }
    return rows;
  }

  const start = Math.max(0, idx - nearby);
  const rows: RankedRow[] = [];
  for (let i = start; i < idx; i++) {
    rows.push({ rank: i + 1, entry: others[i]!, isYou: false });
  }
  rows.push({ rank, entry: me, isYou: true });
  return rows;
}
