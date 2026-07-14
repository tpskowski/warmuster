import type { SavedList } from "../types";

// All list data lives in localStorage; every mutation is auto-saved by the
// caller via saveLists.
const STORAGE_KEY = "warmuster.lists.v1";

export function loadLists(): SavedList[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l) => l && l.schemaVersion === 1 && typeof l.id === "string")
      .map((l: SavedList) => ({
        ...l,
        // Lists saved before magic items existed lack the field.
        units: (l.units ?? []).map((u) => ({ ...u, magicItems: u.magicItems ?? [] })),
        characters: (l.characters ?? []).map((c) => ({ ...c, magicItems: c.magicItems ?? [] })),
      }));
  } catch {
    return [];
  }
}

export function saveLists(lists: SavedList[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  } catch {
    // Storage full or unavailable; the in-memory state stays authoritative.
  }
}

export function upsertList(lists: SavedList[], list: SavedList): SavedList[] {
  const index = lists.findIndex((l) => l.id === list.id);
  const next = index === -1 ? [...lists, list] : lists.map((l) => (l.id === list.id ? list : l));
  saveLists(next);
  return next;
}

export function deleteList(lists: SavedList[], id: string): SavedList[] {
  const next = lists.filter((l) => l.id !== id);
  saveLists(next);
  return next;
}

/** Saved lists belong to the rule set they were built against; the rail shows
 * only the active rule set's lists so each set has its own workspace. */
export function listsForRuleSet(lists: SavedList[], ruleSet: string): SavedList[] {
  return lists.filter((l) => l.ruleSet === ruleSet);
}
