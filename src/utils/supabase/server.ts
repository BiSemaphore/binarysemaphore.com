import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase config (Supabase dashboard -> Project Settings -> API), set in
 * `.env.local` and in the Vercel project env:
 * - `NEXT_PUBLIC_SUPABASE_URL`              project URL
 * - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`  publishable key (safe in the browser)
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

/**
 * Supabase client for Server Components, Route Handlers, and server actions.
 * Reads/writes the auth session via cookies and respects row-level security as
 * the current user (or the anon role when signed out).
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component. Safe to ignore when the middleware
          // refreshes sessions.
        }
      },
    },
  });
}
