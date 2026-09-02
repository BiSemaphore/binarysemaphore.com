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

A reader gets an `entitlements` row per notebook. Signing in and opening a
notebook grants it, and **it does not expire**.

| State       | Means                                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------------------------- |
| `anonymous` | Not signed in.                                                                                                 |
| `none`      | Signed in, has never opened this notebook.                                                                     |
| `active`    | May read it.                                                                                                   |
| `expired`   | A row from before access became permanent. Kept so an old row cannot read as active; nothing produces one now. |

### Why there is no clock and no price

These notebooks expand lectures by other people, credited on every notebook page
with a link to the lecture and the channel. Charging for that, or running a
countdown that ends at a payment prompt, is not a thing to do with someone
else's teaching.

The gate stays, because an account is what makes a download belong to somebody
and it is what reading progress hangs off. `0007` removed the expiry, cleared it
from existing rows so nobody mid-notebook was cut off, and replaced
`start_learn_trial()` with `grant_learn_access()`.

### If this ever changes

The shape still supports it: a paid grant would be the same row with a different
`source`, written by a webhook. But it should not be Binary Semaphore charging
for a notebook built on someone else's lecture.

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

A notebook is read continuously at `learn.binarysemaphore.com/<slug>/read`: every
section on one page, with the contents beside it following the scroll. The 387
old per-section URLs permanently redirect to their anchor.

**Same MDX pattern as `/threads`**: compiled at build time, imported as a module.

### Generation

`scripts/sync-notebooks.mjs` converts the books next door rather than copying
them. One `<section>.mdx` per section plus an `index.json` listing them in order
with each section's prose length.

`:::signal` becomes `<Signal>`, `:::term Sharding` becomes `<Term name="...">`,
`==peach==` becomes `<Peach>`. Components live in `src/components/learn/mdx.tsx`,
registered globally beside the thread ones.

Two things about the marks that were wrong for a while and are now tested:

- **Marks are applied to the whole section body, not line by line.** The books
  are set at about 80 columns, so a marked phrase regularly wraps. Applying per
  line meant such a mark could never close, and a third of the library's 1,120
  marks were silently dropped.
- **Code is masked, not split around.** A mark often wraps a code span
  (``==`LEFT JOIN`==``). Splitting on code put the two `==` in different pieces
  so the mark never matched. Masking keeps `==` and `++` inside code safe while
  letting a mark spanning code still close.

### The gate

Per book, not per section. A signed-out reader gets whole sections in order until
about 15% of the book's prose, minimum two, always stopping before the last.
Sections past the cut are **never imported**, so they are not in the page: there
is nothing hidden to reveal. Verified by fetching readers signed out and grepping
for text from beyond the cut.

### Typography

The reader uses the notebooks' own type system, taken from
`learnings/notebooks/engine/theme.css` and scoped to `.notebook` so it cannot
reach `/threads`: a serif body in the same stack the PDF uses (no extra webfont),
Caveat section titles, navy ink, blue-ruled `h3`.

A deliberate departure from `docs/brand.md`, on the same footing as the resume
product using Figtree: a product with its own established identity keeps it.

An ASCII figure (a `text` fence) renders as a quiet panel rather than a code
block, in a system mono stack that carries the box-drawing range in one face.
Our JetBrains Mono is subset to latin and does not include it.

## Reading progress

`public.reading_progress` records which sections a reader has opened, keyed by
(user, notebook, section slug). It drives three things: a tick beside read
sections, a progress bar, and "Continue reading" on the notebook page.

Stored in Postgres rather than the browser, so it follows the reader between
devices and matches the rest of the model.

**Unlike entitlements, a reader writes their own rows.** That is deliberate:
progress grants no access, and the worst a forged row can do is move your own
bookmark. The `with check (auth.uid() = user_id)` on the insert policy is what
stops one reader writing progress as another; verified by trying it as `anon`,
which returns `42501`.

Sections are keyed by slug because they are generated from the books and have no
database identity. A renamed section leaves a dead row, which the app ignores and
`summarise()` clamps so progress never reads over 100%.

Marking happens in `MarkRead`, a client component that calls a server action from
an effect: a render must not have side effects. It fires only for an entitled
reader, since someone seeing a gated preview has not read the section.

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
