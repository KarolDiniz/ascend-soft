import { SHOP_ITEMS, type ShopItemId } from '../game/shop/catalog';
import { drawShopItemIcon } from '../game/shop/runGearVisual';
import { loadWallet, stockOf, tryBuy } from '../game/shop/wallet';
import { achievementTracker } from '../game/achievements/tracker';
import type { AudioBus } from '../audio/AudioBus';
import { enablePixelMode } from '../theme/pixel';

export class TitleShop {
  private root: HTMLElement;
  private btnOpen: HTMLButtonElement;
  private btnClose: HTMLButtonElement;
  private backdrop: HTMLButtonElement;
  private list: HTMLElement;
  private walletEl: HTMLElement;
  private walletCountEl: HTMLElement;
  private statusEl: HTMLElement;
  private countEl: HTMLElement;
  private open = false;

  constructor(
    private onOverlayChange?: (open: boolean) => void,
    private audio?: AudioBus,
  ) {
    this.root = document.getElementById('title-shop')!;
    this.btnOpen = document.getElementById('btn-shop') as HTMLButtonElement;
    this.btnClose = document.getElementById('btn-shop-close') as HTMLButtonElement;
    this.backdrop = document.getElementById('title-shop-backdrop') as HTMLButtonElement;
    this.list = document.getElementById('shop-list')!;
    this.walletEl = document.getElementById('shop-wallet')!;
    this.walletCountEl = document.getElementById('shop-wallet-count')!;
    this.statusEl = document.getElementById('shop-status')!;
    this.countEl = document.getElementById('shop-fab-count')!;

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

  show(): void {
    if (!this.open) this.openPanel();
  }

  refresh(): void {
    this.syncWallet();
    if (this.open) this.renderList();
  }

  close(): void {
    if (!this.open) return;
    this.open = false;
    this.root.classList.add('hidden');
    this.root.setAttribute('aria-hidden', 'true');
    this.btnOpen.setAttribute('aria-expanded', 'false');
    this.onOverlayChange?.(false);
  }

  private openPanel(): void {
    if (this.open) return;
    this.open = true;
    achievementTracker.noteShopOpen();
    this.statusEl.textContent = '';
    this.root.classList.remove('hidden');
    this.root.setAttribute('aria-hidden', 'false');
    this.btnOpen.setAttribute('aria-expanded', 'true');
    this.renderList();
    this.syncWallet();
    this.onOverlayChange?.(true);
    this.btnClose.focus();
  }

  private syncWallet(): void {
    const w = loadWallet();
    const n = String(w.coins);
    this.walletCountEl.textContent = n;
    this.walletEl.setAttribute('aria-label', `Moedas: ${w.coins}`);
    this.countEl.textContent = n;
    this.countEl.classList.remove('hidden');
    this.btnOpen.setAttribute('aria-label', `Loja, ${w.coins} moedas`);
  }

  private onListClick(e: Event): void {
    const btn = (e.target as HTMLElement).closest('[data-buy]') as HTMLElement | null;
    if (!btn) return;
    const id = btn.getAttribute('data-buy') as ShopItemId | null;
    if (!id) return;
    const result = tryBuy(id);
    if (result === 'poor') {
      this.statusEl.textContent = 'faltam moedas';
      return;
    }
    if (result === 'full') {
      this.statusEl.textContent = 'já tá cheio';
      return;
    }
    this.statusEl.textContent = 'item comprado!';
    void this.audio?.unlock().then(() => this.audio?.playShopPurchase());
    achievementTracker.noteShopPurchase();
    this.renderList();
    this.syncWallet();
    this.onPurchased?.();
  }

  onPurchased: (() => void) | null = null;

  private renderList(): void {
    const w = loadWallet();
    const frag = document.createDocumentFragment();
    for (const item of SHOP_ITEMS) {
      const have = stockOf(item.id);
      const poor = w.coins < item.price;
      const row = document.createElement('div');
      row.className = 'shop-row';

      const canvas = document.createElement('canvas');
      canvas.className = 'shop-row-icon';
      canvas.width = 56;
      canvas.height = 56;
      canvas.setAttribute('aria-hidden', 'true');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        enablePixelMode(ctx);
        ctx.clearRect(0, 0, 56, 56);
        drawShopItemIcon(ctx, item.id, 56);
      }

      const copy = document.createElement('div');
      copy.className = 'shop-row-copy';
      const name = document.createElement('p');
      name.className = 'shop-row-name';
      name.textContent = have > 0 ? `${item.name} ×${have}` : item.name;
      const hint = document.createElement('p');
      hint.className = 'shop-row-hint';
      hint.textContent = item.hint;
      copy.append(name, hint);

      const buy = document.createElement('button');
      buy.type = 'button';
      buy.className = 'shop-buy';
      buy.dataset.buy = item.id;
      buy.textContent = String(item.price);
      buy.disabled = poor || have >= 9;
      buy.setAttribute('aria-label', `Comprar ${item.name} por ${item.price}`);

      row.append(canvas, copy, buy);
      frag.append(row);
    }
    this.list.replaceChildren(frag);
  }
}
