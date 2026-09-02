import { describe, expect, it } from "vitest";
import { getArmy, getRuleSet, getUnit } from "./gameData";

const customDwarfs = getArmy("warmaster-custom", "dwarfs")!;
const customGoblins = getArmy("warmaster-custom", "goblins")!;
const baseDwarfs = getArmy("warmaster-revolution", "dwarfs")!;
const customHeroIds = [
  "dwarfs:dramar-thungnisson",
  "dwarfs:dramar-thungnisson-mounted",
  "dwarfs:dorin-khazadsson",
  "dwarfs:yorri-thungnisson",
  "dwarfs:brok-wheatbrow",
  "dwarfs:aldrich-of-the-unberogen",
  "dwarfs:torgo-thungnisson",
  "dwarfs:torgo-thungnisson-mounted",
  "dwarfs:kadri-broadbrew",
  "dwarfs:logor-hardhaft",
  "dwarfs:rungni-silverhorn",
  "dwarfs:roknar-gromdal",
];

function customUnit(army: typeof customDwarfs, unitId: string) {
  const unit = army.units.find((u) => u.unitId === unitId);
  if (!unit) throw new Error(`missing ${unitId}`);
  return unit;
}

describe("custom units", () => {
  it("adds them only to the custom rule set, not the base", () => {
    const ids = [
      "dwarfs:ram-riders",
      "dwarfs:ancestral-warriors",
      "dwarfs:iron-breakers",
      "dwarfs:bull-ogres",
      ...customHeroIds,
    ];
    for (const id of ids) {
      expect(getUnit(customDwarfs, id), id).toBeDefined();
      expect(getUnit(baseDwarfs, id), id).toBeUndefined();
    }
    expect(getUnit(customGoblins, "goblins:giant-squig")).toBeDefined();
    expect(getRuleSet("warmaster-custom")!.name).toBe("A Matter of Mustaches");
  });

  it.each(customHeroIds)("caps %s at one per army regardless of game size", (unitId) => {
    const hero = customUnit(customDwarfs, unitId);
    expect(hero.max).toBe(1);
    expect(hero.maxPerArmy).toBe(true);
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
    expect(ram.min).toBeNull();
    expect(ram.max).toBe(2);
    expect(ram.maxPerArmy).toBe(false);
  });

  it("Ancestral Warriors: 4+ save, 130 pts, no magic-item clause, renamed rules", () => {
    const anc = customUnit(customDwarfs, "dwarfs:ancestral-warriors");
    expect(anc.armour).toBe("4+");
    expect(anc.points).toBe(130);
    expect(anc.min).toBeNull();
    expect(anc.max).toBe(2);
    expect(anc.maxPerArmy).toBe(false);
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
    expect(iron.min).toBeNull();
    expect(iron.max).toBe(2);
    expect(iron.maxPerArmy).toBe(false);
    expect(iron.specials.join(" ")).toMatch(
      /Ironbreakers cannot be driven back by shooting and do not roll for drive backs\./,
    );
  });

  it("Bull Ogres: Ogre Kingdoms unit available to Dwarfs at -/1 per 1000", () => {
    const ogres = customUnit(customDwarfs, "dwarfs:bull-ogres");
    expect(ogres.troop).toBe("Bull Ogres");
    expect(ogres.army).toBe("dwarfs");
    expect(ogres.type).toBe("Infantry");
    expect(ogres.meleeAttacks).toBe(4);
    expect(ogres.hits).toBe(4);
    expect(ogres.armour).toBe("5+");
    expect(ogres.unitSize).toBe(3);
    expect(ogres.points).toBe(105);
    expect(ogres.min).toBeNull();
    expect(ogres.max).toBe(1);
    expect(ogres.maxPerArmy).toBe(false);
  });

  it("Dramar Thungnisson: Dwarf Hero with Ironbreaker's Resolve", () => {
    const dramar = customUnit(customDwarfs, "dwarfs:dramar-thungnisson");
    expect(dramar.type).toBe("Hero");
    expect(dramar.category).toBe("character");
    expect(dramar.bonusAttacks).toBe(1);
    expect(dramar.command).toBe(8);
    expect(dramar.points).toBe(80);
    expect(dramar.max).toBe(1);
    expect(dramar.specialName).toBe("Ironbreaker's Resolve");
    expect(dramar.specials).toEqual([
      "When attached to a unit, one shooting hit inflicted on the unit after saves have been taken in each turn is ignored. This includes hits from magic spells inflicted in the Shooting phase.",
    ]);
  });

  it("Dramar Thungnisson (Mounted): Dwarf Hero with two named rules", () => {
    const dramar = customUnit(customDwarfs, "dwarfs:dramar-thungnisson-mounted");
    expect(dramar.type).toBe("Hero");
    expect(dramar.category).toBe("character");
    expect(dramar.speed).toBe(60);
    expect(dramar.bonusAttacks).toBe(1);
    expect(dramar.command).toBe(8);
    expect(dramar.points).toBe(80);
    expect(dramar.max).toBe(1);
    expect(dramar.specialName).toBeNull();
    expect(dramar.specials).toEqual([
      "**For the Hold!:** When attached to a unit, if that unit has moved into contact with an enemy unit this turn you can re-roll one unsuccessful attack each round of combat.",
      "**Ironbreaker's Resolve:** When attached to a unit, one shooting hit inflicted on the unit after saves have been taken in each turn is ignored. This includes hits from magic spells inflicted in the Shooting phase.",
    ]);
  });

  it("Dorin Khazadsson: Dwarf Hero deploying with miners", () => {
    const dorin = customUnit(customDwarfs, "dwarfs:dorin-khazadsson");
    expect(dorin.type).toBe("Hero");
    expect(dorin.category).toBe("character");
    expect(dorin.speed).toBe(60);
    expect(dorin.bonusAttacks).toBe(1);
    expect(dorin.command).toBe(8);
    expect(dorin.points).toBe(80);
    expect(dorin.max).toBe(1);
    expect(dorin.specialName).toBe("Underway Ambush");
    expect(dorin.specials).toEqual([
      "This character and up to 3 Infantry units can be set aside before the battle. Starting on the second turn, at the end of the movement phase, this character’s controller can set this character and those miner units up anywhere on the battlefield as a brigade with this character attached. All models must be at least 20cm away from enemy units and they can not move this turn.",
    ]);
  });

  it("Yorri Thungnisson: Dwarf Hero with extra and conditional attacks", () => {
    const yorri = customUnit(customDwarfs, "dwarfs:yorri-thungnisson");
    expect(yorri.type).toBe("Hero");
    expect(yorri.category).toBe("character");
    expect(yorri.speed).toBe(60);
    expect(yorri.bonusAttacks).toBe(2);
    expect(yorri.command).toBe(8);
    expect(yorri.points).toBe(80);
    expect(yorri.max).toBe(1);
    expect(yorri.specials).toEqual([
      "**This Will be the One:** When the unit this character is attached to is in close combat with an enemy Giant or Troll increase bonus attacks by +1.",
    ]);
  });

  it("Brok Wheatbrow: Dwarf Hero who can remove an engaged unit's damage", () => {
    const brok = customUnit(customDwarfs, "dwarfs:brok-wheatbrow");
    expect(brok.type).toBe("Hero");
    expect(brok.category).toBe("character");
    expect(brok.speed).toBe(60);
    expect(brok.bonusAttacks).toBe(1);
    expect(brok.command).toBe(8);
    expect(brok.points).toBe(80);
    expect(brok.max).toBe(1);
    expect(brok.specialName).toBe("Hearty Provisions");
    expect(brok.specials).toEqual([
      "Once per game during the combat phase when the unit Brok is attached to has resolved a round of combat and remains engaged it may remove all damage it has suffered as if it had fallen out of combat.",
    ]);
  });

  it("Aldrich of the Unberogen: tall Dwarf Hero with extended sight", () => {
    const aldrich = customUnit(customDwarfs, "dwarfs:aldrich-of-the-unberogen");
    expect(aldrich.type).toBe("Hero");
    expect(aldrich.category).toBe("character");
    expect(aldrich.speed).toBe(60);
    expect(aldrich.bonusAttacks).toBe(1);
    expect(aldrich.command).toBe(8);
    expect(aldrich.points).toBe(80);
    expect(aldrich.max).toBe(1);
    expect(aldrich.specialName).toBe("Is Tall");
    expect(aldrich.specials).toEqual([
      "This character counts their command range as 40cm rather than 20cm. If this unit is attached to a friendly unit, that unit may ignore other dwarf and goblin units for the purposes of line of sight for shooting attacks.",
    ]);
  });

  it("Torgo Thungnisson: Dwarf Hero who directs artillery fire", () => {
    const torgo = customUnit(customDwarfs, "dwarfs:torgo-thungnisson");
    expect(torgo.type).toBe("Hero");
    expect(torgo.category).toBe("character");
    expect(torgo.speed).toBe(60);
    expect(torgo.bonusAttacks).toBe(1);
    expect(torgo.command).toBe(8);
    expect(torgo.points).toBe(80);
    expect(torgo.max).toBe(1);
    expect(torgo.maxPerArmy).toBe(true);
    expect(torgo.specialName).toBe("Eye For Shooting");
    expect(torgo.specials).toEqual([
      "Once per game, if this character is attached to an Artillery unit that unit may fire twice during the shooting phase at the same or different targets.",
    ]);
  });

  it("Torgo Thungnisson (Mounted): long-based Hero supporting Gyrocopters", () => {
    const torgo = customUnit(customDwarfs, "dwarfs:torgo-thungnisson-mounted");
    expect(torgo.type).toBe("Hero");
    expect(torgo.category).toBe("character");
    expect(torgo.facing).toBe("long");
    expect(torgo.speed).toBe(60);
    expect(torgo.bonusAttacks).toBe(1);
    expect(torgo.command).toBe(8);
    expect(torgo.points).toBe(80);
    expect(torgo.max).toBe(1);
    expect(torgo.maxPerArmy).toBe(true);
    expect(torgo.specialName).toBe("Master of the Skies");
    expect(torgo.specials).toEqual([
      "This character can be attached to a Gyrocopter unit, while this character is attached to a Gyrocopter unit, that unit can form a brigade with other Gyrocopter units. An attached Gyrocopter unit gains +3 bonus shooting attacks.",
    ]);
  });

  it("Kadri Broadbrew: Dwarf Hero with a once-per-game lucky brew", () => {
    const kadri = customUnit(customDwarfs, "dwarfs:kadri-broadbrew");
    expect(kadri.type).toBe("Hero");
    expect(kadri.category).toBe("character");
    expect(kadri.speed).toBe(60);
    expect(kadri.bonusAttacks).toBe(1);
    expect(kadri.command).toBe(8);
    expect(kadri.points).toBe(80);
    expect(kadri.max).toBe(1);
    expect(kadri.maxPerArmy).toBe(true);
    expect(kadri.specialName).toBe("Kadri’s Lucky Brew");
    expect(kadri.specials).toEqual([
      "When attached to a unit you can choose to immediately re-roll all the unit's Attack dice once in either the Shooting phase or Combat phase, including any bonus attacks from magic items or characters. All the dice must be re-rolled, including any that have scored hits. This effect only works once per game.",
    ]);
  });

  it("Logor Hardhaft: Dwarf Hero who deploys with Rangers", () => {
    const logor = customUnit(customDwarfs, "dwarfs:logor-hardhaft");
    expect(logor.type).toBe("Hero");
    expect(logor.category).toBe("character");
    expect(logor.speed).toBe(60);
    expect(logor.bonusAttacks).toBe(1);
    expect(logor.command).toBe(8);
    expect(logor.points).toBe(80);
    expect(logor.max).toBe(1);
    expect(logor.maxPerArmy).toBe(true);
    expect(logor.specialName).toBe("Hold Scout");
    expect(logor.specials).toEqual([
      "This character and any number of Ranger units may be set aside during deployment. After both armies have completed deployment, any Ranger units set aside with this model are deployed on the table at least 20cm away from any enemy units, this character is then attached to one of those units.",
    ]);
  });

  it("Rungni Silverhorn: Dwarf Hero who relocates Ancestral Warriors", () => {
    const rungni = customUnit(customDwarfs, "dwarfs:rungni-silverhorn");
    expect(rungni.type).toBe("Hero");
    expect(rungni.category).toBe("character");
    expect(rungni.speed).toBe(60);
    expect(rungni.bonusAttacks).toBe(1);
    expect(rungni.command).toBe(8);
    expect(rungni.points).toBe(80);
    expect(rungni.max).toBe(1);
    expect(rungni.maxPerArmy).toBe(true);
    expect(rungni.specialName).toBe("Ethereal Passage");
    expect(rungni.specials).toEqual([
      "This character may only be attached to Ancestral Warriors. Once per game at the end of the movement phase, this character, any Ancestral Warrior unit they have joined, and any Ancestral Warrior units in a brigade with that unit may be removed from the table and set up again at least 20cm away from enemy models.",
    ]);
  });

  it("Roknar Gromdal: Runesmith who dispels spells within 50cm on a 3+", () => {
    const roknar = customUnit(customDwarfs, "dwarfs:roknar-gromdal");
    expect(roknar.type).toBe("Hero");
    expect(roknar.category).toBe("character");
    expect(roknar.speed).toBe(60);
    expect(roknar.bonusAttacks).toBe(1);
    expect(roknar.command).toBe(8);
    expect(roknar.points).toBe(90);
    expect(roknar.max).toBe(1);
    expect(roknar.maxPerArmy).toBe(true);
    expect(roknar.specialName).toBe("Break the Winds of Magic");
    expect(roknar.specials).toEqual([
      "If an enemy Wizard who is within 50cm of the Roknar casts a spell then he can attempt to anti-magic it. To determine if this works roll a D6 - on the score of 3+ the Roknar has succeeded and the spell is dispelled by the Roknar's defiant efforts. If he fails then the spell works as normal. Roknar can attempt to anti-magic any number of spells in a turn.",
    ]);
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
