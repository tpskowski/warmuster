import { describe, expect, it } from "vitest";
import type { SavedList } from "../types";
import { listsForRuleSet } from "./listRepository";

function list(id: string, ruleSet: string): SavedList {
  return { id, ruleSet } as SavedList;
}

describe("listsForRuleSet", () => {
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
});
