import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getArmy } from "../data/gameData";
import { addUnit, createList, toggleUnitScouting } from "../domain/lists";
import { totalScoutingPoints } from "../domain/scouting";
import Roster from "./Roster";

describe("Roster scouting commitments", () => {
  it("shows separate committed and uncommitted stacks with a live total", () => {
    const army = getArmy("warmaster-revolution", "dwarfs")!;
    let list = createList("warmaster-revolution", army.version, army.army, "Scouts", 1000);
    list = addUnit(list, "dwarfs:rangers");
    list = addUnit(list, "dwarfs:rangers");
    list = toggleUnitScouting(list, 0);
    const onToggleUnitScouting = vi.fn();

    render(
      <Roster
        army={army}
        list={list}
        issues={[]}
        onRemoveUnit={vi.fn()}
        onAddUnitCopy={vi.fn()}
        onToggleUnitScouting={onToggleUnitScouting}
        onToggleUnitUpgrade={vi.fn()}
        onRemoveCharacter={vi.fn()}
        onToggleCharacterScouting={vi.fn()}
        onToggleCharacterUpgrade={vi.fn()}
        onRemoveMagicItem={vi.fn()}
        onRename={vi.fn()}
        onSetPointsLimit={vi.fn()}
        onSetNotes={vi.fn()}
        onSetAllowMercenaries={vi.fn()}
        scoutingEnabled
      />,
    );

    expect(screen.getByText(`Scouting: ${totalScoutingPoints(list, army)} SP`)).toBeInTheDocument();
    const uncommitted = screen.getByRole("checkbox", { name: "Commit one Rangers to scouting" });
    const committed = screen.getByRole("checkbox", { name: "Remove one Rangers from scouting" });
    expect(uncommitted).not.toBeChecked();
    expect(uncommitted.closest("label")).not.toHaveClass("committed");
    expect(committed).toBeChecked();
    expect(committed.closest("label")).toHaveClass("committed");

    fireEvent.click(uncommitted);
    expect(onToggleUnitScouting).toHaveBeenCalledWith(0);
  });
});
