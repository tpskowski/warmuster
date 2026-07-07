import { useEffect, useState } from "react";
import type { ArmyData, SavedList } from "../types";
import { buildTextExport } from "../domain/export";
import { buildShareUrl } from "../domain/shareCode";

interface ExportDialogProps {
  list: SavedList;
  army: ArmyData;
  onClose: () => void;
  onPrint: (mode: "list" | "cards") => void;
}

export default function ExportDialog({ list, army, onClose, onPrint }: ExportDialogProps) {
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const text = buildTextExport(list, army);

  const copyShareLink = async () => {
    try {
      const url = await buildShareUrl(list);
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1500);
    } catch {
      // Clipboard unavailable.
    }
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable; the user can still select the text manually.
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-label="Print and export" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>Print &amp; export</h2>
          <button type="button" className="icon-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>
        <div className="export-actions">
          <button type="button" className="primary-btn" onClick={() => onPrint("list")}>
            🖨 Print full list
          </button>
          <button type="button" className="primary-btn" onClick={() => onPrint("cards")}>
            🖨 Print unit cards
          </button>
          <button type="button" className="primary-btn" onClick={copyShareLink}>
            {shareCopied ? "Link copied!" : "🔗 Copy share link"}
          </button>
        </div>
        <h3 className="panel-heading">Text for Discord &amp; co.</h3>
        <textarea className="export-text" readOnly value={text} rows={14} onFocus={(e) => e.target.select()} />
        <button type="button" className="primary-btn" onClick={copy}>
          {copied ? "Copied!" : "Copy to clipboard"}
        </button>
      </div>
    </div>
  );
}
