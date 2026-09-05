import { NextResponse } from "next/server";
import { getNotebook } from "@/lib/learn";
import { getRoadmap } from "@/lib/learn/roadmaps";
import { getTopic, topicState } from "@/lib/learn/topics";

/**
 * GET /api/topics/[slug]
 *
 * One topic, with its group and whatever we actually have behind it resolved to
 * something a consumer can follow. Same honesty rule as the page: a topic with
 * nothing written returns `state: "soon"` and nulls, never a fabricated link.
 *
 * Prose is deliberately not included. It is MDX compiled into the page, and
 * serialising it here would create a second rendering path to keep in step. If
 * an external consumer ever needs the body, that is the moment to decide how it
 * should be represented, not now.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const found = getTopic(slug);

  if (!found) {
    return NextResponse.json({ error: "No such topic" }, { status: 404 });
  }

  const { topic, group } = found;
  const notebook = topic.notebook ? getNotebook(topic.notebook) : undefined;
  const roadmap = topic.roadmap ? getRoadmap(topic.roadmap) : undefined;

  return NextResponse.json(
    {
      slug: topic.slug,
      title: topic.title,
      blurb: topic.blurb,
      state: topicState(topic),
      group: { slug: group.slug, name: group.name },
      reference: topic.reference ?? null,
      notebook: notebook
        ? { slug: notebook.slug, title: notebook.title, pages: notebook.pages }
        : null,
      roadmap: roadmap ? { slug: roadmap.slug, title: roadmap.title } : null,
    },
    {
      headers: {
        "cache-control":
          "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
