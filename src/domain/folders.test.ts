import { describe, expect, it } from "vitest";
import type { Folder, SavedList } from "../types";
import {
  IMPORTS_FOLDER_NAME,
  IMPORTS_FOLDER_TARGET,
  NO_IMPORT_FOLDER_TARGET,
  createFolder,
  deleteFolder,
  ensureImportsFolder,
  folderImportTarget,
  foldersForRuleSet,
  listsInFolder,
  moveFolder,
  moveList,
  normalizeImportFolderTarget,
  renameFolder,
  resolveImportFolder,
  topLevelLists,
} from "./folders";

const RULE_SET = "warmaster-revolution";

function list(id: string, folderId: string | null = null, sortIndex?: number): SavedList {
  return { id, ruleSet: RULE_SET, folderId, sortIndex } as SavedList;
}

function folder(id: string, sortIndex: number, ruleSet = RULE_SET): Folder {
  return { id, ruleSet, name: id, sortIndex };
}

describe("createFolder", () => {
  it("appends after the rule set's existing folders", () => {
    const folders = [folder("a", 0), folder("b", 1), folder("other", 7, "warmaster-custom")];
    expect(createFolder(folders, RULE_SET, "Tournament")).toMatchObject({
      ruleSet: RULE_SET,
      name: "Tournament",
      sortIndex: 2,
    });
  });

  it("trims the name and falls back when it is blank", () => {
    expect(createFolder([], RULE_SET, "  Casual  ").name).toBe("Casual");
    expect(createFolder([], RULE_SET, "   ").name).toBe("New folder");
  });
});

describe("ensureImportsFolder", () => {
  it("creates the Imports folder on the first import", () => {
    const { folders, folder: created } = ensureImportsFolder([], RULE_SET);
    expect(created.name).toBe(IMPORTS_FOLDER_NAME);
    expect(folders).toEqual([created]);
  });

  it("reuses an existing Imports folder, whatever its casing", () => {
    const existing = { ...folder("imports", 0), name: "imports" };
    const result = ensureImportsFolder([existing], RULE_SET);
    expect(result.folder).toBe(existing);
    expect(result.folders).toHaveLength(1);
  });

  it("keeps each rule set's Imports folder separate", () => {
    const { folders } = ensureImportsFolder(
      [{ ...folder("i", 0), name: IMPORTS_FOLDER_NAME }],
      "warmaster-custom",
    );
    expect(folders).toHaveLength(2);
    expect(foldersForRuleSet(folders, "warmaster-custom")).toHaveLength(1);
  });
});

describe("resolveImportFolder", () => {
  it("defaults to a lazily-created Imports folder", () => {
    const result = resolveImportFolder([], RULE_SET, IMPORTS_FOLDER_TARGET);
    expect(result.folders).toHaveLength(1);
    expect(result.folders[0]).toMatchObject({
      id: result.folderId,
      name: IMPORTS_FOLDER_NAME,
      ruleSet: RULE_SET,
    });
  });

  it("can leave imported lists outside folders", () => {
    expect(resolveImportFolder([], RULE_SET, NO_IMPORT_FOLDER_TARGET)).toEqual({
      folders: [],
      folderId: null,
    });
  });

  it("uses an existing folder owned by the imported list's rule set", () => {
    const existing = folder("events", 0);
    expect(resolveImportFolder([existing], RULE_SET, folderImportTarget(existing.id))).toEqual({
      folders: [existing],
      folderId: existing.id,
    });
  });

  it("falls back to Imports for a stale or cross-rule-set folder selection", () => {
    const other = folder("events", 0, "warmaster-custom");
    const result = resolveImportFolder([other], RULE_SET, folderImportTarget(other.id));
    expect(result.folderId).not.toBe(other.id);
    expect(result.folders.find((candidate) => candidate.id === result.folderId)).toMatchObject({
      name: IMPORTS_FOLDER_NAME,
      ruleSet: RULE_SET,
    });
  });
});

describe("normalizeImportFolderTarget", () => {
  it("keeps special and valid existing-folder selections", () => {
    const existing = folder("events", 0);
    expect(normalizeImportFolderTarget([existing], RULE_SET, NO_IMPORT_FOLDER_TARGET)).toBe(
      NO_IMPORT_FOLDER_TARGET,
    );
    expect(
      normalizeImportFolderTarget([existing], RULE_SET, folderImportTarget(existing.id)),
    ).toBe(folderImportTarget(existing.id));
  });

  it("shows the special Imports option for missing folders and an existing Imports folder", () => {
    const imports = { ...folder("imports", 0), name: IMPORTS_FOLDER_NAME };
    expect(normalizeImportFolderTarget([], RULE_SET, folderImportTarget("gone"))).toBe(
      IMPORTS_FOLDER_TARGET,
    );
    expect(normalizeImportFolderTarget([imports], RULE_SET, folderImportTarget(imports.id))).toBe(
      IMPORTS_FOLDER_TARGET,
    );
  });
});

describe("listsInFolder / topLevelLists", () => {
  const folders = [folder("f1", 0)];
  const lists = [
    list("c", "f1", 1),
    list("a", null, 1),
    list("b", "f1", 0),
    list("orphan", "gone", 0),
    { ...list("elsewhere", null, 0), ruleSet: "warmaster-custom" } as SavedList,
  ];

  it("orders a folder's lists by their saved position", () => {
    expect(listsInFolder(lists, RULE_SET, "f1").map((l) => l.id)).toEqual(["b", "c"]);
  });

  it("shows lists in no folder, and orphans, at the top level", () => {
    expect(topLevelLists(lists, RULE_SET, folders).map((l) => l.id)).toEqual(["orphan", "a"]);
  });

  it("treats a folder owned by another rule set as missing", () => {
    const crossRuleSetFolder = folder("shared", 0, "warmaster-custom");
    expect(topLevelLists([list("cross", "shared")], RULE_SET, [crossRuleSetFolder])).toEqual([
      list("cross", "shared"),
    ]);
  });

  it("sorts lists saved before folders existed last, in saved order", () => {
    const legacy = [list("new", null, 0), list("old"), list("older")];
    expect(topLevelLists(legacy, RULE_SET, []).map((l) => l.id)).toEqual(["new", "old", "older"]);
  });
});

describe("moveList", () => {
  const lists = [list("a", null, 0), list("b", null, 1), list("c", null, 2)];

  it("reorders within the top level", () => {
    const moved = moveList(lists, "c", null, 0);
    expect(topLevelLists(moved, RULE_SET, []).map((l) => l.id)).toEqual(["c", "a", "b"]);
  });

  it("treats the slot as a position in the current order, so a drop just below a list is a no-op", () => {
    const moved = moveList(lists, "a", null, 1);
    expect(topLevelLists(moved, RULE_SET, []).map((l) => l.id)).toEqual(["a", "b", "c"]);
  });

  it("moves a list into a folder, renumbering the folder it lands in", () => {
    const withFolder = [...lists, list("x", "f1", 0)];
    const moved = moveList(withFolder, "b", "f1", 0);
    expect(listsInFolder(moved, RULE_SET, "f1").map((l) => l.sortIndex)).toEqual([0, 1]);
    expect(listsInFolder(moved, RULE_SET, "f1").map((l) => l.id)).toEqual(["b", "x"]);
    // The folder it left keeps its numbering; the gap left behind is harmless
    // because only the relative order is read back.
    expect(listsInFolder(moved, RULE_SET, null).map((l) => l.id)).toEqual(["a", "c"]);
  });

  it("clamps an out-of-range slot to the end", () => {
    const moved = moveList(lists, "a", null, 99);
    expect(topLevelLists(moved, RULE_SET, []).map((l) => l.id)).toEqual(["b", "c", "a"]);
  });

  it("ignores a list that isn't there", () => {
    expect(moveList(lists, "nope", null, 0)).toBe(lists);
  });
});

describe("moveFolder", () => {
  const folders = [folder("a", 0), folder("b", 1), folder("c", 2)];

  it("reorders folders within their rule set", () => {
    expect(foldersForRuleSet(moveFolder(folders, "c", 1), RULE_SET).map((f) => f.id)).toEqual([
      "a",
      "c",
      "b",
    ]);
  });

  it("leaves other rule sets' folders untouched", () => {
    const mixed = [...folders, folder("x", 0, "warmaster-custom")];
    const moved = moveFolder(mixed, "a", 3);
    expect(foldersForRuleSet(moved, RULE_SET).map((f) => f.id)).toEqual(["b", "c", "a"]);
    expect(foldersForRuleSet(moved, "warmaster-custom").map((f) => f.sortIndex)).toEqual([0]);
  });
});

describe("renameFolder", () => {
  const folders = [folder("f1", 0), folder("f2", 1)];

  it("renames only the named folder, trimming the new name", () => {
    const renamed = renameFolder(folders, "f1", "  Tournament  ");
    expect(renamed.map((f) => f.name)).toEqual(["Tournament", "f2"]);
  });

  it("keeps the position and every other field", () => {
    expect(renameFolder(folders, "f2", "Casual")[1]).toEqual({ ...folders[1], name: "Casual" });
  });

  it("ignores a blank name rather than leaving a nameless folder", () => {
    expect(renameFolder(folders, "f1", "   ")).toBe(folders);
  });

  it("ignores a folder that isn't there", () => {
    expect(renameFolder(folders, "nope", "Anything").map((f) => f.name)).toEqual(["f1", "f2"]);
  });
});

describe("deleteFolder", () => {
  it("removes the folder and every list inside it", () => {
    const folders = [folder("f1", 0), folder("f2", 1)];
    const lists = [list("a", "f1"), list("b", null), list("c", "f2")];
    const result = deleteFolder(folders, lists, "f1");
    expect(result.folders.map((f) => f.id)).toEqual(["f2"]);
    expect(result.lists.map((l) => l.id)).toEqual(["b", "c"]);
  });

  it("does not delete a cross-rule-set list that references the same folder id", () => {
    const folders = [folder("shared", 0)];
    const own = list("own", "shared");
    const crossRuleSet = {
      ...list("cross", "shared"),
      ruleSet: "warmaster-custom",
    } as SavedList;

    const result = deleteFolder(folders, [own, crossRuleSet], "shared");
    expect(result.lists).toEqual([crossRuleSet]);
  });
});
