import type { MetadataRoute } from "next";

/** Crawl everything public; keep the admin, auth, account and API out. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/auth/", "/account", "/login"] },
    sitemap: "https://binarysemaphore.com/sitemap.xml",
  };
}
