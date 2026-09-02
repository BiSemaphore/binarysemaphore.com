/**
 * Reading progress: what a reader has opened, and where to put them back.
 *
 * Stored in Postgres rather than the browser, so it follows the reader between
 * devices and matches the rest of the model: the reading belongs to someone.
 * Unlike entitlements, a reader writes their own rows; see the policies in
 * supabase/migrations/0006_reading_progress.sql for why that is safe.
 *
 * Server-only: uses the SSR Supabase client.
 */
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { getCurrentUser } from "@/utils/supabase/auth";

export type Progress = {
  /** Section slugs the reader has opened. */
  read: Set<string>;
  /** The section to continue from, or null if they have not started. */
  resume: string | null;
};

const EMPTY: Progress = { read: new Set(), resume: null };

type Row = { product_id: string; section: string; read_at: string };

/** Newest first, so the first row for a book is where to resume. */
const COLUMNS = "product_id, section, read_at";

/** Progress in one notebook. */
export async function getProgress(productId: string): Promise<Progress> {
  if (!isSupabaseConfigured()) return EMPTY;

  const user = await getCurrentUser();
  if (!user) return EMPTY;

  const supabase = await createClient();
  const { data } = await supabase
    .from("reading_progress")
    .select(COLUMNS)
    .eq("product_id", productId)
    .order("read_at", { ascending: false });

  const rows = (data ?? []) as Row[];
  return {
    read: new Set(rows.map((r) => r.section)),
    resume: rows[0]?.section ?? null,
  };
}

/**
 * Progress in every notebook at once, for the library index. One query, so nine
 * notebooks do not cost nine round trips.
 */
export async function getAllProgress(): Promise<Map<string, Progress>> {
  const result = new Map<string, Progress>();
  if (!isSupabaseConfigured()) return result;

  const user = await getCurrentUser();
  if (!user) return result;

  const supabase = await createClient();
  const { data } = await supabase
    .from("reading_progress")
    .select(COLUMNS)
    .order("read_at", { ascending: false });

  for (const row of (data ?? []) as Row[]) {
    const current = result.get(row.product_id);
    if (current) current.read.add(row.section);
    // Rows arrive newest first, so the first one seen is the resume point.
    else result.set(row.product_id, { read: new Set([row.section]), resume: row.section });
  }
  return result;
}

/**
 * Record that a section was opened.
 *
 * Upsert rather than insert: re-reading a section should move the bookmark, not
 * fail on the primary key. Returns quietly on failure, because losing a
 * bookmark must never break the page someone is trying to read.
 */
export async function markRead(
  productId: string,
  section: string,
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  await supabase.from("reading_progress").upsert(
    {
      user_id: user.id,
      product_id: productId,
      section,
      read_at: new Date().toISOString(),
    },
    { onConflict: "user_id,product_id,section" },
  );
}

/** "12 of 55", and the percentage, for a progress bar. */
export function summarise(read: Set<string>, total: number) {
  const count = read.size;
  return {
    count,
    total,
    percent: total === 0 ? 0 : Math.round((count / total) * 100),
    complete: total > 0 && count >= total,
  };
}
