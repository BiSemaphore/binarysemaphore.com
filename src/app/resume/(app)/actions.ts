"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/utils/supabase/auth";
import {
  MAX_RESUMES,
  countResumes,
  createResume,
  deleteResume,
  updateResume,
} from "@/lib/resume/db";
import { DEFAULT_TEMPLATE, isTemplateId } from "@/lib/resume/schema";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Create a blank resume and open it in the editor. */
export async function createResumeAction() {
  await requireUser();
  // Send the user back to the hub with a banner instead of an error page when
  // they're already at the cap. createResume also enforces this server-side.
  if ((await countResumes()) >= MAX_RESUMES) redirect("/?limit=1");
  const id = await createResume();
  redirect(`/editor/${id}`);
}

/** Create a resume from a chosen template and open it in the editor. */
export async function useTemplateAction(formData: FormData) {
  await requireUser();
  if ((await countResumes()) >= MAX_RESUMES) redirect("/?limit=1");
  const tpl = String(formData.get("templateId") ?? "");
  const templateId = isTemplateId(tpl) ? tpl : DEFAULT_TEMPLATE;
  const id = await createResume(undefined, templateId);
  redirect(`/editor/${id}`);
}

/** Rename a resume from the home hub. */
export async function renameResumeAction(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!id) return;
  await updateResume(id, { title: title || "Untitled" });
  revalidatePath("/");
}

/** Delete a resume from the home hub. */
export async function deleteResumeAction(formData: FormData) {
  await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteResume(id);
  revalidatePath("/");
}
