import "server-only";
import { compile } from "@mdx-js/mdx";
import { isSituationalSlug } from "@/lib/learn/topics";
import { createClient } from "@/utils/supabase/server";

/**
 * Reading and writing documents as an admin.
 *
 * Every call uses the admin's own session, never the service key. That is
 * deliberate: RLS is the boundary, so the safest thing this file can do is be
 * subject to it. If a write here succeeds for someone who is not in
 * `private.admins`, the policy is broken and we want to find that out, not to
 * have bypassed it.
 */

export type DocumentRow = {
  id: string;
  collection: "thread" | "channel" | "notebook_section";
  scope: string | null;
  slug: string;
  title: string;
  summary: string | null;
  body_mdx: string | null;
  status: "draft" | "published" | "archived";
  origin: "admin" | "sync";
  published_at: string | null;
  updated_at: string;
  reading_minutes: number;
};

const COLUMNS =
  "id, collection, scope, slug, title, summary, body_mdx, status, origin, published_at, updated_at, reading_minutes";

/** Never selects body_mdx: a list of 93 channels does not need 93 bodies. */
const LIST_COLUMNS =
  "id, collection, scope, slug, title, status, origin, published_at, updated_at, reading_minutes";

export async function listDocuments(
  collection: DocumentRow["collection"],
): Promise<Omit<DocumentRow, "body_mdx" | "summary">[]> {
  const db = await createClient();
  const { data, error } = await db
    .from("documents")
    .select(LIST_COLUMNS)
    .eq("collection", collection)
    .order("published_at", { ascending: false, nullsFirst: true })
    .order("updated_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Omit<DocumentRow, "body_mdx" | "summary">[];
}

export async function getDocument(id: string): Promise<DocumentRow | null> {
  const db = await createClient();
  const { data } = await db
    .from("documents")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  return (data as DocumentRow | null) ?? null;
}

export type SaveResult = { ok: true } | { ok: false; error: string };

/**
 * Save one document.
 *
 * The MDX is compiled here first and the save refused if it fails. That check
 * is the mitigation for the one real cost of leaving git: a compile error used
 * to fail a build, and now it would break a live page. Compiling on save turns
 * it back into an error message, and the last good version stays live because
 * nothing was written.
 *
 * The `published_has_a_body` constraint is the backstop, not this function. It
 * refuses to store a published document with no body no matter which code path
 * asks, including a future one that forgets to check.
 */
export async function saveDocument(
  id: string,
  fields: {
    title: string;
    summary: string;
    body: string;
    status: DocumentRow["status"];
  },
): Promise<SaveResult> {
  const body = fields.body.trim();

  if (fields.status === "published" && !body) {
    return { ok: false, error: "A published page needs a body." };
  }

  if (body) {
    try {
      await compile(body);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, error: `The MDX does not compile: ${message}` };
    }
  }

  const db = await createClient();

  // published_at is set on the FIRST publish only. Stamping it on every save
  // would reorder the archive every time a typo is fixed, which is how a
  // three-month-old post ends up at the top of the list.
  const { data: current } = await db
    .from("documents")
    .select("published_at")
    .eq("id", id)
    .maybeSingle();

  const firstPublish =
    fields.status === "published" && !current?.published_at;

  const { error } = await db
    .from("documents")
    .update({
      title: fields.title.trim(),
      summary: fields.summary.trim() || null,
      body_mdx: body || null,
      status: fields.status,
      ...(firstPublish ? { published_at: new Date().toISOString() } : {}),
    })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  // No revalidateTag: reader pages hold no cache to clear. See the note at the
  // top of src/lib/threads.ts for the measurements behind that.
  return { ok: true };
}


export type CreateResult = { ok: true; id: string } | { ok: false; error: string };

/**
 * Create a thread or a channel.
 *
 * Everything this checks, the database also checks, and the database is the
 * rule: the `slug` domain rejects a bad URL, `channel_slugs_are_situations`
 * rejects a syllabus name, `unique nulls not distinct (collection, scope, slug)`
 * rejects a duplicate, and `is_admin()` on the insert policy rejects everyone
 * else. The checks here exist so a person gets a sentence instead of a
 * constraint name.
 *
 * A new document is always a draft. There is no "create and publish": a page is
 * published from the editor, once it has something on it, and
 * `published_has_a_body` would refuse it anyway.
 */
export async function createDocument(fields: {
  collection: "thread" | "channel";
  scope: string | null;
  slug: string;
  title: string;
}): Promise<CreateResult> {
  const slug = fields.slug.trim().toLowerCase();
  const title = fields.title.trim();

  if (!title) return { ok: false, error: "It needs a title." };

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 80) {
    return {
      ok: false,
      error:
        "The slug has to be lowercase words joined by single hyphens, and it is the URL, so it is permanent.",
    };
  }

  if (fields.collection === "channel") {
    if (!fields.scope) return { ok: false, error: "Pick a subject." };
    if (!isSituationalSlug(slug)) {
      return {
        ok: false,
        error:
          "Channels are named after situations, not syllabus steps. No numbers, no intro, no basics: name what is going wrong when someone opens it.",
      };
    }
  }

  const db = await createClient();

  const { data, error } = await db
    .from("documents")
    .insert({
      collection: fields.collection,
      scope: fields.collection === "channel" ? fields.scope : null,
      slug,
      title,
      status: "draft",
      origin: "admin",
    })
    .select("id")
    .single();

  if (error) {
    // 23505 is the unique constraint, and it is the one worth translating:
    // "duplicate key value violates unique constraint" tells a writer nothing.
    return {
      ok: false,
      error:
        error.code === "23505"
          ? "That slug is already taken here."
          : error.message,
    };
  }

  // The satellite has to follow the document: a trigger asserts it agrees with
  // documents.scope, so it cannot be written first.
  const satellite =
    fields.collection === "thread"
      ? db.from("thread_meta").insert({ document_id: data.id })
      : db
          .from("channel_meta")
          .insert({ document_id: data.id, subject: fields.scope });

  const { error: satError } = await satellite;
  if (satError) return { ok: false, error: satError.message };

  return { ok: true, id: data.id };
}
