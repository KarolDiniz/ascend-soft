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

/** Remove caracteres inválidos e limita tamanho (2–16). */
export function sanitizeDisplayName(raw: string): string {
  const cleaned = raw
    .trim()
    .replace(/[<>&"']/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 16);
  return cleaned;
}

export function isValidDisplayName(name: string): boolean {
  const n = sanitizeDisplayName(name);
  return n.length >= 2 && n.length <= 16;
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
    if (saved && isValidDisplayName(saved)) return sanitizeDisplayName(saved);
  } catch {
    /* ignore */
  }
  const fallback = defaultNameFromId(getPlayerId());
  saveDisplayName(fallback);
  return fallback;
}

export function saveDisplayName(raw: string): string {
  const name = sanitizeDisplayName(raw);
  try {
    if (name.length >= 2) localStorage.setItem(PLAYER_NAME_KEY, name);
  } catch {
    /* ignore */
  }
  return name;
}
