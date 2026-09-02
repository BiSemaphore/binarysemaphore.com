/**
 * The section index for a notebook.
 *
 * `scripts/sync-notebooks.mjs` generates one MDX file per section plus an
 * `index.json` per notebook holding the ordered list. The pages read that index
 * for the contents list and for prev/next; the prose itself is imported as MDX,
 * the same way a thread is.
 *
 * Server-only: reads the filesystem.
 */
import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import { getNotebook } from "@/lib/learn";

const DIR = path.join(process.cwd(), "src/content/notebooks");

export type SectionEntry = {
  slug: string;
  /** "12", or "A" for an appendix. Empty when the section is unnumbered. */
  number: string;
  title: string;
  /** Roman part number, as the books number them. Empty when outside a part. */
  part: string;
  partTitle: string;
  /** Prose length in characters, used to find where the free part ends. */
  length: number;
};

/** Every section of a notebook, in reading order. */
export const getSections = cache((slug: string): SectionEntry[] => {
  if (!getNotebook(slug)) return [];

  const file = path.join(DIR, slug, "index.json");
  if (!fs.existsSync(file)) return [];

  return JSON.parse(fs.readFileSync(file, "utf8")) as SectionEntry[];
});

export type SectionContext = {
  section: SectionEntry;
  previous: SectionEntry | null;
  next: SectionEntry | null;
  /** 1-based position, for "14 of 51". */
  position: number;
  total: number;
};

/** One section plus what the page needs around it. */
export function getSection(
  slug: string,
  sectionSlug: string,
): SectionContext | null {
  const sections = getSections(slug);
  const index = sections.findIndex((s) => s.slug === sectionSlug);
  if (index === -1) return null;

  return {
    section: sections[index],
    previous: sections[index - 1] ?? null,
    next: sections[index + 1] ?? null,
    position: index + 1,
    total: sections.length,
  };
}

/**
 * How much of a book a signed-out reader gets.
 *
 * A share of the book's prose rather than a section count, because sections run
 * from a few hundred to several thousand characters. Enough to judge whether the
 * writing is worth an account, not enough to be the book.
 */
const FREE_SHARE = 0.15;

/** At least this many sections, however long they are. */
const MIN_FREE = 2;

/**
 * Split a book's sections into what a signed-out reader may read and what sits
 * behind the gate.
 *
 * Whole sections, in order. The gated ones are never imported by the reader, so
 * they are not in the page at all: there is nothing hidden to reveal.
 */
export function splitBook(sections: SectionEntry[]): {
  free: SectionEntry[];
  gated: SectionEntry[];
} {
  if (sections.length <= 1) return { free: sections, gated: [] };

  const budget = sections.reduce((n, s) => n + s.length, 0) * FREE_SHARE;

  let spent = 0;
  let cut = 0;
  for (const [i, section] of sections.entries()) {
    if (cut >= MIN_FREE && spent + section.length > budget) break;
    spent += section.length;
    cut = i + 1;
  }

  // Always show something, and always hold something back.
  cut = Math.min(Math.max(cut, MIN_FREE), sections.length - 1);

  return { free: sections.slice(0, cut), gated: sections.slice(cut) };
}
