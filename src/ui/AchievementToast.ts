import type { AchievementDef } from '../game/achievements/definitions';
import { paintAchievementIcon } from './AchievementIcon';

const SHOW_MS = 4200;

export class AchievementToast {
  private root: HTMLElement;
  private canvas: HTMLCanvasElement;
  private titleEl: HTMLElement;
  private hintEl: HTMLElement;
  private queue: AchievementDef[] = [];
  private showing = false;
  private hideTimer = 0;

  constructor() {
    this.root = document.getElementById('achievement-toast')!;
    this.canvas = document.getElementById('achievement-toast-icon') as HTMLCanvasElement;
    this.titleEl = document.getElementById('achievement-toast-title')!;
    this.hintEl = document.getElementById('achievement-toast-hint')!;
  }

  enqueue(def: AchievementDef): void {
    this.queue.push(def);
    if (!this.showing) this.showNext();
  }

  private showNext(): void {
    const def = this.queue.shift();
    if (!def) {
      this.showing = false;
      return;
    }
    this.showing = true;
    paintAchievementIcon(this.canvas, def.icon);
    this.titleEl.textContent = def.title;
    this.hintEl.textContent = def.hint;
    this.root.classList.remove('hidden', 'achievement-toast-out');
    this.root.classList.add('achievement-toast-in');

    window.clearTimeout(this.hideTimer);
    this.hideTimer = window.setTimeout(() => {
      this.root.classList.remove('achievement-toast-in');
      this.root.classList.add('achievement-toast-out');
      window.setTimeout(() => {
        this.root.classList.add('hidden');
        this.root.classList.remove('achievement-toast-out');
        this.showNext();
      }, 320);
    }, SHOW_MS);
  }
}
