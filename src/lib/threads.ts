import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/** Folder holding the MDX articles. */
const THREADS_DIR = path.join(process.cwd(), "src/content/threads");

export type ThreadMeta = {
  slug: string;
  title: string;
  description: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  tags: string[];
  draft: boolean;
  readingMinutes: number;
};

function readingMinutes(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function toIsoDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return typeof value === "string" ? value.trim() : "";
}

function parseFile(fileName: string): ThreadMeta {
  const slug = fileName.replace(/\.mdx$/, "");
  const raw = fs.readFileSync(path.join(THREADS_DIR, fileName), "utf8");
  const { data, content } = matter(raw);

  const title = typeof data.title === "string" ? data.title : "";
  const description =
    typeof data.description === "string" ? data.description : "";
  const date = toIsoDate(data.date);

  if (!title || !description || !date) {
    throw new Error(
      `Thread "${slug}" is missing required frontmatter (title, description, date).`,
    );
  }

  return {
    slug,
    title,
    description,
    date,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    draft: Boolean(data.draft),
    readingMinutes: readingMinutes(content),
  };
}

/** All threads, newest first. Drafts are excluded in production builds. */
export function getAllThreads(): ThreadMeta[] {
  if (!fs.existsSync(THREADS_DIR)) return [];
  const includeDrafts = process.env.NODE_ENV !== "production";

  return fs
    .readdirSync(THREADS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map(parseFile)
    .filter((t) => includeDrafts || !t.draft)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getThread(slug: string): ThreadMeta | undefined {
  return getAllThreads().find((t) => t.slug === slug);
}

/** Human-readable date, e.g. "16 Jun 2026". */
export function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
