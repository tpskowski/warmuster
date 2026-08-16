// Core data types for Warmuster. Unit shape follows schema.md.

export type UnitCategory = "unit" | "character" | "upgrade";
export type Facing = "long" | "short" | "round" | null;

/**
 * How a hired Regiment of Renown eats into the hiring army's own allowances.
 * The rulebook phrases these as descriptions of the hiring army's list ("count
 * as one highest point value limited infantry type unit") rather than as named
 * units, so the target is resolved against that army's data at runtime.
 */
export type CountsAsRule =
  /** Hiring does not restrict any of the army's own units. */
  | "none"
  | "limited-infantry"
  | "limited-shooting-infantry"
  | "limited-cavalry-or-chariot"
  | "artillery"
  /** Any Hero-type unit, player's choice — resolved as a shared pool. */
  | "hero"
  /** A flying unit of 3 stands (the Birdmen of Catrazza). */
  | "flying-3-stands"
  /** The highest point value Monstrous Mount causing terror (Asarnil's dragon). */
  | "monstrous-mount-terror";

export interface HireTerms {
  /** Army ids that may hire this regiment, from the Allies Table. */
  armies: string[];
  countsAs: {
    rule: CountsAsRule;
    /** Per-army overrides: a unitId, or "group:<rule>" for a player's-choice
     * pool (e.g. Tomb Kings' "count as 1 of any monster type"). */
    byArmy?: Record<string, string>;
    /** Further slots consumed on top of `rule`. */
    also?: CountsAsRule[];
  };
  /** Regiments that may not be hired alongside this one. Symmetric. */
  conflicts?: string[];
  /** Units of the hiring army this regiment refuses to serve with, e.g.
   * "nor Dwarfs in Dogs of War army". */
  conflictUnits?: Record<string, string[]>;
}

export interface UnitData {
  ruleSet: string;
  ruleBook: string;
  version: string;
  army: string;
  unitId: string;
  troop: string;
  type: string;
  subType: string | null;
  category: UnitCategory;
  /** Scouting value assigned by the optional Scouting deployment rules. */
  scoutingPoints: 0 | 1 | 2 | 3;
  facing: Facing;
  speed: number | null;
  halfPace: number | null;
  eligibleToUpgrade: string[];
  meleeAttacks: number | null;
  rangedAttacks: number | null;
  bonusAttacks: number | null;
  meleeAttackProfile: string | null;
  rangedAttackProfile: string | null;
  hits: number | null;
  armour: string | null;
  command: number | null;
  bonusCommand: number | null;
  unitSize: number | null;
  unitSizeModifier: number | null;
  points: number | null;
  upgradePoints: number | null;
  min: number | null;
  max: number | null;
  /** When true, `max` is a flat army-wide cap rather than a per-1000-points
   * allowance (e.g. the Dwarf Anvil / Oath Stone: one per army at any size). */
  maxPerArmy?: boolean;
  /** This unit may stand in for another unit's allowance: up to `perThousand`
   * of these per full 1000 points count toward `unitId`'s min *and* max (e.g.
   * Dogs of War Handgunners replacing Crossbowmen). `perThousand: null` means
   * any number may stand in (Cathay Handguns). The substitute still counts
   * against this unit's own max independently. */
  substitutesFor?: { unitId: string; perThousand: number | null } | null;
  /** This unit/upgrade may only be taken if the army also fields at least
   * `min` of `unitId` (e.g. the Witch Hunter War Altar needs a unit of
   * Flagellants). */
  requiresUnit?: { unitId: string; min: number } | null;
  /** Regiments of Renown only: the terms on which another army may hire this
   * regiment as a mercenary. */
  hire?: HireTerms | null;
  specialName: string | null;
  specials: string[];
  /** Named roll chart (e.g. the Giant Goes Wild Chart) split out of the
   * specials; `text` holds one chart entry per line. */
  chart: { name: string; text: string } | null;
  notes: string | null;
}

export interface SpellData {
  name: string;
  toCast: string;
  range: string;
  text: string;
}

export interface ArmyData {
  ruleSet: string;
  ruleBook: string;
  version: string;
  army: string;
  name: string;
  units: UnitData[];
  armyRules: string[];
  spells: SpellData[];
}

export interface RuleSetInfo {
  id: string;
  name: string;
  version: string;
  armies: ArmyData[];
}

// Saved list schema (schema.md "Saved List Schema").

export interface SavedUnitEntry {
  unitId: string;
  quantity: number;
  upgrades: string[];
  magicItems: string[];
  /** Whether this stack is committed to the optional Scouting deployment. */
  scoutingCommitted?: boolean;
}

export interface SavedCharacterEntry {
  id: string;
  unitId: string;
  upgrades: string[];
  magicItems: string[];
  /** Whether this character is committed to the optional Scouting deployment. */
  scoutingCommitted?: boolean;
}

export interface SavedList {
  id: string;
  schemaVersion: 1;
  ruleSet: string;
  ruleVersion: string;
  army: string;
  name: string;
  pointsLimit: number;
  units: SavedUnitEntry[];
  characters: SavedCharacterEntry[];
  notes: string | null;
  updatedAt: string;
  /** Whether the catalog offers Regiments of Renown for hire. Absent on lists
   * saved before mercenaries existed, which reads as off. */
  allowMercenaries?: boolean;
  /** The folder holding this list. Null — or absent, on lists saved before
   * folders existed — means it sits at the rail's top level. */
  folderId?: string | null;
  /** Position among its siblings (the lists in the same folder). Absent until
   * the list has been dragged into place; those sort last, in saved order. */
  sortIndex?: number;
}

/** A folder in the list rail. Folders belong to a rule set, like the lists
 * they hold, so each rule set keeps its own organisation. */
export interface Folder {
  id: string;
  ruleSet: string;
  name: string;
  /** Position among the rule set's folders. */
  sortIndex: number;
}

export interface ValidationIssue {
  severity: "error" | "warning";
  message: string;
  unitId?: string;
}
