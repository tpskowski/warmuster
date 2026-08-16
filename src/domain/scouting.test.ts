import { describe, expect, it } from "vitest";
import { getArmy, getUnit } from "../data/gameData";
import { createList } from "./lists";
import { effectiveScoutingPoints, totalScoutingPoints } from "./scouting";

describe("scouting totals", () => {
  const army = getArmy("warmaster-revolution", "empire")!;

  it("uses attached Scouts and flying mounts for configured entries", () => {
    const halberdiers = getUnit(army, "empire:halberdiers")!;
    const general = getUnit(army, "empire:general")!;
    expect(effectiveScoutingPoints(army, halberdiers, ["empire:skirmishers"])).toBe(2);
    expect(effectiveScoutingPoints(army, general, ["empire:griffon"])).toBe(3);
  });

  it("multiplies unit stacks and includes characters", () => {
    const list = createList("warmaster-revolution", "2.26", "empire", "Scouts", 1000);
    list.units = [
      {
        unitId: "empire:halberdiers",
        quantity: 2,
        upgrades: ["empire:skirmishers"],
        magicItems: [],
        scoutingCommitted: true,
      },
    ];
    list.characters = [
      {
        id: "general",
        unitId: "empire:general",
        upgrades: ["empire:griffon"],
        magicItems: [],
        scoutingCommitted: true,
      },
    ];
    expect(totalScoutingPoints(list, army)).toBe(7);
  });

  it("excludes entries that are not committed", () => {
    const list = createList("warmaster-revolution", "2.26", "empire", "Scouts", 1000);
    list.units = [
      {
        unitId: "empire:pistoliers",
        quantity: 2,
        upgrades: [],
        magicItems: [],
      },
    ];
    list.characters = [
      {
        id: "general",
        unitId: "empire:general",
        upgrades: [],
        magicItems: [],
        scoutingCommitted: true,
      },
    ];
    expect(totalScoutingPoints(list, army)).toBe(2);
  });
});
