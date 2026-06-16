# Binary Semaphore

The home of **Binary Semaphore** — a workshop building small, fast, local-first
developer tools, released early and built in the open. Source for
**[binarysemaphore.com](https://binarysemaphore.com)**.

Currently shipping [**inode**](https://github.com/BiSemaphore), a CLI knowledge
base that retrieves your notes, secrets, and commands by meaning instead of
exact keywords.

## Stack

- [Next.js](https://nextjs.org) 16 (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4
- MDX content pipeline for `/threads`
- Deployed on [Vercel](https://vercel.com)

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

## Editing content

All site copy and links live in [`src/lib/site.ts`](src/lib/site.ts) — the hero,
the feature grid, the project list, and social links. Edit there; components read
from that single source of truth. Long-form writing lives as MDX under
[`src/content/threads`](src/content/threads).

## CI/CD

GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs lint
and typecheck on every push and pull request, then deploys via the Vercel CLI —
a preview deployment for each PR and a production deployment on `main`. Requires
the `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID` repository secrets.
