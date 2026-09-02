import { permanentRedirect, notFound } from "next/navigation";
import { getNotebook } from "@/lib/learn";
import { learnBase } from "@/lib/learn/paths";

type Params = { slug: string };

/**
 * The old top-level notebook URL.
 *
 * `learn` is a platform now, not a library, so the books live under
 * `/notebooks`. A book slug sitting at the root would collide with any future
 * section. Permanent, so the move is followed rather than re-crawled.
 */
export default async function NotebookRootRedirect({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  if (!getNotebook(slug)) notFound();

  permanentRedirect(`${await learnBase()}/notebooks/${slug}`);
}
