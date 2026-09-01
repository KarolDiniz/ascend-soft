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

export const LEADERBOARD_TOP_LIMIT = 20;
export const LEADERBOARD_REFRESH_MS = 90_000;
export const MIN_SUBMIT_HEIGHT = 3;
