import { NextResponse } from "next/server";
import { createAdminClient, isAdminConfigured } from "@/utils/supabase/admin";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Matches the bounds in `record_inbox_message`, so the two cannot drift. */
const LIMITS = { name: 200, email: 320, college: 200, paper: 200, stuck: 5000 };

/**
 * POST /api/mentorship
 *
 * A student asking for a one-to-one session. Same shape as POST /api/contact,
 * and the same table: a contact message and a mentorship request were always
 * one entity (somebody we do not know, an email, some prose, some situational
 * detail) and are now stored as one.
 *
 * The college and the paper go in `context` rather than in columns, because we
 * display them and never query them. The moment we query one, it becomes a
 * column.
 */
export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "This form is not connected yet." },
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
  const college = String(data.college ?? "").trim();
  const paper = String(data.paper ?? "").trim();
  const stuck = String(data.stuck ?? "").trim();

  if (!name || !email || !paper || !stuck) {
    return NextResponse.json(
      {
        error: "Name, email, the paper and where you are stuck are all needed.",
      },
      { status: 400 },
    );
  }
  if (!EMAIL.test(email)) {
    return NextResponse.json(
      { error: "That email does not look right." },
      { status: 400 },
    );
  }
  for (const [field, value] of Object.entries({
    name,
    email,
    college,
    paper,
    stuck,
  })) {
    if (value.length > LIMITS[field as keyof typeof LIMITS]) {
      return NextResponse.json(
        { error: `That ${field} is too long.` },
        { status: 400 },
      );
    }
  }

  const { error } = await createAdminClient().rpc("record_inbox_message", {
    p_kind: "mentorship",
    p_name: name,
    p_email: email,
    p_body: stuck,
    p_context: { college: college || null, paper },
  });

  if (error) {
    console.error("mentorship insert failed:", error.message);
    return NextResponse.json(
      { error: "Could not send that. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
