import { fireEvent, render, screen, within } from "@testing-library/react";
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
      scoutingEnabled={false}
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

  it("displays flat and per-1000 maximums at their correct 2000-point values", () => {
    renderCatalog("warmaster-custom");

    const fixedCapRow = screen.getByText("Dramar Thungnisson", { exact: true }).closest("li")!;
    const scaledCapRow = screen.getByText("Ram Riders", { exact: true }).closest("li")!;
    expect(fixedCapRow).toHaveTextContent("Min/Max -/1");
    expect(scaledCapRow).toHaveTextContent("Min/Max -/4");
  });

  it("portals details outside a faded at-maximum row", () => {
    const ruleSet = getRuleSet("warmaster-revolution")!;
    const army = getArmy("warmaster-revolution", "dwarfs")!;
    const list = createList(
      "warmaster-revolution",
      ruleSet.version,
      "dwarfs",
      "Maximum Rangers",
      2000,
    );
    list.units = [
      { unitId: "dwarfs:rangers", quantity: 4, upgrades: [], magicItems: [] },
    ];
    render(
      <Catalog
        army={army}
        list={list}
        onAddUnit={vi.fn()}
        onAddCharacter={vi.fn()}
        onOpenMagicItems={vi.fn()}
        scoutingEnabled={false}
      />,
    );

    const row = screen.getByText("Rangers", { exact: true }).closest("li")!;
    expect(row).toHaveClass("at-max");
    fireEvent.click(within(row).getByRole("button", { name: "View details for Rangers" }));
    const dialog = screen.getByRole("dialog", { name: "Rangers details" });
    expect(row).not.toContainElement(dialog);
    expect(dialog.closest(".modal-backdrop")?.parentElement).toBe(document.body);
  });
});
