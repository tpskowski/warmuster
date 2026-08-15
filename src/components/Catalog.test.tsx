import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getArmy, getRuleSet } from "../data/gameData";
import { createList } from "../domain/lists";
import Catalog from "./Catalog";

function renderCatalog(ruleSetId: string) {
  const ruleSet = getRuleSet(ruleSetId)!;
  const army = getArmy(ruleSetId, "dwarfs")!;
  const list = createList(ruleSetId, ruleSet.version, "dwarfs", "Test Dwarfs", 2000);
  render(
    <Catalog
      army={army}
      list={list}
      onAddUnit={vi.fn()}
      onAddCharacter={vi.fn()}
      onOpenMagicItems={vi.fn()}
    />,
  );
}

describe("Catalog", () => {
  it("separates custom Dwarf characters in the right rail", () => {
    renderCatalog("warmaster-custom");

    const standardList = screen.getByRole("heading", { name: "Characters" }).nextElementSibling!;
    const customList = screen.getByRole("heading", {
      name: "Custom Characters",
    }).nextElementSibling!;

    expect(within(standardList as HTMLElement).getByText("Runesmith")).toBeInTheDocument();
    expect(within(standardList as HTMLElement).queryByText("Dramar Thungnisson")).toBeNull();
    expect(within(customList as HTMLElement).getByText("Dramar Thungnisson")).toBeInTheDocument();
    expect(within(customList as HTMLElement).getByText("Roknar Gromdal")).toBeInTheDocument();
  });

  it("does not add a custom heading to the standard ruleset", () => {
    renderCatalog("warmaster-revolution");
    expect(screen.queryByRole("heading", { name: "Custom Characters" })).toBeNull();
  });
});
