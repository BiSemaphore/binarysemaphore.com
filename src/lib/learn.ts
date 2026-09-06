/**
 * Study Notebooks (learn.binarysemaphore.com): the catalog, read from Postgres.
 *
 * This file held all ten notebooks as a literal, which meant the catalog had
 * two sources of truth: these objects and the `notebooks` table that the
 * entitlements foreign key and the storage policy point at. It is a reader now,
 * and the table is the catalog.
 *
 * The PDFs themselves are NOT in this repo and never were. They are built in
 * the `learnings` repo (`notebooks/build.sh`) and uploaded to the private
 * `notebooks` Storage bucket by `scripts/upload-notebooks.mjs`. The table
 * records what exists and what it is called; `src/lib/learn/access.ts` decides
 * who may read it.
 *
 * What stays here is configuration rather than content: the three editions and
 * the lecture series are properties of how we make notebooks, not rows an admin
 * would edit.
 */
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/utils/supabase/public";

/** The three cuts of every notebook. Same text, different page geometry. */
export type EditionId = "reading" | "print" | "tablet";

export type Edition = {
  id: EditionId;
  name: string;
  /** One line on who this cut is for, shown beside the download. */
  description: string;
};

/** Ordered as they are offered. Reading is the default download. */
export const editions: Edition[] = [
  {
    id: "reading",
    name: "Reading",
    description: "A4 portrait, no annotation margin. For reading on a screen.",
  },
  {
    id: "print",
    name: "Print",
    description:
      "A4 with a wide outer margin. Made to be printed and written on.",
  },
  {
    id: "tablet",
    name: "Tablet",
    description:
      "16:9 landscape, fills a tablet screen. Vector text, so note apps draw it rather than rasterise it.",
  },
];

/**
 * The lecture series most of these notebooks are built from.
 *
 * Credit is not optional here. Six of the nine notebooks expand a lecture from
 * this playlist, and a reader deserves to know whose work they are standing on
 * and to be able to go and watch it.
 *
 * Verified against the playlist itself, not the books' own prose: two books
 * cite the wrong video id in their text.
 */
export const lectureSeries = {
  author: "Sriniously",
  authorUrl: "https://www.youtube.com/@sriniously",
  playlist: "Backend from first principles",
  playlistUrl:
    "https://www.youtube.com/playlist?list=PLui3EUkuMTPgZcV0QhQrOcwMPcBCcd_Q1",
} as const;

/** One lecture a notebook is built from. */
export type SourceVideo = {
  title: string;
  url: string;
  /** "2h45", as the notebooks write durations. */
  duration: string;
};

export type EditionAsset = {
  /** File name inside the notebook's folder in the storage bucket. */
  file: string;
  /** Size in bytes, used for the "4.2 MB" label. */
  bytes: number;
};

export type Notebook = {
  /** URL slug, storage folder, and `notebooks.id`. All the same string. */
  slug: string;
  /** e.g. "System Design Notebook". */
  series: string;
  /** Two-digit number within its series. */
  number: string;
  title: string;
  /** The line under the title, from the book's own title block. */
  subtitle: string;
  /** Two or three sentences on what is in it. Shown on the card and the page. */
  blurb: string;
  /** Page count of the Reading edition. */
  pages: number;
  /** The full table of contents. Free to read: it is the best preview there is. */
  contents: string[];
  /** Which cuts exist. Not every notebook has all three. */
  assets: Partial<Record<EditionId, EditionAsset>>;
  /** The lectures this notebook expands. Empty when it was written from
   * scratch, which the page says rather than leaving the reader guessing. */
  sources: SourceVideo[];
};

type Row = {
  id: string;
  series: string | null;
  number: string | null;
  title: string;
  subtitle: string | null;
  blurb: string | null;
  pages: number;
  contents: string[];
  assets: Notebook["assets"];
  sources: SourceVideo[];
};

/**
 * The published catalog, in order.
 *
 * Tagged `notebooks` so the admin can invalidate it after a save. A draft
 * notebook is absent because the select policy says `status = 'published'`,
 * not because this filters.
 */
export const getNotebooks = unstable_cache(
  async (): Promise<Notebook[]> => {
    const { data, error } = await createPublicClient()
      .from("notebooks")
      .select(
        "id, series, number, title, subtitle, blurb, pages, contents, assets, sources",
      )
      .order("position");

    if (error) throw new Error(`Could not read the catalog: ${error.message}`);

    return ((data ?? []) as Row[]).map((n) => ({
      slug: n.id,
      series: n.series ?? "",
      number: n.number ?? "",
      title: n.title,
      subtitle: n.subtitle ?? "",
      blurb: n.blurb ?? "",
      pages: n.pages,
      contents: n.contents,
      assets: n.assets,
      sources: n.sources,
    }));
  },
  ["notebook-catalog"],
  { tags: ["notebooks"], revalidate: 3600 },
);

/** The notebook with this slug, or undefined. */
export async function getNotebook(
  slug: string,
): Promise<Notebook | undefined> {
  return (await getNotebooks()).find((n) => n.slug === slug);
}

/** Storage object key for one edition: `<slug>/<file>`. The first path segment
 * is the product id, which is what the bucket's RLS policy checks. */
export function objectKey(
  notebook: Notebook,
  edition: EditionId,
): string | null {
  const asset = notebook.assets[edition];
  return asset ? `${notebook.slug}/${asset.file}` : null;
}

/** "4.2 MB", for a download label. */
export function formatBytes(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

/** Total pages across the library, for the index page. */
export async function totalPages(): Promise<number> {
  return (await getNotebooks()).reduce((sum, n) => sum + n.pages, 0);
}

/** Total sections across the library, counted from the tables of contents. */
export async function totalSections(): Promise<number> {
  return (await getNotebooks()).reduce((sum, n) => sum + n.contents.length, 0);
}
