// Validates the generated app JSON: field shapes, unique IDs, cross
// references, and per-army sanity checks. Run via `npm run validate:data`.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dataFile = path.join(root, "src", "data", "generated", "warmaster-revolution.json");

const errors = [];
const fail = (msg) => errors.push(msg);

const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));

if (!data.id || !data.name || !data.version) fail("rule set missing id/name/version");
if (!Array.isArray(data.armies) || data.armies.length === 0) fail("no armies generated");

const FACINGS = new Set(["long", "short", "round", null]);
const CATEGORIES = new Set(["unit", "character", "upgrade"]);
const allUnitIds = new Set();

for (const army of data.armies ?? []) {
  const ctx = `[${army.army}]`;
  if (!army.name) fail(`${ctx} missing name`);
  if (!Array.isArray(army.units) || army.units.length === 0) fail(`${ctx} has no units`);
  const armyUnitIds = new Set();

  for (const unit of army.units ?? []) {
    const uctx = `${ctx} ${unit.unitId ?? unit.troop}`;
    if (!unit.unitId) fail(`${uctx} missing unitId`);
    if (allUnitIds.has(unit.unitId)) fail(`${uctx} duplicate unitId`);
    allUnitIds.add(unit.unitId);
    armyUnitIds.add(unit.unitId);

    if (!unit.unitId?.startsWith(`${army.army}:`)) fail(`${uctx} unitId not prefixed with army`);
    if (!CATEGORIES.has(unit.category)) fail(`${uctx} bad category ${unit.category}`);
    if (!FACINGS.has(unit.facing)) fail(`${uctx} bad facing ${unit.facing}`);
    if (![0, 1, 2, 3].includes(unit.scoutingPoints)) {
      fail(`${uctx} bad scoutingPoints ${unit.scoutingPoints}`);
    }
    if (!Array.isArray(unit.specials)) fail(`${uctx} specials not an array`);
    if (!Array.isArray(unit.eligibleToUpgrade)) fail(`${uctx} eligibleToUpgrade not an array`);

    if (unit.category !== "upgrade" && unit.speed == null && unit.type !== "Machine") {
      fail(`${uctx} non-upgrade unit missing speed`);
    }
    // Points may legitimately be absent when a special rule governs
    // availability (e.g. Albion's spell-summoned Fenbeast).
    if (unit.category === "unit" && unit.points == null && unit.specials.length === 0) {
      fail(`${uctx} unit missing points`);
    }
    if (unit.category === "upgrade" && unit.upgradePoints == null && unit.points == null) {
      fail(`${uctx} upgrade missing upgradePoints`);
    }
    if (unit.points != null && unit.upgradePoints != null) {
      fail(`${uctx} has both points and upgradePoints`);
    }
    if (unit.meleeAttacks != null && unit.meleeAttackProfile != null) {
      fail(`${uctx} has both meleeAttacks and meleeAttackProfile`);
    }
    if (unit.rangedAttacks != null && unit.rangedAttackProfile != null) {
      fail(`${uctx} has both rangedAttacks and rangedAttackProfile`);
    }
    if (unit.armour === "0" || unit.armour === "-") fail(`${uctx} armour should be null, not "${unit.armour}"`);
    if (unit.category === "character") {
      if (unit.halfPace != null) fail(`${uctx} character must not have halfPace`);
      if (unit.unitSize !== 1) fail(`${uctx} character unitSize should be 1`);
    }
  }

  // Cross references stay inside the army.
  for (const unit of army.units ?? []) {
    for (const target of unit.eligibleToUpgrade) {
      if (!armyUnitIds.has(target)) {
        fail(`${ctx} ${unit.unitId} eligibleToUpgrade references unknown ${target}`);
      }
    }
  }

  if (army.army !== "regiments-of-renown") {
    const generals = army.units.filter((u) => u.type === "General");
    if (generals.length !== 1) fail(`${ctx} expected exactly 1 General row, found ${generals.length}`);
  }

  for (const spell of army.spells ?? []) {
    if (!spell.name || !spell.toCast || !spell.text) fail(`${ctx} malformed spell ${spell.name ?? "?"}`);
  }
}

// --- Regiments of Renown hiring ---------------------------------------------

const COUNTS_AS_RULES = new Set([
  "none",
  "limited-infantry",
  "limited-shooting-infantry",
  "limited-cavalry-or-chariot",
  "artillery",
  "hero",
  "flying-3-stands",
  "monstrous-mount-terror",
]);

const armyIds = new Set((data.armies ?? []).map((a) => a.army));
const regiments = (data.armies ?? []).find((a) => a.army === "regiments-of-renown")?.units ?? [];
const regimentIds = new Set(regiments.map((u) => u.unitId));

for (const unit of regiments) {
  const uctx = `[hire] ${unit.unitId}`;
  const hire = unit.hire;
  if (!hire) {
    fail(`${uctx} has no hire block — every regiment must say how it may be hired`);
    continue;
  }
  if (!Array.isArray(hire.armies) || hire.armies.length === 0) {
    fail(`${uctx} hire.armies missing or empty (Allies Table)`);
  }
  for (const armyId of hire.armies ?? []) {
    if (!armyIds.has(armyId)) fail(`${uctx} hire.armies references unknown army ${armyId}`);
    if (armyId === "regiments-of-renown") fail(`${uctx} cannot be hired by its own army`);
  }
  if (!COUNTS_AS_RULES.has(hire.countsAs?.rule)) {
    fail(`${uctx} unknown countsAs rule "${hire.countsAs?.rule}"`);
  }
  for (const rule of hire.countsAs?.also ?? []) {
    if (!COUNTS_AS_RULES.has(rule)) fail(`${uctx} unknown countsAs.also rule "${rule}"`);
  }
  for (const [armyId, target] of Object.entries(hire.countsAs?.byArmy ?? {})) {
    if (!armyIds.has(armyId)) fail(`${uctx} countsAs.byArmy references unknown army ${armyId}`);
    if (target.startsWith("group:")) continue;
    if (!allUnitIds.has(target)) fail(`${uctx} countsAs.byArmy[${armyId}] unknown unit ${target}`);
    else if (!target.startsWith(`${armyId}:`)) {
      fail(`${uctx} countsAs.byArmy[${armyId}] targets ${target}, which is not in that army`);
    }
  }
  // Mutual exclusions are symmetric: if A refuses B, B must refuse A.
  for (const otherId of hire.conflicts ?? []) {
    if (!regimentIds.has(otherId)) {
      fail(`${uctx} conflicts references unknown regiment ${otherId}`);
      continue;
    }
    const other = regiments.find((u) => u.unitId === otherId);
    if (!(other.hire?.conflicts ?? []).includes(unit.unitId)) {
      fail(`${uctx} conflicts with ${otherId} but ${otherId} does not conflict back`);
    }
  }
  for (const [armyId, unitIds] of Object.entries(hire.conflictUnits ?? {})) {
    if (!armyIds.has(armyId)) fail(`${uctx} conflictUnits references unknown army ${armyId}`);
    for (const id of unitIds) {
      if (!allUnitIds.has(id)) fail(`${uctx} conflictUnits[${armyId}] unknown unit ${id}`);
    }
  }
  if (unit.maxPerArmy !== true) {
    fail(`${uctx} should be maxPerArmy — only one of each regiment per army`);
  }
}

// The Allies Table is authored separately from the army lists; check it lines
// up with the generated data rather than silently dropping rows or columns.
const alliesTable = JSON.parse(
  fs.readFileSync(path.join(root, "data", "allies-table.json"), "utf8"),
);
for (const id of alliesTable.regiments) {
  if (!regimentIds.has(id)) fail(`[allies] unknown regiment column ${id}`);
}
for (const id of regimentIds) {
  if (!alliesTable.regiments.includes(id)) fail(`[allies] regiment ${id} missing from the table`);
}
for (const armyId of armyIds) {
  if (armyId === "regiments-of-renown") continue;
  const row = alliesTable.armies[armyId];
  if (row == null) fail(`[allies] no row for army ${armyId}`);
  else if (row.length !== alliesTable.regiments.length) {
    fail(`[allies] row ${armyId} has ${row.length} cells, expected ${alliesTable.regiments.length}`);
  } else if (!/^[+/]+$/.test(row)) {
    fail(`[allies] row ${armyId} has cells other than '+' and '/'`);
  }
}
for (const armyId of Object.keys(alliesTable.armies)) {
  if (!armyIds.has(armyId)) fail(`[allies] unknown army row ${armyId}`);
}

if (errors.length > 0) {
  for (const e of errors) console.error("FAIL:", e);
  console.error(`${errors.length} data validation error(s)`);
  process.exit(1);
}
console.log(`Data OK: ${data.armies.length} armies, ${allUnitIds.size} units.`);
