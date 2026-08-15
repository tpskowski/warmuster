import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getArmy, getRuleSet } from "../data/gameData";
import { createList } from "../domain/lists";
import { buildShareUrl } from "../domain/shareCode";
import ExportDialog from "./ExportDialog";

vi.mock("../domain/shareCode", () => ({
  buildShareUrl: vi.fn(),
}));

const writeText = vi.fn();

function renderDialog() {
  const ruleSet = getRuleSet("warmaster-custom")!;
  const army = getArmy(ruleSet.id, "dwarfs")!;
  const list = createList(ruleSet.id, ruleSet.version, "dwarfs", "Throng of [Dorin]", 2000);
  render(<ExportDialog list={list} army={army} onClose={vi.fn()} onPrint={vi.fn()} />);
}

describe("ExportDialog share links", () => {
  beforeEach(() => {
    vi.mocked(buildShareUrl).mockResolvedValue("https://warmuster.example/#shared-list");
    writeText.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  });

  it("copies the full sharable URL", async () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Copy sharable link" }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("https://warmuster.example/#shared-list"),
    );
  });

  it("copies a short Discord Markdown link labeled with the list name", async () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Copy Discord link" }));
    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith(
        "[Warmuster - Throng of \\[Dorin\\]](https://warmuster.example/#shared-list)",
      ),
    );
  });
});
