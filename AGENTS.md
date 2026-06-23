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
- `src/content/threads/*.mdx` — blog posts; frontmatter parsed by `src/lib/threads.ts`.

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
