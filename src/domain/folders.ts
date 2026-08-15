import type { Folder, SavedList } from "../types";
import { createId } from "./lists";

// Folders group saved lists in the rail. They hold nothing themselves: a list
// names its folder through `folderId`, and order — of folders, and of lists
// within a folder — is an explicit `sortIndex` so a drag can be persisted
// without rewriting the whole collection's storage order.

/** Shared lists are dropped in here on import, so one never lands unnoticed
 * among the user's own lists. Created on the first import that needs it. */
export const IMPORTS_FOLDER_NAME = "Imports";

/** Sort by explicit position, keeping items saved before folders existed (no
 * sortIndex) last. Array#sort is stable, so those keep their saved order. */
function byPosition(a: { sortIndex?: number }, b: { sortIndex?: number }): number {
  return (a.sortIndex ?? Number.MAX_SAFE_INTEGER) - (b.sortIndex ?? Number.MAX_SAFE_INTEGER);
}

function nextIndex(items: { sortIndex?: number }[]): number {
  return items.reduce((max, item) => Math.max(max, (item.sortIndex ?? -1) + 1), 0);
}

export function foldersForRuleSet(folders: Folder[], ruleSet: string): Folder[] {
  return folders.filter((f) => f.ruleSet === ruleSet).sort(byPosition);
}

/** The lists of one rule set inside one folder (null = top level), in rail
 * order. */
export function listsInFolder(
  lists: SavedList[],
  ruleSet: string,
  folderId: string | null,
): SavedList[] {
  return lists
    .filter((l) => l.ruleSet === ruleSet && (l.folderId ?? null) === folderId)
    .sort(byPosition);
}

/** Lists shown at the top level: those in no folder, plus any whose folder is
 * missing — an orphan would otherwise be invisible in the rail. */
export function topLevelLists(
  lists: SavedList[],
  ruleSet: string,
  folders: Folder[],
): SavedList[] {
  const known = new Set(folders.map((f) => f.id));
  return lists
    .filter((l) => l.ruleSet === ruleSet && !(l.folderId != null && known.has(l.folderId)))
    .sort(byPosition);
}

export function createFolder(folders: Folder[], ruleSet: string, name: string): Folder {
  return {
    id: createId("folder"),
    ruleSet,
    name: name.trim() === "" ? "New folder" : name.trim(),
    sortIndex: nextIndex(foldersForRuleSet(folders, ruleSet)),
  };
}

/** The rule set's Imports folder, creating it when this is the first import.
 * The name match is case-insensitive so a folder the user made themselves is
 * reused rather than shadowed by a second one. */
export function ensureImportsFolder(
  folders: Folder[],
  ruleSet: string,
): { folders: Folder[]; folder: Folder } {
  const existing = foldersForRuleSet(folders, ruleSet).find(
    (f) => f.name.trim().toLowerCase() === IMPORTS_FOLDER_NAME.toLowerCase(),
  );
  if (existing) return { folders, folder: existing };
  const folder = createFolder(folders, ruleSet, IMPORTS_FOLDER_NAME);
  return { folders: [...folders, folder], folder };
}

/** Rename a folder. A blank name is ignored, so an empty box on the way to a
 * new name never leaves a nameless folder behind. */
export function renameFolder(folders: Folder[], folderId: string, name: string): Folder[] {
  const trimmed = name.trim();
  if (trimmed === "") return folders;
  return folders.map((f) => (f.id === folderId ? { ...f, name: trimmed } : f));
}

/** Deleting a folder deletes the lists inside it — the rail warns first. */
export function deleteFolder(
  folders: Folder[],
  lists: SavedList[],
  folderId: string,
): { folders: Folder[]; lists: SavedList[] } {
  return {
    folders: folders.filter((f) => f.id !== folderId),
    lists: lists.filter((l) => (l.folderId ?? null) !== folderId),
  };
}

/** Where a dragged item lands: `index` is a slot in the target's *current*
 * order, counting the dragged item itself, which is how a drop indicator
 * between two rows reads. Moving an item later in its own list therefore
 * shifts down by one once the item is lifted out. */
function insertionIndex(order: { id: string }[], id: string, index: number): number {
  const from = order.findIndex((item) => item.id === id);
  const at = Math.max(0, Math.min(index, order.length));
  return from !== -1 && from < at ? at - 1 : at;
}

/** Move a list into `folderId` (null = top level) at the given slot, and
 * renumber the target's lists so the new order sticks. */
export function moveList(
  lists: SavedList[],
  listId: string,
  folderId: string | null,
  index: number,
): SavedList[] {
  const moving = lists.find((l) => l.id === listId);
  if (!moving) return lists;
  const current = listsInFolder(lists, moving.ruleSet, folderId);
  const at = insertionIndex(current, listId, index);
  const siblings = current.filter((l) => l.id !== listId);
  const ordered = [...siblings.slice(0, at), moving, ...siblings.slice(at)];
  const position = new Map(ordered.map((l, i) => [l.id, i]));
  return lists.map((l) => {
    const pos = position.get(l.id);
    return pos === undefined ? l : { ...l, folderId, sortIndex: pos };
  });
}

export function moveFolder(folders: Folder[], folderId: string, index: number): Folder[] {
  const moving = folders.find((f) => f.id === folderId);
  if (!moving) return folders;
  const current = foldersForRuleSet(folders, moving.ruleSet);
  const at = insertionIndex(current, folderId, index);
  const siblings = current.filter((f) => f.id !== folderId);
  const ordered = [...siblings.slice(0, at), moving, ...siblings.slice(at)];
  const position = new Map(ordered.map((f, i) => [f.id, i]));
  return folders.map((f) => {
    const pos = position.get(f.id);
    return pos === undefined ? f : { ...f, sortIndex: pos };
  });
}
