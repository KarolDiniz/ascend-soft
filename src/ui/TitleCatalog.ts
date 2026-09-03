import {
  COLLECTIBLE_ORDER,
  COLLECTIBLES,
} from '../game/collectibles/definitions';
import {
  collectedCount,
  loadCollected,
  totalCollectibles,
} from '../game/collectibles/storage';
import { MATERIALS, type MaterialId } from '../audio/materials';
import type { AudioBus } from '../audio/AudioBus';
import { PHASE_ORDER } from '../game/ThemedPhases';
import { todaysOpener } from '../game/returnLoop';
import { loadSeenMaterials, totalTextures } from '../game/seenMaterials';
import { MATERIAL_PASTEL } from '../theme/pastelPalette';
import { renderAchievementsInto } from './achievementsCatalog';

type CatalogTab = 'textures' | 'loot' | 'achievements';

/** Catálogo da tela inicial — tesouros, texturas e conquistas */
export class TitleCatalog {
  private root: HTMLElement;
  private btnOpen: HTMLButtonElement;
  private btnClose: HTMLButtonElement;
  private backdrop: HTMLButtonElement;
  private grid: HTMLElement;
  private progressEl: HTMLElement;
  private badgeEl: HTMLElement;
  private tabTextures: HTMLButtonElement;
  private tabLoot: HTMLButtonElement;
  private tabAchievements: HTMLButtonElement;
  private open = false;
  private tab: CatalogTab = 'textures';

  constructor(
    private onOverlayChange?: (open: boolean) => void,
    private audio?: AudioBus,
  ) {
    this.root = document.getElementById('title-catalog')!;
    this.btnOpen = document.getElementById('btn-catalog') as HTMLButtonElement;
    this.btnClose = document.getElementById('btn-catalog-close') as HTMLButtonElement;
    this.backdrop = document.getElementById('title-catalog-backdrop') as HTMLButtonElement;
    this.grid = document.getElementById('catalog-grid')!;
    this.progressEl = document.getElementById('catalog-progress')!;
    this.badgeEl = document.getElementById('catalog-badge')!;
    this.tabTextures = document.getElementById('catalog-tab-textures') as HTMLButtonElement;
    this.tabLoot = document.getElementById('catalog-tab-loot') as HTMLButtonElement;
    this.tabAchievements = document.getElementById('catalog-tab-achievements') as HTMLButtonElement;

    this.btnOpen.addEventListener('click', () => this.toggle());
    this.btnClose.addEventListener('click', () => this.close());
    this.backdrop.addEventListener('click', () => this.close());
    this.tabTextures.addEventListener('click', () => this.setTab('textures'));
    this.tabLoot.addEventListener('click', () => this.setTab('loot'));
    this.tabAchievements.addEventListener('click', () => this.setTab('achievements'));
    this.grid.addEventListener('click', (e) => this.onGridClick(e));
    this.grid.addEventListener('keydown', (e) => this.onGridKeydown(e));

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.open) {
        e.preventDefault();
        this.close();
      }
    });

    this.syncTabs();
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

  show(): void {
    if (!this.open) this.openPanel();
  }

  /** Atualiza badge e grid após coletar, ouvir ou desbloquear conquista */
  refresh(): void {
    this.syncBadge();
    if (this.open) this.renderGrid();
  }

  private setTab(tab: CatalogTab): void {
    if (this.tab === tab) return;
    this.tab = tab;
    this.syncTabs();
    this.renderGrid();
  }

  private syncTabs(): void {
    this.tabTextures.classList.toggle('is-active', this.tab === 'textures');
    this.tabLoot.classList.toggle('is-active', this.tab === 'loot');
    this.tabAchievements.classList.toggle('is-active', this.tab === 'achievements');
    this.tabTextures.setAttribute('aria-selected', this.tab === 'textures' ? 'true' : 'false');
    this.tabLoot.setAttribute('aria-selected', this.tab === 'loot' ? 'true' : 'false');
    this.tabAchievements.setAttribute('aria-selected', this.tab === 'achievements' ? 'true' : 'false');
  }

  private syncBadge(): void {
    const heard = loadSeenMaterials().size;
    const col = collectedCount(loadCollected());
    const texTotal = totalTextures();
    const lootTotal = totalCollectibles();
    const count = heard > 0 ? heard : col;
    if (count > 0) {
      this.badgeEl.textContent = String(count);
      this.badgeEl.classList.remove('hidden');
    } else {
      this.badgeEl.classList.add('hidden');
    }
    this.btnOpen.setAttribute(
      'aria-label',
      `Álbum, ${heard} de ${texTotal} texturas, ${col} de ${lootTotal} tesouros`,
    );
  }

  private renderGrid(): void {
    if (this.tab === 'textures') this.renderTextures();
    else if (this.tab === 'loot') this.renderLoot();
    else renderAchievementsInto(this.grid, this.progressEl);
  }

  private renderLoot(): void {
    this.grid.className = 'catalog-grid';
    const collected = loadCollected();
    const total = totalCollectibles();
    this.progressEl.textContent = `${collected.size} / ${total} tesouros`;

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

  private renderTextures(): void {
    this.grid.className = 'catalog-grid';
    const seen = loadSeenMaterials();
    const total = totalTextures();
    const featured = todaysOpener();
    this.progressEl.textContent = `${seen.size} / ${total} texturas`;

    const frag = document.createDocumentFragment();
    for (const id of PHASE_ORDER) {
      const heard = seen.has(id);
      const isToday = id === featured;
      const playable = heard || isToday;
      const mat = MATERIALS[id];
      const pastel = MATERIAL_PASTEL[id];
      const fill = playable ? (pastel?.fill ?? '#c8c4bc') : '#d4cfc6';
      const card = document.createElement('article');
      card.className = `catalog-card${heard ? ' is-owned' : ''}${isToday ? ' is-today' : ''}${playable ? ' is-playable' : ''}`;
      card.setAttribute('role', playable ? 'button' : 'listitem');
      if (playable) {
        card.dataset.material = id;
        card.tabIndex = 0;
        card.setAttribute('aria-label', `Ouvir textura ${mat.name}`);
      }
      const name = playable ? mat.name : '???';
      const hint = playable
        ? heard
          ? 'toque para ouvir'
          : 'torre de hoje · toque para ouvir'
        : 'ainda não ouvida';
      card.innerHTML = `
        <div class="catalog-icon catalog-icon--swatch" style="--swatch:${fill}" aria-hidden="true">
          <span class="catalog-swatch"></span>
        </div>
        <p class="catalog-name">${name}</p>
        <p class="catalog-hint">${hint}</p>
      `;
      frag.appendChild(card);
    }
    this.grid.replaceChildren(frag);
  }

  private onGridClick(e: MouseEvent): void {
    if (this.tab !== 'textures') return;
    const card = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-material]');
    if (!card?.dataset.material) return;
    this.playTexture(card.dataset.material as MaterialId);
  }

  private onGridKeydown(e: KeyboardEvent): void {
    if (this.tab !== 'textures') return;
    if (e.code !== 'Enter' && e.code !== 'Space') return;
    const card = (e.target as HTMLElement | null)?.closest<HTMLElement>('[data-material]');
    if (!card?.dataset.material) return;
    e.preventDefault();
    this.playTexture(card.dataset.material as MaterialId);
  }

  private playTexture(id: MaterialId): void {
    if (!this.audio || !MATERIALS[id]) return;
    void this.audio.unlock().then(() => {
      this.audio?.playLand(id, false, 0, 1);
    });
  }

  private openPanel(): void {
    this.renderGrid();
    this.open = true;
    this.root.classList.remove('hidden');
    this.root.setAttribute('aria-hidden', 'false');
    this.btnOpen.classList.add('is-open');
    this.btnOpen.setAttribute('aria-expanded', 'true');
    this.onOverlayChange?.(true);
    this.btnClose.focus();
  }

  close(): void {
    if (!this.open) return;
    this.open = false;
    this.root.classList.add('hidden');
    this.root.setAttribute('aria-hidden', 'true');
    this.btnOpen.classList.remove('is-open');
    this.btnOpen.setAttribute('aria-expanded', 'false');
    this.onOverlayChange?.(false);
    this.btnOpen.focus();
  }
}
