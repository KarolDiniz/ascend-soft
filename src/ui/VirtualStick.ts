export type StickAxisHandler = (x: number, y: number) => void;

const TOUCH_QUERY = '(pointer: coarse), (hover: none)';
const DEADZONE = 0.16;

/**
 * Analógico virtual — um ponteiro, rAF coalescing, sem layout no move.
 * Eixo: x esquerda/direita, y cima negativo (igual tela).
 */
export class VirtualStick {
  private readonly root: HTMLElement;
  private readonly knob: HTMLElement;
  private readonly onAxis: StickAxisHandler;
  private cx = 0;
  private cy = 0;
  private radius = 36;
  private pointerId: number | null = null;
  private raf = 0;
  private pendingX = 0;
  private pendingY = 0;
  private visible = false;
  private media: MediaQueryList | null = null;

  constructor(onAxis: StickAxisHandler) {
    this.root = document.getElementById('virtual-stick')!;
    this.knob = document.getElementById('virtual-stick-knob')!;
    this.onAxis = onAxis;

    this.root.addEventListener('pointerdown', this.onDown);
    this.root.addEventListener('pointermove', this.onMove);
    this.root.addEventListener('pointerup', this.onUp);
    this.root.addEventListener('pointercancel', this.onUp);
    this.root.addEventListener('lostpointercapture', this.onUp);

    this.media = window.matchMedia(TOUCH_QUERY);
    this.media.addEventListener('change', this.onMedia);
    window.addEventListener('resize', this.onResize, { passive: true });
  }

  setPlaying(playing: boolean): void {
    this.visible = playing;
    this.syncVisibility();
    if (!playing) this.release();
  }

  get capturing(): boolean {
    return this.pointerId !== null;
  }

  private touchUi(): boolean {
    return this.media?.matches ?? false;
  }

  private syncVisibility(): void {
    const on = this.visible && this.touchUi();
    this.root.classList.toggle('is-on', on);
    this.root.setAttribute('aria-hidden', on ? 'false' : 'true');
    if (on) this.measure();
  }

  private onMedia = (): void => {
    this.syncVisibility();
    if (!this.touchUi()) this.release();
  };

  private onResize = (): void => {
    if (this.root.classList.contains('is-on')) this.measure();
  };

  private measure(): void {
    const r = this.root.getBoundingClientRect();
    this.cx = r.left + r.width * 0.5;
    this.cy = r.top + r.height * 0.5;
    this.radius = Math.max(16, r.width * 0.31);
  }

  private onDown = (e: PointerEvent): void => {
    if (this.pointerId !== null) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    this.pointerId = e.pointerId;
    this.root.classList.add('is-active');
    try {
      this.root.setPointerCapture(e.pointerId);
    } catch {
      /* Safari antigo */
    }
    this.measure();
    this.queue(e.clientX, e.clientY);
  };

  private onMove = (e: PointerEvent): void => {
    if (e.pointerId !== this.pointerId) return;
    e.preventDefault();
    this.queue(e.clientX, e.clientY);
  };

  private onUp = (e: PointerEvent): void => {
    if (this.pointerId === null) return;
    if (e.pointerId !== undefined && e.pointerId !== this.pointerId) return;
    this.release();
  };

  private queue(x: number, y: number): void {
    this.pendingX = x;
    this.pendingY = y;
    if (this.raf) return;
    this.raf = requestAnimationFrame(this.flush);
  }

  private flush = (): void => {
    this.raf = 0;
    if (this.pointerId === null) return;

    let dx = this.pendingX - this.cx;
    let dy = this.pendingY - this.cy;
    const len = Math.hypot(dx, dy);
    if (len > this.radius && len > 0) {
      const s = this.radius / len;
      dx *= s;
      dy *= s;
    }

    const nx = dx / this.radius;
    const ny = dy / this.radius;
    const mag = Math.hypot(nx, ny);
    let ax = 0;
    let ay = 0;
    if (mag > DEADZONE) {
      const t = (mag - DEADZONE) / (1 - DEADZONE);
      const u = Math.min(1, t) / mag;
      ax = nx * u;
      ay = ny * u;
    }

    this.knob.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
    this.onAxis(ax, ay);
  };

  private release(): void {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    if (this.pointerId !== null) {
      try {
        this.root.releasePointerCapture(this.pointerId);
      } catch {
        /* already released */
      }
    }
    this.pointerId = null;
    this.root.classList.remove('is-active');
    this.knob.style.transform = 'translate3d(0, 0, 0)';
    this.onAxis(0, 0);
  }
}
