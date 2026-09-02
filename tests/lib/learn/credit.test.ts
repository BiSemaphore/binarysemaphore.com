import { describe, it, expect } from "vitest";
import { notebooks, lectureSeries } from "@/lib/learn";

/** The playlist these notebooks are built from, verified against YouTube. */
const VIDEO = /^https:\/\/www\.youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}$/;

describe("source attribution", () => {
  it("declares sources for every notebook, even when there are none", () => {
    for (const notebook of notebooks) {
      expect(Array.isArray(notebook.sources), notebook.slug).toBe(true);
    }
  });

  it("credits at least half the library to the lectures", () => {
    const credited = notebooks.filter((n) => n.sources.length > 0).length;
    expect(credited).toBeGreaterThanOrEqual(notebooks.length / 2);
  });

  it("gives every source a real video url, title and duration", () => {
    for (const notebook of notebooks) {
      for (const video of notebook.sources) {
        expect(video.url, `${notebook.slug}: ${video.title}`).toMatch(VIDEO);
        expect(video.title.length).toBeGreaterThan(5);
        expect(video.duration).toMatch(/^\d+h\d{2}$/);
      }
    }
  });

  it("never credits the same lecture twice in one notebook", () => {
    for (const notebook of notebooks) {
      const urls = notebook.sources.map((v) => v.url);
      expect(new Set(urls).size, notebook.slug).toBe(urls.length);
    }
  });

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
