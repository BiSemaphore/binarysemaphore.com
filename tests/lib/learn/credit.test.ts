import { describe, it, expect } from "vitest";
import { lectureSeries } from "@/lib/learn";

/**
 * What is left of the attribution suite.
 *
 * It used to walk every notebook's `sources` and assert a real YouTube url, a
 * title worth reading and a duration in the notebooks' own "2h45" format. Those
 * are rows now, editable in the admin, so the rule moved to where the row is:
 * the `sources_are_real` constraint, backed by `public.sources_are_valid`.
 * Verified there by behaviour: a non-YouTube url and a one-word title are both
 * refused, and a notebook with no sources at all is still allowed.
 *
 * The lecture series itself is configuration, not content. Nobody edits it in
 * the admin, so it stays here and stays tested here.
 */
describe("source attribution", () => {
  it("names the author and links both the channel and the playlist", () => {
    expect(lectureSeries.author.length).toBeGreaterThan(0);
    expect(lectureSeries.authorUrl).toMatch(
      /^https:\/\/www\.youtube\.com\/@[A-Za-z0-9_.-]+$/,
    );
    expect(lectureSeries.playlistUrl).toMatch(
      /^https:\/\/www\.youtube\.com\/playlist\?list=/,
    );
  });
});
