import { useEffect, useRef, useState } from "react";
import type { RuleSetInfo, SavedList } from "../types";
import { backupFileName, parseBackup, serializeBackup } from "../domain/backup";

interface ConfigDialogProps {
  ruleSets: RuleSetInfo[];
  activeRuleSet: string;
  onSelectRuleSet: (id: string) => void;
  simplifiedView: boolean;
  onToggleSimplifiedView: (value: boolean) => void;
  /** Every saved list in this browser, across all rule sets. */
  lists: SavedList[];
  onReplaceAllLists: (lists: SavedList[]) => void;
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
type PendingImport = { fileName: string; lists: SavedList[] };

/** App configuration: the active rule set (each set keeps its own saved
 * lists), view preferences, and whole-collection backup/restore. */
export default function ConfigDialog({
  ruleSets,
  activeRuleSet,
  onSelectRuleSet,
  simplifiedView,
  onToggleSimplifiedView,
  lists,
  onReplaceAllLists,
  onClose,
}: ConfigDialogProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingImport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const exportBackup = () => downloadFile(backupFileName(), serializeBackup(lists));

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
    setPending({ fileName: file.name, lists: parsed });
  };

  const confirmImport = () => {
    if (!pending) return;
    onReplaceAllLists(pending.lists);
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
        <label className="config-toggle">
          <input
            type="checkbox"
            checked={simplifiedView}
            onChange={(e) => onToggleSimplifiedView(e.target.checked)}
          />
          <span>Simplified view</span>
        </label>
        <p className="config-hint">Hides unit stats while building a list.</p>

        <h3 className="panel-heading">Backup</h3>
        <p className="config-hint">
          Lists are saved in this browser only. A backup file holds every list from every rule
          set — export it here, then import it on another computer to make that browser an exact
          copy.
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
              {pending.lists.length === 1 ? "" : "s"}. Importing it permanently removes the{" "}
              {lists.length} list{lists.length === 1 ? "" : "s"} saved in this browser and replaces
              them with the backup's.
            </p>
            <div className="confirm-actions">
              <button type="button" onClick={() => setPending(null)}>
                Cancel
              </button>
              <button type="button" className="danger-btn" autoFocus onClick={confirmImport}>
                Replace my lists
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
