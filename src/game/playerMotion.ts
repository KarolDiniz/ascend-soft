/** Estado de animação derivado da física — squash, olhar, passos. */
export interface PlayerMotion {
  walkPhase: number;
  /** Deslocamento vertical do passo (unidades lógicas, ~px antes do snap) */
  walkBob: number;
  /** 0–1 velocidade horizontal vs maxSpeed */
  speedNorm: number;
  /** Inclinação lateral — empurrar o corpo na direção do movimento */
  lean: number;
  /** Orelhinhas / cabelo reagem ao passo */
  earWiggle: number;
  /** Pulinho dos itens na cabeça — negativo = sobe em relação ao corpo */
  accessoryHop: number;
  accessoryHopVel: number;
  rising: boolean;
  falling: boolean;
  moving: boolean;
  sprinting: boolean;
  idleBreath: number;
}

export function createPlayerMotion(): PlayerMotion {
  return {
    walkPhase: 0,
    walkBob: 0,
    speedNorm: 0,
    lean: 0,
    earWiggle: 0,
    accessoryHop: 0,
    accessoryHopVel: 0,
    rising: false,
    falling: false,
    moving: false,
    sprinting: false,
    idleBreath: 0,
  };
}

export function stepPlayerMotion(
  m: PlayerMotion,
  dt: number,
  vx: number,
  vy: number,
  onGround: boolean,
  maxSpeed: number,
): void {
  const speed = Math.abs(vx);
  const speedNorm = Math.min(1, speed / Math.max(1, maxSpeed));
  m.speedNorm = speedNorm;
  m.moving = onGround && speed > 22;
  m.sprinting = onGround && speed > maxSpeed * 0.62;
  m.rising = !onGround && vy > 15;
  m.falling = !onGround && vy < -15;

  if (m.moving) {
    const stepRate = 3.8 + speedNorm * 9.5;
    m.walkPhase = (m.walkPhase + dt * stepRate) % 1;
    const step = Math.sin(m.walkPhase * Math.PI * 2);
    m.walkBob = step * (1.2 + speedNorm * 2.2);
    m.earWiggle = step * (0.35 + speedNorm * 0.55);
  } else if (onGround) {
    m.idleBreath += dt * 2.4;
    m.walkBob = Math.sin(m.idleBreath) * 0.65;
    m.earWiggle = Math.sin(m.idleBreath * 1.3) * 0.18;
    m.walkPhase = 0;
  } else {
    const drift = Math.sin(m.idleBreath + vy * 0.004) * 0.25;
    m.walkBob = drift;
    m.earWiggle = vy > 0 ? -0.22 : vy < -120 ? 0.35 : 0.12;
  }

  const leanTarget = onGround
    ? Math.sign(vx || 1) * speedNorm * 3.2
    : Math.sign(vx || 1) * Math.min(4.5, speedNorm * 2.8 + Math.min(2.2, Math.abs(vy) / 180));
  m.lean += (leanTarget - m.lean) * Math.min(1, 14 * dt);

  // Itens na cabeça: impulso para cima no pulo, gravidade puxa de volta ao corpo
  const hopGravity = 58;
  m.accessoryHopVel += hopGravity * dt;
  m.accessoryHop += m.accessoryHopVel * dt;

  if (m.accessoryHop >= 0) {
    m.accessoryHop = 0;
    if (m.accessoryHopVel > 3) {
      m.accessoryHopVel *= -0.22;
    } else {
      m.accessoryHopVel = 0;
    }
  }
}

/** Impulso ao saltar — só se o item estiver encostado na cabeça */
export function impulseAccessoryHop(m: PlayerMotion, upStrength: number): void {
  if (m.accessoryHop < 0) return;
  m.accessoryHopVel = -upStrength;
}
