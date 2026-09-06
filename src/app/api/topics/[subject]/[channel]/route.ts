import { NextResponse } from "next/server";
import { getNotebook } from "@/lib/learn";
import { getRoadmap } from "@/lib/learn/roadmaps";
import { channelState, getChannel } from "@/lib/learn/topics";

/**
 * GET /api/topics/[subject]/[channel]
 *
 * One channel, with whatever we actually have behind it resolved to something a
 * consumer can follow. Same honesty rule as the page: a channel with nothing
 * written returns `state: "soon"` and nulls, never a fabricated link.
 *
 * Prose is deliberately not included. It is MDX compiled into the page, and
 * serialising it here would create a second rendering path to keep in step.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ subject: string; channel: string }> },
) {
  const { subject: subjectSlug, channel: channelSlug } = await params;
  const found = await getChannel(subjectSlug, channelSlug);

  if (!found) {
    return NextResponse.json({ error: "No such channel" }, { status: 404 });
  }

  const { subject, channel } = found;
  const notebook = channel.notebook ? await getNotebook(channel.notebook) : undefined;
  const roadmap = channel.roadmap ? getRoadmap(channel.roadmap) : undefined;

  return NextResponse.json(
    {
      slug: channel.slug,
      title: channel.title,
      blurb: channel.blurb,
      state: channelState(channel),
      subject: { slug: subject.slug, name: subject.name },
      reference: channel.reference ?? null,
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
