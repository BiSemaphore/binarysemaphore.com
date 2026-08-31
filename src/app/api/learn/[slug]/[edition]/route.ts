import { NextResponse } from "next/server";
import { getNotebook, objectKey, editions } from "@/lib/learn";
import type { EditionId } from "@/lib/learn";
import { canRead, getAccess } from "@/lib/learn/access";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";

/** How long a download link stays valid. Long enough to click, short enough
 * that a copied URL is worthless by the time it is shared. */
const SIGNED_URL_TTL_SECONDS = 60;

function isEditionId(value: string): value is EditionId {
  return editions.some((e) => e.id === value);
}

/**
 * GET /api/learn/<slug>/<edition>
 *
 * Hands out a short-lived signed URL for one notebook PDF and redirects to it.
 *
 * This route is a convenience, not the security boundary. The bucket is private
 * and its RLS policy re-checks `has_learn_access()` against the first segment of
 * the object path, so `createSignedUrl` fails for a user without a live grant
 * even if the check below were wrong. See supabase/migrations/0003_learn.sql.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; edition: string }> },
) {
  const { slug, edition } = await params;

  const notebook = getNotebook(slug);
  if (!notebook || !isEditionId(edition)) {
    return NextResponse.json({ error: "No such notebook." }, { status: 404 });
  }

  const key = objectKey(notebook, edition);
  if (!key) {
    return NextResponse.json(
      { error: `The ${edition} edition of this notebook does not exist yet.` },
      { status: 404 },
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Downloads are not configured yet." },
      { status: 503 },
    );
  }

  const access = await getAccess(slug);
  if (!canRead(access)) {
    // 403 rather than a redirect: this is fetched directly, and a redirect to
    // an HTML page would land in the user's downloads as a .pdf full of markup.
    return NextResponse.json(
      {
        error:
          access.state === "expired"
            ? "Your access to this notebook has run out."
            : "You do not have access to this notebook.",
      },
      { status: 403 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("notebooks")
    .createSignedUrl(key, SIGNED_URL_TTL_SECONDS, {
      // Content-Disposition: attachment, with a sensible file name.
      download: notebook.assets[edition]!.file,
    });

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: "That file is not available right now." },
      { status: 502 },
    );
  }

  // 302, and never cached: the URL it points at is dead in a minute.
  return NextResponse.redirect(data.signedUrl, {
    status: 302,
    headers: { "Cache-Control": "no-store" },
  });
}
