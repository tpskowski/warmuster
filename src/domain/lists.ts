import type {
  ArmyData,
  SavedCharacterEntry,
  SavedList,
  SavedUnitEntry,
  UnitData,
} from "../types";
import { getUnit } from "../data/gameData";

export function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createList(
  ruleSet: string,
  ruleVersion: string,
  army: string,
  name: string,
  pointsLimit: number,
): SavedList {
  return {
    id: createId("list"),
    schemaVersion: 1,
    ruleSet,
    ruleVersion,
    army,
    name,
    pointsLimit,
    units: [],
    characters: [],
    notes: null,
    updatedAt: new Date().toISOString(),
  };
}

function touched(list: SavedList): SavedList {
  return { ...list, updatedAt: new Date().toISOString() };
}

// Units without upgrades are merged into one entry per unitId with a
// quantity; a unit with upgrades is kept as its own entry (schema.md).
export function addUnit(list: SavedList, unitId: string): SavedList {
  const plain = list.units.find((u) => u.unitId === unitId && u.upgrades.length === 0);
  const units = plain
    ? list.units.map((u) => (u === plain ? { ...u, quantity: u.quantity + 1 } : u))
    : [...list.units, { unitId, quantity: 1, upgrades: [] }];
  return touched({ ...list, units });
}

export function removeUnit(list: SavedList, entryIndex: number): SavedList {
  const entry = list.units[entryIndex];
  if (!entry) return list;
  const units =
    entry.quantity > 1
      ? list.units.map((u, i) => (i === entryIndex ? { ...u, quantity: u.quantity - 1 } : u))
      : list.units.filter((_, i) => i !== entryIndex);
  return touched({ ...list, units });
}

export function toggleUnitUpgrade(list: SavedList, entryIndex: number, upgradeId: string): SavedList {
  const entry = list.units[entryIndex];
  if (!entry) return list;
  const has = entry.upgrades.includes(upgradeId);
  let units: SavedUnitEntry[];
  if (!has && entry.quantity > 1) {
    // Split one unit off the merged stack and give it the upgrade.
    units = [
      ...list.units.map((u, i) => (i === entryIndex ? { ...u, quantity: u.quantity - 1 } : u)),
      { unitId: entry.unitId, quantity: 1, upgrades: [upgradeId] },
    ];
  } else {
    units = list.units.map((u, i) =>
      i === entryIndex
        ? {
            ...u,
            upgrades: has ? u.upgrades.filter((x) => x !== upgradeId) : [...u.upgrades, upgradeId],
          }
        : u,
    );
  }
  return touched({ ...list, units });
}

export function addCharacter(list: SavedList, unitId: string): SavedList {
  const characters = [...list.characters, { id: createId("character"), unitId, upgrades: [] }];
  return touched({ ...list, characters });
}

export function removeCharacter(list: SavedList, id: string): SavedList {
  return touched({ ...list, characters: list.characters.filter((c) => c.id !== id) });
}

export function toggleCharacterUpgrade(list: SavedList, id: string, upgradeId: string): SavedList {
  const characters = list.characters.map((c) => {
    if (c.id !== id) return c;
    const has = c.upgrades.includes(upgradeId);
    return { ...c, upgrades: has ? c.upgrades.filter((x) => x !== upgradeId) : [...c.upgrades, upgradeId] };
  });
  return touched({ ...list, characters });
}

export function renameList(list: SavedList, name: string): SavedList {
  return touched({ ...list, name });
}

export function setPointsLimit(list: SavedList, pointsLimit: number): SavedList {
  return touched({ ...list, pointsLimit });
}

export function setNotes(list: SavedList, notes: string): SavedList {
  return touched({ ...list, notes: notes.trim() === "" ? null : notes });
}

function upgradeCost(army: ArmyData, upgradeId: string): number {
  const upgrade = getUnit(army, upgradeId);
  return upgrade?.upgradePoints ?? upgrade?.points ?? 0;
}

export function entryPoints(army: ArmyData, entry: SavedUnitEntry | SavedCharacterEntry, unit: UnitData): number {
  const quantity = "quantity" in entry ? entry.quantity : 1;
  const upgrades = entry.upgrades.reduce((sum, id) => sum + upgradeCost(army, id), 0);
  return (unit.points ?? 0) * quantity + upgrades * quantity;
}

export function totalPoints(list: SavedList, army: ArmyData): number {
  let total = 0;
  for (const entry of list.units) {
    const unit = getUnit(army, entry.unitId);
    if (unit) total += entryPoints(army, entry, unit);
  }
  for (const entry of list.characters) {
    const unit = getUnit(army, entry.unitId);
    if (unit) total += entryPoints(army, entry, unit);
  }
  return total;
}

/** Total selected count of a unitId across all entries (units + characters). */
export function countOf(list: SavedList, unitId: string): number {
  let count = 0;
  for (const entry of list.units) if (entry.unitId === unitId) count += entry.quantity;
  for (const entry of list.characters) if (entry.unitId === unitId) count += 1;
  return count;
}

/** Total selected count of an upgrade across all entries. */
export function upgradeCountOf(list: SavedList, upgradeId: string): number {
  let count = 0;
  for (const entry of list.units) {
    if (entry.upgrades.includes(upgradeId)) count += entry.quantity;
  }
  for (const entry of list.characters) if (entry.upgrades.includes(upgradeId)) count += 1;
  return count;
}
