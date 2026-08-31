import { NextResponse } from "next/server";
import { site } from "@/lib/site";

/**
 * GET /discord -> the current Discord invite.
 *
 * Exists so that no Discord invite code is ever baked into something we cannot
 * edit later: a printed notebook, a LinkedIn post, a README, someone else's
 * bookmark. Discord invites expire, get revoked, or move to another channel;
 * `binarysemaphore.com/discord` does not. When the invite changes, change
 * `site.discord` and every link ever shared keeps working.
 *
 * Deliberately uncached (302 + no-store) so a new invite takes effect at once
 * rather than after a CDN entry ages out.
 */
export async function GET(request: Request) {
  if (!site.discord) {
    // No invite configured: send people somewhere real rather than 404ing.
    return NextResponse.redirect(new URL("/", request.url), { status: 302 });
  }

  return NextResponse.redirect(site.discord, {
    status: 302,
    headers: { "Cache-Control": "no-store" },
  });
}
