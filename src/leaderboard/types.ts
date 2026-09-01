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
  globalRank: number | null;
  mode: 'global' | 'local';
  error?: 'blocked' | 'taken' | 'invalid' | 'network' | 'rejected';
}

export interface LeaderboardSnapshot {
  entries: LeaderboardEntry[];
  mode: 'global' | 'local' | 'loading' | 'offline';
  updatedAt: number;
  playerRank: number | null;
  playerBest: number;
}
