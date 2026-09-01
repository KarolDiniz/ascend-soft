import { PHYS } from '../physics';

/** Desvio opcional — não entra na cadeia principal nem no catálogo de materiais. */
export const TRAMPOLINE = {
  /** vs jumpVel: ~26 gaps (~1620u). Compromisso alto. */
  launchMul: 4.28,
  width: 48,
  minY: 200,
  minSpacing: 22,
  chance: 0.07,
  sideGapMin: 52,
  sideGapMax: 74,
  yOffset: -10,
  /** Cobre a subida para o corte de pulo não comer a altura. */
  launchLockS: 2.1,
  /** Tempo da mola comprimindo — lento, molengo. */
  compressS: 0.38,
  /** Queda da plataforma (unidades) enquanto a mola comprime. */
  compressDrop: 24,
  /** Impulso inicial da mola ao disparar (negativo = estica pra cima). */
  recoilVel: -11,
  jiggleK: 62,
  jiggleDamp: 2.8,
} as const;

export function trampolineApexHeight(): number {
  const v = PHYS.jumpVel * TRAMPOLINE.launchMul;
  return (v * v) / (2 * PHYS.gravity);
}
