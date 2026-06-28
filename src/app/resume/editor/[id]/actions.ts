"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/utils/supabase/auth";
import { updateResume, type ResumePatch } from "@/lib/resume/db";

export type SaveResult = { ok: true } | { ok: false; error: string };

/**
 * Persist editor changes. Called (debounced) by the client editor. RLS ensures
 * only the owner can write; we just re-check auth for a clean error.
 */
export async function saveResume(
  id: string,
  patch: ResumePatch,
): Promise<SaveResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in" };

  try {
    await updateResume(id, patch);
    // Keep the home hub's title/updated time fresh for the next visit.
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Save failed" };
  }
}
