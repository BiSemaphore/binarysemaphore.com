import { permanentRedirect, notFound } from "next/navigation";
import { getNotebook } from "@/lib/learn";
import { getSections } from "@/lib/learn/book";
import { learnBase } from "@/lib/learn/paths";

type Params = { slug: string; section: string };

/**
 * The old one-page-per-section URL.
 *
 * A notebook is now read continuously at `/<slug>/read`, so these 387 URLs
 * redirect to their anchor rather than 404ing. Permanent, because the section
 * page is not coming back and search engines should follow the move.
 */
export default async function SectionRedirect({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug, section } = await params;

  if (!getNotebook(slug)) notFound();
  if (!getSections(slug).some((s) => s.slug === section)) notFound();

  const base = await learnBase();
  permanentRedirect(`${base}/notebooks/${slug}/read#${section}`);
}
