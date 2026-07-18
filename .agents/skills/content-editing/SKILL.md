---
name: content-editing
description: Edit Binary Semaphore site copy, links, projects, and team. Use whenever changing hero/section copy, the project or team list, social links, or any user-facing text. Enforces the single-source-of-truth in src/lib/site.ts and the copy voice.
---

# Editing Binary Semaphore content

## The one rule: copy lives in `src/lib/site.ts`

All site copy and links live in `src/lib/site.ts` (the `site` object), plus the
`projects` and `team` arrays. Components read from it. **Never hardcode
user-facing copy or links directly in a component** — edit `site.ts` instead.

- The `SiteConfig` type at the top of the file documents every field. Add fields
  to the type and the object together.
- Common edits: `hero`, `services`, `howWeWork`, `stats`, `techStack`,
  `footerColumns`, `email`, `linkedin`, `org`, `instagram`.

## Copy voice (enforced, see `AGENTS.md`)

- Plain, human, slightly conversational. Speak as the company ("we"), not a
  person.
- **No em dashes** in site copy. Use commas, periods, parentheses, or rewrite.
  (Exception: MDX thread prose — see the `mdx-thread` skill.)
- No marketing slogans. No rainbow gradient headlines.
- Never write "local-first" / "local first". Use "runs on your machine",
  "on-device", or "offline by default".
- Prefer principled CS-fundamentals language (reliability, maintainability,
  essential vs accidental complexity, honest abstractions, Unix philosophy),
  used naturally, never as jargon name-dropping. For customer-facing copy, avoid
  gratuitous acronyms and do not slip into a sales-pitch tone.

## Positioning (keep both sides true)

Binary Semaphore does **two** things; copy must reflect both:

1. Open-source tools and products the team builds and maintains (e.g. inode).
2. Software built for a specific need / for clients. Do not call this "custom
   software"; prefer "software built for a specific need".

## Projects and team

- **Projects:** edit the `projects` array. A project with a `slug` gets a detail
  page at `/projects/<slug>` (populate `detail`); without a slug the card links
  to its GitHub `href`. Banner images go under `public/`.
- **Team:** edit the `team` array. Each member's `slug` builds `/team/<slug>`.

## Images

- Photography: optimized files in `src/images/`, imported statically and
  rendered through `<Photo>` (blur-up + lazy). See `src/images/CREDITS.md`.
- Tech-stack logos: SVGs in `public/tech/`.
- Thread covers: mapped in `src/lib/thread-covers.ts` (slug -> imported image).

## Long-form posts

Devlog / blog posts are MDX under `src/content/threads/`. Use the `mdx-thread`
skill for the frontmatter shape and conventions.

## Before committing

Run `npm run lint && npm run typecheck && npm run test`. Work on a feature
branch and open a PR; never push directly to `main`.
