import type {
  ArmyData,
  SavedCharacterEntry,
  SavedList,
  SavedUnitEntry,
  UnitData,
} from "../types";
import { getUnit } from "../data/gameData";
import { magicItemCost } from "./magicItems";

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

function isPlain(entry: SavedUnitEntry): boolean {
  return entry.upgrades.length === 0 && entry.magicItems.length === 0;
}

/** A key that identifies mergeable entries: same unit and same set of
 * upgrades. Magic items are excluded — an item is carried by a single unit,
 * so item-bearing entries are unique and never merge. */
function mergeKey(entry: SavedUnitEntry): string {
  return `${entry.unitId}|${[...entry.upgrades].sort().join(",")}`;
}

/** Collapse identical unit entries (same unit + same upgrades, no magic item)
 * into one quantity, and keep all entries for a given unit adjacent so
 * attachment splits sit next to their stack. First-seen unit order is kept;
 * within a unit, plainer entries come first. */
export function normalizeUnits(units: SavedUnitEntry[]): SavedUnitEntry[] {
  const merged: SavedUnitEntry[] = [];
  for (const entry of units) {
    const stack =
      entry.magicItems.length === 0
        ? merged.find((u) => u.magicItems.length === 0 && mergeKey(u) === mergeKey(entry))
        : undefined;
    if (stack) stack.quantity += entry.quantity;
    else
      merged.push({ ...entry, upgrades: [...entry.upgrades], magicItems: [...entry.magicItems] });
  }
  const unitOrder: string[] = [];
  for (const e of merged) if (!unitOrder.includes(e.unitId)) unitOrder.push(e.unitId);
  return merged.sort(
    (a, b) =>
      unitOrder.indexOf(a.unitId) - unitOrder.indexOf(b.unitId) ||
      a.upgrades.length + a.magicItems.length - (b.upgrades.length + b.magicItems.length),
  );
}

// Units without upgrades or magic items are merged into one entry per unitId
// with a quantity; a unit with either is kept as its own entry (schema.md).
export function addUnit(list: SavedList, unitId: string): SavedList {
  const plain = list.units.find((u) => u.unitId === unitId && isPlain(u));
  const units = plain
    ? list.units.map((u) => (u === plain ? { ...u, quantity: u.quantity + 1 } : u))
    : [...list.units, { unitId, quantity: 1, upgrades: [], magicItems: [] }];
  return touched({ ...list, units: normalizeUnits(units) });
}

/** Add one more copy of a specific unit entry, preserving its upgrades — so
 * the "+" next to a unit taken with an upgrade grows that configuration rather
 * than a separate plain copy. Entries carrying a magic item stay unique (the
 * item is carried once), so a copy of one is added as a plain unit instead. */
export function addUnitCopy(list: SavedList, entryIndex: number): SavedList {
  const entry = list.units[entryIndex];
  if (!entry) return list;
  if (entry.magicItems.length > 0) return addUnit(list, entry.unitId);
  const units = list.units.map((u, i) =>
    i === entryIndex ? { ...u, quantity: u.quantity + 1 } : u,
  );
  return touched({ ...list, units: normalizeUnits(units) });
}

export function removeUnit(list: SavedList, entryIndex: number): SavedList {
  const entry = list.units[entryIndex];
  if (!entry) return list;
  const units =
    entry.quantity > 1
      ? list.units.map((u, i) => (i === entryIndex ? { ...u, quantity: u.quantity - 1 } : u))
      : list.units.filter((_, i) => i !== entryIndex);
  return touched({ ...list, units: normalizeUnits(units) });
}

export function toggleUnitUpgrade(list: SavedList, entryIndex: number, upgradeId: string): SavedList {
  const entry = list.units[entryIndex];
  if (!entry) return list;
  const has = entry.upgrades.includes(upgradeId);
  let units: SavedUnitEntry[];
  if (!has && entry.quantity > 1) {
    // Split one unit off the merged stack and add the upgrade to it, keeping
    // the stack's existing upgrades.
    units = [
      ...list.units.map((u, i) => (i === entryIndex ? { ...u, quantity: u.quantity - 1 } : u)),
      { unitId: entry.unitId, quantity: 1, upgrades: [...entry.upgrades, upgradeId], magicItems: [] },
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
  return touched({ ...list, units: normalizeUnits(units) });
}

export function addCharacter(list: SavedList, unitId: string): SavedList {
  const characters = [
    ...list.characters,
    { id: createId("character"), unitId, upgrades: [], magicItems: [] },
  ];
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

export type MagicItemTarget = { kind: "unit"; index: number } | { kind: "character"; id: string };

/** The entry currently carrying a magic item, if any. */
export function magicItemBearer(list: SavedList, itemId: string): MagicItemTarget | null {
  const index = list.units.findIndex((u) => u.magicItems.includes(itemId));
  if (index !== -1) return { kind: "unit", index };
  const character = list.characters.find((c) => c.magicItems.includes(itemId));
  return character ? { kind: "character", id: character.id } : null;
}

// Moves a magic item to the given bearer (or removes it with target null).
// Assigning to a merged stack splits one unit off with the item — e.g.
// 3× Warriors becomes 2× Warriors plus 1× Warriors with the item — and
// removing an item merges the now-plain entry back into its stack.
export function assignMagicItem(
  list: SavedList,
  itemId: string,
  target: MagicItemTarget | null,
): SavedList {
  const targetEntry = target?.kind === "unit" ? list.units[target.index] : undefined;
  if (target?.kind === "unit" && !targetEntry) return list;
  if (target?.kind === "character" && !list.characters.some((c) => c.id === target.id)) return list;
  if (targetEntry?.magicItems.includes(itemId)) return list;
  if (
    target?.kind === "character" &&
    list.characters.some((c) => c.id === target.id && c.magicItems.includes(itemId))
  )
    return list;
  // A unit or character can carry only one magic item. A merged stack is fine:
  // assigning splits a fresh unit off it, so only single entries can conflict.
  if (targetEntry && targetEntry.quantity === 1 && targetEntry.magicItems.length > 0) return list;
  if (
    target?.kind === "character" &&
    list.characters.some((c) => c.id === target.id && c.magicItems.length > 0)
  )
    return list;

  // Strip the item from its current bearer. Untouched entries keep their
  // object identity so the captured target entry can still be found below.
  let units = list.units.map((u) =>
    u.magicItems.includes(itemId)
      ? { ...u, magicItems: u.magicItems.filter((x) => x !== itemId) }
      : u,
  );
  let characters = list.characters.map((c) =>
    c.magicItems.includes(itemId)
      ? { ...c, magicItems: c.magicItems.filter((x) => x !== itemId) }
      : c,
  );

  if (target?.kind === "unit" && targetEntry) {
    if (targetEntry.quantity > 1) {
      units = [
        ...units.map((u) => (u === targetEntry ? { ...u, quantity: u.quantity - 1 } : u)),
        {
          unitId: targetEntry.unitId,
          quantity: 1,
          upgrades: [...targetEntry.upgrades],
          magicItems: [itemId],
        },
      ];
    } else {
      units = units.map((u) =>
        u === targetEntry ? { ...u, magicItems: [...u.magicItems, itemId] } : u,
      );
    }
  } else if (target?.kind === "character") {
    characters = characters.map((c) =>
      c.id === target.id ? { ...c, magicItems: [...c.magicItems, itemId] } : c,
    );
  }

  return touched({ ...list, units: normalizeUnits(units), characters });
}

export function renameList(list: SavedList, name: string): SavedList {
  return touched({ ...list, name });
}

export function setPointsLimit(list: SavedList, pointsLimit: number): SavedList {
  return touched({ ...list, pointsLimit });
}

export function setAllowMercenaries(list: SavedList, allowMercenaries: boolean): SavedList {
  return touched({ ...list, allowMercenaries });
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
  // A magic item is carried by the unit as a whole, so its cost is paid once.
  const magic = entry.magicItems.reduce((sum, id) => sum + magicItemCost(id, unit), 0);
  return (unit.points ?? 0) * quantity + upgrades * quantity + magic;
}

/** Stands in one copy of a unit entry: the unit's own size plus any stands
 * added by attachments (a Salamander joining Skinks, Skirmishers joining
 * Halberdiers). Null for entries with no stand count, such as characters. */
export function entryStands(
  army: ArmyData,
  entry: SavedUnitEntry | SavedCharacterEntry,
  unit: UnitData,
): number | null {
  if (unit.unitSize == null) return null;
  const added = entry.upgrades.reduce(
    (sum, id) => sum + (getUnit(army, id)?.unitSizeModifier ?? 0),
    0,
  );
  return unit.unitSize + added;
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

/** How many entries carry a magic item (each may appear once per army). */
export function magicItemCountOf(list: SavedList, itemId: string): number {
  let count = 0;
  for (const entry of list.units) if (entry.magicItems.includes(itemId)) count += 1;
  for (const entry of list.characters) if (entry.magicItems.includes(itemId)) count += 1;
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
