import { createClient } from "@/utils/supabase/server";
import { restoreAction } from "@/app/admin/restore";

type Revision = {
  revision: number;
  title: string;
  summary: string | null;
  status: string;
  saved_at: string;
  saved_by: string | null;
  words: number;
};

/**
 * The history of one document.
 *
 * Each row is what the page looked like *before* that save, which is the only
 * useful way to store them: restoring revision N gives you the version you had
 * before save N, which is what "undo that" means.
 *
 * Bodies are not fetched. A list of twenty revisions does not need twenty
 * copies of the prose, and a word count is enough to see what a save did.
 */
export async function Revisions({ documentId }: { documentId: string }) {
  const db = await createClient();
  const { data } = await db.rpc("admin_revisions", { p_document: documentId });
  const revisions = (data ?? []) as Revision[];

  if (revisions.length === 0) {
    return (
      <p className="mt-10 border-t border-border pt-6 text-sm text-subtle">
        No history yet. Every save from here on stores the version it replaced.
      </p>
    );
  }

  return (
    <section className="mt-10 border-t border-border pt-6">
      <h2 className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-subtle">
        History
      </h2>

      <ul className="mt-3 divide-y divide-border">
        {revisions.map((r) => (
          <li
            key={r.revision}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5"
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-muted">
                {r.title}
              </span>
              <span className="font-mono text-xs text-subtle">
                r{r.revision} · {r.words} words · {r.status}
                {r.saved_by ? ` · ${r.saved_by}` : ""}
              </span>
            </span>

            <span className="flex shrink-0 items-baseline gap-4">
              <span className="text-xs tabular-nums text-subtle">
                {new Date(r.saved_at).toLocaleString("en-GB")}
              </span>
              <form action={restoreAction}>
                <input type="hidden" name="id" value={documentId} />
                <input type="hidden" name="revision" value={r.revision} />
                <button className="text-xs text-muted underline decoration-border underline-offset-4 transition-colors hover:text-foreground">
                  Restore
                </button>
              </form>
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs leading-5 text-subtle">
        Restoring is itself a save, so the version it replaces is stored first.
        Status is left alone: putting the words back should not quietly
        unpublish a live page.
      </p>
    </section>
  );
}
