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

export {
  TRIAL_DAYS,
  canRead,
  daysLeft,
  accessLabel,
  type Access,
} from "@/lib/learn/state";

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
 * Start the free trial for one notebook.
 *
 * Calls the security-definer function rather than inserting, so the expiry is
 * computed in Postgres. It is idempotent and non-renewable: a second call
 * returns the existing row, including an expired one, so a lapsed trial cannot
 * be restarted by clicking the button again.
 */
export async function startTrial(productId: string): Promise<Access> {
  if (!isSupabaseConfigured()) return { state: "anonymous" };

  const user = await getCurrentUser();
  if (!user) return { state: "anonymous" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("start_learn_trial", {
    p_product_id: productId,
  });

  if (error) throw new Error(`Could not start the trial: ${error.message}`);
  return toAccess(data as EntitlementRow | null);
}
