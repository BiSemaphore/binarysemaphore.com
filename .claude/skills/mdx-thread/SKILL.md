---
name: mdx-thread
description: Write a new /threads MDX post (devlog/blog) for Binary Semaphore. Use when adding or editing a thread. Covers file naming, required frontmatter, body formatting, code blocks, and cover images.
---

# Writing a thread (MDX post)

Threads are the blog/devlog at `/threads`. Each post is one MDX file.

## File and slug

- Create `src/content/threads/<slug>.mdx`.
- The filename (without `.mdx`) **is** the URL slug, in kebab-case. It becomes
  `/threads/<slug>`. Choose a short, descriptive slug.

## Frontmatter (YAML)

Parsed by `src/lib/threads.ts`. `title`, `description`, and `date` are
**required** — the build throws if any is missing.

```yaml
---
title: "How semantic search finds things you can't grep"
description: "One or two sentences. Used on the card and as the SEO/OG description."
date: 2026-06-11
tags: ["search", "embeddings", "rag"]
---
```

- `title` — string, in quotes.
- `description` — string. Shown on the thread card and used for page metadata
  (title/description/OG/Twitter), so write it for a reader, ~1-2 sentences.
- `date` — `YYYY-MM-DD` (unquoted YAML date). Threads sort newest-first.
- `tags` — optional string array. Rendered as `#tag` chips.
- `draft` — optional boolean. Drafts are hidden in production builds, shown in
  dev.

Reading time is computed automatically; do not add it.

## Body

Standard Markdown / MDX:

- `##` / `###` headings (the `#` h1 is the title from frontmatter, do not repeat
  it). Headings get anchor ids automatically (`rehype-slug`).
- `**bold**`, `*italic*`, `` `inline code` ``, tables, lists, blockquotes.
- Fenced code blocks with a language are syntax-highlighted by
  `rehype-pretty-code` with a dual light/dark theme:

  ```go
  func acquire(s chan struct{}) { s <- struct{}{} }
  ```

- There are **no custom MDX components** wired up (no callouts/figure
  components). Keep to standard markdown unless you add and register a component
  first.

## Voice for threads

Unlike the rest of the site, thread prose is the **owner's editorial writing**:
em dashes are allowed here, and the tone can be more personal. Keep it technical
and honest.

## Cover image (optional)

Covers are not in frontmatter. To add one, import an image in
`src/lib/thread-covers.ts` and map the slug to it:

```ts
"how-semantic-search-works": wireframes,
```

Images live in `src/images/` (statically imported, blur-up via `<Photo>`).

## Verify

Run `npm run build` to confirm the frontmatter parses and the post renders, then
check it appears on `/threads`. Commit on a feature branch and open a PR.
