import { mapScoreRecord, rankOf, upsertBest } from './board';
import {
  isSupabaseConfigured,
  LEADERBOARD_LIVE_DEBOUNCE_MS,
  LEADERBOARD_REFRESH_MS,
  MAX_SUBMIT_HEIGHT,
  MIN_SUBMIT_HEIGHT,
  scoreLooksPlausible,
} from './config';
import { LeaderboardClient } from './LeaderboardClient';
import { checkDisplayName, namesCollide, type NameRejectReason } from './namePolicy';
import { getDisplayName, getPlayerId, saveDisplayName } from './playerIdentity';
import { getSupabase } from './supabaseClient';
import type {
  LeaderboardEntry,
  LeaderboardScope,
  LeaderboardSnapshot,
  ScoreSubmitPayload,
  SubmitResult,
} from './types';
import { isInCurrentWeekLocal } from './weekBounds';
import type { RealtimeChannel } from '@supabase/supabase-js';

type SnapshotListener = (snap: LeaderboardSnapshot) => void;

export class LeaderboardService {
  private client = new LeaderboardClient();
  private scope: LeaderboardScope = 'weekly';
  private weeklyEntries: LeaderboardEntry[] = [];
  private globalEntries: LeaderboardEntry[] = [];
  private snapshot: LeaderboardSnapshot = {
    entries: [],
    scope: 'weekly',
    mode: 'loading',
    updatedAt: 0,
    playerRank: null,
    playerBest: 0,
  };
  private listeners = new Set<SnapshotListener>();
  private refreshTimer = 0;
  private titleVisible = false;
  private playingVisible = false;
  private lastSubmitRank: number | null = null;
  private refreshSeq = 0;
  private channel: RealtimeChannel | null = null;
  private live = false;
  private pendingLive: LeaderboardEntry[] = [];
  private liveFlushTimer = 0;
  private visibilityBound = false;

  isGlobalMode(): boolean {
    return this.client.isGlobal();
  }

  isLive(): boolean {
    return this.live;
  }

  getScope(): LeaderboardScope {
    return this.scope;
  }

  setScope(scope: LeaderboardScope): void {
    if (this.scope === scope) return;
    this.scope = scope;
    this.rebuildSnapshot();
    this.emit();
    const cached = scope === 'weekly' ? this.weeklyEntries : this.globalEntries;
    if (cached.length === 0 && (this.titleVisible || this.playingVisible)) {
      void this.refresh();
    }
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
    this.bindVisibility();
    return () => this.listeners.delete(fn);
  }

  private emit(): void {
    for (const fn of this.listeners) fn(this.snapshot);
  }

  private rebuildSnapshot(): void {
    const entries = this.scope === 'weekly' ? this.weeklyEntries : this.globalEntries;
    const playerId = getPlayerId();
    const mine = entries.find((e) => e.playerId === playerId);
    this.snapshot = {
      ...this.snapshot,
      scope: this.scope,
      entries,
      playerRank: rankOf(entries, playerId),
      playerBest: mine?.height ?? this.snapshot.playerBest,
    };
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
  ): Promise<
    | { ok: true; name: string; unverified?: boolean }
    | { ok: false; name: string; reason: NameRejectReason }
  > {
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

    const avail = await this.client.isNameAvailable(local.name, getPlayerId());
    if (avail === 'taken') {
      return { ok: false, name: local.name, reason: 'taken' };
    }

    return { ok: true, name: local.name, unverified: avail === 'unknown' };
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
    this.playingVisible = false;
    this.ensureRealtime();
    void this.refresh();
    this.startPolling();
  }

  onTitleHide(): void {
    this.titleVisible = false;
    this.stopPolling();
    if (!this.playingVisible) this.stopRealtime();
  }

  /** Partida ativa: sem polling; ranking vive do snapshot + altura local + realtime. */
  onPlayingShow(): void {
    this.titleVisible = false;
    this.playingVisible = true;
    this.stopPolling();
    this.ensureRealtime();
  }

  onPlayingHide(): void {
    this.playingVisible = false;
    this.stopPolling();
  }

  disconnect(): void {
    this.titleVisible = false;
    this.playingVisible = false;
    this.stopPolling();
    this.stopRealtime();
  }

  private bindVisibility(): void {
    if (this.visibilityBound) return;
    this.visibilityBound = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') {
        this.stopPolling();
        return;
      }
      if (this.titleVisible) {
        void this.refresh();
        this.startPolling();
      }
    });
  }

  private startPolling(): void {
    this.stopPolling();
    this.refreshTimer = window.setInterval(() => {
      if (this.titleVisible && document.visibilityState === 'visible') void this.refresh();
    }, LEADERBOARD_REFRESH_MS);
  }

  private stopPolling(): void {
    window.clearInterval(this.refreshTimer);
    this.refreshTimer = 0;
  }

  private ensureRealtime(): void {
    if (!isSupabaseConfigured() || this.channel) return;
    const supabase = getSupabase();
    if (!supabase) return;

    this.channel = supabase
      .channel('scores-live')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'scores' },
        (payload) => {
          const entry = mapScoreRecord((payload.new ?? {}) as Record<string, unknown>);
          if (entry) this.queueLiveEntry(entry);
        },
      )
      .subscribe((status) => {
        const nextLive = status === 'SUBSCRIBED';
        if (nextLive === this.live) return;
        this.live = nextLive;
        this.emit();
      });
  }

  private stopRealtime(): void {
    window.clearTimeout(this.liveFlushTimer);
    this.liveFlushTimer = 0;
    this.pendingLive.length = 0;
    const channel = this.channel;
    this.channel = null;
    this.live = false;
    if (!channel) return;
    const supabase = getSupabase();
    if (supabase) void supabase.removeChannel(channel);
    else void channel.unsubscribe();
  }

  private queueLiveEntry(entry: LeaderboardEntry): void {
    this.pendingLive.push(entry);
    if (this.liveFlushTimer) return;
    this.liveFlushTimer = window.setTimeout(() => {
      this.liveFlushTimer = 0;
      const batch = this.pendingLive;
      this.pendingLive = [];
      this.applyLiveEntries(batch);
    }, LEADERBOARD_LIVE_DEBOUNCE_MS);
  }

  private applyLiveEntries(batch: LeaderboardEntry[]): void {
    if (batch.length === 0) return;
    let weekly = this.weeklyEntries;
    let global = this.globalEntries;
    let changed = false;

    for (const row of batch) {
      const nextGlobal = upsertBest(global, row);
      if (nextGlobal !== global) {
        global = nextGlobal;
        changed = true;
      }
      if (isInCurrentWeekLocal(row.createdAt)) {
        const nextWeekly = upsertBest(weekly, row);
        if (nextWeekly !== weekly) {
          weekly = nextWeekly;
          changed = true;
        }
      }
    }

    if (!changed) return;

    this.weeklyEntries = weekly;
    this.globalEntries = global;
    this.rebuildSnapshot();
    this.snapshot = {
      ...this.snapshot,
      mode: this.client.isGlobal() ? 'global' : this.snapshot.mode,
      updatedAt: Date.now(),
    };
    this.emit();
  }

  async refresh(): Promise<void> {
    const playerId = getPlayerId();
    const seq = ++this.refreshSeq;

    const [weeklyResult, globalResult] = await Promise.allSettled([
      this.client.fetchTop(playerId, 'weekly'),
      this.client.fetchTop(playerId, 'global'),
    ]);
    if (seq !== this.refreshSeq) return;

    const weeklyOk = weeklyResult.status === 'fulfilled';
    const globalOk = globalResult.status === 'fulfilled';

    if (weeklyOk) {
      let weeklyEntries = weeklyResult.value.entries;
      for (const row of this.weeklyEntries) {
        weeklyEntries = upsertBest(weeklyEntries, row);
      }
      this.weeklyEntries = weeklyEntries;
    }

    if (globalOk) {
      let globalEntries = globalResult.value.entries;
      for (const row of this.globalEntries) {
        globalEntries = upsertBest(globalEntries, row);
      }
      this.globalEntries = globalEntries;
    }

    if (!weeklyOk && !globalOk) {
      this.snapshot = {
        ...this.snapshot,
        mode: this.client.isGlobal() ? 'offline' : 'local',
        updatedAt: Date.now(),
      };
      this.emit();
      return;
    }

    const activeMeta =
      this.scope === 'weekly'
        ? weeklyOk
          ? weeklyResult.value
          : globalOk
            ? globalResult.value
            : null
        : globalOk
          ? globalResult.value
          : weeklyOk
            ? weeklyResult.value
            : null;

    const entries = this.scope === 'weekly' ? this.weeklyEntries : this.globalEntries;
    const mine = entries.find((e) => e.playerId === playerId);

    this.snapshot = {
      entries,
      scope: this.scope,
      mode: activeMeta?.mode ?? (this.client.isGlobal() ? 'global' : 'local'),
      updatedAt: Date.now(),
      playerRank: rankOf(entries, playerId) ?? activeMeta?.playerRank ?? null,
      playerBest: mine?.height ?? activeMeta?.playerBest ?? 0,
    };
    this.emit();
  }

  async submitRun(
    height: number,
    breaths: number,
    collectibles: number,
    runMs: number,
  ): Promise<SubmitResult> {
    if (height < MIN_SUBMIT_HEIGHT || height > MAX_SUBMIT_HEIGHT) {
      return {
        ok: false,
        weeklyRank: null,
        globalRank: null,
        mode: this.client.isGlobal() ? 'global' : 'local',
      };
    }

    const safeMs = Math.max(1000, runMs);
    if (!scoreLooksPlausible(height, breaths, collectibles, safeMs)) {
      return {
        ok: false,
        weeklyRank: null,
        globalRank: null,
        mode: this.client.isGlobal() ? 'global' : 'local',
        error: 'rejected',
      };
    }

    const payload: ScoreSubmitPayload = {
      playerId: getPlayerId(),
      displayName: getDisplayName(),
      height,
      breaths,
      collectibles,
      runMs: safeMs,
    };

    const result = await this.client.submit(payload);
    if (result.ok) {
      this.lastSubmitRank = result.weeklyRank;
      this.applyLiveEntries([
        {
          playerId: payload.playerId,
          displayName: payload.displayName,
          height: payload.height,
          breaths: payload.breaths,
          collectibles: payload.collectibles,
          createdAt: new Date().toISOString(),
        },
      ]);
      if (this.titleVisible) void this.refresh();
    }
    return result;
  }
}

export const leaderboardService = new LeaderboardService();
