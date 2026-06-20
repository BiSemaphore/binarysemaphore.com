import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * OAuth callback. The provider redirects here with a `code`; we exchange it for
 * a session (cookies are set by the SSR client) and forward to `next`.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Behind Vercel's proxy the origin is the internal host; prefer the
      // forwarded host so the redirect lands on the public URL.
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocal = process.env.NODE_ENV === "development";
      const base =
        isLocal || !forwardedHost ? origin : `https://${forwardedHost}`;
      return NextResponse.redirect(`${base}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
