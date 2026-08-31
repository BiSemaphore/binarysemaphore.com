/**
 * Link bases for the learn app.
 *
 * The same route tree is reachable two ways: as `learn.binarysemaphore.com/<slug>`
 * (the proxy rewrites `/` to `/learn`) and, in dev or on a preview URL, as
 * `/learn/<slug>`. Links have to work in both, so pages ask for the base rather
 * than hard-coding either one.
 */
import { headers } from "next/headers";
import { parseHost } from "@/lib/subdomains";

/** "" on the learn subdomain, "/learn" everywhere else. */
export async function learnBase(): Promise<string> {
  const host = (await headers()).get("host") ?? "";
  return parseHost(host).sub === "learn" ? "" : "/learn";
}
