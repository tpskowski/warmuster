import type { ArmyData, SavedList } from "../types";
import { getUnit } from "../data/gameData";
import { entryPoints, totalPoints } from "./lists";

// Plain-text export for Discord, forums, etc.
export function buildTextExport(list: SavedList, army: ArmyData): string {
  const lines: string[] = [];
  lines.push(`**${list.name}** — ${army.name}, ${totalPoints(list, army)}/${list.pointsLimit} pts`);
  lines.push(`(Warmaster Revolution ${list.ruleVersion})`);
  lines.push("");

  if (list.characters.length > 0) {
    lines.push("Characters:");
    for (const entry of list.characters) {
      const unit = getUnit(army, entry.unitId);
      if (!unit) continue;
      const upgrades = entry.upgrades
        .map((id) => getUnit(army, id)?.troop)
        .filter(Boolean)
        .join(", ");
      const label = upgrades ? `${unit.troop} (${upgrades})` : unit.troop;
      lines.push(`- ${label} — ${entryPoints(army, entry, unit)} pts`);
    }
    lines.push("");
  }

  if (list.units.length > 0) {
    lines.push("Units:");
    for (const entry of list.units) {
      const unit = getUnit(army, entry.unitId);
      if (!unit) continue;
      const upgrades = entry.upgrades
        .map((id) => getUnit(army, id)?.troop)
        .filter(Boolean)
        .join(", ");
      const label = upgrades ? `${unit.troop} (${upgrades})` : unit.troop;
      lines.push(`- ${entry.quantity}x ${label} — ${entryPoints(army, entry, unit)} pts`);
    }
    lines.push("");
  }

  if (list.notes) {
    lines.push(`Notes: ${list.notes}`);
  }

  return lines.join("\n").trimEnd() + "\n";
}
