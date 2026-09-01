import { leaderboardService } from '../leaderboard/LeaderboardService';
import type { LeaderboardSnapshot } from '../leaderboard/types';

export class GlobalLeaderboard {
  private panel: HTMLElement;
  private listEl: HTMLElement;
  private statusEl: HTMLElement;
  private youEl: HTMLElement;
  private mobileToggle: HTMLElement | null;
  private unsubscribe: (() => void) | null = null;
  private playerId: string;

  constructor() {
    this.panel = document.getElementById('global-leaderboard')!;
    this.listEl = document.getElementById('leaderboard-list')!;
    this.statusEl = document.getElementById('leaderboard-status')!;
    this.youEl = document.getElementById('leaderboard-you')!;
    this.mobileToggle = document.getElementById('btn-leaderboard-toggle');
    this.playerId = leaderboardService.getPlayerId();

    this.mobileToggle?.addEventListener('click', () => {
      this.panel.classList.toggle('is-open');
    });

    this.unsubscribe = leaderboardService.subscribe((snap) => this.render(snap));
  }

  onTitleShow(): void {
    this.playerId = leaderboardService.getPlayerId();
    this.panel.classList.remove('hidden');
    leaderboardService.onTitleShow();
  }

  onTitleHide(): void {
    this.panel.classList.add('hidden');
    this.panel.classList.remove('is-open');
    leaderboardService.onTitleHide();
  }

  destroy(): void {
    this.unsubscribe?.();
    leaderboardService.onTitleHide();
  }

  private render(snap: LeaderboardSnapshot): void {
    this.statusEl.textContent = this.statusLabel(snap.mode);
    this.listEl.innerHTML = '';

    if (snap.entries.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'leaderboard-empty';
      empty.textContent =
        snap.mode === 'loading' ? 'carregando…' : 'seja o primeiro a subir!';
      this.listEl.appendChild(empty);
    } else {
      snap.entries.forEach((entry, i) => {
        const li = document.createElement('li');
        li.className = 'leaderboard-row';
        if (entry.playerId === this.playerId) li.classList.add('is-you');

        const rank = document.createElement('span');
        rank.className = 'leaderboard-rank';
        rank.textContent = String(i + 1);

        const name = document.createElement('span');
        name.className = 'leaderboard-name';
        name.textContent = entry.displayName;
        name.title = entry.displayName;

        const score = document.createElement('span');
        score.className = 'leaderboard-score';
        score.textContent = String(entry.height);

        li.append(rank, name, score);
        this.listEl.appendChild(li);
      });
    }

    if (snap.playerRank && snap.playerBest > 0) {
      this.youEl.textContent = `você: #${snap.playerRank} · ${snap.playerBest}`;
      this.youEl.classList.remove('hidden');
    } else {
      this.youEl.textContent = 'jogue para entrar no ranking';
      this.youEl.classList.remove('hidden');
    }
  }

  private statusLabel(mode: LeaderboardSnapshot['mode']): string {
    switch (mode) {
      case 'global':
        return 'global';
      case 'local':
        return 'local (configure Supabase)';
      case 'offline':
        return 'offline';
      default:
        return '…';
    }
  }
}
