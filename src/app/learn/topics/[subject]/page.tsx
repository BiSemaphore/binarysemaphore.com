import { notFound, redirect } from "next/navigation";
import { getSubject, getSubjects } from "@/lib/learn/topics";
import { learnBase } from "@/lib/learn/paths";

export async function generateStaticParams() {
  return (await getSubjects()).map((subject) => ({ subject: subject.slug }));
}

/**
 * A subject on its own has no page: it is a rail item, and picking one should
 * land you in a channel the way picking a Discord server opens a channel rather
 * than showing an empty room.
 *
 * The first channel is the entry point, so subjects order their channels with
 * the most useful one first.
 */
export default async function SubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject: slug } = await params;
  const subject = await getSubject(slug);
  if (!subject || subject.channels.length === 0) notFound();

  redirect(`${await learnBase()}/topics/${subject.slug}/${subject.channels[0].slug}`);
}
