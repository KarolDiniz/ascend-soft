export class Input {
  left = false;
  right = false;
  /** -1 esquerda … 0 … +1 direita (teclado ou inclinação). */
  moveAxis = 0;
  jumpPressed = false;
  jumpHeld = false;
  /** Posição do ponteiro na viewport (tela inicial). */
  pointerX = 0;
  pointerY = 0;
  pointerKnown = false;
  private jumpBuffer = 0;
  private jumpHeldTimer = 0;
  private pointerJump = false;

  private keys = new Set<string>();
  private bound = false;
  private tiltBound = false;
  private tiltAxis = 0;
  private tiltZero = 0;
  private tiltReady = false;
  private motionEnabled = false;

  private readonly tiltDead = 5;
  private readonly tiltFull = 26;

  bind(el: HTMLElement): void {
    if (this.bound) return;
    this.bound = true;

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
      this.pointerJump = true;
      this.pressJump();
    };
    const onPointerUp = () => {
      this.pointerJump = false;
      if (this.jumpHeldTimer <= 0) this.jumpHeld = this.keyJumpHeld();
    };

    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    window.addEventListener('blur', () => {
      this.keys.clear();
      this.jumpHeld = false;
      this.pointerJump = false;
      this.jumpHeldTimer = 0;
      this.left = false;
      this.right = false;
      this.moveAxis = 0;
      this.pointerKnown = false;
    });

    const onPointer = (e: PointerEvent) => {
      this.pointerX = e.clientX;
      this.pointerY = e.clientY;
      this.pointerKnown = true;
    };
    window.addEventListener('pointermove', onPointer);
    window.addEventListener('pointerleave', () => {
      this.pointerKnown = false;
    });

    window.addEventListener('orientationchange', () => this.calibrateTilt());
    screen.orientation?.addEventListener?.('change', () => this.calibrateTilt());
  }

  /** Pedir giroscópio (iOS exige gesto do usuário) e ligar inclinação. */
  async enableMotion(): Promise<void> {
    this.motionEnabled = true;
    this.calibrateTilt();

    const DOE = DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<string>;
    };
    if (typeof DOE.requestPermission === 'function') {
      try {
        const state = await DOE.requestPermission();
        if (state !== 'granted') return;
      } catch {
        return;
      }
    }

    if (this.tiltBound) return;
    this.tiltBound = true;
    window.addEventListener('deviceorientation', this.onOrientation, true);
  }

  calibrateTilt(): void {
    this.tiltReady = false;
    this.tiltAxis = 0;
    this.syncMove();
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

  private onOrientation = (e: DeviceOrientationEvent): void => {
    if (!this.motionEnabled) return;
    const lean = this.screenLean(e);
    if (lean == null) return;

    if (!this.tiltReady) {
      this.tiltZero = lean;
      this.tiltReady = true;
    }

    let delta = lean - this.tiltZero;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    const mag = Math.abs(delta);
    if (mag < this.tiltDead) {
      this.tiltAxis = 0;
    } else {
      const t = Math.min(1, (mag - this.tiltDead) / (this.tiltFull - this.tiltDead));
      this.tiltAxis = Math.sign(delta) * t;
    }
    this.syncMove();
  };

  /** Inclinação esquerda/direita no referencial da tela. */
  private screenLean(e: DeviceOrientationEvent): number | null {
    const gamma = e.gamma;
    const beta = e.beta;
    if (gamma == null || beta == null) return null;
    const angle = this.screenAngle();
    if (angle === 90) return beta;
    if (angle === -90 || angle === 270) return -beta;
    if (angle === 180) return -gamma;
    return gamma;
  }

  private screenAngle(): number {
    const orient = screen.orientation;
    if (orient && typeof orient.angle === 'number') return orient.angle;
    const legacy = (window as Window & { orientation?: number }).orientation;
    return typeof legacy === 'number' ? legacy : 0;
  }

  private syncMove(): void {
    const key = (this.keys.has('ArrowRight') || this.keys.has('KeyD') ? 1 : 0)
      - (this.keys.has('ArrowLeft') || this.keys.has('KeyA') ? 1 : 0);
    this.moveAxis = key !== 0 ? key : this.tiltAxis;
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

  /** Descarta pulo pendente (ex.: Space/Enter usados para iniciar a partida). */
  clearJump(): void {
    this.jumpPressed = false;
    this.jumpBuffer = 0;
    this.jumpHeldTimer = 0;
    this.pointerJump = false;
  }
}
