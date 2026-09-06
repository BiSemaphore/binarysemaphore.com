# Topics (learn.binarysemaphore.com/topics)

The computer science topic tree: 93 channels across 23 subjects, browsed in a shell
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

## The shape

**Subjects on the rail, angles in the sidebar.**

The first version had subject-areas on the rail (Languages, DSA, Maths) with
subjects as leaves, so `java` was one page and the sidebar showed all twelve
areas at once. That is a library catalogue, not a place to look something up.

You pick the subject you are working in. Its channels are _ways in_:

```
▣ Java
   # memory-and-gc
   # concurrency-traps
   # collections-in-anger
   # equals-and-hashcode
   # interview-questions
   # viva-defence
```

23 subjects, 93 channels. `src/lib/learn/topics.ts` is canonical; this document
describes the rules, not the contents, because a table of 93 rows goes stale the
first time anyone edits one.

Three rules hold it together.

**Channel names are situations, not syllabus entries.** `what-breaks-in-
production`, never `1-introduction`. If a name could head a textbook chapter it
is the wrong name. This is enforced, not merely advised: the test suite fails on
a channel slug that is numbered or that contains `intro`, `basics`,
`fundamentals` or `getting-started`. It caught `observability-basics` on the
first run.

**Nobody arrives needing chapter one.** The audience already works with this
stuff, or is about to be examined on it. A channel is written for someone with
a heap dump open on the other monitor, not for someone starting a course.

**Slugs are permanent, and a channel's URL is `/topics/<subject>/<channel>`.**
A channel slug only has to be unique inside its subject, which is why
`interview-questions` can exist under Java, Python and Databases without
collision. Moving a channel between subjects breaks a link and needs a redirect.

## Channel states

Every topic declares what actually exists behind it. This is the most important
rule in the system, because 52 of the 64 topics have nothing of ours behind them yet and a
navigation tree that implies otherwise is a lie the reader discovers on click.

| State      | Means                              | UI                               |
| ---------- | ---------------------------------- | -------------------------------- |
| `notebook` | One of the ten notebooks covers it | Links to the notebook            |
| `roadmap`  | A roadmap passes through it        | Links to the roadmap stop        |
| `soon`     | Nothing of ours yet                | Canonical reference plus an hour |

A `soon` channel is not an empty page. It gives the canonical reference where
one genuinely exists and the offer of a session where it does not, which is the
honest answer to "we have not written this yet". An empty room is worse than a
locked door.

## Where content lives

In MDX, in git, behind an interface.

```
src/content/topics/<subject>/<channel>.mdx   prose, compiled at build
src/lib/learn/topics.ts              the tree: groups, topics, states
src/lib/learn/topic-source.ts        getTopic() / listTopics(), the seam
src/app/api/topics/route.ts          GET the tree as JSON
src/app/api/topics/[slug]/route.ts   GET one topic as JSON
```

Pages call `topic-source.ts` and server-render. The API serves the same data for
any client-side or third-party consumer, but it is **not in the page's critical
path**. This matters: a student stuck at midnight finds us through search, and a
tree fetched after hydration is invisible to a crawler.

Prose loads through `getBody()` in `topic-source.ts`, using the pattern already
proven in the notebook reader (`src/app/learn/notebooks/[slug]/read/page.tsx`).
Existence is checked on disk first rather than by catching a failed import: a
throwing import is indistinguishable from a genuine MDX compile error, and
swallowing that would hide a broken page instead of surfacing it.

```ts
const { default: Body } = await import(
  `@/content/topics/${subject}/${channel}.mdx`
);
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

**Not built yet.** Planned as the second thing needing a backend, after note
requests. Recorded here so the design is settled before it is written.

The one part of browsing that genuinely needs per-user state.

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

## Note requests

52 topics have nothing of ours behind them. Rather than guessing which to write
next, every topic page asks, and `public.note_requests` (migration `0010`) is
the answer.

`<RequestNote subject title />` in `src/components/learn/request-note.tsx` is
deliberately generic: it takes a subject slug and a display name and nothing
else, so the same component works on a topic page, a roadmap stop, or anywhere
else we have not written something yet. It is a server component, so the
signed-in and already-asked states resolve before render with no flicker.

**Signing in is required, and that is the point rather than friction.** An
anonymous vote is noise. A request is only useful if we can tell one person
asking five times from five people asking once, which is exactly what the
primary key `(user_id, topic)` enforces.

**The email is not stored.** `auth.users` already has it, joined server-side
when the queue is read with the service key. A second copy would be a second
thing to keep in step and a second thing to leak.

Unlike `mentorship_requests`, a reader may `select` their own rows. The button
has to be able to say "you asked for this" rather than inviting the same person
to ask again, and their own request is not information worth hiding from them.
The queue is still not enumerable from a browser: the policy restricts a select
to `auth.uid() = user_id`.

There is no update policy. A request is a fact with a timestamp, so amending one
means withdrawing it and asking again.

## Where authorization lives

In Postgres, and only incidentally in the app. Same stance as the notebooks.

`public.topic_visits` (migration `0011`, not yet written) is a straight copy of
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

### The height model

The single thing most likely to be broken by a later change.

Discord never scrolls the page; each pane scrolls itself. That requires a
bounded height at the top (`h-[calc(100dvh-3.5rem)]`, the viewport less the
learn header) and `min-h-0` on every flex child down the chain. A flex item
defaults to `min-height: auto` and refuses to shrink below its content, which
silently defeats `overflow-y` on its descendants.

The first version of the shell got this wrong in exactly that way: the panes
carried `overflow-y-auto` but had grown to 2564px inside a 911px viewport, so
the property did nothing and the whole page scrolled. If the sidebar ever stops
scrolling on its own, this is why.

`100dvh` rather than `100vh`, so collapsing mobile browser chrome does not leave
a dead strip beneath the sidebar.

The marketing footer is hidden on `/topics` for the same reason: an app shell
sized to the viewport with a footer underneath scrolls the page no matter how
well the panes behave.

The rail and sidebar are a single instance moved off-canvas by transform below
`md`, never a second copy. A duplicate would repeat every `id="group-*"` and
break the rail's own anchor links.

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

**The theme toggle is hidden on `/topics`.** The shell pins its own tokens, so
the toggle would flip `.dark` on `<html>` and change nothing visible. A control
that moves and does nothing is worse than no control. It is one CSS rule
(`.theme-slot`), so if `/topics` ever gains a light variant, delete the rule and
the toggle works again.

**The black stops at `/topics`.** The mentorship page, roadmaps and the notebook
reader stay on the white canvas. This is a deliberate split rather than an
inconsistency: the pitch is a page and the tree is an app, and long-form reading
belongs on white. Anyone extending the black past this boundary should have a
reason.

Type is JetBrains Mono throughout the shell, which is already `--font-mono`.
Channels render as `# operating-systems`, categories as tracked uppercase.

### Measured against Discord, not approximated

Structure taken from the published spec rather than from memory, because the
first attempt was close enough to read as wrong:

| Element       | Value                                             |
| ------------- | ------------------------------------------------- |
| rail width    | 72px                                              |
| group icon    | 48px, radius 16px at rest, 50% on hover or active |
| active pill   | 4px wide, 40px tall; 20px on hover                |
| sidebar width | 240px                                             |
| channel row   | 32px tall, 4px radius, 8px side margin            |
| row hover     | `rgba(78, 80, 88, 0.3)`                           |
| row active    | `rgba(78, 80, 88, 0.6)`                           |

Two of these were wrong before and are worth recording so they are not
reintroduced. **The radius animation ran backwards**: circle relaxing into a
square, where Discord goes rounded-square into circle. That is the most
recognisable motion in the whole chrome and inverting it is exactly why it
looked off. And row states were **solid** fills rather than translucent
overlays, which stops one set of values working across three different greys.

Discord's own hover blurple is deliberately not used. This surface is matte
black and white.

### Icons

The twelve group icons come from **lucide-react**, the one dependency this
feature adds.

They were hand-rolled first, to match the 22 icons already in
`src/components/icons.tsx` and to avoid a dependency for twelve glyphs. That was
wrong twice over: drawing twelve _category_ marks that stay legible at 22px is a
different job from drawing a mail glyph, and the results were the weakest part
of the shell. Lucide is properly drawn, consistent at this size, and
tree-shakeable, so the cost is twelve icons rather than a whole set.

`icons.tsx` keeps the brand and utility marks. `group-icons.tsx` is only the
rail, and the mapping lives there with a `Blocks` fallback so a group added
without an entry still renders something clickable.

### Typography

The chrome is JetBrains Mono, already `--font-mono`. The reading pane is
**Ubuntu Mono**, exposed as `--font-reading` and the `font-reading` utility.

A monospace is not a drop-in for a proportional face. Every glyph is the same
width, so the same point size reads larger and the same measure holds fewer
words. `.topic-prose` drops the size slightly, opens the leading to 1.85 and
pulls the tracking in; without those three it reads like a terminal dump. Inline
code gets a tint rather than a family change, since a family change is invisible
inside a mono body.

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

## Adding a channel

1. Add it to the right subject in `src/lib/learn/topics.ts`, with a `soon` state
   and a canonical `reference` only if one genuinely exists.
2. Name it after a situation. The test suite rejects numbered names and the
   words intro, basics, fundamentals and getting-started.
3. If we have written something, set `notebook` or `roadmap` and point at it. Do
   not claim coverage we do not have.
4. For prose, add `src/content/topics/<subject>/<channel>.mdx`. No frontmatter:
   nothing reads it yet.
5. The page picks it up automatically. `hasBody()` checks disk, so there is no
   registry to update.
6. A subject redirects to its first channel, so put the most useful one first.
7. Never change an existing slug without a redirect.

## Phases

| Phase | What                                                                       |
| ----- | -------------------------------------------------------------------------- |
| 1     | The tree, the shell, honest empty states, unread state, the API. No prose. |
| 2     | Topic prose, written a group at a time.                                    |
| 3     | Discussion per topic, if it earns its place.                               |

Phase 1 ships with 64 topics and 10 of them backed by a notebook. That ratio is
the point of the state field: the tree is honest about it on every row.
