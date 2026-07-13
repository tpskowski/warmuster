// Core data types for Warmuster. Unit shape follows schema.md.

export type UnitCategory = "unit" | "character" | "upgrade";
export type Facing = "long" | "short" | "round" | null;

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
}

export interface SavedCharacterEntry {
  id: string;
  unitId: string;
  upgrades: string[];
  magicItems: string[];
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
}

export interface ValidationIssue {
  severity: "error" | "warning";
  message: string;
  unitId?: string;
}
