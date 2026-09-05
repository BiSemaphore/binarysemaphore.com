import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import {
  allTopics,
  assertTree,
  countCovered,
  countTopics,
  getGroup,
  getTopic,
  groups,
  topicState,
} from "@/lib/learn/topics";
import { notebooks } from "@/lib/learn";
import { roadmaps } from "@/lib/learn/roadmaps";

const doc = readFileSync(path.join(process.cwd(), "docs/topics.md"), "utf8");

describe("the topic tree", () => {
  it("holds its invariants", () => {
    expect(() => assertTree()).not.toThrow();
  });

  it("has flat, url-safe, unique slugs", () => {
    const slugs = allTopics().map((t) => t.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("resolves every topic by slug, and nothing else", () => {
    for (const topic of allTopics()) {
      expect(getTopic(topic.slug)?.topic.title).toBe(topic.title);
    }
    expect(getTopic("not-a-topic")).toBeUndefined();
  });

  it("gives every group a distinct two-letter rail mark", () => {
    const marks = groups.map((g) => g.mark);
    expect(new Set(marks).size).toBe(marks.length);
    for (const mark of marks) expect(mark).toMatch(/^[A-Z]{2}$/);
    for (const group of groups) {
      expect(getGroup(group.slug)?.name).toBe(group.name);
    }
  });
});

/**
 * The point of the state field is that the UI never implies coverage we do not
 * have, so a topic pointing at a notebook or roadmap that does not exist is
 * worse than one pointing at nothing.
 */
describe("coverage claims", () => {
  const notebookSlugs = new Set(notebooks.map((n) => n.slug));
  const roadmapSlugs = new Set(roadmaps.map((r) => r.slug));

  it("only points at notebooks and roadmaps that exist", () => {
    for (const topic of allTopics()) {
      if (topic.notebook) expect(notebookSlugs).toContain(topic.notebook);
      if (topic.roadmap) expect(roadmapSlugs).toContain(topic.roadmap);
    }
  });

  it("derives state from what is actually linked", () => {
    for (const topic of allTopics()) {
      const state = topicState(topic);
      if (state === "soon") {
        expect(topic.notebook).toBeUndefined();
        expect(topic.roadmap).toBeUndefined();
      } else {
        expect(topic.notebook ?? topic.roadmap).toBeTruthy();
      }
    }
  });

  it("uses https for every reference it does declare", () => {
    for (const topic of allTopics()) {
      if (!topic.reference) continue;
      expect(topic.reference.href).toMatch(/^https:\/\//);
      expect(topic.reference.label.length).toBeGreaterThan(0);
    }
  });
});

/**
 * docs/topics.md calls its own table canonical. That is only true if something
 * checks, so this is that check: the doc and the data have to agree on the
 * shape of the tree and on how much of it is actually written.
 */
describe("docs/topics.md agrees with the data", () => {
  it("lists every topic slug", () => {
    for (const topic of allTopics()) {
      expect(doc).toContain(`\`${topic.slug}\``);
    }
  });

  it("names every group", () => {
    for (const group of groups) {
      expect(doc).toContain(`**${group.name}**`);
    }
  });

  it("states the real counts", () => {
    expect(doc).toContain(`${countTopics()} topics in ${groups.length} groups`);
    expect(doc).toContain(
      `${countTopics() - countCovered()} of the ${countTopics()}`,
    );
  });
});
