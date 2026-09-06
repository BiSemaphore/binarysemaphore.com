import { describe, it, expect } from "vitest";
import { formatDate, rankRelated, type ThreadMeta } from "@/lib/threads";

/**
 * Threads come from Postgres now, so the reads are I/O and are not unit
 * tested; the ranking rule and the date formatting are pure and are.
 *
 * The old suite asserted over the real MDX files (every thread has a
 * description, slugs are unique, sorted newest first). Those invariants moved
 * into the database, where `not null`, `unique (collection, scope, slug)` and
 * an `order by` enforce them for every row and not only the eight that
 * happened to be committed.
 */

const thread = (
  slug: string,
  date: string,
  tags: string[],
): ThreadMeta => ({
  slug,
  title: slug,
  description: slug,
  date,
  tags,
  readingMinutes: 1,
});

describe("formatDate", () => {
  it("formats an ISO date as day month year (UTC)", () => {
    expect(formatDate("2026-06-16")).toBe("16 Jun 2026");
    expect(formatDate("2026-01-01")).toBe("1 Jan 2026");
  });
});

describe("rankRelated", () => {
  const all = [
    thread("current", "2026-06-01", ["react", "rust"]),
    thread("two-shared", "2026-05-01", ["react", "rust"]),
    thread("one-shared-newer", "2026-05-20", ["react"]),
    thread("one-shared-older", "2026-04-01", ["rust"]),
    thread("unrelated", "2026-06-02", ["postgres"]),
  ];

  it("ranks by shared tags, newest first on a tie", () => {
    expect(rankRelated(all, "current").map((t) => t.slug)).toEqual([
      "two-shared",
      "one-shared-newer",
      "one-shared-older",
    ]);
  });

  it("never returns the thread itself", () => {
    expect(rankRelated(all, "current").some((t) => t.slug === "current")).toBe(
      false,
    );
  });

  it("drops threads with no shared tag", () => {
    expect(rankRelated(all, "current").some((t) => t.slug === "unrelated")).toBe(
      false,
    );
  });

  it("respects the limit", () => {
    expect(rankRelated(all, "current", 2)).toHaveLength(2);
  });

  it("returns nothing for an unknown slug", () => {
    expect(rankRelated(all, "does-not-exist")).toEqual([]);
  });

  it("returns nothing when the thread has no tags", () => {
    expect(rankRelated([...all, thread("bare", "2026-06-03", [])], "bare")).toEqual(
      [],
    );
  });
});
