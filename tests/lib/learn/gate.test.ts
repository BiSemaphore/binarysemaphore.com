import { describe, it, expect } from "vitest";
import { splitAtGate, teaser } from "@/lib/learn/book";
import type { Section } from "@/lib/learn/parse";

function section(...markdown: string[]): Section {
  return {
    number: "1",
    title: "A section",
    slug: "1-a-section",
    part: 0,
    blocks: markdown.map((m) => ({ kind: "prose", markdown: m })),
  };
}

const para = (n: number) => "word ".repeat(n).trim();

describe("splitAtGate", () => {
  it("always shows something and always holds something back", () => {
    const multiParagraph = section(`${para(30)}\n\n${para(30)}\n\n${para(30)}`);
    for (const s of [multiParagraph, section(para(50), para(50)),
                     section(para(10), para(300), para(300))]) {
      const { preview, gated } = splitAtGate(s);
      expect(preview.length).toBeGreaterThan(0);
      expect(gated.length).toBeGreaterThan(0);
      expect(preview.length + gated.length).toBeGreaterThanOrEqual(
        s.blocks.length,
      );
    }
  });

  // The bug this replaced: a fixed block count opened a short section fully.
  it("does not give away most of a short section", () => {
    const s = section(para(20), para(20), para(20));
    const { preview } = splitAtGate(s);
    const shown = preview.reduce(
      (n, b) => n + (b.kind === "prose" ? b.markdown.length : 0),
      0,
    );
    const total = s.blocks.reduce(
      (n, b) => n + (b.kind === "prose" ? b.markdown.length : 0),
      0,
    );
    expect(shown / total).toBeLessThan(0.7);
  });

  it("opens more of a long section than of a short one, proportionally", () => {
    const long = splitAtGate(section(...Array(10).fill(para(100))));
    expect(long.preview.length).toBeGreaterThan(1);
    expect(long.gated.length).toBeGreaterThan(4);
  });

  // A one-block section still has to hold something back, so it is split at a
  // paragraph break rather than handed over whole.
  it("splits inside the block when a section is only one block long", () => {
    const s = section(`${para(30)}\n\n${para(30)}\n\n${para(30)}`);
    const { preview, gated } = splitAtGate(s);
    expect(preview).toHaveLength(1);
    expect(gated).toHaveLength(1);
    expect(gated[0].kind).toBe("prose");
  });

  it("leaves a single unsplittable block free rather than showing nothing", () => {
    const s = section("One paragraph, no break.");
    const { preview } = splitAtGate(s);
    expect(preview).toHaveLength(1);
  });

  it("keeps the blocks in order and loses none", () => {
    const s = section("a", "b", "c", "d");
    const { preview, gated } = splitAtGate(s);
    expect([...preview, ...gated]).toEqual(s.blocks);
  });
});

describe("teaser", () => {
  // The whole point: the rest of the section must not be in the page. A CSS
  // fade over a fully rendered block would ship it to anyone opening view-source.
  it("truncates rather than returning the whole block", () => {
    const long = para(400);
    const out = teaser([{ kind: "prose", markdown: long }])!;
    expect(out.length).toBeLessThan(200);
    expect(long.length).toBeGreaterThan(1000);
  });

  it("cuts on a word boundary", () => {
    const out = teaser([{ kind: "prose", markdown: para(400) }])!;
    expect(out.endsWith(" ")).toBe(false);
    expect(out).not.toMatch(/wor$/);
  });

  it("returns a short block unchanged", () => {
    expect(teaser([{ kind: "prose", markdown: "Short." }])).toBe("Short.");
  });

  it("is null when nothing gated is prose", () => {
    expect(
      teaser([{ kind: "code", language: "sql", code: "select 1;" }]),
    ).toBeNull();
    expect(teaser([])).toBeNull();
  });
});
