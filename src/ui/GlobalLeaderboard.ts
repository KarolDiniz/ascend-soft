import { loadLocalBest } from '../game/localBest';
import { leaderboardService } from '../leaderboard/LeaderboardService';
import { playingWindow } from '../leaderboard/playingWindow';
import type { LeaderboardEntry, LeaderboardScope, LeaderboardSnapshot } from '../leaderboard/types';

export class GlobalLeaderboard {
  private panel: HTMLElement;
  private listEl: HTMLElement;
  private statusEl: HTMLElement;
  private tabWeekly: HTMLButtonElement;
  private tabGlobal: HTMLButtonElement;
  private playingScopeEl: HTMLElement;
  private mobileToggle: HTMLElement | null;
  private titleAnchor: HTMLElement;
  private uiRoot: HTMLElement;
  private unsubscribe: (() => void) | null = null;
  private playerId: string;
  private localBest = 0;
  private liveHeight = 0;
  private chaseBoard: LeaderboardEntry[] = [];
  private windowKey = '';
  private youScoreEl: HTMLElement | null = null;
  private youPinEl: HTMLElement;
  private lastEntriesRef: LeaderboardEntry[] | null = null;
  private mode: 'hidden' | 'title' | 'playing' = 'hidden';
  onPlayingRankToggle: ((show: boolean) => void) | null = null;

  constructor() {
    this.panel = document.getElementById('global-leaderboard')!;
    this.listEl = document.getElementById('leaderboard-list')!;
    this.statusEl = document.getElementById('leaderboard-status')!;
    this.tabWeekly = document.getElementById('leaderboard-tab-weekly') as HTMLButtonElement;
    this.tabGlobal = document.getElementById('leaderboard-tab-global') as HTMLButtonElement;
    this.playingScopeEl = document.getElementById('leaderboard-playing-scope')!;
    this.youPinEl = document.getElementById('leaderboard-you-pin')!;
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
    this.listEl.addEventListener('scroll', () => {
      this.syncScrollHint();
      this.syncYouPin();
    }, { passive: true });

    this.tabWeekly.addEventListener('click', () => this.selectScope('weekly'));
    this.tabGlobal.addEventListener('click', () => this.selectScope('global'));
  }

  private selectScope(scope: LeaderboardScope): void {
    if (leaderboardService.getScope() === scope) return;
    leaderboardService.setScope(scope);
    this.syncTabs(scope);
    this.lastEntriesRef = null;
    this.render(leaderboardService.getSnapshot(), true);
  }

  private syncTabs(scope: LeaderboardScope): void {
    this.tabWeekly.classList.toggle('is-active', scope === 'weekly');
    this.tabGlobal.classList.toggle('is-active', scope === 'global');
    this.tabWeekly.setAttribute('aria-selected', scope === 'weekly' ? 'true' : 'false');
    this.tabGlobal.setAttribute('aria-selected', scope === 'global' ? 'true' : 'false');
    this.playingScopeEl.textContent = scope === 'weekly' ? 'SEM' : 'GLO';
  }

  setLocalBest(best: number): void {
    this.localBest = Math.max(0, best);
    if (this.mode !== 'hidden') {
      this.render(leaderboardService.getSnapshot(), true);
    }
  }

  /** Altura inteira da subida atual — reposiciona a janela sem refetch. */
  setLiveHeight(height: number): void {
    if (this.mode !== 'playing') return;
    const next = Math.max(0, Math.floor(height));
    if (next === this.liveHeight) return;
    this.liveHeight = next;
    this.renderPlaying(leaderboardService.getSnapshot(), false);
  }

  onTitleShow(): void {
    this.mode = 'title';
    this.liveHeight = 0;
    this.windowKey = '';
    this.youScoreEl = null;
    this.lastEntriesRef = null;
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
    this.syncTabs(leaderboardService.getScope());
    this.render(leaderboardService.getSnapshot());
  }

  onPlayingShow(): void {
    this.mode = 'playing';
    this.liveHeight = 0;
    this.windowKey = '';
    this.youScoreEl = null;
    this.lastEntriesRef = null;
    this.localBest = loadLocalBest();
    this.playerId = leaderboardService.getPlayerId();
    this.mountForPlaying();
    this.panel.classList.remove('hidden', 'is-title-mode');
    this.panel.classList.add('is-playing-mode');
    this.hideYouPin();
    leaderboardService.onPlayingShow();
    this.syncTabs(leaderboardService.getScope());
    this.render(leaderboardService.getSnapshot());

    this.panel.classList.remove('is-open');
    this.mobileToggle?.classList.remove('hidden');
    this.mobileToggle?.classList.add('is-playing');
    this.syncPlayingToggle();
  }

  onFallShow(): void {
    this.mode = 'hidden';
    this.liveHeight = 0;
    this.windowKey = '';
    this.youScoreEl = null;
    this.lastEntriesRef = null;
    this.panel.classList.add('hidden');
    this.panel.classList.remove('is-title-mode', 'is-playing-mode', 'is-open');
    this.mobileToggle?.classList.add('hidden');
    this.mobileToggle?.classList.remove('is-playing', 'is-off');
    leaderboardService.onPlayingHide();
  }

  destroy(): void {
    this.unsubscribe?.();
    leaderboardService.disconnect();
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

  private render(snap: LeaderboardSnapshot, force = false): void {
    if (this.mode === 'hidden') return;

    const entriesChanged = force || snap.entries !== this.lastEntriesRef;
    if (entriesChanged) {
      this.lastEntriesRef = snap.entries;
      this.chaseBoard = snap.entries.filter((e) => e.playerId !== this.playerId);
    }

    this.syncTabs(snap.scope);
    this.statusEl.textContent = this.statusLabel(snap.mode);

    if (this.mode === 'playing') {
      this.renderPlaying(snap, entriesChanged);
      return;
    }
    if (entriesChanged) this.renderTitle(snap);
  }

  private renderTitle(snap: LeaderboardSnapshot): void {
    this.statusEl.textContent = this.statusLabel(snap.mode);
    const scrollTop = this.listEl.scrollTop;

    const liveBest = Math.max(this.localBest, snap.playerBest);
    const ranked = this.rankedEntries(snap, liveBest);

    this.listEl.replaceChildren();
    if (ranked.length === 0) {
      this.listEl.appendChild(this.createEmpty(snap));
      this.hideYouPin();
      this.syncScrollHint();
      return;
    }

    const frag = document.createDocumentFragment();
    ranked.forEach((entry, i) => {
      const rankNum = i + 1;
      frag.appendChild(
        this.createRow(rankNum, entry.displayName, entry.height, entry.playerId === this.playerId, rankNum),
      );
    });
    this.listEl.appendChild(frag);
    this.listEl.scrollTop = scrollTop;

    const youIdx = ranked.findIndex((e) => e.playerId === this.playerId);
    if (youIdx >= 0) {
      const you = ranked[youIdx]!;
      this.renderYouPin(youIdx + 1, you.displayName, you.height);
    } else {
      this.hideYouPin();
    }

    window.requestAnimationFrame(() => {
      this.syncYouPin();
      this.syncScrollHint();
    });
  }

  private renderYouPin(rank: number, name: string, score: number): void {
    this.youPinEl.replaceChildren();
    this.youPinEl.appendChild(this.createRow(rank, name, score, true, rank <= 3 ? rank : null, 'div'));
    this.youPinEl.setAttribute('aria-label', `Sua posição: ${rank}º com ${score}`);
  }

  private hideYouPin(): void {
    this.youPinEl.classList.add('hidden');
    this.youPinEl.classList.remove('is-visible', 'is-below', 'is-above');
    this.youPinEl.setAttribute('aria-hidden', 'true');
    this.panel.classList.remove('has-you-pin-below', 'has-you-pin-above');
    this.listEl.classList.remove('has-you-padding-below', 'has-you-padding-above');
  }

  /** Pin fixo quando a linha "você" sai da área visível do scroll. */
  private syncYouPin(): void {
    if (this.mode !== 'title') {
      this.hideYouPin();
      return;
    }

    const row = this.listEl.querySelector('.leaderboard-row.is-you');
    if (!row || this.youPinEl.childElementCount === 0) {
      this.hideYouPin();
      return;
    }

    const rowTop = (row as HTMLElement).offsetTop;
    const rowBottom = rowTop + (row as HTMLElement).offsetHeight;
    const viewTop = this.listEl.scrollTop;
    const viewBottom = viewTop + this.listEl.clientHeight;
    const visible = rowBottom > viewTop + 1 && rowTop < viewBottom - 1;

    if (visible) {
      this.youPinEl.classList.add('hidden');
      this.youPinEl.classList.remove('is-visible', 'is-below', 'is-above');
      this.youPinEl.setAttribute('aria-hidden', 'true');
      this.panel.classList.remove('has-you-pin-below', 'has-you-pin-above');
      this.listEl.classList.remove('has-you-padding-below', 'has-you-padding-above');
      return;
    }

    const below = rowTop >= viewBottom - 1;
    this.youPinEl.classList.remove('hidden');
    this.youPinEl.classList.add('is-visible');
    this.youPinEl.classList.toggle('is-below', below);
    this.youPinEl.classList.toggle('is-above', !below);
    this.youPinEl.setAttribute('aria-hidden', 'false');
    this.panel.classList.toggle('has-you-pin-below', below);
    this.panel.classList.toggle('has-you-pin-above', !below);
    this.listEl.classList.toggle('has-you-padding-below', below);
    this.listEl.classList.toggle('has-you-padding-above', !below);
  }

  private renderPlaying(snap: LeaderboardSnapshot, fromSnapshot: boolean): void {
    if (snap.mode === 'loading' && snap.entries.length === 0) {
      this.windowKey = '';
      this.youScoreEl = null;
      this.listEl.replaceChildren();
      this.listEl.appendChild(this.createEmpty(snap));
      this.syncScrollHint();
      return;
    }

    const me: LeaderboardEntry = {
      playerId: this.playerId,
      displayName: leaderboardService.getDisplayName(),
      height: this.liveHeight,
      breaths: 0,
      collectibles: 0,
    };
    const rows = playingWindow(this.chaseBoard, me);
    const key = rows.map((r) => `${r.rank}:${r.entry.playerId}`).join('|');

    if (!fromSnapshot && key === this.windowKey && this.youScoreEl) {
      this.youScoreEl.textContent = String(this.liveHeight);
      return;
    }

    this.windowKey = key;
    this.listEl.replaceChildren();

    if (rows.length === 0) {
      this.youScoreEl = null;
      this.listEl.appendChild(this.createEmpty(snap));
      this.syncScrollHint();
      return;
    }

    const frag = document.createDocumentFragment();
    let youScore: HTMLElement | null = null;
    for (const row of rows) {
      const li = this.createRow(
        row.rank,
        row.entry.displayName,
        row.isYou ? this.liveHeight : row.entry.height,
        row.isYou,
        row.rank,
      );
      if (row.isYou) {
        youScore = li.querySelector<HTMLSpanElement>('.leaderboard-score');
        li.classList.toggle('is-leader', row.rank === 1);
      }
      frag.appendChild(li);
    }
    this.listEl.appendChild(frag);
    this.youScoreEl = youScore;
    this.syncScrollHint();
  }

  private createEmpty(snap: LeaderboardSnapshot): HTMLLIElement {
    const empty = document.createElement('li');
    empty.className = 'leaderboard-empty';
    if (snap.mode === 'loading') {
      empty.textContent = 'carregando…';
    } else if (snap.scope === 'weekly') {
      empty.textContent = 'ninguém ainda — seja o primeiro!';
    } else {
      empty.textContent = 'seja o primeiro a subir!';
    }
    return empty;
  }

  private syncScrollHint(): void {
    const apply = () => {
      if (this.mode !== 'title') {
        this.panel.classList.remove('has-more-below');
        return;
      }
      const overflow = this.listEl.scrollHeight > this.listEl.clientHeight + 3;
      const atEnd =
        this.listEl.scrollTop + this.listEl.clientHeight >= this.listEl.scrollHeight - 6;
      this.panel.classList.toggle('has-more-below', overflow && !atEnd);
    };
    apply();
    window.requestAnimationFrame(apply);
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
    tag: 'li' | 'div' = 'li',
  ): HTMLElement {
    const el = document.createElement(tag);
    el.className = 'leaderboard-row';
    if (isYou) el.classList.add('is-you');
    if (medalRank != null && medalRank <= 3) el.classList.add(`is-top-${medalRank}`);

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

    el.append(rankEl, nameEl, scoreEl);
    return el;
  }

  private statusLabel(mode: LeaderboardSnapshot['mode']): string {
    if (leaderboardService.isLive() && (mode === 'global' || mode === 'loading')) {
      return 'ao vivo';
    }
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
