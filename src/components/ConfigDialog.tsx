import { useEffect, useRef, useState } from "react";
import type { Folder, RuleSetInfo, SavedList } from "../types";
import { backupFileName, parseBackup, serializeBackup, type BackupContents } from "../domain/backup";
import {
  folderImportTarget,
  foldersForRuleSet,
  IMPORTS_FOLDER_NAME,
  IMPORTS_FOLDER_TARGET,
  NO_IMPORT_FOLDER_TARGET,
  type ImportFolderTarget,
} from "../domain/folders";
import { SCOUTING_RULES } from "../domain/scouting";
import { InfoIcon, ScoutingIcon } from "./Icons";

interface ConfigDialogProps {
  ruleSets: RuleSetInfo[];
  activeRuleSet: string;
  onSelectRuleSet: (id: string) => void;
  simplifiedView: boolean;
  onToggleSimplifiedView: (value: boolean) => void;
  scoutingEnabled: boolean;
  onToggleScouting: (value: boolean) => void;
  /** Every saved list in this browser, across all rule sets. */
  lists: SavedList[];
  /** Every folder in this browser, across all rule sets. */
  folders: Folder[];
  importFolderTarget: ImportFolderTarget;
  onSelectImportFolder: (target: ImportFolderTarget) => void;
  onReplaceAll: (lists: SavedList[], folders: Folder[]) => boolean;
  onClose: () => void;
}

function downloadFile(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

/** A parsed backup waiting for the user to confirm the replace. */
type PendingImport = { fileName: string } & BackupContents;

/** App configuration: the active rule set (each set keeps its own saved
 * lists), view preferences, and whole-collection backup/restore. */
export default function ConfigDialog({
  ruleSets,
  activeRuleSet,
  onSelectRuleSet,
  simplifiedView,
  onToggleSimplifiedView,
  scoutingEnabled,
  onToggleScouting,
  lists,
  folders,
  importFolderTarget,
  onSelectImportFolder,
  onReplaceAll,
  onClose,
}: ConfigDialogProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingImport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);
  const [scoutingRulesOpen, setScoutingRulesOpen] = useState(false);
  const importFolderOptions = foldersForRuleSet(folders, activeRuleSet).filter(
    (folder) => folder.name.trim().toLowerCase() !== IMPORTS_FOLDER_NAME.toLowerCase(),
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (scoutingRulesOpen) {
        setScoutingRulesOpen(false);
        return;
      }
      onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, scoutingRulesOpen]);

  const exportBackup = () => downloadFile(backupFileName(), serializeBackup(lists, folders));

  const pickFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setImported(false);
    const parsed = parseBackup(await file.text());
    if (!parsed) {
      setError("That file isn't a Warmuster backup.");
      return;
    }
    // Nothing is written yet — the replace happens on confirm below.
    setPending({ fileName: file.name, ...parsed });
  };

  const confirmImport = () => {
    if (!pending) return;
    if (!onReplaceAll(pending.lists, pending.folders)) {
      setError("Could not save the restored lists. Check browser storage and try again.");
      return;
    }
    setPending(null);
    setImported(true);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-label="Configuration" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Configuration</h2>
          <button type="button" className="icon-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>
        <label className="config-field">
          <span>Rule set</span>
          <select
            value={activeRuleSet}
            onChange={(e) => onSelectRuleSet(e.target.value)}
            aria-label="Rule set"
          >
            {ruleSets.map((rs) => (
              <option key={rs.id} value={rs.id}>
                {rs.name}
              </option>
            ))}
          </select>
        </label>
        <p className="config-hint">
          Each rule set keeps its own saved lists. Switching shows the lists for that set.
        </p>
        <label className="config-field">
          <span>Default import folder</span>
          <select
            value={importFolderTarget}
            onChange={(event) => onSelectImportFolder(event.target.value as ImportFolderTarget)}
            aria-label="Default import folder"
          >
            <option value={IMPORTS_FOLDER_TARGET}>{IMPORTS_FOLDER_NAME}</option>
            <option value={NO_IMPORT_FOLDER_TARGET}>No folder</option>
            {importFolderOptions.map((folder) => (
              <option key={folder.id} value={folderImportTarget(folder.id)}>
                {folder.name}
              </option>
            ))}
          </select>
        </label>
        <p className="config-hint">
          Shared lists are filed here. The Imports folder is created only when first needed.
        </p>
        <label className="config-toggle">
          <input
            type="checkbox"
            checked={simplifiedView}
            onChange={(e) => onToggleSimplifiedView(e.target.checked)}
          />
          <span>Simplified view</span>
        </label>
        <p className="config-hint">Hides unit stats while building a list.</p>

        <div className="config-option-row">
          <label className="config-toggle config-scouting-toggle">
            <input
              type="checkbox"
              checked={scoutingEnabled}
              onChange={(e) => onToggleScouting(e.target.checked)}
            />
            <ScoutingIcon className="config-option-icon" />
            <span>Scouting</span>
          </label>
          <button
            type="button"
            className="icon-btn config-info-btn"
            onClick={() => setScoutingRulesOpen(true)}
            title="Scouting rules"
            aria-label="Scouting rules"
          >
            <InfoIcon />
          </button>
        </div>
        <p className="config-hint">
          Shows scouting values and lets you commit units to the army’s scouting total.
        </p>

        <h3 className="panel-heading">Backup</h3>
        <p className="config-hint">
          Lists are saved in this browser only. A backup file holds every list from every rule
          set, in the folders they are filed under — export it here, then import it on another
          computer to make that browser an exact copy.
        </p>
        <div className="backup-actions">
          <button type="button" className="primary-btn" onClick={exportBackup}>
            ⬇ Export all lists
          </button>
          <button type="button" className="primary-btn" onClick={() => fileInput.current?.click()}>
            ⬆ Import backup…
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="visually-hidden"
            aria-label="Backup file"
            onChange={(e) => {
              void pickFile(e.target.files?.[0]);
              // Reset so picking the same file twice fires onChange again.
              e.target.value = "";
            }}
          />
        </div>
        {error && <p className="config-error">{error}</p>}
        {imported && <p className="config-hint">Lists replaced from the backup.</p>}
      </div>
      {scoutingRulesOpen && (
        <div
          className="modal-backdrop"
          onClick={(event) => {
            event.stopPropagation();
            setScoutingRulesOpen(false);
          }}
        >
          <div
            className="modal scouting-rules-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="scouting-rules-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <h2 id="scouting-rules-title">Scouting</h2>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setScoutingRulesOpen(false)}
                title="Close"
              >
                ✕
              </button>
            </div>
            <div className="scouting-rules-copy">
              <p>{SCOUTING_RULES.introduction}</p>
              <p>{SCOUTING_RULES.commitment}</p>
              <p>{SCOUTING_RULES.resolution}</p>
              <table>
                <thead>
                  <tr><th>Role</th><th>Points</th><th>Troop types</th></tr>
                </thead>
                <tbody>
                  {SCOUTING_RULES.roles.map((role) => (
                    <tr key={role.role}>
                      <th>{role.role}</th><td>{role.points}</td><td>{role.troopTypes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {pending && (
        <div className="modal-backdrop" onClick={() => setPending(null)}>
          <div
            className="modal confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="import-backup-title"
            aria-describedby="import-backup-description"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <h2 id="import-backup-title">Replace all lists?</h2>
            </div>
            <p id="import-backup-description">
              <strong>{pending.fileName}</strong> holds {pending.lists.length} list
              {pending.lists.length === 1 ? "" : "s"} in {pending.folders.length} folder
              {pending.folders.length === 1 ? "" : "s"}. Importing it permanently removes the{" "}
              {lists.length} list{lists.length === 1 ? "" : "s"} and {folders.length} folder
              {folders.length === 1 ? "" : "s"} saved in this browser and replaces them with the
              backup's.
            </p>
            {error && <p className="config-error">{error}</p>}
            <div className="confirm-actions">
              <button type="button" autoFocus onClick={() => setPending(null)}>
                Cancel
              </button>
              <button type="button" className="danger-btn" onClick={confirmImport}>
                Replace my lists
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
