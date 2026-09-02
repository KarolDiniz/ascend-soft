import {
  claimChallenge,
  claimableCount,
  getChallengeViews,
  getPickById,
} from '../game/dailyChallenges';
import type { AudioBus } from '../audio/AudioBus';

export class TitleDailyChallenges {
  private root: HTMLElement;
  private btnOpen: HTMLButtonElement;
  private btnClose: HTMLButtonElement;
  private backdrop: HTMLButtonElement;
  private list: HTMLElement;
  private statusEl: HTMLElement;
  private badgeEl: HTMLElement;
  private open = false;

  constructor(
    private onOverlayChange?: (open: boolean) => void,
    private audio?: AudioBus,
  ) {
    this.root = document.getElementById('title-daily-challenges')!;
    this.btnOpen = document.getElementById('btn-daily-challenges') as HTMLButtonElement;
    this.btnClose = document.getElementById('btn-daily-challenges-close') as HTMLButtonElement;
    this.backdrop = document.getElementById('title-daily-challenges-backdrop') as HTMLButtonElement;
    this.list = document.getElementById('daily-challenges-list')!;
    this.statusEl = document.getElementById('daily-challenges-status')!;
    this.badgeEl = document.getElementById('daily-challenges-badge')!;

    this.btnOpen.addEventListener('click', () => this.toggle());
    this.btnClose.addEventListener('click', () => this.close());
    this.backdrop.addEventListener('click', () => this.close());
    this.list.addEventListener('click', (e) => this.onListClick(e));

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.open) {
        e.preventDefault();
        this.close();
      }
    });

    this.refresh();
  }

  isOpen(): boolean {
    return this.open;
  }

  toggle(): void {
    if (this.open) this.close();
    else this.openPanel();
  }

  refresh(): void {
    this.syncBadge();
    if (this.open) this.renderList();
  }

  close(): void {
    if (!this.open) return;
    this.open = false;
    this.root.classList.add('hidden');
    this.root.setAttribute('aria-hidden', 'true');
    this.btnOpen.setAttribute('aria-expanded', 'false');
    this.btnOpen.classList.remove('is-open');
    this.onOverlayChange?.(false);
  }

  private openPanel(): void {
    if (this.open) return;
    this.open = true;
    this.statusEl.textContent = '';
    this.root.classList.remove('hidden');
    this.root.setAttribute('aria-hidden', 'false');
    this.btnOpen.setAttribute('aria-expanded', 'true');
    this.btnOpen.classList.add('is-open');
    this.renderList();
    this.syncBadge();
    this.onOverlayChange?.(true);
    this.btnClose.focus();
  }

  private syncBadge(): void {
    const n = claimableCount();
    if (n > 0) {
      this.badgeEl.textContent = String(n);
      this.badgeEl.classList.remove('hidden');
      this.badgeEl.removeAttribute('aria-hidden');
      this.btnOpen.setAttribute('aria-label', `Desafios diários, ${n} para resgatar`);
    } else {
      this.badgeEl.classList.add('hidden');
      this.badgeEl.setAttribute('aria-hidden', 'true');
      this.btnOpen.setAttribute('aria-label', 'Desafios diários');
    }
  }

  private onListClick(e: Event): void {
    const btn = (e.target as HTMLElement).closest('[data-claim]') as HTMLElement | null;
    if (!btn) return;
    const id = btn.getAttribute('data-claim');
    if (!id) return;
    const result = claimChallenge(id);
    if (result === 'not_done') {
      this.statusEl.textContent = 'ainda não concluiu';
      return;
    }
    if (result === 'already') {
      this.statusEl.textContent = 'já resgatou';
      return;
    }
    const pick = getPickById(id);
    this.statusEl.textContent = pick ? `+${pick.reward} moedas!` : 'resgatado!';
    void this.audio?.unlock().then(() => this.audio?.playCoin());
    this.renderList();
    this.syncBadge();
    this.onClaimed?.();
  }

  onClaimed: (() => void) | null = null;

  private renderList(): void {
    const views = getChallengeViews();
    const frag = document.createDocumentFragment();
    for (const { pick, status } of views) {
      const row = document.createElement('div');
      row.className = 'daily-challenge-row';
      if (status === 'ready') row.classList.add('is-ready');
      if (status === 'claimed') row.classList.add('is-claimed');

      const copy = document.createElement('div');
      copy.className = 'daily-challenge-copy';

      const name = document.createElement('p');
      name.className = 'daily-challenge-name';
      name.textContent = pick.title;

      const hint = document.createElement('p');
      hint.className = 'daily-challenge-hint';
      hint.textContent = pick.hint;

      const meta = document.createElement('p');
      meta.className = 'daily-challenge-meta';
      meta.textContent = `meta: ${pick.goalLabel}`;

      copy.append(name, hint, meta);

      const action = document.createElement('div');
      action.className = 'daily-challenge-action';

      const reward = document.createElement('span');
      reward.className = 'daily-challenge-reward';
      reward.textContent = `+${pick.reward}`;

      if (status === 'ready') {
        const claim = document.createElement('button');
        claim.type = 'button';
        claim.className = 'daily-challenge-claim';
        claim.dataset.claim = pick.id;
        claim.textContent = 'resgatar';
        claim.setAttribute('aria-label', `Resgatar ${pick.reward} moedas por ${pick.title}`);
        action.append(reward, claim);
      } else if (status === 'claimed') {
        const done = document.createElement('span');
        done.className = 'daily-challenge-done';
        done.textContent = 'resgatado';
        action.append(reward, done);
      } else {
        const pending = document.createElement('span');
        pending.className = 'daily-challenge-pending';
        pending.textContent = 'em progresso';
        action.append(reward, pending);
      }

      row.append(copy, action);
      frag.append(row);
    }
    this.list.replaceChildren(frag);
  }
}
