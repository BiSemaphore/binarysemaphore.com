import type { Metadata } from "next";
import Link from "next/link";
import { listDocuments } from "@/lib/admin/documents";
import { adminBase } from "@/lib/admin/paths";
import { formatDate } from "@/lib/threads";
import { CreateForm } from "@/components/admin/create-form";

export const metadata: Metadata = { title: "Threads" };

const badge: Record<string, string> = {
  published: "text-foreground",
  draft: "text-coral",
  archived: "text-subtle",
};

export default async function AdminThreads() {
  const [threads, base] = await Promise.all([
    listDocuments("thread"),
    adminBase(),
  ]);

  return (
    <>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        Threads
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        {threads.length} in the database. A draft is invisible to readers because
        the select policy says so, not because this page filters it.
      </p>

      <CreateForm collection="thread" />

      <ul className="mt-8 divide-y divide-border border-y border-border">
        {threads.map((t) => (
          <li key={t.id}>
            <Link
              href={`${base}/documents/${t.id}`}
              className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-4 transition-colors hover:bg-card-hover"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-foreground">
                  {t.title}
                </span>
                <span className="mt-0.5 block truncate font-mono text-xs text-subtle">
                  /threads/{t.slug}
                </span>
              </span>

              <span className="flex shrink-0 items-baseline gap-4 text-xs tabular-nums">
                <span className="text-subtle">{t.reading_minutes} min</span>
                <span className="text-subtle">
                  {t.published_at ? formatDate(t.published_at.slice(0, 10)) : "unpublished"}
                </span>
                <span className={badge[t.status] ?? "text-subtle"}>
                  {t.status}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
