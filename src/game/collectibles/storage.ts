import {
  COLLECTIBLE_ORDER,
  type CollectibleId,
} from './definitions';

const STORAGE_KEY = 'ascend-soft-collected';

const validIds = new Set<string>(COLLECTIBLE_ORDER);

export function loadCollected(): Set<CollectibleId> {
  const out = new Set<CollectibleId>();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return out;
    for (const id of JSON.parse(raw) as string[]) {
      if (validIds.has(id)) out.add(id as CollectibleId);
    }
  } catch {
    /* ignore corrupt storage */
  }
  return out;
}

export function saveCollected(collected: ReadonlySet<CollectibleId>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...collected]));
  } catch {
    /* ignore quota errors */
  }
}

/** Returns true when the id was newly added */
export function addCollected(
  collected: Set<CollectibleId>,
  id: CollectibleId,
): boolean {
  if (collected.has(id)) return false;
  collected.add(id);
  saveCollected(collected);
  return true;
}

export function collectedCount(collected: ReadonlySet<CollectibleId>): number {
  return collected.size;
}

export function totalCollectibles(): number {
  return COLLECTIBLE_ORDER.length;
}
