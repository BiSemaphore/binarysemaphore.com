# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Every release corresponds to a `chore/release-vX.Y.Z` pull request and a matching
`vX.Y.Z` tag on `main`. (Releases up to 0.4.2 came from a `staging` to `main`
pull request; that branch has been dormant since #58 and feature branches merge
to `main` directly.)

## [0.5.0] - 2026-09-07

The site stopped being a repository you deploy and became a product you edit.
Threads, the topic tree and the notebook catalog moved out of git into Postgres,
and an admin at `root.binarysemaphore.com` writes them. Two months of learn work
shipped alongside it.

### Added

- **Admin at `root.binarysemaphore.com`.** Sign in with an email and a password,
  create and edit threads and topic channels, publish, and roll back. The editor
  is the whole window: MDX on the left, a live preview on the right rendered
  through the same pipeline the published page uses, and each pane scrolls
  itself. Cmd/Ctrl+S saves, leaving with unsaved changes warns, and every save
  keeps the version it replaced.
- **The topic tree**: 23 subjects and 93 channels at `learn.…/topics`, in a
  Discord-shaped shell. Channels are named after situations rather than syllabus
  steps, and a database constraint enforces that, not a convention.
- **Study notebooks** at `learn.binarysemaphore.com`: a library, a reader that
  keeps your place, reading progress, roadmaps, and a mentorship front page.
- **Pen marks take props.** `color` (a brand token or any CSS colour), `weight`,
  `speed` and `delay`, plus a sixth mark, `<Bold>`, which colours the words
  themselves rather than drawing around them.
- **Navigation feedback**: a progress bar for the gap before the first byte, and
  route-level skeletons that mirror the real layout.
- **Threads**: the React Compiler port to Rust, with a cover.

### Changed

- **Postgres is the source of truth for content, not git.** `src/content/threads`
  and `src/content/topics` are deleted. MDX is compiled at request time.
- **The schema was rebuilt from scratch.** Ten migrations that had grown by
  accretion became six designed ones. A thread, a channel and a notebook section
  are one `documents` table plus a thin satellite each. Slugs are a domain, so a
  broken URL is impossible rather than unlikely. A published page cannot be
  empty, because the database will not hold one.
- `contact_messages` and `mentorship_requests` were one entity in two shapes with
  no handled state and no read path. They are one inbox, in a schema with no URL.

### Fixed

- **Content was served up to an hour stale after an edit**, while the editor
  reported that the cache had been cleared. `unstable_cache` with tags never
  invalidated here, in any form, and neither did tagging the underlying fetch.
  Measured, then removed: pages query per request, at 110ms for `/threads`.
- **Anonymous readers could not see the site.** Every reader policy read
  `status = 'published' or is_admin()`, and Postgres does not guarantee
  short-circuit evaluation of `OR`, so a signed-out visitor got
  `42501 permission denied` instead of rows.
- The sidebar showed 7 of 93 channels, because a satellite was readable only when
  its document was. The tree is public; the prose is what gets published.
- Two admins editing one document was silently last-write-wins.
- A production build that could not reach the database succeeded and prerendered
  nothing. It now fails.

### Security

- **Being able to sign in never implies being an admin.** Signup is open, by
  necessity: a student signing in with Google is a signup. The gate is a row in
  `private.admins` and `is_admin()` in every write policy, never the subdomain,
  which is routing. Verified by impersonating real JWT claims in both directions.
- `private` is not exposed to PostgREST, so the admin list, the revisions and the
  inbox have no URL at all.

## [0.4.2] - 2026-07-17

### Changed

- Retitled the routines thread to "Claude routines are cron jobs that can think"
  so the title, the /threads card, and the OG/SEO metadata name Claude. The slug
  is unchanged, so `/threads/claude-routines-and-cron` still resolves.

## [0.4.1] - 2026-07-17

### Added

- Cover image for the "Cron was easy because the job was dumb" thread, so it no
  longer renders coverless on the /threads grid. Designed in the site's canvas
  and fonts (the cron field motif with a hand-drawn ring) to match the thread's
  own pen annotations.

## [0.4.0] - 2026-07-17

### Added

- New thread: **"Cron was easy because the job was dumb"** — a deep, practical
  guide to Claude routines (cron jobs whose payload is an agent). Covers routine
  anatomy, a gallery of real routines with schedules and prompts, idempotency
  patterns, a cron syntax refresher, routines vs. loops, and observability.
  Includes a companion video link and a new `claude` tag.
- Hand-drawn **pen annotations** for thread prose (`Underline`, `Circle`, `Box`,
  `Strike`, `Highlight`) that draw themselves on scroll and are gated behind
  `prefers-reduced-motion`. Wired into MDX, so any thread can use them.
- **"On this page"** table of contents: a sticky right rail with scroll-spy that
  highlights the current section and jumps to any heading.
- **Cron diagram** component: a styled five-field breakdown replacing brittle
  ASCII art.
- **Copy to clipboard** buttons on thread code blocks.

## [0.3.0] - 2026-07-12

### Added

- Two threads on TypeScript 7, which shipped on 2026-07-08 as a native Go port
  of the compiler:
  - `why-typescript-7-is-written-in-go` covers the architecture. The 8-12x
    speedup came from a port rather than a redesign: the type checker's data is
    one cyclic graph that parallel workers must share, JavaScript workers cannot
    share objects, and so the checker had stayed single-threaded. Also covers why
    Go over Rust, the new `--checkers` / `--builders` flags, why
    `stableTypeOrdering` cannot be disabled, and the LSP rewrite.
  - `upgrading-to-typescript-7` is the migration guide: the compiler options that
    are now hard errors, the defaults that change a build silently (`strict`,
    `rootDir`, `types`), and the missing programmatic API that keeps
    typescript-eslint, Vue, Svelte, Astro and MDX on TypeScript 6 for now.
- Cover images for both threads in `src/lib/thread-covers.ts` (`color-stacks`,
  `planning-notes`).

## [0.2.1] - 2026-07-01

### Security

- Resolved Supabase Security Advisor warnings originating from our schema:
  `set_updated_at` is now `security invoker` with an empty `search_path` (fixes
  "function search path mutable"), and the public contact-form insert policy is
  bounded (non-empty, sane lengths) instead of `with check (true)` (fixes "RLS
  policy always true"). Added as `supabase/migrations/0002_security_advisor.sql`.

## [0.2.0] - 2026-07-01

### Added

- Per-user resume limit: each account can create at most 3 resumes. Enforced
  server-side in `createResume` (RLS-scoped count) and surfaced in the hub, which
  shows the count (n/3), disables "+ new resume" at the cap, and explains the
  limit with a banner (including when a template "use" was blocked).
- `docs/auth.md` documenting the authentication and authorization architecture
  (Supabase Auth + `@supabase/ssr` cookies + `getUser()` validation + Postgres
  Row-Level Security).

## [0.1.4] - 2026-07-01

### Fixed

- Mobile: the resume header's "binary.semaphore / resume" lockup overlapped the
  theme toggle and sign-in on phones. Phones now show just the "b." mark (keeping
  the "/ resume" links), with layout guards so the header groups can't overlap;
  the full lockup returns at the `sm` breakpoint.
- Mobile: the editor toolbar packed home / title / template / tune / json /
  export into one non-wrapping row, which overflowed and squeezed the title field
  to nothing. It now wraps (title row full-width, actions flowing below) on small
  screens and stays a single row on wider ones.
- The "tune" popover is capped to the viewport width so it can't hang off-screen
  on narrow devices.

## [0.1.3] - 2026-06-30

### Fixed

- Dark mode: the resume nav bar, the home "your resumes" / empty-state boxes, and
  the template gallery's search box and filter chips now use dark surfaces
  instead of staying light (which read as muddy grey over the dark canvas).
  Template cards stay light "sheets", but their pills keep light styling so they
  are not dark-grey on white.
- Template card actions are an even three-column row (copy / use / preview) that
  fills the footer. The home featured templates use the same 3-column grid as the
  gallery (two rows of three), so the cards match the gallery width and the
  "preview" button no longer overflows on the narrower cards.

### Changed

- Home resume row: edit and delete are now icon buttons (pencil / trash) with
  accessible labels, instead of text.
- Renaming a resume on the home hub now saves on Enter or blur (and reverts on
  Escape), replacing the standalone "save" button that looked like it saved the
  whole résumé.

## [0.1.2] - 2026-06-30

### Fixed

- New resumes started at the legacy 12mm page padding instead of the editor's
  15mm default (where "reset" lands); `createResume` now sets the padding
  explicitly so the app stays the source of truth.
- PDF export could return the login page as a "resume" PDF: when a forwarded
  session failed to authenticate, the print page redirected to `/login` and that
  screen was captured with HTTP 200. The route now returns 502 if the print page
  redirected away.
- A failed PDF export reused the save indicator and read "save failed" even
  though the resume was saved; the editor now shows a distinct, dismissible
  export error explaining the resume is saved and the export can be retried.

## [0.1.1] - 2026-06-30

### Fixed

- Resume PDF export 500ed in production: `@sparticuz/chromium` ships Chromium as
  brotli files under `bin/*.br` that nothing imports statically, so Next's file
  tracer left them out of the serverless function and `chromium.executablePath()`
  failed with "The input directory .../bin does not exist". Force-include those
  files for the PDF route via `outputFileTracingIncludes`.

## [0.1.0] - 2026-06-30

First tagged release. Adds the resume builder product and rounds out the
marketing site rebrand.

### Added

- Resume builder at `resume.binarysemaphore.com`: split editor (form plus live
  preview), JSON export, profile email, and a mobile editor toggle.
- A library of resume templates: classic, swiss, executive, minimal, saas,
  academic, display, dossier, indexcard, letterpress, mirror, periodical,
  specsheet, and more, with a consistent template-card gallery.
- Two-column template with a full-height sidebar rail and column-aware
  pagination (each column flows independently).
- WYSIWYG pagination: the on-screen preview breaks pages in the same place as
  the exported PDF, including breaking between text lines within a long bullet.
- PDF export via headless Chromium that mirrors the preview layout.
- Rich-text (markdown) description fields rendered as proper bulleted lists with
  hanging indents; clickable links kept off the printed resume's branding.
- Icon-led contact and links row, right-aligned project links, and tune options
  for text alignment, page size, and density.
- Supabase local development setup (CLI config plus initial migration).

### Changed

- Split `editor.tsx` into focused files and extracted a shared `BaseSection`
  template primitive (no behavior change).
- Moved unit tests to a top-level `tests/` tree mirroring `src/`.
- Marketing site: emphasize the resume builder, spinner-based save indicator,
  smoother loading states, and water-fill CTA hovers.

### Fixed

- Pagination correctness: measure the preview at true size so the half-width
  editor pane no longer clips lines; re-measure after web fonts load; correct
  breaks when the density (zoom) is not 100%; never orphan a heading at a page
  bottom; fill the page instead of pushing a whole section forward; never let a
  page slice exceed the printable area.
- Two-column experience date alignment and a clean full-height divider (not a
  gray box); projects placed in the main column.
- Invalid nested `<a>` in template cards (hydration error).
- Tolerate a missing `text_align` column before the migration runs.

[0.3.0]: https://github.com/BiSemaphore/binarysemaphore.com/releases/tag/v0.3.0
[0.2.1]: https://github.com/BiSemaphore/binarysemaphore.com/releases/tag/v0.2.1
[0.2.0]: https://github.com/BiSemaphore/binarysemaphore.com/releases/tag/v0.2.0
[0.1.4]: https://github.com/BiSemaphore/binarysemaphore.com/releases/tag/v0.1.4
[0.1.3]: https://github.com/BiSemaphore/binarysemaphore.com/releases/tag/v0.1.3
[0.1.2]: https://github.com/BiSemaphore/binarysemaphore.com/releases/tag/v0.1.2
[0.1.1]: https://github.com/BiSemaphore/binarysemaphore.com/releases/tag/v0.1.1
[0.1.0]: https://github.com/BiSemaphore/binarysemaphore.com/releases/tag/v0.1.0
