import { site, type TeamMember } from "@/lib/site";
import type { ThreadMeta } from "@/lib/threads";

const BASE = "https://binarysemaphore.com";

/**
 * Structured data for search engines, as a JSON-LD script tag.
 *
 * Kept to three shapes that describe real things: the studio, a thread, and a
 * team member. Nothing here claims ratings, prices or events we do not have.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe to inline once "<" is escaped, which
      // stops a title containing "</script>" from closing the tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: BASE,
    logo: `${BASE}/icon.svg`,
    description: site.tagline,
    email: site.email,
    sameAs: [site.github, site.org, site.linkedin, site.instagram].filter(Boolean),
  };
}

export function articleJsonLd(thread: ThreadMeta): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: thread.title,
    description: thread.description,
    datePublished: thread.date,
    keywords: thread.tags,
    url: `${BASE}/threads/${thread.slug}`,
    mainEntityOfPage: `${BASE}/threads/${thread.slug}`,
    image: `${BASE}/threads/${thread.slug}/opengraph-image`,
    author: { "@type": "Organization", name: site.name, url: BASE },
    publisher: {
      "@type": "Organization",
      name: site.name,
      logo: { "@type": "ImageObject", url: `${BASE}/icon.svg` },
    },
  };
}

export function personJsonLd(member: TeamMember): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: member.name,
    jobTitle: member.role,
    url: `${BASE}/team/${member.slug}`,
    ...(member.avatar ? { image: `${BASE}${member.avatar}` } : {}),
    ...(member.description ? { description: member.description } : {}),
    worksFor: { "@type": "Organization", name: site.name, url: BASE },
    sameAs: [member.linkedin, member.github].filter(Boolean),
    ...(member.education
      ? {
          alumniOf: member.education.map((e) => ({
            "@type": "EducationalOrganization",
            name: e.school,
          })),
        }
      : {}),
  };
}
