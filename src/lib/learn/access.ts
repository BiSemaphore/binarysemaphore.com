/**
 * Who may read a notebook.
 *
 * There is exactly one question in this file, `getAccess`, and everything else
 * in the product asks it: the library page, the notebook page, and the download
 * route. The database asks it too, independently, in the storage policy on the
 * `notebooks` bucket (see supabase/migrations/0003_learn.sql), so a bug here
 * cannot hand out a file.
 *
 * Today the only way to get access is a free trial. When payments land, a paid
 * grant is the same `entitlements` row with `source = 'stripe'` and a null
 * `expires_at`, written by the webhook. Nothing in this file changes.
 *
 * Server-only: imports the SSR Supabase client, which reads `next/headers`. The
 * pure state rules live in ./state.ts and can be imported anywhere.
 */
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { getCurrentUser } from "@/utils/supabase/auth";
import { toAccess, type Access, type EntitlementRow } from "@/lib/learn/state";

export { canRead, accessLabel, type Access } from "@/lib/learn/state";

/**
 * Development unlock.
 *
 * Working on the reading view means looking at the gated part constantly, and
 * signing in on every restart to do it is friction with no benefit.
 *
 * Two conditions, not one, because this is the paywall. `NODE_ENV` is
 * `production` for every Vercel build, so the flag alone can never take effect
 * there, and `LEARN_UNLOCK` lives in `.env.local`, which is git-ignored and
 * never deployed. Both have to be wrong at once for this to leak.
 *
 * It only affects what the app believes. The bucket's RLS policy is unchanged,
 * so PDF downloads still need a real entitlement even with this on.
 */
export function isDevUnlocked(): boolean {
  return (
    process.env.NODE_ENV !== "production" && process.env.LEARN_UNLOCK === "1"
  );
}

const COLUMNS = "product_id, status, source, expires_at";

/**
 * Every grant the current user holds, keyed by notebook slug. One query, so the
 * library page can render eight cards without eight round trips. RLS scopes the
 * select to this user; the query is not what makes it safe.
 */
export async function getAllAccess(): Promise<Map<string, Access>> {
  const result = new Map<string, Access>();
  if (!isSupabaseConfigured()) return result;

  const user = await getCurrentUser();
  if (!user) return result;

  const supabase = await createClient();
  const { data } = await supabase.from("entitlements").select(COLUMNS);

  for (const row of (data ?? []) as EntitlementRow[]) {
    result.set(row.product_id, toAccess(row));
  }
  return result;
}

/** Access to one notebook for the current user. */
export async function getAccess(productId: string): Promise<Access> {
  // Applied here so every caller agrees: the reader, the landing page and the
  // download route all ask this one question.
  if (isDevUnlocked()) {
    return { state: "active", expiresAt: null, source: "dev-unlock" };
  }

  if (!isSupabaseConfigured()) return { state: "anonymous" };

  const user = await getCurrentUser();
  if (!user) return { state: "anonymous" };

  const supabase = await createClient();
  const { data } = await supabase
    .from("entitlements")
    .select(COLUMNS)
    .eq("product_id", productId)
    .maybeSingle();

  return toAccess(data as EntitlementRow | null);
}

/**
 * Give the signed-in reader access to one notebook.
 *
 * Calls the security-definer function rather than inserting, so a client cannot
 * write its own row. Idempotent: a second call returns the existing grant.
 */
export async function grantAccess(productId: string): Promise<Access> {
  if (!isSupabaseConfigured()) return { state: "anonymous" };

  const user = await getCurrentUser();
  if (!user) return { state: "anonymous" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("grant_learn_access", {
    p_product_id: productId,
  });

  if (error) throw new Error(`Could not open the notebook: ${error.message}`);
  return toAccess(data as EntitlementRow | null);
}
