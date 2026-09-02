import type { AudioBus } from '../audio/AudioBus';
import type { Game } from '../game/Game';
import {
  loadSettings,
  saveSettings,
  type BannerMode,
  type LandIntensity,
  type MobileControlMode,
  type UserSettings,
} from '../game/GameSettings';
import { isTouchUi } from '../game/Input';
import type { Hud } from './Hud';

/** Painel de configurações na tela inicial */
export class TitleSettings {
  private root: HTMLElement;
  private btnOpen: HTMLButtonElement;
  private btnClose: HTMLButtonElement;
  private backdrop: HTMLButtonElement;
  private btnMute: HTMLButtonElement;
  private volume: HTMLInputElement;
  private lightMode: HTMLInputElement;
  private voiceEnabled: HTMLInputElement;
  private landIntensity: HTMLSelectElement;
  private bannerMode: HTMLSelectElement;
  private controlsBlock: HTMLElement;
  private mobileControlsBlock: HTMLElement;
  private mobileControls: HTMLElement;
  private mobileControlsHint: HTMLElement;
  private controlSens: HTMLInputElement;
  private controlSensTitle: HTMLElement;
  private controlSensValue: HTMLElement;
  private reduceMotion: HTMLInputElement;
  private showPlayingRank: HTMLInputElement;
  private settings: UserSettings;
  private open = false;
  private touchMq: MediaQueryList | null = null;

  constructor(
    private game: Game,
    private audio: AudioBus,
    private hud: Hud,
  ) {
    this.root = document.getElementById('title-settings')!;
    this.btnOpen = document.getElementById('btn-settings') as HTMLButtonElement;
    this.btnClose = document.getElementById('btn-settings-close') as HTMLButtonElement;
    this.backdrop = document.getElementById('title-settings-backdrop') as HTMLButtonElement;
    this.btnMute = document.getElementById('btn-mute') as HTMLButtonElement;
    this.volume = document.getElementById('volume') as HTMLInputElement;
    this.lightMode = document.getElementById('light-mode') as HTMLInputElement;
    this.voiceEnabled = document.getElementById('voice-enabled') as HTMLInputElement;
    this.landIntensity = document.getElementById('land-intensity') as HTMLSelectElement;
    this.bannerMode = document.getElementById('banner-mode') as HTMLSelectElement;
    this.controlsBlock = document.querySelector('.setting-block--controls') as HTMLElement;
    this.mobileControlsBlock = document.getElementById('mobile-controls-block')!;
    this.mobileControls = document.getElementById('mobile-controls')!;
    this.mobileControlsHint = document.getElementById('mobile-controls-hint')!;
    this.controlSens = document.getElementById('control-sensitivity') as HTMLInputElement;
    this.controlSensTitle = document.getElementById('control-sens-title')!;
    this.controlSensValue = document.getElementById('control-sens-value')!;
    this.reduceMotion = document.getElementById('reduce-motion') as HTMLInputElement;
    this.showPlayingRank = document.getElementById('show-playing-rank') as HTMLInputElement;

    this.settings = loadSettings();
    this.syncUiFromSettings();
    this.game.applyUserSettings(this.settings);

    this.btnMute.addEventListener('click', () => {
      void this.audio.unlock().then(() => {
        this.patch({ muted: !this.settings.muted });
      });
    });

    this.volume.addEventListener('input', () => {
      void this.audio.unlock().then(() => {
        const v = Number(this.volume.value);
        if (v === 0) {
          this.patch({ volume: 0, muted: true });
        } else if (this.settings.muted) {
          this.patch({ volume: v, muted: false });
        } else {
          this.patch({ volume: v });
        }
      });
    });

    this.lightMode.addEventListener('change', () => {
      this.patch({ lightMode: this.lightMode.checked });
    });

    this.voiceEnabled.addEventListener('change', () => {
      this.patch({ voiceEnabled: this.voiceEnabled.checked });
    });

    this.landIntensity.addEventListener('change', () => {
      this.patch({ landIntensity: this.landIntensity.value as LandIntensity });
    });

    this.bannerMode.addEventListener('change', () => {
      this.patch({ bannerMode: this.bannerMode.value as BannerMode });
    });

    this.mobileControls.addEventListener('click', (e) => {
      if (!isTouchUi()) return;
      const btn = (e.target as HTMLElement).closest('[data-control-mode]') as HTMLElement | null;
      if (!btn) return;
      const mode = btn.getAttribute('data-control-mode') as MobileControlMode | null;
      if (!mode || mode === this.settings.mobileControls) return;
      this.patch({ mobileControls: mode });
      if (mode === 'tilt') {
        void this.game.requestTiltPermission().then((ok) => this.setTiltHint(ok));
      } else {
        this.setTiltHint(true);
      }
    });

    this.controlSens.addEventListener('input', () => {
      const v = Math.max(1, Math.min(10, Math.round(Number(this.controlSens.value) || 5)));
      if (isTouchUi() && this.settings.mobileControls === 'tilt') {
        this.patch({ tiltSensitivity: v });
      } else {
        this.patch({ jumpSensitivity: v });
      }
    });

    this.reduceMotion.addEventListener('change', () => {
      this.patch({ reduceMotion: this.reduceMotion.checked });
    });

    this.showPlayingRank.addEventListener('change', () => {
      this.patch({ showPlayingRank: this.showPlayingRank.checked });
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

    try {
      this.touchMq = window.matchMedia('(pointer: coarse), (hover: none)');
      this.touchMq.addEventListener('change', () => this.syncDeviceControlsUi());
    } catch {
      /* ignore */
    }
  }

  getVolume(): number {
    return this.settings.volume;
  }

  isOpen(): boolean {
    return this.open;
  }

  setShowPlayingRank(show: boolean): void {
    this.patch({ showPlayingRank: show });
  }

  toggle(): void {
    if (this.open) this.close();
    else this.openPanel();
  }

  private patch(partial: Partial<UserSettings>): void {
    this.settings = { ...this.settings, ...partial };
    saveSettings(this.settings);
    this.syncUiFromSettings();
    this.game.applyUserSettings(this.settings);
  }

  private syncUiFromSettings(): void {
    const s = this.settings;
    this.lightMode.checked = s.lightMode;
    this.voiceEnabled.checked = s.voiceEnabled;
    this.landIntensity.value = s.landIntensity;
    this.bannerMode.value = s.bannerMode;
    this.reduceMotion.checked = s.reduceMotion;
    this.showPlayingRank.checked = s.showPlayingRank;
    this.volume.value = String(s.volume);
    this.hud.setMuteLabel(s.muted || s.volume === 0);
    document.documentElement.classList.toggle('reduce-motion', s.reduceMotion);
    document.documentElement.classList.toggle('hide-playing-rank', !s.showPlayingRank);
    this.syncControlModeCards(s.mobileControls);
    this.syncDeviceControlsUi();
    this.setTiltHint(true);
  }

  private syncDeviceControlsUi(): void {
    const mobile = isTouchUi();
    this.mobileControlsBlock.classList.toggle('hidden', !mobile);
    this.mobileControlsBlock.setAttribute('aria-hidden', mobile ? 'false' : 'true');
    this.controlsBlock.classList.toggle('is-desktop', !mobile);
    this.syncSensitivitySlider();
  }

  private syncControlModeCards(mode: MobileControlMode): void {
    const cards = this.mobileControls.querySelectorAll<HTMLElement>('[data-control-mode]');
    for (const card of cards) {
      const on = card.getAttribute('data-control-mode') === mode;
      card.classList.toggle('is-on', on);
      card.setAttribute('aria-checked', on ? 'true' : 'false');
    }
  }

  private syncSensitivitySlider(): void {
    const mobile = isTouchUi();
    const tilt = mobile && this.settings.mobileControls === 'tilt';
    const v = tilt ? this.settings.tiltSensitivity : this.settings.jumpSensitivity;
    this.controlSens.value = String(v);
    this.controlSensValue.textContent = String(v);
    if (!mobile) {
      this.controlSensTitle.textContent = 'Sensibilidade do pulo';
      this.controlSens.setAttribute('aria-label', 'Sensibilidade do pulo no teclado');
      return;
    }
    this.controlSensTitle.textContent = tilt ? 'Sensibilidade lateral' : 'Sensibilidade do pulo';
    this.controlSens.setAttribute(
      'aria-label',
      tilt ? 'Sensibilidade dos movimentos laterais' : 'Sensibilidade do pulo',
    );
  }

  private setTiltHint(permissionOk: boolean): void {
    if (!isTouchUi()) return;
    const mode = this.settings.mobileControls;
    this.mobileControlsHint.classList.remove('is-warn');
    if (mode === 'pad') {
      this.mobileControlsHint.textContent = 'setas à esquerda · pulo à direita';
      return;
    }
    if (mode === 'tilt') {
      if (!permissionOk) {
        this.mobileControlsHint.classList.add('is-warn');
        this.mobileControlsHint.textContent = 'permita o sensor de movimento no navegador';
        return;
      }
      this.mobileControlsHint.textContent = 'pulo sozinho · incline o celular para os lados';
      return;
    }
    this.mobileControlsHint.textContent = 'toque: esquerda · centro pular · direita';
  }

  private openPanel(): void {
    this.open = true;
    this.syncDeviceControlsUi();
    this.root.classList.remove('hidden');
    this.root.setAttribute('aria-hidden', 'false');
    this.btnOpen.classList.add('is-open');
    this.btnOpen.setAttribute('aria-expanded', 'true');
    this.game.setTitleOverlayOpen(true);
    this.btnClose.focus();
  }

  close(): void {
    if (!this.open) return;
    this.open = false;
    this.root.classList.add('hidden');
    this.root.setAttribute('aria-hidden', 'true');
    this.btnOpen.classList.remove('is-open');
    this.btnOpen.setAttribute('aria-expanded', 'false');
    this.game.setTitleOverlayOpen(false);
    this.btnOpen.focus();
  }
}
