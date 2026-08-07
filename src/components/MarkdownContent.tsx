import type { ReactNode } from "react";

// Inline spans, tried in this order at each position: link, bold, italic,
// code. Bold comes before italic so `**` isn't read as an empty italic. Only
// `*` marks italic — a lone `_` is left alone so identifiers like unit_id
// survive. Markers may not be padded with whitespace (Markdown's flanking
// rule), which keeps prose like "2 * 3 and 4 * 5" from turning italic. Code
// spans match last but their content is taken literally.
const INLINE_PATTERN =
  /\[([^\]]+)\]\((https?:\/\/[^)]+)\)|(\*\*\*|___)(?!\s)([\s\S]+?)(?<!\s)\3|(\*\*|__)(?!\s)([\s\S]+?)(?<!\s)\5|(?<!\*)\*(?![\s*])([\s\S]+?)(?<![\s*])\*(?!\*)|`([^`]+)`/;

function inlineContent(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  // Fresh matcher per call: emphasis recurses, and a shared /g regex would
  // have its lastIndex clobbered by the inner scan.
  const inline = new RegExp(INLINE_PATTERN, "g");

  while ((match = inline.exec(text)) != null) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    const key = match.index;
    if (match[1] != null) {
      nodes.push(
        <a key={key} href={match[2]} target="_blank" rel="noreferrer">
          {match[1]}
        </a>,
      );
    } else if (match[4] != null) {
      nodes.push(
        <strong key={key}>
          <em>{inlineContent(match[4])}</em>
        </strong>,
      );
    } else if (match[6] != null) {
      // Emphasis can wrap other inline markup, so recurse into its content.
      nodes.push(<strong key={key}>{inlineContent(match[6])}</strong>);
    } else if (match[7] != null) {
      nodes.push(<em key={key}>{inlineContent(match[7])}</em>);
    } else {
      nodes.push(<code key={key}>{match[8]}</code>);
    }
    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

export default function MarkdownContent({ source }: { source: string }) {
  const lines = source.trim().split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }

    if (/^#{2,4}\s/.test(line)) {
      blocks.push(<h3 key={index}>{inlineContent(line.replace(/^#{2,4}\s+/, ""))}</h3>);
      index += 1;
      continue;
    }

    if (line.startsWith("- ")) {
      const items: ReactNode[] = [];
      const listIndex = index;
      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(<li key={index}>{inlineContent(lines[index].trim().slice(2))}</li>);
        index += 1;
      }
      blocks.push(<ul key={listIndex}>{items}</ul>);
      continue;
    }

    const paragraphIndex = index;
    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^#{2,4}\s/.test(lines[index].trim()) &&
      !lines[index].trim().startsWith("- ")
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(<p key={paragraphIndex}>{inlineContent(paragraph.join(" "))}</p>);
  }

  return <div className="markdown-content">{blocks}</div>;
}
