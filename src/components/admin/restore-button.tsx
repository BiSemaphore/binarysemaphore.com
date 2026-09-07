"use client";

import { useTransition } from "react";
import { restoreRevision } from "@/app/admin/restore";

/**
 * Restore one revision.
 *
 * A button rather than a form, because this sits inside the editor's form and
 * HTML has no nested forms: the browser drops the inner one, React warns about
 * a hydration mismatch, and the control quietly stops working.
 *
 * Calling the Server Action directly from a transition keeps the pending state
 * without any of that.
 */
export function RestoreButton({
  documentId,
  revision,
}: {
  documentId: string;
  revision: number;
}) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => restoreRevision(documentId, revision))}
      className="rounded text-xs text-muted underline decoration-border underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-50"
    >
      {pending ? "Restoring…" : "Restore"}
    </button>
  );
}
