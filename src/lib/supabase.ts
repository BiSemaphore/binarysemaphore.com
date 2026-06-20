import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase access for server code (Route Handlers, server actions, server
 * components). Env is read at call time, so the build does not fail when the
 * vars are absent; callers should guard with `isSupabaseConfigured()`.
 *
 * Config (Supabase dashboard -> Project Settings -> API), set in `.env.local`
 * and in the Vercel project env:
 * - `NEXT_PUBLIC_SUPABASE_URL`        project URL
 * - `NEXT_PUBLIC_SUPABASE_ANON_KEY`   public anon key (safe in the browser)
 * - `SUPABASE_SERVICE_ROLE_KEY`       service role key (SERVER ONLY, never
 *                                     prefix with NEXT_PUBLIC, never expose)
 */

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * Privileged server-side client (service role). Bypasses row-level security, so
 * NEVER import this into a Client Component or send the key to the browser. Use
 * it only for trusted server operations such as writing a contact message.
 */
export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
