import type { ArmyData, SavedCharacterEntry, SavedList, SavedUnitEntry } from "../types";
import { getUnit } from "../data/gameData";
import { entryPoints, totalPoints } from "./lists";
import { getMagicItem } from "./magicItems";

function entryExtras(army: ArmyData, entry: SavedUnitEntry | SavedCharacterEntry): string {
  return [
    ...entry.upgrades.map((id) => getUnit(army, id)?.troop),
    ...entry.magicItems.map((id) => getMagicItem(id)?.name ?? id),
  ]
    .filter(Boolean)
    .join(", ");
}

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
      const extras = entryExtras(army, entry);
      const label = extras ? `${unit.troop} (${extras})` : unit.troop;
      lines.push(`- ${label} — ${entryPoints(army, entry, unit)} pts`);
    }
    lines.push("");
  }

  if (list.units.length > 0) {
    lines.push("Units:");
    for (const entry of list.units) {
      const unit = getUnit(army, entry.unitId);
      if (!unit) continue;
      const extras = entryExtras(army, entry);
      const label = extras ? `${unit.troop} (${extras})` : unit.troop;
      lines.push(`- ${entry.quantity}x ${label} — ${entryPoints(army, entry, unit)} pts`);
    }
    lines.push("");
  }

  if (list.notes) {
    lines.push(`Notes: ${list.notes}`);
  }

  return lines.join("\n").trimEnd() + "\n";
}
