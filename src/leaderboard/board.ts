import type { LeaderboardEntry } from './types';

export function mapScoreRecord(row: Record<string, unknown>): LeaderboardEntry | null {
  const playerId = String(row.player_id ?? '').trim();
  const height = Number(row.height);
  if (!playerId || !Number.isFinite(height) || height < 0) return null;
  return {
    playerId,
    displayName: String(row.display_name ?? ''),
    height: Math.floor(height),
    breaths: Number(row.breaths ?? 0) || 0,
    collectibles: Number(row.collectibles ?? 0) || 0,
    createdAt: row.created_at ? String(row.created_at) : undefined,
  };
}

export function sortEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort(
    (a, b) => b.height - a.height || a.displayName.localeCompare(b.displayName),
  );
}

/** Atualiza o melhor de um jogador. Devolve a mesma referência se nada mudou. */
export function upsertBest(
  entries: LeaderboardEntry[],
  incoming: LeaderboardEntry,
): LeaderboardEntry[] {
  const i = entries.findIndex((e) => e.playerId === incoming.playerId);
  if (i < 0) return sortEntries([...entries, incoming]);

  const prev = entries[i]!;
  if (incoming.height < prev.height) return entries;
  if (
    incoming.height === prev.height &&
    incoming.displayName === prev.displayName &&
    incoming.breaths === prev.breaths &&
    incoming.collectibles === prev.collectibles
  ) {
    return entries;
  }

  const next = entries.slice();
  next[i] = { ...prev, ...incoming, height: Math.max(prev.height, incoming.height) };
  return sortEntries(next);
}

export function rankOf(entries: LeaderboardEntry[], playerId: string): number | null {
  const i = entries.findIndex((e) => e.playerId === playerId);
  return i >= 0 ? i + 1 : null;
}
