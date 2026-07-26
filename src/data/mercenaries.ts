import type { ArmyData, RuleSetInfo, UnitData } from "../types";

// Regiments of Renown are both a buildable army in their own right and a pool
// of mercenaries any other army may hire ("For hire", army rules). To make the
// second work, every other army's unit list gains a copy of the regiments, so a
// hired regiment resolves through the ordinary `getUnit` path and prints, costs
// and validates like any other entry.
//
// They are spliced in unconditionally rather than behind the per-list
// `allowMercenaries` toggle: a list that already has regiments in it — a share
// link, say — must still resolve them. The toggle governs what the catalog
// offers, not what the data contains.

export const MERCENARY_ARMY = "regiments-of-renown";

/** True for a Regiment of Renown, whether hired into another army or not. */
export function isMercenary(unit: UnitData): boolean {
  return unit.army === MERCENARY_ARMY;
}

/** True when `unit` is a regiment hired into some other army's list. */
export function isHired(unit: UnitData, army: ArmyData): boolean {
  return isMercenary(unit) && army.army !== MERCENARY_ARMY;
}

/** The regiments this army is allowed to hire, per the Allies Table. */
export function hireableFor(army: ArmyData): UnitData[] {
  if (army.army === MERCENARY_ARMY) return [];
  return army.units.filter((u) => isMercenary(u) && u.hire?.armies.includes(army.army));
}

/** Copy the regiments into every other army of an already-built rule set. */
export function applyMercenaries(ruleSet: RuleSetInfo): void {
  const source = ruleSet.armies.find((a) => a.army === MERCENARY_ARMY);
  if (!source) return;
  const regiments = source.units;
  for (const army of ruleSet.armies) {
    if (army.army === MERCENARY_ARMY) continue;
    army.units.push(...regiments.map((u) => structuredClone(u)));
  }
}
