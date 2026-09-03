import { FallMascot } from './FallMascot';
import { FallTearsOverlay } from './FallTearsOverlay';
import { getFallCopy, getFallGapLabel, getFallSubmitMessage, type FallSummary } from './fallCopy';
import { ToastSpeaker } from './ToastSpeaker';
import { PHASE_TOAST_MS } from './toastConfig';
import { isTextEntryTarget } from '../game/Input';
import { GEAR, type RunGear } from '../game/shop/runGear';
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
  private fallWallet: HTMLElement | null;
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
  private runGearEl: HTMLElement;
  private jetBar: HTMLElement;
  private jetFill: HTMLElement;
  private potionBtn: HTMLButtonElement;
  private potionTimer: HTMLElement;
  private potionFill: HTMLElement;
  private hatRow: HTMLElement;
  private hatBtn: HTMLButtonElement;
  private hatSecs: HTMLElement;
  private hatTimer: HTMLElement;
  private hatFill: HTMLElement;
  private lastJetRatio = -1;
  private lastHatSecs = -1;
  onPotionDrink: (() => void) | null = null;
  onHatWear: (() => void) | null = null;

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
    this.fallWallet = document.getElementById('fall-wallet');
    this.muteBtn = document.getElementById('btn-mute')!;
    this.toastEl = document.getElementById('material-toast')!;
    this.toastPhaseEl = document.getElementById('toast-phase')!;
    this.toastQuoteEl = document.getElementById('toast-quote')!;
    this.speaker = new ToastSpeaker();
    this.fallMascot = new FallMascot();
    this.fallTears = new FallTearsOverlay(this.fallMascot);
    this.audio = audio ?? null;
    this.toastEl.style.setProperty('--toast-duration', `${PHASE_TOAST_MS}ms`);
    this.runGearEl = document.getElementById('run-gear')!;
    this.jetBar = document.getElementById('jet-bar')!;
    this.jetFill = document.getElementById('jet-fill')!;
    this.potionBtn = document.getElementById('btn-potion') as HTMLButtonElement;
    this.potionTimer = document.getElementById('potion-timer')!;
    this.potionFill = document.getElementById('potion-fill')!;
    this.hatRow = document.getElementById('hat-row')!;
    this.hatBtn = document.getElementById('btn-hat') as HTMLButtonElement;
    this.hatSecs = document.getElementById('hat-secs')!;
    this.hatTimer = document.getElementById('hat-timer')!;
    this.hatFill = document.getElementById('hat-fill')!;
    this.potionBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.onPotionDrink?.();
    });
    this.hatBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.onHatWear?.();
    });
    window.addEventListener('keydown', (e) => {
      if (isTextEntryTarget(e.target)) return;
      if (this.root.classList.contains('hidden')) return;
      if (e.code === 'KeyE' || e.code === 'KeyQ') {
        e.preventDefault();
        this.onPotionDrink?.();
        return;
      }
      if (e.code === 'KeyR') {
        e.preventDefault();
        this.onHatWear?.();
      }
    });
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
    document.getElementById('app')?.classList.remove('is-playing');
    this.hideRunGear();
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
    document.getElementById('app')?.classList.add('is-playing');
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
    document.getElementById('app')?.classList.add('is-playing');
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
    if (this.fallWallet) {
      this.fallWallet.textContent = `bolso ${summary.pocketCoins ?? 0}`;
    }

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
    document.getElementById('app')?.classList.remove('is-playing');
    this.hideRunGear();
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
    const rank = summary.weeklyRank ?? summary.globalRank;
    if (rank != null && rank > 0) {
      const scope =
        summary.weeklyRank != null && summary.weeklyRank > 0
          ? 'semanal'
          : summary.globalMode === 'local'
            ? 'local'
            : 'global';
      this.fallRank.textContent = `#${rank} no ranking ${scope}`;
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

  hideRunGear(): void {
    this.runGearEl.classList.add('hidden');
    this.jetBar.classList.add('hidden');
    this.potionBtn.classList.add('hidden');
    this.potionTimer.classList.add('hidden');
    this.hatRow.classList.add('hidden');
    this.hatBtn.classList.add('hidden');
    this.hatTimer.classList.add('hidden');
    this.lastJetRatio = -1;
    this.lastHatSecs = -1;
    this.potionFill.style.transform = 'scaleX(1)';
    this.hatFill.style.transform = 'scaleX(1)';
  }

  syncRunGear(gear: RunGear): void {
    const jet = gear.jetFuel > 0;
    const potionBtn = gear.potionReady && !gear.potionActive;
    const potionT = gear.potionActive;
    const hatBtn = gear.hatReady && !gear.hatWorn;
    const hatOn = gear.hatWorn;
    const hatRow = hatBtn || hatOn;
    const any = jet || potionBtn || potionT || hatRow;
    this.runGearEl.classList.toggle('hidden', !any);
    this.jetBar.classList.toggle('hidden', !jet);
    this.potionBtn.classList.toggle('hidden', !potionBtn);
    this.potionTimer.classList.toggle('hidden', !potionT);
    this.hatRow.classList.toggle('hidden', !hatRow);
    this.hatBtn.classList.toggle('hidden', !hatBtn);
    this.hatTimer.classList.toggle('hidden', !hatOn);
    if (jet) {
      const ratio = gear.jetFuel / gear.jetMax;
      if (Math.abs(ratio - this.lastJetRatio) >= 0.02) {
        this.lastJetRatio = ratio;
        this.jetFill.style.transform = `scaleX(${ratio})`;
      }
    }
    if (potionT) {
      const max = gear.potionMax || GEAR.potionS;
      this.potionFill.style.transform = `scaleX(${Math.max(0, gear.potionT / max)})`;
    }
    if (hatRow) {
      const max = gear.hatMax || GEAR.hatS;
      const left = hatOn ? gear.hatT : max;
      const secs = Math.max(0, Math.ceil(left));
      if (secs !== this.lastHatSecs) {
        this.lastHatSecs = secs;
        this.hatSecs.textContent = `${secs}s`;
      }
      if (hatOn) {
        this.hatFill.style.transform = `scaleX(${gear.hatT / max})`;
      }
    }
  }

  startPotionTimer(_seconds: number): void {
    this.potionBtn.classList.add('hidden');
    this.potionTimer.classList.remove('hidden');
    this.runGearEl.classList.remove('hidden');
    this.potionFill.style.transform = 'scaleX(1)';
  }

  endPotionTimer(): void {
    this.potionTimer.classList.add('hidden');
    this.potionFill.style.transform = 'scaleX(1)';
  }

  startHatTimer(seconds: number): void {
    void seconds;
    this.hatBtn.classList.add('hidden');
    this.hatRow.classList.remove('hidden');
    this.hatTimer.classList.remove('hidden');
    this.runGearEl.classList.remove('hidden');
    this.lastHatSecs = -1;
    this.hatFill.style.transform = 'scaleX(1)';
  }

  endHatTimer(): void {
    this.hatRow.classList.add('hidden');
    this.hatTimer.classList.add('hidden');
    this.lastHatSecs = -1;
    this.hatFill.style.transform = 'scaleX(1)';
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

  /** Encerra reflexão de fase na hora (ex.: ao cair). */
  hidePhaseToast(): void {
    window.clearTimeout(this.toastTimer);
    window.clearTimeout(this.toastLiveTimer);
    this.toastTimer = 0;
    this.toastLiveTimer = 0;
    this.speaker.stop();
    this.audio?.stopSoftMurmur();
    this.toastEl.classList.remove('toast-in', 'toast-live', 'toast-out', 'toast-active');
    this.toastEl.classList.add('hidden');
  }

  setMuteLabel(muted: boolean): void {
    this.muteBtn.textContent = muted ? 'Mudo' : 'Som';
    this.muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
  }
}
