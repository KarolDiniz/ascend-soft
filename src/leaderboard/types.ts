export type LeaderboardScope = 'weekly' | 'global';

export interface LeaderboardEntry {
  playerId: string;
  displayName: string;
  height: number;
  breaths: number;
  collectibles: number;
  createdAt?: string;
}

export interface ScoreSubmitPayload {
  playerId: string;
  displayName: string;
  height: number;
  breaths: number;
  collectibles: number;
  runMs: number;
}

export interface SubmitResult {
  ok: boolean;
  weeklyRank: number | null;
  globalRank: number | null;
  mode: 'global' | 'local';
  error?: 'blocked' | 'taken' | 'invalid' | 'network' | 'rejected';
}

export interface LeaderboardSnapshot {
  entries: LeaderboardEntry[];
  scope: LeaderboardScope;
  mode: 'global' | 'local' | 'loading' | 'offline';
  updatedAt: number;
  playerRank: number | null;
  playerBest: number;
}
