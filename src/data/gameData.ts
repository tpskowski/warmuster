import type { ArmyData, RuleSetInfo, UnitData } from "../types";
import warmasterRevolution from "./generated/warmaster-revolution.json";

// Rule-set registry. "Warmaster Revolution (Custom Units)" will register here
// later without schema changes; a saved list records which rule set it was
// built against.
export const ruleSets: RuleSetInfo[] = [warmasterRevolution as RuleSetInfo];

export function getRuleSet(id: string): RuleSetInfo | undefined {
  return ruleSets.find((rs) => rs.id === id);
}

export function getArmy(ruleSetId: string, armyId: string): ArmyData | undefined {
  return getRuleSet(ruleSetId)?.armies.find((a) => a.army === armyId);
}

const unitIndexCache = new Map<ArmyData, Map<string, UnitData>>();

export function unitIndex(army: ArmyData): Map<string, UnitData> {
  let index = unitIndexCache.get(army);
  if (!index) {
    index = new Map(army.units.map((u) => [u.unitId, u]));
    unitIndexCache.set(army, index);
  }
  return index;
}

export function getUnit(army: ArmyData, unitId: string): UnitData | undefined {
  return unitIndex(army).get(unitId);
}

/** Upgrades whose eligibleToUpgrade lists the given unit. */
export function upgradesFor(army: ArmyData, unitId: string): UnitData[] {
  return army.units.filter(
    (u) => u.category === "upgrade" && u.eligibleToUpgrade.includes(unitId),
  );
}
