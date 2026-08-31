import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import {
  editions,
  formatBytes,
  getNotebook,
  notebooks,
  objectKey,
  totalPages,
} from "@/lib/learn";

const migration = readFileSync(
  path.join(process.cwd(), "supabase/migrations/0003_learn.sql"),
  "utf8",
);

const schema = readFileSync(
  path.join(process.cwd(), "supabase/schema.sql"),
  "utf8",
);

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

describe("learn_products stays in step with the catalog", () => {
  // The database needs a row per notebook for the entitlements foreign key and
  // for start_learn_trial()'s validation. Drift means a working page with a
  // button that always errors, which is worth failing a build over.
  it("seeds every catalog slug in the migration", () => {
    for (const notebook of notebooks) {
      expect(migration, notebook.slug).toContain(`('${notebook.slug}'`);
    }
  });

  // supabase/schema.sql mirrors the migrations by convention (see the header on
  // 0001_init.sql), so a notebook added to one and not the other would leave a
  // freshly built database missing a row.
  it("keeps schema.sql in step with the migration", () => {
    for (const notebook of notebooks) {
      expect(schema, notebook.slug).toContain(`('${notebook.slug}'`);
    }
    expect(schema).toContain("public.start_learn_trial");
    expect(schema).toContain("public.has_learn_access");
  });

  it("seeds nothing the catalog does not have", () => {
    const seeded = [...migration.matchAll(/^ {2}\('([a-z0-9-]+)',/gm)].map(
      (m) => m[1],
    );
    expect(seeded.length).toBe(notebooks.length);
    for (const slug of seeded) {
      expect(getNotebook(slug), slug).toBeDefined();
    }
  });
});

describe("objectKey", () => {
  it("puts the slug first, which is what the storage policy checks", () => {
    const notebook = getNotebook("postgres")!;
    expect(objectKey(notebook, "reading")).toBe(
      `postgres/${notebook.assets.reading!.file}`,
    );
  });

  it("returns null for an edition that was never built", () => {
    const notebook = getNotebook("real-time-backends")!;
    expect(notebook.assets.tablet).toBeUndefined();
    expect(objectKey(notebook, "tablet")).toBeNull();
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
