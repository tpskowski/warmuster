import { describe, expect, it } from "vitest";
import { getArmy, getUnit, upgradesFor } from "./gameData";
import { addUnit, createList, entryPoints, toggleUnitUpgrade } from "../domain/lists";

// Attachment units (a stand that joins an eligible parent unit) are modelled
// as `category: "upgrade"` with `eligibleToUpgrade` listing the parents — the
// same mechanism used for mounts. These "not deployed as an independent unit"
// stands are all converted the same way via curation.
const ATTACHMENTS = [
  { army: "lizardmen", id: "lizardmen:salamander", cost: 20, parents: ["lizardmen:skinks"] },
  {
    army: "empire",
    id: "empire:skirmishers",
    cost: 20,
    parents: ["empire:halberdiers", "empire:crossbowmen", "empire:handgunners"],
  },
  {
    army: "witch-hunters",
    id: "witch-hunters:warhounds",
    cost: 20,
    parents: [
      "witch-hunters:zealots",
      "witch-hunters:halberdiers",
      "witch-hunters:crossbowmen",
      "witch-hunters:handgunners",
      "witch-hunters:flagellants",
    ],
  },
  {
    army: "wood-elves",
    id: "wood-elves:wardancers",
    cost: 25,
    parents: ["wood-elves:glade-guard", "wood-elves:eternal-guard"],
  },
] as const;

describe.each(ATTACHMENTS)("$id as an attachment", ({ army, id, cost, parents }) => {
  const armyData = getArmy("warmaster-revolution", army)!;

  it("is an upgrade offered on its parent units, not a stand-alone unit", () => {
    const unit = getUnit(armyData, id)!;
    expect(unit.category).toBe("upgrade");
    expect(unit.upgradePoints).toBe(cost);
    expect(unit.points).toBeNull();
    expect([...unit.eligibleToUpgrade].sort()).toEqual([...parents].sort());
    // Gone from the plain Units list.
    expect(armyData.units.some((u) => u.category === "unit" && u.unitId === id)).toBe(false);
    // Offered as an upgrade on each named parent.
    for (const parent of parents) {
      expect(upgradesFor(armyData, parent).map((u) => u.unitId)).toContain(id);
    }
  });

  it("adds its cost to a parent unit when attached", () => {
    let list = createList("warmaster-revolution", "2.2.6", army, "Test", 2000);
    list = addUnit(list, parents[0]);
    const parentUnit = getUnit(armyData, parents[0])!;
    const base = entryPoints(armyData, list.units[0], parentUnit);
    list = toggleUnitUpgrade(list, 0, id);
    const attached = list.units.find((u) => u.upgrades.includes(id))!;
    expect(entryPoints(armyData, attached, parentUnit)).toBe(base + cost);
  });

  it("carries into the custom rule set", () => {
    expect(getUnit(getArmy("warmaster-custom", army)!, id)!.category).toBe("upgrade");
  });
});
