"use server";

import { revalidatePath } from "next/cache";
import { getNotebook } from "@/lib/learn";
import { canRead, getAccess, grantAccess } from "@/lib/learn/access";
import { markRead } from "@/lib/learn/progress";

/**
 * Open a notebook for the signed-in reader.
 *
 * Deliberately does nothing when signed out rather than redirecting: the form
 * is only rendered to signed-in users, and `grant_learn_access()` rejects an
 * anonymous caller anyway. Keeping the action dumb means there is no second
 * place where access could be granted by mistake.
 */
export async function openNotebookAction(formData: FormData) {
  const slug = String(formData.get("slug") ?? "");
  if (!getNotebook(slug)) return;

  await grantAccess(slug);

  // Internal paths, not the subdomain-facing ones.
  revalidatePath(`/learn/${slug}`);
  revalidatePath("/learn");
}

/**
 * Record that a section was opened.
 *
 * Called from the section page after it renders, rather than during render,
 * because a render must not have side effects. Only for a reader who may
 * actually read it: an unentitled visitor seeing a preview has not read the
 * section, and marking it would put a bookmark on a page they cannot finish.
 */
export async function markReadAction(slug: string, section: string) {
  if (!getNotebook(slug)) return;
  if (!canRead(await getAccess(slug))) return;

  await markRead(slug, section);
}
