import { describe, expect, it } from "vitest";
import { backupFileName, parseBackup, serializeBackup } from "./backup";
import { addCharacter, addUnit, createList, setAllowMercenaries, setNotes } from "./lists";
import type { SavedList } from "../types";

function sampleLists(): SavedList[] {
  let chaos = createList("warmaster-revolution", "2.2.6", "chaos", "Warband", 2000);
  chaos = addUnit(chaos, "chaos:chaos-warriors");
  chaos = addUnit(chaos, "chaos:chaos-warriors");
  chaos = addCharacter(chaos, "chaos:general");
  chaos = setNotes(chaos, "Bring the dragon");
  const dwarfs = setAllowMercenaries(
    createList("warmaster-revolution", "2.2.6", "dwarfs", "Hold", 1500),
    true,
  );
  return [chaos, dwarfs];
}

describe("backup", () => {
  it("round-trips every list unchanged, ids included", () => {
    const lists = sampleLists();
    const restored = parseBackup(serializeBackup(lists));
    expect(restored).toEqual(lists);
  });

  it("round-trips an empty collection, so a restore can clear the browser", () => {
    expect(parseBackup(serializeBackup([]))).toEqual([]);
  });

  it("rejects files that aren't Warmuster backups", () => {
    expect(parseBackup("not json")).toBeNull();
    expect(parseBackup("[]")).toBeNull();
    expect(parseBackup(JSON.stringify({ kind: "something/else", lists: [] }))).toBeNull();
    // A single shared list is not a backup.
    expect(parseBackup(JSON.stringify(sampleLists()[0]))).toBeNull();
  });

  it("rejects a backup written by a future format version", () => {
    const file = JSON.parse(serializeBackup(sampleLists()));
    file.backupVersion = 2;
    expect(parseBackup(JSON.stringify(file))).toBeNull();
  });

  it("drops unrecognisable lists but keeps the rest", () => {
    const file = JSON.parse(serializeBackup(sampleLists()));
    file.lists.push({ id: "junk" }, null, { schemaVersion: 2, id: "future" });
    const restored = parseBackup(JSON.stringify(file));
    expect(restored).toHaveLength(2);
    expect(restored!.map((l) => l.army)).toEqual(["chaos", "dwarfs"]);
  });

  it("fills in fields missing from an older backup", () => {
    const file = JSON.parse(serializeBackup(sampleLists()));
    delete file.lists[0].units[0].magicItems;
    delete file.lists[1].allowMercenaries;
    delete file.lists[1].notes;
    const restored = parseBackup(JSON.stringify(file))!;
    expect(restored[0].units[0].magicItems).toEqual([]);
    expect(restored[1].allowMercenaries).toBeUndefined();
    expect(restored[1].notes).toBeNull();
  });

  it("falls back for non-finite numeric values while keeping finite quantities", () => {
    const file = JSON.parse(serializeBackup(sampleLists()));
    file.lists[0].pointsLimit = "1e999";
    file.lists[0].units[0].quantity = "1e999";
    file.lists[0].units.push({ ...file.lists[0].units[0], quantity: 2 });

    const restored = parseBackup(JSON.stringify(file))!;
    expect(restored[0].pointsLimit).toBe(0);
    expect(restored[0].units[0].quantity).toBe(1);
    expect(restored[0].units[1].quantity).toBe(2);
  });

  it("rejects backups with duplicate list ids", () => {
    const file = JSON.parse(serializeBackup(sampleLists()));
    file.lists[1].id = file.lists[0].id;

    expect(parseBackup(JSON.stringify(file))).toBeNull();
  });

  it("names the file by date", () => {
    expect(backupFileName(new Date(2026, 7, 6))).toBe("warmuster-backup-2026-08-06.json");
  });
});
