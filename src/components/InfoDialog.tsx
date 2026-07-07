import { useEffect } from "react";
import changelog from "../content/info/changelog.md?raw";
import credits from "../content/info/credits.md?raw";
import privacy from "../content/info/privacy.md?raw";
import roadmap from "../content/info/roadmap.md?raw";
import MarkdownContent from "./MarkdownContent";

export type InfoTopic = "privacy" | "changelog" | "roadmap" | "credits";

export const FEEDBACK_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdWJyFSI0gss_xQt4JmjLR_xswRuI3G8MvM1li24pAsES2B2w/viewform";

const CONTENT: Record<InfoTopic, { title: string; source: string }> = {
  privacy: { title: "Privacy", source: privacy },
  changelog: { title: "Changelog", source: changelog },
  roadmap: { title: "Roadmap", source: roadmap },
  credits: { title: "Credits", source: credits },
};

export default function InfoDialog({ topic, onClose }: { topic: InfoTopic; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const { title, source } = CONTENT[topic];
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} title="Close">
            x
          </button>
        </div>
        <div className="info-body">
          <MarkdownContent source={source} />
        </div>
      </div>
    </div>
  );
}