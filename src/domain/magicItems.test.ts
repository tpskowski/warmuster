import { describe, expect, it } from "vitest";
import { getArmy, getUnit } from "../data/gameData";
import { canBearMagicItem, getMagicItem, magicItems, magicItemCost } from "./magicItems";

const chaos = getArmy("warmaster-revolution", "chaos")!;
const dwarfs = getArmy("warmaster-revolution", "dwarfs")!;
const highElves = getArmy("warmaster-revolution", "high-elves")!;
const lizardmen = getArmy("warmaster-revolution", "lizardmen")!;

const warriors = getUnit(chaos, "chaos:chaos-warriors")!; // Infantry, 4 attacks, 4+ armour
const trolls = getUnit(chaos, "chaos:trolls")!; // Infantry, 5 attacks, 5+ armour, 3 hits
const harpies = getUnit(chaos, "chaos:harpies")!; // Monster (flyer)
const general = getUnit(chaos, "chaos:general")!;
const hero = getUnit(chaos, "chaos:hero")!;
const sorcerer = getUnit(chaos, "chaos:sorcerer")!;

describe("hired Regiments of Renown", () => {
  const ror = getArmy("warmaster-revolution", "regiments-of-renown")!;
  // Infantry and a Hero — bearers that would otherwise be eligible.
  const bearmen = getUnit(chaos, "regiments-of-renown:bearmen-of-urslo")!;
  const gotrek = getUnit(chaos, "regiments-of-renown:gotrek-and-felix")!;

  it("cannot be given any magic item once hired", () => {
    for (const item of magicItems) {
      expect(canBearMagicItem(item, bearmen, chaos)).toBe(false);
      expect(canBearMagicItem(item, gotrek, chaos)).toBe(false);
    }
  });

  it("still take items in a Regiments of Renown army of their own", () => {
    const banner = getMagicItem("magic:battle-banner")!;
    const sword = getMagicItem("magic:sword-of-might")!;
    expect(canBearMagicItem(banner, getUnit(ror, bearmen.unitId)!, ror)).toBe(true);
    expect(canBearMagicItem(sword, getUnit(ror, gotrek.unitId)!, ror)).toBe(true);
  });
});

describe("magic item costs", () => {
  it("tiers the Battle Banner on the unit's attacks", () => {
    expect(magicItemCost("magic:battle-banner", warriors)).toBe(20);
    expect(magicItemCost("magic:battle-banner", trolls)).toBe(30);
  });

  it("tiers the Banner of Steadfastness on the unit's armour", () => {
    expect(magicItemCost("magic:banner-of-steadfastness", warriors)).toBe(15);
    expect(magicItemCost("magic:banner-of-steadfastness", trolls)).toBe(10);
  });

  it("charges flat costs for weapons and devices", () => {
    expect(magicItemCost("magic:sword-of-might", warriors)).toBe(10);
    expect(magicItemCost("magic:crown-of-command", general)).toBe(70);
  });

  it("falls back to the highest tier for an unknown bearer", () => {
    expect(magicItemCost("magic:battle-banner", undefined)).toBe(30);
  });
});

describe("magic item eligibility", () => {
  const battleBanner = getMagicItem("magic:battle-banner")!;
  const shielding = getMagicItem("magic:banner-of-shielding")!;
  const fortitude = getMagicItem("magic:banner-of-fortitude")!;
  const sword = getMagicItem("magic:sword-of-might")!;
  const crown = getMagicItem("magic:crown-of-command")!;
  const ring = getMagicItem("magic:ring-of-magic")!;
  const staff = getMagicItem("magic:staff-of-spellbinding")!;
  const orb = getMagicItem("magic:orb-of-majesty")!;

  it("allows standards on ordinary units only", () => {
    expect(canBearMagicItem(battleBanner, warriors, chaos)).toBe(true);
    expect(canBearMagicItem(battleBanner, harpies, chaos)).toBe(false); // monster
    expect(canBearMagicItem(battleBanner, general, chaos)).toBe(false); // character
  });

  it("restricts tiered banners to eligible profiles", () => {
    expect(canBearMagicItem(shielding, warriors, chaos)).toBe(false); // 4+ armour
    expect(canBearMagicItem(shielding, trolls, chaos)).toBe(true); // 5+ armour
    expect(canBearMagicItem(fortitude, warriors, chaos)).toBe(false); // 4 hits
    expect(canBearMagicItem(fortitude, trolls, chaos)).toBe(true); // 3 hits
  });

  it("allows weapons on units and characters", () => {
    expect(canBearMagicItem(sword, warriors, chaos)).toBe(true);
    expect(canBearMagicItem(sword, hero, chaos)).toBe(true);
    expect(canBearMagicItem(sword, harpies, chaos)).toBe(false);
  });

  it("restricts devices of power by character type", () => {
    expect(canBearMagicItem(crown, general, chaos)).toBe(true);
    expect(canBearMagicItem(crown, hero, chaos)).toBe(false);
    expect(canBearMagicItem(ring, sorcerer, chaos)).toBe(true);
    expect(canBearMagicItem(ring, general, chaos)).toBe(false);
  });

  it("lets a Dwarf Runesmith use scroll and staff", () => {
    const runesmith = getUnit(dwarfs, "dwarfs:runesmith")!;
    expect(canBearMagicItem(staff, runesmith, dwarfs)).toBe(true);
    expect(canBearMagicItem(ring, runesmith, dwarfs)).toBe(false);
  });

  it("denies the Orb of Majesty to elf generals", () => {
    const elfGeneral = highElves.units.find((u) => u.type === "General")!;
    expect(canBearMagicItem(orb, elfGeneral, highElves)).toBe(false);
    expect(canBearMagicItem(orb, general, chaos)).toBe(true);
  });

  it("treats the Slann as a Wizard for Wizard-only items", () => {
    // The Slann is the Lizardmen General but casts spells as a Wizard, so it
    // may take Wizard-only devices such as the Wand of Power and Ring of Magic.
    const slann = getUnit(lizardmen, "lizardmen:slann-mage-palanquin")!;
    const wand = getMagicItem("magic:wand-of-power")!;
    expect(canBearMagicItem(wand, slann, lizardmen)).toBe(true);
    expect(canBearMagicItem(ring, slann, lizardmen)).toBe(true);
    // Still a General, so General-only items remain available too.
    expect(canBearMagicItem(crown, slann, lizardmen)).toBe(true);
  });
});
