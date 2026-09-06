"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

/**
 * Mark one message answered, ignored, or new again.
 *
 * Goes through `admin_inbox_set_status`, because private.inbox has no URL and
 * cannot be updated from a client at all. That function checks `is_admin()`
 * itself, so this action is a convenience and not the gate.
 */
export async function setInboxStatus(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["new", "answered", "ignored"].includes(status)) return;

  const db = await createClient();
  await db.rpc("admin_inbox_set_status", { p_id: id, p_status: status });

  revalidatePath("/admin/inbox");
  revalidatePath("/admin");
}
