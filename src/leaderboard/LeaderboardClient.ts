import {
  isSupabaseConfigured,
  LEADERBOARD_TOP_LIMIT,
  supabaseAnonKey,
  supabaseUrl,
} from './config';
import type { LeaderboardEntry, ScoreSubmitPayload, SubmitResult } from './types';

const LOCAL_SCORES_KEY = 'ascend-soft-local-scores';

interface LocalScoreRow {
  player_id: string;
  display_name: string;
  height: number;
  breaths: number;
  collectibles: number;
  created_at: string;
}

function supabaseHeaders(): HeadersInit {
  return {
    apikey: supabaseAnonKey(),
    Authorization: `Bearer ${supabaseAnonKey()}`,
    'Content-Type': 'application/json',
  };
}

function mapLocalRow(row: LocalScoreRow): LeaderboardEntry {
  return {
    playerId: row.player_id,
    displayName: row.display_name,
    height: row.height,
    breaths: row.breaths,
    collectibles: row.collectibles,
    createdAt: row.created_at,
  };
}

function mapRow(row: Record<string, unknown>): LeaderboardEntry {
  return {
    playerId: String(row.player_id ?? ''),
    displayName: String(row.display_name ?? ''),
    height: Number(row.height ?? 0),
    breaths: Number(row.breaths ?? 0),
    collectibles: Number(row.collectibles ?? 0),
    createdAt: row.created_at ? String(row.created_at) : undefined,
  };
}

function loadLocalScores(): LocalScoreRow[] {
  try {
    const raw = localStorage.getItem(LOCAL_SCORES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LocalScoreRow[];
  } catch {
    return [];
  }
}

function saveLocalScores(rows: LocalScoreRow[]): void {
  try {
    localStorage.setItem(LOCAL_SCORES_KEY, JSON.stringify(rows.slice(0, 200)));
  } catch {
    /* ignore */
  }
}

function localBestPerPlayer(rows: LocalScoreRow[]): LeaderboardEntry[] {
  const best = new Map<string, LocalScoreRow>();
  for (const row of rows) {
    const prev = best.get(row.player_id);
    if (!prev || row.height > prev.height) best.set(row.player_id, row);
  }
  return [...best.values()]
    .sort((a, b) => b.height - a.height)
    .slice(0, LEADERBOARD_TOP_LIMIT)
    .map(mapLocalRow);
}

function localRank(rows: LocalScoreRow[], playerId: string, height: number): number {
  const best = localBestPerPlayer(rows);
  const idx = best.findIndex((e) => e.playerId === playerId);
  if (idx >= 0) return idx + 1;
  const above = best.filter((e) => e.height > height).length;
  return above + 1;
}

export class LeaderboardClient {
  isGlobal(): boolean {
    return isSupabaseConfigured();
  }

  async fetchTop(playerId: string): Promise<{
    entries: LeaderboardEntry[];
    mode: 'global' | 'local';
    playerRank: number | null;
    playerBest: number;
  }> {
    if (!this.isGlobal()) {
      const rows = loadLocalScores();
      const entries = localBestPerPlayer(rows);
      const mine = entries.find((e) => e.playerId === playerId);
      return {
        entries,
        mode: 'local',
        playerRank: mine ? entries.indexOf(mine) + 1 : null,
        playerBest: mine?.height ?? 0,
      };
    }

    const base = supabaseUrl().replace(/\/$/, '');
    const url =
      `${base}/rest/v1/leaderboard_best?select=player_id,display_name,height,breaths,collectibles,created_at` +
      `&order=height.desc&limit=${LEADERBOARD_TOP_LIMIT}`;

    const res = await fetch(url, { headers: supabaseHeaders() });
    if (!res.ok) throw new Error(`leaderboard fetch ${res.status}`);

    const data = (await res.json()) as Record<string, unknown>[];
    const entries = data.map(mapRow);
    const mine = entries.find((e) => e.playerId === playerId);

    let playerRank = mine ? entries.indexOf(mine) + 1 : null;
    let playerBest = mine?.height ?? 0;

    if (!mine) {
      const rankRes = await this.fetchGlobalRank(playerId);
      playerRank = rankRes.rank;
      playerBest = rankRes.best;
    }

    return { entries, mode: 'global', playerRank, playerBest };
  }

  private async fetchGlobalRank(
    playerId: string,
  ): Promise<{ rank: number | null; best: number }> {
    const base = supabaseUrl().replace(/\/$/, '');

    const mineUrl =
      `${base}/rest/v1/leaderboard_best?select=height&player_id=eq.${encodeURIComponent(playerId)}&limit=1`;
    const mineRes = await fetch(mineUrl, { headers: supabaseHeaders() });
    if (!mineRes.ok) return { rank: null, best: 0 };

    const mineData = (await mineRes.json()) as { height: number }[];
    if (!mineData.length) return { rank: null, best: 0 };

    const best = mineData[0]!.height;
    const rank = await this.rankForHeight(best);
    return { rank, best };
  }

  async submit(payload: ScoreSubmitPayload): Promise<SubmitResult> {
    if (!this.isGlobal()) {
      const rows = loadLocalScores();
      rows.push({
        player_id: payload.playerId,
        display_name: payload.displayName,
        height: payload.height,
        breaths: payload.breaths,
        collectibles: payload.collectibles,
        created_at: new Date().toISOString(),
      });
      saveLocalScores(rows);
      return {
        ok: true,
        globalRank: localRank(rows, payload.playerId, payload.height),
        mode: 'local',
      };
    }

    const base = supabaseUrl().replace(/\/$/, '');
    const res = await fetch(`${base}/rest/v1/scores`, {
      method: 'POST',
      headers: {
        ...supabaseHeaders(),
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        player_id: payload.playerId,
        display_name: payload.displayName,
        height: payload.height,
        breaths: payload.breaths,
        collectibles: payload.collectibles,
        run_ms: Math.round(payload.runMs),
      }),
    });

    if (!res.ok) {
      return { ok: false, globalRank: null, mode: 'global' };
    }

    const rank = await this.rankForHeight(payload.height);
    return { ok: true, globalRank: rank, mode: 'global' };
  }

  private async rankForHeight(height: number): Promise<number | null> {
    const base = supabaseUrl().replace(/\/$/, '');
    const rankRes = await fetch(`${base}/rest/v1/rpc/player_rank`, {
      method: 'POST',
      headers: supabaseHeaders(),
      body: JSON.stringify({ p_height: height }),
    });
    if (!rankRes.ok) return null;
    const rank = await rankRes.json();
    return typeof rank === 'number' && rank > 0 ? rank : null;
  }
}
