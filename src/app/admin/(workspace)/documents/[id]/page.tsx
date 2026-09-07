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
 * table, so they get the same editor. Copying this per collection is how three
 * editors that disagree about publishing get built.
 */
export default async function EditDocument({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [doc, base] = await Promise.all([getDocument(id), adminBase()]);
  if (!doc) notFound();

  return (
    <>
      <Link
        href={doc.collection === "thread" ? `${base}/threads` : `${base}/topics`}
        className="font-mono text-xs text-subtle transition-colors hover:text-foreground"
      >
        ← {doc.collection === "thread" ? "Threads" : "Topics"}
      </Link>

      <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          {doc.title}
        </h1>
        <StatusChip status={doc.status} />
      </div>

      <p className="mt-1.5 flex flex-wrap items-baseline gap-x-3 font-mono text-xs text-subtle">
        <a
          href={
            doc.status === "published"
              ? doc.collection === "thread"
                ? `https://binarysemaphore.com/threads/${doc.slug}`
                : `https://learn.binarysemaphore.com/topics/${doc.scope}/${doc.slug}`
              : undefined
          }
          target="_blank"
          rel="noreferrer noopener"
          className={
            doc.status === "published"
              ? "underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
              : "pointer-events-none"
          }
        >
          {doc.collection === "thread"
            ? `/threads/${doc.slug}`
            : `/topics/${doc.scope}/${doc.slug}`}
        </a>
        <span>{doc.reading_minutes} min</span>
        <span>
          edited <When iso={doc.updated_at} />
        </span>
      </p>

      {doc.origin === "sync" ? (
        <p className="mt-6 rounded-card border border-coral/40 bg-card px-4 py-3 text-sm leading-6 text-muted">
          A script owns this page. Editing it here would work, and the next sync
          would overwrite it without a trace, so the editor is read-only.
        </p>
      ) : null}

      <Editor
        id={doc.id}
        collection={doc.collection}
        readOnly={doc.origin === "sync"}
        initial={{
          title: doc.title,
          summary: doc.summary ?? "",
          body: doc.body_mdx ?? "",
          status: doc.status,
        }}
      />

      <Revisions documentId={doc.id} />
    </>
  );
}
