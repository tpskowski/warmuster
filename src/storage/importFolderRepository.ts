import {
  IMPORTS_FOLDER_TARGET,
  isImportFolderTarget,
  type ImportFolderTarget,
} from "../domain/folders";

const STORAGE_KEY = "warmuster.importFolderPreferences.v1";

export type ImportFolderPreferences = Record<string, ImportFolderTarget>;

export function loadImportFolderPreferences(): ImportFolderPreferences {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([ruleSet, target]) => ruleSet.length > 0 && isImportFolderTarget(target),
      ),
    ) as ImportFolderPreferences;
  } catch {
    return {};
  }
}

export function importFolderPreference(
  preferences: ImportFolderPreferences,
  ruleSet: string,
): ImportFolderTarget {
  return preferences[ruleSet] ?? IMPORTS_FOLDER_TARGET;
}

export function saveImportFolderPreferences(preferences: ImportFolderPreferences): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}
