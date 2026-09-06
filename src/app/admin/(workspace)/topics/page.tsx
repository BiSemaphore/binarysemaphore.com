import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { adminBase } from "@/lib/admin/paths";

export const metadata: Metadata = { title: "Topics" };

type Row = {
  id: string;
  scope: string;
  slug: string;
  title: string;
  status: string;
  reading_minutes: number;
};

/**
 * Every channel, grouped by subject.
 *
 * Read through the admin's own session, so the 86 drafts are visible here for
 * the same reason they are invisible to a reader: `is_admin()` in the select
 * policy. Nothing in this file filters by status.
 */
async function channelsBySubject() {
  const db = await createClient();

  const [subjects, channels] = await Promise.all([
    db.from("subjects").select("slug, name").order("position"),
    db
      .from("documents")
      .select("id, scope, slug, title, status, reading_minutes")
      .eq("collection", "channel")
      .order("scope"),
  ]);

  const grouped = new Map<string, Row[]>();
  for (const row of (channels.data ?? []) as Row[]) {
    grouped.set(row.scope, [...(grouped.get(row.scope) ?? []), row]);
  }

  return ((subjects.data ?? []) as { slug: string; name: string }[]).map((s) => ({
    ...s,
    channels: (grouped.get(s.slug) ?? []).sort((a, b) =>
      a.slug.localeCompare(b.slug),
    ),
  }));
}

export default async function AdminTopics() {
  const [subjects, base] = await Promise.all([channelsBySubject(), adminBase()]);
  const all = subjects.flatMap((s) => s.channels);
  const written = all.filter((c) => c.status === "published").length;

  return (
    <>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        Topics
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        {subjects.length} subjects, {all.length} channels, {written} with prose.
        The rest are drafts: they appear in the sidebar with an honest empty
        state, because the tree comes from a view with no body column.
      </p>

      <div className="mt-8 space-y-8">
        {subjects.map((subject) => (
          <section key={subject.slug}>
            <h2 className="flex items-baseline gap-3 border-b border-border pb-2">
              <span className="text-sm font-semibold text-foreground">
                {subject.name}
              </span>
              <span className="font-mono text-xs text-subtle">
                {subject.channels.filter((c) => c.status === "published").length}
                /{subject.channels.length}
              </span>
            </h2>

            <ul className="mt-1 divide-y divide-border">
              {subject.channels.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`${base}/documents/${c.id}`}
                    className="flex items-baseline justify-between gap-4 py-2.5 transition-colors hover:bg-card-hover"
                  >
                    <span className="min-w-0 truncate font-mono text-xs text-muted">
                      #{c.slug}
                    </span>
                    <span
                      className={
                        c.status === "published"
                          ? "shrink-0 text-xs tabular-nums text-subtle"
                          : "shrink-0 text-xs text-coral"
                      }
                    >
                      {c.status === "published"
                        ? `${c.reading_minutes} min`
                        : "nothing written"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
