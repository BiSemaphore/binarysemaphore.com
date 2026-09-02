import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { parseBook, sectionSlug, CALLOUTS } from "@/lib/learn/parse";
import { notebooks } from "@/lib/learn";

const dir = path.join(process.cwd(), "src/content/notebooks");
const read = (slug: string) =>
  readFileSync(path.join(dir, `${slug}.md`), "utf8");

describe("the synced content", () => {
  it("has a markdown file for every notebook in the catalog", () => {
    const files = new Set(readdirSync(dir).filter((f) => f.endsWith(".md")));
    for (const notebook of notebooks) {
      expect(files, notebook.slug).toContain(`${notebook.slug}.md`);
    }
  });
});

describe("parseBook, on the real Postgres notebook", () => {
  const book = parseBook(read("postgres"));

  it("reads the title block", () => {
    expect(book.title).toBe("Postgres");
    expect(book.series).toBe("Study Notebook");
    expect(book.number).toBe("04");
    expect(book.subtitle).toContain("Schema, queries and indexes");
  });

  it("finds the parts", () => {
    expect(book.parts.length).toBeGreaterThan(5);
    expect(book.parts[0].number).toBe("I");
    expect(book.parts[0].title).toBe("Why a database at all");
    expect(book.parts[0].markdown).toContain("SQL or NoSQL");
  });

  // The catalog's `contents` was extracted from the same "## " lines, with the
  // number still attached. Recombining is the honest comparison, and it catches
  // the two drifting apart when a book is rewritten.
  it("finds the same sections the catalog lists", () => {
    const catalogued = notebooks.find((n) => n.slug === "postgres")!.contents;
    const rendered = book.sections.map((s) =>
      s.number ? `${s.number}. ${s.title}` : s.title,
    );
    for (const entry of catalogued) {
      expect(rendered, entry).toContain(entry);
    }
  });

  it("gives every section a unique, url-safe slug", () => {
    const slugs = book.sections.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it("attaches each section to the part it sits under", () => {
    const numbered = book.sections.filter((s) => s.number);
    expect(numbered.every((s) => s.part >= 0)).toBe(true);
  });

  it("parses the annotation blocks", () => {
    const callouts = book.sections
      .flatMap((s) => s.blocks)
      .filter((b) => b.kind === "callout");
    expect(callouts.length).toBeGreaterThan(20);
    for (const c of callouts) expect(Object.keys(CALLOUTS)).toContain(c.callout);
  });

  it("keeps fenced code intact, including a ::: inside it", () => {
    const code = book.sections
      .flatMap((s) => s.blocks)
      .filter((b) => b.kind === "code");
    expect(code.length).toBeGreaterThan(5);
    expect(code.every((b) => b.code.length > 0)).toBe(true);
  });

  it("does not render the typesetter's own directives as content", () => {
    const prose = book.sections
      .flatMap((s) => s.blocks)
      .filter((b) => b.kind === "prose")
      .map((b) => b.markdown)
      .join("\n");
    expect(prose).not.toContain(":::toc");
    expect(prose).not.toContain(":::title");
    expect(prose).not.toContain(":::glossary");
  });
});

describe("parseBook, across every notebook", () => {
  for (const notebook of notebooks) {
    it(`parses ${notebook.slug} into titled sections`, () => {
      const book = parseBook(read(notebook.slug));
      expect(book.title).toBe(notebook.title);
      expect(book.sections.length).toBeGreaterThan(0);
      for (const section of book.sections) {
        expect(section.title.length).toBeGreaterThan(0);
        expect(section.slug.length).toBeGreaterThan(0);
      }
    });
  }
});

describe("sectionSlug", () => {
  it("strips punctuation and keeps the number", () => {
    expect(sectionSlug("12", "Indexes: the catalogue, the tree")).toBe(
      "12-indexes-the-catalogue-the-tree",
    );
  });

  it("handles an appendix letter", () => {
    expect(sectionSlug("B", "Glossary")).toBe("b-glossary");
  });
});
