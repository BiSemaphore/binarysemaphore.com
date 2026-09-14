import type { MetadataRoute } from "next";
import { projects, site, team } from "@/lib/site";
import { getAllThreads } from "@/lib/threads";

const BASE = "https://binarysemaphore.com";

// Served on request, not at build time, so the build never touches the
// database and a new thread appears in the sitemap without a deploy.
export const dynamic = "force-dynamic";

/**
 * Every public page on the apex domain. The app subdomains (learn, resume,
 * root) are left out on purpose: learn is gated, resume is a tool, root is
 * the admin. Threads come from Postgres on each request.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixed: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/threads`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/projects`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/services`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/team`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/contact`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const products = projects
    .filter((p) => p.slug)
    .map((p) => ({ url: `${BASE}/projects/${p.slug}`, changeFrequency: "monthly" as const, priority: 0.8 }));

  const services = site.services.items.map((s) => ({
    url: `${BASE}/services/${s.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const people = team.map((m) => ({
    url: `${BASE}/team/${m.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const threads = (await getAllThreads()).map((t) => ({
    url: `${BASE}/threads/${t.slug}`,
    lastModified: t.date,
    changeFrequency: "yearly" as const,
    priority: 0.7,
  }));

  return [...fixed, ...products, ...services, ...people, ...threads];
}
