/** Estado de animação derivado da física — squash, olhar, passos. */
import { px } from '../theme/pixel';

export interface PlayerMotion {
  walkPhase: number;
  /** Deslocamento vertical do passo (unidades lógicas, ~px antes do snap) */
  walkBob: number;
  /** 0–1 velocidade horizontal vs maxSpeed */
  speedNorm: number;
  /** Inclinação lateral — empurrar o corpo na direção do movimento */
  lean: number;
  /** Orelhinhas reagem ao passo */
  earWiggle: number;
  /** Offset Y do acessório vs cabeça — negativo = flutuando acima (desprendido) */
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

  stepAccessoryHop(m, dt, onGround, vy);
}

/** Gravidade sobre o acessório flutuando — arco parabólico de volta à cabeça */
function stepAccessoryHop(m: PlayerMotion, dt: number, onGround: boolean, vy: number): void {
  const grav = 165;
  const maxFloat = -24;

  // Queda rápida: cabeça desce primeiro, chapéu fica para trás (inércia)
  if (!onGround && vy < -50) {
    const fall = -vy;
    const lag = Math.min(16, (fall - 50) * 0.05);
    if (m.accessoryHop > -lag) {
      m.accessoryHop = -lag;
    }
    if (m.accessoryHopVel > -lag * 0.35) {
      m.accessoryHopVel = -lag * 0.35;
    }
  }

  const detached = m.accessoryHop < 0 || m.accessoryHopVel < 0;

  if (detached) {
    m.accessoryHopVel += grav * dt;
    m.accessoryHop += m.accessoryHopVel * dt;
    m.accessoryHop = Math.max(maxFloat, m.accessoryHop);
  }

  if (m.accessoryHop >= 0) {
    m.accessoryHop = 0;
    if (onGround) {
      if (m.accessoryHopVel > 4) {
        m.accessoryHopVel *= -0.2;
      } else {
        m.accessoryHopVel = 0;
      }
    } else {
      m.accessoryHopVel = Math.max(0, m.accessoryHopVel);
    }
  }
}

/** Desprende o acessório — inércia: cabeça sobe, chapéu decola para cima */
export function impulseAccessoryHop(m: PlayerMotion, playerVy: number): void {
  if (m.accessoryHop < -0.8) return;
  const pop = 16 + playerVy * 0.045;
  m.accessoryHop = -4;
  m.accessoryHopVel = -pop;
}

/** Offset de desenho (px) — escala com altura do corpo in-game */
export function accessoryHeadOffset(
  m: PlayerMotion,
  facing: number,
  bodyH = 30,
): { x: number; y: number } {
  const scale = bodyH / 30;
  const hop = m.accessoryHop * scale;
  const sep = Math.abs(hop);
  const lag = sep > 2 ? sep * 0.12 * facing : 0;
  return { x: px(lag), y: px(hop) };
}
