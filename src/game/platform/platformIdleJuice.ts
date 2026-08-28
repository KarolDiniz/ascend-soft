import type { MaterialId } from '../../audio/materials';
import { PASTEL, rgba } from '../../theme/pastelPalette';
import type { Particles } from '../Particles';
import { isSoapBarMaterial } from './soapColors';

/** Taxa base de emissão idle por material (eventos/seg) — escalada por densityScale */
const IDLE_RATE: Record<MaterialId, number> = {
  jelly: 2.4,
  butter: 1.9,
  mochi: 2.1,
  marshmallow: 2.6,
  chocolate: 1.7,
  sponge: 1.8,
  glycerin: 2.2,
  citrus: 2.5,
  clearSlime: 2.3,
  whipped: 2.8,
  honeycomb: 2.0,
  soapBubble: 3.2,
  bathFoam: 2.7,
  lavenderSoap: 2.4,
  creamSoap: 2.2,
  keyboard: 1.6,
  bubbleWrap: 2.6,
  kinetic: 2.4,
  iceSoap: 2.6,
  butterSlime: 2.0,
  amoeba: 2.5,
  moss: 2.1,
  grass: 2.3,
  cotton: 2.4,
  cloud: 2.8,
  paper: 1.7,
  plasticBottle: 2.2,
  velvet: 1.9,
  blossom: 2.5,
  marimba: 1.8,
  crystal: 2.4,
  ceramic: 1.8,
  clay: 2.1,
  silk: 2.0,
  kitten: 2.2,
  mushroom: 2.3,
  kalimba: 1.7,
  xylophone: 1.75,
  tambourine: 1.9,
  popcorn: 2.5,
  bamboo: 2.0,
  cork: 1.8,
  seashell: 2.2,
  macaron: 2.1,
  boba: 2.4,
  feather: 2.6,
  woodBlock: 1.65,
};

function roll(dt: number, rate: number, density: number): boolean {
  return Math.random() <= dt * rate * density;
}

/**
 * Partículas idle únicas por material — retorna true se tratado (sem fallback genérico).
 */
export function emitPlatformIdleJuice(
  p: Particles,
  dt: number,
  x: number,
  surfaceY: number,
  color: string,
  accent: string,
  materialId: MaterialId,
  densityScale: number,
  windX: number,
): boolean {
  const rate = IDLE_RATE[materialId];
  if (!roll(dt, rate, densityScale)) return true;

  const rx = () => x + (Math.random() - 0.5) * 32;
  const wy = windX * 0.28;

  switch (materialId) {
    case 'keyboard':
      p.keyboardLetters(rx(), surfaceY - 2, 1, false, 0);
      break;
    case 'cloud':
      p.idleParticle(rx(), surfaceY - 4, '#ffffff', 'foam', {
        vx: wy + (Math.random() - 0.5) * 10,
        vy: 6 + Math.random() * 14,
        life: 0.55 + Math.random() * 0.35,
        size: 2 + Math.random() * 2.5,
      });
      p.idleParticle(rx(), surfaceY - 8, rgba(PASTEL.white, 0.85), 'foam', {
        vx: wy + (Math.random() - 0.5) * 8,
        vy: 4 + Math.random() * 10,
        life: 0.45 + Math.random() * 0.3,
        size: 1.5 + Math.random() * 2,
      });
      break;
    case 'sponge':
      p.idleParticle(rx(), surfaceY, color, 'foam', {
        vx: (Math.random() - 0.5) * 12,
        vy: 8 + Math.random() * 14,
        life: 0.38,
        size: 1.5 + Math.random() * 2,
      });
      break;
    case 'grass':
      p.grassFoliage(rx(), surfaceY, 1, false, 0);
      break;
    case 'blossom':
      p.blossomPetals(rx(), surfaceY, 1, false, 0);
      break;
    case 'cotton':
      p.cottonFluff(rx(), surfaceY - 2, 1, false, 0);
      break;
    case 'moss':
      p.mossBits(rx(), surfaceY, 1, false, 0);
      break;
    case 'velvet':
      p.velvetFibers(rx(), surfaceY, color, 1, false, 0);
      break;
    case 'silk':
      p.silkThreads(rx(), surfaceY - 2, accent, 1, false, 0);
      break;
    case 'kitten':
      p.idleParticle(rx(), surfaceY - 4, accent, 'glitter', {
        vx: (Math.random() - 0.5) * 16,
        vy: 10 + Math.random() * 18,
        life: 0.5,
        size: 2,
      });
      break;
    case 'crystal':
    case 'iceSoap':
    case 'lavenderSoap':
      p.idleParticle(rx(), surfaceY - 2, accent, 'glitter', {
        vx: (Math.random() - 0.5) * 18 + wy,
        vy: 12 + Math.random() * 22,
        life: 0.48,
        size: 1.5 + Math.random() * 2,
      });
      break;
    case 'plasticBottle':
      p.idleParticle(rx(), surfaceY, PASTEL.sky, 'drip', {
        vx: (Math.random() - 0.5) * 6,
        vy: -8 - Math.random() * 12,
        life: 0.42,
        size: 2,
      });
      break;
    case 'citrus':
      p.idleParticle(rx(), surfaceY, color, 'zest', {
        vx: (Math.random() - 0.5) * 22,
        vy: 14 + Math.random() * 20,
        life: 0.45,
        size: 2 + Math.random() * 2,
      });
      break;
    case 'kinetic':
    case 'clay':
      p.sandFall(rx(), surfaceY, color, 5 + Math.floor(Math.random() * 4));
      break;
    case 'chocolate':
    case 'butter':
    case 'honeycomb':
      p.drip(rx(), surfaceY, color, 1);
      break;
    case 'jelly':
    case 'clearSlime':
    case 'butterSlime':
    case 'amoeba':
      p.idleParticle(rx(), surfaceY, color, 'foam', {
        vx: (Math.random() - 0.5) * 14,
        vy: 6 + Math.random() * 16,
        life: 0.42,
        size: 2 + Math.random() * 2,
      });
      break;
    case 'marshmallow':
    case 'whipped':
    case 'bathFoam':
      p.idleParticle(rx(), surfaceY - 2, '#ffffff', 'foam', {
        vx: (Math.random() - 0.5) * 12,
        vy: 10 + Math.random() * 18,
        life: 0.5,
        size: 2 + Math.random() * 2.5,
      });
      break;
    case 'soapBubble':
    case 'glycerin':
    case 'creamSoap':
      p.risingBubbles(rx(), surfaceY, color, 2);
      break;
    case 'bubbleWrap':
      p.idleParticle(rx(), surfaceY, accent, 'bubble', {
        vx: (Math.random() - 0.5) * 10,
        vy: 12 + Math.random() * 18,
        life: 0.35,
        size: 2 + Math.random() * 2,
      });
      break;
    case 'paper':
      p.idleParticle(rx(), surfaceY, color, 'crumb', {
        vx: (Math.random() - 0.5) * 20 + wy,
        vy: 8 + Math.random() * 16,
        life: 0.55,
        size: 2,
      });
      break;
    case 'ceramic':
      p.idleParticle(rx(), surfaceY - 6, rgba(PASTEL.white, 0.55), 'foam', {
        vx: (Math.random() - 0.5) * 8,
        vy: -6 - Math.random() * 10,
        life: 0.6,
        size: 1.5 + Math.random() * 1.5,
      });
      break;
    case 'mochi':
      p.idleParticle(rx(), surfaceY - 2, color, 'crumb', {
        vx: (Math.random() - 0.5) * 16,
        vy: 10 + Math.random() * 14,
        life: 0.4,
        size: 1.5 + Math.random() * 2,
      });
      break;
    case 'marimba':
      p.musicNotes(rx(), surfaceY - 6, 1, false, 0);
      break;
    case 'kalimba':
      p.idleParticle(rx(), surfaceY - 8, accent, 'glitter', {
        vx: (Math.random() - 0.5) * 10,
        vy: -8 - Math.random() * 12,
        life: 0.55,
        size: 2,
      });
      break;
    case 'xylophone':
      p.musicNotes(rx(), surfaceY - 6, 1, false, 0);
      p.idleParticle(rx(), surfaceY - 4, color, 'glitter', {
        vx: (Math.random() - 0.5) * 14,
        vy: 6 + Math.random() * 10,
        life: 0.45,
        size: 1.5,
      });
      break;
    case 'tambourine':
      p.idleParticle(rx(), surfaceY - 4, PASTEL.butter, 'glitter', {
        vx: (Math.random() - 0.5) * 18,
        vy: 8 + Math.random() * 14,
        life: 0.42,
        size: 2,
      });
      break;
    case 'woodBlock':
      p.idleParticle(rx(), surfaceY - 2, color, 'crumb', {
        vx: (Math.random() - 0.5) * 8,
        vy: 4 + Math.random() * 8,
        life: 0.35,
        size: 1.5,
      });
      break;
    case 'mushroom':
      p.idleParticle(rx(), surfaceY - 2, color, 'crumb', {
        vx: (Math.random() - 0.5) * 14 + wy,
        vy: -4 - Math.random() * 10,
        life: 0.5,
        size: 1.5,
      });
      break;
    case 'popcorn':
      p.idleParticle(rx(), surfaceY - 4, PASTEL.butter, 'crumb', {
        vx: (Math.random() - 0.5) * 22,
        vy: 10 + Math.random() * 18,
        life: 0.38,
        size: 2 + Math.random(),
      });
      break;
    case 'bamboo':
      p.grassFoliage(rx(), surfaceY, 1, false, 0);
      break;
    case 'seashell':
      p.idleParticle(rx(), surfaceY - 4, accent, 'glitter', {
        vx: (Math.random() - 0.5) * 12,
        vy: 8 + Math.random() * 14,
        life: 0.55,
        size: 2,
      });
      p.risingBubbles(rx(), surfaceY, rgba(PASTEL.sky, 0.7), 1);
      break;
    case 'macaron':
      p.idleParticle(rx(), surfaceY, color, 'crumb', {
        vx: (Math.random() - 0.5) * 16,
        vy: 10 + Math.random() * 12,
        life: 0.4,
        size: 1.5 + Math.random(),
      });
      break;
    case 'boba':
      p.risingBubbles(rx(), surfaceY, color, 2);
      p.idleParticle(rx(), surfaceY - 2, accent, 'foam', {
        vx: (Math.random() - 0.5) * 10,
        vy: 6 + Math.random() * 10,
        life: 0.45,
        size: 2,
      });
      break;
    case 'feather':
      p.cottonFluff(rx(), surfaceY - 6, 1, false, wy);
      break;
    case 'cork':
      p.idleParticle(rx(), surfaceY, color, 'crumb', {
        vx: (Math.random() - 0.5) * 20 + wy,
        vy: 10 + Math.random() * 14,
        life: 0.42,
        size: 2,
      });
      break;
    default:
      if (isSoapBarMaterial(materialId)) {
        p.risingBubbles(rx(), surfaceY, color, 2);
      } else {
        return false;
      }
  }
  return true;
}
