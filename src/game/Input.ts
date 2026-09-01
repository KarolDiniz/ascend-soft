export class Input {
  left = false;
  right = false;
  jumpPressed = false;
  jumpHeld = false;
  /** Posição do ponteiro na viewport (tela inicial). */
  pointerX = 0;
  pointerY = 0;
  pointerKnown = false;
  private jumpBuffer = 0;

  private keys = new Set<string>();
  private touchLeft = false;
  private touchRight = false;
  private bound = false;

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
        this.jumpHeld = false;
      }
      this.syncMove();
    });

    const onTouch = (e: TouchEvent) => {
      e.preventDefault();
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
      if (centerTouch && e.type === 'touchstart') {
        this.jumpPressed = true;
        this.jumpBuffer = 0.12;
        this.jumpHeld = true;
      }
      if (!centerTouch) this.jumpHeld = this.keyJumpHeld();
      this.syncMove();
    };

    el.addEventListener('touchstart', onTouch, { passive: false });
    el.addEventListener('touchmove', onTouch, { passive: false });
    el.addEventListener('touchend', onTouch, { passive: false });
    el.addEventListener('touchcancel', onTouch, { passive: false });

    window.addEventListener('blur', () => {
      this.keys.clear();
      this.touchLeft = false;
      this.touchRight = false;
      this.jumpHeld = false;
      this.left = false;
      this.right = false;
      this.pointerKnown = false;
    });

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

  private keyJumpHeld(): boolean {
    return this.keys.has('Space') || this.keys.has('ArrowUp') || this.keys.has('KeyW');
  }

  private syncMove(): void {
    this.left = this.keys.has('ArrowLeft') || this.keys.has('KeyA') || this.touchLeft;
    this.right = this.keys.has('ArrowRight') || this.keys.has('KeyD') || this.touchRight;
  }

  update(dt: number): void {
    if (this.jumpBuffer > 0) this.jumpBuffer -= dt;
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
