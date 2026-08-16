import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IMPORTS_FOLDER_TARGET, folderImportTarget } from "../domain/folders";
import type { Folder, RuleSetInfo } from "../types";
import ConfigDialog from "./ConfigDialog";

const ruleSets = [
  { id: "warmaster-custom", name: "A Matter of Mustaches", version: "1", armies: [] },
  { id: "warmaster-revolution", name: "Warmaster Revolution", version: "1", armies: [] },
  { id: "wmr-2026-playtest", name: "WMR - 2026 Playtest", version: "1", armies: [] },
] satisfies RuleSetInfo[];

function renderDialog(folders: Folder[], onSelectImportFolder = vi.fn()) {
  render(
    <ConfigDialog
      ruleSets={ruleSets}
      activeRuleSet="warmaster-custom"
      onSelectRuleSet={vi.fn()}
      simplifiedView={false}
      onToggleSimplifiedView={vi.fn()}
      scoutingEnabled={false}
      onToggleScouting={vi.fn()}
      lists={[]}
      folders={folders}
      importFolderTarget={IMPORTS_FOLDER_TARGET}
      onSelectImportFolder={onSelectImportFolder}
      onReplaceAll={vi.fn()}
      onClose={vi.fn()}
    />,
  );
  return onSelectImportFolder;
}

describe("ConfigDialog default import folder", () => {
  it("defaults to Imports even when no Imports folder exists", () => {
    renderDialog([]);
    const select = screen.getByRole("combobox", { name: "Default import folder" });
    expect(select).toHaveValue(IMPORTS_FOLDER_TARGET);
    expect(screen.getByRole("option", { name: "Imports" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "No folder" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "WMR - 2026 Playtest" })).toBeInTheDocument();
  });

  it("offers existing folders from only the active rule set", () => {
    const onSelect = renderDialog([
      { id: "events", ruleSet: "warmaster-custom", name: "Events", sortIndex: 0 },
      { id: "other", ruleSet: "warmaster-revolution", name: "Other", sortIndex: 0 },
    ]);
    const select = screen.getByRole("combobox", { name: "Default import folder" });
    expect(screen.getByRole("option", { name: "Events" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Other" })).toBeNull();

    fireEvent.change(select, { target: { value: folderImportTarget("events") } });
    expect(onSelect).toHaveBeenCalledWith(folderImportTarget("events"));
  });
});

describe("ConfigDialog scouting rules", () => {
  it("opens the rules table from the information button", () => {
    renderDialog([]);
    fireEvent.click(screen.getByRole("button", { name: "Scouting rules" }));
    expect(screen.getByRole("heading", { name: "Scouting" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Troop types" })).toBeInTheDocument();
    expect(screen.getByText("Flyers")).toBeInTheDocument();
  });
});
