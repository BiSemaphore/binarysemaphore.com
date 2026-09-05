# Topics (learn.binarysemaphore.com/topics)

The computer science topic tree: 64 topics in 12 groups, browsed in a shell
modelled on Discord's rail-and-channel layout. This document covers the
taxonomy, where topic content lives, and the one part of it that needs a
database. Sign-in is [`docs/auth.md`](./auth.md) and the notebook library is
[`docs/learn.md`](./learn.md); nothing here replaces either.

## What it is

`learn` had three things: a mentorship pitch at `/`, roadmaps, and the notebook
library. None of them let a student browse. Someone arriving wanting "operating
systems" had nowhere to go.

Topics is that place. A rail of groups on the far left, a collapsible sidebar of
topics named `# like-this`, a main pane, and both sides scrolling independently.

The structure is Discord's because the problem is Discord's: a tree too big for a
menu. A dropdown caps out around forty entries before it stops being scannable.
We start at 64 and will grow.

**What it is not**, deliberately:

- Not an admin. Editing a topic is a pull request.
- Not a discussion board. Comments are an obvious later phase and the schema
  below does not block them, but they are not here.
- Not a Discord clone visually. We took the information architecture, not the
  palette. See [The shell](#the-shell).

## The taxonomy

Twelve groups. This table is canonical: if `src/lib/learn/topics.ts` and this
document disagree, one of them is a bug.

| Group                | Topics                                                                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Languages**        | `c` `c-plus-plus` `java` `python` `javascript` `typescript` `sql` `go`                                                                        |
| **DSA**              | `arrays-and-strings` `linked-lists` `stacks-and-queues` `trees` `graphs` `hashing` `sorting-and-searching` `dynamic-programming` `complexity` |
| **Maths for CS**     | `discrete-mathematics` `probability-and-statistics` `linear-algebra` `maths-for-data-science`                                                 |
| **Foundations**      | `theory-of-computation` `compiler-design` `computer-organisation` `software-engineering`                                                      |
| **Systems**          | `operating-systems` `concurrency` `distributed-systems` `system-design`                                                                       |
| **Networking**       | `computer-networks` `tcp-and-ip` `http` `dns-and-domains` `sockets`                                                                           |
| **Data**             | `dbms` `postgres` `data-modelling` `caching` `object-storage` `data-at-scale`                                                                 |
| **Building**         | `web-fundamentals` `frontend-and-react` `backend-and-apis` `testing` `deployment`                                                             |
| **Security**         | `web-vulnerabilities` `auth-and-authorisation` `cryptography` `network-security`                                                              |
| **Cloud and DevOps** | `docker` `kubernetes` `ci-cd` `aws` `observability`                                                                                           |
| **AI**               | `how-llms-work` `embeddings-and-retrieval` `mcp` `agents` `working-with-claude`                                                               |
| **Toolbox**          | `git` `linux-and-the-shell` `shell-scripting` `debugging` `the-editor`                                                                        |

Two rules hold this together.

**A topic belongs to exactly one group.** DSA is its own group rather than living
inside Foundations because it carries placement season almost single-handedly,
and burying it three levels down misrepresents how much of a student's year it
takes. Anything that feels like it belongs in two groups is usually two topics.

**Slugs are flat and permanent.** The URL is `/topics/operating-systems`, never
`/topics/systems/operating-systems`. The group drives the sidebar and nothing
else. This is the whole reason regrouping is cheap: move `concurrency` from
Systems to Foundations tomorrow and not one link on the internet breaks. Renaming
a slug, on the other hand, is a breaking change and needs a redirect.

## Topic states

Every topic declares what actually exists behind it. This is the most important
rule in the system, because 54 of 64 topics have nothing written yet and a
navigation tree that implies otherwise is a lie the reader discovers on click.

| State      | Means                              | UI                               |
| ---------- | ---------------------------------- | -------------------------------- |
| `notebook` | One of the ten notebooks covers it | Links to the notebook            |
| `roadmap`  | A roadmap passes through it        | Links to the roadmap stop        |
| `soon`     | Nothing of ours yet                | Canonical reference plus an hour |

Ten topics are notebook-backed today: `postgres`, `caching`, `object-storage`,
`backend-and-apis`, `auth-and-authorisation`, `web-vulnerabilities`,
`system-design`, `software-engineering`, `sockets` and `data-at-scale`. Two are
roadmap-backed: `frontend-and-react` and `javascript`. Threads add a third,
weaker signal on a handful more.

A `soon` topic is not an empty page. It gives the reader the canonical reference
(MDN, the Postgres manual, react.dev) and the offer of a session, which is the
honest answer to "we have not written this yet". An empty room is worse than a
locked door.

## Where content lives

In MDX, in git, behind an interface.

```
src/content/topics/<slug>.mdx        the prose, compiled at build
src/lib/learn/topics.ts              the tree: groups, topics, states
src/lib/learn/topic-source.ts        getTopic() / listTopics(), the seam
src/app/api/topics/route.ts          GET the tree as JSON
src/app/api/topics/[slug]/route.ts   GET one topic as JSON
```

Pages call `topic-source.ts` and server-render. The API serves the same data for
any client-side or third-party consumer, but it is **not in the page's critical
path**. This matters: a student stuck at midnight finds us through search, and a
tree fetched after hydration is invisible to a crawler.

Prose loads with the pattern already proven in the notebook reader
(`src/app/learn/notebooks/[slug]/read/page.tsx`):

```ts
const { default: Body } = await import(`@/content/topics/${slug}.mdx`);
```

### Why not Postgres

This was decided deliberately and is the decision most likely to be revisited, so
the reasoning is written down while it is fresh.

MDX in git keeps four things a database would cost us: git history on every
sentence, pull request review of content changes, preview deploys of a draft, and
the `rehype-pretty-code` highlighting that is already wired through
`src/mdx-components.tsx`. It also costs zero database round trips per page view.

What it costs: adding a topic needs a deploy, and nobody outside the repo can
contribute.

### The exit route

If that trade stops being worth it, `topic-source.ts` is the only file that
changes. It exposes two functions and nothing else imports the filesystem or the
MDX path directly:

```ts
listTopics(): Promise<TopicMeta[]>
getTopic(slug: string): Promise<TopicMeta & { Body: ComponentType }>
```

A Postgres implementation returns the same shapes. Pages, the shell, the API
routes and the sidebar all keep working untouched. Keep it that way: **no page
may import from `src/content/topics/` directly.**

## The unread model

The one part of this that genuinely needs a backend.

The feature worth copying from Discord is the unread dot, and it is per-user, so
it cannot be static. Everything else about the tree can be, and is.

Each topic's MDX frontmatter carries a `rev` integer, bumped by hand when the
content meaningfully changes. Each reader has a `seen_rev`. If
`seen_rev < rev`, the topic shows a dot.

One query returns the whole map for a reader, the same shape as `getAllProgress()`
in `src/lib/learn/progress.ts`. Sixty-four topics cost one round trip, not
sixty-four. Anyone adding a per-topic lookup inside a loop has broken this.

Marking a topic seen goes through a server action beside
`src/app/learn/actions.ts`, matching `markReadAction`. Not a client fetch, and
never during render: a render must not have side effects.

Signed out, there is no state and no dot. The tree is identical, which is
intentional; nothing about browsing is gated.

## Where authorization lives

In Postgres, and only incidentally in the app. Same stance as the notebooks.

`public.topic_visits` (migration `0010`) is a straight copy of
`reading_progress` (`0006`), because it is the same shape of data and those
policies are already proven:

```sql
create table public.topic_visits (
  user_id    uuid not null references auth.users (id) on delete cascade,
  topic      text not null,
  seen_rev   integer not null default 0,
  visited_at timestamptz not null default now(),
  primary key (user_id, topic)
);
```

RLS on, and `select` / `insert` / `update` / `delete` granted to `authenticated`
with every policy restricted to `auth.uid() = user_id`. The `with check` on
insert is what stops one reader writing state as another, and it bounds
`char_length(topic)`.

Unlike `entitlements`, the reader writes these rows directly. That is safe
because the data is harmless and self-owned: forging it grants no access, and the
worst a tampered row can do is clear your own unread dot.

**No existing table gains a grant.** If a change to topics appears to need one,
it is the wrong change.

### The grant trap

Worth restating, because it has bitten this repo before: enabling RLS filters
rows, it does not grant table access. A policy without a matching `grant` gives
`permission denied for table`, not an empty result. Both are required.

## The shell

Routes:

```
src/app/learn/topics/layout.tsx      the shell: rails, drawer, palette
src/app/learn/topics/page.tsx        the landing, inside the shell
src/app/learn/topics/[slug]/page.tsx one topic
```

```
┌────┬──────────────┬──────────────────────────┬───────────┐
│ ▣  │ LANGUAGES  ▾ │                          │ what we   │
│ ▣  │  # c         │   Operating Systems      │ have      │
│ ▣  │  # java      │                          │           │
│ ▣  │ SYSTEMS    ▾ │   scrolls independently  │ notebook  │
│ ▣  │  # os     •  │                          │ roadmap   │
│    │ scrolls      │                          │ book hour │
└────┴──────────────┴──────────────────────────┴───────────┘
 72px     248px              fluid                 264px
```

The right rail is the part that earns its width. On Discord it lists people. Here
it answers the only question a reader actually has on landing: is there anything
here for me, and what do I do if there is not.

### Palette

Matte black, scoped to `.topics-shell` with the same token-override technique
`.learn-canvas` already uses in `src/app/globals.css`.

| Token  | Value                    | Note                                          |
| ------ | ------------------------ | --------------------------------------------- |
| ground | `#0c0c0d`                | matte, not `#000`; pure black crushes on OLED |
| raised | `#151517`                | rails and cards                               |
| ink    | `#ededed`                | body                                          |
| dim    | `#8e8e94`                | channel names at rest                         |
| line   | `rgba(255,255,255,0.09)` | hairlines                                     |

White is the only other colour. No accent hue.

**The black stops at `/topics`.** The mentorship page, roadmaps and the notebook
reader stay on the white canvas. This is a deliberate split rather than an
inconsistency: the pitch is a page and the tree is an app, and long-form reading
belongs on white. Anyone extending the black past this boundary should have a
reason.

Type is JetBrains Mono throughout the shell, which is already `--font-mono`.
Channels render as `# operating-systems`, categories as tracked uppercase.

### Motion

Two effects, both gated behind `prefers-reduced-motion`:

1. A per-character decode on the topic title as it enters. Chrome only.
2. A staggered entrance on the sidebar tree, using the existing `Reveal`
   (`src/components/reveal.tsx`).

**Body prose is never animated.** It hurts readability and it hurts LCP. With
reduced motion the title is present immediately, not faded in slowly.

### Mobile

Both rails collapse behind a button into a drawer. Designed up front, not
retrofitted: most of the audience is on a phone at eleven at night.

Collapse state persists per viewer in `localStorage`, wrapped in try/catch, since
a private window or blocked site data throws on access rather than returning
null.

## Adding a topic

1. Add it to the right group in `src/lib/learn/topics.ts`, with a `soon` state
   and a canonical `reference`.
2. Add the row to the taxonomy table in this document.
3. If we have written something, set `notebook` or `roadmap` instead and point at
   it. Do not claim coverage we do not have.
4. For prose, add `src/content/topics/<slug>.mdx` with `rev: 1` in frontmatter.
5. Bump `rev` on any later meaningful edit, so returning readers see the dot.
6. Never change an existing slug without a redirect.

## Phases

| Phase | What                                                                       |
| ----- | -------------------------------------------------------------------------- |
| 1     | The tree, the shell, honest empty states, unread state, the API. No prose. |
| 2     | Topic prose, written a group at a time.                                    |
| 3     | Discussion per topic, if it earns its place.                               |

Phase 1 ships with 64 topics and 10 of them backed by a notebook. That ratio is
the point of the state field: the tree is honest about it on every row.
