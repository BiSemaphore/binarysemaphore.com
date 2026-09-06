# Putting content in a backend

Research note, not a decision. The question: should topics, channels and their
prose live in Postgres, served to the frontend for server-side rendering, with
updates applied through migrations?

Short answer: **some of it should, and the prose almost certainly should not**,
for a reason specific to how this site is actually edited. The long answer is
below, with the exact mechanics either way.

## What exists today

| Data                                          | Where                                        | Edited by               |
| --------------------------------------------- | -------------------------------------------- | ----------------------- |
| The tree: 23 subjects, 93 channels            | `src/lib/learn/topics.ts`                    | a pull request          |
| Channel prose                                 | `src/content/topics/<subject>/<channel>.mdx` | a pull request          |
| Notebook catalog                              | `src/lib/learn.ts`                           | a pull request          |
| Entitlements, reading progress, note requests | Postgres                                     | the reader, through RLS |
| Notebook PDFs                                 | Supabase Storage                             | an upload script        |

So there is already a backend. It holds the things that are **per user** and
change **without a deploy**. Nothing about content is in it.

## Three kinds of data, three right answers

The useful question is not "database or files". It is **who edits this, and how
often**.

**Schema.** Tables, policies, indexes. Belongs in migrations, always. Already
does.

**Reference data that rarely changes and has no editor.** Enum-like rows, the
`learn_products` seed. Belongs in a migration or a seed file, because it is
effectively part of the schema.

**Content with an editor.** Prose, titles, blurbs. Belongs wherever its editor
works. This is the part worth thinking about, and the answer depends entirely on
who that editor is.

## The argument against moving prose to Postgres

Right now the editor is me, working through pull requests. For that editor, git
is not a worse database. It is a better one:

- **Review before publish.** A change is a diff you can read, on a preview
  deploy, before anyone sees it.
- **History per sentence.** `git blame` on a paragraph. A Postgres row gives you
  the current value and nothing else unless you build versioning yourself.
- **Rollback is a revert**, not a hand-written UPDATE against production.
- **The MDX pipeline already exists.** `rehype-pretty-code` highlighting, the
  `annotate` marks, the component map in `mdx-components.tsx`. Moving prose to a
  table means either re-implementing that server-side or storing rendered HTML,
  which loses the components.
- **Zero query per page.** A channel page currently reads a compiled module.

And the specific cost, which is the one that matters:

> Migrations are append-only and must not be edited after they are applied. The
> Supabase docs are explicit about this: editing an applied migration puts local
> and remote out of sync, because `supabase_migrations.schema_migrations` records
> what already ran.

So "update the content with a migration" means every typo fix is a **new,
permanent SQL file** containing an `UPDATE`. After a year of edits the migration
folder is a content changelog written in the least readable format available.
That is not a workflow, it is a punishment.

## The argument for moving it, which is real

Three things genuinely need a database, and none of them are about prose:

1. **Editing without a deploy.** If a channel needs fixing at 11pm from a phone,
   git does not help.
2. **Editors who are not developers.** The moment someone other than us writes a
   channel, a PR is a barrier.
3. **Anything per-user or counted.** Note requests, unread state, view counts,
   "most requested channel". Already in Postgres, correctly.

If (1) or (2) become true, the calculus flips. They are not true today.

## If we do move it: the design

`docs/topics.md` already promises this is a one-file change, and it is. Nothing
imports `src/content/topics/` except `topic-source.ts`.

### Schema

```sql
create table public.subjects (
  slug        text primary key,
  name        text not null,
  icon        text not null,
  blurb       text not null,
  position    integer not null default 0
);

create table public.channels (
  subject     text not null references public.subjects (slug) on delete cascade,
  slug        text not null,
  title       text not null,
  blurb       text not null,
  body        text,                    -- MDX source, not rendered HTML
  notebook    text,
  roadmap     text,
  reference   jsonb,
  position    integer not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (subject, slug)
);

alter table public.subjects enable row level security;
alter table public.channels enable row level security;

grant select on public.subjects, public.channels to anon, authenticated;

create policy "Anyone may read subjects"
  on public.subjects for select to anon, authenticated using (true);
create policy "Anyone may read channels"
  on public.channels for select to anon, authenticated using (true);
```

Note there is **no insert, update or delete policy**. Writes happen with the
service key from a script or an admin route, never from a browser. Same stance
as `entitlements`.

`body` stores **MDX source**, not HTML. Storing HTML would throw away the
components. Compiling MDX at request time is possible with
`next-mdx-remote-client` but costs a compile per render and gives up the build
time checking we get now, which is a real loss.

### Reading it, server-side

`cacheComponents` is **not** enabled in `next.config.ts`, so the model that
applies in Next 16.2.9 is the previous one: `unstable_cache` with tags, not
`use cache` and `cacheLife`.

```ts
import { unstable_cache } from "next/cache";

export const listSubjects = unstable_cache(
  async () => {
    const supabase = await createClient();
    const { data } = await supabase.from("subjects").select("*, channels(*)");
    return data ?? [];
  },
  ["topics-tree"],
  { tags: ["topics"], revalidate: 3600 },
);
```

Pages stay server components and still render on the server, so nothing about
SEO changes. After a write, `revalidateTag("topics")` invalidates it.

The important part: **without caching, every channel page becomes a database
round trip**, where today it is a compiled import. Get the tags wrong and the
site is both slower and stale, which is the worst of both.

## Migrations: the workflow, and a problem we already have

The Supabase CLI workflow is:

```
supabase migration new add_topic_tables   # creates a timestamped file
# write the SQL
supabase db reset                          # test against a local database
git add supabase/migrations && git commit
supabase login                             # personal access token
supabase link --project-ref <ref>
supabase db push                           # apply to the hosted project
```

`supabase_migrations.schema_migrations` on each database records what has run, so
`db push` applies only what is new, in timestamp order.

**Two things about our repo make this not yet true here.**

First, our migrations are named `0001_init.sql` through `0010_note_requests.sql`.
The CLI expects `YYYYMMDDHHMMSS_name.sql` and orders by that timestamp. Ours sort
correctly by luck, not by design.

Second, and more important: **every migration so far was applied by hand in the
SQL editor**, which is what the README documents. So the hosted database has the
tables but its `schema_migrations` table does not know about them. Running
`db push` today would try to re-apply all ten from scratch. Most are written with
`if not exists` and `drop policy if exists` so they would survive it, but that is
luck rather than a plan.

Adopting the CLI properly means a one-time reconciliation: baseline the existing
migrations as already-applied with `supabase migration repair --status applied`,
then use the normal flow from there.

That is worth doing **regardless of the content question**, because it also fixes
the thing blocking us right now: `0010_note_requests.sql` is written, committed,
and not applied, and I cannot apply it because the SQL editor is the only path
and it needs your hands.

### Content updates should not be migrations either way

Even in the all-in-Postgres design, content changes should go through a **seed
script**, not a migration:

```
scripts/sync-topics.mjs      # reads topics.ts + MDX, upserts into Postgres
```

Run it in CI on merge to main. It is idempotent, re-runnable, and does not leave
a permanent SQL file per typo. Migrations then stay what they should be: schema
only.

Which is, if you look at it squarely, git as the source of truth with Postgres as
a read replica. That is a defensible design. It is also an admission that git was
the source of truth all along.

## Recommendation

**Now:** adopt the CLI for schema, baseline the ten existing migrations, and get
`0010` applied. That unblocks the note-request button and makes every future
schema change one command instead of a copy-paste.

**Keep prose in MDX** while I am the only editor. The properties git gives us
here are the ones that matter, and the database buys nothing we currently need.

> **Superseded, same day.** Shahid proposed an admin at
> `admin.binarysemaphore.com` for managing threads and learning modules. That is
> exactly condition (1) above: editing without a deploy. With an admin in the
> plan, content in Postgres stops being overhead and becomes the point, because
> a form cannot open a pull request. See `docs/admin.md`.
>
> The one thing to carry across: **the sync script direction reverses.** Today
> git is the source of truth. With an admin, Postgres is, and git holds the
> schema and the seed. Deciding which way that arrow points is the whole
> migration, and doing it in both directions at once is how content gets lost.

**Build in Postgres anything per-user or counted**, which is already the rule:
note requests, unread state, and the "most requested channel" ranking that tells
us what to write next. That last one is the genuinely valuable backend feature
and it does not require moving a single word of prose.
