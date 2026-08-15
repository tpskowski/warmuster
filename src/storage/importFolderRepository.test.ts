import { beforeEach, describe, expect, it } from "vitest";
import {
  IMPORTS_FOLDER_TARGET,
  NO_IMPORT_FOLDER_TARGET,
  folderImportTarget,
} from "../domain/folders";
import {
  importFolderPreference,
  loadImportFolderPreferences,
  saveImportFolderPreferences,
} from "./importFolderRepository";

describe("import folder preferences", () => {
  beforeEach(() => localStorage.clear());

  it("defaults every rule set to Imports without requiring that folder to exist", () => {
    expect(importFolderPreference(loadImportFolderPreferences(), "warmaster-custom")).toBe(
      IMPORTS_FOLDER_TARGET,
    );
  });

  it("persists separate targets for different rule sets", () => {
    const preferences = {
      "warmaster-custom": folderImportTarget("events"),
      "warmaster-revolution": NO_IMPORT_FOLDER_TARGET,
    };
    expect(saveImportFolderPreferences(preferences)).toBe(true);
    expect(loadImportFolderPreferences()).toEqual(preferences);
  });

  it("ignores malformed stored targets", () => {
    localStorage.setItem(
      "warmuster.importFolderPreferences.v1",
      JSON.stringify({ valid: "none", invalid: "new-folder" }),
    );
    expect(loadImportFolderPreferences()).toEqual({ valid: NO_IMPORT_FOLDER_TARGET });
  });
});
