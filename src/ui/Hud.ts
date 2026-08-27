import { FallMascot } from './FallMascot';
import { FallTearsOverlay } from './FallTearsOverlay';
import { getFallCopy, getFallGapLabel, type FallSummary } from './fallCopy';
import { ToastSpeaker } from './ToastSpeaker';
import { PHASE_TOAST_MS } from './toastConfig';
import type { AudioBus } from '../audio/AudioBus';

export class Hud {
  private root: HTMLElement;
  private heightEl: HTMLElement;
  private bestEl: HTMLElement;
  private breathsEl: HTMLElement;
  private streakEl: HTMLElement;
  private titleScreen: HTMLElement;
  private titleBestEl: HTMLElement;
  private fallScreen: HTMLElement;
  private fallEyebrow: HTMLElement;
  private fallTitle: HTMLElement;
  private fallSubtitle: HTMLElement;
  private fallStatHeight: HTMLElement;
  private fallStatBreaths: HTMLElement;
  private fallStatBest: HTMLElement;
  private fallGap: HTMLElement;
  private muteBtn: HTMLElement;
  private toastEl: HTMLElement;
  private toastPhaseEl: HTMLElement;
  private toastQuoteEl: HTMLElement;
  private speaker: ToastSpeaker;
  private fallMascot: FallMascot;
  private fallTears: FallTearsOverlay;
  private audio: AudioBus | null = null;
  private toastTimer = 0;
  private toastLiveTimer = 0;
  private leaveTimer = 0;
  private readonly toastDuration = PHASE_TOAST_MS;

  constructor(audio?: AudioBus) {
    this.root = document.getElementById('hud')!;
    this.heightEl = document.getElementById('hud-height')!;
    this.bestEl = document.getElementById('hud-best')!;
    this.breathsEl = document.getElementById('hud-breaths')!;
    this.streakEl = document.getElementById('hud-streak')!;
    this.titleScreen = document.getElementById('title-screen')!;
    this.titleBestEl = document.getElementById('title-best')!;
    this.fallScreen = document.getElementById('fall-screen')!;
    this.fallEyebrow = document.getElementById('fall-eyebrow')!;
    this.fallTitle = document.getElementById('fall-title')!;
    this.fallSubtitle = document.getElementById('fall-subtitle')!;
    this.fallStatHeight = document.getElementById('fall-stat-height')!;
    this.fallStatBreaths = document.getElementById('fall-stat-breaths')!;
    this.fallStatBest = document.getElementById('fall-stat-best')!;
    this.fallGap = document.getElementById('fall-gap')!;
    this.muteBtn = document.getElementById('btn-mute')!;
    this.toastEl = document.getElementById('material-toast')!;
    this.toastPhaseEl = document.getElementById('toast-phase')!;
    this.toastQuoteEl = document.getElementById('toast-quote')!;
    this.speaker = new ToastSpeaker();
    this.fallMascot = new FallMascot();
    this.fallTears = new FallTearsOverlay(this.fallMascot);
    this.audio = audio ?? null;
    this.toastEl.style.setProperty('--toast-duration', `${PHASE_TOAST_MS}ms`);
  }

  showTitle(best: number): void {
    window.clearTimeout(this.leaveTimer);
    this.fallMascot.stop();
    this.fallTears.stop();
    this.titleScreen.classList.remove('hidden', 'is-leaving');
    this.fallScreen.classList.add('hidden');
    this.root.classList.add('hidden');
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
    this.fallMascot.stop();
    this.fallTears.stop();
    this.titleScreen.classList.add('hidden');
    this.titleScreen.classList.remove('is-leaving');
    document.getElementById('app')?.classList.remove('is-title');
    this.fallScreen.classList.add('hidden');
    this.root.classList.remove('hidden');
    this.bestEl.textContent = String(best);
    this.heightEl.textContent = '0';
    this.breathsEl.textContent = '0';
    this.streakEl.textContent = '';
    this.streakEl.classList.add('hidden');
  }

  showFall(summary: FallSummary): void {
    const copy = getFallCopy(summary);
    this.fallEyebrow.textContent = copy.eyebrow;
    this.fallTitle.textContent = copy.title;
    this.fallSubtitle.textContent = copy.subtitle;
    this.fallStatHeight.textContent = String(summary.height);
    this.fallStatBreaths.textContent = String(summary.breaths);
    this.fallStatBest.textContent = String(summary.best);

    const gapLabel = getFallGapLabel(summary);
    if (gapLabel) {
      this.fallGap.textContent = gapLabel;
      this.fallGap.classList.remove('hidden');
      this.fallGap.classList.toggle('fall-gap--record', gapLabel === 'recorde!');
    } else {
      this.fallGap.classList.add('hidden');
    }

    this.fallScreen.classList.remove('hidden');
    this.fallScreen.classList.add('is-entering');
    window.setTimeout(() => this.fallScreen.classList.remove('is-entering'), 500);
    this.fallMascot.start();
    window.setTimeout(() => this.fallTears.start(), 120);

    const muted = this.audio?.isMuted ?? false;
    const voiceOn = this.audio?.isVoiceEnabled ?? true;
    if (voiceOn && !muted) {
      window.setTimeout(() => this.audio?.playFallWhimper(), 180);
    }
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

  /** Sincroniza cor da borda da página com a fase */
  setAmbientColors(top: string, mid: string): void {
    document.documentElement.style.setProperty('--bg-a', top);
    document.documentElement.style.setProperty('--bg-b', mid);
  }

  /** Banner pixelado: nome da fase + reflexão */
  showPhaseToast(phaseName: string, quote: string, accent?: string): void {
    if (!quote) return;
    if (accent) this.toastEl.style.setProperty('--quote-accent', accent);

    this.toastPhaseEl.textContent = phaseName;
    this.toastQuoteEl.textContent = quote;
    this.toastEl.setAttribute('aria-label', `${phaseName}: ${quote}`);
    this.toastEl.classList.remove('hidden', 'toast-out', 'toast-live', 'toast-active');
    this.toastEl.classList.add('toast-in', 'toast-active');

    const muted = this.audio?.isMuted ?? false;
    const voiceOn = this.audio?.isVoiceEnabled ?? true;
    if (voiceOn && !muted) {
      this.speaker.start(this.toastDuration);
      this.audio?.playCreatureSpeech(quote, this.toastDuration, (open) =>
        this.speaker.setMouthOpen(open),
      );
    } else {
      this.speaker.stop();
      this.audio?.stopSoftMurmur();
    }

    window.clearTimeout(this.toastTimer);
    window.clearTimeout(this.toastLiveTimer);
    this.toastLiveTimer = window.setTimeout(() => {
      this.toastEl.classList.remove('toast-in');
      this.toastEl.classList.add('toast-live');
    }, 420);

    this.toastTimer = window.setTimeout(() => {
      this.speaker.stop();
      this.audio?.stopSoftMurmur();
      this.toastEl.classList.remove('toast-live');
      this.toastEl.classList.add('toast-out');
      window.setTimeout(() => this.toastEl.classList.add('hidden'), 500);
      this.toastEl.classList.remove('toast-active');
    }, this.toastDuration);
  }

  setMuteLabel(muted: boolean): void {
    this.muteBtn.textContent = muted ? 'Mudo' : 'Som';
    this.muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
  }
}
