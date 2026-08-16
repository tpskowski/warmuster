import type { Folder, SavedList } from "../types";

// A backup is the whole workspace in one file: every saved list, across every
// rule set, plus the folders they are organised into. Importing one is a
// *replace*, not a merge — the file becomes the browser's entire collection,
// so a backup taken on one computer can be restored on another and leave the
// two mirroring each other.
//
// List and folder ids are kept as-is rather than regenerated (unlike share
// codes, which bring a single list into an existing collection and must not
// collide). Keeping them makes a restore idempotent, preserves list identity
// across devices, and keeps each list with its folder.

const BACKUP_KIND = "warmuster/backup";
const BACKUP_VERSION = 1;

export interface BackupFile {
  kind: typeof BACKUP_KIND;
  backupVersion: typeof BACKUP_VERSION;
  exportedAt: string;
  lists: SavedList[];
  /** Absent on backups taken before folders existed; those restore flat. */
  folders?: Folder[];
}

/** A restored workspace: the lists, and the folders they are filed under. */
export interface BackupContents {
  lists: SavedList[];
  folders: Folder[];
}

export function buildBackup(lists: SavedList[], folders: Folder[]): BackupFile {
  return {
    kind: BACKUP_KIND,
    backupVersion: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    lists,
    folders,
  };
}

export function serializeBackup(lists: SavedList[], folders: Folder[]): string {
  return JSON.stringify(buildBackup(lists, folders), null, 2) + "\n";
}

/** `warmuster-backup-2026-08-06.json` */
export function backupFileName(now: Date = new Date()): string {
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  return `warmuster-backup-${stamp}.json`;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function finiteNumber(value: unknown, fallback: number): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

/** Coerce one entry of a backup's `lists` into a SavedList, or drop it if it
 * isn't recognisably one. Mirrors the tolerance of the localStorage loader:
 * unknown fields are dropped and missing optional ones get defaults, so a file
 * from an older or newer build still restores what it can. */
function sanitizeList(raw: unknown): SavedList | null {
  if (raw == null || typeof raw !== "object") return null;
  const list = raw as Partial<SavedList> & Record<string, unknown>;
  if (list.schemaVersion !== 1) return null;
  if (typeof list.id !== "string" || list.id === "") return null;
  if (typeof list.ruleSet !== "string" || typeof list.army !== "string") return null;
  return {
    id: list.id,
    schemaVersion: 1,
    ruleSet: list.ruleSet,
    ruleVersion: String(list.ruleVersion ?? ""),
    army: list.army,
    name: String(list.name ?? "Untitled"),
    pointsLimit: finiteNumber(list.pointsLimit, 0),
    units: (Array.isArray(list.units) ? list.units : []).map((u) => ({
      unitId: String(u?.unitId ?? ""),
      quantity: Math.max(1, finiteNumber(u?.quantity, 1)),
      upgrades: asStringArray(u?.upgrades),
      magicItems: asStringArray(u?.magicItems),
      ...(typeof u?.scoutingCommitted === "boolean"
        ? { scoutingCommitted: u.scoutingCommitted }
        : {}),
    })),
    characters: (Array.isArray(list.characters) ? list.characters : []).map((c, i) => ({
      id: typeof c?.id === "string" && c.id !== "" ? c.id : `character-${i}`,
      unitId: String(c?.unitId ?? ""),
      upgrades: asStringArray(c?.upgrades),
      magicItems: asStringArray(c?.magicItems),
      ...(typeof c?.scoutingCommitted === "boolean"
        ? { scoutingCommitted: c.scoutingCommitted }
        : {}),
    })),
    notes: typeof list.notes === "string" ? list.notes : null,
    updatedAt: typeof list.updatedAt === "string" ? list.updatedAt : new Date().toISOString(),
    // Left absent when off, as lists saved before mercenaries existed have it,
    // so a backup round-trips to exactly the lists it was taken from.
    ...(list.allowMercenaries === true ? { allowMercenaries: true } : {}),
    // Likewise absent unless filed, matching lists saved before folders.
    ...(typeof list.folderId === "string" ? { folderId: list.folderId } : {}),
    ...(Number.isFinite(list.sortIndex) ? { sortIndex: Number(list.sortIndex) } : {}),
  };
}

/** Coerce one entry of a backup's `folders`, or drop it if it isn't one. */
function sanitizeFolder(raw: unknown, index: number): Folder | null {
  if (raw == null || typeof raw !== "object") return null;
  const folder = raw as Partial<Folder> & Record<string, unknown>;
  if (typeof folder.id !== "string" || folder.id === "") return null;
  if (typeof folder.ruleSet !== "string") return null;
  return {
    id: folder.id,
    ruleSet: folder.ruleSet,
    name: String(folder.name ?? "Folder"),
    sortIndex: finiteNumber(folder.sortIndex, index),
  };
}

/** The contents of a backup file, or null if the text isn't a Warmuster
 * backup. An empty `lists` array is valid — restoring an empty backup clears
 * the collection, which is what mirroring an empty workspace means. */
export function parseBackup(text: string): BackupContents | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (parsed == null || typeof parsed !== "object") return null;
  const file = parsed as Partial<BackupFile>;
  if (file.kind !== BACKUP_KIND) return null;
  if (file.backupVersion !== BACKUP_VERSION) return null;
  if (!Array.isArray(file.lists)) return null;
  const lists = file.lists.map(sanitizeList).filter((l): l is SavedList => l != null);
  if (new Set(lists.map((list) => list.id)).size !== lists.length) return null;
  const folders = (Array.isArray(file.folders) ? file.folders : [])
    .map(sanitizeFolder)
    .filter((f): f is Folder => f != null);
  if (new Set(folders.map((folder) => folder.id)).size !== folders.length) return null;
  // A list filed under a missing folder, or one owned by another rule set,
  // restores at the top level rather than disappearing into that folder.
  const folderRuleSets = new Map(folders.map((folder) => [folder.id, folder.ruleSet]));
  return {
    lists: lists.map((list) =>
      list.folderId != null && folderRuleSets.get(list.folderId) !== list.ruleSet
        ? { ...list, folderId: null }
        : list,
    ),
    folders,
  };
}
