---
name: seo-metadata
description: How Binary Semaphore handles SEO/metadata in the Next.js App Router (titles, descriptions, OG, canonicals). Use when adding a page or changing metadata so every route stays SEO-consistent.
---

# SEO & metadata

Uses the Next.js App Router Metadata API. No third-party SEO library.

## Root defaults (`src/app/layout.tsx`)

The root `metadata` sets the baseline:

- `metadataBase` (the production URL) so relative OG/canonical URLs resolve.
- `title.template` = `"%s · Binary Semaphore"` with a `title.default`.
- Default `description`, `keywords`, `openGraph` (type/url/siteName/images),
  `twitter` (`summary_large_image`), `robots` (index/follow), and a canonical
  `alternates`.
- Default OG image: `public/og.png` (1200x630).

## Per-page metadata

- **Static pages** (`/about`, `/services`, `/contact`, etc.): export a
  `const metadata: Metadata` with a `title` (the template adds the suffix), a
  `description`, and `alternates: { canonical: "/path" }`.
- **Dynamic routes** (`/projects/[slug]`, `/team/[slug]`, `/threads/[slug]`):
  export `async function generateMetadata({ params })` and build title,
  description, keywords, `openGraph`, and the canonical from the data.
- **Threads** generate a per-post OG image via the `opengraph-image` route.

## Checklist for a new page

1. Export `metadata` (or `generateMetadata` for dynamic routes) with a `title`
   and `description`.
2. Set `alternates.canonical` to the route path.
3. For content-driven pages, derive `openGraph`/`twitter` from the real data.

## Not present yet (add if SEO grows)

There is no `src/app/sitemap.ts` or `src/app/robots.ts`. New pages are therefore
**not** in an XML sitemap. To add them, create `app/sitemap.ts` and
`app/robots.ts` using the `MetadataRoute` helpers and list the routes (pull
dynamic slugs from `getAllThreads`, `projects`, `team`).
