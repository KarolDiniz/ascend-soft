import { FallMascot } from './FallMascot';
import { FallTearsOverlay } from './FallTearsOverlay';
import { getFallCopy, getFallGapLabel, getFallSubmitMessage, type FallSummary } from './fallCopy';
import { ToastSpeaker } from './ToastSpeaker';
import { PHASE_TOAST_MS } from './toastConfig';
import type { AudioBus } from '../audio/AudioBus';

export class Hud {
  private root: HTMLElement;
  private heightEl: HTMLElement;
  private breathsEl: HTMLElement;
  private streakEl: HTMLElement;
  private titleScreen: HTMLElement;
  private fallScreen: HTMLElement;
  private fallEyebrow: HTMLElement;
  private fallTitle: HTMLElement;
  private fallSubtitle: HTMLElement;
  private fallStatHeight: HTMLElement;
  private fallStatBreaths: HTMLElement;
  private fallStatCollectibles: HTMLElement;
  private fallStatBest: HTMLElement;
  private fallGap: HTMLElement;
  private fallRank: HTMLElement;
  private titleDaily: HTMLElement | null;
  private titleDailyKicker: HTMLElement | null;
  private titleDailyName: HTMLElement | null;
  private titleDailyStreak: HTMLElement | null;
  private fallReturnHook: HTMLElement | null;
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
  private readonly titleLeaveMs = 550;
  private readonly titleLeaveMsReduced = 220;

  constructor(audio?: AudioBus) {
    this.root = document.getElementById('hud')!;
    this.heightEl = document.getElementById('hud-height')!;
    this.breathsEl = document.getElementById('hud-breaths')!;
    this.streakEl = document.getElementById('hud-streak')!;
    this.titleScreen = document.getElementById('title-screen')!;
    this.fallScreen = document.getElementById('fall-screen')!;
    this.fallEyebrow = document.getElementById('fall-eyebrow')!;
    this.fallTitle = document.getElementById('fall-title')!;
    this.fallSubtitle = document.getElementById('fall-subtitle')!;
    this.fallStatHeight = document.getElementById('fall-stat-height')!;
    this.fallStatBreaths = document.getElementById('fall-stat-breaths')!;
    this.fallStatCollectibles = document.getElementById('fall-stat-collectibles')!;
    this.fallStatBest = document.getElementById('fall-stat-best')!;
    this.fallGap = document.getElementById('fall-gap')!;
    this.fallRank = document.getElementById('fall-rank')!;
    this.titleDaily = document.getElementById('title-daily');
    this.titleDailyKicker = document.getElementById('title-daily-kicker');
    this.titleDailyName = document.getElementById('title-daily-name');
    this.titleDailyStreak = document.getElementById('title-daily-streak');
    this.fallReturnHook = document.getElementById('fall-return-hook');
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

  /** Callback quando a tela inicial aparece */
  onTitleShow: (() => void) | null = null;
  /** Callback quando a partida começa (HUD visível) */
  onPlayingShow: (() => void) | null = null;
  /** Callback quando overlay de queda aparece */
  onFallShow: (() => void) | null = null;

  showTitle(best: number, daily?: { kicker: string; name: string; streak: number }): void {
    void best;
    window.clearTimeout(this.leaveTimer);
    this.fallMascot.stop();
    this.fallTears.stop();
    if (this.titleDaily && this.titleDailyKicker && this.titleDailyName) {
      const hasDaily = Boolean(daily?.name);
      this.titleDailyKicker.textContent = daily?.kicker ?? '';
      this.titleDailyName.textContent = daily?.name ?? '';
      this.titleDaily.classList.toggle('hidden', !hasDaily);
      if (this.titleDailyStreak) {
        const showStreak = (daily?.streak ?? 0) >= 2;
        this.titleDailyStreak.textContent = showStreak ? `${daily!.streak}d` : '';
        this.titleDailyStreak.classList.toggle('hidden', !showStreak);
      }
      if (hasDaily && daily) {
        const streakBit = (daily.streak ?? 0) >= 2 ? ` · ${daily.streak} dias` : '';
        this.titleDaily.setAttribute('aria-label', `${daily.kicker} ${daily.name}${streakBit}`);
      }
    }
    this.titleScreen.classList.remove('hidden', 'is-leaving');
    this.fallScreen.classList.add('hidden');
    this.root.classList.add('hidden');
    document.getElementById('app')?.classList.add('is-title');
    this.onTitleShow?.();
  }

  leaveTitle(onStart: () => void): void {
    if (this.titleScreen.classList.contains('hidden')) {
      onStart();
      return;
    }
    if (this.titleScreen.classList.contains('is-leaving')) return;

    onStart();
    this.titleScreen.classList.add('is-leaving');
    window.clearTimeout(this.leaveTimer);
    const leaveMs = document.documentElement.classList.contains('reduce-motion')
      ? this.titleLeaveMsReduced
      : this.titleLeaveMs;
    this.leaveTimer = window.setTimeout(() => {
      this.titleScreen.classList.add('hidden');
      this.titleScreen.classList.remove('is-leaving');
    }, leaveMs);
  }

  /** HUD entra suavemente enquanto a tela inicial some. */
  preparePlaying(_best: number): void {
    window.clearTimeout(this.leaveTimer);
    this.fallMascot.stop();
    this.fallTears.stop();
    document.getElementById('app')?.classList.remove('is-title');
    this.fallScreen.classList.add('hidden');
    this.root.classList.remove('hidden');
    this.root.classList.remove('is-entering');
    void this.root.offsetWidth;
    this.root.classList.add('is-entering');
    this.heightEl.textContent = '0';
    this.breathsEl.textContent = '0';
    this.streakEl.textContent = '';
    this.streakEl.classList.add('hidden');
    this.onPlayingShow?.();
    window.setTimeout(() => this.root.classList.remove('is-entering'), 650);
  }

  isTitleVisible(): boolean {
    return !this.titleScreen.classList.contains('hidden');
  }

  isFallVisible(): boolean {
    return !this.fallScreen.classList.contains('hidden');
  }

  showPlaying(_best: number): void {
    window.clearTimeout(this.leaveTimer);
    this.fallMascot.stop();
    this.fallTears.stop();
    this.titleScreen.classList.add('hidden');
    this.titleScreen.classList.remove('is-leaving');
    document.getElementById('app')?.classList.remove('is-title');
    this.fallScreen.classList.add('hidden');
    this.root.classList.remove('hidden');
    this.heightEl.textContent = '0';
    this.breathsEl.textContent = '0';
    this.streakEl.textContent = '';
    this.streakEl.classList.add('hidden');
    this.onPlayingShow?.();
  }

  showFall(summary: FallSummary): void {
    const copy = getFallCopy(summary);
    this.fallEyebrow.textContent = copy.eyebrow;
    this.fallTitle.textContent = copy.title;
    this.fallSubtitle.textContent = copy.subtitle;
    this.fallStatHeight.textContent = String(summary.height);
    this.fallStatBreaths.textContent = String(summary.breaths);
    this.fallStatCollectibles.textContent = String(summary.collectibles);
    this.fallStatBest.textContent = String(summary.best);

    const gapLabel = getFallGapLabel(summary);
    if (gapLabel) {
      this.fallGap.textContent = gapLabel;
      this.fallGap.classList.remove('hidden');
      this.fallGap.classList.toggle('fall-gap--record', gapLabel === 'recorde!');
    } else {
      this.fallGap.classList.add('hidden');
    }

    this.applyFallRank(summary);

    if (this.fallReturnHook) {
      const hook = summary.returnHook ?? '';
      this.fallReturnHook.textContent = hook;
      this.fallReturnHook.classList.toggle('hidden', !hook);
    }

    this.fallScreen.classList.remove('hidden');
    this.fallScreen.classList.add('is-entering');
    this.onFallShow?.();
    window.setTimeout(() => this.fallScreen.classList.remove('is-entering'), 500);
    this.fallMascot.start(summary.height);
    window.setTimeout(() => this.fallTears.start(), 120);

    const muted = this.audio?.isMuted ?? false;
    const voiceOn = this.audio?.isVoiceEnabled ?? true;
    if (voiceOn && !muted) {
      window.setTimeout(() => this.audio?.playFallWhimper(), 180);
    }
  }

  /** Atualiza rank/erro depois que o submit termina — não reinicia a tela de queda. */
  patchFallRank(summary: FallSummary): void {
    if (this.fallScreen.classList.contains('hidden')) return;
    this.applyFallRank(summary);
  }

  private applyFallRank(summary: FallSummary): void {
    if (summary.globalRank != null && summary.globalRank > 0) {
      const scope = summary.globalMode === 'local' ? 'local' : 'global';
      this.fallRank.textContent = `#${summary.globalRank} no ranking ${scope}`;
      this.fallRank.classList.remove('hidden', 'fall-rank--error');
      return;
    }
    if (summary.submitError) {
      this.fallRank.textContent = getFallSubmitMessage(summary.submitError);
      this.fallRank.classList.add('fall-rank--error');
      this.fallRank.classList.remove('hidden');
      return;
    }
    this.fallRank.classList.add('hidden');
    this.fallRank.classList.remove('fall-rank--error');
  }

  update(height: number, _best: number, breaths: number, streak = 0): void {
    this.heightEl.textContent = String(height);
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
