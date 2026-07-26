import { describe, expect, it } from "vitest";
import type { SavedList } from "../types";
import { getArmy, getUnit } from "../data/gameData";
import { hireableFor, isHired, isMercenary } from "../data/mercenaries";
import { hireConflicts, hiredCount, hireLimit, resolveCountsAs } from "./hiring";
import { addCharacter, addUnit, createList } from "./lists";
import { validateList } from "./validation";

const army = (id: string) => getArmy("warmaster-revolution", id)!;

function listFor(armyId: string, pointsLimit = 2000): SavedList {
  const list = createList("warmaster-revolution", "2.2.6", armyId, "Test", pointsLimit);
  return { ...list, allowMercenaries: true };
}

/** The slot labels a regiment consumes when hired by an army. */
function slots(regimentId: string, armyId: string): string[] {
  const hiring = army(armyId);
  return resolveCountsAs(getUnit(hiring, regimentId)!, hiring).map((s) => s.label);
}

describe("mercenary composition", () => {
  it("copies every regiment into each other army", () => {
    const regiments = army("regiments-of-renown").units;
    for (const id of ["empire", "dwarfs", "nippon"]) {
      const hosts = army(id).units.filter(isMercenary);
      expect(hosts).toHaveLength(regiments.length);
    }
  });

  it("leaves the Regiments of Renown army itself alone", () => {
    expect(army("regiments-of-renown").units.every(isMercenary)).toBe(true);
    expect(hireableFor(army("regiments-of-renown"))).toHaveLength(0);
  });

  it("reaches the custom rule set too", () => {
    const custom = getArmy("warmaster-custom", "dwarfs")!;
    expect(custom.units.some((u) => u.unitId === "regiments-of-renown:gotrek-and-felix")).toBe(true);
  });

  it("caps each regiment at one per army regardless of army size", () => {
    let list = listFor("empire", 3000);
    list = addUnit(list, "regiments-of-renown:alcatani-fellowship");
    list = addUnit(list, "regiments-of-renown:alcatani-fellowship");
    const issue = validateList(list, army("empire")).find(
      (i) => i.unitId === "regiments-of-renown:alcatani-fellowship",
    );
    expect(issue?.message).toContain("at most 1 allowed");
  });
});

// The rulebook's own worked examples from the "Hiring Regiments of Renown"
// section — if these resolve, the derivation from each army's data is right.
describe("counts-as, against the rulebook examples", () => {
  it("Alcatani Fellowship in a Dwarf army takes a Ranger slot", () => {
    expect(slots("regiments-of-renown:alcatani-fellowship", "dwarfs")).toEqual(["Rangers"]);
  });

  it("Marksmen of Miragliano in a Chaos army restrict nothing", () => {
    // Chaos has no limited shooting infantry, so hiring costs the army nothing.
    expect(slots("regiments-of-renown:marksmen-of-miragliano", "chaos")).toEqual([]);
  });

  it("Braganza's Besiegers in a Tomb Kings army take a monster slot", () => {
    const tk = army("tomb-kings");
    const [slot] = resolveCountsAs(
      getUnit(tk, "regiments-of-renown:braganzas-besiegers")!,
      tk,
    );
    expect(slot.unitIds).toEqual(
      expect.arrayContaining([
        "tomb-kings:carrion",
        "tomb-kings:bone-giant",
        "tomb-kings:sphinx",
      ]),
    );
  });

  it("Asarnil in an Araby army takes a Hero and a Djinn slot", () => {
    expect(slots("regiments-of-renown:asarnil-the-dragonlord", "araby")).toEqual([
      "Hero",
      "Djinn",
    ]);
  });

  it("Voland's Venators take a Gutter Runners slot in Skaven and a Ranger slot in Dwarfs", () => {
    expect(slots("regiments-of-renown:volands-venators", "skaven")).toEqual(["Gutter Runners"]);
    expect(slots("regiments-of-renown:volands-venators", "dwarfs")).toEqual(["Rangers"]);
  });

  it("Bronzino's Galloper Guns take the priciest artillery slot", () => {
    expect(slots("regiments-of-renown:bronzinos-galloper-guns", "dwarfs")).toEqual(["Cannon"]);
  });

  it("the Birdmen take a flying 3-stand slot", () => {
    expect(slots("regiments-of-renown:birdmen-of-catrazza", "high-elves")).toEqual([
      "Giant Eagles",
    ]);
  });

  it("Vespero's Vendetta restricts nothing anywhere", () => {
    expect(slots("regiments-of-renown:vesperos-vendetta", "empire")).toEqual([]);
    expect(slots("regiments-of-renown:anakondas-amazons", "dwarfs")).toEqual([]);
  });
});

describe("allowance consumption", () => {
  it("shrinks the Dwarf Rangers cap by one", () => {
    const dwarfs = army("dwarfs");
    let list = listFor("dwarfs", 2000); // Rangers are -/2, so 4 at 2000 pts
    for (let i = 0; i < 4; i += 1) list = addUnit(list, "dwarfs:rangers");
    expect(validateList(list, dwarfs).some((i) => i.unitId === "dwarfs:rangers")).toBe(false);

    list = addUnit(list, "regiments-of-renown:alcatani-fellowship");
    const issue = validateList(list, dwarfs).find((i) => i.unitId === "dwarfs:rangers");
    expect(issue?.message).toContain("at most 3 allowed");
    expect(issue?.message).toContain("Alcatani Fellowship");
  });

  it("charges a shared pool when the choice is the player's", () => {
    const tk = army("tomb-kings");
    let list = listFor("tomb-kings", 1000);
    // Carrion, Bone Giant and Sphinx are one each: three monsters at 1000 pts.
    list = addUnit(list, "tomb-kings:carrion");
    list = addUnit(list, "tomb-kings:bone-giant");
    list = addUnit(list, "tomb-kings:sphinx");
    expect(validateList(list, tk).some((i) => i.message.includes("between them"))).toBe(false);

    list = addUnit(list, "regiments-of-renown:braganzas-besiegers");
    const issue = validateList(list, tk).find((i) => i.message.includes("between them"));
    expect(issue?.message).toContain("at most 2");
  });

  it("does not let a hired regiment satisfy a minimum", () => {
    const dwarfs = army("dwarfs");
    let list = listFor("dwarfs", 1000);
    list = addUnit(list, "regiments-of-renown:alcatani-fellowship");
    const issue = validateList(list, dwarfs).find((i) => i.unitId === "dwarfs:warriors");
    expect(issue?.message).toContain("at least 2 required");
  });
});

describe("hire limits and conflicts", () => {
  it("allows one regiment per full 1000 points", () => {
    expect(hireLimit(listFor("empire", 1500))).toBe(1);
    expect(hireLimit(listFor("empire", 2000))).toBe(2);
    expect(hireLimit(listFor("empire", 3000))).toBe(3);
  });

  it("flags a list over the hire cap", () => {
    const empire = army("empire");
    let list = listFor("empire", 1000);
    list = addUnit(list, "regiments-of-renown:vesperos-vendetta");
    expect(hiredCount(list, empire)).toBe(1);
    expect(validateList(list, empire).some((i) => i.message.includes("may be hired"))).toBe(false);

    list = addUnit(list, "regiments-of-renown:anakondas-amazons");
    const issue = validateList(list, empire).find((i) => i.message.includes("may be hired"));
    expect(issue?.message).toContain("at most 1 may be hired at 1000 points (2 hired)");
  });

  it("counts hired characters against the cap too", () => {
    const empire = army("empire");
    let list = listFor("empire", 1000);
    list = addCharacter(list, "regiments-of-renown:gotrek-and-felix");
    expect(hiredCount(list, empire)).toBe(1);
  });

  it("reports mutually exclusive regiments once", () => {
    // Kislev may hire both, so the only complaint is that they refuse to serve
    // together.
    const kislev = army("kislev");
    let list = listFor("kislev", 3000);
    list = addUnit(list, "regiments-of-renown:rugluds-armoured-orcs");
    list = addCharacter(list, "regiments-of-renown:gotrek-and-felix");
    expect(hireConflicts(list, kislev)).toHaveLength(1);
    const issues = validateList(list, kislev);
    expect(issues.some((i) => i.message.includes("cannot be hired alongside"))).toBe(true);
    expect(issues.some((i) => i.message.includes("Allies Table"))).toBe(false);
  });

  it("refuses Ruglud's Orcs alongside the Dogs of War Dwarfs unit", () => {
    const dow = army("dogs-of-war");
    let list = listFor("dogs-of-war", 2000);
    list = addUnit(list, "regiments-of-renown:rugluds-armoured-orcs");
    expect(hireConflicts(list, dow)).toHaveLength(0);

    list = addUnit(list, "dogs-of-war:dwarfs");
    const issue = validateList(list, dow).find((i) => i.message.includes("cannot be hired alongside"));
    expect(issue?.message).toContain("Dwarfs");
  });

  it("keeps regiments off the Allies Table out of the catalog", () => {
    // The Empire may not hire Ruglud's Armoured Orcs or the Birdmen.
    const offered = new Set(hireableFor(army("empire")).map((u) => u.unitId));
    expect(offered.has("regiments-of-renown:rugluds-armoured-orcs")).toBe(false);
    expect(offered.has("regiments-of-renown:birdmen-of-catrazza")).toBe(false);
    expect(offered.has("regiments-of-renown:gotrek-and-felix")).toBe(true);
    // Dogs of War may hire the lot.
    expect(hireableFor(army("dogs-of-war"))).toHaveLength(24);
  });

  it("flags a regiment its army may not hire", () => {
    const empire = army("empire");
    let list = listFor("empire", 2000);
    list = addUnit(list, "regiments-of-renown:rugluds-armoured-orcs");
    const issue = validateList(list, empire).find((i) => i.message.includes("Allies Table"));
    expect(issue?.message).toContain("Empire may not hire");
  });
});

describe("a Regiments of Renown army list is unaffected", () => {
  const ror = army("regiments-of-renown");

  it("still has its own catalog of units and characters", () => {
    // The catalog holds back regiments that are being hired into someone
    // else's list; in their own army they are the army.
    const own = ror.units.filter((u) => !isHired(u, ror));
    expect(own).toHaveLength(ror.units.length);
    expect(own.filter((u) => u.category === "unit").length).toBeGreaterThan(0);
    expect(own.filter((u) => u.category === "character").length).toBeGreaterThan(0);
  });

  it("charges no hire slots against itself", () => {
    for (const unit of ror.units) {
      expect(isHired(unit, ror)).toBe(false);
      expect(resolveCountsAs(unit, ror)).toEqual([]);
    }
  });

  it("does not apply hiring rules to itself", () => {
    let list = createList("warmaster-revolution", "2.2.6", "regiments-of-renown", "Test", 1000);
    list = addUnit(list, "regiments-of-renown:vesperos-vendetta");
    list = addUnit(list, "regiments-of-renown:anakondas-amazons");
    list = addUnit(list, "regiments-of-renown:bearmen-of-urslo");
    const issues = validateList(list, ror);
    expect(issues.some((i) => i.message.includes("may be hired"))).toBe(false);
    expect(issues.some((i) => i.message.includes("Allies Table"))).toBe(false);
    expect(hiredCount(list, ror)).toBe(0);
  });
});
