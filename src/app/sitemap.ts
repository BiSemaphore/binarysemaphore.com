import type { MetadataRoute } from "next";
import { prerenderParams } from "@/lib/prerender";
import { projects, site, team } from "@/lib/site";
import { getAllThreads } from "@/lib/threads";

const BASE = "https://binarysemaphore.com";

/**
 * Every public page on the apex domain. The app subdomains (learn, resume,
 * root) are left out on purpose: learn is gated, resume is a tool, root is
 * the admin. Threads come from Postgres when the sitemap is built.
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

  // The sitemap is built at build time, so a database blip must degrade the
  // way every other prerender does: no threads on a preview, a loud failure
  // in production. Without this, one bad minute at Supabase fails the build.
  const threads = (await prerenderParams("sitemap threads", getAllThreads)).map((t) => ({
    url: `${BASE}/threads/${t.slug}`,
    lastModified: t.date,
    changeFrequency: "yearly" as const,
    priority: 0.7,
  }));

  return [...fixed, ...products, ...services, ...people, ...threads];
}
