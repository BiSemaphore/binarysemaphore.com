# Binary Semaphore

Marketing and portfolio site for **Binary Semaphore**, a small software team
working across applied AI, distributed systems, and developer tools. Source for
**[binarysemaphore.com](https://binarysemaphore.com)**.

Current focus: [**inode**](https://github.com/BiSemaphore), a CLI knowledge base
that retrieves notes, secrets, and commands by meaning instead of exact keywords.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router) + TypeScript (strict)
- [Tailwind CSS](https://tailwindcss.com) v4
- MDX content pipeline for `/threads`
- [Vitest](https://vitest.dev) (unit) and [Playwright](https://playwright.dev) (smoke)
- Deployed on [Vercel](https://vercel.com)

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

## Scripts

| Script              | What it does               |
| ------------------- | -------------------------- |
| `npm run dev`       | Local dev server           |
| `npm run build`     | Production build           |
| `npm run start`     | Serve the production build |
| `npm run lint`      | ESLint                     |
| `npm run typecheck` | `tsc --noEmit`             |
| `npm run test`      | Unit tests (Vitest)        |
| `npm run test:e2e`  | Smoke tests (Playwright)   |

## Project structure

- `src/app/` — routes (`/`, `/about`, `/services`, `/projects`, `/team`,
  `/contact`, `/threads`, plus `/projects/[slug]`, `/team/[slug]`,
  `/threads/[slug]`), `layout.tsx`, `globals.css`.
- `src/components/` — section and UI components.
- `src/lib/site.ts` — **single source of truth** for all copy, links, the team,
  and projects. Edit copy here, not in components.
- `src/content/threads/*.mdx` — long-form posts; frontmatter parsed by
  `src/lib/threads.ts`.
- `src/images/` — optimized photography (statically imported for blur-up).
- `public/tech/` — technology logos for the stack section.
- `e2e/` — Playwright smoke tests.

## Editing content

All site copy and links live in [`src/lib/site.ts`](src/lib/site.ts); components
read from it. Long-form writing lives as MDX under
[`src/content/threads`](src/content/threads).

Copy voice: plain and human, no em dashes, no marketing slogans. See
[`AGENTS.md`](AGENTS.md) for the full guidelines.

## Testing

```bash
npm run test       # Vitest unit tests (lib + site config invariants)
npm run test:e2e   # Playwright smoke tests (key routes, nav, contact)
```

Unit tests live next to the code as `*.test.ts`; smoke tests live in `e2e/`.

## Workflow

Work on a feature branch and open a pull request; `main` is updated only by
merging a reviewed PR. A `pre-commit` hook runs ESLint on staged files and a
`pre-push` hook runs typecheck and unit tests (via Husky + lint-staged).

## CI/CD

GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs
lint, typecheck, and tests on every push and pull request, then deploys via the
Vercel CLI: a preview deployment for each PR and a production deployment on
`main`. Requires the `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`
repository secrets.
