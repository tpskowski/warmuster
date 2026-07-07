import type { UnitData } from "../types";

export interface UnitStat {
  label: string;
  value: string;
}

export function signedLabel(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}

export function meleeAttacksLabel(unit: UnitData): string | null {
  return unit.meleeAttackProfile ??
    (unit.meleeAttacks != null ? String(unit.meleeAttacks) : null);
}

export function rangedAttacksLabel(unit: UnitData): string | null {
  return unit.rangedAttackProfile ??
    (unit.rangedAttacks != null ? String(unit.rangedAttacks) : null);
}

/** Schema-aware stat rows. Inapplicable values are omitted rather than shown as dashes. */
export function unitStatRows(unit: UnitData): UnitStat[] {
  const rows: UnitStat[] = [];
  const melee = meleeAttacksLabel(unit);
  const ranged = rangedAttacksLabel(unit);
  if (melee != null) rows.push({ label: "Melee Attacks", value: melee });
  if (ranged != null) rows.push({ label: "Ranged Attacks", value: ranged });
  if (unit.bonusAttacks != null) rows.push({ label: "Bonus Attacks", value: signedLabel(unit.bonusAttacks) });
  if (unit.hits != null) rows.push({ label: "Hits", value: String(unit.hits) });
  if (unit.armour != null) rows.push({ label: "Armour", value: unit.armour });
  if (unit.command != null) rows.push({ label: "Command", value: String(unit.command) });
  if (unit.bonusCommand != null) rows.push({ label: "Command", value: signedLabel(unit.bonusCommand) });
  if (unit.speed != null) rows.push({ label: "Speed", value: `${unit.speed}cm` });
  return rows;
}

/** Legacy source-table notation, retained for compact exports where one cell is required. */
export function attacksLabel(unit: UnitData): string {
  const melee = meleeAttacksLabel(unit);
  const ranged = rangedAttacksLabel(unit);
  const bonus = unit.bonusAttacks != null ? signedLabel(unit.bonusAttacks) : null;
  const main = melee ?? bonus;
  if (main == null && ranged == null) return "-";
  return ranged != null ? `${main ?? "-"}/${ranged}` : (main ?? "-");
}

export function minMaxLabel(unit: UnitData, scale = 1): string {
  const factor = unit.type === "General" ? 1 : scale;
  const min = unit.min != null ? unit.min * factor : null;
  const max = unit.max != null ? unit.max * factor : null;
  if (min == null && max == null) return "-/-";
  if (min != null && min === max) return String(min);
  return `${min ?? "-"}/${max ?? "-"}`;
}

export function pointsLabel(unit: UnitData): string {
  if (unit.upgradePoints != null) return signedLabel(unit.upgradePoints);
  if (unit.points != null) return String(unit.points);
  return "-";
}

export default function UnitStats({ unit }: { unit: UnitData }) {
  return (
    <span className="unit-stats">
      {unitStatRows(unit).filter(({ label }) => label !== "Speed").map(({ label, value }) => (
        <span key={label} className="stat">
          <span className="stat-label">{label}</span> {value}
        </span>
      ))}
    </span>
  );
}
