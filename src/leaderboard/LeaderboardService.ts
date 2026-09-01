import { LEADERBOARD_REFRESH_MS, MIN_SUBMIT_HEIGHT } from './config';
import { LeaderboardClient } from './LeaderboardClient';
import { checkDisplayName, namesCollide, type NameRejectReason } from './namePolicy';
import { getDisplayName, getPlayerId, saveDisplayName } from './playerIdentity';
import type { LeaderboardSnapshot, ScoreSubmitPayload, SubmitResult } from './types';

type SnapshotListener = (snap: LeaderboardSnapshot) => void;

export class LeaderboardService {
  private client = new LeaderboardClient();
  private snapshot: LeaderboardSnapshot = {
    entries: [],
    mode: 'loading',
    updatedAt: 0,
    playerRank: null,
    playerBest: 0,
  };
  private listeners = new Set<SnapshotListener>();
  private refreshTimer = 0;
  private titleVisible = false;
  private lastSubmitRank: number | null = null;

  isGlobalMode(): boolean {
    return this.client.isGlobal();
  }

  getSnapshot(): LeaderboardSnapshot {
    return this.snapshot;
  }

  getLastSubmitRank(): number | null {
    return this.lastSubmitRank;
  }

  subscribe(fn: SnapshotListener): () => void {
    this.listeners.add(fn);
    fn(this.snapshot);
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn(this.snapshot);
  }

  setDisplayName(raw: string): string {
    const check = checkDisplayName(raw);
    if (!check.ok) return getDisplayName();
    return saveDisplayName(check.name);
  }

  getDisplayName(): string {
    return getDisplayName();
  }

  /** Só valida (ofensa + unicidade). Não grava. */
  async evaluateName(
    raw: string,
  ): Promise<{ ok: true; name: string } | { ok: false; name: string; reason: NameRejectReason }> {
    const local = checkDisplayName(raw);
    if (!local.ok) {
      return { ok: false, name: local.name, reason: local.reason ?? 'too_short' };
    }

    const takenInSnapshot = this.snapshot.entries.some(
      (e) => e.playerId !== getPlayerId() && namesCollide(e.displayName, local.name),
    );
    if (takenInSnapshot) {
      return { ok: false, name: local.name, reason: 'taken' };
    }

    const free = await this.client.isNameAvailable(local.name, getPlayerId());
    if (!free) {
      return { ok: false, name: local.name, reason: 'taken' };
    }

    return { ok: true, name: local.name };
  }

  /** Valida ofensa + unicidade antes de jogar. Só grava o nome se passar. */
  async assertPlayableName(
    raw: string,
  ): Promise<{ ok: true; name: string } | { ok: false; name: string; reason: NameRejectReason }> {
    const result = await this.evaluateName(raw);
    if (result.ok) saveDisplayName(result.name);
    return result;
  }

  getPlayerId(): string {
    return getPlayerId();
  }

  onTitleShow(): void {
    this.titleVisible = true;
    void this.refresh();
    this.startPolling();
  }

  onTitleHide(): void {
    this.titleVisible = false;
    this.stopPolling();
  }

  /** Partida ativa: mantém snapshot em cache, sem polling. */
  onPlayingShow(): void {
    this.titleVisible = false;
    this.stopPolling();
  }

  onPlayingHide(): void {
    this.titleVisible = false;
    this.stopPolling();
  }

  private startPolling(): void {
    this.stopPolling();
    this.refreshTimer = window.setInterval(() => {
      if (this.titleVisible) void this.refresh();
    }, LEADERBOARD_REFRESH_MS);
  }

  private stopPolling(): void {
    window.clearInterval(this.refreshTimer);
    this.refreshTimer = 0;
  }

  async refresh(): Promise<void> {
    const playerId = getPlayerId();
    try {
      const result = await this.client.fetchTop(playerId);
      this.snapshot = {
        entries: result.entries,
        mode: result.mode,
        updatedAt: Date.now(),
        playerRank: result.playerRank,
        playerBest: result.playerBest,
      };
    } catch {
      this.snapshot = {
        ...this.snapshot,
        mode: this.client.isGlobal() ? 'offline' : 'local',
        updatedAt: Date.now(),
      };
    }
    this.emit();
  }

  async submitRun(
    height: number,
    breaths: number,
    collectibles: number,
    runMs: number,
  ): Promise<SubmitResult> {
    if (height < MIN_SUBMIT_HEIGHT) {
      return { ok: false, globalRank: null, mode: this.client.isGlobal() ? 'global' : 'local' };
    }

    const payload: ScoreSubmitPayload = {
      playerId: getPlayerId(),
      displayName: getDisplayName(),
      height,
      breaths,
      collectibles,
      runMs: Math.max(1000, runMs),
    };

    const result = await this.client.submit(payload);
    if (result.ok) {
      this.lastSubmitRank = result.globalRank;
      if (this.titleVisible) void this.refresh();
    }
    return result;
  }
}

export const leaderboardService = new LeaderboardService();
