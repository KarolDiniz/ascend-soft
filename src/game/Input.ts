import { VirtualStick } from '../ui/VirtualStick';

export class Input {
  left = false;
  right = false;
  /** -1 esquerda … 0 … +1 direita (teclado ou analógico). */
  moveAxis = 0;
  jumpPressed = false;
  jumpHeld = false;
  pointerX = 0;
  pointerY = 0;
  pointerKnown = false;
  private jumpBuffer = 0;
  private jumpHeldTimer = 0;
  private pointerJump = false;
  private jumpPointerId: number | null = null;
  private stickJumpArmed = true;

  private keys = new Set<string>();
  private bound = false;
  private stick: VirtualStick | null = null;
  private stickX = 0;

  bind(el: HTMLElement): void {
    if (this.bound) return;
    this.bound = true;

    this.stick = new VirtualStick((x, y) => this.onStickAxis(x, y));

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (['Space', 'ArrowUp', 'KeyW', 'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(e.code)) {
        e.preventDefault();
      }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (!e.repeat) this.pressJump();
        this.jumpHeld = true;
      }
      this.syncMove();
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        this.jumpHeld = this.pointerJump || this.jumpHeldTimer > 0;
      }
      this.syncMove();
    });

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      this.pointerX = e.clientX;
      this.pointerY = e.clientY;
      this.pointerKnown = true;
      this.jumpPointerId = e.pointerId;
      this.pointerJump = true;
      this.pressJump();
    };
    const onPointerUp = (e: PointerEvent) => {
      if (this.jumpPointerId !== null && e.pointerId !== this.jumpPointerId) return;
      this.jumpPointerId = null;
      this.pointerJump = false;
      if (this.jumpHeldTimer <= 0) this.jumpHeld = this.keyJumpHeld();
    };

    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    window.addEventListener('blur', () => this.resetIdle());

    const onPointer = (e: PointerEvent) => {
      this.pointerX = e.clientX;
      this.pointerY = e.clientY;
      this.pointerKnown = true;
    };
    window.addEventListener('pointermove', onPointer);
    window.addEventListener('pointerleave', () => {
      this.pointerKnown = false;
    });
  }

  setStickPlaying(playing: boolean): void {
    this.stick?.setPlaying(playing);
    if (!playing) {
      this.stickX = 0;
      this.stickJumpArmed = true;
      this.syncMove();
    }
  }

  /** Mantido por compatibilidade — o analógico substitui o giroscópio. */
  async enableMotion(): Promise<void> {
    return;
  }

  calibrateTilt(): void {
    /* no-op: inclinação substituída pelo analógico */
  }

  private onStickAxis(x: number, y: number): void {
    this.stickX = x;
    if (y < -0.58) {
      if (this.stickJumpArmed) {
        this.stickJumpArmed = false;
        this.pressJump();
      }
    } else if (y > -0.32) {
      this.stickJumpArmed = true;
    }
    this.syncMove();
  }

  private resetIdle(): void {
    this.keys.clear();
    this.jumpHeld = false;
    this.pointerJump = false;
    this.jumpPointerId = null;
    this.jumpHeldTimer = 0;
    this.left = false;
    this.right = false;
    this.moveAxis = 0;
    this.stickX = 0;
    this.pointerKnown = false;
    this.stickJumpArmed = true;
  }

  private pressJump(): void {
    this.jumpPressed = true;
    this.jumpBuffer = 0.14;
    this.jumpHeld = true;
    this.jumpHeldTimer = 0.18;
  }

  private keyJumpHeld(): boolean {
    return this.keys.has('Space') || this.keys.has('ArrowUp') || this.keys.has('KeyW');
  }

  private syncMove(): void {
    const key =
      (this.keys.has('ArrowRight') || this.keys.has('KeyD') ? 1 : 0) -
      (this.keys.has('ArrowLeft') || this.keys.has('KeyA') ? 1 : 0);
    this.moveAxis = key !== 0 ? key : this.stickX;
    this.left = this.moveAxis < -0.12;
    this.right = this.moveAxis > 0.12;
  }

  update(dt: number): void {
    if (this.jumpBuffer > 0) this.jumpBuffer -= dt;
    if (this.jumpHeldTimer > 0) {
      this.jumpHeldTimer -= dt;
      if (this.jumpHeldTimer <= 0 && !this.pointerJump && !this.keyJumpHeld()) {
        this.jumpHeld = false;
      }
    }
  }

  consumeJump(): boolean {
    if (this.jumpPressed || this.jumpBuffer > 0) {
      this.jumpPressed = false;
      this.jumpBuffer = 0;
      return true;
    }
    return false;
  }

  clearJump(): void {
    this.jumpPressed = false;
    this.jumpBuffer = 0;
    this.jumpHeldTimer = 0;
    this.pointerJump = false;
    this.jumpPointerId = null;
  }
}
