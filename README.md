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

## Backend (Supabase)

The backend is [Supabase](https://supabase.com) (hosted Postgres + Auth), called
from inside the app via `@supabase/ssr`. No separate service to host.

1. Create a Supabase project, then apply the schema with the CLI. Migrations in
   [`supabase/migrations/`](supabase/migrations) are the only source of truth
   for it; there is no `schema.sql` to keep in step any more.

   ```bash
   export SUPABASE_ACCESS_TOKEN=<a personal access token>
   npx supabase link --project-ref <ref>
   npx supabase db push
   ```

2. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Project Settings -> API). Add the same
   vars to the Vercel project env for production.
3. `SUPABASE_SECRET_KEY` is needed as well, for the contact and mentorship
   forms. They write to `private.inbox`, a schema not exposed to PostgREST, so
   the publishable key cannot reach it under any policy. Without this key those
   two routes return 503 and everything else works.
4. Clients live under [`src/utils/supabase/`](src/utils/supabase): `server.ts`
   (Server Components / Route Handlers / server actions), `client.ts` (browser),
   `middleware.ts` (session refresh, wired in `src/proxy.ts`, Next 16's renamed
   middleware convention), and `admin.ts` (service role, server-only). The first
   three use the publishable key and respect row-level security. `admin.ts`
   bypasses it, which is why it is `server-only` and why nothing else imports it.

The design and the reasoning behind it are in [`docs/database.md`](docs/database.md).

Worked example: `POST /api/contact`
([`src/app/api/contact/route.ts`](src/app/api/contact/route.ts)) validates a
submission and records it in the inbox through `record_inbox_message`.

```bash
curl -X POST http://localhost:3000/api/contact \
  -H 'content-type: application/json' \
  -d '{"name":"Ada","email":"ada@example.com","message":"hi"}'
```

### Auth

Sign-in uses Supabase Auth with **GitHub** and **Google** OAuth. Flow: `/login`
(buttons) -> provider -> `/auth/callback` (exchanges the code for a session) ->
`/account`. Sign out posts to `/auth/signout`. Gate any page by calling
`getCurrentUser()` from [`src/utils/supabase/auth.ts`](src/utils/supabase/auth.ts)
and redirecting to `/login` when it is null (see `src/app/account/page.tsx`).

To enable the providers (one-time, in dashboards):

1. **Supabase -> Authentication -> Providers:** enable GitHub and Google and
   paste each provider's Client ID/Secret.
   - **GitHub:** create an OAuth App at
     `https://github.com/settings/developers`. Authorization callback URL:
     `https://<project-ref>.supabase.co/auth/v1/callback`.
   - **Google:** create an OAuth client in Google Cloud Console (APIs & Services
     -> Credentials). Authorized redirect URI: the same Supabase callback URL.
2. **Supabase -> Authentication -> URL Configuration:** set the Site URL to the
   production URL and add redirect URLs `https://binarysemaphore.com/auth/callback`
   and `http://localhost:3000/auth/callback`.

## Workflow

Work on a feature branch and open a pull request; `main` is updated only by
merging a reviewed PR. Husky hooks enforce quality locally: `pre-commit` runs
lint-staged (ESLint + Prettier on staged files), `commit-msg` checks the message
against [Conventional Commits](https://www.conventionalcommits.org)
(`feat:`, `fix:`, `chore:`, ...), and `pre-push` runs typecheck and unit tests.

## CI/CD

GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs
lint, typecheck, and tests on every push and pull request, then deploys via the
Vercel CLI: a preview deployment for each PR and a production deployment on
`main`. Requires the `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`
repository secrets.
