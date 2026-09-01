import type { MobileControlMode } from './GameSettings';

const TOUCH_QUERY = '(pointer: coarse), (hover: none)';
const TILT_DEAD = 8;
const TILT_MAX = 32;
const TILT_SMOOTH = 14;

export function isTouchUi(): boolean {
  return window.matchMedia(TOUCH_QUERY).matches;
}

type DeviceOrientationCtor = {
  requestPermission?: () => Promise<PermissionState | 'granted' | 'denied' | 'default'>;
};

export class Input {
  left = false;
  right = false;
  jumpPressed = false;
  jumpHeld = false;
  /** Eixo horizontal -1..1 (tilt analógico ou digital). */
  moveAxis = 0;
  /** Pulo automático no chão (modo inclinar). */
  autoJump = false;
  /** Posição do ponteiro na viewport (tela inicial). */
  pointerX = 0;
  pointerY = 0;
  pointerKnown = false;
  private jumpBuffer = 0;

  private keys = new Set<string>();
  private touchLeft = false;
  private touchRight = false;
  private touchJump = false;
  private padLeft = false;
  private padRight = false;
  private padJump = false;
  private tiltTarget = 0;
  private tiltAxis = 0;
  private mode: MobileControlMode = 'pad';
  private gameplayActive = false;
  private bound = false;
  private tiltListening = false;
  private onDeviceOrientation: ((e: DeviceOrientationEvent) => void) | null = null;
  private onVisibility: (() => void) | null = null;

  bind(el: HTMLElement): void {
    if (this.bound) return;
    this.bound = true;

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (['Space', 'ArrowUp', 'KeyW', 'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (!e.repeat) {
          this.jumpPressed = true;
          this.jumpBuffer = 0.12;
        }
        this.jumpHeld = true;
      }
      this.syncMove();
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        this.jumpHeld = this.computeJumpHeld();
      }
      this.syncMove();
    });

    const onTouch = (e: TouchEvent) => {
      e.preventDefault();
      if (!this.gameplayActive || this.mode !== 'zones') {
        this.touchLeft = false;
        this.touchRight = false;
        this.touchJump = false;
        this.syncJumpHeld();
        this.syncMove();
        return;
      }

      this.touchLeft = false;
      this.touchRight = false;
      let centerTouch = false;
      const w = window.innerWidth;
      for (let i = 0; i < e.touches.length; i++) {
        const t = e.touches[i];
        if (t.clientX < w * 0.33) this.touchLeft = true;
        else if (t.clientX > w * 0.67) this.touchRight = true;
        else centerTouch = true;
      }
      this.touchJump = centerTouch;
      if (centerTouch && e.type === 'touchstart') {
        this.jumpPressed = true;
        this.jumpBuffer = 0.12;
      }
      this.syncJumpHeld();
      this.syncMove();
    };

    el.addEventListener('touchstart', onTouch, { passive: false });
    el.addEventListener('touchmove', onTouch, { passive: false });
    el.addEventListener('touchend', onTouch, { passive: false });
    el.addEventListener('touchcancel', onTouch, { passive: false });

    window.addEventListener('blur', () => this.releaseTransient());

    this.onVisibility = () => {
      if (document.hidden) this.releaseTransient();
    };
    document.addEventListener('visibilitychange', this.onVisibility);

    const onPointer = (e: PointerEvent) => {
      this.pointerX = e.clientX;
      this.pointerY = e.clientY;
      this.pointerKnown = true;
    };
    window.addEventListener('pointermove', onPointer);
    window.addEventListener('pointerdown', onPointer);
    window.addEventListener('pointerleave', () => {
      this.pointerKnown = false;
    });
  }

  setMobileMode(mode: MobileControlMode): void {
    if (this.mode === mode) {
      this.syncMove();
      return;
    }
    this.mode = mode;
    this.touchLeft = false;
    this.touchRight = false;
    this.touchJump = false;
    this.padLeft = false;
    this.padRight = false;
    this.padJump = false;
    this.tiltTarget = 0;
    this.tiltAxis = 0;
    if (mode !== 'tilt') this.stopTilt();
    this.syncJumpHeld();
    this.syncMove();
  }

  setGameplayActive(active: boolean): void {
    this.gameplayActive = active;
    if (!active) {
      this.touchLeft = false;
      this.touchRight = false;
      this.touchJump = false;
      this.padLeft = false;
      this.padRight = false;
      this.padJump = false;
      this.tiltTarget = 0;
      this.tiltAxis = 0;
    }
    this.syncJumpHeld();
    this.syncMove();
  }

  setPadLeft(held: boolean): void {
    this.padLeft = held;
    this.syncMove();
  }

  setPadRight(held: boolean): void {
    this.padRight = held;
    this.syncMove();
  }

  setPadJump(held: boolean): void {
    if (held && !this.padJump) {
      this.jumpPressed = true;
      this.jumpBuffer = 0.12;
    }
    this.padJump = held;
    this.syncJumpHeld();
  }

  async startTilt(): Promise<boolean> {
    if (this.tiltListening) return true;
    const DOE = window.DeviceOrientationEvent as unknown as DeviceOrientationCtor | undefined;
    if (!DOE) return !isTouchUi();

    if (typeof DOE.requestPermission === 'function') {
      try {
        const result = await DOE.requestPermission();
        if (result !== 'granted') return false;
      } catch {
        return false;
      }
    }

    this.attachTilt();
    return true;
  }

  stopTilt(): void {
    if (this.onDeviceOrientation) {
      window.removeEventListener('deviceorientation', this.onDeviceOrientation);
      this.onDeviceOrientation = null;
    }
    this.tiltListening = false;
    this.tiltTarget = 0;
    this.tiltAxis = 0;
    this.syncMove();
  }

  private attachTilt(): void {
    if (this.tiltListening) return;
    this.tiltListening = true;
    this.onDeviceOrientation = (e: DeviceOrientationEvent) => {
      this.tiltTarget = axisFromOrientation(e);
    };
    window.addEventListener('deviceorientation', this.onDeviceOrientation, true);
  }

  private keyJumpHeld(): boolean {
    return this.keys.has('Space') || this.keys.has('ArrowUp') || this.keys.has('KeyW');
  }

  private computeJumpHeld(): boolean {
    return (
      this.keyJumpHeld() ||
      (this.gameplayActive && this.mode === 'zones' && this.touchJump) ||
      (this.gameplayActive && this.mode === 'pad' && this.padJump) ||
      (this.gameplayActive && this.mode === 'tilt')
    );
  }

  private syncJumpHeld(): void {
    this.jumpHeld = this.computeJumpHeld();
  }

  private releaseTransient(): void {
    this.keys.clear();
    this.touchLeft = false;
    this.touchRight = false;
    this.touchJump = false;
    this.padLeft = false;
    this.padRight = false;
    this.padJump = false;
    this.tiltTarget = 0;
    this.tiltAxis = 0;
    this.jumpHeld = false;
    this.left = false;
    this.right = false;
    this.moveAxis = 0;
    this.pointerKnown = false;
  }

  private syncMove(): void {
    const keyL = this.keys.has('ArrowLeft') || this.keys.has('KeyA');
    const keyR = this.keys.has('ArrowRight') || this.keys.has('KeyD');
    const zoneOn = this.gameplayActive && this.mode === 'zones';
    const padOn = this.gameplayActive && this.mode === 'pad';
    this.left = keyL || (zoneOn && this.touchLeft) || (padOn && this.padLeft);
    this.right = keyR || (zoneOn && this.touchRight) || (padOn && this.padRight);
    this.autoJump = this.gameplayActive && this.mode === 'tilt';

    const digital = (this.right ? 1 : 0) - (this.left ? 1 : 0);
    if (digital !== 0) {
      this.moveAxis = digital;
    } else if (this.gameplayActive && this.mode === 'tilt') {
      this.moveAxis = this.tiltAxis;
    } else {
      this.moveAxis = 0;
    }
  }

  update(dt: number): void {
    if (this.jumpBuffer > 0) this.jumpBuffer -= dt;
    if (this.gameplayActive && this.mode === 'tilt') {
      const k = Math.min(1, TILT_SMOOTH * dt);
      this.tiltAxis += (this.tiltTarget - this.tiltAxis) * k;
      if (Math.abs(this.tiltAxis) < 0.02) this.tiltAxis = 0;
    } else {
      this.tiltAxis = 0;
    }
    this.syncMove();
  }

  consumeJump(): boolean {
    if (this.jumpPressed || this.jumpBuffer > 0) {
      this.jumpPressed = false;
      this.jumpBuffer = 0;
      return true;
    }
    return false;
  }

  /** Descarta pulo pendente (ex.: Space/Enter usados para iniciar a partida). */
  clearJump(): void {
    this.jumpPressed = false;
    this.jumpBuffer = 0;
  }
}

function getScreenAngle(): number {
  const o = screen.orientation;
  if (o && typeof o.angle === 'number') return o.angle;
  const legacy = (window as Window & { orientation?: number }).orientation;
  return typeof legacy === 'number' ? legacy : 0;
}

function axisFromOrientation(e: DeviceOrientationEvent): number {
  const gamma = e.gamma;
  const beta = e.beta;
  if (gamma == null && beta == null) return 0;

  const angle = ((getScreenAngle() % 360) + 360) % 360;
  let raw = 0;
  if (angle === 90) raw = beta ?? 0;
  else if (angle === 270) raw = -(beta ?? 0);
  else if (angle === 180) raw = -(gamma ?? 0);
  else raw = gamma ?? 0;

  if (Math.abs(raw) < TILT_DEAD) return 0;
  const signed = Math.sign(raw);
  const mag = Math.min(1, (Math.abs(raw) - TILT_DEAD) / (TILT_MAX - TILT_DEAD));
  return signed * mag;
}
