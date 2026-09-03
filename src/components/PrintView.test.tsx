import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getArmy } from "../data/gameData";
import { addUnit, createList, toggleUnitScouting } from "../domain/lists";
import { totalScoutingPoints } from "../domain/scouting";
import { clampCardGutterMm, maxCardGutterMm, PrintList } from "./PrintView";

describe("PrintList", () => {
  it("prints the breakpoint and unit type", () => {
    const army = getArmy("warmaster-revolution", "dwarfs")!;
    const list = createList("warmaster-revolution", army.version, army.army, "Dwarfs", 2000);
    list.units = [
      { unitId: "dwarfs:warriors", quantity: 5, upgrades: [], magicItems: [] },
    ];

    render(<PrintList list={list} army={army} />);

    expect(screen.getByText(/Dwarfs · Warmaster Revolution/)).toHaveTextContent(
      `Dwarfs · Warmaster Revolution ${army.version} · 550/2000 pts · Breakpoint: 3`,
    );
    expect(screen.getByRole("columnheader", { name: "Type" })).toBeInTheDocument();
    expect(screen.getByText("Warriors").closest("tr")).toHaveTextContent("Infantry");
  });

  it("prints committed scouting units and their total", () => {
    const army = getArmy("warmaster-revolution", "dwarfs")!;
    let list = createList("warmaster-revolution", army.version, army.army, "Scouts", 1000);
    list = addUnit(list, "dwarfs:rangers");
    list = addUnit(list, "dwarfs:rangers");
    list = toggleUnitScouting(list, 0);

    render(<PrintList list={list} army={army} scoutingEnabled />);

    expect(screen.getByText(/Scouting units:/)).toHaveTextContent(
      `Scouting units: ${totalScoutingPoints(list, army)} SP`,
    );
    const table = screen.getByRole("table");
    expect(within(table).getByRole("columnheader", { name: "SP" })).toBeInTheDocument();
    expect(within(table).getAllByText(/^✓ \d+$/)).toHaveLength(1);
  });
});

describe("card gutter", () => {
  // Three 88mm rows are 264mm: A4 has 281mm of printable height to spend,
  // Letter only 267.4mm, so Letter is what limits the gutter.
  it("offers the widest gutter each paper can still fit 3 x 3 cards in", () => {
    expect(maxCardGutterMm("a4")).toBe(4.5);
    expect(maxCardGutterMm("letter")).toBe(1.5);
  });

  it("clamps a gutter to the chosen paper so a row can never spill", () => {
    expect(clampCardGutterMm(0, "letter")).toBe(0);
    expect(clampCardGutterMm(1.5, "letter")).toBe(1.5);
    // An A4-sized gutter carried over to Letter comes back to Letter's max.
    expect(clampCardGutterMm(4.5, "letter")).toBe(1.5);
    expect(clampCardGutterMm(4.5, "a4")).toBe(4.5);
    expect(clampCardGutterMm(99, "a4")).toBe(4.5);
    expect(clampCardGutterMm(-3, "a4")).toBe(0);
    expect(clampCardGutterMm(Number.NaN, "a4")).toBe(0);
  });
});
