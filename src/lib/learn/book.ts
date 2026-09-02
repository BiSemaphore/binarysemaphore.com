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
  /** False when the whole section is free, so the page draws no gate. */
  gated: boolean;
  /** The opening of the gated half, already truncated at generation time. */
  teaser: string;
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
