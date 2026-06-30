# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Every release corresponds to a `staging` to `main` pull request and a matching
`vX.Y.Z` tag on `main`.

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

[0.1.0]: https://github.com/BiSemaphore/binarysemaphore.com/releases/tag/v0.1.0
