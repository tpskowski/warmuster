import type { RuleSetInfo } from "../types";

/** Playtest-only unit changes, applied after cloning Warmaster Revolution. */
const MAX_PER_THOUSAND: Record<string, number> = {
  "araby:knights": 3,
  "bretonnia:knights": 3,
  "empire:knights": 3,
  "vampire-counts:black-knights": 3,
};

const ELVEN_HUBRIS =
  "**Elven Hubris:** If this character rolls 11 or 12 when issuing an order, their leadership is lowered to 9 for the rest of the game.";
const PLAYTEST_NOTICE =
  "**Playtest:** this unit is modified per the 2026 Playtest rules in Warmaster Journal 2026";

export function applyPlaytest2026(ruleSet: RuleSetInfo): void {
  const units = new Map(
    ruleSet.armies.flatMap((army) => army.units.map((unit) => [unit.unitId, unit])),
  );
  for (const [unitId, max] of Object.entries(MAX_PER_THOUSAND)) {
    const unit = units.get(unitId);
    if (!unit) throw new Error(`playtest2026: unit "${unitId}" not found`);
    unit.max = max;
    unit.maxPerArmy = false;
    if (!unit.specials.includes(PLAYTEST_NOTICE)) unit.specials.push(PLAYTEST_NOTICE);
  }

  const highElfGeneral = units.get("high-elves:general");
  if (!highElfGeneral) throw new Error('playtest2026: unit "high-elves:general" not found');
  highElfGeneral.points = 155;
  if (!highElfGeneral.specials.includes(ELVEN_HUBRIS)) {
    highElfGeneral.specials.push(ELVEN_HUBRIS);
  }
  if (!highElfGeneral.specials.includes(PLAYTEST_NOTICE)) {
    highElfGeneral.specials.push(PLAYTEST_NOTICE);
  }
}
