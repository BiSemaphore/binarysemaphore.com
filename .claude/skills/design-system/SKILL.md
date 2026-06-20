---
name: design-system
description: Binary Semaphore's visual language (Tailwind v4 tokens, colors, radii, fonts, component patterns). Use when building or restyling UI so new components match the existing look instead of inventing styles.
---

# Binary Semaphore design system

Tokens are defined in `src/app/globals.css` (`:root`, `.dark`, and the
`@theme inline` block that maps them to Tailwind utilities). Always use the
tokens/utilities below; do not hardcode hex values in components.

## Palette (light; `.dark` overrides exist)

- `--background` `#f6f6f4` (warm cream canvas) -> `bg-background`
- `--foreground` `#111111` (near-black ink) -> `text-foreground`
- `--muted` `#525252`, `--subtle` `#999999` -> `text-muted`, `text-subtle`
- `--border` `#e6e6e6` -> `border-border`
- `--card` `#ffffff`, `--card-hover` `#fafafa` -> `bg-card`, `hover:bg-card-hover`
- Dark contrast bands: `--band` `#111`, `--band-deep` `#1e1e1e`,
  `--band-border` -> `bg-band`, `border-band-border` (used for hero panel,
  contact band, footer)
- Brand accent: `--accent` / `--coral` `#a80000` (deep red) ->
  `bg-coral`, `text-accent-strong`. This is the only brand accent; no rainbow
  gradients.

## Radii, shadow, fonts

- Radii: `rounded-card` (1.25rem), `rounded-panel` (2rem), `rounded-blob`
  (2.5rem). Shadow: `shadow-soft`.
- Fonts: `font-display` (Inter Tight, headlines), `font-sans` (Plus Jakarta
  Sans, body/UI), `font-mono` (JetBrains Mono, labels/code), `font-doodle` /
  `font-hand` for occasional accents.

## Component patterns

- **Section wrapper:** `<section id="..." className="section scroll-mt-20">` with
  an inner `<div className="mx-auto w-full max-w-7xl px-6 lg:px-10">`. The
  `.section` class supplies vertical rhythm.
- **Section heading:** use the `<SectionHeading label title />` component (mono
  eyebrow + doodle-underlined display `h2`). Dedicated pages use `<PageIntro>`.
- **Primary button:** `bg-foreground text-background` pill/lozenge,
  `rounded-lg` or `rounded-full`, `text-sm font-semibold`, with an
  `ArrowUpRightIcon` and a subtle hover translate.
- **Card:** `rounded-panel border border-border bg-card shadow-soft`.
- **Chip/tag:** `rounded-full border border-border px-3 py-1 font-mono text-sm`.
- **Images:** render through `<Photo>` (object-cover, lazy, blur-up).

## Motion

Scroll reveals use `<Reveal>` (IntersectionObserver). All motion is gated behind
`prefers-reduced-motion` in `globals.css`. No heavy animation libraries.

## Theme

Class-based dark mode (`.dark` on `<html>`). **Default theme is light**; dark
applies only when the visitor explicitly toggles it (see the inline script in
`layout.tsx`). Keep components legible in both themes (e.g. dark logos sit on a
white tile).
