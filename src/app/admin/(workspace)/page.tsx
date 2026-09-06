import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { adminBase } from "@/lib/admin/paths";

export const metadata: Metadata = { title: "Overview" };

/**
 * What is here and what needs attention.
 *
 * Every count is read through the admin's own session, not the service key, so
 * RLS is genuinely doing the work: an admin sees drafts because `is_admin()`
 * says so, and the same query run by anyone else returns only what is
 * published. Using the service key here would have made the page correct and
 * the boundary untested.
 */
async function counts() {
  const db = await createClient();
  const rows = (collection: string, status?: string) => {
    let q = db
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("collection", collection);
    if (status) q = q.eq("status", status);
    return q;
  };

  const [threads, drafts, channels, unwritten, requests, inbox] =
    await Promise.all([
      rows("thread"),
      rows("thread", "draft"),
      rows("channel"),
      rows("channel", "draft"),
      db.from("note_requests").select("topic", { count: "exact", head: true }),
      db.rpc("admin_inbox", { p_status: "new" }),
    ]);

  return {
    threads: threads.count ?? 0,
    threadDrafts: drafts.count ?? 0,
    channels: channels.count ?? 0,
    unwritten: unwritten.count ?? 0,
    requests: requests.count ?? 0,
    inbox: Array.isArray(inbox.data) ? inbox.data.length : 0,
  };
}

function Stat({
  value,
  label,
  href,
  note,
}: {
  value: number;
  label: string;
  href: string;
  note?: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-card border border-border bg-card px-5 py-4 transition-colors hover:bg-card-hover"
    >
      <span className="block font-display text-3xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </span>
      <span className="mt-1 block text-sm text-foreground">{label}</span>
      {note ? (
        <span className="mt-0.5 block text-xs text-subtle">{note}</span>
      ) : null}
    </Link>
  );
}

export default async function AdminOverview() {
  const [c, base] = await Promise.all([counts(), adminBase()]);

  return (
    <>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        Overview
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Content is served from Postgres, so a change here is live once its cache
        tag is cleared. There is no deploy in the loop.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Stat
          value={c.threads}
          label="Threads"
          href={`${base}/threads`}
          note={c.threadDrafts ? `${c.threadDrafts} in draft` : "all published"}
        />
        <Stat
          value={c.channels}
          label="Channels"
          href={`${base}/topics`}
          note={`${c.unwritten} still without prose`}
        />
        <Stat
          value={c.inbox}
          label="Unanswered messages"
          href={`${base}/inbox`}
        />
        <Stat
          value={c.requests}
          label="Note requests"
          href={`${base}/topics`}
          note="what readers asked us to write"
        />
      </div>
    </>
  );
}
