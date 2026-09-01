const STORAGE_KEY = 'ascend-soft-saw-controls';
const TOUCH_QUERY = '(pointer: coarse), (hover: none)';

function alreadySeen(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    /* ignore */
  }
}

function isTouchUi(): boolean {
  return window.matchMedia(TOUCH_QUERY).matches;
}

/**
 * Overlay de primeira partida — não bloqueia o jogo.
 * Mobile: três zonas da tela. PC: teclas.
 */
export class ControlsCoach {
  private root: HTMLElement;
  private hideTimer = 0;
  private shown = false;
  private onDismiss: (() => void) | null = null;

  constructor() {
    this.root = document.getElementById('controls-coach')!;
  }

  showIfNeeded(): void {
    if (this.shown || alreadySeen()) return;
    this.shown = true;

    const touch = isTouchUi();
    this.root.classList.toggle('is-touch', touch);
    this.root.classList.toggle('is-keys', !touch);
    this.root.classList.remove('hidden', 'is-out');
    this.root.hidden = false;
    this.root.setAttribute('aria-hidden', 'false');

    const reduced =
      document.documentElement.classList.contains('reduce-motion') ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ms = reduced ? 2200 : 3400;
    this.hideTimer = window.setTimeout(() => this.hide(), ms);

    this.onDismiss = () => this.hide();
    window.addEventListener('pointerdown', this.onDismiss, { passive: true });
    window.addEventListener('keydown', this.onDismiss);
  }

  hide(): void {
    if (!this.shown) return;
    if (this.root.classList.contains('hidden') || this.root.classList.contains('is-out')) {
      this.detach();
      return;
    }
    markSeen();
    this.detach();
    this.root.classList.add('is-out');
    window.setTimeout(() => {
      this.root.classList.add('hidden');
      this.root.hidden = true;
      this.root.setAttribute('aria-hidden', 'true');
    }, 280);
  }

  private detach(): void {
    window.clearTimeout(this.hideTimer);
    this.hideTimer = 0;
    if (this.onDismiss) {
      window.removeEventListener('pointerdown', this.onDismiss);
      window.removeEventListener('keydown', this.onDismiss);
      this.onDismiss = null;
    }
  }
}
