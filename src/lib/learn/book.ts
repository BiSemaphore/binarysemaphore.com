/**
 * Reading a parsed notebook off disk.
 *
 * The markdown lives in `src/content/notebooks/`, synced from the `learnings`
 * repo by `scripts/sync-notebooks.mjs`. Parsing a 120KB book is cheap but not
 * free, and a section page needs the whole book to work out its neighbours, so
 * the result is cached per request with React `cache`.
 *
 * Server-only: reads the filesystem.
 */
import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import { parseBook, type Book, type Section } from "@/lib/learn/parse";
import { getNotebook } from "@/lib/learn";

const DIR = path.join(process.cwd(), "src/content/notebooks");

/** The parsed book for a notebook slug, or null when there is no such book. */
export const getBook = cache((slug: string): Book | null => {
  if (!getNotebook(slug)) return null;

  const file = path.join(DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;

  return parseBook(fs.readFileSync(file, "utf8"));
});

export type SectionContext = {
  book: Book;
  section: Section;
  /** The part this section sits under, if any. */
  part: { number: string; title: string } | null;
  previous: Section | null;
  next: Section | null;
  /** 1-based position in the book, for "3 of 51". */
  position: number;
  total: number;
};

/** One section plus everything the page needs around it. */
export function getSection(
  slug: string,
  sectionSlug: string,
): SectionContext | null {
  const book = getBook(slug);
  if (!book) return null;

  const index = book.sections.findIndex((s) => s.slug === sectionSlug);
  if (index === -1) return null;

  const section = book.sections[index];

  return {
    book,
    section,
    part: section.part >= 0 ? (book.parts[section.part] ?? null) : null,
    previous: book.sections[index - 1] ?? null,
    next: book.sections[index + 1] ?? null,
    position: index + 1,
    total: book.sections.length,
  };
}

/** The first section of a book, which is where "start reading" goes. */
export function firstSection(slug: string): Section | null {
  return getBook(slug)?.sections[0] ?? null;
}

/**
 * How much of a section a signed-out reader sees.
 *
 * A share of the prose, not a fixed number of blocks: sections run from a few
 * hundred characters to several thousand, and a fixed count gives away a short
 * section entirely while barely opening a long one.
 */
const FREE_SHARE = 0.35;

/** However short the section, at least one prose block is always gated. */
export function splitAtGate(section: Section): {
  preview: Section["blocks"];
  gated: Section["blocks"];
} {
  const proseLength = (b: Section["blocks"][number]) =>
    b.kind === "prose" ? b.markdown.length : 0;

  const total = section.blocks.reduce((n, b) => n + proseLength(b), 0);
  const budget = total * FREE_SHARE;

  let spent = 0;
  let cut = 0;

  for (const [i, block] of section.blocks.entries()) {
    if (spent > 0 && spent + proseLength(block) > budget) break;
    spent += proseLength(block);
    cut = i + 1;
  }

  // Always show something, and always hold something back.
  if (cut === 0) cut = 1;
  if (cut >= section.blocks.length) cut = Math.max(1, section.blocks.length - 1);

  const preview = section.blocks.slice(0, cut);
  const gated = section.blocks.slice(cut);

  // A section that is one block long cannot be split between blocks, so split
  // inside it, at a paragraph break. Without this the whole thing is free.
  if (gated.length === 0 && preview.length === 1) {
    const only = preview[0];
    if (only.kind === "prose") {
      const paragraphs = only.markdown.split(/\n{2,}/);
      if (paragraphs.length > 1) {
        const keep = Math.max(1, Math.floor(paragraphs.length * FREE_SHARE));
        return {
          preview: [
            { kind: "prose", markdown: paragraphs.slice(0, keep).join("\n\n") },
          ],
          gated: [
            { kind: "prose", markdown: paragraphs.slice(keep).join("\n\n") },
          ],
        };
      }
    }
  }

  return { preview, gated };
}

/** How many characters of the next block to fade out under the gate. */
const TEASER_CHARS = 180;

/**
 * The first line or two of what comes next, truncated **on the server**.
 *
 * The point of the gate is that the rest of the section is not in the page.
 * Rendering a whole block and hiding it with CSS would ship it to anyone who
 * opens view-source, which is the paywall mistake worth avoiding. So the teaser
 * is cut down to a snippet before it is ever sent.
 */
export function teaser(gated: Section["blocks"]): string | null {
  const first = gated.find((b) => b.kind === "prose");
  if (!first || first.kind !== "prose") return null;

  const text = first.markdown.trim();
  if (text.length <= TEASER_CHARS) return text;

  const cut = text.slice(0, TEASER_CHARS);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trim();
}
