import { describe, expect, it } from "vitest";
import { backupFileName, parseBackup, serializeBackup } from "./backup";
import { createFolder } from "./folders";
import {
  addCharacter,
  addUnit,
  createList,
  setAllowMercenaries,
  setNotes,
  toggleCharacterScouting,
  toggleUnitScouting,
} from "./lists";
import type { Folder, SavedList } from "../types";

function sampleLists(): SavedList[] {
  let chaos = createList("warmaster-revolution", "2.2.6", "chaos", "Warband", 2000);
  chaos = addUnit(chaos, "chaos:chaos-warriors");
  chaos = addUnit(chaos, "chaos:chaos-warriors");
  chaos = addCharacter(chaos, "chaos:general");
  chaos = toggleUnitScouting(chaos, 0);
  chaos = toggleCharacterScouting(chaos, chaos.characters[0].id);
  chaos = setNotes(chaos, "Bring the dragon");
  const dwarfs = setAllowMercenaries(
    createList("warmaster-revolution", "2.2.6", "dwarfs", "Hold", 1500),
    true,
  );
  return [chaos, dwarfs];
}

/** A collection where the first list is filed in a folder. */
function sampleFiled(): { lists: SavedList[]; folders: Folder[] } {
  const folder = createFolder([], "warmaster-revolution", "Tournament");
  const [chaos, dwarfs] = sampleLists();
  return {
    lists: [{ ...chaos, folderId: folder.id, sortIndex: 0 }, dwarfs],
    folders: [folder],
  };
}

describe("backup", () => {
  it("round-trips every list unchanged, ids included", () => {
    const lists = sampleLists();
    const restored = parseBackup(serializeBackup(lists, []));
    expect(restored).toEqual({ lists, folders: [] });
  });

  it("round-trips folders and the lists filed under them", () => {
    const { lists, folders } = sampleFiled();
    expect(parseBackup(serializeBackup(lists, folders))).toEqual({ lists, folders });
  });

  it("round-trips an empty collection, so a restore can clear the browser", () => {
    expect(parseBackup(serializeBackup([], []))).toEqual({ lists: [], folders: [] });
  });

  it("reads a backup taken before folders existed as a flat collection", () => {
    const file = JSON.parse(serializeBackup(sampleLists(), []));
    delete file.folders;
    expect(parseBackup(JSON.stringify(file))!.folders).toEqual([]);
  });

  it("restores a list whose folder is missing at the top level", () => {
    const { lists } = sampleFiled();
    const file = JSON.parse(serializeBackup(lists, []));
    expect(parseBackup(JSON.stringify(file))!.lists[0].folderId).toBeNull();
  });

  it("clears a folder reference owned by another rule set", () => {
    const folder = createFolder([], "warmaster-custom", "Custom lists");
    const [list] = sampleLists();
    const file = serializeBackup([{ ...list, folderId: folder.id }], [folder]);

    expect(parseBackup(file)!.lists[0].folderId).toBeNull();
  });

  it("rejects files that aren't Warmuster backups", () => {
    expect(parseBackup("not json")).toBeNull();
    expect(parseBackup("[]")).toBeNull();
    expect(parseBackup(JSON.stringify({ kind: "something/else", lists: [] }))).toBeNull();
    // A single shared list is not a backup.
    expect(parseBackup(JSON.stringify(sampleLists()[0]))).toBeNull();
  });

  it("rejects a backup written by a future format version", () => {
    const file = JSON.parse(serializeBackup(sampleLists(), []));
    file.backupVersion = 2;
    expect(parseBackup(JSON.stringify(file))).toBeNull();
  });

  it("drops unrecognisable lists and folders but keeps the rest", () => {
    const { lists, folders } = sampleFiled();
    const file = JSON.parse(serializeBackup(lists, folders));
    file.lists.push({ id: "junk" }, null, { schemaVersion: 2, id: "future" });
    file.folders.push({ name: "no id" }, null);
    const restored = parseBackup(JSON.stringify(file))!;
    expect(restored.lists.map((l) => l.army)).toEqual(["chaos", "dwarfs"]);
    expect(restored.folders).toHaveLength(1);
  });

  it("fills in fields missing from an older backup", () => {
    const file = JSON.parse(serializeBackup(sampleLists(), []));
    delete file.lists[0].units[0].magicItems;
    delete file.lists[1].allowMercenaries;
    delete file.lists[1].notes;
    const restored = parseBackup(JSON.stringify(file))!.lists;
    expect(restored[0].units[0].magicItems).toEqual([]);
    expect(restored[1].allowMercenaries).toBeUndefined();
    expect(restored[1].notes).toBeNull();
  });

  it("falls back for non-finite numeric values while keeping finite quantities", () => {
    const file = JSON.parse(serializeBackup(sampleLists(), []));
    file.lists[0].pointsLimit = "1e999";
    file.lists[0].units[0].quantity = "1e999";
    file.lists[0].units.push({ ...file.lists[0].units[0], quantity: 2 });

    const restored = parseBackup(JSON.stringify(file))!.lists;
    expect(restored[0].pointsLimit).toBe(0);
    expect(restored[0].units[0].quantity).toBe(1);
    expect(restored[0].units.at(-1)?.quantity).toBe(2);
  });

  it("rejects backups with duplicate list ids", () => {
    const file = JSON.parse(serializeBackup(sampleLists(), []));
    file.lists[1].id = file.lists[0].id;

    expect(parseBackup(JSON.stringify(file))).toBeNull();
  });

  it("rejects backups with duplicate folder ids", () => {
    const { lists, folders } = sampleFiled();
    const file = JSON.parse(serializeBackup(lists, [...folders, { ...folders[0] }]));

    expect(parseBackup(JSON.stringify(file))).toBeNull();
  });

  it("names the file by date", () => {
    expect(backupFileName(new Date(2026, 7, 6))).toBe("warmuster-backup-2026-08-06.json");
  });
});
