import type { ArmyData, CountsAsRule, SavedList, UnitData } from "../types";
import { getUnit } from "../data/gameData";
import { isHired, isMercenary } from "../data/mercenaries";
import { armySizeMultiplier } from "./armySize";
import { countOf } from "./lists";

// The "Hiring Regiments of Renown" rules. A hired regiment does three things
// beyond costing points: it uses up one of the army's hire slots (one per full
// 1000 points), it consumes an allowance somewhere in the hiring army's own
// list, and it may refuse to serve alongside certain other regiments.

/** How many regiments this list may hire: one per full 1000 points. */
export function hireLimit(list: SavedList): number {
  return armySizeMultiplier(list.pointsLimit);
}

/** Regiments hired into this list, with how many of each (always 1 in a legal
 * list, but a list can be over the cap — warn-but-allow). */
export function hiredRegiments(list: SavedList, army: ArmyData): { unit: UnitData; count: number }[] {
  if (army.army === "regiments-of-renown") return [];
  const hired: { unit: UnitData; count: number }[] = [];
  for (const unit of army.units) {
    if (!isMercenary(unit)) continue;
    const count = countOf(list, unit.unitId);
    if (count > 0) hired.push({ unit, count });
  }
  return hired;
}

/** Total regiments hired, counting duplicates. */
export function hiredCount(list: SavedList, army: ArmyData): number {
  return hiredRegiments(list, army).reduce((sum, h) => sum + h.count, 0);
}

// --- resolving "counts as" ---------------------------------------------------

/** An allowance a hired regiment eats into. `unitIds` holds more than one entry
 * when the rulebook leaves the choice to the player ("1 of any monster type"),
 * in which case the allowances of all of them form a single shared pool. */
export interface CountsAsSlot {
  label: string;
  unitIds: string[];
}

function isLimited(unit: UnitData): boolean {
  return unit.max != null;
}

function shoots(unit: UnitData): boolean {
  return unit.rangedAttacks != null || unit.rangedAttackProfile != null;
}

function causesTerror(unit: UnitData): boolean {
  return unit.specials.some((s) => /terror/i.test(s));
}

/** The most expensive of a set of candidates; ties break on unitId so the
 * result is stable across runs. */
function priciest(candidates: UnitData[]): UnitData | undefined {
  return [...candidates].sort(
    (a, b) => (b.points ?? b.upgradePoints ?? 0) - (a.points ?? a.upgradePoints ?? 0) ||
      a.unitId.localeCompare(b.unitId),
  )[0];
}

/** Candidates in the hiring army matching a rule, ignoring the regiments
 * themselves — a mercenary never displaces another mercenary. */
function candidatesFor(rule: CountsAsRule, army: ArmyData): UnitData[] {
  const own = army.units.filter((u) => !isMercenary(u));
  switch (rule) {
    case "none":
      return [];
    case "limited-infantry":
      return own.filter((u) => u.category === "unit" && u.type === "Infantry" && isLimited(u));
    case "limited-shooting-infantry":
      return own.filter(
        (u) => u.category === "unit" && u.type === "Infantry" && isLimited(u) && shoots(u),
      );
    case "limited-cavalry-or-chariot":
      return own.filter(
        (u) =>
          u.category === "unit" &&
          (u.type === "Cavalry" || u.type.startsWith("Chariot")) &&
          isLimited(u),
      );
    case "artillery":
      return own.filter((u) => u.category === "unit" && u.type === "Artillery" && isLimited(u));
    case "hero":
      return own.filter((u) => u.category === "character" && u.type === "Hero" && isLimited(u));
    case "flying-3-stands":
      return own.filter(
        (u) =>
          u.category === "unit" && u.subType === "Flying" && u.unitSize === 3 && isLimited(u),
      );
    case "monstrous-mount-terror":
      return own.filter(
        (u) => u.type === "Monstrous Mount" && isLimited(u) && causesTerror(u),
      );
  }
}

/** Rules where the rulebook says the player picks, so every candidate shares
 * one pool rather than the priciest one taking the hit. */
const POOLED: ReadonlySet<CountsAsRule> = new Set<CountsAsRule>(["hero"]);

function slotForRule(rule: CountsAsRule, army: ArmyData): CountsAsSlot | null {
  const candidates = candidatesFor(rule, army);
  // "If not available, hiring does not restrict taking other units."
  if (candidates.length === 0) return null;
  if (POOLED.has(rule)) {
    return { label: candidates.map((u) => u.troop).join(" / "), unitIds: candidates.map((u) => u.unitId) };
  }
  const pick = priciest(candidates)!;
  return { label: pick.troop, unitIds: [pick.unitId] };
}

/** A per-army override: either a unitId or "group:<rule>" for a shared pool. */
function slotForOverride(value: string, army: ArmyData): CountsAsSlot | null {
  if (value.startsWith("group:")) {
    const type = value.slice("group:".length);
    const members = army.units.filter(
      (u) => !isMercenary(u) && u.type.toLowerCase() === type.toLowerCase() && isLimited(u),
    );
    if (members.length === 0) return null;
    return { label: `any ${type}`, unitIds: members.map((u) => u.unitId) };
  }
  const unit = getUnit(army, value);
  return unit ? { label: unit.troop, unitIds: [unit.unitId] } : null;
}

/**
 * The allowance slots one copy of `regiment` consumes when hired by `army`.
 * Empty when hiring places no restriction on the army's own units.
 */
export function resolveCountsAs(regiment: UnitData, army: ArmyData): CountsAsSlot[] {
  const countsAs = regiment.hire?.countsAs;
  if (!countsAs) return [];
  const override = countsAs.byArmy?.[army.army];
  const primary = override ? slotForOverride(override, army) : slotForRule(countsAs.rule, army);
  const extra = (countsAs.also ?? []).map((rule) => slotForRule(rule, army));
  return [primary, ...extra].filter((slot) => slot != null);
}

/** Allowance taken out of the hiring army by the regiments in a list. */
export interface HireCharge extends CountsAsSlot {
  /** Which regiments took slots here, and how many each. */
  by: { troop: string; count: number }[];
  /** Total slots taken. */
  total: number;
}

/**
 * Every allowance the list's hired regiments eat into, grouped by target. A
 * charge over a single unit reduces that unit's own maximum; a charge over
 * several ("1 of any monster type") reduces their shared pool instead, which is
 * how the rulebook puts it — "two monster types instead of the three available".
 */
export function hireCharges(list: SavedList, army: ArmyData): HireCharge[] {
  const charges = new Map<string, HireCharge>();
  for (const { unit, count } of hiredRegiments(list, army)) {
    for (const slot of resolveCountsAs(unit, army)) {
      const key = [...slot.unitIds].sort().join("|");
      const charge = charges.get(key) ?? { ...slot, by: [], total: 0 };
      const existing = charge.by.find((b) => b.troop === unit.troop);
      if (existing) existing.count += count;
      else charge.by.push({ troop: unit.troop, count });
      charge.total += count;
      charges.set(key, charge);
    }
  }
  return [...charges.values()];
}

// --- conflicts ---------------------------------------------------------------

export interface HireConflict {
  regiment: UnitData;
  /** What it refuses to serve with. */
  with: string;
}

/** Regiments in the list that may not be hired alongside something else in it.
 * Reported once per pair, from the alphabetically first regiment. */
export function hireConflicts(list: SavedList, army: ArmyData): HireConflict[] {
  const hired = hiredRegiments(list, army).map((h) => h.unit);
  const hiredIds = new Set(hired.map((u) => u.unitId));
  const conflicts: HireConflict[] = [];
  for (const regiment of hired) {
    for (const otherId of regiment.hire?.conflicts ?? []) {
      // Symmetric: only report from the first of the pair.
      if (!hiredIds.has(otherId) || otherId < regiment.unitId) continue;
      const other = getUnit(army, otherId);
      conflicts.push({ regiment, with: other?.troop ?? otherId });
    }
    for (const unitId of regiment.hire?.conflictUnits?.[army.army] ?? []) {
      if (countOf(list, unitId) === 0) continue;
      const unit = getUnit(army, unitId);
      conflicts.push({ regiment, with: unit?.troop ?? unitId });
    }
  }
  return conflicts;
}

/** Regiments this army may hire that are also legal given what is already in
 * the list — used to explain, not to block. */
export function isHireable(regiment: UnitData, army: ArmyData): boolean {
  return isHired(regiment, army) && (regiment.hire?.armies.includes(army.army) ?? false);
}
