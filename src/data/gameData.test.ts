import { describe, expect, it } from "vitest";
import { getArmy, getRuleSet, getUnit, ruleSets } from "./gameData";
import { minMaxLabel } from "../components/UnitStats";

describe("rule-set registry", () => {
  it("ships three independently named rule sets", () => {
    expect(ruleSets.map(({ id, name }) => ({ id, name }))).toEqual([
      { id: "warmaster-revolution", name: "Warmaster Revolution" },
      { id: "wmr-2026-playtest", name: "WMR - 2026 Playtest" },
      { id: "warmaster-custom", name: "A Matter of Mustaches" },
    ]);
  });

  it("starts the 2026 Playtest as a retagged independent copy of WMR", () => {
    const base = getRuleSet("warmaster-revolution")!;
    const playtest = getRuleSet("wmr-2026-playtest")!;
    expect(playtest.armies).not.toBe(base.armies);
    expect(playtest.armies).toHaveLength(base.armies.length);

    const baseDwarfs = getArmy("warmaster-revolution", "dwarfs")!;
    const playtestDwarfs = getArmy("wmr-2026-playtest", "dwarfs")!;
    expect(playtestDwarfs).not.toBe(baseDwarfs);
    expect(playtestDwarfs.ruleSet).toBe("wmr-2026-playtest");
    expect(playtestDwarfs.units.every((unit) => unit.ruleSet === "wmr-2026-playtest")).toBe(true);
    const baseWarriors = getUnit(baseDwarfs, "dwarfs:warriors")!;
    const playtestWarriors = getUnit(playtestDwarfs, "dwarfs:warriors")!;
    expect(playtestWarriors).not.toBe(baseWarriors);
    expect(playtestWarriors).toMatchObject({
      unitId: baseWarriors.unitId,
      troop: baseWarriors.troop,
      points: baseWarriors.points,
      specials: baseWarriors.specials,
      scoutingPoints: baseWarriors.scoutingPoints,
    });
    expect(getUnit(playtestDwarfs, "dwarfs:ram-riders")).toBeUndefined();
  });

  it.each([
    ["araby", "araby:knights"],
    ["bretonnia", "bretonnia:knights"],
    ["empire", "empire:knights"],
    ["vampire-counts", "vampire-counts:black-knights"],
  ])("caps %s Heavy Cavalry at 3 per 1000 only in Playtest", (armyId, unitId) => {
    const playtestUnit = getUnit(getArmy("wmr-2026-playtest", armyId)!, unitId)!;
    const baseUnit = getUnit(getArmy("warmaster-revolution", armyId)!, unitId)!;
    expect(playtestUnit.max).toBe(3);
    expect(playtestUnit.maxPerArmy).toBe(false);
    expect(minMaxLabel(playtestUnit, 2)).toMatch(/\/6$/);
    expect(playtestUnit.specials.at(-1)).toBe(
      "**Playtest:** this unit is modified per the 2026 Playtest rules in Warmaster Journal 2026",
    );
    expect(baseUnit.max).not.toBe(3);
  });

  it("changes only the Playtest High Elf General", () => {
    const playtestGeneral = getUnit(
      getArmy("wmr-2026-playtest", "high-elves")!,
      "high-elves:general",
    )!;
    const baseGeneral = getUnit(
      getArmy("warmaster-revolution", "high-elves")!,
      "high-elves:general",
    )!;
    const customGeneral = getUnit(
      getArmy("warmaster-custom", "high-elves")!,
      "high-elves:general",
    )!;

    expect(playtestGeneral.points).toBe(155);
    expect(playtestGeneral.specials).toContain(
      "**Elven Hubris:** If this character rolls 11 or 12 when issuing an order, their leadership is lowered to 9 for the rest of the game.",
    );
    expect(playtestGeneral.specials.at(-1)).toBe(
      "**Playtest:** this unit is modified per the 2026 Playtest rules in Warmaster Journal 2026",
    );
    expect(baseGeneral.points).toBe(180);
    expect(baseGeneral.specials.join(" ")).not.toContain("Elven Hubris");
    expect(customGeneral.points).toBe(180);
    expect(customGeneral.specials.join(" ")).not.toContain("Elven Hubris");
  });
});
