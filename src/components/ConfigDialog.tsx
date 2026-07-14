import { useEffect } from "react";
import type { RuleSetInfo } from "../types";

interface ConfigDialogProps {
  ruleSets: RuleSetInfo[];
  activeRuleSet: string;
  onSelectRuleSet: (id: string) => void;
  simplifiedView: boolean;
  onToggleSimplifiedView: (value: boolean) => void;
  onClose: () => void;
}

/** App configuration: the active rule set (each set keeps its own saved
 * lists) and view preferences. */
export default function ConfigDialog({
  ruleSets,
  activeRuleSet,
  onSelectRuleSet,
  simplifiedView,
  onToggleSimplifiedView,
  onClose,
}: ConfigDialogProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

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
      </div>
    </div>
  );
}
