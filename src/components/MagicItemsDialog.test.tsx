import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getArmy } from "../data/gameData";
import { addCharacter, createList, toggleCharacterUpgrade } from "../domain/lists";
import MagicItemsDialog from "./MagicItemsDialog";

describe("MagicItemsDialog", () => {
  it("offers Wizard-only items to a General with the Tzarina upgrade", () => {
    const army = getArmy("warmaster-revolution", "kislev")!;
    let list = createList("warmaster-revolution", army.version, "kislev", "Kislev", 1000);
    list = addCharacter(list, "kislev:general");
    list = toggleCharacterUpgrade(list, list.characters[0].id, "kislev:tzarina");

    render(
      <MagicItemsDialog army={army} list={list} onAssign={vi.fn()} onClose={vi.fn()} />,
    );

    const wand = screen.getByRole("combobox", { name: "Assign Wand of Power" });
    expect(wand).toBeEnabled();
    expect(
      within(wand).getByRole("option", { name: "General [Tzarina] — 10 pts" }),
    ).toBeInTheDocument();
  });
});
