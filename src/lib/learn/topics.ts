import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/utils/supabase/public";

/**
 * The topic tree browsed at /topics, read from Postgres.
 *
 * **Subjects on the rail, angles in the sidebar.** You pick the subject you are
 * working in, and its channels are *ways in*: what breaks, what gets asked,
 * where people freeze. Deliberately not a beginner ladder. Nobody arrives at
 * `#memory-and-gc` needing chapter one, they arrive because a heap dump is open
 * on the other monitor.
 *
 * This file held all 23 subjects and 93 channels as a literal until the schema
 * rebuild. They are rows now, because channels are managed from the admin
 * panel and a form cannot open a pull request.
 *
 * Three rules moved with them, and where each one now lives matters:
 *
 * 1. **Channel names are situations, not syllabus entries.** Enforced by the
 *    `channel_slugs_are_situations` constraint on `documents`, not by a test.
 *    A vitest over this file could not see a channel typed into a form.
 * 2. **Slugs are permanent**, and unique within their subject:
 *    `unique nulls not distinct (collection, scope, slug)`.
 * 3. **Nothing claims coverage we do not have.** `channelState` derives the
 *    claim from what is actually linked, so it cannot drift from the truth.
 *
 * ## Two queries, deliberately
 *
 * The tree comes from the `topic_tree` view, which has **no body column**, so
 * every channel is listed whether or not it has prose. The body comes from
 * `documents`, which is published-only. That split is why the sidebar can show
 * all 93 channels honestly while an unwritten draft stays unreadable.
 */

export type ChannelState = "notebook" | "roadmap" | "soon";

export type Reference = {
  href: string;
  /** e.g. "MDN", "postgresql.org". */
  label: string;
};

export type Channel = {
  /** Unique within its subject. The URL is /topics/<subject>/<slug>. */
  slug: string;
  title: string;
  /** One line, in the words someone with the problem would use. */
  blurb: string;
  /** Whether prose exists. From the view, so no filesystem check and no
   *  fetching a body just to find out whether there is one. */
  written: boolean;
  reference?: Reference;
  /** Slug in `src/lib/learn.ts`, when one of our notebooks covers this. */
  notebook?: string;
  /** Slug in `src/lib/learn/roadmaps.ts`, when a roadmap passes through. */
  roadmap?: string;
};

export type Subject = {
  slug: string;
  name: string;
  /** Key into `subject-icons.tsx`. */
  icon: string;
  /** One line for the sidebar header and the index. */
  blurb: string;
  channels: Channel[];
};

type SubjectRow = {
  slug: string;
  name: string;
  icon: string;
  blurb: string;
};

type ChannelRow = {
  subject: string;
  slug: string;
  title: string;
  summary: string | null;
  written: boolean;
  position: number;
  reference: Reference | null;
  notebook_id: string | null;
  roadmap: string | null;
};

/**
 * The whole tree, in one round trip per table.
 *
 * Two queries rather than 24: the alternative is a query per subject, and the
 * shell renders every subject on the rail on every page.
 */
export const getSubjects = unstable_cache(
  async (): Promise<Subject[]> => {
    const db = createPublicClient();

    const [subjectResult, channelResult] = await Promise.all([
      db.from("subjects").select("slug, name, icon, blurb").order("position"),
      db
        .from("topic_tree")
        .select(
          "subject, slug, title, summary, written, position, reference, notebook_id, roadmap",
        )
        .order("position"),
    ]);

    if (subjectResult.error) {
      throw new Error(`Could not read subjects: ${subjectResult.error.message}`);
    }
    if (channelResult.error) {
      throw new Error(`Could not read channels: ${channelResult.error.message}`);
    }

    const bySubject = new Map<string, Channel[]>();
    for (const row of (channelResult.data ?? []) as ChannelRow[]) {
      const list = bySubject.get(row.subject) ?? [];
      list.push({
        slug: row.slug,
        title: row.title,
        blurb: row.summary ?? "",
        written: row.written,
        ...(row.reference ? { reference: row.reference } : {}),
        ...(row.notebook_id ? { notebook: row.notebook_id } : {}),
        ...(row.roadmap ? { roadmap: row.roadmap } : {}),
      });
      bySubject.set(row.subject, list);
    }

    return ((subjectResult.data ?? []) as SubjectRow[]).map((s) => ({
      ...s,
      channels: bySubject.get(s.slug) ?? [],
    }));
  },
  ["topic-tree"],
  { tags: ["topics"], revalidate: 3600 },
);

/**
 * Is this slug a situation rather than a syllabus entry.
 *
 * The database is the rule: `channel_slugs_are_situations` on `documents`
 * refuses the row. This exists so the admin form can say *why* before the
 * insert fails, in the same relationship `requestNote` has with its policy.
 *
 * The two regexes must stay identical to the constraint's, and a test asserts
 * that by reading the migration, because a friendly error that disagrees with
 * the database is worse than no error at all.
 */
export const SYLLABUS_NAMING = /^[0-9]|^(chapter|unit|part|lesson|module|week)-/;
export const LADDER_NAMING =
  /(^|-)(intro|introduction|basics|fundamentals|getting-started)(-|$)/;

export function isSituationalSlug(slug: string): boolean {
  return !SYLLABUS_NAMING.test(slug) && !LADDER_NAMING.test(slug);
}

/**
 * What a channel actually has behind it.
 *
 * Derived, never stored, so the badge cannot claim coverage that was removed.
 * `written` is separate on purpose: a channel can have our prose and no
 * notebook, and saying "soon" on a page with 700 words on it would be a lie.
 */
export function channelState(channel: Channel): ChannelState {
  if (channel.notebook) return "notebook";
  if (channel.roadmap) return "roadmap";
  return "soon";
}

export async function getSubject(slug: string): Promise<Subject | undefined> {
  return (await getSubjects()).find((s) => s.slug === slug);
}

export async function getChannel(
  subjectSlug: string,
  channelSlug: string,
): Promise<{ subject: Subject; channel: Channel } | undefined> {
  const subject = await getSubject(subjectSlug);
  const channel = subject?.channels.find((c) => c.slug === channelSlug);
  return subject && channel ? { subject, channel } : undefined;
}

export async function allChannels(): Promise<
  { subject: Subject; channel: Channel }[]
> {
  return (await getSubjects()).flatMap((subject) =>
    subject.channels.map((channel) => ({ subject, channel })),
  );
}

export async function countChannels(): Promise<number> {
  return (await allChannels()).length;
}

export async function countCovered(): Promise<number> {
  return (await allChannels()).filter(
    ({ channel }) => channelState(channel) !== "soon",
  ).length;
}

/**
 * The MDX source of one channel, or null when nothing is written.
 *
 * Read from `documents`, whose select policy is `status = 'published'`, so an
 * unpublished draft returns null here for a reader and the page falls back to
 * saying so. The subject and channel are matched as data, not interpolated
 * into a path, so a request for `../../etc/passwd` is simply a row that does
 * not exist.
 */
export const getChannelBody = unstable_cache(
  async (subject: string, channel: string): Promise<string | null> => {
    const { data } = await createPublicClient()
      .from("documents")
      .select("body_mdx")
      .eq("collection", "channel")
      .eq("scope", subject)
      .eq("slug", channel)
      .maybeSingle();

    return data?.body_mdx ?? null;
  },
  ["channel-body"],
  { tags: ["topics"], revalidate: 3600 },
);
