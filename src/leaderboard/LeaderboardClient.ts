import { mapScoreRecord } from './board';
import {
  isSupabaseConfigured,
  LEADERBOARD_MAX_ROWS,
  LEADERBOARD_PAGE_SIZE,
  supabaseAnonKey,
  supabaseUrl,
} from './config';
import { checkDisplayName, namesCollide } from './namePolicy';
import type {
  LeaderboardEntry,
  LeaderboardScope,
  ScoreSubmitPayload,
  SubmitResult,
} from './types';
import { weeklyEligibleStartMs } from './weekBounds';

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
    .sort((a, b) => b.height - a.height || a.display_name.localeCompare(b.display_name))
    .map(mapLocalRow);
}

function localWeeklyRows(rows: LocalScoreRow[]): LocalScoreRow[] {
  const cutoff = weeklyEligibleStartMs();
  return rows.filter((row) => {
    const t = Date.parse(row.created_at);
    return Number.isFinite(t) && t >= cutoff;
  });
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

  async fetchTop(
    playerId: string,
    scope: LeaderboardScope,
  ): Promise<{
    entries: LeaderboardEntry[];
    mode: 'global' | 'local';
    playerRank: number | null;
    playerBest: number;
  }> {
    if (!this.isGlobal()) {
      const rows = loadLocalScores();
      const scoped = scope === 'weekly' ? localWeeklyRows(rows) : rows;
      const entries = localBestPerPlayer(scoped);
      const mine = entries.find((e) => e.playerId === playerId);
      return {
        entries,
        mode: 'local',
        playerRank: mine ? entries.indexOf(mine) + 1 : null,
        playerBest: mine?.height ?? 0,
      };
    }

    const entries =
      scope === 'weekly' ? await this.fetchAllWeekly() : await this.fetchAllGlobal();
    const mine = entries.find((e) => e.playerId === playerId);

    let playerRank = mine ? entries.indexOf(mine) + 1 : null;
    let playerBest = mine?.height ?? 0;

    if (!mine) {
      const rankRes = await this.fetchPlayerRank(playerId, scope);
      playerRank = rankRes.rank;
      playerBest = rankRes.best;
    }

    return { entries, mode: 'global', playerRank, playerBest };
  }

  private async fetchAllGlobal(): Promise<LeaderboardEntry[]> {
    return this.fetchAllFromView('leaderboard_best');
  }

  private async fetchAllWeekly(): Promise<LeaderboardEntry[]> {
    return this.fetchAllFromView('leaderboard_weekly', { optional: true });
  }

  private async fetchAllFromView(
    view: 'leaderboard_best' | 'leaderboard_weekly',
    options?: { optional?: boolean },
  ): Promise<LeaderboardEntry[]> {
    const base = supabaseUrl().replace(/\/$/, '');
    const select =
      'player_id,display_name,height,breaths,collectibles,created_at';
    const entries: LeaderboardEntry[] = [];
    let offset = 0;

    while (offset < LEADERBOARD_MAX_ROWS) {
      const url =
        `${base}/rest/v1/${view}?select=${select}` +
        `&order=height.desc,display_name.asc` +
        `&limit=${LEADERBOARD_PAGE_SIZE}&offset=${offset}`;
      const res = await fetch(url, { headers: supabaseHeaders() });
      if (!res.ok) {
        if (options?.optional) return [];
        throw new Error(`leaderboard fetch ${res.status}`);
      }

      const data = (await res.json()) as Record<string, unknown>[];
      for (const row of data) {
        const entry = mapScoreRecord(row);
        if (entry) entries.push(entry);
      }
      if (data.length < LEADERBOARD_PAGE_SIZE) break;
      offset += LEADERBOARD_PAGE_SIZE;
    }

    return entries;
  }

  private async fetchPlayerRank(
    playerId: string,
    scope: LeaderboardScope,
  ): Promise<{ rank: number | null; best: number }> {
    const view = scope === 'weekly' ? 'leaderboard_weekly' : 'leaderboard_best';
    const base = supabaseUrl().replace(/\/$/, '');

    const mineUrl =
      `${base}/rest/v1/${view}?select=height&player_id=eq.${encodeURIComponent(playerId)}&limit=1`;
    const mineRes = await fetch(mineUrl, { headers: supabaseHeaders() });
    if (!mineRes.ok) return { rank: null, best: 0 };

    const mineData = (await mineRes.json()) as { height: number }[];
    if (!mineData.length) return { rank: null, best: 0 };

    const best = mineData[0]!.height;
    const rank = await this.rankForHeight(best, scope);
    return { rank, best };
  }

  async isNameAvailable(name: string, playerId: string): Promise<'free' | 'taken' | 'unknown'> {
    const local = checkDisplayName(name);
    if (!local.ok) return 'taken';

    if (!this.isGlobal()) {
      const taken = loadLocalScores().some(
        (row) => namesCollide(row.display_name, local.name) && row.player_id !== playerId,
      );
      return taken ? 'taken' : 'free';
    }

    const base = supabaseUrl().replace(/\/$/, '');
    try {
      const rpc = await fetch(`${base}/rest/v1/rpc/name_is_available`, {
        method: 'POST',
        headers: supabaseHeaders(),
        body: JSON.stringify({ p_name: local.name, p_player_id: playerId }),
      });
      if (rpc.ok) {
        const value = await rpc.json();
        if (value === true) return 'free';
        if (value === false) return 'taken';
      }
    } catch {
      /* cai no REST; se ambos falharem → unknown */
    }

    try {
      const url =
        `${base}/rest/v1/scores?select=player_id,display_name` +
        `&display_name=ilike.${encodeURIComponent(local.name)}&limit=40`;
      const res = await fetch(url, { headers: supabaseHeaders() });
      if (!res.ok) return 'unknown';
      const rows = (await res.json()) as { player_id: string; display_name: string }[];
      const taken = rows.some(
        (row) => namesCollide(row.display_name, local.name) && row.player_id !== playerId,
      );
      return taken ? 'taken' : 'free';
    } catch {
      return 'unknown';
    }
  }

  async submit(payload: ScoreSubmitPayload): Promise<SubmitResult> {
    const local = checkDisplayName(payload.displayName);
    if (!local.ok) {
      return {
        ok: false,
        weeklyRank: null,
        globalRank: null,
        mode: this.isGlobal() ? 'global' : 'local',
        error: local.reason === 'blocked' ? 'blocked' : 'invalid',
      };
    }

    if (!this.isGlobal()) {
      const rows = loadLocalScores();
      const taken = rows.some(
        (row) => namesCollide(row.display_name, local.name) && row.player_id !== payload.playerId,
      );
      if (taken) {
        return { ok: false, weeklyRank: null, globalRank: null, mode: 'local', error: 'taken' };
      }
      rows.push({
        player_id: payload.playerId,
        display_name: local.name,
        height: payload.height,
        breaths: payload.breaths,
        collectibles: payload.collectibles,
        created_at: new Date().toISOString(),
      });
      saveLocalScores(rows);
      const weeklyRows = localWeeklyRows(rows);
      return {
        ok: true,
        weeklyRank: localRank(weeklyRows, payload.playerId, payload.height),
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
        display_name: local.name,
        height: payload.height,
        breaths: payload.breaths,
        collectibles: payload.collectibles,
        run_ms: Math.round(payload.runMs),
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      let error: SubmitResult['error'] = 'network';
      if (/name_blocked/i.test(body)) error = 'blocked';
      else if (/name_invalid/i.test(body)) error = 'invalid';
      else if (/name_taken/i.test(body)) error = 'taken';
      else if (/score_implausible|rate_limit_exceeded/i.test(body)) error = 'rejected';
      return { ok: false, weeklyRank: null, globalRank: null, mode: 'global', error };
    }

    const [weeklyRank, globalRank] = await Promise.all([
      this.rankForHeight(payload.height, 'weekly'),
      this.rankForHeight(payload.height, 'global'),
    ]);
    return { ok: true, weeklyRank, globalRank, mode: 'global' };
  }

  async rankForHeight(height: number, scope: LeaderboardScope): Promise<number | null> {
    const base = supabaseUrl().replace(/\/$/, '');
    const rpc = scope === 'weekly' ? 'player_rank_weekly' : 'player_rank';
    const rankRes = await fetch(`${base}/rest/v1/rpc/${rpc}`, {
      method: 'POST',
      headers: supabaseHeaders(),
      body: JSON.stringify({ p_height: height }),
    });
    if (!rankRes.ok) return null;
    const rank = await rankRes.json();
    return typeof rank === 'number' && rank > 0 ? rank : null;
  }
}
