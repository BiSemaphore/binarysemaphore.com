import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * The service-role client. Bypasses row level security entirely.
 *
 * There is one reason this exists: `private` is not exposed to PostgREST, so
 * nothing in it can be reached with the publishable key under any policy. The
 * inbox lives there, and the only way to write to it is
 * `public.record_inbox_message`, whose execute grant is `service_role` alone.
 *
 * Two guards, because this key is the whole database:
 *
 * - `server-only` makes importing it from a client component a build error
 *   rather than a leak.
 * - The key is read from `SUPABASE_SECRET_KEY`, which has no `NEXT_PUBLIC_`
 *   prefix, so Next will not inline it into a bundle even by accident.
 *
 * No session is attached and none should be: this client is not "the current
 * user with more power", it is a different actor. Anything that depends on who
 * is asking belongs on the SSR client in ./server.ts.
 */
export function isAdminConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY,
  );
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error(
      "The service-role client is not configured. Set SUPABASE_SECRET_KEY.",
    );
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
