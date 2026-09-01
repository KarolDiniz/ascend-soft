import { leaderboardService } from '../leaderboard/LeaderboardService';
import type { LeaderboardSnapshot } from '../leaderboard/types';

const PLAYING_TOP_LIMIT = 5;
const MOBILE_BREAKPOINT = 900;

export class GlobalLeaderboard {
  private panel: HTMLElement;
  private listEl: HTMLElement;
  private statusEl: HTMLElement;
  private youEl: HTMLElement;
  private mobileToggle: HTMLElement | null;
  private titleAnchor: HTMLElement;
  private uiRoot: HTMLElement;
  private unsubscribe: (() => void) | null = null;
  private playerId: string;
  private compact = false;
  private mode: 'hidden' | 'title' | 'playing' = 'hidden';

  constructor() {
    this.panel = document.getElementById('global-leaderboard')!;
    this.listEl = document.getElementById('leaderboard-list')!;
    this.statusEl = document.getElementById('leaderboard-status')!;
    this.youEl = document.getElementById('leaderboard-you')!;
    this.mobileToggle = document.getElementById('btn-leaderboard-toggle');
    this.titleAnchor = document.querySelector('.title-center')!;
    this.uiRoot = document.getElementById('ui')!;
    this.playerId = leaderboardService.getPlayerId();

    this.mobileToggle?.addEventListener('click', () => {
      const open = this.panel.classList.toggle('is-open');
      this.mobileToggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    this.unsubscribe = leaderboardService.subscribe((snap) => this.render(snap));
  }

  onTitleShow(): void {
    this.mode = 'title';
    this.compact = false;
    this.playerId = leaderboardService.getPlayerId();
    this.mountForTitle();
    this.panel.classList.remove('hidden', 'is-playing-mode');
    this.panel.classList.add('is-title-mode');
    this.mobileToggle?.classList.add('hidden');
    this.mobileToggle?.setAttribute('aria-expanded', 'false');
    this.panel.classList.remove('is-open');
    leaderboardService.onTitleShow();
    this.render(leaderboardService.getSnapshot());
  }

  onPlayingShow(): void {
    this.mode = 'playing';
    this.compact = true;
    this.playerId = leaderboardService.getPlayerId();
    this.mountForPlaying();
    this.panel.classList.remove('hidden', 'is-title-mode');
    this.panel.classList.add('is-playing-mode');
    leaderboardService.onPlayingShow();
    this.render(leaderboardService.getSnapshot());

    const isMobile = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches;
    if (isMobile) {
      this.panel.classList.remove('is-open');
      this.mobileToggle?.classList.remove('hidden');
      this.mobileToggle?.setAttribute('aria-expanded', 'false');
    } else {
      this.mobileToggle?.classList.add('hidden');
    }
  }

  onFallShow(): void {
    this.mode = 'hidden';
    this.panel.classList.add('hidden');
    this.panel.classList.remove('is-title-mode', 'is-playing-mode', 'is-open');
    this.mobileToggle?.classList.add('hidden');
    leaderboardService.onPlayingHide();
  }

  private mountForTitle(): void {
    if (this.panel.parentElement !== this.titleAnchor) {
      this.titleAnchor.appendChild(this.panel);
    }
  }

  private mountForPlaying(): void {
    if (this.panel.parentElement !== this.uiRoot) {
      this.uiRoot.appendChild(this.panel);
    }
  }

  destroy(): void {
    this.unsubscribe?.();
    leaderboardService.onPlayingHide();
  }

  private render(snap: LeaderboardSnapshot): void {
    if (this.mode === 'hidden') return;

    this.statusEl.textContent = this.statusLabel(snap.mode);
    this.listEl.innerHTML = '';

    const limit = this.compact ? PLAYING_TOP_LIMIT : snap.entries.length;
    const entries = snap.entries.slice(0, limit);

    if (entries.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'leaderboard-empty';
      empty.textContent =
        snap.mode === 'loading' ? 'carregando…' : 'seja o primeiro a subir!';
      this.listEl.appendChild(empty);
    } else {
      entries.forEach((entry, i) => {
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
      this.youEl.textContent = this.compact ? 'suba para entrar' : 'jogue para entrar no ranking';
      this.youEl.classList.remove('hidden');
    }
  }

  private statusLabel(mode: LeaderboardSnapshot['mode']): string {
    switch (mode) {
      case 'global':
        return 'global';
      case 'local':
        return 'local';
      case 'offline':
        return 'offline';
      default:
        return '…';
    }
  }
}
