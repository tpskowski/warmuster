import { describe, expect, it } from "vitest";
import { getArmy, getUnit } from "../data/gameData";
import {
  addCharacter,
  addUnit,
  addUnitCopy,
  assignMagicItem,
  breakPoint,
  countOf,
  createList,
  entryStands,
  magicItemBearer,
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

  it("keeps a split unit next to the rest of its stack", () => {
    let list = freshList();
    list = addUnit(list, "chaos:chaos-warriors"); // stack we'll split
    list = addUnit(list, "chaos:chaos-warriors");
    list = addUnit(list, "chaos:ogres"); // another unit in between
    list = toggleUnitUpgrade(list, 0, "chaos:chariot"); // split off one warrior
    // Both Chaos Warrior entries sit together, before the Ogres.
    expect(list.units.map((u) => u.unitId)).toEqual([
      "chaos:chaos-warriors",
      "chaos:chaos-warriors",
      "chaos:ogres",
    ]);
  });

  it("merges identical upgraded units into one quantity", () => {
    let list = freshList();
    list = addUnit(list, "chaos:chaos-warriors");
    list = addUnit(list, "chaos:chaos-warriors");
    list = addUnit(list, "chaos:chaos-warriors");
    list = toggleUnitUpgrade(list, 0, "chaos:chariot"); // 2 plain + 1 chariot
    list = toggleUnitUpgrade(list, 0, "chaos:chariot"); // split another; should merge
    const chariotEntries = list.units.filter((u) => u.upgrades.includes("chaos:chariot"));
    expect(chariotEntries).toHaveLength(1);
    expect(chariotEntries[0].quantity).toBe(2);
    expect(countOf(list, "chaos:chaos-warriors")).toBe(3);
  });

  it("preserves existing upgrades when splitting a merged upgraded stack", () => {
    let list = freshList();
    for (let i = 0; i < 3; i++) list = addUnit(list, "chaos:chaos-warriors");
    // Give the whole stack a chariot by splitting each off and merging.
    list = toggleUnitUpgrade(list, 0, "chaos:chariot");
    list = toggleUnitUpgrade(list, 0, "chaos:chariot");
    const stack = list.units.find((u) => u.upgrades.includes("chaos:chariot"))!;
    expect(stack.quantity).toBe(2);
    // The chariot upgrade is intact on the merged 2× stack.
    expect(stack.upgrades).toEqual(["chaos:chariot"]);
  });

  it("computes points including character upgrades", () => {
    let list = freshList();
    list = addUnit(list, "chaos:chaos-warriors"); // 140
    list = addCharacter(list, "chaos:general"); // 125
    list = toggleCharacterUpgrade(list, list.characters[0].id, "chaos:chaos-dragon"); // +100
    expect(totalPoints(list, chaos)).toBe(365);
  });

  it("breaks at half the non-character units, rounded up", () => {
    let list = freshList();
    expect(breakPoint(list)).toBe(0);
    for (let i = 0; i < 3; i++) list = addCharacter(list, "chaos:general");
    expect(breakPoint(list)).toBe(0); // characters never count
    for (let i = 0; i < 5; i++) list = addUnit(list, "chaos:chaos-warriors");
    expect(breakPoint(list)).toBe(3);
    for (let i = 0; i < 5; i++) list = addUnit(list, "chaos:ogres");
    expect(breakPoint(list)).toBe(5);
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

  it("grows the upgraded entry, keeping its upgrade, when a copy is added", () => {
    let list = freshList();
    list = addUnit(list, "chaos:chaos-warriors");
    list = addUnit(list, "chaos:chaos-warriors"); // 2 plain
    list = toggleUnitUpgrade(list, 0, "chaos:chariot"); // 1 plain + 1 chariot
    const chariotIndex = list.units.findIndex((u) => u.upgrades.includes("chaos:chariot"));
    list = addUnitCopy(list, chariotIndex);
    const chariot = list.units.find((u) => u.upgrades.includes("chaos:chariot"))!;
    expect(chariot.quantity).toBe(2);
    expect(chariot.upgrades).toEqual(["chaos:chariot"]);
    // The plain copy is untouched; only the upgraded entry grew.
    expect(list.units.find((u) => u.upgrades.length === 0)!.quantity).toBe(1);
    expect(countOf(list, "chaos:chaos-warriors")).toBe(3);
  });

  it("increments a plain entry in place", () => {
    let list = freshList();
    list = addUnit(list, "chaos:ogres");
    list = addUnitCopy(list, 0);
    expect(list.units).toHaveLength(1);
    expect(list.units[0].quantity).toBe(2);
  });

  it("counts stands added by an attachment", () => {
    const empire = getArmy("warmaster-revolution", "empire")!;
    let list = createList("warmaster-revolution", "2.2.6", "empire", "Empire", 2000);
    list = addUnit(list, "empire:halberdiers");
    const halberdiers = getUnit(empire, "empire:halberdiers")!;
    expect(entryStands(empire, list.units[0], halberdiers)).toBe(3);
    // Skirmishers attach a stand: the unit fields four.
    list = toggleUnitUpgrade(list, 0, "empire:skirmishers");
    const attached = list.units.find((u) => u.upgrades.includes("empire:skirmishers"))!;
    expect(entryStands(empire, attached, halberdiers)).toBe(4);
  });

  it("leaves the stand count alone for a character's mount", () => {
    let list = freshList();
    list = addCharacter(list, "chaos:general");
    list = toggleCharacterUpgrade(list, list.characters[0].id, "chaos:chaos-dragon");
    const general = getUnit(chaos, "chaos:general")!;
    expect(entryStands(chaos, list.characters[0], general)).toBe(1);
  });

  it("adds a plain copy rather than inflating a magic-item entry", () => {
    let list = freshList();
    list = addUnit(list, "chaos:chaos-warriors");
    list = assignMagicItem(list, "magic:sword-of-might", { kind: "unit", index: 0 });
    const bearerIndex = list.units.findIndex((u) => u.magicItems.length > 0);
    list = addUnitCopy(list, bearerIndex);
    const bearer = list.units.find((u) => u.magicItems.length > 0)!;
    const plain = list.units.find((u) => u.magicItems.length === 0)!;
    expect(bearer.quantity).toBe(1); // item still carried by a single unit
    expect(plain.quantity).toBe(1);
    expect(countOf(list, "chaos:chaos-warriors")).toBe(2);
  });
});

describe("magic items", () => {
  it("splits one unit out of a merged stack when it takes an item", () => {
    let list = freshList();
    for (let i = 0; i < 3; i++) list = addUnit(list, "chaos:chaos-warriors");
    list = assignMagicItem(list, "magic:sword-of-might", { kind: "unit", index: 0 });
    expect(list.units).toHaveLength(2);
    const plain = list.units.find((u) => u.magicItems.length === 0)!;
    const bearer = list.units.find((u) => u.magicItems.includes("magic:sword-of-might"))!;
    expect(plain.quantity).toBe(2);
    expect(bearer.quantity).toBe(1);
    expect(countOf(list, "chaos:chaos-warriors")).toBe(3);
  });

  it("adds the item cost once, not per unit in the stack", () => {
    let list = freshList();
    for (let i = 0; i < 3; i++) list = addUnit(list, "chaos:chaos-warriors"); // 3 × 140
    list = assignMagicItem(list, "magic:battle-banner", { kind: "unit", index: 0 });
    // Chaos Warriors have 4 attacks -> major Battle Banner, 20 pts.
    expect(totalPoints(list, chaos)).toBe(440);
  });

  it("merges the split entry back when the item is removed", () => {
    let list = freshList();
    for (let i = 0; i < 3; i++) list = addUnit(list, "chaos:chaos-warriors");
    list = assignMagicItem(list, "magic:sword-of-might", { kind: "unit", index: 0 });
    list = assignMagicItem(list, "magic:sword-of-might", null);
    expect(list.units).toHaveLength(1);
    expect(list.units[0].quantity).toBe(3);
  });

  it("moves an item from one bearer to another", () => {
    let list = freshList();
    list = addUnit(list, "chaos:chaos-warriors");
    list = addCharacter(list, "chaos:hero");
    list = assignMagicItem(list, "magic:sword-of-might", { kind: "unit", index: 0 });
    list = assignMagicItem(list, "magic:sword-of-might", {
      kind: "character",
      id: list.characters[0].id,
    });
    expect(list.units.every((u) => u.magicItems.length === 0)).toBe(true);
    expect(list.characters[0].magicItems).toEqual(["magic:sword-of-might"]);
    expect(magicItemBearer(list, "magic:sword-of-might")).toEqual({
      kind: "character",
      id: list.characters[0].id,
    });
  });

  it("keeps upgraded entries separate when merging after removal", () => {
    let list = freshList();
    list = addUnit(list, "chaos:chaos-warriors");
    list = addUnit(list, "chaos:chaos-warriors");
    list = toggleUnitUpgrade(list, 0, "chaos:chariot");
    list = assignMagicItem(list, "magic:sword-of-might", { kind: "unit", index: 0 });
    list = assignMagicItem(list, "magic:sword-of-might", null);
    // The chariot-upgraded unit must not merge into the plain stack.
    expect(list.units.some((u) => u.upgrades.includes("chaos:chariot"))).toBe(true);
    expect(countOf(list, "chaos:chaos-warriors")).toBe(2);
  });

  it("refuses a second item on a bearer that already carries one", () => {
    let list = freshList();
    list = addCharacter(list, "chaos:general");
    const id = list.characters[0].id;
    list = assignMagicItem(list, "magic:crown-of-command", { kind: "character", id });
    list = assignMagicItem(list, "magic:sword-of-might", { kind: "character", id });
    expect(list.characters[0].magicItems).toEqual(["magic:crown-of-command"]);

    list = addUnit(list, "chaos:chaos-warriors");
    list = assignMagicItem(list, "magic:sword-of-might", { kind: "unit", index: 0 });
    list = assignMagicItem(list, "magic:sword-of-cleaving", { kind: "unit", index: 0 });
    expect(list.units[0].magicItems).toEqual(["magic:sword-of-might"]);
  });

  it("flags ineligible bearers and doubled-up items from imported data", () => {
    let list = freshList();
    list = addCharacter(list, "chaos:hero");
    const id = list.characters[0].id;
    list = assignMagicItem(list, "magic:crown-of-command", { kind: "character", id });
    // A second item can no longer be assigned, but imported or legacy lists
    // may still carry one; validation must flag it.
    list = {
      ...list,
      characters: list.characters.map((c) =>
        c.id === id ? { ...c, magicItems: [...c.magicItems, "magic:sword-of-might"] } : c,
      ),
    };
    const issues = validateList(list, chaos);
    expect(issues.some((i) => i.message.includes("cannot take Crown of Command"))).toBe(true);
    expect(issues.some((i) => i.message.includes("can only carry one magic item"))).toBe(true);
  });
});

describe("validateList", () => {
  it("requires a General and min units, scaled per 1000 points", () => {
    const list = freshList(); // 2000 points
    const issues = validateList(list, chaos);
    // With a single General choice, the requirement is conveyed by that unit's
    // own per-unit min message rather than a duplicate army-wide one.
    expect(
      issues.some((i) => i.unitId === "chaos:general" && i.message.includes("at least 1")),
    ).toBe(true);
    expect(issues.some((i) => i.message.includes("must include a General"))).toBe(false);
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

  it("uses ×2 Min/Max from 2000–2999 points and ×3 at 3000", () => {
    const issueFor = (pointsLimit: number, unitId: string, count: number) => {
      let list = createList("warmaster-revolution", "2.2.6", "chaos", "Boundary", pointsLimit);
      for (let i = 0; i < count; i++) list = addUnit(list, unitId);
      return validateList(list, chaos).find((issue) => issue.unitId === unitId);
    };

    expect(issueFor(2999, "chaos:chaos-warriors", 1)?.message).toContain("at least 2");
    expect(issueFor(3000, "chaos:chaos-warriors", 2)?.message).toContain("at least 3");

    expect(issueFor(2999, "chaos:harpies", 2)).toBeUndefined();
    expect(issueFor(2999, "chaos:harpies", 3)?.message).toContain("at most 2");
    expect(issueFor(3000, "chaos:harpies", 3)).toBeUndefined();
    expect(issueFor(3000, "chaos:harpies", 4)?.message).toContain("at most 3");
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

describe("Dwarf army-specific rules", () => {
  const dwarfs = getArmy("warmaster-revolution", "dwarfs")!;
  const dwarfList = (pointsLimit = 2000) =>
    createList("warmaster-revolution", "2.2.6", "dwarfs", "Dwarfs", pointsLimit);

  it("caps the Anvil at one per army regardless of points", () => {
    // Two Runesmiths are allowed at 2000 points, but only one Anvil overall.
    let list = dwarfList();
    list = addCharacter(list, "dwarfs:runesmith");
    list = addCharacter(list, "dwarfs:runesmith");
    list = toggleCharacterUpgrade(list, list.characters[0].id, "dwarfs:anvil");
    list = toggleCharacterUpgrade(list, list.characters[1].id, "dwarfs:anvil");
    const issues = validateList(list, dwarfs);
    expect(
      issues.some((i) => i.unitId === "dwarfs:anvil" && i.message.includes("at most 1")),
    ).toBe(true);
  });

  it("offers the Oath Stone as a Dwarf Hero upgrade, capped per army", () => {
    const oathstone = getUnit(dwarfs, "dwarfs:oathstone")!;
    expect(oathstone.category).toBe("upgrade");
    expect(oathstone.eligibleToUpgrade).toContain("dwarfs:hero");
    expect(oathstone.maxPerArmy).toBe(true);
  });

  it("lets Handgunners stand in for the Warriors minimum, per 1000 points", () => {
    // At 2000 points Warriors need 4. Three Warriors + one Handgunners covers
    // it because up to two Handgunners (1 per 1000) count toward the minimum.
    let list = dwarfList(2000);
    for (let i = 0; i < 3; i++) list = addUnit(list, "dwarfs:warriors");
    list = addUnit(list, "dwarfs:handgunners");
    expect(
      validateList(list, dwarfs).some((i) => i.unitId === "dwarfs:warriors"),
    ).toBe(false);
  });

  it("only credits one Handgunner unit per 1000 toward the Warriors minimum", () => {
    // At 2000 points, only two Handgunners can substitute. Two Warriors plus
    // one Handgunner is 3 effective, still short of the required 4.
    let list = dwarfList(2000);
    for (let i = 0; i < 2; i++) list = addUnit(list, "dwarfs:warriors");
    list = addUnit(list, "dwarfs:handgunners");
    const issue = validateList(list, dwarfs).find((i) => i.unitId === "dwarfs:warriors");
    // The message spells the substitution out, so a count that only adds up
    // because of a stand-in does not look like a miscount.
    expect(issue?.message).toContain("at least 4 required (2 selected, plus 1 Handgunners standing in)");
  });
});

describe("unit substitution", () => {
  const listFor = (armyId: string, pointsLimit = 2000) =>
    createList("warmaster-revolution", "2.2.6", armyId, "Test", pointsLimit);

  it("lets Dogs of War Handgunners stand in for Crossbowmen", () => {
    const dow = getArmy("warmaster-revolution", "dogs-of-war")!;
    // Crossbowmen need 4 at 2000 pts. Three plus one Handgunners covers it.
    let list = listFor("dogs-of-war");
    for (let i = 0; i < 3; i++) list = addUnit(list, "dogs-of-war:crossbowmen");
    list = addUnit(list, "dogs-of-war:handgunners");
    expect(
      validateList(list, dow).some((i) => i.unitId === "dogs-of-war:crossbowmen"),
    ).toBe(false);
  });

  it("caps the stand-in at the per-1000 allowance", () => {
    const dow = getArmy("warmaster-revolution", "dogs-of-war")!;
    // Only two Handgunners can substitute at 2000 pts, so two Crossbowmen
    // plus three Handgunners is still one short of the required four.
    let list = listFor("dogs-of-war");
    for (let i = 0; i < 1; i++) list = addUnit(list, "dogs-of-war:crossbowmen");
    for (let i = 0; i < 3; i++) list = addUnit(list, "dogs-of-war:handgunners");
    const issue = validateList(list, dow).find((i) => i.unitId === "dogs-of-war:crossbowmen");
    expect(issue?.message).toContain("1 selected, plus 2 Handgunners standing in");
  });

  it("lets any number of Cathay Handguns stand in for Crossbows", () => {
    const cathay = getArmy("warmaster-revolution", "cathay")!;
    // "Any or all" — the substitution has no per-1000 cap.
    let list = listFor("cathay");
    for (let i = 0; i < 6; i++) list = addUnit(list, "cathay:handguns");
    expect(validateList(list, cathay).some((i) => i.unitId === "cathay:crossbows")).toBe(false);
  });

  it("credits two Squig Herds per 1000 toward the Goblin minimum", () => {
    const goblins = getArmy("warmaster-revolution", "goblins")!;
    const squig = getUnit(goblins, "goblins:squig-herd")!;
    expect(squig.substitutesFor).toEqual({ unitId: "goblins:goblins", perThousand: 2 });
    // Goblins need 8 at 2000 pts. Five Squig Herds are taken but only four
    // (2 per 1000) can stand in, so 3 Goblins + 4 credited is still short.
    let list = listFor("goblins");
    for (let i = 0; i < 3; i++) list = addUnit(list, "goblins:goblins");
    for (let i = 0; i < 5; i++) list = addUnit(list, "goblins:squig-herd");
    const issue = validateList(list, goblins).find((i) => i.unitId === "goblins:goblins");
    expect(issue?.message).toContain("3 selected, plus 4 Squig Herd standing in");
    // One more Goblin unit reaches the minimum via the substitution.
    list = addUnit(list, "goblins:goblins");
    expect(validateList(list, goblins).some((i) => i.unitId === "goblins:goblins")).toBe(false);
  });

  it("counts a stand-in toward the replaced unit's max, not just its min", () => {
    const cd = getArmy("warmaster-revolution", "chaos-dwarfs")!;
    // Chaos Dwarfs are -/4 per 1000 -> 8 at 2000. A Blunderbuss unit occupies
    // one of those slots, so 8 + 1 breaches the max.
    let list = listFor("chaos-dwarfs");
    for (let i = 0; i < 8; i++) list = addUnit(list, "chaos-dwarfs:chaos-dwarfs");
    expect(
      validateList(list, cd).some((i) => i.unitId === "chaos-dwarfs:chaos-dwarfs"),
    ).toBe(false);
    list = addUnit(list, "chaos-dwarfs:blunderbusses");
    const issue = validateList(list, cd).find((i) => i.unitId === "chaos-dwarfs:chaos-dwarfs");
    expect(issue?.message).toContain("at most 8 allowed");
    expect(issue?.message).toContain("Blunderbusses standing in");
  });

  it("still applies the stand-in unit's own max", () => {
    const dow = getArmy("warmaster-revolution", "dogs-of-war")!;
    // Handgunners are -/2 per 1000 -> 4 at 2000, independent of substituting.
    let list = listFor("dogs-of-war");
    for (let i = 0; i < 5; i++) list = addUnit(list, "dogs-of-war:handgunners");
    expect(
      validateList(list, dow).some(
        (i) => i.unitId === "dogs-of-war:handgunners" && i.message.includes("at most 4 allowed"),
      ),
    ).toBe(true);
  });
});

describe("per-army caps and dependencies", () => {
  const witchHunters = getArmy("warmaster-revolution", "witch-hunters")!;
  const kislev = getArmy("warmaster-revolution", "kislev")!;
  const skaven = getArmy("warmaster-revolution", "skaven")!;

  it("caps the Witch Hunter War Altar at one per army at 2000 points", () => {
    let list = createList("warmaster-revolution", "2.2.6", "witch-hunters", "WH", 2000);
    list = addCharacter(list, "witch-hunters:warrior-priest");
    list = addCharacter(list, "witch-hunters:warrior-priest");
    list = toggleCharacterUpgrade(list, list.characters[0].id, "witch-hunters:war-altar");
    list = toggleCharacterUpgrade(list, list.characters[1].id, "witch-hunters:war-altar");
    expect(
      validateList(list, witchHunters).some(
        (i) => i.unitId === "witch-hunters:war-altar" && i.message.includes("at most 1"),
      ),
    ).toBe(true);
  });

  it("requires a unit of Flagellants for the War Altar", () => {
    let list = createList("warmaster-revolution", "2.2.6", "witch-hunters", "WH", 2000);
    list = addCharacter(list, "witch-hunters:warrior-priest");
    list = toggleCharacterUpgrade(list, list.characters[0].id, "witch-hunters:war-altar");
    // No Flagellants yet: the dependency should flag.
    expect(
      validateList(list, witchHunters).some(
        (i) => i.unitId === "witch-hunters:war-altar" && i.message.includes("Flagellants"),
      ),
    ).toBe(true);
    // Adding a unit of Flagellants clears it.
    list = addUnit(list, "witch-hunters:flagellants");
    expect(
      validateList(list, witchHunters).some((i) => i.unitId === "witch-hunters:war-altar"),
    ).toBe(false);
  });

  it("caps the Kislev Yozhin at one per army at 2000 points", () => {
    let list = createList("warmaster-revolution", "2.2.6", "kislev", "Kislev", 2000);
    list = addCharacter(list, "kislev:shaman");
    list = addCharacter(list, "kislev:shaman");
    list = toggleCharacterUpgrade(list, list.characters[0].id, "kislev:yozhin");
    list = toggleCharacterUpgrade(list, list.characters[1].id, "kislev:yozhin");
    expect(
      validateList(list, kislev).some(
        (i) => i.unitId === "kislev:yozhin" && i.message.includes("at most 1"),
      ),
    ).toBe(true);
  });

  it("caps the Skaven Screaming Bell at one per army at 2000 points", () => {
    let list = createList("warmaster-revolution", "2.2.6", "skaven", "Skaven", 2000);
    list = addUnit(list, "skaven:screaming-bell");
    list = addUnit(list, "skaven:screaming-bell");
    expect(
      validateList(list, skaven).some(
        (i) => i.unitId === "skaven:screaming-bell" && i.message.includes("at most 1"),
      ),
    ).toBe(true);
  });

  it("requires Witch Elves for the Dark Elf Cauldron of Blood, capped per army", () => {
    const darkElves = getArmy("warmaster-revolution", "dark-elves")!;
    let list = createList("warmaster-revolution", "2.2.6", "dark-elves", "DE", 2000);
    list = addCharacter(list, "dark-elves:sorceress");
    list = toggleCharacterUpgrade(list, list.characters[0].id, "dark-elves:cauldron-of-blood");
    // No Witch Elves yet: the dependency should flag.
    expect(
      validateList(list, darkElves).some(
        (i) => i.unitId === "dark-elves:cauldron-of-blood" && i.message.includes("Witch Elves"),
      ),
    ).toBe(true);
    // Adding a unit of Witch Elves clears the dependency.
    list = addUnit(list, "dark-elves:witch-elves");
    expect(
      validateList(list, darkElves).some(
        (i) => i.unitId === "dark-elves:cauldron-of-blood" && i.message.includes("Witch Elves"),
      ),
    ).toBe(false);
    // A second Cauldron trips the per-army cap.
    list = addCharacter(list, "dark-elves:sorceress");
    list = toggleCharacterUpgrade(list, list.characters[1].id, "dark-elves:cauldron-of-blood");
    expect(
      validateList(list, darkElves).some(
        (i) => i.unitId === "dark-elves:cauldron-of-blood" && i.message.includes("at most 1"),
      ),
    ).toBe(true);
  });

  it("gives the Empire War Altar the same Flagellants + one-per-army rules", () => {
    const empire = getArmy("warmaster-revolution", "empire")!;
    let list = createList("warmaster-revolution", "2.2.6", "empire", "Empire", 2000);
    list = addCharacter(list, "empire:wizard");
    list = toggleCharacterUpgrade(list, list.characters[0].id, "empire:war-altar");
    expect(
      validateList(list, empire).some(
        (i) => i.unitId === "empire:war-altar" && i.message.includes("Flagellants"),
      ),
    ).toBe(true);
    list = addUnit(list, "empire:flagellants");
    expect(
      validateList(list, empire).some(
        (i) => i.unitId === "empire:war-altar" && i.message.includes("Flagellants"),
      ),
    ).toBe(false);
  });
});
