"use server";

import { redirect } from "next/navigation";
import { createDocument, type CreateResult } from "@/lib/admin/documents";

export type CreateState = CreateResult | { ok: null };

/**
 * Create from the list pages, then go straight to the editor.
 *
 * The redirect is the point: a created page with no body is a draft that does
 * nothing, so the useful next step is always writing it.
 */
export async function createAction(
  _prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  const collection = String(formData.get("collection") ?? "") as
    | "thread"
    | "channel";
  if (collection !== "thread" && collection !== "channel") {
    return { ok: false, error: "Unknown kind." };
  }

  const result = await createDocument({
    collection,
    scope: (formData.get("scope") as string) || null,
    slug: String(formData.get("slug") ?? ""),
    title: String(formData.get("title") ?? ""),
  });

  if (!result.ok) return result;
  redirect(`/admin/documents/${result.id}`);
}
