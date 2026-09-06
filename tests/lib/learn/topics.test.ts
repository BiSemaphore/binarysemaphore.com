import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import {
  channelState,
  isSituationalSlug,
  SYLLABUS_NAMING,
  LADDER_NAMING,
  type Channel,
} from "@/lib/learn/topics";

/**
 * The tree used to be a literal in this file's subject, and this suite
 * asserted over it: unique slugs, url-safe slugs, no beginner-ladder naming,
 * no coverage claim without something behind it.
 *
 * Channels are rows now, edited in the admin, so a test over a TypeScript file
 * cannot see them. Every one of those invariants moved into the schema, which
 * is a stronger place for them: they now hold for a channel typed into a form
 * at midnight, which a vitest never could.
 *
 *   unique slug per subject  unique nulls not distinct (collection, scope, slug)
 *   url-safe slug            the public.slug domain
 *   situational naming       the channel_slugs_are_situations constraint
 *   notebook actually exists notebook_id references public.notebooks
 *
 * What is left here is what is still ours: the derived state, and the fact that
 * the admin's error message agrees with the constraint that will reject the row.
 */

const channel = (over: Partial<Channel> = {}): Channel => ({
  slug: "what-breaks-in-production",
  title: "What breaks in production",
  blurb: "b",
  written: false,
  ...over,
});

describe("channelState", () => {
  it("claims a notebook only when one is linked", () => {
    expect(channelState(channel({ notebook: "postgres" }))).toBe("notebook");
  });

  it("claims a roadmap only when one is linked", () => {
    expect(channelState(channel({ roadmap: "react" }))).toBe("roadmap");
  });

  it("prefers the notebook when a channel has both", () => {
    expect(channelState(channel({ notebook: "postgres", roadmap: "react" }))).toBe(
      "notebook",
    );
  });

  it("says soon when nothing is linked, even with prose written", () => {
    expect(channelState(channel({ written: true }))).toBe("soon");
  });
});

describe("isSituationalSlug", () => {
  it("accepts a situation", () => {
    for (const slug of [
      "memory-and-gc",
      "what-breaks-in-production",
      "equals-and-hashcode",
      "viva-defence",
    ]) {
      expect(isSituationalSlug(slug), slug).toBe(true);
    }
  });

  it("rejects a syllabus entry", () => {
    for (const slug of [
      "1-introduction",
      "chapter-one",
      "unit-3-trees",
      "week-1",
      "module-2",
    ]) {
      expect(isSituationalSlug(slug), slug).toBe(false);
    }
  });

  it("rejects beginner-ladder naming", () => {
    for (const slug of [
      "intro",
      "java-basics",
      "getting-started",
      "fundamentals-of-sql",
      "introduction-to-graphs",
    ]) {
      expect(isSituationalSlug(slug), slug).toBe(false);
    }
  });
});

describe("the admin's rule and the database's rule", () => {
  // A friendly error that disagrees with the constraint is worse than none: the
  // form would accept a slug the insert then refuses, with no explanation.
  it("uses the same two patterns the migration does", () => {
    const dir = path.join(process.cwd(), "supabase/migrations");
    const sql = readdirSync(dir)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => readFileSync(path.join(dir, f), "utf8"))
      .join("\n");

    const constraint = sql.slice(sql.indexOf("channel_slugs_are_situations"));

    expect(constraint).toContain(SYLLABUS_NAMING.source.split("|^")[0]);
    expect(constraint).toContain("(chapter|unit|part|lesson|module|week)-");
    expect(constraint).toContain(LADDER_NAMING.source);
  });
});
