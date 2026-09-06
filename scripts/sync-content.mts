/**
 * git to Postgres, once, in one direction.
 *
 * This is the migration that matters. After it runs, Postgres is the source of
 * truth for content and git is not, and the MDX under src/content/ is deleted
 * (see docs/database.md). Running both live, or syncing back the other way, is
 * how content gets silently lost, so this script deliberately has no reverse.
 *
 * Content is never seeded by a migration. Three of the old ten migrations were
 * content edits, which is what turned the folder into a changelog written in
 * SQL. This is idempotent and re-runnable and leaves nothing behind.
 *
 *   node --env-file=.env.local scripts/sync-content.mts [--dry-run]
 *
 * Needs SUPABASE_SECRET_KEY: every table here is admin-write-only, so RLS
 * refuses the publishable key by design. Node 26 strips the types, and
 * topics.ts and learn.ts have no imports, so they are read directly rather
 * than duplicated.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { createClient } from "@supabase/supabase-js";
import { subjects } from "../src/lib/learn/topics.ts";
import { notebooks } from "../src/lib/learn.ts";

const DRY = process.argv.includes("--dry-run");
const ROOT = process.cwd();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY, or pass --env-file=.env.local.",
  );
  process.exit(1);
}

const db = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Fails loudly. A half-synced database is worse than an unsynced one. */
function check(label: string, error: { message: string } | null) {
  if (error) {
    console.error(`\n${label}: ${error.message}`);
    process.exit(1);
  }
}

function read(...segments: string[]): string | null {
  const file = path.join(ROOT, ...segments);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
}

/**
 * A document plus its satellite, in that order.
 *
 * The satellite carries a trigger asserting it agrees with documents.scope, so
 * the document has to exist first and the two cannot drift apart afterwards.
 */
async function upsertDocument(
  doc: Record<string, unknown>,
  satellite?: { table: string; row: Record<string, unknown> },
) {
  if (DRY) return;

  const { data, error } = await db
    .from("documents")
    .upsert(doc, { onConflict: "collection,scope,slug" })
    .select("id")
    .single();
  check(`documents ${doc.collection}/${doc.scope ?? "-"}/${doc.slug}`, error);

  if (satellite) {
    const { error: satError } = await db
      .from(satellite.table)
      .upsert(
        { document_id: data!.id, ...satellite.row },
        { onConflict: "document_id" },
      );
    check(`${satellite.table} for ${doc.slug}`, satError);
  }
}

async function syncNotebooks() {
  const rows = notebooks.map((n, i) => ({
    id: n.slug,
    title: n.title,
    subtitle: n.subtitle,
    // Today the folder equals the slug. The column exists so that stops being
    // an assumption a storage policy silently depends on.
    storage_prefix: n.slug,
    status: "published",
    position: i,
  }));

  if (!DRY) check("notebooks", (await db.from("notebooks").upsert(rows)).error);
  console.log(`notebooks        ${rows.length}`);
}

async function syncThreads() {
  const dir = path.join(ROOT, "src/content/threads");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));

  for (const file of files) {
    const slug = file.replace(/\.mdx$/, "");
    const { data: fm, content } = matter(fs.readFileSync(path.join(dir, file), "utf8"));

    const date =
      fm.date instanceof Date
        ? fm.date.toISOString()
        : new Date(String(fm.date)).toISOString();

    // A draft in frontmatter becomes a draft in the database rather than a
    // missing row, so the admin can see it and publish it later.
    const published = !fm.draft;

    await upsertDocument(
      {
        collection: "thread",
        scope: null,
        slug,
        title: String(fm.title),
        summary: String(fm.description ?? ""),
        body_mdx: content,
        status: published ? "published" : "draft",
        published_at: published ? date : null,
        origin: "admin",
      },
      {
        table: "thread_meta",
        row: { tags: Array.isArray(fm.tags) ? fm.tags.map(String) : [] },
      },
    );
  }
  console.log(`threads          ${files.length}`);
}

async function syncTopics() {
  const subjectRows = subjects.map((s, i) => ({
    slug: s.slug,
    name: s.name,
    blurb: s.blurb,
    icon: s.icon,
    position: i,
    status: "published",
  }));

  if (!DRY) check("subjects", (await db.from("subjects").upsert(subjectRows)).error);

  let written = 0;
  let empty = 0;

  for (const subject of subjects) {
    for (const [i, channel] of subject.channels.entries()) {
      const body = read("src/content/topics", subject.slug, `${channel.slug}.mdx`);
      // Only a channel we have actually written is published. The rest exist as
      // drafts so the tree is complete and the page can say so honestly, which
      // published_has_a_body would otherwise refuse to store.
      if (body) written++;
      else empty++;

      await upsertDocument(
        {
          collection: "channel",
          scope: subject.slug,
          slug: channel.slug,
          title: channel.title,
          summary: channel.blurb,
          body_mdx: body,
          status: body ? "published" : "draft",
          published_at: body ? new Date().toISOString() : null,
          origin: "admin",
        },
        {
          table: "channel_meta",
          row: {
            subject: subject.slug,
            position: i,
            reference: channel.reference ?? null,
            notebook_id: channel.notebook ?? null,
          },
        },
      );
    }
  }

  console.log(`subjects         ${subjectRows.length}`);
  console.log(`channels         ${written + empty} (${written} written, ${empty} awaiting prose)`);
}

/**
 * Rows in Postgres that git no longer knows about.
 *
 * Reported, never deleted. Once the admin exists, a row absent from git is far
 * more likely to be something written in the admin than something retired, and
 * a sync script that deletes those is a content shredder.
 */
async function reportOrphans() {
  if (DRY) return;

  const known = new Set(
    subjects.flatMap((s) => s.channels.map((c) => `${s.slug}/${c.slug}`)),
  );

  const { data } = await db
    .from("documents")
    .select("scope, slug")
    .eq("collection", "channel");

  const orphans = (data ?? [])
    .map((r) => `${r.scope}/${r.slug}`)
    .filter((k) => !known.has(k));

  if (orphans.length) {
    console.log(`\nIn Postgres but not in git (left alone):\n  ${orphans.join("\n  ")}`);
  }
}

console.log(DRY ? "Dry run, nothing written.\n" : "");
await syncNotebooks();
await syncThreads();
await syncTopics();
await reportOrphans();
console.log(DRY ? "\nNothing was written." : "\nDone. Postgres is now the source of truth.");
