"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/utils/supabase/auth";
import { createResume, deleteResume, updateResume } from "@/lib/resume/db";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Create a blank resume and open it in the editor. */
export async function createResumeAction() {
  await requireUser();
  const id = await createResume();
  redirect(`/editor/${id}`);
}

/** Rename a resume from the dashboard. */
export async function renameResumeAction(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!id) return;
  await updateResume(id, { title: title || "Untitled" });
  revalidatePath("/dashboard");
}

/** Delete a resume from the dashboard. */
export async function deleteResumeAction(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteResume(id);
  revalidatePath("/dashboard");
}
