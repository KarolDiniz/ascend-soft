import { loadLocalBest } from '../game/localBest';
import { LEADERBOARD_PLAYING_LIMIT } from '../leaderboard/config';
import { leaderboardService } from '../leaderboard/LeaderboardService';
import type { LeaderboardEntry, LeaderboardSnapshot } from '../leaderboard/types';

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
  onPlayingRankToggle: ((show: boolean) => void) | null = null;

  constructor() {
    this.panel = document.getElementById('global-leaderboard')!;
    this.listEl = document.getElementById('leaderboard-list')!;
    this.statusEl = document.getElementById('leaderboard-status')!;
    this.mobileToggle = document.getElementById('btn-leaderboard-toggle');
    this.titleAnchor = document.querySelector('.title-center')!;
    this.uiRoot = document.getElementById('ui')!;
    this.playerId = leaderboardService.getPlayerId();

    this.mobileToggle?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.mode !== 'playing') return;
      const show = document.documentElement.classList.contains('hide-playing-rank');
      this.onPlayingRankToggle?.(show);
      this.syncPlayingToggle();
    });

    this.unsubscribe = leaderboardService.subscribe((snap) => this.render(snap));
  }

  setLocalBest(best: number): void {
    this.localBest = Math.max(0, best);
    if (this.mode !== 'hidden') {
      this.render(leaderboardService.getSnapshot());
    }
  }

  /** Recorde ao vivo: sobe junto com a altura quando ela passa o recorde. */
  setLiveBest(best: number): void {
    if (this.mode !== 'playing') return;
    const record = Math.max(0, Math.floor(best));
    if (record <= this.localBest) return;
    this.localBest = record;
    this.render(leaderboardService.getSnapshot());
  }

  onTitleShow(): void {
    this.mode = 'title';
    this.localBest = loadLocalBest();
    this.playerId = leaderboardService.getPlayerId();
    this.mountForTitle();
    this.panel.classList.remove('hidden', 'is-playing-mode');
    this.panel.classList.add('is-title-mode');
    this.mobileToggle?.classList.add('hidden');
    this.mobileToggle?.classList.remove('is-playing', 'is-off');
    this.mobileToggle?.setAttribute('aria-pressed', 'true');
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

    this.panel.classList.remove('is-open');
    this.mobileToggle?.classList.remove('hidden');
    this.mobileToggle?.classList.add('is-playing');
    this.syncPlayingToggle();
  }

  onFallShow(): void {
    this.mode = 'hidden';
    this.panel.classList.add('hidden');
    this.panel.classList.remove('is-title-mode', 'is-playing-mode', 'is-open');
    this.mobileToggle?.classList.add('hidden');
    this.mobileToggle?.classList.remove('is-playing', 'is-off');
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

  private syncPlayingToggle(): void {
    const visible = !document.documentElement.classList.contains('hide-playing-rank');
    this.mobileToggle?.classList.toggle('is-off', !visible);
    this.mobileToggle?.setAttribute('aria-pressed', visible ? 'true' : 'false');
    this.mobileToggle?.setAttribute(
      'aria-label',
      visible ? 'Ocultar ranking' : 'Mostrar ranking',
    );
  }

  private render(snap: LeaderboardSnapshot): void {
    if (this.mode === 'hidden') return;

    this.statusEl.textContent = this.statusLabel(snap.mode);
    this.listEl.innerHTML = '';

    const liveBest = Math.max(this.localBest, snap.playerBest);
    const ranked = this.rankedEntries(snap, liveBest);

    if (ranked.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'leaderboard-empty';
      empty.textContent =
        snap.mode === 'loading' ? 'carregando…' : 'seja o primeiro a subir!';
      this.listEl.appendChild(empty);
      return;
    }

    const top =
      this.mode === 'playing' ? ranked.slice(0, LEADERBOARD_PLAYING_LIMIT) : ranked;
    const inTop = top.some((e) => e.playerId === this.playerId);

    top.forEach((entry, i) => {
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

    if (liveBest > 0 && !inTop) {
      const gap = document.createElement('li');
      gap.className = 'leaderboard-gap';
      gap.setAttribute('aria-hidden', 'true');
      gap.textContent = '…';
      this.listEl.appendChild(gap);

      const you = ranked.find((e) => e.playerId === this.playerId);
      const rank = you ? ranked.indexOf(you) + 1 : snap.playerRank;
      this.listEl.appendChild(
        this.createRow(
          rank != null && rank > 0 ? rank : null,
          leaderboardService.getDisplayName(),
          liveBest,
          true,
          null,
          true,
        ),
      );
    }
  }

  private rankedEntries(snap: LeaderboardSnapshot, liveBest: number): LeaderboardEntry[] {
    const entries = snap.entries.map((e) =>
      e.playerId === this.playerId ? { ...e, height: Math.max(e.height, liveBest) } : { ...e },
    );

    const inList = entries.some((e) => e.playerId === this.playerId);
    if (!inList && liveBest > 0) {
      entries.push({
        playerId: this.playerId,
        displayName: leaderboardService.getDisplayName(),
        height: liveBest,
        breaths: 0,
        collectibles: 0,
      });
    }

    entries.sort((a, b) => b.height - a.height || a.displayName.localeCompare(b.displayName));
    return entries;
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
