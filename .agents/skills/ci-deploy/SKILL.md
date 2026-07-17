---
name: ci-deploy
description: Binary Semaphore's CI/CD (GitHub Actions + Vercel CLI). Use when changing the pipeline, adding checks, or debugging a failed CI run or deploy.
---

# CI / CD

Defined in `.github/workflows/ci.yml`. Runs on every push and pull request.

## Jobs

- **quality** (`Lint, Typecheck & Test`): `npm ci`, then `npm run lint`,
  `npm run typecheck`, `npm run test` (Vitest). Gates the deploys.
- **e2e** (`Smoke (Playwright)`): installs Chromium and runs `npm run test:e2e`.
- **deploy-preview**: on pull requests only, after `quality`. Builds and deploys
  a Vercel **preview** and comments the URL on the PR.
- **deploy-production**: on push to `main` only, after `quality`. Builds and
  deploys to Vercel **production**.

## Vercel setup (important)

- Deploys go through the Vercel CLI in the Action, using repo secrets:
  `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- Vercel's native Git auto-deploy is **disabled** via `vercel.json`
  (`git.deploymentEnabled: false`) so the Action is the only deployer (avoids
  double deploys). Do not re-enable it unless you also remove the deploy jobs.

## Flow

PR -> `quality` + `e2e` run, preview deploys with a URL comment. Merge to
`main` -> `quality` runs, then production deploys.

## Debugging a failed run

- **Lint/typecheck/test:** reproduce locally with the same script
  (`npm run lint` / `typecheck` / `test`). Note: CI runs `tsc` before any
  `next build`, so static image imports rely on the committed `image-types.d.ts`
  (Next's `next-env.d.ts` is git-ignored and absent in CI).
- **e2e:** `npm run test:e2e` locally; the Playwright `webServer` builds and
  starts the app in CI.
- **Vercel deploy:** check the `vercel build` / `vercel deploy` step logs. Most
  failures are a missing/expired secret or a build error that also fails
  `npm run build` locally. Reproduce with `npm run build`.

Never push directly to `main`; open a PR so the preview deploy and checks run
first.
