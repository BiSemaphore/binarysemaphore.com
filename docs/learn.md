# Study Notebooks (learn.binarysemaphore.com)

The notebook library: a set of long-form PDFs on backend and systems
engineering, gated behind an account and a time-limited grant. This document
covers how access works and how the files get there. Sign-in itself is
[`docs/auth.md`](./auth.md); nothing here replaces it.

## What it is

Eight notebooks, each built in up to three editions (Reading, Print, Tablet).
The books are written and typeset in a **separate repo** (`learnings/notebooks`,
markdown to PDF via its own build pipeline). This repo holds:

- the **catalog** in `src/lib/learn.ts` (titles, blurbs, page counts, table of
  contents, file names and sizes), which is the single source of truth for copy,
- the **access rules**, in Postgres and in `src/lib/learn/`,
- the **pages** under `src/app/learn/`.

The PDFs are not in git. They live in the private `notebooks` bucket in Supabase
Storage.

## Access model

A user gets an `entitlements` row per notebook. Today the only source is a free
trial; the row is what matters, not how it was created.

| State       | Means                                                            |
| ----------- | ---------------------------------------------------------------- |
| `anonymous` | Not signed in.                                                   |
| `none`      | Signed in, has never opened this notebook.                       |
| `active`    | May download. `expires_at` in the future, or null for perpetual. |
| `expired`   | Had a trial, and it ran out.                                     |

**The trial is 7 days, once per notebook.** It starts when the user clicks, not
when they sign up, so opening the library does not burn anything. It is
non-renewable: `start_learn_trial()` uses `on conflict do nothing`, so clicking
again after it lapses returns the expired row rather than extending it.

`TRIAL_DAYS` in `src/lib/learn/state.ts` is **copy only**. The authoritative
value is the `interval '7 days'` inside `public.start_learn_trial()`, because a
client must not be able to choose its own expiry. Change both together.

### Why payments are not here yet

They are deliberately absent, and the shape above is what makes adding them
cheap. A paid grant is the same row with `source = 'stripe'` and
`expires_at = null`, written by a Stripe webhook. `getAccess`, the storage
policy, the pages and the download route do not change. When that lands, the
only new rules are: grant **only** from the signed webhook (never from the
success redirect), and keep an event-id table for idempotency.

## Where authorization actually lives

In Postgres, twice, and only incidentally in the app.

1. **`public.entitlements` RLS.** Users may `select` their own rows. There is no
   insert, update or delete policy at all, so a client cannot mint, extend, or
   un-expire its own access. The single write path is
   `public.start_learn_trial()`, which is `security definer` and computes the
   expiry server-side.
2. **The storage policy on the `notebooks` bucket.** Objects are keyed
   `<slug>/<file>.pdf`, and the policy re-asks `has_learn_access()` using the
   first path segment. A signed URL cannot be created for a notebook the caller
   is not entitled to, whatever the route handler believes.

`src/app/api/learn/[slug]/[edition]/route.ts` checks access too, but only so it
can return a useful 403. It is a convenience, not the boundary. That is the same
argument as `docs/auth.md` makes for `resumes`: if the app code were wrong, the
database would still refuse.

If the storage policy in `0003_learn.sql` fails to apply on hosted Supabase
(`storage.objects` is owned by `supabase_storage_admin`, and the migration runs
as `postgres`), create it by hand in Storage -> Policies with the same
expression. Do not work around it by making the bucket public.

Signed URLs last **60 seconds**. They cannot be revoked before they expire, so
the window is deliberately short.

## Publishing a notebook

1. Write and build it in the `learnings` repo:
   ```bash
   cd ../learnings/notebooks && bash build.sh <slug> all
   ```
2. Add it to `notebooks` in `src/lib/learn.ts` (slug, series, number, title,
   subtitle, blurb, pages, contents, assets).
3. Add the slug to the seed in a migration, and to `SOURCE_DIRS` in
   `scripts/upload-notebooks.mjs`. `tests/lib/learn.test.ts` fails if the
   catalog and the seed drift apart.
4. Upload the files:
   ```bash
   SUPABASE_SECRET_KEY=... node scripts/upload-notebooks.mjs --dry-run
   SUPABASE_SECRET_KEY=... node scripts/upload-notebooks.mjs
   ```
   The secret (service-role) key is required, because uploading is exactly what
   RLS exists to stop a user doing. Never put it in `.env.local`.

## Routing

`learn` is an **app subdomain** (`APP_SUBDOMAINS` in `src/lib/subdomains.ts`),
so `learn.binarysemaphore.com/<slug>` is rewritten to `/learn/<slug>` by
`src/proxy.ts` and the apex redirects `/learn/*` to the subdomain in production.
Links use `learnBase()` from `src/lib/learn/paths.ts`, which returns `""` on the
subdomain and `/learn` in dev or on a preview URL.

Deploy checklist for a new environment:

- DNS record for `learn`, and the domain added to the Vercel project.
- `learn.binarysemaphore.com` added to the Supabase **redirect allowlist**
  (Authentication -> URL Configuration), or OAuth lands on the wrong host.

## SEO

Nothing gated is ever rendered into the HTML: the page ships the full table of
contents, and the PDF is a separate request. There is no cloaking risk and no
need for `isAccessibleForFree` markup. If long-form notebook text is ever
published as HTML behind the gate, that changes, and Google's paywalled-content
structured data becomes mandatory.
