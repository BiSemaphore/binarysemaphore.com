/**
 * Note requests: which topics readers have asked us to write up.
 *
 * 86 of the 93 channels have nothing of ours behind them. This is how we find
 * out which to write next from the people who actually want them, rather than
 * guessing.
 *
 * The reader writes their own row directly, as with `reading_progress`. RLS is
 * the boundary: every policy is restricted to `auth.uid() = user_id` and bounds
 * both text fields, so a request cannot be filed as somebody else and the table
 * cannot be used as free storage.
 *
 * Server-only: uses the SSR Supabase client.
 */
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { getCurrentUser } from "@/utils/supabase/auth";

export const MAX_NOTE = 500;

/** Topic slugs the signed-in reader has already asked for. */
export async function getMyRequests(): Promise<Set<string>> {
  if (!isSupabaseConfigured()) return new Set();

  const user = await getCurrentUser();
  if (!user) return new Set();

  const supabase = await createClient();
  const { data } = await supabase.from("note_requests").select("topic");

  return new Set((data ?? []).map((row) => row.topic as string));
}

/** Has this reader already asked for this one. */
export async function hasRequested(topic: string): Promise<boolean> {
  return (await getMyRequests()).has(topic);
}

export type RequestResult =
  | { ok: true }
  | { ok: false; reason: "signed-out" | "too-long" | "failed" };

/**
 * File a request. Idempotent by primary key, so asking twice is not an error and
 * not a stronger signal.
 *
 * The note is trimmed and length-checked here for a decent error message, but
 * the policy checks it too. The route is a convenience; the policy is the rule.
 */
export async function requestNote(
  topic: string,
  note?: string,
): Promise<RequestResult> {
  if (!isSupabaseConfigured()) return { ok: false, reason: "failed" };

  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "signed-out" };

  const trimmed = note?.trim() ?? "";
  if (trimmed.length > MAX_NOTE) return { ok: false, reason: "too-long" };

  const supabase = await createClient();
  const { error } = await supabase.from("note_requests").upsert(
    {
      user_id: user.id,
      topic,
      note: trimmed || null,
    },
    { onConflict: "user_id,topic" },
  );

  return error ? { ok: false, reason: "failed" } : { ok: true };
}

/** Withdraw a request. */
export async function withdrawNote(topic: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const user = await getCurrentUser();
  if (!user) return;

  const supabase = await createClient();
  await supabase.from("note_requests").delete().eq("topic", topic);
}
