# Binary Semaphore — Brand Guide

The portable, canonical description of the **Binary Semaphore** (BS) brand:
identity, copy voice, design language, and the conventions we hold across
everything we ship — site, apps, decks, READMEs, social posts.

**Inside this repo** `AGENTS.md` imports this file, so these rules load
automatically for Claude Code / agents; `AGENTS.md` keeps only the repo-specific
specifics (commands, file layout, exact tokens, deploys). This file is also the
version you can carry to **other BS projects** — see
[Using this in other projects](#using-this-in-other-projects).

The full landing-page playbook lives alongside this at
[`docs/yc-landing-page-playbook.md`](./yc-landing-page-playbook.md).

---

## Who Binary Semaphore is

- A **small software studio/team**, working across **AI, distributed systems,
  and developer tools**.
- We do **both**: open-source tools/products **and** custom software for
  clients. Copy and positioning must reflect both, never products-only or
  agency-only.
- Identity is the **company** ("we" / "the studio"), **not** a single person.
  The team is shown in a Team section; the brand speaks as the studio.

## Positioning & register

- Plain, principled **CS-fundamentals** language used naturally, never as jargon
  name-dropping: reliability, scalability, maintainability; essential vs
  accidental complexity; honest abstractions; Unix philosophy.
- Engineering tone that is **neither thin one-liners nor salesy benefit-speak**.
  Avoid gratuitous acronyms. Applies everywhere, including LinkedIn.
- "YC-startup feel" is welcome, but **borrow the polish, never the credentials.**
  No fake "Backed by YC", invented investor/customer logos, fake user counts, or
  uncovered press. Convey credibility honestly: shipped work, open-source in
  public, real named testimonials, the real team.

## Copy voice — STRICT

- Write like a **human, not AI**. Plain, concrete, slightly conversational.
- **Never use em dashes in copy.** Use commas, periods, parentheses, or rewrite.
  (Exception: a repo owner's editorial MDX prose, which is left alone.)
- **No marketing slogans** ("from brainstorm to production", "engineered into
  real software", etc.). No rainbow gradient-text headlines.
- **Never write "local-first" / "local first"** in BS copy. Use "runs on your
  machine", "on-device", or "offline by default". (Exception: the existing
  `what-local-first-buys-you.mdx` thread.)
- Hero copy: outcome-first, plain, one sentence on what we do. One primary CTA.

## Design language

- **Palette:** warm cream canvas, near-black ink, **coral** brand accent, candy
  panel palette (coral, blue, violet, sun). Tokens drive Tailwind utilities.
- **Fonts:** Bricolage Grotesque (display), Inter (sans), JetBrains Mono (mono),
  Shantell Sans + Caveat for occasional doodle/handwritten accents.
- **Shape:** rounded cards/panels/blobs; soft shadow. Lots of whitespace.
  Confident and plain over decorated. No stock photography, no gradient soup.
- **Motion:** lightweight scroll-reveal only, always gated behind
  `prefers-reduced-motion`. No heavy animation libraries.

## Tech defaults (BS web/app work)

- Next.js App Router + Tailwind CSS v4, MDX for long-form posts ("threads"),
  deployed on Vercel.
- Backend (when needed): **Supabase** (Postgres + GitHub/Google OAuth) called
  from the Next.js app.
- For this site, the single source of truth for copy/links/team/projects is
  `src/lib/site.ts` — edit copy there, not in components.

## Workflow defaults

- **Git:** always feature-branch + PR. Never push to `main`; `main` only via
  merged PR. Run lint + typecheck before committing.
- Build incrementally; when matching a reference, verify each item against the
  reference before moving on.

---

## Using this in other projects

To make Claude Code apply this brand automatically in a **different** BS repo:

1. Copy or reference this file from the project (e.g. `docs/brand.md`).
2. In that project's `CLAUDE.md` (or `AGENTS.md`), add an import line:
   ```
   @docs/brand.md
   ```
   so the brand context loads with every session.

Prefer a machine-wide setup (any folder, no per-repo wiring)? Add a small
trigger to your **user** memory at `~/.claude/CLAUDE.md`, e.g. "When I'm working
on Binary Semaphore, read this brand guide first," pointing at a local copy.
Note user-level config is per-machine and not shared via git, so the committed
copy in this repo stays the source of truth.
