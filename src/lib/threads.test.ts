import { describe, it, expect } from "vitest";
import {
  getAllThreads,
  getThread,
  getAllTags,
  getRelatedThreads,
  formatDate,
} from "./threads";

describe("formatDate", () => {
  it("formats an ISO date as day month year (UTC)", () => {
    expect(formatDate("2026-06-16")).toBe("16 Jun 2026");
    expect(formatDate("2026-01-01")).toBe("1 Jan 2026");
  });
});

describe("getAllThreads", () => {
  const threads = getAllThreads();

  it("returns at least one thread", () => {
    expect(threads.length).toBeGreaterThan(0);
  });

  it("sorts newest first", () => {
    const dates = threads.map((t) => t.date);
    const sorted = [...dates].sort((a, b) => (a < b ? 1 : -1));
    expect(dates).toEqual(sorted);
  });

  it("gives every thread the required fields", () => {
    for (const t of threads) {
      expect(t.slug).toBeTruthy();
      expect(t.title).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(t.readingMinutes).toBeGreaterThan(0);
      expect(Array.isArray(t.tags)).toBe(true);
    }
  });

  it("has unique slugs", () => {
    const slugs = threads.map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe("getThread", () => {
  it("finds a thread by slug", () => {
    const first = getAllThreads()[0];
    expect(getThread(first.slug)?.title).toBe(first.title);
  });

  it("returns undefined for an unknown slug", () => {
    expect(getThread("does-not-exist")).toBeUndefined();
  });
});

describe("getAllTags", () => {
  it("returns unique, alphabetically sorted tags", () => {
    const tags = getAllTags();
    expect(tags.length).toBeGreaterThan(0);
    expect(new Set(tags).size).toBe(tags.length);
    expect(tags).toEqual([...tags].sort());
  });
});

describe("getRelatedThreads", () => {
  it("excludes the current thread and only returns tag matches", () => {
    const first = getAllThreads()[0];
    const related = getRelatedThreads(first.slug);
    expect(related.every((r) => r.slug !== first.slug)).toBe(true);
    for (const r of related) {
      expect(r.tags.some((tag) => first.tags.includes(tag))).toBe(true);
    }
  });

  it("returns an empty array for an unknown slug", () => {
    expect(getRelatedThreads("does-not-exist")).toEqual([]);
  });
});
