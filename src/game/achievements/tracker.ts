import type { AchievementDef } from './definitions';
import { getAchievement, HEIGHT_THRESHOLDS } from './definitions';
import {
  isUnlocked,
  loadAchievementState,
  saveAchievementState,
  unlockAchievement,
  type AchievementState,
} from './storage';

export type AchievementUnlockListener = (def: AchievementDef) => void;

export class AchievementTracker {
  private state = loadAchievementState();
  private queue: AchievementDef[] = [];
  private runLandings = 0;
  private runUsedHelicopter = false;
  private runUsedPotion = false;
  private titleIdleMs = 0;
  onUnlock: AchievementUnlockListener | null = null;
  onRefresh: (() => void) | null = null;

  reload(): void {
    this.state = loadAchievementState();
  }

  getState(): AchievementState {
    return this.state;
  }

  unlockedCount(): number {
    return this.state.unlocked.length;
  }

  resetRun(): void {
    this.runLandings = 0;
    this.runUsedHelicopter = false;
    this.runUsedPotion = false;
  }

  private tryUnlock(id: string): void {
    if (unlockAchievement(this.state, id)) {
      const def = getAchievement(id);
      if (def) {
        this.queue.push(def);
        this.onUnlock?.(def);
        this.onRefresh?.();
      }
    }
  }

  flushQueue(): AchievementDef[] {
    const batch = this.queue;
    this.queue = [];
    return batch;
  }

  noteHeight(height: number): void {
    for (const tier of HEIGHT_THRESHOLDS) {
      if (height >= tier.min) this.tryUnlock(tier.id);
    }
  }

  noteFall(height: number, startBest: number, runBestPerfect: number): void {
    const stats = this.state.stats;
    stats.falls += 1;
    const now = Date.now();
    stats.fallTimes.push(now);
    stats.fallTimes = stats.fallTimes.filter((t) => now - t <= 5 * 60_000);
    saveAchievementState(this.state);

    this.noteHeight(height);
    if (stats.falls === 1) this.tryUnlock('fall_first');
    if (stats.falls >= 10) this.tryUnlock('fall_10');
    if (stats.falls >= 50) this.tryUnlock('fall_50');
    if (stats.falls >= 100) this.tryUnlock('fall_100');
    if (stats.fallTimes.length >= 3) this.tryUnlock('fall_3_fast');

    if (startBest > 0 && height >= startBest - 50 && height < startBest) {
      this.tryUnlock('secret_near_pb');
    }
    if (height < 500) this.tryUnlock('secret_speed_fall');
    if (runBestPerfect >= 50) this.tryUnlock('perfect_50_run');
    if (this.runLandings >= 50) this.tryUnlock('secret_landings_50');
  }

  noteLanding(): void {
    this.runLandings += 1;
  }

  notePerfect(streak: number, potionActive: boolean): void {
    this.state.stats.totalPerfects += 1;
    saveAchievementState(this.state);
    this.tryUnlock('perfect_first');
    if (streak >= 10) this.tryUnlock('perfect_10');
    if (streak >= 25) this.tryUnlock('perfect_25');
    if (potionActive) this.tryUnlock('gear_perfect_potion');
  }

  noteGnomeHit(): void {
    this.state.stats.gnomeHits += 1;
    saveAchievementState(this.state);
    this.tryUnlock('gnome_first');
    if (this.state.stats.gnomeHits >= 10) this.tryUnlock('gnome_hit_10');
  }

  noteGnomeSurvive(): void {
    this.state.stats.gnomeSurvives += 1;
    saveAchievementState(this.state);
    this.tryUnlock('gnome_survive');
    if (this.state.stats.gnomeSurvives >= 5) this.tryUnlock('gnome_survive_5');
  }

  noteCoinCollected(runTotal: number, walletTotal: number): void {
    if (runTotal >= 1) this.tryUnlock('coin_first');
    if (runTotal >= 500) this.tryUnlock('coin_run_500');
    if (walletTotal >= 100) this.tryUnlock('coin_wallet_100');
    if (walletTotal >= 1000) this.tryUnlock('coin_wallet_1000');
  }

  noteShopPurchase(): void {
    this.state.stats.shopPurchases += 1;
    saveAchievementState(this.state);
    this.tryUnlock('shop_first');
  }

  noteShopOpen(): void {
    this.state.stats.shopOpens += 1;
    saveAchievementState(this.state);
    if (this.state.stats.shopOpens >= 5 && this.state.stats.shopPurchases === 0) {
      this.tryUnlock('secret_shop_window');
    }
  }

  noteHelicopterUsed(): void {
    this.runUsedHelicopter = true;
    this.state.stats.usedHelicopter = true;
    saveAchievementState(this.state);
    this.tryUnlock('gear_helicopter');
    this.checkFullLoadout();
  }

  notePotionUsed(): void {
    this.runUsedPotion = true;
    this.state.stats.usedPotion = true;
    saveAchievementState(this.state);
    this.tryUnlock('gear_potion');
    this.checkFullLoadout();
  }

  private checkFullLoadout(): void {
    if (this.runUsedHelicopter && this.runUsedPotion) this.tryUnlock('gear_full');
  }

  noteRankSubmitted(weeklyRank: number | null, globalRank: number | null): void {
    if (!this.state.stats.rankSubmitted) {
      this.state.stats.rankSubmitted = true;
      saveAchievementState(this.state);
    }
    this.tryUnlock('rank_submit');
    if (weeklyRank != null && weeklyRank > 0 && weeklyRank <= 10) this.tryUnlock('rank_weekly_top10');
    if (weeklyRank === 1) this.tryUnlock('rank_weekly_1');
    if (globalRank != null && globalRank > 0 && globalRank <= 10) this.tryUnlock('rank_global_top10');
  }

  noteDailyClaim(allDoneToday: boolean): void {
    this.state.stats.dailyClaims += 1;
    saveAchievementState(this.state);
    this.tryUnlock('daily_first');
    if (allDoneToday) this.tryUnlock('daily_all_three');
  }

  notePlayStreak(streak: number): void {
    if (streak >= 3) this.tryUnlock('streak_3');
    if (streak >= 7) this.tryUnlock('streak_7');
  }

  noteBreathsInRun(breaths: number): void {
    if (breaths >= 20) this.tryUnlock('secret_breaths_20');
  }

  tickPlayMs(dtMs: number): void {
    if (dtMs <= 0) return;
    this.state.stats.totalPlayMs += dtMs;
    saveAchievementState(this.state);
    if (this.state.stats.totalPlayMs >= 10 * 60_000) this.tryUnlock('secret_play_10min');
  }

  tickTitleIdleMs(dtMs: number): void {
    this.titleIdleMs += dtMs;
    if (this.titleIdleMs >= 30_000) this.tryUnlock('secret_title_idle');
  }

  resetTitleIdle(): void {
    this.titleIdleMs = 0;
  }

  noteSessionStart(): void {
    const h = new Date().getHours();
    if (h >= 0 && h < 5) this.tryUnlock('secret_night_owl');
  }

  isAchievementUnlocked(id: string): boolean {
    return isUnlocked(this.state, id);
  }
}

export const achievementTracker = new AchievementTracker();
