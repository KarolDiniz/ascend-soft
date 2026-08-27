export class Hud {
  private root: HTMLElement;
  private heightEl: HTMLElement;
  private bestEl: HTMLElement;
  private breathsEl: HTMLElement;
  private streakEl: HTMLElement;
  private titleScreen: HTMLElement;
  private titleBestEl: HTMLElement;
  private fallScreen: HTMLElement;
  private fallScore: HTMLElement;
  private muteBtn: HTMLElement;
  private toastEl: HTMLElement;
  private toastPhaseEl: HTMLElement;
  private toastQuoteEl: HTMLElement;
  private phaseStripEl: HTMLElement;
  private phaseStripNameEl: HTMLElement;
  private toastTimer = 0;
  private leaveTimer = 0;

  constructor() {
    this.root = document.getElementById('hud')!;
    this.heightEl = document.getElementById('hud-height')!;
    this.bestEl = document.getElementById('hud-best')!;
    this.breathsEl = document.getElementById('hud-breaths')!;
    this.streakEl = document.getElementById('hud-streak')!;
    this.titleScreen = document.getElementById('title-screen')!;
    this.titleBestEl = document.getElementById('title-best')!;
    this.fallScreen = document.getElementById('fall-screen')!;
    this.fallScore = document.getElementById('fall-score')!;
    this.muteBtn = document.getElementById('btn-mute')!;
    this.toastEl = document.getElementById('material-toast')!;
    this.toastPhaseEl = document.getElementById('toast-phase')!;
    this.toastQuoteEl = document.getElementById('toast-quote')!;
    this.phaseStripEl = document.getElementById('phase-strip')!;
    this.phaseStripNameEl = document.getElementById('phase-strip-name')!;
  }

  showTitle(best: number): void {
    window.clearTimeout(this.leaveTimer);
    this.titleScreen.classList.remove('hidden', 'is-leaving');
    this.fallScreen.classList.add('hidden');
    this.root.classList.add('hidden');
    this.phaseStripEl.classList.add('hidden');
    document.getElementById('app')?.classList.add('is-title');
    this.setTitleBest(best);
  }

  leaveTitle(onDone: () => void): void {
    if (this.titleScreen.classList.contains('hidden')) {
      onDone();
      return;
    }
    if (this.titleScreen.classList.contains('is-leaving')) return;
    this.titleScreen.classList.add('is-leaving');
    window.clearTimeout(this.leaveTimer);
    this.leaveTimer = window.setTimeout(() => {
      this.titleScreen.classList.add('hidden');
      this.titleScreen.classList.remove('is-leaving');
      document.getElementById('app')?.classList.remove('is-title');
      onDone();
    }, 280);
  }

  isTitleVisible(): boolean {
    return !this.titleScreen.classList.contains('hidden');
  }

  isFallVisible(): boolean {
    return !this.fallScreen.classList.contains('hidden');
  }

  private setTitleBest(best: number): void {
    if (best > 0) {
      this.titleBestEl.textContent = `melhor ${best}`;
      this.titleBestEl.classList.remove('hidden');
    } else {
      this.titleBestEl.classList.add('hidden');
    }
  }

  showPlaying(best: number): void {
    window.clearTimeout(this.leaveTimer);
    this.titleScreen.classList.add('hidden');
    this.titleScreen.classList.remove('is-leaving');
    document.getElementById('app')?.classList.remove('is-title');
    this.fallScreen.classList.add('hidden');
    this.root.classList.remove('hidden');
    this.phaseStripEl.classList.remove('hidden');
    this.bestEl.textContent = String(best);
    this.heightEl.textContent = '0';
    this.breathsEl.textContent = '0';
    this.streakEl.textContent = '';
    this.streakEl.classList.add('hidden');
  }

  showFall(height: number, best: number): void {
    this.fallScreen.classList.remove('hidden');
    this.phaseStripEl.classList.add('hidden');
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

  /** Faixa persistente com o mundo atual */
  setPhaseStrip(name: string, accent: string): void {
    this.phaseStripNameEl.textContent = name;
    this.phaseStripEl.style.setProperty('--phase-accent', accent);
  }

  /** Sincroniza cor da borda da página com a fase */
  setAmbientColors(top: string, mid: string): void {
    document.documentElement.style.setProperty('--bg-a', top);
    document.documentElement.style.setProperty('--bg-b', mid);
  }

  showMaterialToast(name: string): void {
    this.showPhaseToast(name, '');
  }

  /** Toast de entrada de fase: nome + frase motivacional */
  showPhaseToast(phaseName: string, quote: string): void {
    this.toastPhaseEl.textContent = phaseName;
    this.toastQuoteEl.textContent = quote;
    this.toastQuoteEl.classList.toggle('hidden', !quote);
    this.toastEl.classList.remove('hidden', 'toast-out');
    this.toastEl.classList.add('toast-in');
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => {
      this.toastEl.classList.remove('toast-in');
      this.toastEl.classList.add('toast-out');
      window.setTimeout(() => this.toastEl.classList.add('hidden'), 450);
    }, quote ? 3200 : 1400);
  }

  setMuteLabel(muted: boolean): void {
    this.muteBtn.textContent = muted ? 'Mudo' : 'Som';
    this.muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
  }
}
