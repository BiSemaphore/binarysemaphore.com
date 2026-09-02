import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { notebooks } from "@/lib/learn";
import { splitBook, type SectionEntry } from "@/lib/learn/book";

const DIR = path.join(process.cwd(), "src/content/notebooks");

const index = (slug: string): SectionEntry[] =>
  JSON.parse(readFileSync(path.join(DIR, slug, "index.json"), "utf8"));

const read = (slug: string, file: string) =>
  readFileSync(path.join(DIR, slug, file), "utf8");

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

  it("writes one mdx file per section, and nothing else", () => {
    for (const notebook of notebooks) {
      const expected = new Set(["index.json"]);
      for (const s of index(notebook.slug)) expected.add(`${s.slug}.mdx`);
      const actual = readdirSync(path.join(DIR, notebook.slug));
      expect(new Set(actual)).toEqual(expected);
    }
  });

  it("gives every section frontmatter, a url-safe slug, and a length", () => {
    for (const s of all) {
      const body = read(s.notebook, `${s.slug}.mdx`);
      expect(body.startsWith("---\n"), `${s.notebook}/${s.slug}`).toBe(true);
      expect(s.slug).toMatch(/^[a-z0-9-]+$/);
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.length).toBeGreaterThanOrEqual(0);
    }
  });

  it("gives each notebook unique section slugs", () => {
    for (const notebook of notebooks) {
      const slugs = index(notebook.slug).map((s) => s.slug);
      expect(new Set(slugs).size, notebook.slug).toBe(slugs.length);
    }
  });

  // Whole sections are emitted now, so a fence or component can only be
  // unbalanced if the parser itself is wrong.
  it("never leaves an unbalanced fence or component tag", () => {
    const TAGS = /<\/?([A-Z][A-Za-z]*)/g;
    for (const s of all) {
      const body = read(s.notebook, `${s.slug}.mdx`);
      const fences = body.split("\n").filter((l) => l.startsWith("```")).length;
      expect(fences % 2, `${s.notebook}/${s.slug}`).toBe(0);

      const prose = body.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]+`/g, "");
      const depth = new Map<string, number>();
      for (const [tag, name] of prose.matchAll(TAGS)) {
        depth.set(name, (depth.get(name) ?? 0) + (tag.startsWith("</") ? -1 : 1));
      }
      for (const [name, n] of depth) {
        expect(n, `${s.notebook}/${s.slug}: <${name}>`).toBe(0);
      }
    }
  });
});

describe("the highlighter marks", () => {
  const stripCode = (s: string) =>
    s.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]+`/g, "");

  // Two bugs this guards, which between them dropped a third of every mark in
  // the library: a mark may wrap a line (the books are set at ~80 columns), and
  // a mark may contain a code span (==`LEFT JOIN`==).
  it("converts every mark, leaving none literal", () => {
    for (const s of all) {
      const body = stripCode(read(s.notebook, `${s.slug}.mdx`));
      // Allows a newline inside, because that is exactly the case that was
      // being missed: applyMarks used to run line by line, so a mark wrapping a
      // line could never close.
      const wrapped = "(?:[^C]|\\n(?!\\n)){1,120}";
      for (const ch of ["=", "!", "%"]) {
        const mark = new RegExp(
          `${ch}${ch}${wrapped.replace("C", ch)}${ch}${ch}`,
        );
        expect(body, `${s.notebook}/${s.slug} (${ch}${ch})`).not.toMatch(mark);
      }
    }
  });

  it("actually renders marks across the library", () => {
    const total = all.reduce(
      (n, s) =>
        n +
        (read(s.notebook, `${s.slug}.mdx`).match(
          /<(Peach|Rose|Mint|Pink|Circle)>/g,
        )?.length ?? 0),
      0,
    );
    expect(total).toBeGreaterThan(1000);
  });

  it("leaves no masking sentinel behind", () => {
    for (const s of all) {
      expect(read(s.notebook, `${s.slug}.mdx`)).not.toContain("\u0000");
    }
  });
});

describe("splitBook", () => {
  it("always frees something and always holds something back", () => {
    for (const notebook of notebooks) {
      const { free, gated } = splitBook(index(notebook.slug));
      expect(free.length, notebook.slug).toBeGreaterThan(0);
      expect(gated.length, notebook.slug).toBeGreaterThan(0);
    }
  });

  it("keeps every section, in order", () => {
    for (const notebook of notebooks) {
      const sections = index(notebook.slug);
      const { free, gated } = splitBook(sections);
      expect([...free, ...gated]).toEqual(sections);
    }
  });

  it("frees a small share of a full-length book", () => {
    let checked = 0;
    for (const notebook of notebooks) {
      const sections = index(notebook.slug);
      // A short book cannot free less than its two-section minimum, and REST
      // API Design is seven sections long. Judge the books that have room.
      if (sections.length < 12) continue;
      const total = sections.reduce((n, s) => n + s.length, 0);
      const shown = splitBook(sections).free.reduce((n, s) => n + s.length, 0);
      expect(shown / total, notebook.slug).toBeLessThan(0.3);
      checked += 1;
    }
    expect(checked).toBeGreaterThan(6);
  });

  it("never frees more than half of any book", () => {
    for (const notebook of notebooks) {
      const sections = index(notebook.slug);
      const total = sections.reduce((n, s) => n + s.length, 0);
      const shown = splitBook(sections).free.reduce((n, s) => n + s.length, 0);
      expect(shown / total, notebook.slug).toBeLessThan(0.5);
    }
  });

  it("frees at least two sections even when the first is enormous", () => {
    const huge: SectionEntry[] = [
      { slug: "a", number: "1", title: "A", part: "", partTitle: "", length: 99999, refs: [], backrefs: [] },
      { slug: "b", number: "2", title: "B", part: "", partTitle: "", length: 10, refs: [], backrefs: [] },
      { slug: "c", number: "3", title: "C", part: "", partTitle: "", length: 10, refs: [], backrefs: [] },
    ];
    expect(splitBook(huge).free).toHaveLength(2);
  });

  it("handles a one-section book without hiding all of it", () => {
    const one: SectionEntry[] = [
      { slug: "a", number: "1", title: "A", part: "", partTitle: "", length: 100, refs: [], backrefs: [] },
    ];
    expect(splitBook(one)).toEqual({ free: one, gated: [] });
  });
});

describe("cross-references", () => {
  const bySlug = new Map(all.map((s) => [`${s.notebook}/${s.slug}`, s]));

  // The books say "as in section 26" constantly. A link to a section that does
  // not exist is worse than the plain text it replaced.
  it("only points at sections that exist", () => {
    for (const s of all) {
      for (const ref of s.refs) {
        if (!ref.startsWith("s:")) continue;
        expect(
          bySlug.has(`${s.notebook}/${ref.slice(2)}`),
          `${s.notebook}/${s.slug} -> ${ref}`,
        ).toBe(true);
      }
    }
  });

  it("only points at notebooks that are in the catalog", () => {
    const known = new Set(notebooks.map((n) => n.slug));
    for (const s of all) {
      for (const ref of s.refs) {
        if (!ref.startsWith("n:")) continue;
        expect(known, `${s.notebook}/${s.slug} -> ${ref}`).toContain(ref.slice(2));
      }
    }
  });

  it("emits a link in the prose for every recorded reference", () => {
    for (const s of all) {
      if (s.refs.length === 0) continue;
      const body = read(s.notebook, `${s.slug}.mdx`);
      expect(body, `${s.notebook}/${s.slug}`).toContain("<Ref to=");
    }
  });

  it("makes backrefs the exact inverse of refs", () => {
    for (const notebook of notebooks) {
      const sections = index(notebook.slug);
      for (const target of sections) {
        const expected = sections
          .filter((s) => s.refs.includes(`s:${target.slug}`))
          .map((s) => s.slug)
          .sort();
        expect(target.backrefs, `${notebook.slug}/${target.slug}`).toEqual(
          expected,
        );
      }
    }
  });

  it("gives about half the library something to show in the rail", () => {
    const withSomething = all.filter(
      (s) => s.refs.length > 0 || s.backrefs.length > 0,
    ).length;
    expect(withSomething / all.length).toBeGreaterThan(0.45);
  });
});
