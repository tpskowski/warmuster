import type { ArmyData, SavedList, ValidationIssue } from "../types";
import { getUnit } from "../data/gameData";
import { countOf, totalPoints, upgradeCountOf } from "./lists";

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
  if (army.army !== "regiments-of-renown") {
    if (generals.length === 0) {
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
