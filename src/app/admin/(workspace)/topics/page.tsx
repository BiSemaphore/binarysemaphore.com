import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { adminBase } from "@/lib/admin/paths";
import { CreateForm } from "@/components/admin/create-form";
import { PageHead } from "@/components/admin/ui";

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
 * Read through the admin's own session, so the drafts are visible here for the
 * same reason they are invisible to a reader: `is_admin()` in the select
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
    <div className="max-w-4xl">
      <PageHead title="Topics">
        {subjects.length} subjects, {all.length} channels, {written} with prose.
        The rest appear in the sidebar with an honest empty state, because the
        tree comes from a view with no body column.
      </PageHead>

      {/*
        Twenty-three subjects is more than fits on a screen, and the only way to
        reach the last one was to scroll past ninety rows. Anchors cost nothing
        and no JavaScript.
      */}
      <nav className="mt-5 flex flex-wrap gap-x-3 gap-y-1.5">
        {subjects.map((s) => (
          <a
            key={s.slug}
            href={`#${s.slug}`}
            className="rounded font-mono text-xs text-subtle transition-colors hover:text-foreground"
          >
            {s.name}
          </a>
        ))}
      </nav>

      <details className="group mt-6">
        <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-lg text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground">
          <span className="font-mono text-base leading-none transition-transform group-open:rotate-45">
            +
          </span>
          New channel
        </summary>
        <CreateForm
          collection="channel"
          subjects={subjects.map((s) => ({ slug: s.slug, name: s.name }))}
        />
      </details>

      <div className="mt-8">
        {subjects.map((subject) => {
          const done = subject.channels.filter(
            (c) => c.status === "published",
          ).length;

          return (
            <section key={subject.slug} id={subject.slug} className="scroll-mt-6">
              {/*
                Sticky, because ninety rows of `#slug` all look alike and losing
                track of which subject you are inside is the easiest mistake to
                make on this page.
              */}
              <h2 className="sticky top-0 z-10 flex items-baseline gap-3 border-b border-border bg-background/95 py-2 backdrop-blur">
                <span className="text-sm font-semibold text-foreground">
                  {subject.name}
                </span>
                <span className="font-mono text-xs tabular-nums text-subtle">
                  {done}/{subject.channels.length}
                </span>
              </h2>

              <ul className="mb-8 divide-y divide-border">
                {subject.channels.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`${base}/documents/${c.id}`}
                      className="flex items-baseline justify-between gap-4 px-1 py-2.5 transition-colors hover:bg-card-hover"
                    >
                      <span className="min-w-0 truncate font-mono text-xs text-muted">
                        <span className="text-subtle">#</span>
                        {c.slug}
                      </span>

                      {/*
                        Not coral. "Nothing written" is the normal state for 86
                        of 93 channels, and eighty-six red labels read as
                        eighty-six errors rather than as a to-do list.
                      */}
                      <span className="shrink-0 text-xs tabular-nums text-subtle">
                        {c.status === "published"
                          ? `${c.reading_minutes} min`
                          : "empty"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
