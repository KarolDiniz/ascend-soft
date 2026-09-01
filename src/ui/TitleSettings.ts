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
  private mobileControls: HTMLSelectElement;
  private mobileControlsHint: HTMLElement;
  private reduceMotion: HTMLInputElement;
  private showPlayingRank: HTMLInputElement;
  private settings: UserSettings;
  private open = false;

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
    this.mobileControls = document.getElementById('mobile-controls') as HTMLSelectElement;
    this.mobileControlsHint = document.getElementById('mobile-controls-hint')!;
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

    this.mobileControls.addEventListener('change', () => {
      const mode = this.mobileControls.value as MobileControlMode;
      this.patch({ mobileControls: mode });
      if (mode === 'tilt') {
        void this.game.requestTiltPermission().then((ok) => this.setTiltHint(ok));
      } else {
        this.setTiltHint(true);
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
    this.mobileControls.value = s.mobileControls;
    this.reduceMotion.checked = s.reduceMotion;
    this.showPlayingRank.checked = s.showPlayingRank;
    this.volume.value = String(s.volume);
    this.hud.setMuteLabel(s.muted || s.volume === 0);
    document.documentElement.classList.toggle('reduce-motion', s.reduceMotion);
    document.documentElement.classList.toggle('hide-playing-rank', !s.showPlayingRank);
    this.setTiltHint(true);
  }

  private setTiltHint(permissionOk: boolean): void {
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
