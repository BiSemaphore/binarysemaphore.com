import { headers } from "next/headers";
import { parseHost } from "@/lib/subdomains";

/**
 * "" on the admin subdomain, "/admin" everywhere else.
 *
 * The same tree is reachable as `admin.binarysemaphore.com/threads` and as
 * `/admin/threads` in dev or on a preview URL, so links ask for the base rather
 * than hard-coding either.
 */
export async function adminBase(): Promise<string> {
  const host = (await headers()).get("host") ?? "";
  return parseHost(host).sub === "admin" ? "" : "/admin";
}
