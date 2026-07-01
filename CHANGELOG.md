# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Every release corresponds to a `staging` to `main` pull request and a matching
`vX.Y.Z` tag on `main`.

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

[0.2.0]: https://github.com/BiSemaphore/binarysemaphore.com/releases/tag/v0.2.0
[0.1.4]: https://github.com/BiSemaphore/binarysemaphore.com/releases/tag/v0.1.4
[0.1.3]: https://github.com/BiSemaphore/binarysemaphore.com/releases/tag/v0.1.3
[0.1.2]: https://github.com/BiSemaphore/binarysemaphore.com/releases/tag/v0.1.2
[0.1.1]: https://github.com/BiSemaphore/binarysemaphore.com/releases/tag/v0.1.1
[0.1.0]: https://github.com/BiSemaphore/binarysemaphore.com/releases/tag/v0.1.0
