import type { ArmyData, RuleSetInfo, UnitData } from "../types";
import warmasterRevolution from "./generated/warmaster-revolution.json";
import { applyCustomUnits } from "./customUnits";
import { applyMercenaries } from "./mercenaries";

const revolution = warmasterRevolution as RuleSetInfo;
// Every army gains a copy of the Regiments of Renown so hired regiments resolve
// like any other unit. Done before the custom set is cloned off, so it inherits
// them too.
applyMercenaries(revolution);

// "A Matter of Mustaches" begins as an independent, deep copy of Warmaster
// Revolution so its data can be customised without affecting the base set,
// then gains its own extra units. A saved list records which rule set it was
// built against.
const warmasterCustom: RuleSetInfo = {
  ...structuredClone(revolution),
  id: "warmaster-custom",
  name: "A Matter of Mustaches",
};
applyCustomUnits(warmasterCustom, revolution);

// Rule-set registry.
export const ruleSets: RuleSetInfo[] = [revolution, warmasterCustom];

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
