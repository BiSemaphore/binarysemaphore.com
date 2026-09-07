import { createPublicClient } from "@/utils/supabase/public";

/**
 * No cache layer, deliberately.
 *
 * These reads were wrapped in `unstable_cache` with a `threads` / `topics` tag
 * and a 3600s revalidate, and the admin called `revalidateTag` after every
 * save. That never worked. Measured, not assumed: warm the page, change the row
 * in Postgres, call `revalidateTag(tag)`, `revalidateTag(tag, "max")` and
 * `revalidatePath()` in turn, restart the server so nothing is left in memory,
 * and the page still serves the old value from `.next/cache` while the database
 * holds the new one.
 *
 * So the site was showing content up to an hour stale after an edit, and the
 * editor was telling the writer the cache had been cleared. A wrong answer
 * served quickly is worse than a right answer served in 50ms, which is what a
 * Supabase select costs here.
 *
 * Caching comes back when invalidation is demonstrated, not before, and the
 * candidate is `cacheComponents` with `use cache` / `cacheTag` / `updateTag`,
 * which is the model Next 16 actually documents revalidation against.
 */

/**
 * Threads, read from Postgres.
 *
 * These were MDX files parsed with gray-matter until the schema rebuild. They
 * are rows now, so that a thread can be written and corrected without a deploy
 * (see docs/database.md). The MDX pipeline is unchanged; only where the source
 * text comes from moved.
 *
 * Everything here is async where it used to be synchronous, which is the whole
 * cost of the move and is worth naming rather than hiding behind a cache.
 *
 * Drafts are invisible here, not by a filter but because the select policy on
 * `documents` is `status = 'published'`. The database decides; this file just
 * asks.
 */

export type ThreadMeta = {
  slug: string;
  title: string;
  description: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  tags: string[];
  readingMinutes: number;
};

type Row = {
  slug: string;
  title: string;
  summary: string | null;
  published_at: string | null;
  reading_minutes: number;
  thread_meta: { tags: string[] } | { tags: string[] }[] | null;
};

/** Never names body_mdx: Postgres stores it out of line, so a listing that
 *  leaves it out does not pay for it. reading_minutes is generated from it. */
const LIST = "slug, title, summary, published_at, reading_minutes, thread_meta(tags)";

function toMeta(row: Row): ThreadMeta {
  // PostgREST returns a to-one embed as an object, but the generated types
  // cannot always tell one from many, so both shapes are handled.
  const meta = Array.isArray(row.thread_meta) ? row.thread_meta[0] : row.thread_meta;

  return {
    slug: row.slug,
    title: row.title,
    description: row.summary ?? "",
    date: (row.published_at ?? "").slice(0, 10),
    tags: meta?.tags ?? [],
    readingMinutes: row.reading_minutes,
  };
}

/** All published threads, newest first. */
export async function getAllThreads(): Promise<ThreadMeta[]> {
  const { data, error } = await createPublicClient()
    .from("documents")
    .select(LIST)
    .eq("collection", "thread")
    .order("published_at", { ascending: false });

  if (error) throw new Error(`Could not read threads: ${error.message}`);
  return (data as unknown as Row[]).map(toMeta);
}

export async function getThread(slug: string): Promise<ThreadMeta | undefined> {
  return (await getAllThreads()).find((t) => t.slug === slug);
}

/**
 * The MDX source of one thread.
 *
 * Separate from the metadata on purpose, so that listing eight threads does not
 * fetch eight bodies. Cached under its own key, invalidated by the same tag.
 */
export async function getThreadBody(slug: string): Promise<string | null> {
  const { data } = await createPublicClient()
    .from("documents")
    .select("body_mdx")
    .eq("collection", "thread")
    .eq("slug", slug)
    .maybeSingle();

  return data?.body_mdx ?? null;
}

/** All tags used across threads, de-duplicated and alphabetically sorted. */
export async function getAllTags(): Promise<string[]> {
  const tags = new Set<string>();
  for (const t of await getAllThreads()) for (const tag of t.tags) tags.add(tag);
  return [...tags].sort();
}

/**
 * Threads most related to `slug` by number of shared tags, with newer posts
 * winning ties. Returns at most `limit`.
 *
 * Pure, and exported separately from the query that feeds it, for the same
 * reason `state.ts` is split from `access.ts`: the ranking is a rule worth
 * testing and the query is I/O that is not. Reading it no longer touches the
 * filesystem, so a unit test cannot exercise the whole path any more.
 */
export function rankRelated(
  all: ThreadMeta[],
  slug: string,
  limit = 3,
): ThreadMeta[] {
  const current = all.find((t) => t.slug === slug);
  if (!current) return [];
  const currentTags = new Set(current.tags);

  return all
    .filter((t) => t.slug !== slug)
    .map((t) => ({
      thread: t,
      shared: t.tags.filter((tag) => currentTags.has(tag)).length,
    }))
    .filter((x) => x.shared > 0)
    .sort(
      (a, b) => b.shared - a.shared || (a.thread.date < b.thread.date ? 1 : -1),
    )
    .slice(0, limit)
    .map((x) => x.thread);
}

export async function getRelatedThreads(
  slug: string,
  limit = 3,
): Promise<ThreadMeta[]> {
  return rankRelated(await getAllThreads(), slug, limit);
}

/** Human-readable date, e.g. "16 Jun 2026". Pure, so it stays synchronous. */
export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
