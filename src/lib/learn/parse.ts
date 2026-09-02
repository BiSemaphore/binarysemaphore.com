/**
 * Parse a study notebook's markdown into parts, sections, and blocks.
 *
 * The books are not plain markdown. They use a small directive vocabulary,
 * documented in `learnings/notebooks/AUTHORING.md`, that the PDF typesetter
 * understands: `:::part`, `:::ask`, `:::signal`, `:::trap`, `:::do`, `:::key`,
 * `:::recall`, `:::quiz`, `:::redraw`, `:::term`, `:::figure`, plus four inline
 * highlighter marks. This turns that into a tree the site can render.
 *
 * Deliberately not a markdown parser: prose is left as raw markdown for the
 * renderer, and only the notebook-specific structure is resolved here.
 */

/** Directives that render as a titled annotation box. */
export const CALLOUTS = {
  ask: "Interviewer asks",
  signal: "Senior signal",
  trap: "Trap",
  do: "Do this",
  key: "Key idea",
  recall: "Recall",
  quiz: "Question",
  redraw: "Redraw it",
} as const;

export type CalloutKind = keyof typeof CALLOUTS;

export type Block =
  /** Raw markdown. The renderer handles the inline marks. */
  | { kind: "prose"; markdown: string }
  | { kind: "callout"; callout: CalloutKind; markdown: string }
  /** A glossed word, defined where it first appears. */
  | { kind: "term"; term: string; markdown: string }
  /** A drawn figure in the PDF. On the web it is the caption plus a note. */
  | { kind: "figure"; name: string; markdown: string }
  | { kind: "code"; language: string; code: string };

export type Section = {
  /** "12", or "A" for an appendix. Empty for an unnumbered section. */
  number: string;
  title: string;
  /** URL slug, e.g. "12-indexes-the-catalogue-the-tree-and-the-cost". */
  slug: string;
  /** Index into the book's `parts`, or -1 when it sits before any part. */
  part: number;
  blocks: Block[];
};

export type Part = {
  /** "III". Roman, as the books number them. */
  number: string;
  title: string;
  /** The part's own opening prose. */
  markdown: string;
};

export type Book = {
  series: string;
  number: string;
  title: string;
  subtitle: string;
  parts: Part[];
  sections: Section[];
};

/** "12. Indexes: the catalogue" -> "12-indexes-the-catalogue". */
export function sectionSlug(number: string, title: string): string {
  const base = `${number} ${title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base.slice(0, 80).replace(/-+$/, "");
}

/** Split a `:::name ...args\n body \n:::` block off the front of `lines`. */
function readDirective(
  lines: string[],
  start: number,
): { name: string; args: string; body: string; next: number } | null {
  const open = lines[start].match(/^:::([a-z]+)[ \t]*(.*)$/);
  if (!open) return null;

  const body: string[] = [];
  let i = start + 1;
  for (; i < lines.length; i += 1) {
    if (lines[i].trim() === ":::") break;
    body.push(lines[i]);
  }
  return {
    name: open[1],
    args: open[2].trim(),
    body: body.join("\n").trim(),
    next: i + 1,
  };
}

/** Flush accumulated prose lines into a block, dropping empty runs. */
function flush(buffer: string[], blocks: Block[]): void {
  const markdown = buffer.join("\n").trim();
  if (markdown) blocks.push({ kind: "prose", markdown });
  buffer.length = 0;
}

/**
 * Parse one book.
 *
 * Front matter (`:::title`), the generated contents (`:::toc`) and the glossary
 * index (`:::glossary`) are structural instructions to the typesetter, not
 * content, so they are consumed rather than rendered.
 */
export function parseBook(markdown: string): Book {
  const lines = markdown.split("\n");

  let series = "";
  let number = "";
  let title = "";
  let subtitle = "";

  const parts: Part[] = [];
  const sections: Section[] = [];

  let current: Section | null = null;
  let buffer: string[] = [];

  const closeSection = () => {
    if (!current) return;
    flush(buffer, current.blocks);
    sections.push(current);
    current = null;
  };

  for (let i = 0; i < lines.length; ) {
    const line = lines[i];

    // Fenced code has to win over everything: a `:::` inside a fence is text.
    const fence = line.match(/^```([a-zA-Z0-9]*)/);
    if (fence) {
      const code: string[] = [];
      let j = i + 1;
      for (; j < lines.length && !lines[j].startsWith("```"); j += 1) {
        code.push(lines[j]);
      }
      const block: Block = {
        kind: "code",
        language: fence[1] || "text",
        code: code.join("\n"),
      };
      if (current) {
        flush(buffer, current.blocks);
        current.blocks.push(block);
      }
      i = j + 1;
      continue;
    }

    if (line.startsWith(":::")) {
      const d = readDirective(lines, i);
      if (d) {
        if (d.name === "title") {
          const [seriesLine, t, s] = d.body.split("\n");
          const [seriesName, num] = seriesLine.split("/").map((x) => x.trim());
          series = seriesName ?? "";
          number = num ?? "";
          title = t ?? "";
          subtitle = s ?? "";
        } else if (d.name === "part") {
          closeSection();
          const [num, name] = d.args.split("|").map((x) => x.trim());
          parts.push({
            number: num ?? "",
            title: name ?? "",
            markdown: d.body,
          });
        } else if (d.name === "term") {
          const block: Block = {
            kind: "term",
            term: d.args,
            markdown: d.body,
          };
          if (current) {
            flush(buffer, current.blocks);
            current.blocks.push(block);
          }
        } else if (d.name === "figure") {
          const block: Block = {
            kind: "figure",
            name: d.args,
            markdown: d.body,
          };
          if (current) {
            flush(buffer, current.blocks);
            current.blocks.push(block);
          }
        } else if (d.name in CALLOUTS) {
          const block: Block = {
            kind: "callout",
            callout: d.name as CalloutKind,
            markdown: d.args ? `${d.args}\n\n${d.body}`.trim() : d.body,
          };
          if (current) {
            flush(buffer, current.blocks);
            current.blocks.push(block);
          }
        }
        // toc / glossary and anything unknown: consumed, not rendered.
        i = d.next;
        continue;
      }
    }

    const heading = line.match(/^## +(?:(\d+|[A-Z])\.\s*)?(.+)$/);
    if (heading) {
      closeSection();
      const num = heading[1] ?? "";
      const name = heading[2].trim();
      current = {
        number: num,
        title: name,
        slug: sectionSlug(num, name),
        part: parts.length - 1,
        blocks: [],
      };
      buffer = [];
      i += 1;
      continue;
    }

    if (current) buffer.push(line);
    i += 1;
  }

  closeSection();

  return { series, number, title, subtitle, parts, sections };
}
