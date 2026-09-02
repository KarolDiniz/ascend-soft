/**
 * Temporada 1 do ranking semanal — scores anteriores ficam só no global.
 * Depois desta data, o corte usa o maior entre esta data e a segunda 00:00 da semana.
 */
export const WEEKLY_SEASON_START_MS = new Date(2026, 8, 2, 0, 0, 0, 0).getTime();

/** Segunda 00:00 no fuso local — alinhado ao reset semanal do ranking. */
export function weekStartLocalMs(at = new Date()): number {
  const start = new Date(at);
  start.setHours(0, 0, 0, 0);
  const daysFromMonday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - daysFromMonday);
  return start.getTime();
}

/** Início efetivo do período semanal (temporada 1 ou segunda da semana, o que for mais recente). */
export function weeklyEligibleStartMs(at = new Date()): number {
  return Math.max(weekStartLocalMs(at), WEEKLY_SEASON_START_MS);
}

export function isInCurrentWeekLocal(iso: string | undefined, at = new Date()): boolean {
  if (!iso) return false;
  const t = Date.parse(iso);
  return Number.isFinite(t) && t >= weeklyEligibleStartMs(at);
}
