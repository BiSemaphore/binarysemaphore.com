"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { adminBase } from "@/lib/admin/paths";

export type SignInState = { error: string | null };

/**
 * Sign in with an email and a password.
 *
 * Password rather than OAuth because this is the surface where knowing exactly
 * which credential was used matters. It changes nothing about authorisation:
 * the account still has to be in `private.admins`, and RLS still decides every
 * write. Someone who signs in here and is not an admin sees the denied page.
 *
 * The error is deliberately the same for a wrong password and an unknown
 * address. Telling them apart would turn this form into a way to test whether
 * an address has an account.
 */
export async function signInAction(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Both fields are needed." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: "That email and password do not match." };

  const base = await adminBase();
  revalidatePath("/admin", "layout");
  redirect(`${base}/`);
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const base = await adminBase();
  revalidatePath("/admin", "layout");
  redirect(`${base}/login`);
}
