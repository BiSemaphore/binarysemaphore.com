/**
 * Turn a notebook's markdown into HTML.
 *
 * Two things the site's MDX pipeline cannot do for us here: the content is read
 * at request time rather than imported, and it carries the books' four inline
 * highlighter marks, which are not markdown. So this is a small unified
 * pipeline with a pre-pass for the marks.
 *
 * The input is our own writing, committed to this repo and synced from the
 * `learnings` repo by `scripts/sync-notebooks.mjs`. It is trusted, which is why
 * raw HTML is allowed through. Never point this at anything a reader supplied.
 */
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeStringify from "rehype-stringify";

/**
 * The four highlighters, as they are written in the books:
 *
 *   ==peach==  the sentence to carry away
 *   !!rose!!   the wrong answer, the thing that bites
 *   ++mint++   the correct practice
 *   %%pink%%   a definition, at the point it is first defined
 *
 * Plus ((circle)), which the PDF draws as a hand-authored ellipse and which the
 * web renders as an outline.
 */
const MARKS: { pattern: RegExp; className: string }[] = [
  { pattern: /==([^=\n]+)==/g, className: "nb-mark nb-mark-peach" },
  { pattern: /!!([^!\n]+)!!/g, className: "nb-mark nb-mark-rose" },
  { pattern: /\+\+([^+\n]+)\+\+/g, className: "nb-mark nb-mark-mint" },
  { pattern: /%%([^%\n]+)%%/g, className: "nb-mark nb-mark-pink" },
  { pattern: /\(\(([^)\n]+)\)\)/g, className: "nb-circle" },
];

/** Segments of markdown that marks must not touch: fenced and inline code. */
const PROTECTED = /(```[\s\S]*?```|`[^`\n]+`)/g;

/** Rewrite the highlighter marks as spans, leaving code spans alone. */
export function applyMarks(markdown: string): string {
  return markdown
    .split(PROTECTED)
    .map((chunk, i) => {
      // Odd indices are the captured code segments.
      if (i % 2 === 1) return chunk;
      let out = chunk;
      for (const { pattern, className } of MARKS) {
        out = out.replace(pattern, `<span class="${className}">$1</span>`);
      }
      return out;
    })
    .join("");
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify, { allowDangerousHtml: true });

/** Markdown (with notebook marks) to an HTML string. */
export async function renderMarkdown(markdown: string): Promise<string> {
  const file = await processor.process(applyMarks(markdown));
  return String(file);
}
