"use server";

import { revalidatePath } from "next/cache";
import { getNotebook } from "@/lib/learn";
import { canRead, getAccess, grantAccess } from "@/lib/learn/access";
import { markRead } from "@/lib/learn/progress";
import { getChannel } from "@/lib/learn/topics";
import { requestNote, withdrawNote } from "@/lib/learn/note-requests";

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

/**
 * Ask us to write up a topic.
 *
 * Signed out is a no-op rather than a redirect, matching `openNotebookAction`:
 * the form is only rendered to signed-in readers, and the RLS policy refuses an
 * anonymous caller anyway. Keeping the action dumb means there is no second
 * place a request could be created by mistake.
 */
export async function requestNoteAction(formData: FormData) {
  const topic = String(formData.get("topic") ?? "");
  const [subject, channel] = topic.split("/");
  if (!getChannel(subject ?? "", channel ?? "")) return;

  const note = String(formData.get("note") ?? "");
  await requestNote(topic, note);

  revalidatePath(`/learn/topics/${topic}`);
}

/** Change your mind. */
export async function withdrawNoteAction(formData: FormData) {
  const topic = String(formData.get("topic") ?? "");
  const [subject, channel] = topic.split("/");
  if (!getChannel(subject ?? "", channel ?? "")) return;

  await withdrawNote(topic);

  revalidatePath(`/learn/topics/${topic}`);
}
