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

if (errors.length > 0) {
  for (const e of errors) console.error("FAIL:", e);
  console.error(`${errors.length} data validation error(s)`);
  process.exit(1);
}
console.log(`Data OK: ${data.armies.length} armies, ${allUnitIds.size} units.`);
