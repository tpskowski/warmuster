import { useMemo, useState } from "react";
import type { RuleSetInfo, SavedList } from "../types";
import { FEEDBACK_URL, type InfoTopic } from "./InfoDialog";
import { ExportIcon, MoonIcon, SunIcon } from "./Icons";

interface ListRailProps {
  ruleSets: RuleSetInfo[];
  lists: SavedList[];
  activeListId: string | null;
  onSelect: (id: string) => void;
  onCreate: (ruleSetId: string, armyId: string, name: string, pointsLimit: number) => void;
  onDelete: (id: string) => void;
  onInfo: (topic: InfoTopic) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onHome: () => void;
  onExport: () => void;
  canExport: boolean;
}

export function armyDisplayName(list: SavedList, ruleSets: RuleSetInfo[]): string {
  const army = ruleSets
    .find((ruleSet) => ruleSet.id === list.ruleSet)
    ?.armies.find((candidate) => candidate.army === list.army);
  if (army) return army.name;
  return list.army
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
export default function ListRail({
  ruleSets,
  lists,
  activeListId,
  onSelect,
  onCreate,
  onDelete,
  onInfo,
  theme,
  onToggleTheme,
  onHome,
  onExport,
  canExport,
}: ListRailProps) {
  const [creating, setCreating] = useState(false);
  const [ruleSetId, setRuleSetId] = useState(ruleSets[0]?.id ?? "");
  const [armyId, setArmyId] = useState("");
  const [pointsLimit, setPointsLimit] = useState(2000);

  const ruleSet = ruleSets.find((rs) => rs.id === ruleSetId) ?? ruleSets[0];
  const [pendingDelete, setPendingDelete] = useState<SavedList | null>(null);
  const armies = useMemo(
    () => [...(ruleSet?.armies ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [ruleSet],
  );

  const selectRuleSet = (nextRuleSetId: string) => {
    setRuleSetId(nextRuleSetId);
    const nextRuleSet = ruleSets.find((rs) => rs.id === nextRuleSetId);
    const firstArmy = [...(nextRuleSet?.armies ?? [])].sort((a, b) => a.name.localeCompare(b.name))[0];
    setArmyId(firstArmy?.army ?? "");
  };

  const create = () => {
    if (!ruleSet || !armyId) return;
    const armyName = ruleSet.armies.find((a) => a.army === armyId)?.name ?? armyId;
    onCreate(ruleSet.id, armyId, `${armyName} ${pointsLimit}`, pointsLimit);
    setCreating(false);
    setArmyId("");
  };

  return (
    <nav className="list-rail" aria-label="Saved army lists">
      <div className="rail-scroll">
        <div className="rail-brand-row">
          <button type="button" className="app-title" onClick={onHome}>Warmuster</button>
          <button
            type="button"
            className="toolbar-icon-btn"
            onClick={onExport}
            disabled={!canExport}
            aria-label="Export current list"
            title="Export current list"
          >
            <ExportIcon />
          </button>
        </div>
        <ul className="rail-lists">

          {lists.map((list) => (
            <li key={list.id} className={list.id === activeListId ? "active" : ""}>
              <button type="button" className="rail-list-btn" onClick={() => onSelect(list.id)}>
                <span className="rail-list-name">{list.name}</span>
                <span className="rail-list-meta">
                  {armyDisplayName(list, ruleSets)} / {list.pointsLimit} pts
                </span>
              </button>
              <button
                type="button"
                className="icon-btn rail-delete"
                title={`Delete ${list.name}`}
                onClick={() => setPendingDelete(list)}
                aria-label={`Delete ${list.name}`}
              >
                x
              </button>
            </li>
          ))}
        </ul>
        {creating ? (
          <div className="rail-create">
            {ruleSets.length > 1 && (
              <select value={ruleSetId} onChange={(e) => selectRuleSet(e.target.value)} aria-label="Rule set">
                {ruleSets.map((rs) => (
                  <option key={rs.id} value={rs.id}>
                    {rs.name}
                  </option>
                ))}
              </select>
            )}
            <select value={armyId} onChange={(e) => setArmyId(e.target.value)} aria-label="Army">
              <option value="">Choose an army...</option>
              {armies.map((army) => (
                <option key={army.army} value={army.army}>
                  {army.name}
                </option>
              ))}
            </select>
            <select
              value={pointsLimit}
              onChange={(e) => setPointsLimit(Number(e.target.value))}
              aria-label="Points"
            >
              {[500, 1000, 1500, 2000, 2500, 3000].map((pts) => (
                <option key={pts} value={pts}>
                  {pts} pts
                </option>
              ))}
            </select>
            <div className="rail-create-actions">
              <button type="button" className="primary-btn" onClick={create} disabled={!armyId}>
                Create
              </button>
              <button type="button" onClick={() => setCreating(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="primary-btn rail-new"
            onClick={() => {
              setCreating(true);
              setArmyId(armies[0]?.army ?? "");
            }}
          >
            New list
          </button>
        )}
      </div>
      <footer className="rail-footer">
        <div className="rail-footer-row">
          <button type="button" onClick={() => onInfo("privacy")}>
            Privacy
          </button>
          <button type="button" onClick={() => onInfo("changelog")}>
            Changelog
          </button>
          <button type="button" onClick={() => onInfo("roadmap")}>
            Roadmap
          </button>
        </div>
        <div className="rail-footer-row">
          <button type="button" onClick={() => onInfo("credits")}>
            Credits
          </button>
          <a href={FEEDBACK_URL} target="_blank" rel="noreferrer" aria-label="Feedback, opens external form">
            Feedback {"->"}
          </a>
          <button
            type="button"
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </footer>
      {pendingDelete && (
        <div className="modal-backdrop" onClick={() => setPendingDelete(null)}>
          <div
            className="modal confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-list-title"
            aria-describedby="delete-list-description"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-head">
              <h2 id="delete-list-title">Delete list?</h2>
            </div>
            <p id="delete-list-description">
              <strong>{pendingDelete.name}</strong> will be permanently removed from this browser.
            </p>
            <div className="confirm-actions">
              <button type="button" onClick={() => setPendingDelete(null)}>Cancel</button>
              <button
                type="button"
                className="danger-btn"
                autoFocus
                onClick={() => {
                  onDelete(pendingDelete.id);
                  setPendingDelete(null);
                }}
              >
                Delete list
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
