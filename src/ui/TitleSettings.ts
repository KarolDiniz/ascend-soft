import type { Game } from '../game/Game';
import { loadLightMode } from '../game/GameSettings';

/** Painel de configurações na tela inicial */
export class TitleSettings {
  private root: HTMLElement;
  private btnOpen: HTMLButtonElement;
  private btnClose: HTMLButtonElement;
  private backdrop: HTMLButtonElement;
  private lightMode: HTMLInputElement;
  private open = false;

  constructor(private game: Game) {
    this.root = document.getElementById('title-settings')!;
    this.btnOpen = document.getElementById('btn-settings') as HTMLButtonElement;
    this.btnClose = document.getElementById('btn-settings-close') as HTMLButtonElement;
    this.backdrop = document.getElementById('title-settings-backdrop') as HTMLButtonElement;
    this.lightMode = document.getElementById('light-mode') as HTMLInputElement;

    this.lightMode.checked = loadLightMode();
    this.lightMode.addEventListener('change', () => {
      this.game.setLightMode(this.lightMode.checked);
    });

    this.btnOpen.addEventListener('click', () => this.toggle());
    this.btnClose.addEventListener('click', () => this.close());
    this.backdrop.addEventListener('click', () => this.close());

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.open) {
        e.preventDefault();
        this.close();
      }
    });
  }

  isOpen(): boolean {
    return this.open;
  }

  toggle(): void {
    if (this.open) this.close();
    else this.openPanel();
  }

  private openPanel(): void {
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
