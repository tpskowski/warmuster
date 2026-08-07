import type { SavedList } from "../types";

// A backup is the whole workspace in one file: every saved list, across every
// rule set. Importing one is a *replace*, not a merge — the file becomes the
// browser's entire list collection, so a backup taken on one computer can be
// restored on another and leave the two mirroring each other.
//
// List ids are kept as-is rather than regenerated (unlike share codes, which
// bring a single list into an existing collection and must not collide).
// Keeping them makes a restore idempotent and preserves list identity across
// devices.

const BACKUP_KIND = "warmuster/backup";
const BACKUP_VERSION = 1;

export interface BackupFile {
  kind: typeof BACKUP_KIND;
  backupVersion: typeof BACKUP_VERSION;
  exportedAt: string;
  lists: SavedList[];
}

export function buildBackup(lists: SavedList[]): BackupFile {
  return {
    kind: BACKUP_KIND,
    backupVersion: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    lists,
  };
}

export function serializeBackup(lists: SavedList[]): string {
  return JSON.stringify(buildBackup(lists), null, 2) + "\n";
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
    pointsLimit: Number(list.pointsLimit) || 0,
    units: (Array.isArray(list.units) ? list.units : []).map((u) => ({
      unitId: String(u?.unitId ?? ""),
      quantity: Math.max(1, Number(u?.quantity) || 1),
      upgrades: asStringArray(u?.upgrades),
      magicItems: asStringArray(u?.magicItems),
    })),
    characters: (Array.isArray(list.characters) ? list.characters : []).map((c, i) => ({
      id: typeof c?.id === "string" && c.id !== "" ? c.id : `character-${i}`,
      unitId: String(c?.unitId ?? ""),
      upgrades: asStringArray(c?.upgrades),
      magicItems: asStringArray(c?.magicItems),
    })),
    notes: typeof list.notes === "string" ? list.notes : null,
    updatedAt: typeof list.updatedAt === "string" ? list.updatedAt : new Date().toISOString(),
    // Left absent when off, as lists saved before mercenaries existed have it,
    // so a backup round-trips to exactly the lists it was taken from.
    ...(list.allowMercenaries === true ? { allowMercenaries: true } : {}),
  };
}

/** The lists in a backup file, or null if the text isn't a Warmuster backup.
 * An empty `lists` array is valid — restoring an empty backup clears the
 * collection, which is what mirroring an empty workspace means. */
export function parseBackup(text: string): SavedList[] | null {
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
  return file.lists.map(sanitizeList).filter((l): l is SavedList => l != null);
}
