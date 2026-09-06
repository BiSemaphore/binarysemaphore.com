import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";
import { adminBase } from "@/lib/admin/paths";
import { getCurrentUser } from "@/utils/supabase/auth";

/**
 * Whether the current session belongs to an admin.
 *
 * **Being able to sign in must never imply being an admin.** "Allow new users
 * to sign up" is a global switch, not per provider, and the email provider is
 * enabled, so anyone in the world can obtain an account on this project. There
 * are 18 already. Authentication says who you are; this says what you may do.
 *
 * Asks the database rather than deciding here, so there is one answer and it is
 * the same one RLS uses on every write. A bug in this file makes the admin UI
 * appear for someone; it does not let them change anything, because every write
 * policy calls `is_admin()` independently.
 *
 * Cached per request, so a layout and a page share one round trip.
 */
export const isAdmin = cache(async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;
  if (!(await getCurrentUser())) return false;

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("is_admin");
  return error ? false : Boolean(data);
});

/**
 * The admin, or a redirect. For pages that must not render at all otherwise.
 *
 * A signed-out visitor goes to the login page; a signed-in non-admin gets 404
 * rather than "forbidden", so the admin does not announce itself to someone who
 * has no business there.
 */
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  // Through adminBase(), because the same tree is served at
  // admin.binarysemaphore.com/login and at /admin/login. Hard-coding "/admin"
  // sends the subdomain to /admin/admin/login, since the proxy already rewrites
  // "/" to "/admin" there.
  const base = await adminBase();
  if (!user) redirect(`${base}/login`);
  if (!(await isAdmin())) redirect(`${base}/denied`);
  return user;
}
