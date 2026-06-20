import { NextResponse } from "next/server";
import { createClient, isSupabaseConfigured } from "@/utils/supabase/server";

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * POST /api/contact
 * A worked example of writing to Supabase from a Route Handler. Validates a
 * contact submission and inserts it into the `contact_messages` table using the
 * server-only service-role client. See supabase/schema.sql for the table.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
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

  const supabase = await createClient();
  const { error } = await supabase
    .from("contact_messages")
    .insert({ name, email, message });

  if (error) {
    console.error("contact insert failed:", error.message);
    return NextResponse.json(
      { error: "Could not save your message. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
