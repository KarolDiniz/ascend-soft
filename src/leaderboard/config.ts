function readEnv(...keys: string[]): string {
  const env = import.meta.env as Record<string, string | undefined>;
  for (const key of keys) {
    const value = env[key]?.trim();
    if (value) return value;
  }
  return '';
}

export function supabaseUrl(): string {
  return readEnv('VITE_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL');
}

export function supabaseAnonKey(): string {
  return readEnv(
    'VITE_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  );
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl() && supabaseAnonKey());
}

export const LEADERBOARD_PAGE_SIZE = 1000;
export const LEADERBOARD_MAX_ROWS = 10_000;
/** Rivais visíveis na janela da partida (acima, ou abaixo se você for o 1º). */
export const LEADERBOARD_NEARBY = 3;
export const LEADERBOARD_REFRESH_MS = 90_000;
export const LEADERBOARD_LIVE_DEBOUNCE_MS = 160;
export const MIN_SUBMIT_HEIGHT = 3;
/** Teto folgado vs pico sticky (~554 u/s). Bloqueia height absurdo em 1s. */
export const MAX_HEIGHT_UNITS_PER_MS = 0.8;

export function scoreLooksPlausible(
  height: number,
  breaths: number,
  collectibles: number,
  runMs: number,
): boolean {
  if (height < MIN_SUBMIT_HEIGHT || runMs < 1000) return false;
  if (height > runMs * MAX_HEIGHT_UNITS_PER_MS) return false;
  const breathCap = Math.max(12, Math.floor(height / 16));
  const lootCap = Math.max(8, Math.floor(height / 12));
  if (breaths > breathCap || collectibles > lootCap) return false;
  return true;
}
