import { headers } from "next/headers";
import { parseHost } from "@/lib/subdomains";

/**
 * "" on the root subdomain, "/admin" everywhere else.
 *
 * The same tree is reachable as `root.binarysemaphore.com/threads` and as
 * `/admin/threads` in dev or on a preview URL, so links ask for the base rather
 * than hard-coding either. Hard-coding "/admin" would send the subdomain to
 * /admin/admin, because the proxy already rewrites "/" to "/admin" there.
 */
export async function adminBase(): Promise<string> {
  const host = (await headers()).get("host") ?? "";
  return parseHost(host).sub === "root" ? "" : "/admin";
}
