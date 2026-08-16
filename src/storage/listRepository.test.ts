import { beforeEach, describe, expect, it } from "vitest";
import type { SavedList } from "../types";
import { listsForRuleSet, loadLists, saveLists } from "./listRepository";

function list(id: string, ruleSet: string): SavedList {
  return { id, ruleSet } as SavedList;
}

describe("listsForRuleSet", () => {
  beforeEach(() => localStorage.clear());

  it("returns only the lists built against the given rule set", () => {
    const lists = [
      list("a", "warmaster-revolution"),
      list("b", "warmaster-custom"),
      list("c", "warmaster-revolution"),
    ];
    expect(listsForRuleSet(lists, "warmaster-revolution").map((l) => l.id)).toEqual(["a", "c"]);
    expect(listsForRuleSet(lists, "warmaster-custom").map((l) => l.id)).toEqual(["b"]);
    expect(listsForRuleSet(lists, "nonexistent")).toEqual([]);
  });

  it("persists scouting commitments and defaults older entries to uncommitted", () => {
    const saved = {
      schemaVersion: 1,
      id: "scouts",
      ruleSet: "warmaster-revolution",
      units: [
        { unitId: "a", quantity: 1, upgrades: [], magicItems: [], scoutingCommitted: true },
        { unitId: "b", quantity: 1, upgrades: [], magicItems: [] },
      ],
      characters: [],
    } as unknown as SavedList;
    expect(saveLists([saved])).toBe(true);

    const [loaded] = loadLists();
    expect(loaded.units[0].scoutingCommitted).toBe(true);
    expect(loaded.units[1].scoutingCommitted).toBe(false);
  });
});
