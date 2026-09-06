import { createClient } from "@supabase/supabase-js";

/**
 * A client for content anyone may read.
 *
 * Deliberately not the SSR client in ./server.ts. That one reads cookies to
 * attach a session, and a function that reads cookies cannot live inside
 * `unstable_cache`: the cache would either refuse to run it or serve one
 * reader's session to another.
 *
 * Published content is the same for everybody, so it needs no session. This
 * client has none, uses the publishable key, and is therefore cacheable.
 *
 * It is still bound by row level security as `anon`, which is the point: if a
 * draft ever appeared through this client, that would be a policy bug and not
 * something this file should paper over.
 */
export function createPublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
