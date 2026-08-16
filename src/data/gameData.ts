import type { ArmyData, RuleSetInfo, UnitData } from "../types";
import warmasterRevolution from "./generated/warmaster-revolution.json";
import scoutingPointTables from "./generated/scouting-points.json";
import { applyCustomUnits } from "./customUnits";
import { applyMercenaries } from "./mercenaries";
import { applyPlaytest2026 } from "./playtest2026";

const revolution = warmasterRevolution as RuleSetInfo;

/** Make an independent copy of a complete rule set and retag its records so
 * later playtest edits cannot mutate or masquerade as Revolution data. */
function cloneRuleSet(source: RuleSetInfo, id: string, name: string): RuleSetInfo {
  const clone = structuredClone(source);
  clone.id = id;
  clone.name = name;
  for (const army of clone.armies) {
    army.ruleSet = id;
    for (const unit of army.units) unit.ruleSet = id;
  }
  return clone;
}

// The 2026 Playtest starts as a complete, independent copy of WMR. It has its
// own saved lists and can diverge without changing either of the other sets.
const playtest2026 = cloneRuleSet(
  revolution,
  "wmr-2026-playtest",
  "WMR - 2026 Playtest",
);
applyPlaytest2026(playtest2026);

// Every army gains a copy of the Regiments of Renown so hired regiments resolve
// like any other unit.
applyMercenaries(revolution);
applyMercenaries(playtest2026);

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

// The scouting script audits both assembled data sets and persists this lookup
// so custom units receive the same generated field as source-table units.
const scoutingByRuleSet = scoutingPointTables as Record<string, Record<string, 0 | 1 | 2 | 3>>;
for (const ruleSet of [revolution, playtest2026, warmasterCustom]) {
  const table = scoutingByRuleSet[ruleSet.id] ?? {};
  for (const army of ruleSet.armies) {
    for (const unit of army.units) unit.scoutingPoints = table[unit.unitId] ?? unit.scoutingPoints ?? 0;
  }
}

// Rule-set registry.
export const ruleSets: RuleSetInfo[] = [revolution, playtest2026, warmasterCustom];

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
