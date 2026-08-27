import type { AudioBus } from '../audio/AudioBus';
import type { Game } from '../game/Game';
import {
  loadSettings,
  saveSettings,
  type BannerMode,
  type LandIntensity,
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
  private reduceMotion: HTMLInputElement;
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
    this.reduceMotion = document.getElementById('reduce-motion') as HTMLInputElement;

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

    this.reduceMotion.addEventListener('change', () => {
      this.patch({ reduceMotion: this.reduceMotion.checked });
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
    this.volume.value = String(s.volume);
    this.hud.setMuteLabel(s.muted || s.volume === 0);
    document.documentElement.classList.toggle('reduce-motion', s.reduceMotion);
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
