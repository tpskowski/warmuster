import type { ArmyData, SavedList, ValidationIssue } from "../types";
import { getUnit } from "../data/gameData";
import { countOf, magicItemCountOf, totalPoints, upgradeCountOf } from "./lists";
import { canBearMagicItem, getMagicItem, magicItems } from "./magicItems";

// Warn-but-allow: issues are surfaced but never block editing or saving.
//
// Min/Max values in the army lists are per full 1000 points of the agreed
// game size. The General is the exception: every army includes exactly one
// General regardless of size.
export function validateList(list: SavedList, army: ArmyData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const scale = Math.max(1, Math.floor(list.pointsLimit / 1000));

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

  for (const unit of army.units) {
    const count = countOf(list, unit.unitId);
    const isGeneral = unit.type === "General";
    if (unit.min != null) {
      const required = isGeneral ? unit.min : unit.min * scale;
      if (count < required) {
        issues.push({
          severity: "error",
          message: `${unit.troop}: at least ${required} required (${count} selected).`,
          unitId: unit.unitId,
        });
      }
    }
    if (unit.max != null && unit.category !== "upgrade") {
      const allowed = isGeneral ? unit.max : unit.max * scale;
      if (count > allowed) {
        issues.push({
          severity: "error",
          message: `${unit.troop}: at most ${allowed} allowed (${count} selected).`,
          unitId: unit.unitId,
        });
      }
    }
    if (unit.category === "upgrade" && unit.max != null) {
      const count = upgradeCountOf(list, unit.unitId);
      const allowed = unit.max * scale;
      if (count > allowed) {
        issues.push({
          severity: "error",
          message: `${unit.troop}: at most ${allowed} allowed (${count} selected).`,
          unitId: unit.unitId,
        });
      }
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
      } else if (unit && !canBearMagicItem(item, unit, army)) {
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
