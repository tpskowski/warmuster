import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getArmy } from "../data/gameData";
import { addUnit, createList, toggleUnitScouting } from "../domain/lists";
import { totalScoutingPoints } from "../domain/scouting";
import { PrintList } from "./PrintView";

describe("PrintList scouting commitments", () => {
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
