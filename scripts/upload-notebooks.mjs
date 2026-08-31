/**
 * Upload the study notebook PDFs into the private `notebooks` Supabase Storage
 * bucket, one folder per notebook:
 *
 *   notebooks/<slug>/<Title>-<Edition>.pdf
 *
 * The first path segment is the notebook slug, which is what the bucket's RLS
 * policy checks against `has_learn_access()`. Getting it wrong means nobody can
 * download the file, so the paths come from src/lib/learn.ts rather than from
 * whatever is on disk.
 *
 * The PDFs are NOT in this repo. They are built in the `learnings` repo:
 *
 *   cd ../learnings/notebooks && bash build.sh all
 *
 * Then, from this repo:
 *
 *   SUPABASE_SECRET_KEY=... node scripts/upload-notebooks.mjs [--dry-run]
 *
 * Needs the secret (service-role) key, not the publishable one: uploading is
 * exactly the operation RLS is there to stop a user from doing. Never put that
 * key in .env.local or anywhere the client bundle can reach.
 */
import { createClient } from "@supabase/supabase-js";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BUCKET = "notebooks";
const HERE = path.dirname(fileURLToPath(import.meta.url));

/** Where `learnings/notebooks/build.sh` writes its output. */
const PDF_ROOT =
  process.env.NOTEBOOKS_PDF_DIR ??
  path.resolve(HERE, "../../learnings/notebooks/pdf");

/** Notebook slug -> the numbered directory build.sh writes into. */
const SOURCE_DIRS = {
  "question-bank": "00-questions",
  "large-scale-ingestion": "01-ingestion",
  "object-storage": "02-object-storage",
  "full-stack-code-review": "03-code-review",
  postgres: "04-postgres",
  security: "05-security",
  scaling: "06-scaling",
  "real-time-backends": "07-real-time",
};

const dryRun = process.argv.includes("--dry-run");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

if (!dryRun && (!url || !secret)) {
  console.error(
    "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY (or pass --dry-run).",
  );
  process.exit(1);
}

// The catalog is TypeScript, so read the asset names out of it rather than
// adding a build step just for this script.
const catalog = await readFile(path.resolve(HERE, "../src/lib/learn.ts"), "utf8");

/** [{ slug, file }] for every edition declared in src/lib/learn.ts. */
function declaredAssets() {
  const assets = [];
  const blocks = catalog.split(/\n  \{\n/).slice(1);

  for (const block of blocks) {
    const slug = block.match(/slug: "([^"]+)"/)?.[1];
    if (!slug) continue;
    for (const [, file] of block.matchAll(/file: "([^"]+\.pdf)"/g)) {
      assets.push({ slug, file });
    }
  }
  return assets;
}

const assets = declaredAssets();
if (assets.length === 0) {
  console.error("Found no assets in src/lib/learn.ts. Has its shape changed?");
  process.exit(1);
}

const supabase = dryRun
  ? null
  : createClient(url, secret, { auth: { persistSession: false } });

let uploaded = 0;
let failed = 0;

for (const { slug, file } of assets) {
  const dir = SOURCE_DIRS[slug];
  if (!dir) {
    console.error(`  ! ${slug} has no entry in SOURCE_DIRS`);
    failed += 1;
    continue;
  }

  const source = path.join(PDF_ROOT, dir, file);
  const key = `${slug}/${file}`;

  let size;
  try {
    size = (await stat(source)).size;
  } catch {
    console.error(`  ! missing ${source}`);
    console.error(`    build it first: cd ../learnings/notebooks && bash build.sh all`);
    failed += 1;
    continue;
  }

  const mb = (size / 1_000_000).toFixed(1);
  if (dryRun) {
    console.log(`  would upload ${key} (${mb} MB)`);
    uploaded += 1;
    continue;
  }

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(key, await readFile(source), {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) {
    console.error(`  ! ${key}: ${error.message}`);
    failed += 1;
  } else {
    console.log(`  ${key} (${mb} MB)`);
    uploaded += 1;
  }
}

console.log(
  `\n${dryRun ? "Dry run: " : ""}${uploaded} file(s)${failed ? `, ${failed} failed` : ""}.`,
);
process.exit(failed ? 1 : 0);
