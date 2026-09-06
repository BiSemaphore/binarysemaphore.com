import { NextResponse } from "next/server";
import { createAdminClient, isAdminConfigured } from "@/utils/supabase/admin";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * POST /api/contact
 *
 * Writes to `private.inbox`, which has no URL: the schema is not exposed to
 * PostgREST, so this cannot be done from a browser under any policy. The route
 * calls `record_inbox_message` with the service key instead, which is the only
 * grant on that function.
 *
 * The checks below exist so a person gets a useful message. The function checks
 * the same bounds again, and that is the rule.
 */
export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "Contact storage is not configured yet." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const data = body as Record<string, unknown>;
  const name = String(data.name ?? "").trim();
  const email = String(data.email ?? "").trim();
  const message = String(data.message ?? "").trim();

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "name, email and message are required." },
      { status: 400 },
    );
  }
  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  }
  if (message.length > 5000) {
    return NextResponse.json({ error: "Message is too long." }, { status: 400 });
  }

  const { error } = await createAdminClient().rpc("record_inbox_message", {
    p_kind: "contact",
    p_name: name,
    p_email: email,
    p_body: message,
  });

  if (error) {
    console.error("contact insert failed:", error.message);
    return NextResponse.json(
      { error: "Could not save your message. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
