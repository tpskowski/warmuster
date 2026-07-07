import type { ArmyData, UnitData } from "../types";

// Magic items from the Warmaster Revolution rulebook (2.1.0, "Magic" chapter).
// They are rule-set-wide rather than per-army, so they live here instead of
// the generated army data. Banner costs are tiered on the bearer's profile;
// cost() returns the points for a given bearer, or null when that bearer is
// not allowed to take the item at any price.

export type MagicItemKind = "standard" | "weapon" | "device";

export interface MagicItemData {
  itemId: string;
  name: string;
  kind: MagicItemKind;
  /** Human-readable bearer restriction, e.g. "General only". */
  restriction: string | null;
  /** Cost summary for display when no bearer is selected, e.g. "15–30 pts". */
  costLabel: string;
  text: string;
  cost: (unit: UnitData) => number | null;
  /** Extra bearer check beyond the kind-level rules (devices only). */
  allowed?: (unit: UnitData, army: ArmyData) => boolean;
}

/** Best (lowest) armour value on the profile: "0 or 6+" -> 6, "4+" -> 4. */
function bestArmour(unit: UnitData): number | null {
  const digits = unit.armour?.match(/\d/g) ?? [];
  const values = digits.map(Number).filter((n) => n >= 3 && n <= 6);
  return values.length > 0 ? Math.min(...values) : null;
}

/** Per-stand Attacks when charging; chariots add their charge bonus. */
function chargeAttacks(unit: UnitData): number | null {
  if (unit.meleeAttacks == null) return null;
  return unit.meleeAttacks + (unit.type.startsWith("Chariot") ? 1 : 0);
}

const BANNER_LOSS =
  "Every time a stand of the unit is removed roll a dice: on the roll of 1, 2 or 3 the banner is lost.";

function isGeneral(unit: UnitData): boolean {
  return unit.type === "General";
}

// Some army generals (Grey Seer, Vampire Lord, …) may take items restricted
// to either a General or a Wizard; their special rules say so explicitly.
function isWizard(unit: UnitData): boolean {
  if (unit.type === "Wizard") return true;
  return unit.specials.some((s) => /restricted to (?:either )?a General or a Wizard/i.test(s));
}

function isRunesmith(unit: UnitData): boolean {
  return /runesmith/i.test(unit.troop);
}

const NO_ELF_GENERALS = (unit: UnitData, army: ArmyData) =>
  isGeneral(unit) && army.army !== "dark-elves" && army.army !== "high-elves";

export const magicItems: MagicItemData[] = [
  // ------------------------------------------------------- magic standards
  {
    itemId: "magic:battle-banner",
    name: "Battle Banner",
    kind: "standard",
    restriction: null,
    costLabel: "15–30 pts",
    text: `A unit with this banner increases the close combat Attacks of each of its stands by +1. ${BANNER_LOSS}`,
    cost: (unit) => {
      const attacks = chargeAttacks(unit);
      if (attacks == null) return null;
      return attacks >= 5 ? 30 : attacks >= 3 ? 20 : 15;
    },
  },
  {
    itemId: "magic:banner-of-shielding",
    name: "Banner of Shielding",
    kind: "standard",
    restriction: "Units with 5+, 6+ or no armour",
    costLabel: "20–30 pts",
    text: `A unit with this banner has its Armour increased in effectiveness by +1. If the unit's Armour is 5+ then this banner increases it to 4+ and so on. ${BANNER_LOSS}`,
    cost: (unit) => {
      const armour = bestArmour(unit);
      if (armour === 5) return 30;
      if (armour === 6 || armour == null) return 20;
      return null;
    },
  },
  {
    itemId: "magic:banner-of-fortitude",
    name: "Banner of Fortitude",
    kind: "standard",
    restriction: "Units with 3 Hits only",
    costLabel: "30 pts",
    text: `A unit with this banner increases the Hits of each of its stands by +1. ${BANNER_LOSS}`,
    cost: (unit) => (unit.hits === 3 ? 30 : null),
  },
  {
    itemId: "magic:banner-of-steadfastness",
    name: "Banner of Steadfastness",
    kind: "standard",
    restriction: "Units with 4+, 5+, 6+ or no armour",
    costLabel: "5–15 pts",
    text: `One shooting hit inflicted on the unit after saves have been taken in each turn is ignored because the missiles are cast aside by the Banner of Steadfastness. This includes hits from magic spells inflicted in the Shooting phase. ${BANNER_LOSS}`,
    cost: (unit) => {
      const armour = bestArmour(unit);
      if (armour === 4) return 15;
      if (armour === 5) return 10;
      if (armour === 6 || armour == null) return 5;
      return null;
    },
  },
  {
    itemId: "magic:banner-of-fortune",
    name: "Banner of Fortune",
    kind: "standard",
    restriction: null,
    costLabel: "5–15 pts",
    text: "The player can choose to immediately re-roll all the unit's Attack dice once in either the Shooting phase or Combat phase, including any bonus attacks from magic items or characters. All the dice must be re-rolled, including any that have scored hits. The Banner of Fortune works only once during the game.",
    cost: (unit) => {
      const attacks = chargeAttacks(unit);
      if (attacks == null) return null;
      return attacks >= 5 ? 15 : attacks >= 3 ? 10 : 5;
    },
  },
  // --------------------------------------------------------- magic weapons
  {
    itemId: "magic:sword-of-destruction",
    name: "Sword of Destruction",
    kind: "weapon",
    restriction: null,
    costLabel: "10 pts",
    text: "One enemy unit that the bearer's unit is touching must re-roll one successful Armour roll in each round of combat. Only one enemy unit can be affected by this.",
    cost: () => 10,
  },
  {
    itemId: "magic:sword-of-fate",
    name: "Sword of Fate",
    kind: "weapon",
    restriction: null,
    costLabel: "5 pts",
    text: "In the first round of the unit's first combat, a unit with this sword adds a +1 bonus to the Attack value of one stand, in a similar way to the Attack bonus of a character. The Sword of Fate only works once in the entire game. This gives +1 Attack in total, not +1 to each stand.",
    cost: () => 5,
  },
  {
    itemId: "magic:sword-of-cleaving",
    name: "Sword of Cleaving",
    kind: "weapon",
    restriction: null,
    costLabel: "10 pts",
    text: "A unit with this sword can re-roll one unsuccessful Attack dice each round of combat.",
    cost: () => 10,
  },
  {
    itemId: "magic:sword-of-might",
    name: "Sword of Might",
    kind: "weapon",
    restriction: null,
    costLabel: "10 pts",
    text: "A unit with this sword adds a +1 bonus to the Attack value of one stand, similar to the Attack bonus of a character. This gives +1 Attack in total, not +1 to each stand.",
    cost: () => 10,
  },
  // ------------------------------------------------------ devices of power
  {
    itemId: "magic:crown-of-command",
    name: "Crown of Command",
    kind: "device",
    restriction: "General only",
    costLabel: "70 pts",
    text: "The General can choose to issue his first order of each turn against an unmodified Command value of 10; no command penalties apply. Should the General fail to issue his first order by rolling an 11 or 12, the Crown of Command ceases to work.",
    cost: () => 70,
    allowed: isGeneral,
  },
  {
    itemId: "magic:helm-of-dominion",
    name: "Helm of Dominion",
    kind: "device",
    restriction: "General only",
    costLabel: "40 pts",
    text: "The General's Command value is increased by +1 up to a maximum value of 10. The Helm of Dominion works for one turn only during the entire battle; the player must specify at the start of the turn if he wishes to employ its powers.",
    cost: () => 40,
    allowed: isGeneral,
  },
  {
    itemId: "magic:orb-of-majesty",
    name: "Orb of Majesty",
    kind: "device",
    restriction: "General only (not Dark Elf or High Elf)",
    costLabel: "30 pts",
    text: "The General may disregard a single failed Command test and roll it again as if he had a Command value of 8. The Orb of Majesty will only work once in the entire game and only affects an order issued by the General.",
    cost: () => 30,
    allowed: NO_ELF_GENERALS,
  },
  {
    itemId: "magic:ring-of-magic",
    name: "Ring of Magic",
    kind: "device",
    restriction: "Wizard only",
    costLabel: "30 pts",
    text: "A Wizard with this ring is able to cast a spell on the roll of 2+. This item will only work once in the entire game and when used it cannot be combined with any other item granting a spell casting bonus.",
    cost: () => 30,
    allowed: isWizard,
  },
  {
    itemId: "magic:staff-of-spellbinding",
    name: "Staff of Spellbinding",
    kind: "device",
    restriction: "Wizard or Dwarf Runesmith only",
    costLabel: "30 pts",
    text: "If an enemy Wizard fails to cast a spell, he can be spellbound on the D6 roll of a 4+. A spellbound Wizard suffers a -1 dice penalty each time he tries to cast a spell. The Staff of Spellbinding ceases to work once it has been used successfully.",
    cost: () => 30,
    allowed: (unit) => isWizard(unit) || isRunesmith(unit),
  },
  {
    itemId: "magic:sceptre-of-sovereignty",
    name: "Sceptre of Sovereignty",
    kind: "device",
    restriction: "General only (not Dark Elf or High Elf)",
    costLabel: "20 pts",
    text: "The General may ignore one blundered 'double 6' roll for an order made by either himself or any of the army's other characters. If ignored, the Command test is passed and the character may continue issuing orders as normal.",
    cost: () => 20,
    allowed: NO_ELF_GENERALS,
  },
  {
    itemId: "magic:scroll-of-dispelling",
    name: "Scroll of Dispelling",
    kind: "device",
    restriction: "Wizard or Dwarf Runesmith only",
    costLabel: "20 pts",
    text: "The bearer can cause an enemy's spell to fail on the roll of 2+. The Scroll can only be used once to nullify the effect of a spell an enemy Wizard has successfully cast. In the case of a Runesmith, the Scroll can be used after a normal Dwarf anti-magic roll has failed.",
    cost: () => 20,
    allowed: (unit) => isWizard(unit) || isRunesmith(unit),
  },
  {
    itemId: "magic:wand-of-power",
    name: "Wand of Power",
    kind: "device",
    restriction: "Wizard only",
    costLabel: "10 pts",
    text: "A Wizard with the Wand of Power can add +1 to the chance of a spell working once during the game. The player must decide that he is using the Wand of Power before rolling the dice. As always a spell fails on the roll of a 1.",
    cost: () => 10,
    allowed: isWizard,
  },
  {
    itemId: "magic:rod-of-repetition",
    name: "Rod of Repetition",
    kind: "device",
    restriction: "Wizard only",
    costLabel: "10 pts",
    text: "If a Wizard casts a spell and rolls sufficiently well for it to work then he can cast another spell. He can only do this once during the entire game. The next spell can be the same spell again or a different one and is cast exactly like any other.",
    cost: () => 10,
    allowed: isWizard,
  },
];

const itemIndex = new Map(magicItems.map((item) => [item.itemId, item]));

export function getMagicItem(itemId: string): MagicItemData | undefined {
  return itemIndex.get(itemId);
}

/** Points cost of an item for a bearer; falls back to the item's highest tier
 * when the bearer is unknown or not eligible (warn-but-allow philosophy). */
export function magicItemCost(itemId: string, unit: UnitData | undefined): number {
  const item = itemIndex.get(itemId);
  if (!item) return 0;
  const tier = unit ? item.cost(unit) : null;
  return tier ?? maxCost(item);
}

function maxCost(item: MagicItemData): number {
  // costLabel is "N pts" or "N–M pts"; the last number is the highest tier.
  const digits = item.costLabel.match(/\d+/g);
  return digits ? Number(digits[digits.length - 1]) : 0;
}

// Units that may carry standards and weapons: ordinary infantry, cavalry and
// chariot units. Monsters, war machines and flyers are excluded (rulebook);
// every flying unit in the data moves 60cm, faster than any ground unit.
function isOrdinaryUnit(unit: UnitData): boolean {
  return (
    unit.category === "unit" &&
    (unit.type === "Infantry" || unit.type === "Cavalry" || unit.type.startsWith("Chariot")) &&
    (unit.speed == null || unit.speed < 60)
  );
}

// A few units say so outright, e.g. "A Rat Swarm cannot be given magic items".
function deniesMagicItems(unit: UnitData): boolean {
  return unit.specials.some((s) => /cannot (?:be given|have) (?:a )?magic items?/i.test(s));
}

export function canBearMagicItem(item: MagicItemData, unit: UnitData, army: ArmyData): boolean {
  if (deniesMagicItems(unit)) return false;
  switch (item.kind) {
    case "standard":
      return isOrdinaryUnit(unit) && item.cost(unit) != null;
    case "weapon":
      return isOrdinaryUnit(unit) || unit.category === "character";
    case "device":
      return unit.category === "character" && (item.allowed?.(unit, army) ?? true);
  }
}
