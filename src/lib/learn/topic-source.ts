/**
 * Where topic prose comes from.
 *
 * This file is the seam described in `docs/topics.md`. Content is MDX in git
 * today; if that trade ever stops being worth it, a Postgres implementation
 * returns the same two shapes and **no page changes**. That only stays true if
 * nothing else imports `src/content/topics/` directly, so do not.
 *
 * Server-only: reads the filesystem.
 */
import fs from "node:fs";
import path from "node:path";
import { cache } from "react";
import type { ComponentType } from "react";

const DIR = path.join(process.cwd(), "src/content/topics");

/**
 * Does this topic have prose yet.
 *
 * Checked on disk rather than by catching a failed import, because a dynamic
 * import that throws is indistinguishable from a genuine compile error in the
 * MDX, and swallowing that would hide a broken page instead of surfacing it.
 */
export const hasBody = cache((slug: string): boolean => {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return false;
  return fs.existsSync(path.join(DIR, `${slug}.mdx`));
});

/** Every topic slug that has prose, for counting what is actually written. */
export const writtenSlugs = cache((): Set<string> => {
  if (!fs.existsSync(DIR)) return new Set();
  return new Set(
    fs
      .readdirSync(DIR)
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => f.replace(/\.mdx$/, "")),
  );
});

/**
 * The compiled body, or null when nothing is written.
 *
 * The slug is validated by `hasBody` before it reaches the import, so a request
 * for `../../etc/passwd` never becomes a path.
 */
export async function getBody(slug: string): Promise<ComponentType | null> {
  if (!hasBody(slug)) return null;

  const mod = (await import(`@/content/topics/${slug}.mdx`)) as {
    default: ComponentType;
  };
  return mod.default;
}
