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

  // Gone once threads have moved, which is the point: after the one-way sync
  // the files are deleted and Postgres is the source of truth. Left in place so
  // this script still runs for the parts that have not moved yet.
  if (!fs.existsSync(dir)) {
    console.log("threads          already moved, nothing on disk");
    return;
  }

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

// syncTopics() lived here. The tree moved in one direction and the literal it
// read is gone, which is the point of a one-way sync: subjects and channels are
// edited in the admin now, and re-seeding them from a file that no longer
// exists would be the two-way sync that loses content.

console.log(DRY ? "Dry run, nothing written.\n" : "");
await syncNotebooks();
await syncThreads();
console.log(DRY ? "\nNothing was written." : "\nDone. Postgres is now the source of truth.");
