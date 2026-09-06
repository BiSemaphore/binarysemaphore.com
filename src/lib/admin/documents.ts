import "server-only";
import { revalidateTag } from "next/cache";
import { compile } from "@mdx-js/mdx";
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

  // Both tags, because a channel and a thread are the same table and the reader
  // caches them separately. Missing one leaves a page stale with no clue why.
  //
  // The second argument is a Next 16 wrinkle worth knowing: `cacheComponents`
  // is off, so the previous caching model applies and its guide still shows
  // `revalidateTag('user')` with one argument, but the shipped type declares
  // the cache profile as required. "max" satisfies the compiler and is the
  // profile the Cache Components docs recommend, so this call is correct under
  // either model and will not need changing when that flag is turned on.
  revalidateTag("threads", "max");
  revalidateTag("topics", "max");
  return { ok: true };
}
