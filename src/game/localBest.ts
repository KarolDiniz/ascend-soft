export const LOCAL_BEST_KEY = 'ascend-soft-best';

export function loadLocalBest(): number {
  try {
    return Number(localStorage.getItem(LOCAL_BEST_KEY) || '0') || 0;
  } catch {
    return 0;
  }
}

export function saveLocalBest(height: number): void {
  try {
    localStorage.setItem(LOCAL_BEST_KEY, String(height));
  } catch {
    /* ignore */
  }
}
