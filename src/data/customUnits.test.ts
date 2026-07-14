import { describe, expect, it } from "vitest";
import { getArmy, getRuleSet, getUnit } from "./gameData";

const customDwarfs = getArmy("warmaster-custom", "dwarfs")!;
const customGoblins = getArmy("warmaster-custom", "goblins")!;
const baseDwarfs = getArmy("warmaster-revolution", "dwarfs")!;

function customUnit(army: typeof customDwarfs, unitId: string) {
  const unit = army.units.find((u) => u.unitId === unitId);
  if (!unit) throw new Error(`missing ${unitId}`);
  return unit;
}

describe("custom units", () => {
  it("adds them only to the custom rule set, not the base", () => {
    const ids = ["dwarfs:ram-riders", "dwarfs:ancestral-warriors", "dwarfs:iron-breakers"];
    for (const id of ids) {
      expect(getUnit(customDwarfs, id), id).toBeDefined();
      expect(getUnit(baseDwarfs, id), id).toBeUndefined();
    }
    expect(getUnit(customGoblins, "goblins:giant-squig")).toBeDefined();
    expect(getRuleSet("warmaster-custom")!.name).toBe("Warmaster (Custom)");
  });

  it("Ram Riders copy the Chaos Dwarf Bull Centaurs", () => {
    const ram = customUnit(customDwarfs, "dwarfs:ram-riders");
    expect(ram.troop).toBe("Ram Riders");
    expect(ram.type).toBe("Cavalry");
    expect(ram.meleeAttacks).toBe(4);
    expect(ram.hits).toBe(4);
    expect(ram.armour).toBe("5+");
    expect(ram.points).toBe(140);
    expect(ram.army).toBe("dwarfs");
  });

  it("Ancestral Warriors: 4+ save, 130 pts, no magic-item clause, renamed rules", () => {
    const anc = customUnit(customDwarfs, "dwarfs:ancestral-warriors");
    expect(anc.armour).toBe("4+");
    expect(anc.points).toBe(130);
    const text = anc.specials.join(" ");
    expect(text).not.toMatch(/magic items/i);
    expect(text).not.toMatch(/Ethereal/i);
    expect(text).toMatch(/Ancestral Warriors cannot be driven back by shooting/);
    expect(text).toMatch(/inflict a hit on a score of 4\+/);
  });

  it("Iron Breakers: Dwarf Warriors with 3+ save, 140 pts, stubborn rule", () => {
    const iron = customUnit(customDwarfs, "dwarfs:iron-breakers");
    expect(iron.type).toBe("Infantry");
    expect(iron.armour).toBe("3+");
    expect(iron.points).toBe(140);
    expect(iron.specials.join(" ")).toMatch(
      /Ironbreakers cannot be driven back by shooting and do not roll for drive backs\./,
    );
  });

  it("Giant Squig: goblin monster with the given profile", () => {
    const squig = customUnit(customGoblins, "goblins:giant-squig");
    expect(squig.type).toBe("Monster");
    expect(squig.facing).toBe("short");
    expect(squig.meleeAttackProfile).toBe("2D6");
    expect(squig.hits).toBe(5);
    expect(squig.unitSize).toBe(1);
    expect(squig.max).toBe(1);
    expect(squig.points).toBe(140);
    expect(squig.speed).toBeNull(); // variable 5D6 move lives in the rules
    expect(squig.specials.join(" ")).toMatch(/roll and move it 5D6cm/);
  });
});
