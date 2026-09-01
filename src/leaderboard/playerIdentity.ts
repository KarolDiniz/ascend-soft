import { checkDisplayName, sanitizeDisplayName } from './namePolicy';

const PLAYER_ID_KEY = 'ascend-soft-player-id';
const PLAYER_NAME_KEY = 'ascend-soft-player-name';

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function defaultNameFromId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  const n = Math.abs(hash) % 9000 + 1000;
  return `Blob${n}`;
}

export { sanitizeDisplayName };

export function isValidDisplayName(name: string): boolean {
  return checkDisplayName(name).ok;
}

export function getPlayerId(): string {
  try {
    let id = localStorage.getItem(PLAYER_ID_KEY);
    if (!id) {
      id = randomId();
      localStorage.setItem(PLAYER_ID_KEY, id);
    }
    return id;
  } catch {
    return randomId();
  }
}

export function getDisplayName(): string {
  try {
    const saved = localStorage.getItem(PLAYER_NAME_KEY);
    if (saved && checkDisplayName(saved).ok) return sanitizeDisplayName(saved);
  } catch {
    /* ignore */
  }
  const fallback = defaultNameFromId(getPlayerId());
  saveDisplayName(fallback);
  return fallback;
}

export function saveDisplayName(raw: string): string {
  const check = checkDisplayName(raw);
  if (check.ok) {
    try {
      localStorage.setItem(PLAYER_NAME_KEY, check.name);
    } catch {
      /* ignore */
    }
    return check.name;
  }
  try {
    const saved = localStorage.getItem(PLAYER_NAME_KEY);
    if (saved && checkDisplayName(saved).ok) return sanitizeDisplayName(saved);
  } catch {
    /* ignore */
  }
  const fallback = defaultNameFromId(getPlayerId());
  try {
    localStorage.setItem(PLAYER_NAME_KEY, fallback);
  } catch {
    /* ignore */
  }
  return fallback;
}
