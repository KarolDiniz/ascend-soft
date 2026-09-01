import { isTouchUi, type Input } from '../game/Input';
import type { MobileControlMode } from '../game/GameSettings';

type PadKey = 'left' | 'right' | 'jump';

/**
 * Botões virtuais do modo setas no celular.
 * Ponteiros com capture — o dedo pode deslizar sem soltar o comando.
 */
export class MobilePad {
  private root: HTMLElement;
  private leftBtn: HTMLButtonElement;
  private rightBtn: HTMLButtonElement;
  private jumpBtn: HTMLButtonElement;
  private pointers = new Map<number, PadKey>();
  private leftIds = new Set<number>();
  private rightIds = new Set<number>();
  private jumpIds = new Set<number>();

  constructor(private input: Input) {
    this.root = document.getElementById('mobile-pad')!;
    this.leftBtn = document.getElementById('pad-left') as HTMLButtonElement;
    this.rightBtn = document.getElementById('pad-right') as HTMLButtonElement;
    this.jumpBtn = document.getElementById('pad-jump') as HTMLButtonElement;

    this.bindButton(this.leftBtn, 'left');
    this.bindButton(this.rightBtn, 'right');
    this.bindButton(this.jumpBtn, 'jump');

    window.addEventListener('pointerup', (e) => this.release(e.pointerId));
    window.addEventListener('pointercancel', (e) => this.release(e.pointerId));
    window.addEventListener('blur', () => this.releaseAll());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.releaseAll();
    });
  }

  sync(gameplayActive: boolean, mode: MobileControlMode): void {
    const show = gameplayActive && mode === 'pad' && isTouchUi();
    this.root.classList.toggle('hidden', !show);
    this.root.setAttribute('aria-hidden', show ? 'false' : 'true');
    document.documentElement.classList.toggle('has-mobile-pad', show);
    if (!show) this.releaseAll();
  }

  private bindButton(btn: HTMLButtonElement, key: PadKey): void {
    btn.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.preventDefault();
      e.stopPropagation();
      btn.setPointerCapture(e.pointerId);
      this.hold(e.pointerId, key);
    });
    const release = (e: PointerEvent) => {
      e.preventDefault();
      this.release(e.pointerId);
    };
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private hold(id: number, key: PadKey): void {
    const prev = this.pointers.get(id);
    if (prev === key) return;
    if (prev) this.drop(id, prev);
    this.pointers.set(id, key);
    this.add(id, key);
    this.flush();
  }

  private release(id: number): void {
    const key = this.pointers.get(id);
    if (!key) return;
    this.drop(id, key);
    this.pointers.delete(id);
    this.flush();
  }

  private releaseAll(): void {
    this.pointers.clear();
    this.leftIds.clear();
    this.rightIds.clear();
    this.jumpIds.clear();
    this.flush();
  }

  private add(id: number, key: PadKey): void {
    this.ids(key).add(id);
  }

  private drop(id: number, key: PadKey): void {
    this.ids(key).delete(id);
  }

  private ids(key: PadKey): Set<number> {
    if (key === 'left') return this.leftIds;
    if (key === 'right') return this.rightIds;
    return this.jumpIds;
  }

  private flush(): void {
    this.input.setPadLeft(this.leftIds.size > 0);
    this.input.setPadRight(this.rightIds.size > 0);
    this.input.setPadJump(this.jumpIds.size > 0);
    this.leftBtn.classList.toggle('is-held', this.leftIds.size > 0);
    this.rightBtn.classList.toggle('is-held', this.rightIds.size > 0);
    this.jumpBtn.classList.toggle('is-held', this.jumpIds.size > 0);
  }
}
