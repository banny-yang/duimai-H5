import { Fragment, type ReactNode } from "react";

/** 行内：**粗体**、*斜体*、`代码` */
function parseInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    const token = match[0];
    const k = `${keyPrefix}-i${i++}`;
    if (token.startsWith("**")) {
      nodes.push(
        <strong key={k} className="font-bold text-primary-dark">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("`")) {
      nodes.push(
        <code
          key={k}
          className="rounded bg-slate-100 px-1 py-0.5 text-[13px] font-mono text-ink"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      nodes.push(
        <em key={k} className="italic text-ink/90">
          {token.slice(1, -1)}
        </em>,
      );
    }
    last = match.index + token.length;
  }

  if (last < text.length) {
    nodes.push(text.slice(last));
  }
  return nodes.length ? nodes : [text];
}

function ListBlock({ lines, ordered, keyPrefix }: { lines: string[]; ordered: boolean; keyPrefix: string }) {
  const Tag = ordered ? "ol" : "ul";
  const listClass = ordered
    ? "list-decimal pl-5 space-y-1 my-2"
    : "list-disc pl-5 space-y-1 my-2";
  return (
    <Tag className={listClass}>
      {lines.map((line, idx) => (
        <li key={`${keyPrefix}-li-${idx}`} className="leading-relaxed">
          {parseInline(line, `${keyPrefix}-li-${idx}`)}
        </li>
      ))}
    </Tag>
  );
}

type Block =
  | { type: "p"; lines: string[] }
  | { type: "ul"; lines: string[] }
  | { type: "ol"; lines: string[] };

function parseBlocks(text: string): Block[] {
  const raw = text.replace(/\r\n/g, "\n").trim();
  if (!raw) return [];

  const paragraphs = raw.split(/\n{2,}/);
  const blocks: Block[] = [];

  for (const para of paragraphs) {
    const lines = para.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    const allBullet = lines.every((l) => /^[-*]\s+/.test(l));
    const allOrdered = lines.every((l) => /^\d+\.\s+/.test(l));

    if (allBullet && lines.length > 0) {
      blocks.push({
        type: "ul",
        lines: lines.map((l) => l.replace(/^[-*]\s+/, "")),
      });
    } else if (allOrdered && lines.length > 0) {
      blocks.push({
        type: "ol",
        lines: lines.map((l) => l.replace(/^\d+\.\s+/, "")),
      });
    } else {
      blocks.push({ type: "p", lines });
    }
  }

  return blocks;
}

interface FormattedChatTextProps {
  text: string;
  className?: string;
}

/** AI 回复 Markdown 轻量渲染（粗体、列表、换行） */
export function FormattedChatText({ text, className = "" }: FormattedChatTextProps) {
  const blocks = parseBlocks(text);

  if (!blocks.length) {
    return null;
  }

  return (
    <div className={`chat-md space-y-0 ${className}`.trim()}>
      {blocks.map((block, bi) => {
        const key = `b-${bi}`;
        if (block.type === "ul") {
          return <ListBlock key={key} lines={block.lines} ordered={false} keyPrefix={key} />;
        }
        if (block.type === "ol") {
          return <ListBlock key={key} lines={block.lines} ordered keyPrefix={key} />;
        }
        return (
          <p key={key} className="mb-2 last:mb-0 leading-relaxed">
            {block.lines.map((line, li) => (
              <Fragment key={`${key}-l-${li}`}>
                {li > 0 && <br />}
                {parseInline(line, `${key}-l-${li}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
