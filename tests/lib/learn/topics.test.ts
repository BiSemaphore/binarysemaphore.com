import { describe, it, expect } from "vitest";
import {
  allChannels,
  assertTree,
  channelState,
  countChannels,
  countCovered,
  getChannel,
  getSubject,
  subjects,
} from "@/lib/learn/topics";
import { notebooks } from "@/lib/learn";
import { roadmaps } from "@/lib/learn/roadmaps";

describe("the topic tree", () => {
  it("holds its invariants", () => {
    expect(() => assertTree()).not.toThrow();
  });

  it("gives every subject a unique, url-safe slug", () => {
    const slugs = subjects.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("gives every channel a url-safe slug, unique inside its subject", () => {
    for (const subject of subjects) {
      const slugs = subject.channels.map((c) => c.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
      for (const slug of slugs)
        expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("resolves subjects and channels, and nothing else", () => {
    for (const { subject, channel } of allChannels()) {
      expect(getChannel(subject.slug, channel.slug)?.channel.title).toBe(
        channel.title,
      );
    }
    expect(getSubject("not-a-subject")).toBeUndefined();
    expect(getChannel("java", "not-a-channel")).toBeUndefined();
    expect(getChannel("not-a-subject", "interview-questions")).toBeUndefined();
  });

  it("gives every subject at least one channel, since a subject redirects to its first", () => {
    for (const subject of subjects) {
      expect(subject.channels.length).toBeGreaterThan(0);
    }
  });
});

/**
 * The point of the whole rework: channels are situations, not syllabus entries.
 * A name that could head a textbook chapter is the wrong name.
 */
describe("channel names are situations, not chapters", () => {
  it("never numbers a channel", () => {
    for (const { subject, channel } of allChannels()) {
      expect(
        /^\d|^(chapter|unit|part|lesson|module|week)-/.test(channel.slug),
        `${subject.slug}/${channel.slug} reads like a syllabus entry`,
      ).toBe(false);
    }
  });

  it("never calls a channel an introduction or basics", () => {
    for (const { subject, channel } of allChannels()) {
      expect(
        /(^|-)(intro|introduction|basics|fundamentals|getting-started)(-|$)/.test(
          channel.slug,
        ),
        `${subject.slug}/${channel.slug} is beginner-ladder naming`,
      ).toBe(false);
    }
  });
});

describe("coverage claims", () => {
  const notebookSlugs = new Set(notebooks.map((n) => n.slug));
  const roadmapSlugs = new Set(roadmaps.map((r) => r.slug));

  it("only points at notebooks and roadmaps that exist", () => {
    for (const { channel } of allChannels()) {
      if (channel.notebook) expect(notebookSlugs).toContain(channel.notebook);
      if (channel.roadmap) expect(roadmapSlugs).toContain(channel.roadmap);
    }
  });

  it("derives state from what is actually linked", () => {
    for (const { channel } of allChannels()) {
      if (channelState(channel) === "soon") {
        expect(channel.notebook).toBeUndefined();
        expect(channel.roadmap).toBeUndefined();
      } else {
        expect(channel.notebook ?? channel.roadmap).toBeTruthy();
      }
    }
  });

  it("counts what it claims to count", () => {
    expect(countChannels()).toBe(allChannels().length);
    expect(countCovered()).toBeLessThanOrEqual(countChannels());
  });

  it("uses https for every reference it declares", () => {
    for (const { channel } of allChannels()) {
      if (!channel.reference) continue;
      expect(channel.reference.href).toMatch(/^https:\/\//);
      expect(channel.reference.label.length).toBeGreaterThan(0);
    }
  });
});
