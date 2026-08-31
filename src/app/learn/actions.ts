"use server";

import { revalidatePath } from "next/cache";
import { getNotebook } from "@/lib/learn";
import { startTrial } from "@/lib/learn/access";

/**
 * Start the free trial for one notebook.
 *
 * Deliberately does nothing when signed out rather than redirecting: the form
 * is only rendered to signed-in users, and `start_learn_trial()` rejects an
 * anonymous caller anyway. Keeping the action dumb means there is no second
 * place where access could be granted by mistake.
 */
export async function startTrialAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  if (!getNotebook(slug)) return;

  await startTrial(slug);

  // Internal paths, not the subdomain-facing ones.
  revalidatePath(`/learn/${slug}`);
  revalidatePath("/learn");
}
