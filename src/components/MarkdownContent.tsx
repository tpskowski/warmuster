import type { ReactNode } from "react";

function inlineContent(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const links = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = links.exec(text)) != null) {
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));
    nodes.push(
      <a key={match.index} href={match[2]} target="_blank" rel="noreferrer">
        {match[1]}
      </a>,
    );
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
