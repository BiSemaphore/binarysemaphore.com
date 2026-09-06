"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/utils/supabase/server";

/**
 * Put an earlier version back.
 *
 * The restore is itself a save, so the trigger stores what is being replaced
 * before overwriting it. Restoring the wrong revision is therefore undoable,
 * which matters, because the second most common reason to use this is
 * realising the first restore was wrong.
 */
export async function restoreAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const revision = Number(formData.get("revision"));
  if (!id || !Number.isInteger(revision)) return;

  const db = await createClient();
  await db.rpc("admin_restore_revision", {
    p_document: id,
    p_revision: revision,
  });

  revalidateTag("threads", "max");
  revalidateTag("topics", "max");
  revalidatePath(`/admin/documents/${id}`);
}
