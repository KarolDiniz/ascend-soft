import { loadLocalBest } from '../game/localBest';
import { leaderboardService } from '../leaderboard/LeaderboardService';
import type { LeaderboardSnapshot } from '../leaderboard/types';

const TOP_LIMIT = 10;
const MOBILE_BREAKPOINT = 900;

export class GlobalLeaderboard {
  private panel: HTMLElement;
  private listEl: HTMLElement;
  private statusEl: HTMLElement;
  private mobileToggle: HTMLElement | null;
  private titleAnchor: HTMLElement;
  private uiRoot: HTMLElement;
  private unsubscribe: (() => void) | null = null;
  private playerId: string;
  private localBest = 0;
  private mode: 'hidden' | 'title' | 'playing' = 'hidden';

  constructor() {
    this.panel = document.getElementById('global-leaderboard')!;
    this.listEl = document.getElementById('leaderboard-list')!;
    this.statusEl = document.getElementById('leaderboard-status')!;
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

  setLocalBest(best: number): void {
    this.localBest = Math.max(0, best);
    if (this.mode !== 'hidden') {
      this.render(leaderboardService.getSnapshot());
    }
  }

  onTitleShow(): void {
    this.mode = 'title';
    this.localBest = loadLocalBest();
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
    this.localBest = loadLocalBest();
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

  destroy(): void {
    this.unsubscribe?.();
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

  private render(snap: LeaderboardSnapshot): void {
    if (this.mode === 'hidden') return;

    this.statusEl.textContent = this.statusLabel(snap.mode);
    this.listEl.innerHTML = '';

    const entries = snap.entries.slice(0, TOP_LIMIT);
    const inTop = entries.some((e) => e.playerId === this.playerId);
    const best = Math.max(this.localBest, snap.playerBest);

    if (entries.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'leaderboard-empty';
      empty.textContent =
        snap.mode === 'loading' ? 'carregando…' : 'seja o primeiro a subir!';
      this.listEl.appendChild(empty);
      return;
    }

    entries.forEach((entry, i) => {
      const rankNum = i + 1;
      this.listEl.appendChild(
        this.createRow(
          rankNum,
          entry.displayName,
          entry.height,
          entry.playerId === this.playerId,
          rankNum,
        ),
      );
    });

    if (best > 0 && !inTop) {
      const gap = document.createElement('li');
      gap.className = 'leaderboard-gap';
      gap.setAttribute('aria-hidden', 'true');
      gap.textContent = '…';
      this.listEl.appendChild(gap);

      const rank = snap.playerRank != null && snap.playerRank > 0 ? snap.playerRank : null;
      this.listEl.appendChild(
        this.createRow(
          rank,
          leaderboardService.getDisplayName(),
          best,
          true,
          null,
          true,
        ),
      );
    }
  }

  private createRow(
    rank: number | null,
    name: string,
    score: number,
    isYou: boolean,
    medalRank: number | null,
    outsideTop = false,
  ): HTMLLIElement {
    const li = document.createElement('li');
    li.className = 'leaderboard-row';
    if (isYou) li.classList.add('is-you');
    if (outsideTop) li.classList.add('is-outside-top');
    if (medalRank != null && medalRank <= 3) li.classList.add(`is-top-${medalRank}`);

    const rankEl = document.createElement('span');
    rankEl.className = 'leaderboard-rank';
    rankEl.textContent = rank != null ? String(rank) : '—';

    const nameEl = document.createElement('span');
    nameEl.className = 'leaderboard-name';
    nameEl.textContent = name;
    nameEl.title = name;

    const scoreEl = document.createElement('span');
    scoreEl.className = 'leaderboard-score';
    scoreEl.textContent = String(score);

    li.append(rankEl, nameEl, scoreEl);
    return li;
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
