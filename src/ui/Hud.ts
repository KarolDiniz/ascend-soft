export class Hud {
  private root: HTMLElement;
  private heightEl: HTMLElement;
  private bestEl: HTMLElement;
  private breathsEl: HTMLElement;
  private streakEl: HTMLElement;
  private titleScreen: HTMLElement;
  private fallScreen: HTMLElement;
  private fallScore: HTMLElement;
  private muteBtn: HTMLElement;
  private toastEl: HTMLElement;
  private toastTimer = 0;

  constructor() {
    this.root = document.getElementById('hud')!;
    this.heightEl = document.getElementById('hud-height')!;
    this.bestEl = document.getElementById('hud-best')!;
    this.breathsEl = document.getElementById('hud-breaths')!;
    this.streakEl = document.getElementById('hud-streak')!;
    this.titleScreen = document.getElementById('title-screen')!;
    this.fallScreen = document.getElementById('fall-screen')!;
    this.fallScore = document.getElementById('fall-score')!;
    this.muteBtn = document.getElementById('btn-mute')!;
    this.toastEl = document.getElementById('material-toast')!;
  }

  showTitle(): void {
    this.titleScreen.classList.remove('hidden');
    this.fallScreen.classList.add('hidden');
    this.root.classList.add('hidden');
  }

  showPlaying(best: number): void {
    this.titleScreen.classList.add('hidden');
    this.fallScreen.classList.add('hidden');
    this.root.classList.remove('hidden');
    this.bestEl.textContent = String(best);
    this.heightEl.textContent = '0';
    this.breathsEl.textContent = '0';
    this.streakEl.textContent = '';
    this.streakEl.classList.add('hidden');
  }

  showFall(height: number, best: number): void {
    this.fallScreen.classList.remove('hidden');
    this.fallScore.innerHTML = `<span class="fall-height">${height}</span><span class="fall-meta">melhor ${best}</span>`;
  }

  update(height: number, best: number, breaths: number, streak = 0): void {
    this.heightEl.textContent = String(height);
    this.bestEl.textContent = String(best);
    this.breathsEl.textContent = String(breaths);
    if (streak >= 2) {
      this.streakEl.classList.remove('hidden');
      this.streakEl.textContent = `${streak}× perfeito`;
    } else {
      this.streakEl.classList.add('hidden');
    }
  }

  showMaterialToast(name: string): void {
    this.toastEl.textContent = name;
    this.toastEl.classList.remove('hidden', 'toast-out');
    this.toastEl.classList.add('toast-in');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.toastEl.classList.remove('toast-in');
      this.toastEl.classList.add('toast-out');
      window.setTimeout(() => this.toastEl.classList.add('hidden'), 400);
    }, 1400);
  }

  setMuteLabel(muted: boolean): void {
    this.muteBtn.textContent = muted ? 'Som mudo' : 'Som ligado';
    this.muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
  }
}
