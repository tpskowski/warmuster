import type { Folder } from "../types";

// Folders live alongside the lists in localStorage, in their own key: a list
// points at its folder by id, so the two collections are saved independently
// and a browser without folders still reads its lists.
const STORAGE_KEY = "warmuster.folders.v1";

export function loadFolders(): Folder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (f) =>
          f &&
          typeof f.id === "string" &&
          typeof f.ruleSet === "string" &&
          typeof f.name === "string",
      )
      .map((f: Folder, index: number) => ({
        id: f.id,
        ruleSet: f.ruleSet,
        name: f.name,
        sortIndex: Number.isFinite(f.sortIndex) ? f.sortIndex : index,
      }));
  } catch {
    return [];
  }
}

export function saveFolders(folders: Folder[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(folders));
    return true;
  } catch {
    // Storage full or unavailable; the in-memory state stays authoritative.
    return false;
  }
}
