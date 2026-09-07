import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { adminBase } from "@/lib/admin/paths";
import { PageHead, StatusChip, When } from "@/components/admin/ui";

export const metadata: Metadata = { title: "Overview" };

type Recent = {
  id: string;
  collection: string;
  scope: string | null;
  slug: string;
  title: string;
  status: string;
  updated_at: string;
};

/**
 * What is here, and what is waiting.
 *
 * The first version was four tallies and half a page of nothing. A tally tells
 * you the library is 93 channels long, which you already knew; it does not tell
 * you what to do next. This leads with the work: what needs attention, then
 * what was touched last, and keeps the counts as a strip rather than as the
 * point.
 *
 * Everything is read through the admin's own session, not the service key, so
 * RLS is genuinely doing the work: drafts are visible because `is_admin()` says
 * so. Using the service key here would have made the page correct and the
 * boundary untested.
 */
async function overview() {
  const db = await createClient();

  const count = (collection: string, status?: string) => {
    let q = db
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("collection", collection);
    if (status) q = q.eq("status", status);
    return q;
  };

  const [threads, threadDrafts, channels, channelDrafts, requests, inbox, recent] =
    await Promise.all([
      count("thread"),
      count("thread", "draft"),
      count("channel"),
      count("channel", "draft"),
      db.from("note_requests").select("topic", { count: "exact", head: true }),
      db.rpc("admin_inbox", { p_status: "new" }),
      // Only documents a person has actually changed since they were created.
      //
      // Ordering by updated_at alone showed eight arbitrary channels, because
      // the one-way sync stamped all 93 with the same second. That is an import
      // timestamp wearing an edit history's clothes, and it is worse than an
      // empty list: it invites you to trust an order that means nothing.
      db
        .from("documents")
        .select("id, collection, scope, slug, title, status, updated_at, created_at")
        .order("updated_at", { ascending: false })
        .limit(40),
    ]);

  return {
    threads: threads.count ?? 0,
    threadDrafts: threadDrafts.count ?? 0,
    channels: channels.count ?? 0,
    channelDrafts: channelDrafts.count ?? 0,
    requests: requests.count ?? 0,
    inbox: Array.isArray(inbox.data) ? inbox.data.length : 0,
    recent: ((recent.data ?? []) as (Recent & { created_at: string })[])
      .filter((d) => Date.parse(d.updated_at) - Date.parse(d.created_at) > 1000)
      .slice(0, 8),
  };
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-display text-xl font-semibold tabular-nums tracking-tight text-foreground">
        {value}
      </span>
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}

/** One thing worth doing, or nothing at all. Never a zero dressed up as a card. */
function Task({
  href,
  label,
  detail,
}: {
  href: string;
  label: string;
  detail: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-baseline justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-card-hover"
      >
        <span className="text-sm text-foreground">{label}</span>
        <span className="shrink-0 text-xs text-subtle">{detail}</span>
      </Link>
    </li>
  );
}

export default async function AdminOverview() {
  const [o, base] = await Promise.all([overview(), adminBase()]);

  const tasks = [
    o.inbox > 0 && {
      href: `${base}/inbox`,
      label: `${o.inbox} message${o.inbox === 1 ? "" : "s"} waiting for a reply`,
      detail: "Inbox",
    },
    o.threadDrafts > 0 && {
      href: `${base}/threads`,
      label: `${o.threadDrafts} thread${o.threadDrafts === 1 ? "" : "s"} in draft`,
      detail: "not visible to readers",
    },
    o.channelDrafts > 0 && {
      href: `${base}/topics`,
      label: `${o.channelDrafts} channels with nothing written`,
      detail: "the page says so honestly",
    },
    o.requests > 0 && {
      href: `${base}/topics`,
      label: `${o.requests} note request${o.requests === 1 ? "" : "s"} from readers`,
      detail: "what to write next",
    },
  ].filter(Boolean) as { href: string; label: string; detail: string }[];

  return (
    <div className="max-w-4xl">
      <PageHead title="Overview">
        Content is served from Postgres, so a change here is live as soon as its
        cache tag clears. There is no deploy in the loop and no staging copy.
      </PageHead>

      <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
        <Stat value={o.threads} label="threads" />
        <Stat value={o.channels} label="channels" />
        <Stat value={o.channels - o.channelDrafts} label="written" />
        <Stat value={o.inbox} label="unanswered" />
      </div>

      {tasks.length > 0 ? (
        <section className="mt-10">
          <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-subtle">
            Waiting on you
          </h2>
          <ul className="mt-3 grid gap-2">
            {tasks.map((t) => (
              <Task key={t.label} {...t} />
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-subtle">
          Last edited
        </h2>

        {o.recent.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-border px-4 py-6 text-sm text-subtle">
            Nothing has been edited here yet. Everything currently in the
            database arrived through the one-way sync from git, so there is no
            history to show until the first save.
          </p>
        ) : (
        <ul className="mt-2 divide-y divide-border border-y border-border">
          {o.recent.map((d) => (
            <li key={d.id}>
              <Link
                href={`${base}/documents/${d.id}`}
                className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1 px-1 py-3 transition-colors hover:bg-card-hover sm:grid-cols-[1fr_7rem_6rem]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-foreground">
                    {d.title}
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-xs text-subtle">
                    {d.collection === "thread"
                      ? `/threads/${d.slug}`
                      : `${d.scope}/${d.slug}`}
                  </span>
                </span>

                <span className="hidden text-xs text-subtle sm:block">
                  <When iso={d.updated_at} />
                </span>

                <span className="justify-self-end">
                  <StatusChip status={d.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        )}
      </section>
    </div>
  );
}
