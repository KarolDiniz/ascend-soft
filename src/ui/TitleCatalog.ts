import {
  COLLECTIBLE_ORDER,
  COLLECTIBLES,
} from '../game/collectibles/definitions';
import {
  collectedCount,
  loadCollected,
  totalCollectibles,
} from '../game/collectibles/storage';

/** Catálogo de colecionáveis na tela inicial */
export class TitleCatalog {
  private root: HTMLElement;
  private btnOpen: HTMLButtonElement;
  private btnClose: HTMLButtonElement;
  private backdrop: HTMLButtonElement;
  private grid: HTMLElement;
  private progressEl: HTMLElement;
  private badgeEl: HTMLElement;
  private open = false;

  constructor() {
    this.root = document.getElementById('title-catalog')!;
    this.btnOpen = document.getElementById('btn-catalog') as HTMLButtonElement;
    this.btnClose = document.getElementById('btn-catalog-close') as HTMLButtonElement;
    this.backdrop = document.getElementById('title-catalog-backdrop') as HTMLButtonElement;
    this.grid = document.getElementById('catalog-grid')!;
    this.progressEl = document.getElementById('catalog-progress')!;
    this.badgeEl = document.getElementById('catalog-badge')!;

    this.btnOpen.addEventListener('click', () => this.toggle());
    this.btnClose.addEventListener('click', () => this.close());
    this.backdrop.addEventListener('click', () => this.close());

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.open) {
        e.preventDefault();
        this.close();
      }
    });

    this.renderGrid();
    this.syncBadge();
  }

  isOpen(): boolean {
    return this.open;
  }

  toggle(): void {
    if (this.open) this.close();
    else this.openPanel();
  }

  /** Atualiza badge e grid após coletar na partida */
  refresh(): void {
    this.syncBadge();
    if (this.open) this.renderGrid();
  }

  private syncBadge(): void {
    const count = collectedCount(loadCollected());
    const total = totalCollectibles();
    if (count > 0) {
      this.badgeEl.textContent = String(count);
      this.badgeEl.classList.remove('hidden');
      this.btnOpen.setAttribute('aria-label', `Catálogo de colecionáveis, ${count} de ${total}`);
    } else {
      this.badgeEl.classList.add('hidden');
      this.btnOpen.setAttribute('aria-label', 'Catálogo de colecionáveis');
    }
  }

  private renderGrid(): void {
    const collected = loadCollected();
    const total = totalCollectibles();
    const count = collected.size;
    this.progressEl.textContent = `${count} / ${total} encontrados`;

    const frag = document.createDocumentFragment();
    for (const id of COLLECTIBLE_ORDER) {
      const def = COLLECTIBLES[id];
      const owned = collected.has(id);
      const card = document.createElement('article');
      card.className = `catalog-card${owned ? ' is-owned' : ''}`;
      card.setAttribute('role', 'listitem');
      card.innerHTML = `
        <div class="catalog-icon" style="--c-primary:${def.primary};--c-secondary:${def.secondary};--c-accent:${def.accent}" aria-hidden="true">
          <span class="catalog-icon-shape catalog-icon-shape--${id}"></span>
        </div>
        <p class="catalog-name">${owned ? def.name : '???'}</p>
        <p class="catalog-hint">${owned ? def.hint : 'ainda não encontrado'}</p>
      `;
      frag.appendChild(card);
    }
    this.grid.replaceChildren(frag);
  }

  private openPanel(): void {
    this.renderGrid();
    this.open = true;
    this.root.classList.remove('hidden');
    this.root.setAttribute('aria-hidden', 'false');
    this.btnOpen.classList.add('is-open');
    this.btnOpen.setAttribute('aria-expanded', 'true');
    this.btnClose.focus();
  }

  close(): void {
    if (!this.open) return;
    this.open = false;
    this.root.classList.add('hidden');
    this.root.setAttribute('aria-hidden', 'true');
    this.btnOpen.classList.remove('is-open');
    this.btnOpen.setAttribute('aria-expanded', 'false');
    this.btnOpen.focus();
  }
}
