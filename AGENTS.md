<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Binary Semaphore site

Marketing/portfolio site for **Binary Semaphore**, a small software team working
across AI, distributed systems, and developer tools. Next.js App Router +
Tailwind CSS v4, MDX for long-form posts ("threads"), deployed on Vercel.

**Brand identity, copy voice, and design language are canonical in
[`docs/brand.md`](docs/brand.md):**

@docs/brand.md

The sections below cover only how those rules apply in _this_ repo (commands,
file layout, the exact tokens/utilities, deploys).

## Commands

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run lint` — ESLint
- `npm run typecheck` — `tsc --noEmit`

Run `lint` and `typecheck` before committing; CI runs both.

## Structure

- `src/app/` — routes (`/`, `/threads`, `/threads/[slug]`, `/projects/[slug]`), `layout.tsx`, `globals.css`.
- `src/components/` — section + UI components (hero, features, projects, team, contact, footer, header, decoration, reveal, doodle, icons).
- `src/lib/site.ts` — **single source of truth** for all site copy, links, the `team` array, and `projects`. Edit copy here, not in components.
- Threads live in Postgres, read by `src/lib/threads.ts` through `unstable_cache`
  tagged `threads`. There is no `src/content/threads/` any more: the MDX moved in
  a one-way sync and the files were deleted. A body is compiled at request time by
  `src/lib/mdx/runtime.tsx`, whose plugin list must stay in step with the one in
  `next.config.ts` (Turbopack takes plugin names, the runtime takes functions).
- `src/lib/learn.ts` — **single source of truth** for the study notebook catalog
  served at `learn.binarysemaphore.com` (`src/app/learn/`). Access rules live in
  `src/lib/learn/`; the PDFs live in Supabase Storage, not in git.
- `src/content/notebooks/*/*.mdx` — notebook sections, **generated** by
  `scripts/sync-notebooks.mjs` from the `learnings` repo. Never hand-edit them,
  and never let Prettier near them. Same MDX pattern as threads. Read
  [`docs/learn.md`](docs/learn.md) before touching the gate or adding a notebook.
- `src/lib/learn/topics.ts` — the computer science topic tree: 23 subjects on
  the rail, 93 channels in the sidebar, browsed at `/topics` in a Discord-style
  shell. Channels are named after situations, never syllabus steps, and the test
  suite enforces that. Prose lives in `src/content/topics/<subject>/<channel>.mdx`
  behind the `topic-source.ts` seam, so **no page may import that directory
  directly**. The shell is the one part of `learn` on a
  black canvas; everything else stays white. Read
  [`docs/topics.md`](docs/topics.md) before adding a topic or touching the shell.

### Where a component goes

- `src/components/*.tsx` — shared primitives used by more than one area
  (`tooltip`, `photo`, `reveal`, `icons`, `annotate`, `doodle`).
- `src/components/<area>/` — anything only one area uses (`learn/`, `resume/`,
  `auth/`). Nest further only when a subtree earns it, as `learn/topics/` does.

The test is who imports it, not what it is about. A component imported from one
place under `src/app/<area>` belongs in `components/<area>`.

Route boundaries exist at the root: `error.tsx`, `global-error.tsx` and
`not-found.tsx`. Add a nested `error.tsx` only where a subtree needs to fail
differently from the rest of the site.

### The database

Schema lives in `supabase/migrations/`, applied with the Supabase CLI
(`npx supabase db push`). It is the only source of truth: the old
`supabase/schema.sql` mirror is gone, and content is never seeded by a
migration. Read [`docs/database.md`](docs/database.md) before adding a table.

Four rules from it that are easy to get wrong:

- **RLS filters rows; it does not grant table access.** A policy without a
  matching `grant` produces "permission denied for table ...".
- **Slugs use the `public.slug` domain**, and are unique within a `scope` (the
  subject for a channel, the notebook for a section, null for a thread), never
  globally.
- **`private` is not exposed to PostgREST**, so nothing in it has a URL. Reach
  it with `src/utils/supabase/admin.ts` through a `security definer` function,
  never by exposing the schema.
- **Being able to sign in must never imply being an admin.** Signup is global
  and the email provider is on, so anyone can get an account. The gate is a row
  in `private.admins`, checked by `is_admin()`.

### Planned: admin.binarysemaphore.com

Design in [`docs/admin.md`](docs/admin.md), nothing built yet. Two rules from it
that apply the moment anyone starts: **being able to sign in must never imply
being an admin** (the gate is an `admins` table and `is_admin()` in RLS, never
the subdomain, which is routing), and after the move **Postgres is the source of
truth for content, not git**. The trade-offs, including that runtime MDX
evaluation makes an admin compromise a code-execution problem, are recorded in
[`docs/content-backend.md`](docs/content-backend.md).

## Design system — repo tokens (rationale and palette concept in `docs/brand.md`; see `globals.css`)

- Palette tokens drive Tailwind utilities: `bg-coral`, `text-accent-strong`, etc. Candy panels: `coral`, `blue`, `violet`, `sun`.
- Radii: `rounded-card` / `rounded-panel` / `rounded-blob`. Shadow: `shadow-soft`.
- Font utilities: `font-display` (Bricolage Grotesque), `font-sans` (Inter), `font-mono` (JetBrains Mono), `font-doodle` (Shantell Sans), `font-hand` (Caveat).
- Motion: scroll-reveal via `<Reveal>` (IntersectionObserver), gated behind `prefers-reduced-motion`.

## Copy voice

Canonical rules in `docs/brand.md` (imported above). Repo note: `src/lib/site.ts` is the single source of truth for copy; edit there, not in components.

## Deploys

- Source of truth is GitHub `main`. CI/CD lives in `.github/workflows/ci.yml`: `quality` (lint + typecheck) on every PR/push, plus `deploy-preview` (PRs) and `deploy-production` (push to `main`) via the Vercel CLI.
- Requires repo secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- Vercel's native Git auto-deploy is **disabled** via `vercel.json` (`git.deploymentEnabled: false`) so the GitHub Action is the only deployer (avoids double deploys). Do not re-enable it unless you also remove the deploy jobs.
