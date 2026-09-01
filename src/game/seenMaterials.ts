import { type MaterialId } from '../audio/materials';
import { PHASE_COUNT, PHASE_ORDER } from './ThemedPhases';

const SEEN_KEY = 'ascend-soft-seen-materials';
const validIds = new Set<string>(PHASE_ORDER);

export function loadSeenMaterials(): Set<MaterialId> {
  const out = new Set<MaterialId>();
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return out;
    for (const id of JSON.parse(raw) as string[]) {
      if (validIds.has(id)) out.add(id as MaterialId);
    }
  } catch {
    /* ignore corrupt storage */
  }
  return out;
}

export function saveSeenMaterials(seen: ReadonlySet<MaterialId>): void {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    /* quota */
  }
}

/** Returns true when this landing was the first time the material was heard. */
export function addSeenMaterial(seen: Set<MaterialId>, id: MaterialId): boolean {
  if (seen.has(id)) return false;
  seen.add(id);
  saveSeenMaterials(seen);
  return true;
}

export function seenTextureCount(seen: ReadonlySet<MaterialId>): number {
  return seen.size;
}

export function totalTextures(): number {
  return PHASE_COUNT;
}
