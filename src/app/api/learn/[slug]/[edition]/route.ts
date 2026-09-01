import { NextResponse } from "next/server";
import { getNotebook, objectKey, editions } from "@/lib/learn";
import type { EditionId } from "@/lib/learn";
import { canRead, getAccess } from "@/lib/learn/access";
import { stampForReader } from "@/lib/learn/watermark";
import { getCurrentUser } from "@/utils/supabase/auth";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";

function isEditionId(value: string): value is EditionId {
  return editions.some((e) => e.id === value);
}

/**
 * GET /api/learn/<slug>/<edition>
 *
 * Streams one notebook PDF, stamped with who it was prepared for.
 *
 * The download is served through this route rather than by redirecting to a
 * signed URL, because the stamp has to be applied per reader. The bucket stays
 * private either way: `download()` runs as the signed-in user, and the bucket's
 * RLS policy re-checks `has_learn_access()` against the first segment of the
 * object path, so the fetch fails for a user without a live grant even if the
 * check below were wrong. See supabase/migrations/0003_learn.sql.
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
  const { data, error } = await supabase.storage.from("notebooks").download(key);

  if (error || !data) {
    return NextResponse.json(
      { error: "That file is not available right now." },
      { status: 502 },
    );
  }

  // Whatever the reader would recognise as themselves. Falls back to the user
  // id when the provider gave us no email, so a copy is always attributable.
  const user = await getCurrentUser();
  const identity = user?.email ?? user?.id ?? "an unnamed account";

  let pdf: Uint8Array;
  try {
    pdf = await stampForReader(await data.arrayBuffer(), identity);
  } catch {
    // A stamping failure must not cost an entitled reader their download.
    pdf = new Uint8Array(await data.arrayBuffer());
  }

  const fileName = notebook.assets[edition]!.file;

  return new NextResponse(pdf as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": String(pdf.byteLength),
      // Personalised, so it must never be cached by a shared cache.
      "Cache-Control": "private, no-store",
    },
  });
}
