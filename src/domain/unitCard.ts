import type { UnitData } from "../types";

// Unit-card model: what goes on a printed card and which font-fit level it
// needs. Cards print ~6 per page (2 x 3 on A4); when special rules run long
// the rules font steps down first, then stats/spacing compress (plan.md §15).

export interface CardStatRow {
  label: string;
  value: string;
}

export interface CardDiagram {
  kind: "rects" | "circle" | "none";
  count: number;
  orientation: "horizontal" | "vertical";
}

export interface CardModel {
  unitId: string;
  name: string;
  type: string;
  subType: string | null;
  stats: CardStatRow[];
  rules: string[];
  diagram: CardDiagram;
  fitLevel: number;
  fits: boolean;
}

// Brief type-rule summaries shown when a unit has no special rules (and to
// remind how the troop type behaves). These paraphrase the WMR rulebook.
const TYPE_RULES: Record<string, string> = {
  Infantry:
    "Infantry can enter woods and other dense terrain, defend obstacles and garrison built-up areas.",
  Cavalry: "Cavalry cannot enter woods, marshes or built-up areas.",
  Chariot:
    "+1 Attack per stand when charging enemy in the open, in addition to the normal charge bonus. Cannot enter woods, marshes or built-up areas.",
  Chariots:
    "+1 Attack per stand when charging enemy in the open, in addition to the normal charge bonus. Cannot enter woods, marshes or built-up areas.",
  Monster:
    "+1 Attack per stand when charging enemy in the open, in addition to the normal charge bonus.",
  Artillery:
    "Artillery cannot charge on initiative, never pursues, and is destroyed if forced to retreat from combat. It can only cross open ground, hills and bridges, and can shoot over intervening troops from high ground.",
  Machine: "Machines follow their own movement and combat rules — see special rules.",
  General:
    "Character stand: joins units and adds bonus Attacks. Cannot be shot at or attacked directly. If the General is killed the battle is lost.",
  Hero: "Character stand: joins units and adds bonus Attacks. Cannot be shot at or attacked directly.",
  Wizard:
    "Character stand: joins units, adds bonus Attacks and casts spells. Cannot be shot at or attacked directly.",
};

const FLYER_RULE = "Flyer: uses the flying movement rules and can move over units and terrain.";

/**
 * Shooting range. Prefer an explicit "range of Ncm" in the unit's own rules,
 * fall back to the rulebook's standard artillery ranges (by attack profile)
 * or the standard 30cm missile range.
 */
export function rangeOf(unit: UnitData): number | null {
  if (unit.rangedAttacks == null && unit.rangedAttackProfile == null) return null;
  for (const text of unit.specials) {
    const m = text.match(
      /(?:(?:maximum )?range (?:of|is reduced to|is restricted to)|ranges up to)\s?(?:only )?(\d+)\s?cm/i,
    );
    if (m) return Number(m[1]);
  }
  if (unit.type === "Artillery" || unit.type === "Machine") {
    const profile = unit.rangedAttackProfile ?? "";
    if (/bounce/i.test(profile)) return 60; // cannon
    if (/skewer/i.test(profile)) return 40; // bolt thrower
    if (unit.specials.some((t) => /elven bolt thrower/i.test(t))) return 40;
    if (unit.specials.some((t) => /stone thrower/i.test(t))) return 60;
    return null; // varies; the special rules explain
  }
  return 30;
}

function signedValue(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

/** Stat rows for the card; rows without a value are omitted entirely. */
export function cardStats(unit: UnitData): CardStatRow[] {
  const rows: CardStatRow[] = [];
  const melee = unit.meleeAttackProfile ?? (unit.meleeAttacks != null ? String(unit.meleeAttacks) : null);
  const ranged = unit.rangedAttackProfile ?? (unit.rangedAttacks != null ? String(unit.rangedAttacks) : null);
  if (melee != null) rows.push({ label: "Melee Attacks", value: melee });
  if (ranged != null) rows.push({ label: "Ranged Attacks", value: ranged });
  if (unit.bonusAttacks != null) rows.push({ label: "Bonus Attacks", value: signedValue(unit.bonusAttacks) });
  if (unit.hits != null) rows.push({ label: "Hits", value: String(unit.hits) });
  if (unit.armour != null) rows.push({ label: "Armour", value: unit.armour });
  if (unit.command != null) rows.push({ label: "Command", value: String(unit.command) });
  if (unit.bonusCommand != null) rows.push({ label: "Command", value: signedValue(unit.bonusCommand) });
  const range = rangeOf(unit);
  if (range != null) rows.push({ label: "Range", value: `${range}cm` });
  if (unit.speed != null) rows.push({ label: "Speed", value: `${unit.speed}cm` });
  return rows;
}

/** Rule paragraphs: special rules if any, otherwise type rules. */
export function cardRules(unit: UnitData): string[] {
  const rules: string[] = [];
  if (unit.subType === "Flying") rules.push(FLYER_RULE);
  if (unit.specials.length > 0) {
    rules.push(...unit.specials);
  } else {
    const typeRule = TYPE_RULES[unit.type];
    if (typeRule) rules.push(typeRule);
  }
  return rules;
}

export function cardDiagram(unit: UnitData): CardDiagram {
  if (unit.category === "character") return { kind: "circle", count: 1, orientation: "horizontal" };
  if (unit.category === "upgrade") return { kind: "none", count: 0, orientation: "horizontal" };
  // A modifier changes another unit's size; it is not a stand count itself.
  const count = unit.unitSize ?? 0;
  if (count <= 0) return { kind: "none", count: 0, orientation: "horizontal" };
  // Long-edge units draw wide (horizontal) stands; short-edge draw tall ones.
  return {
    kind: "rects",
    count,
    orientation: unit.facing === "long" ? "horizontal" : "vertical",
  };
}

// Character capacity of the rules region per fit level. The stats block
// floats left, so rules text flows beside it and then full-width below it.
// Derived from the printed card geometry (~92 x 88mm inner, stats block
// ~26mm wide) at the level's font size; deliberately conservative.
interface FitLevel {
  besideChars: number;
  belowChars: number;
}

export const FIT_LEVELS: FitLevel[] = [
  { besideChars: 330, belowChars: 600 }, // L0: rules 8pt
  { besideChars: 430, belowChars: 850 }, // L1: rules 7pt
  { besideChars: 600, belowChars: 1150 }, // L2: rules 6pt, stats compact
  { besideChars: 750, belowChars: 2450 }, // L3: rules 5pt, everything compact
];

/** Estimated character cost of the rule paragraphs (paragraph breaks cost a partial line). */
export function rulesTextCost(rules: string[]): number {
  return rules.reduce((sum, text) => sum + text.length + 40, 0);
}

export function estimateFit(unit: UnitData): { level: number; fits: boolean } {
  const cost = rulesTextCost(cardRules(unit));
  for (let level = 0; level < FIT_LEVELS.length; level++) {
    const { besideChars, belowChars } = FIT_LEVELS[level];
    if (cost <= besideChars + belowChars) return { level, fits: true };
  }
  return { level: FIT_LEVELS.length - 1, fits: false };
}

export function buildCard(unit: UnitData): CardModel {
  const { level, fits } = estimateFit(unit);
  return {
    unitId: unit.unitId,
    name: unit.troop,
    type: unit.subType ? `${unit.type} (${unit.subType})` : unit.type,
    subType: unit.subType,
    stats: cardStats(unit),
    rules: cardRules(unit),
    diagram: cardDiagram(unit),
    fitLevel: level,
    fits,
  };
}


