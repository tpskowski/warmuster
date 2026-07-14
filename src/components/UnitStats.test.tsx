import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getArmy } from "../data/gameData";
import UnitStats, { signedLabel, unitStatRows } from "./UnitStats";

const empire = getArmy("warmaster-revolution", "empire")!;
const chaos = getArmy("warmaster-revolution", "chaos")!;

function unit(army: typeof empire, troop: string) {
  const found = army.units.find((candidate) => candidate.troop === troop);
  if (!found) throw new Error(`Missing ${troop}`);
  return found;
}

describe("unit stats", () => {
  it("shows applicable structured fields without placeholders", () => {
    expect(unitStatRows(unit(empire, "Pistoliers"))).toEqual([
      { label: "Melee Attacks", value: "3" },
      { label: "Ranged Attacks", value: "1" },
      { label: "Hits", value: "3" },
      { label: "Armour", value: "5+" },
      { label: "Speed", value: "30cm" },
    ]);
  });

  it("hides speed in compact UI stats while retaining it for details", () => {
    const pistoliers = unit(empire, "Pistoliers");
    render(<UnitStats unit={pistoliers} />);
    expect(screen.queryByText("Speed")).toBeNull();
    expect(screen.getByText("Melee Attacks")).toBeInTheDocument();
    expect(unitStatRows(pistoliers)).toContainEqual({ label: "Speed", value: "30cm" });
  });

  it("does not mislabel a character attack bonus as melee", () => {
    const rows = unitStatRows(unit(chaos, "General"));
    expect(rows).toContainEqual({ label: "Bonus Attacks", value: "+2" });
    expect(rows.some((row) => row.label === "Melee Attacks" || row.label === "Ranged Attacks")).toBe(false);
    expect(rows.some((row) => row.label === "Hits" || row.label === "Armour")).toBe(false);
  });

  it("shows armour as a dash when zero or absent (unit info view)", () => {
    // "0 or 6+" armour reads the 0 as a dash.
    expect(unitStatRows(unit(empire, "Skirmishers"))).toContainEqual({
      label: "Armour",
      value: "- or 6+",
    });
    // A character with no armour omits the row by default...
    expect(unitStatRows(unit(chaos, "General")).some((r) => r.label === "Armour")).toBe(false);
    // ...but the details view (alwaysArmour) shows it as a dash.
    expect(unitStatRows(unit(chaos, "General"), { alwaysArmour: true })).toContainEqual({
      label: "Armour",
      value: "-",
    });
  });

  it("formats signed modifiers correctly", () => {
    expect(signedLabel(2)).toBe("+2");
    expect(signedLabel(-1)).toBe("-1");
  });
});

