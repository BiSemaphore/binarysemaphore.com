import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";
import {
  ROOT_DOMAIN,
  parseHost,
  slugToSub,
  subToSlug,
} from "@/lib/subdomains";

// Next.js 16 renamed the `middleware` file convention to `proxy`.
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { root, sub, isProd } = parseHost(request.headers.get("host") ?? "");

  // (a) On a product subdomain (e.g. inode.binarysemaphore.com).
  if (sub && subToSlug.has(sub)) {
    const slug = subToSlug.get(sub)!;

    if (pathname === "/") {
      // Serve the product's showcase page without a redirect.
      const url = request.nextUrl.clone();
      url.pathname = `/projects/${slug}`;
      const headers = new Headers(request.headers);
      // Tells the page it is a subdomain render, so its chrome links to the apex.
      headers.set("x-product-subdomain", sub);
      return NextResponse.rewrite(url, { request: { headers } });
    }

    // Anything else on the subdomain belongs to the apex. Preserve protocol and
    // port so this also works for `inode.localhost:3000` in dev.
    const origin = `${request.nextUrl.protocol}//${root}${
      request.nextUrl.port ? `:${request.nextUrl.port}` : ""
    }`;
    return NextResponse.redirect(new URL(`${pathname}${search}`, origin));
  }

  // (b) On the apex, production only: /projects/<slug> -> product subdomain, so
  // the subdomain stays the single canonical URL.
  if (root && !sub && isProd) {
    const match = pathname.match(/^\/projects\/([^/]+)\/?$/);
    if (match && slugToSub.has(match[1])) {
      return NextResponse.redirect(
        `https://${slugToSub.get(match[1])}.${ROOT_DOMAIN}${search}`,
        301,
      );
    }
  }

  // Default: refresh the Supabase session and continue.
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Run on everything except Next internals and static asset files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
