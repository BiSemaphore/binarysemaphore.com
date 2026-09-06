import { describe, it, expect } from "vitest";
import {
  editions,
  formatBytes,
  objectKey,
  type Notebook,
} from "@/lib/learn";

/**
 * What is left of the catalog suite.
 *
 * It used to assert over the ten notebooks as a literal: unique slugs, url-safe
 * slugs, a page count, sane editions, no em dashes in the copy. The catalog is
 * rows now, so those moved to where the rows are:
 *
 *   unique, url-safe slug   id is public.slug, and it is the primary key
 *   a real published book   published_notebooks_are_real (pages > 0, blurb set)
 *   honest attribution      sources_are_real, via public.sources_are_valid
 *
 * All three were verified by behaviour rather than by reading: a published
 * notebook claiming 0 pages, a non-YouTube source url and a one-word lecture
 * title are each refused, and a notebook with no sources is still allowed.
 *
 * What stays here is the pure part: the two functions that turn a row into
 * something a page can show, and the editions, which are configuration.
 */

const notebook = (over: Partial<Notebook> = {}): Notebook => ({
  slug: "postgres",
  series: "System Design Notebook",
  number: "05",
  title: "Postgres",
  subtitle: "s",
  blurb: "b",
  pages: 71,
  contents: ["1. One", "2. Two"],
  assets: { reading: { file: "Postgres-Reading.pdf", bytes: 3_700_000 } },
  sources: [],
  ...over,
});

describe("objectKey", () => {
  // The first path segment is what the bucket's RLS policy matches against a
  // notebook id, so getting it wrong does not 404, it denies.
  it("puts the slug first, which is what the storage policy checks", () => {
    expect(objectKey(notebook(), "reading")).toBe(
      "postgres/Postgres-Reading.pdf",
    );
  });

  it("returns null for an edition that was never built", () => {
    expect(objectKey(notebook(), "tablet")).toBeNull();
    expect(objectKey(notebook(), "print")).toBeNull();
  });
});

describe("formatBytes", () => {
  it("reads as a download label, not as a byte count", () => {
    expect(formatBytes(3_717_210)).toBe("3.7 MB");
    expect(formatBytes(7_695_122)).toBe("7.7 MB");
  });
});

describe("editions", () => {
  it("offers reading first, because it is the default download", () => {
    expect(editions[0].id).toBe("reading");
  });

  it("describes every cut, since the description is the only way to choose", () => {
    for (const edition of editions) {
      expect(edition.name.length, edition.id).toBeGreaterThan(0);
      expect(edition.description.length, edition.id).toBeGreaterThan(20);
    }
  });
});
