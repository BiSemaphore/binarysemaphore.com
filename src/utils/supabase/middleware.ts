import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Builds the base response the refreshed session cookies are attached to.
 * Defaults to `NextResponse.next()` (continue to the matched route), but the
 * proxy passes a `rewrite` factory for app subdomains, so the session can be
 * refreshed onto a rewritten response too.
 */
type ResponseFactory = (request: NextRequest) => NextResponse;

const passThrough: ResponseFactory = (request) =>
  NextResponse.next({ request });

/**
 * Refreshes the Supabase auth session and forwards the updated cookies. No-ops
 * when Supabase is not configured. Called from `src/proxy.ts`.
 *
 * For anonymous visitors (no auth cookie) this does no network work, so it is
 * cheap on a mostly-static site; it only matters once users can sign in.
 *
 * `makeResponse` lets the caller choose the response type (continue vs rewrite)
 * while still receiving the refreshed cookies.
 */
export async function updateSession(
  request: NextRequest,
  makeResponse: ResponseFactory = passThrough,
) {
  let response = makeResponse(request);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = makeResponse(request);
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Keep the session fresh. Do not run other code between creating the client
  // and this call.
  await supabase.auth.getUser();

  return response;
}
