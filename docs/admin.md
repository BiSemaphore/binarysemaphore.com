# admin.binarysemaphore.com

Design for the admin surface: one place to create and edit threads, subjects,
channels and notebook metadata, without a deploy.

This is a design, not a description of something that exists. Nothing in here is
built yet.

## What moves, and what does not

The rule Shahid set: **content stays where it is served from**. The admin manages
everything, but nothing relocates.

| Thing                 | Served from                   | Managed from   | Storage after this    |
| --------------------- | ----------------------------- | -------------- | --------------------- |
| Threads               | `binarysemaphore.com/threads` | admin          | Postgres (MDX source) |
| Topic channels        | `learn.…/topics`              | admin          | Postgres (MDX source) |
| Subjects and the tree | `learn.…/topics`              | admin          | Postgres              |
| Notebook catalog      | `learn.…/notebooks`           | admin          | Postgres              |
| Notebook PDFs         | Supabase Storage              | admin (upload) | unchanged             |
| Roadmaps              | `learn.…/roadmaps`            | later          | `roadmaps.ts` for now |

**The content format stays MDX.** Not a rich-text editor, not HTML. The admin
gives you a textarea with the MDX in it, because that is what we already write
and what the marks and code fences depend on.

## Authentication, and the trap in it

Shahid asked for email and password rather than OAuth. That is fine, and
Supabase supports both providers on one project at once. But there is a hazard
worth stating before anyone touches a dashboard toggle.

**Today the only way in is OAuth.** `sign-in-buttons.tsx` calls
`signInWithOAuth` and nothing anywhere calls `signInWithPassword` or `signUp`.
Students sign in with GitHub or Google to open a notebook.

So the obvious move, disabling public signups so nobody can create an admin
account, **would break learn**, because a new student signing in with Google is
a signup. One Supabase project serves both surfaces.

The resolution is the thing to internalise:

> **Being able to sign in must never imply being an admin.**

Authentication says who you are. Authorisation says what you may do. Keep public
signup on for learn, add email and password as a second provider, and let a row
in a table decide who is an admin. Then it does not matter how someone
authenticated, or that anyone in the world can get an account.

Confirm in the dashboard whether "allow new users to sign up" is global or
per-provider before relying on it. If it is per-provider, turn it off for email
only: admin accounts are then created by hand or by `inviteUserByEmail()` with
the service key, and OAuth signup keeps working for students.

## Authorisation: the actual gate

```sql
create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  added_at   timestamptz not null default now()
);

alter table public.admins enable row level security;
grant select on public.admins to authenticated;

create policy "Admins can see the admin list"
  on public.admins for select to authenticated
  using (public.is_admin());
```

There is **no insert, update or delete policy on `admins`**. An admin cannot
promote anyone, including themselves. Adding one is a deliberate act with the
service key. That is the same shape as `entitlements`, which has no client write
path at all, and it is the reason that table has never leaked.

```sql
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
```

`security definer` so it can read `admins` regardless of the caller's own
policies, `stable` so Postgres can cache it within a statement, and an explicit
`search_path` because a definer function without one is a privilege escalation
waiting to happen.

Every write policy on every content table is then `using (public.is_admin())`.

### Three layers, and only one of them is a boundary

1. **The subdomain** routes. `APP_SUBDOMAINS` already maps `resume` and `learn`;
   `admin` is one more line. **This is not security.**
2. **The layout** checks `is_admin()` server-side and renders nothing otherwise.
   Good for UX, still not the boundary.
3. **RLS** refuses the write. **This is the boundary.**

Layer 1 has two known holes and both are already visible in the code.
`binarysemaphore.com/admin` reaches the same route tree on the apex, and
`parseHost()` returns `{root: null, sub: null}` for an unrecognised host, which
the proxy deliberately leaves untouched, so a Vercel preview URL would serve
`/admin` with no subdomain gate at all. Neither matters if layer 3 is right, and
both are fatal if it is not.

## Sessions and bearer tokens

Supabase already issues a JWT per session, and `@supabase/ssr` already stores it
in cookies and refreshes it in `src/proxy.ts`. That is the session mechanism, and
the admin should use it unchanged.

A separate long-lived bearer token is a **second credential that can leak and
cannot be revoked by signing out**. If the goal is scripted writes, the service
key already does that from server code. If the goal is a token for an external
tool later, issue it then, scope it, and store a hash rather than the token.

Recommended for the admin, because it is the one surface where account
compromise is worst:

- shorter session lifetime than the reader surfaces
- reauthentication before destructive actions
- Supabase MFA on admin accounts, which is a real gap in the password path and
  the strongest argument OAuth had

## Content storage and rendering

MDX source in a `text` column. Not HTML: storing rendered HTML throws away the
components, and `<Underline>` and the code fences are the point.

That means MDX must be compiled **at request time** rather than at build. The
tool is `next-mdx-remote-client`, v2 for React 19, imported from
`next-mdx-remote-client/rsc`. It takes the same `remarkPlugins` and
`rehypePlugins` we already configure in `next.config.ts` and the same components
map from `mdx-components.tsx`, so threads keep their exact look.

### The security consequence, stated plainly

**MDX is executable.** Rendering it evaluates compiled JavaScript on the server.
The library's own documentation says never to render user-supplied MDX without
sanitisation, and that runtime evaluation carries XSS and RCE risk.

Only admins can write it, so the threat model becomes: **an admin account
compromise is server-side code execution**, not merely a defaced page. That is a
real escalation from where we are today and it is the strongest reason for MFA
and a short session.

Mitigations, in order of value: keep `admins` tiny; require MFA; consider
`remark-mdx-remove-expressions` to strip `{...}` expressions at the syntax level,
which still allows components and prose while removing arbitrary evaluation;
never render a channel body from any source other than these tables.

### What this costs

Every thread and channel page becomes a database read plus an MDX compile,
where today it is a compiled import. That is why caching is not optional here.

`cacheComponents` is not enabled, so the model is `unstable_cache` with tags:

```ts
export const getThread = unstable_cache(
  async (slug: string) => {
    /* select from threads */
  },
  ["thread"],
  { tags: ["threads"], revalidate: 3600 },
);
```

and `revalidateTag("threads")` in the admin's save action. Get the tags wrong and
the site is slower _and_ stale, which is worse than either alone.

We also lose two real things, and they should be lost knowingly: **build-time
MDX errors** become runtime errors, so a bad paste breaks a live page rather
than a build; and **preview-deploy review of copy** goes away, because there is
no diff any more.

The first is worth mitigating: compile on save in the admin, refuse to store MDX
that does not compile, and keep the last good version.

## Modules

Each is list, create, edit, delete, and each needs its own policies.

| Module        | Table           | Notes                                                                     |
| ------------- | --------------- | ------------------------------------------------------------------------- |
| Threads       | `threads`       | slug, title, description, date, tags, body, published                     |
| Subjects      | `subjects`      | slug, name, icon, blurb, position                                         |
| Channels      | `channels`      | subject, slug, title, blurb, body, notebook, roadmap, reference, position |
| Notebooks     | `notebooks`     | the catalog now in `learn.ts`                                             |
| Note requests | `note_requests` | read-only queue, already exists, still unapplied                          |

Two behaviours worth designing rather than discovering:

**Draft and publish.** A `published boolean`. Readers filter on it, admins do
not. Without it every save is live, which is the thing a CMS is supposed to save
you from.

**Revisions.** A `<table>_revisions` row per save, storing the previous body.
This buys back the rollback that leaving git costs us, and it is much cheaper to
add now than to reconstruct later when someone overwrites a good page.

## The direction of the arrow

The decision that matters most, and the one that quietly ruins projects:
**after this, Postgres is the source of truth and git is not.**

The sync runs **once, in one direction**: a script reads the current
`src/content/threads/*.mdx`, `topics.ts` and `src/content/topics/**` and upserts
them into Postgres. After that the files are deleted, or kept read-only as a
historical record with a comment saying so. Two-way sync, or leaving both live
and editable, is how content gets silently lost.

## Scenarios checked

| Scenario                                  | Answer                                                                                                      |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Student signs in with Google              | Works. Not in `admins`, so no admin access anywhere.                                                        |
| Anyone finds `binarysemaphore.com/admin`  | Layout check fails, RLS refuses writes.                                                                     |
| Someone hits `<preview>.vercel.app/admin` | Same. The subdomain gate is absent there, which is why it is not the gate.                                  |
| Admin token stolen                        | Session cookie, so it expires and signing out kills it. This is why not a long-lived bearer token.          |
| Admin pastes MDX that does not compile    | Refused on save; last good version stays live.                                                              |
| Admin pastes malicious MDX                | Runs on our server. Only mitigation is trusting the small `admins` list, plus MFA and expression stripping. |
| Two admins edit the same thread           | Last write wins today. Add `updated_at` checking if it ever matters.                                        |
| Database is down                          | Every content page fails, where today they are static. The cache softens it; nothing removes it.            |
| We want a page back after a bad edit      | Revisions table. Without it, nothing.                                                                       |

## Build order

Each step is useful alone and none of them breaks what exists.

1. **Baseline the migrations with the Supabase CLI** and apply the outstanding
   `0010`. Nothing else here is sane while migrations are applied by hand.
2. **`admins`, `is_admin()`, and the policies.** The gate, before any UI.
3. **The subdomain and a signed-out page.** Routing plus the layout check.
4. **Threads first**, as the smallest complete vertical: table, sync from the
   eight existing files, runtime rendering, admin list and editor. Threads are a
   better first module than channels because there are eight of them and their
   shape is simple.
5. **Subjects and channels**, the same way, once threads have proved the pattern.
6. **Notebook catalog**, last, because it is bound up with Storage and
   entitlements.

Roadmaps stay in `roadmaps.ts` until there is a reason to move them.
