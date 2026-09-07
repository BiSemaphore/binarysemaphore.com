import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDocument } from "@/lib/admin/documents";
import { adminBase } from "@/lib/admin/paths";
import { Editor } from "@/components/admin/editor";
import { Revisions } from "@/components/admin/revisions";
import { StatusChip, When } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Edit", robots: { index: false } };

/**
 * One editor for every collection.
 *
 * A thread, a channel and a notebook section are the same row in the same
 * table, so they get the same editor. Copying it per collection is how three
 * editors that disagree about publishing get built.
 *
 * This page renders nothing itself beyond the facts it hands the editor: the
 * editor is the window.
 */
export default async function EditDocument({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [doc, base] = await Promise.all([getDocument(id), adminBase()]);
  if (!doc) notFound();

  const path =
    doc.collection === "thread"
      ? `/threads/${doc.slug}`
      : `/topics/${doc.scope}/${doc.slug}`;

  const live =
    doc.collection === "thread"
      ? `https://binarysemaphore.com${path}`
      : `https://learn.binarysemaphore.com${path}`;

  return (
    <Editor
      id={doc.id}
      updatedAt={doc.updated_at}
      collection={doc.collection}
      readOnly={doc.origin === "sync"}
      initial={{
        title: doc.title,
        summary: doc.summary ?? "",
        body: doc.body_mdx ?? "",
        status: doc.status,
      }}
      back={
        <Link
          href={doc.collection === "thread" ? `${base}/threads` : `${base}/topics`}
          className="rounded font-mono text-xs text-subtle transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          ←
        </Link>
      }
      revisions={<Revisions documentId={doc.id} />}
      details={
        <dl className="grid gap-3 text-xs">
          {doc.origin === "sync" ? (
            <p className="rounded-card border border-coral/40 bg-card px-4 py-3 leading-6 text-muted">
              A script owns this page. Editing it here would work, and the next
              sync would overwrite it without a trace, so the editor is
              read-only.
            </p>
          ) : null}

          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-subtle">Status</dt>
            <dd>
              <StatusChip status={doc.status} />
            </dd>
          </div>

          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-subtle">Path</dt>
            <dd className="min-w-0 truncate font-mono text-subtle">
              {doc.status === "published" ? (
                <a
                  href={live}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
                >
                  {path}
                </a>
              ) : (
                path
              )}
            </dd>
          </div>

          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-subtle">Reading time</dt>
            <dd className="tabular-nums text-muted">
              {doc.reading_minutes} min
            </dd>
          </div>

          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-subtle">Last edited</dt>
            <dd className="text-muted">
              <When iso={doc.updated_at} />
            </dd>
          </div>
        </dl>
      }
    />
  );
}
