# Authentication & authorization

How sign-in and per-user data access work across this app (the marketing site
plus the `resume.binarysemaphore.com` product). Short version: we use **Supabase
Auth** as the identity provider, the official `@supabase/ssr` package for
cookie-based sessions in the Next.js App Router, and **Postgres Row-Level
Security (RLS)** for authorization. There is no bespoke auth code to trust; the
security lives in Supabase and the database, not in application logic.

## The pieces

- **Supabase Auth (GoTrue)** — issues and validates JWTs, runs the GitHub/Google
  OAuth flows, and manages refresh tokens. This is our equivalent of
  NextAuth/Auth0/Clerk. We don't hand-roll password hashing, token signing, or
  session storage.
- **`@supabase/ssr`** — the official SSR integration. It stores the session in
  **httpOnly cookies** (not readable by browser JS) and gives us server/browser
  Supabase clients that read and refresh those cookies. See
  `src/utils/supabase/server.ts`, `client.ts`, and `middleware.ts`.
- **Middleware (`src/proxy.ts` → `updateSession`)** — runs on matching requests,
  calls `supabase.auth.getUser()` to keep the session fresh and rotate refresh
  tokens, and forwards the updated cookies. It no-ops when Supabase env vars are
  absent, so the site still builds and renders signed-out.
- **RLS policies (`supabase/schema.sql`)** — every `resumes` row is owned by a
  `user_id`, and policies restrict select/insert/update/delete to
  `auth.uid() = user_id`. Authorization is enforced by Postgres, so a bug in app
  code cannot leak another user's data.

## `getCurrentUser()` and why it's in a layout

`src/utils/supabase/auth.ts` exports:

```ts
export const getCurrentUser = cache(async (): Promise<User | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
});
```

Two things matter here:

1. **We use `getUser()`, not `getSession()`.** `getSession()` only decodes the
   cookie locally and is not trustworthy on the server (a cookie can be forged).
   `getUser()` sends the token to the Supabase Auth server and **validates it**
   before returning. Every server-side identity read in this repo uses
   `getUser()` — the auth wrapper, the middleware, and the data layer
   (`src/lib/resume/db.ts`). This is the pattern Supabase and Vercel document as
   the correct, secure approach for the App Router.
2. **It's wrapped in React `cache`.** A single request (e.g. the resume layout
   rendering the header plus the page reading the user) shares one validated
   `getUser()` call instead of hitting the auth server multiple times.

So seeing `const user = await getCurrentUser()` in a layout is the right thing:
it renders the header's signed-in/out state from a validated user, deduped per
request.

## The request lifecycle (signed-in user loading a resume)

1. Browser sends its Supabase auth cookies with the request.
2. Middleware (`proxy.ts`) refreshes the session via `getUser()` and forwards
   fresh cookies.
3. The Server Component (page/layout) calls `getCurrentUser()`, which validates
   the JWT with Supabase and returns the user (or `null` → redirect to
   `/login`).
4. Data access in `src/lib/resume/db.ts` runs queries as that user. **RLS** on
   `public.resumes` guarantees the query can only ever see or modify that user's
   rows, regardless of what the app code asks for.

## Defense in depth

Authorization does **not** depend on application code remembering to filter by
user. Even if a query in `db.ts` forgot its scoping, the RLS policies would still
return only the caller's rows. App code scopes queries for clarity and
efficiency; the database enforces the security boundary. That is stricter than
many NextAuth-style setups, where authorization lives entirely in app code.

## Configuration

- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  (safe in the browser). Set in `.env.local` and in the Vercel project env.
- OAuth providers (GitHub, Google) are enabled in the **hosted Supabase
  dashboard** (Authentication → Providers), with each provider's callback set to
  `https://<project-ref>.supabase.co/auth/v1/callback`. The app's own callback
  route is `src/app/auth/callback/route.ts`, which exchanges the OAuth code for a
  session. Local dev can enable providers via `supabase/config.toml`.
- Redirect allowlist (Authentication → URL Configuration) must include the apex
  and the `resume` subdomain so the OAuth/magic-link callback lands correctly.
