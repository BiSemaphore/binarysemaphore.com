import { NextResponse } from "next/server";
import {
  channelState,
  countChannels,
  countCovered,
  getSubjects,
} from "@/lib/learn/topics";

/**
 * GET /api/topics
 *
 * The whole tree as JSON.
 *
 * The pages do not use this. They read the same tables and server-render,
 * because a tree fetched after hydration is invisible to search and a student
 * stuck at midnight finds us through search. This endpoint exists for anything
 * outside the app that wants the same data.
 *
 * `state` is derived here rather than stored, so a consumer cannot see a channel
 * claiming coverage the tree does not actually have.
 */
export async function GET() {
  const [subjects, channels, covered] = await Promise.all([
    getSubjects(),
    countChannels(),
    countCovered(),
  ]);

  return NextResponse.json(
    {
      subjects: subjects.map((subject) => ({
        slug: subject.slug,
        name: subject.name,
        blurb: subject.blurb,
        channels: subject.channels.map((channel) => ({
          slug: channel.slug,
          title: channel.title,
          blurb: channel.blurb,
          state: channelState(channel),
          reference: channel.reference ?? null,
          notebook: channel.notebook ?? null,
          roadmap: channel.roadmap ?? null,
        })),
      })),
      counts: { subjects: subjects.length, channels, covered },
    },
    {
      headers: {
        "cache-control":
          "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
