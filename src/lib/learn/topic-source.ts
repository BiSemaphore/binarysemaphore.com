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
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export const hasBody = cache((subject: string, channel: string): boolean => {
  if (!SLUG.test(subject) || !SLUG.test(channel)) return false;
  return fs.existsSync(path.join(DIR, subject, `${channel}.mdx`));
});

/** "subject/channel" for every channel that has prose. */
export const writtenSlugs = cache((): Set<string> => {
  if (!fs.existsSync(DIR)) return new Set();
  const out = new Set<string>();
  for (const subject of fs.readdirSync(DIR)) {
    const dir = path.join(DIR, subject);
    if (!fs.statSync(dir).isDirectory()) continue;
    for (const file of fs.readdirSync(dir)) {
      if (file.endsWith(".mdx"))
        out.add(`${subject}/${file.replace(/\.mdx$/, "")}`);
    }
  }
  return out;
});

/**
 * The compiled body, or null when nothing is written.
 *
 * The slug is validated by `hasBody` before it reaches the import, so a request
 * for `../../etc/passwd` never becomes a path.
 */
export async function getBody(
  subject: string,
  channel: string,
): Promise<ComponentType | null> {
  if (!hasBody(subject, channel)) return null;

  const mod = (await import(`@/content/topics/${subject}/${channel}.mdx`)) as {
    default: ComponentType;
  };
  return mod.default;
}
