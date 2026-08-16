import { describe, expect, it } from "vitest";
import { baseAppUrl, ruleSetIdFromPath } from "./ruleSetPath";

describe("rule-set entry paths", () => {
  it.each([
    ["/WMR", "warmaster-revolution"],
    ["/wmr/", "warmaster-revolution"],
    ["/WMR-2026-playtest", "wmr-2026-playtest"],
    ["/a-matter-of-mustaches", "warmaster-custom"],
  ])("maps %s to %s", (path, ruleSet) => {
    expect(ruleSetIdFromPath(path)).toBe(ruleSet);
  });

  it("ignores the base URL and unrelated paths", () => {
    expect(ruleSetIdFromPath("/")).toBeNull();
    expect(ruleSetIdFromPath("/not-a-rule-set")).toBeNull();
  });

  it("normalizes to the base URL while preserving search and hash", () => {
    expect(baseAppUrl("?source=link", "#list=abc")).toBe("/?source=link#list=abc");
  });
});
