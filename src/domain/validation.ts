import type { ArmyData, SavedList, ValidationIssue } from "../types";
import { getUnit } from "../data/gameData";
import { MERCENARY_ARMY } from "../data/mercenaries";
import { armySizeMultiplier } from "./armySize";
import {
  hireCharges,
  hireConflicts,
  hiredCount,
  hiredRegiments,
  hireLimit,
  type HireCharge,
} from "./hiring";
import { countOf, magicItemCountOf, totalPoints, upgradeCountOf } from "./lists";
import { canBearMagicItem, getMagicItem, magicItems } from "./magicItems";

/** One unit standing in for another, and how many of it actually count. */
export interface StandIn {
  troop: string;
  count: number;
}

/**
 * Units that may stand in for `unitId`, with the number of each that counts
 * toward its allowance. A substitution is capped at `perThousand` per full
 * 1000 points; `perThousand: null` means any number may stand in.
 */
export function substitutesFor(
  list: SavedList,
  army: ArmyData,
  unitId: string,
  scale: number,
): StandIn[] {
  const standIns: StandIn[] = [];
  for (const sub of army.units) {
    if (sub.substitutesFor?.unitId !== unitId) continue;
    const taken = countOf(list, sub.unitId);
    if (taken === 0) continue;
    const { perThousand } = sub.substitutesFor;
    const allowed = perThousand == null ? taken : perThousand * scale;
    standIns.push({ troop: sub.troop, count: Math.min(taken, allowed) });
  }
  return standIns;
}

/** "0 selected" / "1 selected, plus 1 Handgunners standing in" — so a count
 * that only adds up because of a substitution explains itself. */
function describeCount(own: number, standIns: StandIn[]): string {
  const parts = standIns
    .filter((s) => s.count > 0)
    .map((s) => `${s.count} ${s.troop} standing in`);
  const selected = `${own} selected`;
  return parts.length === 0 ? selected : `${selected}, plus ${parts.join(" and ")}`;
}

/** "1 slot hired by Alcatani Fellowship" — why an allowance shrank. */
function describeCharge(charge: HireCharge): string {
  const parts = charge.by.map((b) => (b.count > 1 ? `${b.count}× ${b.troop}` : b.troop));
  return `${charge.total} ${charge.total === 1 ? "slot" : "slots"} hired by ${parts.join(" and ")}`;
}

/**
 * The "For hire" and "Hiring Regiments of Renown" rules: how many regiments may
 * be hired, which armies may hire them, who refuses to serve with whom, and the
 * shared allowances a hired regiment eats into. Allowances charged against a
 * single unit are handled inline with that unit's own maximum; only shared
 * pools ("1 of any monster type") are reported here.
 */
function hiringIssues(
  list: SavedList,
  army: ArmyData,
  charges: HireCharge[],
): ValidationIssue[] {
  if (army.army === MERCENARY_ARMY) return [];
  const issues: ValidationIssue[] = [];
  const scale = armySizeMultiplier(list.pointsLimit);

  const hired = hiredCount(list, army);
  const limit = hireLimit(list);
  if (hired > limit) {
    issues.push({
      severity: "error",
      message: `Regiments of Renown: at most ${limit} may be hired at ${list.pointsLimit} points (${hired} hired).`,
    });
  }

  for (const { unit } of hiredRegiments(list, army)) {
    if (!unit.hire?.armies.includes(army.army)) {
      issues.push({
        severity: "error",
        message: `${army.name} may not hire ${unit.troop} (Allies Table).`,
        unitId: unit.unitId,
      });
    }
  }

  for (const conflict of hireConflicts(list, army)) {
    issues.push({
      severity: "error",
      message: `${conflict.regiment.troop} cannot be hired alongside ${conflict.with}.`,
      unitId: conflict.regiment.unitId,
    });
  }

  for (const charge of charges) {
    if (charge.unitIds.length < 2) continue; // folded into the unit's own max
    let base = 0;
    let taken = 0;
    for (const unitId of charge.unitIds) {
      const member = getUnit(army, unitId);
      if (member?.max == null) continue;
      base += member.maxPerArmy ? member.max : member.max * scale;
      taken +=
        member.category === "upgrade"
          ? upgradeCountOf(list, unitId)
          : countOf(list, unitId);
    }
    const allowed = Math.max(0, base - charge.total);
    if (taken > allowed) {
      issues.push({
        severity: "error",
        message: `${charge.label}: at most ${allowed} between them (${taken} selected, ${describeCharge(charge)}).`,
      });
    }
  }

  return issues;
}

// Warn-but-allow: issues are surfaced but never block editing or saving.
//
// Min/Max values in the army lists are per full 1000 points of the agreed
// game size. The General is the exception: every army includes exactly one
// General regardless of size.
export function validateList(list: SavedList, army: ArmyData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const scale = armySizeMultiplier(list.pointsLimit);

  const points = totalPoints(list, army);
  if (points > list.pointsLimit) {
    issues.push({
      severity: "error",
      message: `List is ${points - list.pointsLimit} points over the ${list.pointsLimit} point limit.`,
    });
  }

  const generals = list.characters.filter((c) => getUnit(army, c.unitId)?.type === "General");
  const generalChoices = army.units.filter((u) => u.type === "General");
  if (army.army !== "regiments-of-renown") {
    // When there is a single General choice, its own per-unit "at least 1
    // required" message already covers this, so the army-wide message would be
    // a duplicate. Only surface it when the pick is spread across several
    // General options and no single per-unit min conveys the requirement.
    if (generals.length === 0 && generalChoices.length > 1) {
      issues.push({ severity: "error", message: "The army must include a General." });
    } else if (generals.length > 1) {
      issues.push({
        severity: "error",
        message: "The army may only include one General.",
        unitId: getUnit(army, generals[0].unitId)?.unitId,
      });
    }
  }

  // Hired Regiments of Renown eat into the hiring army's own allowances. A
  // charge against a single unit shrinks that unit's maximum below; a charge
  // shared across several is checked as a pool afterwards.
  const charges = hireCharges(list, army);
  const singleCharges = new Map(
    charges.filter((c) => c.unitIds.length === 1).map((c) => [c.unitIds[0], c]),
  );

  for (const unit of army.units) {
    const count = countOf(list, unit.unitId);
    const isGeneral = unit.type === "General";
    // Units standing in for this one (Dogs of War Handgunners for Crossbowmen).
    // They count toward both its min and its max, so a substitute genuinely
    // occupies a slot rather than being free extra strength.
    const standIns = substitutesFor(list, army, unit.unitId, scale);
    const standInTotal = standIns.reduce((sum, s) => sum + s.count, 0);
    if (unit.min != null) {
      const required = isGeneral ? unit.min : unit.min * scale;
      const effective = count + standInTotal;
      if (effective < required) {
        issues.push({
          severity: "error",
          message: `${unit.troop}: at least ${required} required (${describeCount(count, standIns)}).`,
          unitId: unit.unitId,
        });
      }
    }
    const charge = singleCharges.get(unit.unitId);
    if (unit.max != null && unit.category !== "upgrade") {
      // `maxPerArmy` units cap flat army-wide; others scale per 1000 points.
      const base = isGeneral || unit.maxPerArmy ? unit.max : unit.max * scale;
      const allowed = Math.max(0, base - (charge?.total ?? 0));
      const effective = count + standInTotal;
      if (effective > allowed) {
        const why = charge ? `, ${describeCharge(charge)}` : "";
        issues.push({
          severity: "error",
          message: `${unit.troop}: at most ${allowed} allowed (${describeCount(count, standIns)}${why}).`,
          unitId: unit.unitId,
        });
      }
    }
    if (unit.category === "upgrade" && unit.max != null) {
      const count = upgradeCountOf(list, unit.unitId);
      const base = unit.maxPerArmy ? unit.max : unit.max * scale;
      const allowed = Math.max(0, base - (charge?.total ?? 0));
      if (count > allowed) {
        const why = charge ? `, ${describeCharge(charge)}` : "";
        issues.push({
          severity: "error",
          message: `${unit.troop}: at most ${allowed} allowed (${count} selected${why}).`,
          unitId: unit.unitId,
        });
      }
    }
  }

  issues.push(...hiringIssues(list, army, charges));

  // Conditional dependencies: a unit/upgrade that may only be taken if the
  // army also fields another unit (e.g. the Witch Hunter War Altar needs a
  // unit of Flagellants).
  for (const unit of army.units) {
    if (!unit.requiresUnit) continue;
    const taken =
      unit.category === "upgrade"
        ? upgradeCountOf(list, unit.unitId)
        : countOf(list, unit.unitId);
    if (taken === 0) continue;
    const have = countOf(list, unit.requiresUnit.unitId);
    if (have < unit.requiresUnit.min) {
      const required = getUnit(army, unit.requiresUnit.unitId);
      issues.push({
        severity: "error",
        message: `${unit.troop} requires at least ${unit.requiresUnit.min} unit of ${required?.troop ?? unit.requiresUnit.unitId} in the army (${have} selected).`,
        unitId: unit.unitId,
      });
    }
  }

  // Upgrade eligibility.
  for (const entry of list.characters) {
    for (const upgradeId of entry.upgrades) {
      const upgrade = getUnit(army, upgradeId);
      if (upgrade && !upgrade.eligibleToUpgrade.includes(entry.unitId)) {
        const character = getUnit(army, entry.unitId);
        issues.push({
          severity: "error",
          message: `${character?.troop ?? entry.unitId} cannot take ${upgrade.troop}.`,
          unitId: upgradeId,
        });
      }
    }
  }
  for (const entry of list.units) {
    for (const upgradeId of entry.upgrades) {
      const upgrade = getUnit(army, upgradeId);
      if (upgrade && !upgrade.eligibleToUpgrade.includes(entry.unitId)) {
        const unit = getUnit(army, entry.unitId);
        issues.push({
          severity: "error",
          message: `${unit?.troop ?? entry.unitId} cannot take ${upgrade.troop}.`,
          unitId: upgradeId,
        });
      }
    }
  }

  // Magic items: one of each per army, one per bearer, and bearer eligibility.
  for (const item of magicItems) {
    const count = magicItemCountOf(list, item.itemId);
    if (count > 1) {
      issues.push({
        severity: "error",
        message: `${item.name}: only one of each magic item is allowed in the army (${count} selected).`,
        unitId: item.itemId,
      });
    }
  }
  for (const entry of [...list.units, ...list.characters]) {
    const unit = getUnit(army, entry.unitId);
    const upgrades = entry.upgrades.map((id) => getUnit(army, id)).filter((u) => u != null);
    const label = unit?.troop ?? entry.unitId;
    if (entry.magicItems.length > 1) {
      issues.push({
        severity: "error",
        message: `${label} can only carry one magic item (${entry.magicItems.length} selected).`,
        unitId: entry.unitId,
      });
    }
    for (const itemId of entry.magicItems) {
      const item = getMagicItem(itemId);
      if (!item) {
        issues.push({
          severity: "warning",
          message: `Unknown magic item "${itemId}".`,
          unitId: entry.unitId,
        });
      } else if (unit && !canBearMagicItem(item, unit, army, upgrades)) {
        issues.push({
          severity: "error",
          message: `${label} cannot take ${item.name}.`,
          unitId: entry.unitId,
        });
      }
    }
  }

  // Unknown unit references (e.g. after a rule-set or version switch).
  for (const entry of [...list.units, ...list.characters]) {
    if (!getUnit(army, entry.unitId)) {
      issues.push({
        severity: "warning",
        message: `Unknown unit "${entry.unitId}" is not part of this army data.`,
        unitId: entry.unitId,
      });
    }
  }

  return issues;
}
