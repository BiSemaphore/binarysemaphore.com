"use server";

import { saveDocument, type SaveResult } from "@/lib/admin/documents";

export type EditorState = SaveResult | { ok: null };

/**
 * Save from the editor.
 *
 * Thin on purpose. The rules live in `saveDocument` (compile before storing)
 * and in the database (`published_has_a_body`, and `is_admin()` on the update
 * policy). This only moves fields across, so there is nowhere for a third
 * version of the rules to grow.
 */
export async function saveAction(
  _prev: EditorState,
  formData: FormData,
): Promise<EditorState> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: "Nothing to save." };

  return saveDocument(id, {
    title: String(formData.get("title") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    body: String(formData.get("body") ?? ""),
    status: String(formData.get("status") ?? "draft") as
      | "draft"
      | "published"
      | "archived",
    // Carried by the form so the database can arbitrate, rather than the app
    // re-reading and hoping nothing changed between the read and the write.
    expectedUpdatedAt: String(formData.get("updatedAt") ?? "") || undefined,
  });
}
