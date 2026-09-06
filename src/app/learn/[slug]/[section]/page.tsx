import { permanentRedirect, notFound } from "next/navigation";
import { getNotebook } from "@/lib/learn";
import { getSections } from "@/lib/learn/book";
import { learnBase } from "@/lib/learn/paths";

type Params = { slug: string; section: string };

/**
 * The oldest notebook URL: one page per section, before the reader became
 * continuous and before the books moved under `/notebooks`. Two moves on, so it
 * redirects straight to the anchor rather than hopping through the old path.
 */
export default async function SectionRootRedirect({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug, section } = await params;

  if (!await getNotebook(slug)) notFound();
  if (!getSections(slug).some((s) => s.slug === section)) notFound();

  permanentRedirect(`${await learnBase()}/notebooks/${slug}/read#${section}`);
}
