/**
 * Product subdomains — single place that knows the mapping between a product's
 * subdomain (e.g. `inode`) and its project slug.
 *
 * Each product is showcased at `<subdomain>.binarysemaphore.com`, served from
 * the same Next.js app via `src/proxy.ts`. The mapping is derived from the
 * `subdomain` field on `projects` in `src/lib/site.ts`, so adding a product is a
 * one-line data change there (plus DNS + a Vercel domain).
 */
import { projects } from "@/lib/site";

/** The apex domain everything hangs off. */
export const ROOT_DOMAIN = "binarysemaphore.com";

/** Hosts we treat as a "root" we own. `localhost` lets `inode.localhost:3000`
 * work in dev; only the real domain is considered production. */
const ROOTS = [ROOT_DOMAIN, "localhost"] as const;

const productsWithSubdomain = projects.filter(
  (p): p is typeof p & { slug: string; subdomain: string } =>
    Boolean(p.subdomain && p.slug),
);

/** subdomain ("inode") -> slug ("inode") */
export const subToSlug = new Map(
  productsWithSubdomain.map((p) => [p.subdomain, p.slug]),
);

/** slug ("inode") -> subdomain ("inode") */
export const slugToSub = new Map(
  productsWithSubdomain.map((p) => [p.slug, p.subdomain]),
);

/**
 * Application subdomains: full apps (auth + routes) served from this same Next
 * app, unlike showcase product subdomains which render a single project page.
 * Maps subdomain -> the route-tree base path it is served from.
 */
export const APP_SUBDOMAINS = new Map<string, string>([["resume", "/resume"]]);

/** The base path an app subdomain is served from, or null if not an app sub. */
export function appBasePath(sub: string | null): string | null {
  return sub ? (APP_SUBDOMAINS.get(sub) ?? null) : null;
}

export type ParsedHost = {
  /** The owned root the host belongs to, or null for unknown hosts (e.g.
   * Vercel preview URLs) which the proxy should leave untouched. */
  root: string | null;
  /** The subdomain label, or null when the host is the apex / www. */
  sub: string | null;
  /** True only for the real production domain. */
  isProd: boolean;
};

/** Split a request `Host` header into its owned root and subdomain. */
export function parseHost(host: string): ParsedHost {
  const h = host.replace(/:\d+$/, "").toLowerCase();
  for (const root of ROOTS) {
    if (h === root || h === `www.${root}`) {
      return { root, sub: null, isProd: root === ROOT_DOMAIN };
    }
    if (h.endsWith(`.${root}`)) {
      return {
        root,
        sub: h.slice(0, -(root.length + 1)),
        isProd: root === ROOT_DOMAIN,
      };
    }
  }
  return { root: null, sub: null, isProd: false };
}

/** Absolute canonical URL for a product's subdomain, or null if it has none. */
export function productSubdomainUrl(slug: string): string | null {
  const sub = slugToSub.get(slug);
  return sub ? `https://${sub}.${ROOT_DOMAIN}` : null;
}
