"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

/**
 * Put an earlier version back.
 *
 * Takes arguments rather than FormData, because the control that calls it can
 * no longer be a form: the history now lives inside the editor's own form, and
 * a form cannot contain another form. The browser does not nest them, it drops
 * the inner one, which produces a hydration mismatch and a Restore button that
 * silently does nothing.
 *
 * The restore is itself a save, so the trigger stores the version being
 * replaced before overwriting it. Restoring the wrong revision is therefore
 * undoable, which matters, because the second most common reason to use this is
 * realising the first restore was wrong.
 */
export async function restoreRevision(
  documentId: string,
  revision: number,
): Promise<void> {
  if (!documentId || !Number.isInteger(revision)) return;

  const db = await createClient();
  await db.rpc("admin_restore_revision", {
    p_document: documentId,
    p_revision: revision,
  });

  revalidatePath(`/admin/documents/${documentId}`);
}
