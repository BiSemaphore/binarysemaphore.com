import type { Metadata } from "next";
import Link from "next/link";
import { listDocuments } from "@/lib/admin/documents";
import { adminBase } from "@/lib/admin/paths";
import { CreateForm } from "@/components/admin/create-form";
import { PageHead, StatusChip, When } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Threads" };

export default async function AdminThreads() {
  const [threads, base] = await Promise.all([
    listDocuments("thread"),
    adminBase(),
  ]);

  const drafts = threads.filter((t) => t.status === "draft").length;

  return (
    <>
      <PageHead title="Threads">
        {threads.length} in the database
        {drafts > 0 ? `, ${drafts} still in draft` : ", all published"}. A draft
        is invisible to readers because the select policy says so, not because
        this page filters it.
      </PageHead>

      {/*
        Collapsed by default. Creating is the rarer action, and an always-open
        dashed form sat above the list drawing more attention than the eight
        things you actually came to look at. `details` rather than React state:
        no hydration, no effect, and it works before JavaScript arrives.
      */}
      <details className="group mt-6">
        <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-lg text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
          <span className="font-mono text-base leading-none transition-transform group-open:rotate-45">
            +
          </span>
          New thread
        </summary>
        <CreateForm collection="thread" />
      </details>

      {/*
        A real grid, not a flex row per line. With flex the three trailing
        values landed in a different place on every row, so nothing lined up and
        the eye had to re-find the status each time.
      */}
      <ul className="mt-8 divide-y divide-border border-y border-border">
        {threads.map((t) => (
          <li key={t.id}>
            <Link
              href={`${base}/documents/${t.id}`}
              className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 px-1 py-3.5 transition-colors hover:bg-card-hover sm:grid-cols-[1fr_4rem_7rem_6.5rem]"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm text-foreground">
                  {t.title}
                </span>
                <span className="mt-0.5 block truncate font-mono text-xs text-subtle">
                  /threads/{t.slug}
                </span>
              </span>

              <span className="hidden justify-self-end text-xs tabular-nums text-subtle sm:block">
                {t.reading_minutes} min
              </span>

              <span className="hidden justify-self-end text-xs text-subtle sm:block">
                {t.published_at ? (
                  <When iso={t.published_at} />
                ) : (
                  <span className="text-subtle">unpublished</span>
                )}
              </span>

              <span className="justify-self-end">
                <StatusChip status={t.status} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
