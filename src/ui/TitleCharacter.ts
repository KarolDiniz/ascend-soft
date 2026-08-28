import type { AudioBus } from '../audio/AudioBus';
import type { Game } from '../game/Game';
import {
  ACCESSORY_OPTIONS,
  BODY_COLOR_OPTIONS,
  HAIR_STYLE_OPTIONS,
  loadPlayerAppearance,
  savePlayerAppearance,
  type AccessoryId,
  type BodyColorId,
  type HairStyleId,
  type PlayerAppearance,
} from '../game/playerAppearance';
import { drawAccessoryIcon } from '../game/playerAccessories';
import { drawHairIcon } from '../game/playerHair';
import { enablePixelMode } from '../theme/pixel';
import { CharacterPreview } from './CharacterPreview';

/** Editor de aparência na tela inicial */
export class TitleCharacter {
  private root: HTMLElement;
  private btnOpen: HTMLButtonElement;
  private btnClose: HTMLButtonElement;
  private backdrop: HTMLButtonElement;
  private colorGrid: HTMLElement;
  private hairGrid: HTMLElement;
  private accGrid: HTMLElement;
  private preview: CharacterPreview;
  private appearance: PlayerAppearance;
  private open = false;
  private tickVariant = 0;

  constructor(
    private game: Game,
    private audio: AudioBus,
  ) {
    this.root = document.getElementById('title-character')!;
    this.btnOpen = document.getElementById('btn-character') as HTMLButtonElement;
    this.btnClose = document.getElementById('btn-character-close') as HTMLButtonElement;
    this.backdrop = document.getElementById('title-character-backdrop') as HTMLButtonElement;
    this.colorGrid = document.getElementById('char-color-grid')!;
    this.hairGrid = document.getElementById('char-hair-grid')!;
    this.accGrid = document.getElementById('char-acc-grid')!;
    this.preview = new CharacterPreview();

    this.appearance = loadPlayerAppearance();
    this.buildColorGrid();
    this.buildHairGrid();
    this.buildAccessoryGrid();
    this.syncSelection();

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

  isOpen(): boolean {
    return this.open;
  }

  toggle(): void {
    if (this.open) this.close();
    else this.openPanel();
  }

  private buildColorGrid(): void {
    const frag = document.createDocumentFragment();
    for (const opt of BODY_COLOR_OPTIONS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'char-swatch';
      btn.dataset.color = opt.id;
      btn.setAttribute('aria-label', `Tom ${opt.label}`);
      btn.innerHTML = `<span class="char-swatch-fill" style="background:${opt.swatch}"></span><span class="char-swatch-label">${opt.label}</span>`;
      btn.addEventListener('click', () => {
        void this.audio.unlock().then(() => this.pickColor(opt.id));
      });
      frag.appendChild(btn);
    }
    this.colorGrid.replaceChildren(frag);
  }

  private buildHairGrid(): void {
    const frag = document.createDocumentFragment();
    for (const opt of HAIR_STYLE_OPTIONS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'char-acc-btn';
      btn.dataset.hair = opt.id;
      btn.setAttribute('aria-label', opt.label);

      const canvas = document.createElement('canvas');
      canvas.className = 'char-acc-icon';
      canvas.width = 44;
      canvas.height = 44;
      canvas.setAttribute('aria-hidden', 'true');
      const ctx = canvas.getContext('2d')!;
      enablePixelMode(ctx);
      drawHairIcon(ctx, opt.id, 44, { ...this.appearance, hairStyle: opt.id });

      const label = document.createElement('span');
      label.className = 'char-acc-label';
      label.textContent = opt.label;

      btn.append(canvas, label);
      btn.addEventListener('click', () => {
        void this.audio.unlock().then(() => this.pickHair(opt.id));
      });
      frag.appendChild(btn);
    }
    this.hairGrid.replaceChildren(frag);
  }

  private buildAccessoryGrid(): void {
    const frag = document.createDocumentFragment();
    for (const opt of ACCESSORY_OPTIONS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'char-acc-btn';
      btn.dataset.acc = opt.id;
      btn.setAttribute('aria-label', opt.label);

      const canvas = document.createElement('canvas');
      canvas.className = 'char-acc-icon';
      canvas.width = 44;
      canvas.height = 44;
      canvas.setAttribute('aria-hidden', 'true');
      const ctx = canvas.getContext('2d')!;
      enablePixelMode(ctx);
      drawAccessoryIcon(ctx, opt.id, 44);

      const label = document.createElement('span');
      label.className = 'char-acc-label';
      label.textContent = opt.label;

      btn.append(canvas, label);
      btn.addEventListener('click', () => {
        void this.audio.unlock().then(() => this.pickAccessory(opt.id));
      });
      frag.appendChild(btn);
    }
    this.accGrid.replaceChildren(frag);
  }

  private pickColor(id: BodyColorId): void {
    if (this.appearance.bodyColor === id) return;
    this.appearance = { ...this.appearance, bodyColor: id };
    this.applyChange(0);
  }

  private pickHair(id: HairStyleId): void {
    if (this.appearance.hairStyle === id) return;
    this.appearance = { ...this.appearance, hairStyle: id };
    this.applyChange(2);
  }

  private pickAccessory(id: AccessoryId): void {
    if (this.appearance.accessory === id) return;
    this.appearance = { ...this.appearance, accessory: id };
    this.applyChange(1);
  }

  private applyChange(soundKind: number): void {
    savePlayerAppearance(this.appearance);
    this.game.applyPlayerAppearance(this.appearance);
    this.preview.setAppearance(this.appearance);
    this.preview.nudge();
    this.syncSelection();
    this.tickVariant += 1;
    this.audio.playCustomizeTick(this.tickVariant + soundKind);
    this.game.nudgeTitleCharacter();
  }

  private syncSelection(): void {
    for (const btn of this.colorGrid.querySelectorAll<HTMLButtonElement>('.char-swatch')) {
      btn.classList.toggle('is-selected', btn.dataset.color === this.appearance.bodyColor);
    }
    for (const btn of this.hairGrid.querySelectorAll<HTMLButtonElement>('.char-acc-btn')) {
      btn.classList.toggle('is-selected', btn.dataset.hair === this.appearance.hairStyle);
    }
    for (const btn of this.accGrid.querySelectorAll<HTMLButtonElement>('.char-acc-btn')) {
      btn.classList.toggle('is-selected', btn.dataset.acc === this.appearance.accessory);
    }
  }

  private openPanel(): void {
    this.appearance = loadPlayerAppearance();
    this.syncSelection();
    this.open = true;
    this.root.classList.remove('hidden');
    this.root.setAttribute('aria-hidden', 'false');
    this.btnOpen.classList.add('is-open');
    this.btnOpen.setAttribute('aria-expanded', 'true');
    this.preview.start(this.appearance);
    this.btnClose.focus();
  }

  close(): void {
    if (!this.open) return;
    this.open = false;
    this.preview.stop();
    this.root.classList.add('hidden');
    this.root.setAttribute('aria-hidden', 'true');
    this.btnOpen.classList.remove('is-open');
    this.btnOpen.setAttribute('aria-expanded', 'false');
    this.btnOpen.focus();
  }
}
