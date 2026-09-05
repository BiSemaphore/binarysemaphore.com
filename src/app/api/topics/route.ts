import { NextResponse } from "next/server";
import {
  countCovered,
  countTopics,
  groups,
  topicState,
} from "@/lib/learn/topics";

/**
 * GET /api/topics
 *
 * The whole tree as JSON.
 *
 * The pages do not use this. They read `src/lib/learn/topics.ts` directly and
 * server-render, because a tree fetched after hydration is invisible to search
 * and a student stuck at midnight finds us through search. This endpoint exists
 * for anything outside the app that wants the same data.
 *
 * `state` is derived here rather than stored, so a consumer cannot see a topic
 * claiming coverage the tree does not actually have.
 */
export function GET() {
  const body = {
    groups: groups.map((group) => ({
      slug: group.slug,
      name: group.name,
      mark: group.mark,
      tagline: group.tagline,
      topics: group.topics.map((topic) => ({
        slug: topic.slug,
        title: topic.title,
        blurb: topic.blurb,
        state: topicState(topic),
        reference: topic.reference ?? null,
        notebook: topic.notebook ?? null,
        roadmap: topic.roadmap ?? null,
      })),
    })),
    counts: {
      groups: groups.length,
      topics: countTopics(),
      covered: countCovered(),
    },
  };

  return NextResponse.json(body, {
    // The tree only changes on deploy, so it is safe to cache hard at the edge
    // while letting a stale copy serve while it revalidates.
    headers: {
      "cache-control":
        "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
