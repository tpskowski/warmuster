import { describe, expect, it } from "vitest";
import { initialRuleSet } from "./App";

describe("initial rule set", () => {
  it("defaults to Warmaster Revolution", () => {
    expect(initialRuleSet(null)).toBe("warmaster-revolution");
    expect(initialRuleSet("unknown-rule-set")).toBe("warmaster-revolution");
  });

  it("preserves a valid saved rule-set selection", () => {
    expect(initialRuleSet("wmr-2026-playtest")).toBe("wmr-2026-playtest");
  });

  it("lets a direct-entry path override the saved selection", () => {
    expect(initialRuleSet("warmaster-custom", "warmaster-revolution")).toBe(
      "warmaster-revolution",
    );
  });
});
