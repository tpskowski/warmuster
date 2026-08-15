import { useEffect, useState } from "react";
import type { ArmyData, SavedList } from "../types";
import { buildTextExport } from "../domain/export";
import { buildShareUrl } from "../domain/shareCode";
import type { PrintMode } from "./PrintView";

interface ExportDialogProps {
  list: SavedList;
  army: ArmyData;
  onClose: () => void;
  onPrint: (mode: PrintMode) => void;
}

export default function ExportDialog({ list, army, onClose, onPrint }: ExportDialogProps) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState<"sharable" | "discord" | null>(null);

  const text = buildTextExport(list, army);

  const copyShareLink = async (format: "sharable" | "discord") => {
    try {
      const url = await buildShareUrl(list);
      const listName = list.name.replace(/\s+/g, " ").trim();
      const label = `Warmuster - ${listName}`.replace(/([\\\[\]])/g, "\\$1");
      await navigator.clipboard.writeText(format === "discord" ? `[${label}](${url})` : url);
      setCopiedLink(format);
      setTimeout(() => setCopiedLink(null), 1500);
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
          <button
            type="button"
            className="primary-btn"
            aria-label="Copy sharable link"
            onClick={() => copyShareLink("sharable")}
          >
            {copiedLink === "sharable" ? "Link copied!" : "🔗 Copy sharable link"}
          </button>
          <button
            type="button"
            className="primary-btn"
            aria-label="Copy Discord link"
            onClick={() => copyShareLink("discord")}
          >
            {copiedLink === "discord" ? "Link copied!" : "🔗 Copy Discord link"}
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
