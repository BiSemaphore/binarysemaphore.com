import { permanentRedirect, notFound } from "next/navigation";
import { getNotebook } from "@/lib/learn";
import { learnBase } from "@/lib/learn/paths";

type Params = { slug: string };

/** The old reader URL, before the books moved under `/notebooks`. */
export default async function ReaderRootRedirect({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  if (!getNotebook(slug)) notFound();

  permanentRedirect(`${await learnBase()}/notebooks/${slug}/read`);
}
