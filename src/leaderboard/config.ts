export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && key);
}

export function supabaseUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL?.trim() ?? '';
}

export function supabaseAnonKey(): string {
  return import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? '';
}

export const LEADERBOARD_TOP_LIMIT = 20;
export const LEADERBOARD_REFRESH_MS = 90_000;
export const MIN_SUBMIT_HEIGHT = 3;
