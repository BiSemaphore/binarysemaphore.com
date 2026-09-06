import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import {
  editions,
  formatBytes,
  getNotebook,
  notebooks,
  objectKey,
  totalPages,
  type Notebook,
} from "@/lib/learn";

const migrationsDir = path.join(process.cwd(), "supabase/migrations");

/** Every migration concatenated, so a slug retired in a later one is visible. */
const migration = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort()
  .map((f) => readFileSync(path.join(migrationsDir, f), "utf8"))
  .join("\n");

describe("the notebook catalog", () => {
  it("has a unique slug per notebook", () => {
    const slugs = notebooks.map((n) => n.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("uses url-safe slugs, since they are also storage folder names", () => {
    for (const notebook of notebooks) {
      expect(notebook.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("offers the Reading edition for every notebook", () => {
    for (const notebook of notebooks) {
      expect(notebook.assets.reading, notebook.slug).toBeDefined();
    }
  });

  it("only declares editions the app knows how to render", () => {
    const known = new Set(editions.map((e) => e.id));
    for (const notebook of notebooks) {
      for (const id of Object.keys(notebook.assets)) {
        expect(known, `${notebook.slug}/${id}`).toContain(id);
      }
    }
  });

  it("names a real-looking pdf with a non-zero size for every edition", () => {
    for (const notebook of notebooks) {
      for (const asset of Object.values(notebook.assets)) {
        expect(asset.file).toMatch(/\.pdf$/);
        expect(asset.bytes).toBeGreaterThan(0);
      }
    }
  });

  it("has contents and a page count for every notebook", () => {
    for (const notebook of notebooks) {
      expect(notebook.pages, notebook.slug).toBeGreaterThan(0);
      expect(notebook.contents.length, notebook.slug).toBeGreaterThan(0);
    }
  });

  it("keeps copy free of em dashes, per the brand rules", () => {
    for (const notebook of notebooks) {
      const copy = `${notebook.title} ${notebook.subtitle} ${notebook.blurb}`;
      expect(copy, notebook.slug).not.toMatch(/[—–]/);
    }
  });
});

describe("catalog slugs are storable", () => {
  // The `slug` domain in the schema rejects anything outside this shape, and a
  // notebook whose slug it rejects cannot be seeded at all. Catching it here
  // means a bad slug fails a test rather than a deploy.
  const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

  it("matches the slug domain in the database", () => {
    for (const notebook of notebooks) {
      expect(notebook.slug, notebook.slug).toMatch(SLUG);
      expect(notebook.slug.length, notebook.slug).toBeLessThanOrEqual(80);
    }
  });

  // Content is no longer seeded by a migration: three of the old ten were
  // content edits, which is what made the migration folder a changelog. The
  // catalog is synced into Postgres by a script instead, so the only thing a
  // migration can now get wrong about a notebook is its shape.
  it("keeps content out of the migrations", () => {
    expect(migration).not.toMatch(/insert into public\.notebooks/i);
  });
});

describe("objectKey", () => {
  it("puts the slug first, which is what the storage policy checks", () => {
    const notebook = getNotebook("postgres")!;
    expect(objectKey(notebook, "reading")).toBe(
      `postgres/${notebook.assets.reading!.file}`,
    );
  });

  // Constructed rather than pinned to a real notebook: which editions exist
  // changes every time the books are rebuilt, and that is not what this checks.
  it("returns null for an edition a notebook does not have", () => {
    const partial: Notebook = {
      ...getNotebook("postgres")!,
      assets: { reading: { file: "Only-Reading.pdf", bytes: 1 } },
    };
    expect(objectKey(partial, "reading")).toBe("postgres/Only-Reading.pdf");
    expect(objectKey(partial, "tablet")).toBeNull();
  });
});

describe("helpers", () => {
  it("formats bytes as MB to one decimal", () => {
    expect(formatBytes(2_393_018)).toBe("2.4 MB");
  });

  it("totals the pages across the library", () => {
    expect(totalPages()).toBe(
      notebooks.reduce((sum, n) => sum + n.pages, 0),
    );
  });
});
