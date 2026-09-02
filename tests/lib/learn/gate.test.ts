import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { notebooks } from "@/lib/learn";
import type { SectionEntry } from "@/lib/learn/book";

const DIR = path.join(process.cwd(), "src/content/notebooks");

const index = (slug: string): SectionEntry[] =>
  JSON.parse(readFileSync(path.join(DIR, slug, "index.json"), "utf8"));

const read = (slug: string, file: string) =>
  readFileSync(path.join(DIR, slug, file), "utf8");

/** Every section of every notebook, flattened. */
const all = notebooks.flatMap((n) =>
  index(n.slug).map((s) => ({ notebook: n.slug, ...s })),
);

describe("the generated notebook content", () => {
  it("covers every notebook in the catalog", () => {
    for (const notebook of notebooks) {
      expect(existsSync(path.join(DIR, notebook.slug)), notebook.slug).toBe(true);
      expect(index(notebook.slug).length).toBeGreaterThan(0);
    }
  });

  it("writes an mdx file for every section in the index", () => {
    for (const s of all) {
      expect(
        existsSync(path.join(DIR, s.notebook, `${s.slug}.mdx`)),
        `${s.notebook}/${s.slug}`,
      ).toBe(true);
    }
  });

  it("writes a .rest.mdx exactly when the section is gated", () => {
    for (const s of all) {
      const rest = existsSync(path.join(DIR, s.notebook, `${s.slug}.rest.mdx`));
      expect(rest, `${s.notebook}/${s.slug}`).toBe(s.gated);
    }
  });

  it("leaves no orphaned files behind", () => {
    for (const notebook of notebooks) {
      const expected = new Set(["index.json"]);
      for (const s of index(notebook.slug)) {
        expected.add(`${s.slug}.mdx`);
        if (s.gated) expected.add(`${s.slug}.rest.mdx`);
      }
      for (const file of readdirSync(path.join(DIR, notebook.slug))) {
        expect(expected, `${notebook.slug}/${file}`).toContain(file);
      }
    }
  });

  it("gives every section frontmatter the page can render from", () => {
    for (const s of all) {
      const body = read(s.notebook, `${s.slug}.mdx`);
      expect(body.startsWith("---\n"), `${s.notebook}/${s.slug}`).toBe(true);
      expect(body).toContain(`title: "`);
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("gives each notebook unique section slugs", () => {
    for (const notebook of notebooks) {
      const slugs = index(notebook.slug).map((s) => s.slug);
      expect(new Set(slugs).size, notebook.slug).toBe(slugs.length);
    }
  });
});

describe("the split between free and gated", () => {
  // The bug this guards: splitting on blank lines cut through an ASCII figure,
  // leaving an unterminated fence that breaks the MDX build.
  it("never splits a code fence across the gate", () => {
    for (const s of all) {
      for (const file of [`${s.slug}.mdx`, s.gated ? `${s.slug}.rest.mdx` : null]) {
        if (!file) continue;
        const fences = read(s.notebook, file)
          .split("\n")
          .filter((l) => l.startsWith("```")).length;
        expect(fences % 2, `${s.notebook}/${file}`).toBe(0);
      }
    }
  });

  // The bug this guards: <Term name="x"> did not match the "tag alone on a
  // line" test, so the splitter cut between its open and close tags and the MDX
  // build failed with "expected a closing tag".
  it("never splits a component block across the gate", () => {
    const TAGS = /<\/?([A-Z][A-Za-z]*)/g;
    for (const s of all) {
      for (const file of [`${s.slug}.mdx`, s.gated ? `${s.slug}.rest.mdx` : null]) {
        if (!file) continue;
        // Strip code first: a fenced sample can contain something that looks
        // like a tag (ArrayList<Row>), and MDX does not parse it either.
        const body = read(s.notebook, file)
          .replace(/```[\s\S]*?```/g, "")
          .replace(/`[^`\n]+`/g, "");
        const depth = new Map<string, number>();
        for (const [tag, name] of body.matchAll(TAGS)) {
          // Inline marks close on the same line and are always balanced.
          depth.set(name, (depth.get(name) ?? 0) + (tag.startsWith("</") ? -1 : 1));
        }
        for (const [name, n] of depth) {
          expect(n, `${s.notebook}/${file}: <${name}>`).toBe(0);
        }
      }
    }
  });

  it("never flattens a fence into a paragraph", () => {
    for (const s of all) {
      expect(read(s.notebook, `${s.slug}.mdx`)).not.toMatch(/\.[ \t]+```/);
    }
  });

  it("holds most sections back rather than giving them away", () => {
    const gated = all.filter((s) => s.gated);
    expect(gated.length / all.length).toBeGreaterThan(0.8);
  });

  // Asserted as a distribution, not per section. A handful of sections are a
  // single full-page ASCII figure with no prose to cut between, and those
  // cannot be partially gated however the splitter is written.
  it("keeps the preview a small share of the section", () => {
    const shares: number[] = [];

    for (const s of all) {
      if (!s.gated) continue;
      const free = read(s.notebook, `${s.slug}.mdx`).split("---\n")[2] ?? "";
      const rest = read(s.notebook, `${s.slug}.rest.mdx`);
      if (free.length + rest.length < 400) continue;
      shares.push(free.length / (free.length + rest.length));
    }

    expect(shares.length).toBeGreaterThan(100);

    const sorted = [...shares].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const generous = shares.filter((v) => v > 0.6).length / shares.length;

    expect(median).toBeLessThan(0.35);
    expect(generous).toBeLessThan(0.05);
  });

  it("truncates the teaser rather than carrying a whole paragraph", () => {
    for (const s of all) {
      expect(s.teaser.length, `${s.notebook}/${s.slug}`).toBeLessThanOrEqual(180);
      expect(s.teaser).not.toContain("\n");
      // Rendered as plain text, so no leftover component tags or markdown
      // syntax. A literal angle bracket is fine: `<etag>` is prose in the books
      // and React escapes it.
      expect(s.teaser, `${s.notebook}/${s.slug}`).not.toMatch(/<\/?[A-Z]/);
      expect(s.teaser).not.toMatch(/[`*_]/);
      expect(s.teaser).not.toMatch(/^#/);
      // A flattened table or list reads as nonsense on one line.
      expect(s.teaser, `${s.notebook}/${s.slug}`).not.toMatch(/^[|\-*>]/);
      expect(s.teaser).not.toContain("|---");
    }
  });
});
