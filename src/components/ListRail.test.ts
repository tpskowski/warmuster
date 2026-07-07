import { describe, expect, it } from "vitest";
import type { SavedList } from "../types";
import { armyDisplayName } from "./ListRail";

describe("armyDisplayName", () => {
  it("capitalizes a saved army id when metadata is unavailable", () => {
    const list = { ruleSet: "unknown", army: "high-elves" } as SavedList;
    expect(armyDisplayName(list, [])).toBe("High Elves");
  });
});
