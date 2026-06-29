is there any way to have supabase as locally so we can use locally supabase?

Yes! You can run Supabase locally using their official CLI. Here's how:

## Prerequisites

- Docker Desktop installed and running
- Node.js (or you can use the binary directly)

## Installation

**Via npm:**

```bash
npm install -g supabase
```

**Via Homebrew (macOS/Linux):**

```bash
brew install supabase/tap/supabase
```

**Via Scoop (Windows):**

```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

## Setup a Local Project

```bash
# 1. Initialize Supabase in your project folder
supabase init

# 2. Start local Supabase (Docker must be running)
supabase start
```

After `supabase start`, you'll get local credentials like:

```
API URL:        http://localhost:54321
DB URL:         postgresql://postgres:postgres@localhost:54322/postgres
Studio URL:     http://localhost:54323
Anon Key:       eyJ...
Service Role:   eyJ...
```

## What Runs Locally

| Service         | Port          | Description   |
| --------------- | ------------- | ------------- |
| API (PostgREST) | 54321         | REST API      |
| Studio          | 54323         | Dashboard UI  |
| PostgreSQL      | 54322         | Database      |
| Auth (GoTrue)   | 54321/auth    | Auth service  |
| Storage         | 54321/storage | File storage  |
| Inbucket        | 54324         | Email testing |

## Use it in Your App

Just swap the URL and keys:

```js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "http://localhost:54321", // local API URL
  "your-local-anon-key", // from supabase start output
);
```

## Useful Commands

```bash
supabase stop          # Stop all services
supabase status        # Check running services & credentials
supabase db reset      # Reset DB and re-run migrations
supabase migration new my_migration   # Create a new migration
supabase db push       # Push local migrations to remote
```

## Tips

- **Studio UI** at `http://localhost:54323` gives you a full dashboard (table editor, SQL editor, auth users, etc.)
- **Inbucket** at `http://localhost:54324` catches all emails locally (great for testing auth flows)
- Use `.env.local` to switch between local and production keys easily
- Add `supabase/` to `.gitignore` only for generated files, but **commit** your migrations folder

This setup is great for development — full parity with the hosted Supabase platform, completely offline.

---

# Feasibility check for THIS repo (audited 2026-06-29)

Verdict: **feasible and worth doing.** The generic guide above is accurate, but
our project needs 4 specific adjustments it doesn't mention. Notes below are from
auditing how the app actually wires Supabase.

## What's already in our favour

- **Schema exists & is idempotent** — `supabase/schema.sql` is safe to re-run, so
  seeding a local DB is one command.
- **Env wiring is clean** — code reads `NEXT_PUBLIC_SUPABASE_URL` +
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in one place (`src/utils/supabase/*`).
  Swapping to local = just changing `.env.local`.
- Docker is installed (just needs to be _running_ — it was stopped during audit).
- Supabase CLI is NOT installed yet; `supabase/config.toml` and a `migrations/`
  folder don't exist yet (`supabase init` has not been run).

## The 4 gotchas the generic doc misses

1. **Key naming.** Our code uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, but
   `supabase start` prints it as `anon key`. Same thing locally — paste the local
   `anon key` into the `PUBLISHABLE_KEY` var. No code change needed.

2. **Schema isn't a migration.** We have `schema.sql`, not `supabase/migrations/`,
   so `supabase db reset` won't auto-apply it. Either:
   - Simplest: after `supabase start`, run the SQL once via Studio
     (`localhost:54323`) or `psql`.
   - Cleaner (recommended): `supabase init`, then move `schema.sql` into
     `supabase/migrations/0001_init.sql` so `db reset` rebuilds from scratch.

3. **OAuth is the real work.** Sign-in is **GitHub + Google OAuth only**
   (`signInWithOAuth` in `src/components/auth/sign-in-buttons.tsx`) — there is no
   email/password path. Local Supabase needs each provider configured in
   `supabase/config.toml` with a client id/secret, plus a dev OAuth app whose
   callback points at `http://127.0.0.1:54321/auth/v1/callback`.
   - Recommendation: for local dev, enable **email/magic-link auth** (captured by
     Inbucket at `localhost:54324`) instead of fighting OAuth setup — zero
     external apps, instant login. OR configure one GitHub dev OAuth app for
     parity.

4. **Subdomain redirect URLs.** We auth across both `localhost:3000` and
   `resume.localhost:3000` (redirectTo uses `window.location.origin`).
   `config.toml` must allowlist both:
   ```toml
   site_url = "http://localhost:3000"
   additional_redirect_urls = [
     "http://localhost:3000/**",
     "http://resume.localhost:3000/**",
   ]
   ```
   or the OAuth/magic-link callback breaks.

## Setup recipe (do this first, next time)

```bash
brew install supabase/tap/supabase     # CLI (not installed yet)
# start Docker Desktop first
supabase init                          # creates config.toml
# move schema.sql -> supabase/migrations/0001_init.sql
supabase start                         # boots local stack
# copy the printed anon key + URL into .env.local
supabase db reset                      # applies the migration
```

Then: edit `config.toml` for auth (gotchas 3 + 4), and add `supabase/.branches`
and `supabase/.temp` to `.gitignore`.

The only non-trivial piece is **auth** — steer toward local email/magic-link to
keep the dev loop frictionless.
