import { PHYS } from '../physics';

/** Desvio opcional — não entra na cadeia principal nem no catálogo de materiais. */
export const TRAMPOLINE = {
  /** vs jumpVel: impulso bem alto (~maior alcance vertical). */
  launchMul: 5.55,
  width: 48,
  minY: 200,
  minSpacing: 42,
  chance: 0.035,
  sideGapMin: 52,
  sideGapMax: 74,
  yOffset: -10,
  /** Cobre a subida para o corte de pulo não comer a altura. */
  launchLockS: 2.45,
  /** Tempo da mola comprimindo — lento, molengo. */
  compressS: 0.38,
  /** Queda da plataforma (unidades) enquanto a mola comprime. */
  compressDrop: 24,
  /** Impulso inicial da mola ao disparar (negativo = estica pra cima). */
  recoilVel: -11,
  jiggleK: 62,
  jiggleDamp: 2.8,
  /** Tempo mínimo de recoil antes de poder usar de novo. */
  recoverS: 0.55,
} as const;

export function trampolineApexHeight(): number {
  const v = PHYS.jumpVel * TRAMPOLINE.launchMul;
  return (v * v) / (2 * PHYS.gravity);
}
