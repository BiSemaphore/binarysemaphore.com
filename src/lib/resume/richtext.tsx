import type { ReactNode } from "react";

/**
 * Tiny, safe inline-markdown renderer for resume text fields.
 *
 * Supports: **bold**, *italic* / _italic_, ++underline++, [text](url), and
 * line-level lists ("- item" / "1. item"). It returns React nodes built from a
 * fixed set of elements (never raw HTML / dangerouslySetInnerHTML), so there is
 * no XSS surface, and it only emits inline-level nodes + <br>, so it slots into
 * the templates' existing <p>/<li> without producing invalid nesting.
 */

/** Allow only safe link targets; bare domains get https://. Else returns null. */
export function safeUrl(raw: string): string | null {
  const url = raw.trim();
  if (/^(https?:\/\/|mailto:)/i.test(url)) return url;
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(url)) return `https://${url}`;
  return null;
}

const PATTERNS: { re: RegExp; kind: "link" | "bold" | "u" | "em" }[] = [
  { re: /\[([^\]]+)\]\(([^)]+)\)/, kind: "link" },
  { re: /\*\*([^*]+?)\*\*/, kind: "bold" },
  { re: /__([^_]+?)__/, kind: "bold" },
  { re: /\+\+([^+]+?)\+\+/, kind: "u" },
  { re: /\*([^*]+?)\*/, kind: "em" },
  { re: /_([^_]+?)_/, kind: "em" },
];

/** Parse inline marks into React nodes (recurses for simple nesting). */
function parseInline(text: string, keyBase = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  let rest = text;
  let k = 0;

  while (rest.length > 0) {
    // Find the earliest-starting match across all patterns.
    let best: { index: number; m: RegExpMatchArray; kind: string } | null = null;
    for (const { re, kind } of PATTERNS) {
      const m = rest.match(re);
      if (m && m.index !== undefined) {
        if (!best || m.index < best.index) best = { index: m.index, m, kind };
      }
    }
    if (!best) {
      out.push(rest);
      break;
    }
    if (best.index > 0) out.push(rest.slice(0, best.index));
    const key = `${keyBase}-${k++}`;
    const full = best.m[0];

    if (best.kind === "link") {
      const href = safeUrl(best.m[2]);
      const label = best.m[1];
      if (href) {
        out.push(
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="hover:underline underline-offset-2"
          >
            {parseInline(label, key)}
          </a>,
        );
      } else {
        out.push(label);
      }
    } else if (best.kind === "bold") {
      out.push(<strong key={key}>{parseInline(best.m[1], key)}</strong>);
    } else if (best.kind === "u") {
      out.push(<u key={key}>{parseInline(best.m[1], key)}</u>);
    } else {
      out.push(<em key={key}>{parseInline(best.m[1], key)}</em>);
    }

    rest = rest.slice(best.index + full.length);
  }

  return out;
}

/**
 * Render a resume text value as inline React nodes. Lines starting with "- " /
 * "* " render as bullet lines (• ), "1." as numbered lines; lines are joined
 * with <br> so the result stays inline-safe.
 */
export function rich(text: string | undefined): ReactNode {
  const value = (text ?? "").replace(/\r\n?/g, "\n");
  if (!value.trim()) return null;
  const lines = value.split("\n");

  return lines.map((line, i) => {
    let prefix = "";
    let body = line;
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const ordered = line.match(/^\s*(\d+)\.\s+(.*)$/);
    if (bullet) {
      prefix = "• ";
      body = bullet[1];
    } else if (ordered) {
      prefix = `${ordered[1]}. `;
      body = ordered[2];
    }
    // Fold the list prefix into the parsed text (it has no markdown chars) so
    // the line is one text node rather than adjacent nodes.
    return (
      <span key={i}>
        {i > 0 ? <br /> : null}
        {parseInline(prefix + body, `l${i}`)}
      </span>
    );
  });
}

type Block =
  | { kind: "p"; lines: string[] }
  | { kind: "ul" | "ol"; items: string[] };

/**
 * Block-level renderer for multi-line fields (project descriptions, summary).
 * Unlike `rich()` (inline + <br>), this emits real paragraphs and lists with
 * hanging indents, so wrapped bullet text tucks under the bullet instead of the
 * margin. Recognizes "•", "-", "*" bullets and "1." / "1)" numbered lists; a
 * blank line starts a new paragraph. Wrap it in a styled container, not a <p>.
 */
export function richBlock(
  text: string | undefined,
  className?: string,
): ReactNode {
  const value = (text ?? "").replace(/\r\n?/g, "\n");
  if (!value.trim()) return null;

  const blocks: Block[] = [];
  let para: string[] = [];
  let list: { kind: "ul" | "ol"; items: string[] } | null = null;
  const flushPara = () => {
    if (para.length) blocks.push({ kind: "p", lines: para });
    para = [];
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };

  for (const line of value.split("\n")) {
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet) {
      flushPara();
      if (!list || list.kind !== "ul") {
        flushList();
        list = { kind: "ul", items: [] };
      }
      list.items.push(bullet[1]);
    } else if (ordered) {
      flushPara();
      if (!list || list.kind !== "ol") {
        flushList();
        list = { kind: "ol", items: [] };
      }
      list.items.push(ordered[1]);
    } else if (!line.trim()) {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara();
  flushList();

  const nodes = blocks.map((b, i) => {
    const spacing = i > 0 ? "mt-2" : undefined;
    if (b.kind === "p") {
      return (
        <p key={i} className={spacing}>
          {b.lines.map((ln, j) => (
            <span key={j}>
              {j > 0 ? <br /> : null}
              {parseInline(ln, `p${i}-${j}`)}
            </span>
          ))}
        </p>
      );
    }
    const listClass = `space-y-0.5 pl-5 ${
      b.kind === "ul" ? "list-disc" : "list-decimal"
    } ${spacing ?? ""}`.trim();
    const items = b.items.map((it, j) => (
      <li key={j}>{parseInline(it, `li${i}-${j}`)}</li>
    ));
    return b.kind === "ul" ? (
      <ul key={i} className={listClass}>
        {items}
      </ul>
    ) : (
      <ol key={i} className={listClass}>
        {items}
      </ol>
    );
  });

  return <div className={className}>{nodes}</div>;
}
