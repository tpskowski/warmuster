import { describe, expect, it } from "vitest";
import { getArmy } from "../data/gameData";
import {
  addCharacter,
  addUnit,
  countOf,
  createList,
  removeUnit,
  toggleCharacterUpgrade,
  toggleUnitUpgrade,
  totalPoints,
} from "./lists";
import { validateList } from "./validation";

const chaos = getArmy("warmaster-revolution", "chaos")!;

function freshList() {
  return createList("warmaster-revolution", "2.2.6", "chaos", "Test", 2000);
}

describe("list building", () => {
  it("merges identical plain units into one entry", () => {
    let list = freshList();
    list = addUnit(list, "chaos:chaos-warriors");
    list = addUnit(list, "chaos:chaos-warriors");
    expect(list.units).toHaveLength(1);
    expect(list.units[0].quantity).toBe(2);
    expect(countOf(list, "chaos:chaos-warriors")).toBe(2);
  });

  it("splits a unit into its own entry when it takes an upgrade", () => {
    let list = freshList();
    list = addUnit(list, "chaos:chaos-warriors");
    list = addUnit(list, "chaos:chaos-warriors");
    list = toggleUnitUpgrade(list, 0, "chaos:chariot");
    expect(list.units).toHaveLength(2);
    expect(countOf(list, "chaos:chaos-warriors")).toBe(2);
    expect(list.units.some((u) => u.upgrades.includes("chaos:chariot"))).toBe(true);
  });

  it("computes points including character upgrades", () => {
    let list = freshList();
    list = addUnit(list, "chaos:chaos-warriors"); // 140
    list = addCharacter(list, "chaos:general"); // 125
    list = toggleCharacterUpgrade(list, list.characters[0].id, "chaos:chaos-dragon"); // +100
    expect(totalPoints(list, chaos)).toBe(365);
  });

  it("removes a unit one at a time", () => {
    let list = freshList();
    list = addUnit(list, "chaos:ogres");
    list = addUnit(list, "chaos:ogres");
    list = removeUnit(list, 0);
    expect(countOf(list, "chaos:ogres")).toBe(1);
    list = removeUnit(list, 0);
    expect(list.units).toHaveLength(0);
  });
});

describe("validateList", () => {
  it("requires a General and min units, scaled per 1000 points", () => {
    const list = freshList(); // 2000 points
    const issues = validateList(list, chaos);
    expect(issues.some((i) => i.message.includes("must include a General"))).toBe(true);
    // Chaos Warriors are min 1 per 1000 -> 2 at 2000 points.
    expect(
      issues.some((i) => i.unitId === "chaos:chaos-warriors" && i.message.includes("at least 2")),
    ).toBe(true);
  });

  it("keeps the General at exactly one regardless of size", () => {
    let list = freshList();
    list = addCharacter(list, "chaos:general");
    list = addCharacter(list, "chaos:general");
    const issues = validateList(list, chaos);
    expect(issues.some((i) => i.message.includes("only include one General"))).toBe(true);
  });

  it("scales max limits per 1000 points", () => {
    let list = freshList(); // Trolls are -/3 -> 6 allowed at 2000.
    for (let i = 0; i < 7; i++) list = addUnit(list, "chaos:trolls");
    const issues = validateList(list, chaos);
    expect(issues.some((i) => i.unitId === "chaos:trolls" && i.message.includes("at most 6"))).toBe(true);
  });

  it("flags over-limit points", () => {
    let list = freshList();
    for (let i = 0; i < 16; i++) list = addUnit(list, "chaos:chaos-warriors"); // 2240
    const issues = validateList(list, chaos);
    expect(issues.some((i) => i.message.includes("over the 2000 point limit"))).toBe(true);
  });

  it("flags ineligible upgrades", () => {
    let list = freshList();
    list = addCharacter(list, "chaos:hero");
    list = toggleCharacterUpgrade(list, list.characters[0].id, "chaos:chaos-dragon");
    expect(validateList(list, chaos).some((i) => i.message.includes("cannot take"))).toBe(false);
    // Harpies cannot take a chariot.
    list = addUnit(list, "chaos:harpies");
    list = toggleUnitUpgrade(list, 0, "chaos:chariot");
    expect(validateList(list, chaos).some((i) => i.message.includes("cannot take"))).toBe(true);
  });
});
