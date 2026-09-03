import { SHOP_ITEMS, type ShopItemId } from '../game/shop/catalog';
import { drawShopItemIcon } from '../game/shop/runGearVisual';
import { loadoutFromPick, sanitizeLoadout, stockLoadout } from '../game/shop/runGear';
import type { GearLoadout } from '../game/shop/runGear';
import { enablePixelMode } from '../theme/pixel';

export class TitleGearPick {
  private root: HTMLElement;
  private backdrop: HTMLButtonElement;
  private list: HTMLElement;
  private btnConfirm: HTMLButtonElement;
  private btnSkip: HTMLButtonElement;
  private titleEl: HTMLElement;
  private open = false;
  private picked: ShopItemId | null = null;
  private onConfirm: ((loadout: GearLoadout) => void) | null = null;
  private onCancel: (() => void) | null = null;

  constructor(private onOverlayChange?: (open: boolean) => void) {
    this.root = document.getElementById('title-gear-pick')!;
    this.backdrop = document.getElementById('title-gear-pick-backdrop') as HTMLButtonElement;
    this.list = document.getElementById('gear-pick-list')!;
    this.btnConfirm = document.getElementById('btn-gear-pick-go') as HTMLButtonElement;
    this.btnSkip = document.getElementById('btn-gear-pick-skip') as HTMLButtonElement;
    this.titleEl = document.getElementById('gear-pick-title')!;

    this.backdrop.addEventListener('click', () => this.cancel());
    this.btnSkip.addEventListener('click', () => this.cancel());
    this.btnConfirm.addEventListener('click', () => this.confirm());
    this.list.addEventListener('click', (e) => this.onListClick(e));

    window.addEventListener('keydown', (e) => {
      if (!this.open) return;
      if (e.code === 'Escape') {
        e.preventDefault();
        this.cancel();
        return;
      }
      if (e.code === 'Enter') {
        e.preventDefault();
        this.confirm();
      }
    });
  }

  isOpen(): boolean {
    return this.open;
  }

  prompt(onConfirm: (loadout: GearLoadout) => void, onCancel?: () => void): void {
    this.onConfirm = onConfirm;
    this.onCancel = onCancel ?? null;
    this.picked = null;
    const owned = stockLoadout();
    for (const item of SHOP_ITEMS) {
      if (owned[item.id]) {
        this.picked = item.id;
        break;
      }
    }
    this.btnConfirm.textContent = 'jogar';
    this.titleEl.textContent = 'Escolha 1 item';
    this.render();
    this.open = true;
    this.root.classList.remove('hidden');
    this.root.setAttribute('aria-hidden', 'false');
    this.onOverlayChange?.(true);
    this.btnConfirm.focus();
  }

  close(): void {
    if (!this.open) return;
    this.open = false;
    this.root.classList.add('hidden');
    this.root.setAttribute('aria-hidden', 'true');
    this.onOverlayChange?.(false);
    this.onConfirm = null;
    this.onCancel = null;
  }

  private cancel(): void {
    const cb = this.onCancel;
    this.close();
    cb?.();
  }

  private confirm(): void {
    const loadout = sanitizeLoadout(loadoutFromPick(this.picked));
    const cb = this.onConfirm;
    this.close();
    cb?.(loadout);
  }

  private onListClick(e: Event): void {
    const btn = (e.target as HTMLElement).closest('[data-gear]') as HTMLElement | null;
    if (!btn || btn.hasAttribute('disabled')) return;
    const id = btn.getAttribute('data-gear') as ShopItemId | null;
    if (!id) return;

    if (this.picked === id) {
      this.picked = null;
    } else if (this.picked == null) {
      this.picked = id;
    } else {
      // Já tem 1 selecionado — precisa desmarcar antes de escolher outro.
      return;
    }
    this.render();
  }

  private render(): void {
    const owned = stockLoadout();
    const frag = document.createDocumentFragment();
    for (const item of SHOP_ITEMS) {
      if (!owned[item.id]) continue;
      const on = this.picked === item.id;
      const lockedOut = this.picked != null && !on;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `gear-pick-card${on ? ' is-on' : ''}${lockedOut ? ' is-locked' : ''}`;
      btn.dataset.gear = item.id;
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (lockedOut) {
        btn.disabled = true;
        btn.setAttribute('aria-disabled', 'true');
      }
      btn.setAttribute(
        'aria-label',
        on
          ? `${item.name}, selecionado · toque para desmarcar`
          : lockedOut
            ? `${item.name}, desmarque o outro primeiro`
            : item.name,
      );

      const canvas = document.createElement('canvas');
      canvas.className = 'gear-pick-icon';
      canvas.width = 64;
      canvas.height = 64;
      canvas.setAttribute('aria-hidden', 'true');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        enablePixelMode(ctx);
        ctx.clearRect(0, 0, 64, 64);
        drawShopItemIcon(ctx, item.id, 64);
      }

      const name = document.createElement('span');
      name.className = 'gear-pick-name';
      name.textContent = item.name;

      const mark = document.createElement('span');
      mark.className = 'gear-pick-mark';
      mark.textContent = on ? '●' : '';
      mark.setAttribute('aria-hidden', 'true');

      btn.append(canvas, name, mark);
      frag.append(btn);
    }
    this.list.replaceChildren(frag);
  }
}
