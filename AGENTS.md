<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Binary Semaphore site

Marketing/portfolio site for **Binary Semaphore**, a small software team working
across AI, distributed systems, and developer tools. Next.js App Router +
Tailwind CSS v4, MDX for long-form posts ("threads"), deployed on Vercel.

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

## Design system (see `globals.css`)
- Warm cream canvas, near-black ink, coral brand, candy panel palette (`coral`, `blue`, `violet`, `sun`). Tokens drive Tailwind utilities (`bg-coral`, `text-accent-strong`, etc.).
- Radii: `rounded-card` / `rounded-panel` / `rounded-blob`. Shadow: `shadow-soft`.
- Fonts: Bricolage Grotesque (`font-display`), Inter (`font-sans`), JetBrains Mono (`font-mono`), Shantell Sans + Caveat for occasional doodle/handwritten accents (`font-doodle` / `font-hand`).
- Motion: lightweight scroll-reveal via `<Reveal>` (IntersectionObserver), all gated behind `prefers-reduced-motion`. No heavy animation libraries.

## Copy voice — IMPORTANT
- Write like a human, not AI. Plain, concrete, slightly conversational.
- **Never use em dashes (—) in copy.** Use commas, periods, parentheses, or rewrite. (MDX article prose is the owner's editorial writing; leave it alone.)
- No marketing slogans ("from brainstorm to production", "engineered into real software", etc.). No rainbow gradient-text headlines.
- **Never write "local-first" / "local first" in site copy.** Use "runs on your machine", "on-device", or "offline by default". (Exception: the existing `what-local-first-buys-you.mdx` thread, which is about the concept.)
- Prefer plain, principled CS-fundamentals language (reliability/scalability/maintainability, essential vs accidental complexity, honest abstractions, Unix philosophy), used naturally, never as jargon name-dropping.
- Identity is the **company** (Binary Semaphore), not a person. The team is listed in the Team section, but the site speaks as the studio ("we").

## Deploys
- Source of truth is GitHub `main`. CI/CD lives in `.github/workflows/ci.yml`: `quality` (lint + typecheck) on every PR/push, plus `deploy-preview` (PRs) and `deploy-production` (push to `main`) via the Vercel CLI.
- Requires repo secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- Vercel's native Git auto-deploy is **disabled** via `vercel.json` (`git.deploymentEnabled: false`) so the GitHub Action is the only deployer (avoids double deploys). Do not re-enable it unless you also remove the deploy jobs.
