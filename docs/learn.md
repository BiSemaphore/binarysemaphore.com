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

### Grants, not just policies

RLS filters rows; it does not grant access to the table. Both are needed.
`0003_learn.sql` grants `select` explicitly rather than relying on Supabase's
default privileges for `public`, because on a stack built by the current CLI
those hand `anon` and `authenticated` only `Dxtm` (truncate, references,
trigger) with **no** `select`. Verified against a local `supabase db reset`:
without the explicit grant, `has_learn_access()` fails with "permission denied
for table entitlements" for every signed-in user.

Nothing grants insert, update or delete on `entitlements` to anybody. That is
what makes the trial tamper-proof: a signed-in user cannot mint a grant, extend
one, or delete a lapsed one to start over.

Note the same gap exists on `public.resumes` and `public.contact_messages`,
which were created before this was understood and carry no explicit grants.

### Watermarks

Two, doing different jobs.

**Brand, baked in at build time.** `BINARYSEMAPHORE.COM/LEARN` sits in the
running head of every page, added in `header_tpl` in the `learnings` repo's
`build.sh`. Same on every copy, costs nothing at download time. Changing it
means rebuilding and re-uploading the PDFs.

**Per reader, applied at download.** `src/lib/learn/watermark.ts` stamps
"Prepared for <email> · Binary Semaphore · <date>" into the bottom margin of
every page with `pdf-lib`. It does not stop anyone sharing the file, and is not
meant to: it makes a shared copy traceable. Roughly 200ms for a 71-page
notebook, and the output is smaller than the input because pdf-lib re-saves with
object streams.

Because the file is now personalised, the download route streams the bytes
rather than redirecting to a signed URL, and the response is
`Cache-Control: private, no-store`. A stamping failure falls back to the
unstamped file: an entitled reader must not lose their download over a
watermark. They cannot be revoked before they expire, so
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

## Reading in the browser

Every section of every notebook is a page: `learn.binarysemaphore.com/<slug>/<section>`.
The contents list on a notebook's page links straight into them.

**Same pattern as `/threads`.** A section is MDX, compiled at build time and
imported as a module, wrapped in `<article className="thread">`, styled by the
same components in `src/mdx-components.tsx`. There is one prose standard here,
not two.

### Generation

The books are written next door in a directive syntax the PDF typesetter
understands (`learnings/notebooks/AUTHORING.md`), so
`scripts/sync-notebooks.mjs` converts rather than copies. Per section it writes:

```
src/content/notebooks/<slug>/<section>.mdx        the free preview
src/content/notebooks/<slug>/<section>.rest.mdx   the rest, behind the gate
src/content/notebooks/<slug>/index.json           the ordered section list
```

`:::signal` becomes `<Signal>`, `:::term Sharding` becomes `<Term name="...">`,
`==peach==` becomes `<Peach>`, and so on. Those components live in
`src/components/learn/mdx.tsx` and are registered globally beside the thread
ones. The eight annotation blocks are given distinct weights on purpose: each
has one job, and if they all look alike the reader stops seeing any of them.

Marks inside fenced or inline code are left alone, because code is full of `==`,
`!!` and `++`.

`--check` fails on drift, and the script deletes files orphaned by a renamed or
removed section.

### The gate

Splitting happens at **generation** time, which is what makes it honest: the
gated half is a separate file, imported only inside the entitled branch, so for
anyone else it is not in the page at all. There is nothing hidden to reveal.

The cut is a share of the prose (35%), not a fixed number of blocks, with a
second cap at 50% of raw characters so a section made mostly of figures and
annotation blocks is not handed over whole. Median preview across the library is
about 22%.

Three things the splitter must not do, each of which broke it once and each of
which now has a test:

- cut inside a fenced block (ASCII figures contain blank lines),
- cut between a component's open and close tag (`<Term name="...">` did not match
  a naive "tag alone on a line" check),
- flatten a fence or table into a paragraph.

Under the gate sits a teaser: the first plain **paragraph** of the gated half,
stripped of markup and truncated to 180 characters at generation time. A table,
list or figure is skipped, because none of them survive being flattened to one
line.

Verified by fetching gated sections signed out and checking that no line of the
`.rest.mdx` appears in the HTML except the teaser.

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
