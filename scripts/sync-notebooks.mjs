/**
 * Copy the notebook markdown out of the `learnings` repo into this one.
 *
 * The books are written and typeset next door; this repo needs the source so it
 * can render a reading view. Copying rather than importing keeps the site
 * buildable on CI, where the other repo does not exist, and makes any change to
 * a book show up as a reviewable diff here.
 *
 *   node scripts/sync-notebooks.mjs [--check]
 *
 * `--check` exits non-zero if anything is out of date, without writing.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEST = path.resolve(HERE, "../src/content/notebooks");
const SRC =
  process.env.NOTEBOOKS_BOOKS_DIR ??
  path.resolve(HERE, "../../learnings/notebooks/books");

/** Notebook slug -> source file name. Mirrors SOURCE_DIRS in upload-notebooks. */
const BOOKS = {
  "question-bank": "question-bank.md",
  "large-scale-ingestion": "large-scale-ingestion.md",
  "object-storage": "object-storage.md",
  postgres: "postgres.md",
  security: "security.md",
  scaling: "scaling.md",
  "real-time-backends": "real-time-backends.md",
  "rest-api-design": "rest-api-design.md",
  "design-principles": "design-principles.md",
};

const check = process.argv.includes("--check");
await mkdir(DEST, { recursive: true });

let changed = 0;
for (const [slug, file] of Object.entries(BOOKS)) {
  const from = path.join(SRC, file);
  const to = path.join(DEST, `${slug}.md`);

  if (!existsSync(from)) {
    console.error(`  ! missing ${from}`);
    process.exit(1);
  }

  const source = await readFile(from, "utf8");
  const current = existsSync(to) ? await readFile(to, "utf8") : null;

  if (source === current) continue;
  changed += 1;

  if (check) {
    console.error(`  ! ${slug}.md is out of date`);
    continue;
  }
  await writeFile(to, source);
  console.log(`  ${slug}.md (${(source.length / 1024).toFixed(0)} KB)`);
}

if (check && changed) {
  console.error("\nRun: node scripts/sync-notebooks.mjs");
  process.exit(1);
}
console.log(`\n${changed === 0 ? "Already in step." : `${changed} file(s) synced.`}`);
