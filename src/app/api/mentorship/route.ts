import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Matches the bounds in the insert policy, so the two cannot drift apart. */
const LIMITS = { name: 200, email: 320, college: 200, paper: 200, stuck: 5000 };

/**
 * POST /api/mentorship
 *
 * A student asking for a one-to-one session. Mirrors POST /api/contact:
 * validate, then insert. The policy on `mentorship_requests` is the boundary;
 * the checks here exist so a person gets a useful message rather than a
 * database error.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
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
      { error: "Name, email, the paper and where you are stuck are all needed." },
      { status: 400 },
    );
  }
  if (!EMAIL.test(email)) {
    return NextResponse.json(
      { error: "That email does not look right." },
      { status: 400 },
    );
  }
  for (const [field, value] of Object.entries({ name, email, college, paper, stuck })) {
    if (value.length > LIMITS[field as keyof typeof LIMITS]) {
      return NextResponse.json(
        { error: `That ${field} is too long.` },
        { status: 400 },
      );
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("mentorship_requests")
    .insert({ name, email, college: college || null, paper, stuck });

  if (error) {
    console.error("mentorship insert failed:", error.message);
    return NextResponse.json(
      { error: "Could not send that. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
