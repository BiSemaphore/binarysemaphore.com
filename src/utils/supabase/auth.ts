import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";

/**
 * The validated current user, or null. Wrapped in React `cache` so the header
 * and the page in one request share a single `getUser()` call. Returns null
 * (instead of throwing) when Supabase is not configured.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
});
