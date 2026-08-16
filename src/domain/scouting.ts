import type { ArmyData, SavedCharacterEntry, SavedList, SavedUnitEntry, UnitData } from "../types";
import { getUnit } from "../data/gameData";

export const SCOUTING_RULES = {
  introduction:
    "Scouting rules are an alternative way of deploying your armies. It represents the pre-battle struggle for information between opposing armies’ scouts, and their commanders carrying out personal reconnaissance.",
  commitment:
    "Before the game starts, players must indicate on their army lists which units and/or characters they wish to commit to scouting. Using the table below count the total number of committed scouting points.",
  resolution:
    "Each player then rolls 2D6 and adds this to their number of committed scouting points. The player with the higher total chooses the table side and places committed scouting units and/or characters within the deployment zone. Units which are allowed to infiltrate or ambush do not need to be placed at this stage. Scouts and Patrols that are an addition to units, such as Empire Skirmishers, have to be placed at this stage with the rest of the unit. Next the player with the lower total must place all units and characters within the deployment zone. Finally, the player who won the scouting roll places the remainder of the units in the deployment zone and goes second in the turn order.",
  roles: [
    {
      role: "Flyers",
      points: 3,
      troopTypes:
        "Flying unit; any flying character; character on a flying mount; Dwarf Rangers; Skaven Gutter Runners; Ogre Gorgers; Wood Elf Waywatchers.",
    },
    {
      role: "Scouts",
      points: 2,
      troopTypes:
        "Cavalry with 6+ Armour; Ethereal Hosts; Warhounds; Huntsmen; Beastmen Gor/Ungor deployed as ambushers; Skirmishers; non-flying General.",
    },
    {
      role: "Patrols",
      points: 1,
      troopTypes:
        "Cavalry with zero or 5+ Armour; Skaven Rat Swarms; Lizardmen Skinks; non-flying command character.",
    },
  ],
} as const;

/** An attached scouting upgrade (notably a flying mount, Skirmishers, or
 * Warhounds) determines the score of the configured unit when it is higher. */
export function effectiveScoutingPoints(
  army: ArmyData,
  unit: UnitData,
  upgradeIds: string[] = [],
): number {
  return Math.max(
    unit.scoutingPoints,
    ...upgradeIds.map((id) => getUnit(army, id)?.scoutingPoints ?? 0),
  );
}

export function entryScoutingPoints(
  army: ArmyData,
  entry: SavedUnitEntry | SavedCharacterEntry,
  unit: UnitData,
): number {
  const perCopy = effectiveScoutingPoints(army, unit, entry.upgrades);
  return perCopy * ("quantity" in entry ? entry.quantity : 1);
}

/** Maximum available scouting value if every eligible entry is committed. */
export function totalScoutingPoints(list: SavedList, army: ArmyData): number {
  return [...list.units, ...list.characters].reduce((total, entry) => {
    const unit = getUnit(army, entry.unitId);
    return total + (unit ? entryScoutingPoints(army, entry, unit) : 0);
  }, 0);
}
