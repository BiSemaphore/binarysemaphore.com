:::title Sketch the tables you would create for a project management app. Five tables is enough. Keep it and compare at the end.
Study Notebook / 04
Postgres
Schema, queries and indexes for people who have to keep the thing running
Senior backend and full-stack interview preparation. Read with a pen.
:::

## How to use this book

This book follows one lecture, *Mastering Databases with Postgres*
(`youtube.com/watch?v=oKr4TCgvfaQ`, 2h45 of the *Backend from First Principles*
playlist), and then keeps going where it stops.

The lecture is deliberately not a SQL course. It skips `SELECT`, `GROUP BY` and
`ORDER BY` on the grounds that a hundred free courses already teach them, and
spends its time on the decisions a backend engineer actually makes: which type,
which constraint, which relationship, which index. That is the right scope, and
this book keeps it.

Parts I to VI are the lecture, expanded. ==Parts VII and VIII are not in the
lecture at all==, and they are where interviews go once schema design is agreed:
transactions and isolation, the N+1 problem, connection pooling, `EXPLAIN`,
vacuum. A schema you can draw is table stakes. Knowing what happens when two
requests hit the same row at the same time is the difference.

#### The five block types

| Block | What it means |
|---|---|
| Interviewer asks | A real follow-up you should expect. Answer it out loud before reading on. |
| Senior signal | The specific sentence that separates a senior answer from a mid-level one. |
| Trap | A common answer that sounds right and is wrong. |
| Do this | The concrete practice, with the parameter or command. |
| Key idea | The one thing to carry out of that section. |

#### The four highlighters

| Mark | Means |
|---|---|
| ==peach== | The sentence to carry away |
| !!rose!! | The wrong answer, the thing that bites |
| ++mint++ | The correct practice |
| %%pink%% | A definition, at the point it is first defined |

#### One running example

Everything is built on the same five-table schema, a project management
platform, because a schema you keep returning to teaches more than twelve
disconnected examples. By Part V you will be writing the queries that back real
endpoints against it, and by Part VI indexing those exact queries.

:::key
The database is the one component you cannot roll back cheaply. Code deploys
twice a day; ==a bad column type outlives the team that chose it==. That is why
this topic rewards being deliberate in a way most of backend engineering does
not.
:::

:::toc
:::

## The schema on one page

```text
  ┌──────────────────────┐
  │ USERS                │
  │ id            uuid PK│◀────────────┐
  │ email         text U │             │
  │ full_name     text   │             │
  │ password_hash text   │             │
  │ created_at    tstz   │             │
  └──────────┬───────────┘             │
             │ 1                       │
             │                         │ owner_id
             │ 1                       │ assigned_to
  ┌──────────▼───────────┐             │
  │ USER_PROFILES        │             │
  │ user_id  uuid PK, FK │             │
  │ avatar_url    text   │             │
  │ bio           text   │             │
  └──────────────────────┘             │
                                       │
  ┌──────────────────────┐             │
  │ PROJECTS             │─────────────┤
  │ id            uuid PK│◀──────┐     │
  │ name          text   │       │     │
  │ status  project_stat │       │     │
  │ owner_id      uuid FK│───────┼─────┘
  └──────────┬───────────┘       │
             │ 1                 │ project_id
             │                   │
             │ many              │
  ┌──────────▼───────────┐   ┌───┴──────────────────┐
  │ TASKS                │   │ PROJECT_MEMBERS      │
  │ id            uuid PK│   │ project_id  uuid FK ┐│
  │ project_id    uuid FK│   │ user_id     uuid FK ┘│  composite PK
  │ title         text   │   │ role      member_role│
  │ priority   int 1..5  │   └──────────────────────┘
  │ status  task_status  │      the linking table:
  │ assigned_to   uuid FK│      users ←many-to-many→ projects
  └──────────────────────┘
```

Three relationships, and they are the whole of relational modelling:

- ==one to one== `users` to `user_profiles`, implemented by making the foreign
  key the primary key
- ==one to many== `projects` to `tasks`, implemented by a plain foreign key on
  the many side
- ==many to many== `users` to `projects`, implemented by a linking table with a
  composite primary key

:::redraw The five tables, their keys, and the three relationship types. | Mark which column is both a primary and a foreign key, and which two columns form a composite key.
:::

:::part I | Why a database at all

The question is not "SQL or NoSQL". It is what a database management system
does that a file does not, because every one of those things is a problem you
would otherwise have to solve yourself, badly.
:::

## 1. Persistence, and where data lives

%%Persistence%% means data survives the process that created it. Close the app,
reopen it a week later on a different machine, and the state is what you left.

That single requirement forces a choice about ==where the bytes sit==.

```text
  ┌─────────┐
  │   CPU   │
  └────┬────┘
       │
       ├──▶ RAM, primary memory
       │       nanoseconds        8 to 128 GB       expensive per GB
       │       volatile: gone when the process dies
       │
       └──▶ DISK, secondary memory (SSD, NVMe)
               microseconds       512 GB to many TB  cheap per GB
               durable: survives the process, the reboot, the power cut
```

Two orders of magnitude of latency, two orders of magnitude of capacity, in
opposite directions. That trade decides which tool goes where:

| | Lives in RAM | Lives on disk |
|---|---|---|
| What | Redis, Memcached, in-process caches | Postgres, MySQL, Mongo |
| Optimised for | ==Speed==, at a capacity limit | ==Capacity and durability==, at a latency cost |
| Losing it means | A slow request | An incident |

:::key
A database trades latency for capacity and durability, and a cache trades
capacity and durability for latency. ==They are the same trade, run in opposite
directions==, which is why they sit next to each other in almost every backend.
:::

:::ask If disk is the bottleneck, why is Postgres fast?
Because it does not read from disk most of the time. Postgres keeps hot pages in
its shared buffer cache in RAM, and the operating system caches underneath that,
so a well-indexed query against a working set that fits in memory rarely touches
a platter. "Disk based" describes where the ==durable copy== lives, not where
every read is served from. That distinction is worth making out loud, because it
is the same reason adding a cache in front of a well-tuned Postgres sometimes
buys nothing.
:::

## 2. What a text file cannot do

Store your records in a text file and parse them in application code. It works,
right up until it does not, in three specific ways.

#### Parsing

Every lookup becomes: open the file, read every line, split every line, compare
every field. That is ==O(n) in application code== for a question the database
answers in O(log n), and it is error-prone in the way string handling is always
error-prone.

#### No structure

A text file will accept anything. There is no way to say "this field is a
number", so nothing stops `amount = "banana"` from being written, and every
reader must defend against every previous writer's mistakes.

#### No concurrency control

This is the one that actually matters, and it is worth walking through slowly
because ==the same bug reappears in section 40 with a real database==.

```text
  amount = 40

  request A                          request B
  ─────────────────────────          ─────────────────────────
  read amount        ──▶ 40
                                     read amount        ──▶ 40
  compute 40 + 20    ──▶ 60
                                     compute 40 - 20    ──▶ 20
  write 60
                                     write 20

  final value: 20.   A's write is gone, silently.
  had the order flipped: 60, and B's write is gone, silently.
```

That is the %%lost update%%. Nothing errored. Both requests succeeded. The
result depends on scheduling, which means it is not reproducible and will be
reported as "the numbers are sometimes wrong".

:::key
A file gives you storage. A database gives you storage ==plus a concurrency
model==, and the concurrency model is the expensive part to build and the part
you will get wrong.
:::

## 3. What a DBMS promises

Four responsibilities, and it is worth being able to name them:

| Promise | Means |
|---|---|
| Organisation | Data laid out so reads and writes stay fast as it grows |
| Access | A query language, so you say ==what== you want, not how to find it |
| ==Integrity== | The data is valid and stays valid, enforced by the engine |
| Security | Users, roles, and grants, so not everyone can read everything |

Integrity is the one to dwell on, because it is the one people give away.

```text
  price column, declared numeric(10,2)

  INSERT … VALUES ('banana')
       ──▶  ERROR: invalid input syntax for type numeric

  the check happened in the engine, once,
  and it holds for EVERY writer: your API, a migration,
  a background job, a colleague on psql at 2am.
```

:::signal
"I push constraints down into the schema wherever I can, because ==application
code is one writer among several== and it is the one that changes every day. A
`CHECK` constraint is enforced against the intern's backfill script too."
:::

## 4. Relational or not

| | Relational | Document |
|---|---|---|
| Unit | Table, row, column | Collection, document |
| Schema | ==Declared up front==, enforced by the engine | Per document, enforced by you |
| Relationships | Foreign keys, joins | Embedding, or application-side joins |
| Integrity | The engine's job | ==Your code's job== |
| Good at | Data with shape and relationships | Data whose shape you do not know yet |
| Examples | Postgres, MySQL, SQL Server | MongoDB, DynamoDB |

The lecture's two examples are well chosen:

- A **CRM** holds customers, contacts, opportunities, and the relationships
  between them are the product. Accuracy matters. Relational.
- A **CMS** holds articles whose bodies contain images, code blocks, embeds, in
  combinations nobody enumerated in advance. Flexible. Document-shaped.

:::trap "Document databases are schemaless, so there is less work"
There is the same amount of schema. The only question is ==where it is
enforced==. In a document store it moves into application code, which changes
daily, is written by several people, and cannot retroactively fix documents
written by last year's version of itself. You did not remove the schema; you
made it implicit and unenforced.
:::

## 5. Why Postgres

Five reasons, and the last one is the one that ends the argument:

1. **Open source and free.** No licence, and you can self-host it anywhere.
2. **Sticks to the SQL standard**, so what you learn transfers and a migration
   to another engine is mostly mechanical.
3. **Extensible.** PostGIS, pg_trgm, pgvector, and a documented extension API.
4. **Reliable and it scales** far past where most products ever get.
5. ==**JSONB.**== A first-class binary JSON type with real indexing.

That last point removes the usual reason to reach for a document store:

```text
  "we need flexible schema for this one column"
        │
        ├── the old answer:  add MongoDB.
        │                    now you run two databases, two backup
        │                    strategies, two failure modes, and you
        │                    have no transactions across them.
        │
        └── the Postgres answer:  make it a jsonb column.
                                  index it with GIN. query into it.
                                  keep one database.
```

:::signal
"I would start with Postgres for essentially any product, and I would need a
specific, measured reason to add a second database. ==One database you
understand deeply beats two you understand partly==, and jsonb removes the most
common reason to reach for the second one."
:::

:::ask When would you genuinely not choose Postgres?
When the access pattern is the product and it is not relational: a
single-digit-millisecond key-value lookup at enormous scale (DynamoDB,
Cassandra), a time-series firehose (Timescale, ClickHouse), a full-text search
product where relevance tuning is the feature (Elasticsearch, and see Notebook
16), or a graph traversal that is the core query (Neo4j). Note that the first
three of those are often ==added alongside== Postgres rather than instead of it.
:::

:::recall Name the three things a text file cannot do, and the one that causes silent data loss. | 5
:::

:::part II | Types are the first constraint

Choosing a column type is the earliest and cheapest place to make a rule true
forever, and the most expensive place to be wrong, because changing it later is
a migration against live data.
:::

## 6. Numbers, and the money rule

```text
  smallint    2 bytes    ±32,767
  integer     4 bytes    ±2.1 billion          the default choice
  bigint      8 bytes    ±9.2 quintillion      ids, counters, bytes

  numeric(10,2)   exact, arbitrary precision, slower
                  └─ 10 total digits, 2 after the point: 12345678.90

  real / double precision   binary floating point, fast, INEXACT
```

The rule you must be able to state without hesitating:

:::do Money is `numeric`. Never a float.
`0.1 + 0.2` is not `0.3` in binary floating point, and a cent lost per thousand
transactions is an audit finding, not a rounding curiosity. Use `numeric(12,2)`
for currency, or store integer minor units (`price_cents bigint`) if you want
exact arithmetic and speed. ==Use floats only where small representational error
is genuinely irrelevant==: a measured area, a sensor reading, a score.
:::

:::trap "Use `integer` for the id, we will never have 2 billion rows"
The ceiling is not rows, it is ==values consumed==, and a sequence is consumed by
failed inserts and rolled-back transactions too. Tables have hit the integer
ceiling with a few hundred million live rows. `bigint` costs four extra bytes.
The migration to widen a primary key on a live table costs a weekend.
:::

## 7. Text, and why the answer is `text`

Three types, and only one of them is the answer.

| Type | Behaviour |
|---|---|
| `char(n)` | ==Blank-pads to n.== Storing `'AB'` in `char(10)` stores eight spaces too |
| `varchar(n)` | Up to n characters, errors past it. No padding |
| `text` | Any length. No declared limit |

In Postgres, ==all three perform identically==. There is no speed advantage to
declaring a limit, and `text` indexes exactly as well as `varchar`. The
documentation itself recommends `text`.

```text
  varchar(255)
        │
        └── comes from MySQL, where 255 was the largest length storable
            with a ONE-byte length prefix. It was a real optimisation.

            In Postgres it means NOTHING. It is a number people copy
            because they have always seen it, and the next engineer
            reads it as a considered decision and tries to work out why.
```

There is also a practical cost. Widening `varchar(255)` to `varchar(500)` is a
migration on a live table. `text` never needs that migration, and the actual
limit, which is a product rule and not a storage rule, belongs in application
validation where changing it is a code review rather than a schema change.

:::do Use `text`, and enforce length in validation
Reach for `varchar(n)` only when the length is a genuine external constraint (an
ISO country code, a fixed-format reference). Reach for `char(n)` essentially
never. And if a limit really must hold at the database level, express it as a
`CHECK (length(col) <= 500)`, which says what it means and can be changed
without rewriting the column.
:::

## 8. Time, and the one that bites

```text
  date          2026-08-29                     no time, no zone
  time          14:30:00                       rarely what you want alone
  timestamp     2026-08-29 14:30:00            ✗ NO TIME ZONE
  timestamptz   2026-08-29 14:30:00+05:30      ✓ the one you want
  interval      '7 days', '2 hours 30 minutes'
```

`timestamp` without a time zone does not mean UTC. It means ==no zone at all==:
the value is stored exactly as written and interpreted by whoever reads it. Two
servers in different regions will disagree about what the same row means, and
nothing will error.

`timestamptz` converts to UTC on write and back to the session's zone on read.
The wall-clock string differs per viewer; the instant is unambiguous.

:::do `timestamptz` for anything that is an instant
Created, updated, published, expires, occurred. Use plain `date` for a genuine
calendar day with no instant attached (a birthday, an invoice date, a due date),
and plain `timestamp` almost never.
:::

:::ask Why not store epoch integers and avoid the whole question?
You lose everything the type gives you: `now() - created_at`, `date_trunc`,
range queries reading naturally, interval arithmetic, index-friendly comparisons
against a literal, and any human being reading the row in psql understanding it.
The integer is not more portable, it is just less legible. Store `timestamptz`
and let the API layer serialise to whatever the client wants.
:::

## 9. Identity: serial, identity, uuid

```text
  id serial PRIMARY KEY          -- legacy. an integer + a sequence + a default
  id bigserial PRIMARY KEY       -- same, 8 bytes

  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY    -- ✓ SQL standard

  id uuid PRIMARY KEY DEFAULT gen_random_uuid()         -- ✓ distributed
```

The lecture uses `serial`, which is what most existing code uses. Worth knowing
the correction: ==`serial` is not a type==, it is a macro that creates an integer
column, a sequence and a default, and it leaves the sequence's ownership and
permissions in a state that surprises people. Since Postgres 10 the standard
`GENERATED ALWAYS AS IDENTITY` does the same job properly, and it is what new
schemas should use.

#### Sequential integer, or UUID

| | `bigint identity` | `uuid` |
|---|---|---|
| Size | 8 bytes | 16 bytes |
| Generated by | ==The database==, on insert | Anyone, anywhere, before insert |
| Index locality | Excellent, appends to the right of the B-tree | ==Poor for v4==, writes scatter across the index |
| Leaks information | ==Yes.== `/users/1042` tells a competitor your user count | No |
| Merging data sets | Collides | Never collides |

The scatter problem is real but often overstated, and it has a fix: UUIDv7 is
time-ordered, so it keeps index locality while staying globally unique. If your
Postgres has `uuidv7()` or you can generate v7 in the application, that is the
best of both.

:::signal
"I default to UUID for anything a client sees, because ==an id in a URL is public
information== and a sequential one leaks volume and enables enumeration. I use
bigint identity for internal, high-volume tables where the id never leaves the
system. If UUID, then v7 rather than v4, so I keep index locality."
:::

## 10. JSON and JSONB

Two types, and one is essentially always right.

| | `json` | `jsonb` |
|---|---|---|
| Stored as | ==Exact text==, reparsed on every read | Decomposed binary |
| Preserves key order and whitespace | Yes | No |
| Duplicate keys | Kept | ==Last one wins== |
| Reads | Slower, parses each time | Fast |
| Indexable | No | ==Yes, GIN== |

```sql
-- a settings column that has no fixed shape
ALTER TABLE users ADD COLUMN preferences jsonb NOT NULL DEFAULT '{}';

-- query into it
SELECT * FROM users WHERE preferences->>'theme' = 'dark';
SELECT * FROM users WHERE preferences @> '{"beta": true}';

-- and index it, which is the part that makes this viable
CREATE INDEX users_prefs_gin ON users USING gin (preferences);
```

:::do Use `jsonb`, and use it for the parts that are genuinely shapeless
The right pattern is ==relational columns for what you query, filter, join and
constrain; jsonb for the long tail==. A CMS article gets `id`, `title`, `slug`,
`author_id`, `published_at` as real columns with real constraints, and `body` as
jsonb. Putting `email` inside a jsonb blob because it was easier means giving up
the unique constraint, the foreign key and the type check.
:::

:::trap "jsonb means I do not need migrations"
You still have a schema, it is just unenforced and undocumented (section 4). You
also lose `NOT NULL`, `UNIQUE`, `CHECK` and foreign keys on anything inside the
blob, and every reader has to defend against every shape any past version of the
code ever wrote. Use it for the long tail, not the spine.
:::

## 11. Enums, and the argument that actually wins

```sql
CREATE TYPE project_status AS ENUM ('active', 'completed', 'archived');
CREATE TYPE task_status    AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE member_role    AS ENUM ('owner', 'admin', 'member');
```

Two reasons are usually given. The second is the stronger one, and most people
lead with the weaker.

**Integrity.** Writing `'activ'` fails at the database rather than sitting in the
table until a report looks wrong. Real, but you were probably validating in the
application anyway.

**Documentation.** This is the argument. A new engineer reading a migration in
six months sees:

```text
  status text NOT NULL
        └── could be anything. to find out what it actually holds,
            grep the entire application for every writer.

  status project_status NOT NULL DEFAULT 'active'
        └── the schema tells you. one line. no archaeology.
```

:::signal
"The strongest argument for an enum is not validation, it is that ==the schema
becomes the documentation==. Someone onboarding reads the migration and knows the
full state space of that column without reading a line of application code."
:::

:::ask What is the downside of a Postgres enum?
Changing it. `ALTER TYPE ... ADD VALUE` works and is cheap, but ==removing or
renaming a value is genuinely awkward== and historically could not run inside a
transaction block. So enums suit closed sets that change rarely: status,
role, currency. For a set that grows with the product (categories, tags, plan
names) prefer a ==lookup table with a foreign key==: you get the same integrity,
the same documentation, plus the ability to add rows without a migration and to
attach a label and sort order.
:::

:::recall For each of price, email, avatar_url, created_at, status, id: name the type and one word on why. | 7
:::

:::part III | Migrations

The database is the one thing you cannot redeploy. Every change to it has to be
a file, in version control, applied in order, by a tool.
:::

## 12. Why you never touch the database by hand

Open a GUI, run `ALTER TABLE`, done. It works, and it is how schemas rot.

```text
  BY HAND                              MIGRATIONS

  what changed?      nobody knows      db/migrations/
  when?              nobody knows        20260814093000_create_users.sql
  who?               nobody knows        20260819141200_add_projects.sql
  is staging the     find out the        20260829102200_add_indexes.sql
  same as prod?      hard way
  can we roll back?  no                 in git, reviewed, ordered, replayable
```

A migration is an ordinary SQL file in an ordered folder, applied by a tool
(`dbmate`, `golang-migrate`, `Flyway`, `Alembic`, or whatever your framework
ships). The tool keeps a `schema_migrations` table in the database recording
which versions have run, so applying twice is a no-op and a fresh database can
be built from empty by replaying the folder.

```bash
dbmate new create_users_table     # writes a timestamped file
dbmate up                         # applies everything not yet applied
dbmate down                       # reverts the most recent
```

:::key
==A migration folder is the schema's git history.== A production database with no
migration history is a database nobody can safely change, because nobody can
reproduce it.
:::

## 13. Up, down, and the version table

```sql
-- migrate:up
CREATE TYPE project_status AS ENUM ('active', 'completed', 'archived');

CREATE TABLE projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  status      project_status NOT NULL DEFAULT 'active',
  owner_id    uuid NOT NULL REFERENCES users ON DELETE RESTRICT,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- migrate:down
DROP TABLE projects;
DROP TYPE project_status;
```

Note the down section reverses the up section ==in the opposite order==: the
table depends on the type, so the table goes first. Getting that backwards is
the most common reason a rollback fails at exactly the moment you need it.

:::do Write the down migration, and test it once
Some teams have moved to forward-only migrations, and that is a defensible
position at scale, because a down migration that drops a column destroys data
that the rollback cannot restore. But "we do not write them" and "we decided not
to" are different. If you write them, ==run `up` then `down` then `up` locally
before you commit==, or you have written a rollback that has never executed.
:::

## 14. Migrations that do not lock the table

Not in the lecture, and the thing that actually causes incidents. Most `ALTER
TABLE` variants take an `ACCESS EXCLUSIVE` lock, which blocks ==every read and
write== on that table for the duration.

| Operation | Cost on a large table |
|---|---|
| `ADD COLUMN` nullable, no default | Instant. Metadata only |
| `ADD COLUMN ... DEFAULT` (PG 11+) | Instant. Older versions rewrote the table |
| `ADD COLUMN NOT NULL` without default | ==Rewrites the table== |
| `ALTER COLUMN TYPE` | ==Rewrites the table== |
| `CREATE INDEX` | ==Blocks writes== for the whole build |
| `CREATE INDEX CONCURRENTLY` | Does not block. Slower, cannot be in a transaction |
| `ADD FOREIGN KEY` | Blocks while it validates every existing row |

:::do The safe patterns
- ++`CREATE INDEX CONCURRENTLY`++ on any table with real traffic. It cannot run
  inside a transaction, so most tools need an explicit flag for that migration.
- Adding a `NOT NULL` column: ++add it nullable, backfill in batches, then add
  the constraint++ as `NOT VALID` and `VALIDATE CONSTRAINT` separately, which
  takes a weaker lock.
- Renaming a column: ++never rename in place++ while old code is running. Add
  the new column, write to both, backfill, switch reads, drop the old one. Four
  deploys, zero downtime.
- Always set a ++`lock_timeout`++ on migrations. A migration that waits behind a
  long-running query holds a lock queue that stalls every subsequent query on
  that table, which turns a slow migration into an outage.
:::

:::trap "The migration ran fine in staging"
Staging has a thousand rows and no traffic. The operations above are all
instant on a thousand rows and all catastrophic on fifty million with
concurrent writers. ==The only staging signal that transfers is whether the SQL
is valid==, not whether it is safe.
:::

:::part IV | Designing the schema

Five tables, three kinds of relationship, and a set of constraints that make
whole categories of bug impossible rather than merely unlikely.
:::

## 15. The columns every table has

```sql
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  full_name     text NOT NULL,
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
```

Three of those columns appear in every table, and they are worth having as a
reflex:

- `id`, the primary key, generated by the database so no writer has to remember.
- `created_at`, defaulted, because ==every list endpoint eventually needs a
  stable sort order== and "when was this made" is asked constantly in support.
- `updated_at`, maintained by a trigger (section 42), not by hoping every writer
  remembers.

Note `password_hash`, not `password`. The column name is a piece of
documentation that stops someone storing the wrong thing in it.

## 16. `NOT NULL` is the default you want

Every column in Postgres is nullable unless you say otherwise. That default is
backwards for application schemas.

```text
  nullable column           every reader must handle NULL, forever
                            every join must consider it
                            NULL = NULL is not true, it is NULL
                            COUNT(col) silently skips them
                            a bug in one script poisons the column permanently
```

Null is not "empty". It is "unknown", and it propagates: `NULL + 1` is `NULL`,
`WHERE status <> 'active'` does ==not== return rows where status is null, and
`UNIQUE` permits many nulls.

:::do Make the column `NOT NULL` unless nullability is a real domain fact
The lecture's rule of thumb is that most of your columns should be `NOT NULL`,
and that matches practice. Nullable is correct for genuinely optional facts:
`bio`, `avatar_url`, `phone`, `assigned_to`, `completed_at`. It is wrong as a
default just because you had not decided yet.
:::

:::ask Empty string or NULL for an optional text field?
Pick one and enforce it, because ==the failure is having both==: half the rows
with `''` and half with `NULL`, and every query needing
`WHERE bio IS NOT NULL AND bio <> ''`. My preference is `NULL` for absent, since
it is what indexes, aggregates and `COALESCE` are designed for, plus a
`CHECK (bio <> '')` to stop the empty string ever appearing.
:::

## 17. Keys: primary, foreign, composite

```text
  PRIMARY KEY   implies  NOT NULL  +  UNIQUE  +  an index, created for you
                one per table, identifies exactly one row

  FOREIGN KEY   the value must exist as a key in the referenced table
                enforced on INSERT, UPDATE, and on DELETE of the parent
                NOT indexed automatically. see section 33

  COMPOSITE PK  PRIMARY KEY (project_id, user_id)
                the pair is unique and neither may be null
```

The foreign key does real work:

```sql
INSERT INTO tasks (project_id, title)
VALUES ('9f3a1c8e-...-a-uuid-that-does-not-exist', 'Fix login');
-- ERROR: insert or update on table "tasks" violates foreign key constraint
```

Without it, that row is an orphan: valid-looking, joined to nothing, invisible
in every report, and discovered a year later.

:::signal
"A foreign key is not paperwork, it is ==the only thing that makes a join
meaningful==. Teams that drop foreign keys for write performance usually
discover that they have traded a microsecond per insert for a permanent class of
data-integrity bug that no code review catches."
:::

## 18. One to one, and when to split a table

`users` and `user_profiles` hold facts about the same person. Why two tables?

```sql
CREATE TABLE user_profiles (
  user_id    uuid PRIMARY KEY REFERENCES users ON DELETE CASCADE,
  avatar_url text,
  bio        text,
  phone      text
);
```

The implementation trick is the whole pattern: ==the foreign key is also the
primary key==. That single declaration gives you the one-to-one guarantee for
free, because the primary key is unique, so a user cannot have two profiles.

The reason to split is ==different rates of change and different growth==:

```text
  users            small, stable, read on every authenticated request
                   email, hash, name. changes almost never.

  user_profiles    grows with the product. today bio and phone,
                   next quarter social links, timezone, pronouns,
                   notification preferences, theme.
                   changes constantly.
```

Keeping them together means the hot, security-critical table takes a migration
every time somebody adds a profile field, and every row read for authentication
drags along bytes nobody asked for.

:::ask Is this not premature optimisation?
It is a modelling decision rather than an optimisation, and it is cheap now and
expensive later, which is the correct time to make it. That said, do not split
reflexively. ==Split when the two groups of columns have genuinely different
lifetimes==, different access frequency, or different sensitivity. Two tables
that are always read together, always written together and never grow should be
one table.
:::

## 19. One to many

```sql
CREATE TABLE tasks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects ON DELETE CASCADE,
  title      text NOT NULL,
  ...
);
```

The foreign key lives on the ==many== side. One project, many tasks.

```text
  projects                 tasks
  ┌────────────┐           ┌──────────────────────────┐
  │ id = p1    │◀──────────│ id = t1   project_id = p1│
  └────────────┘◀──────────│ id = t2   project_id = p1│
                 ◀─────────│ id = t3   project_id = p1│
                           └──────────────────────────┘
```

`NOT NULL` on `project_id` is a modelling statement: ==a task cannot exist
without a project==. If orphan tasks are legal in your domain, leave it
nullable, but decide deliberately rather than by omission.

## 20. Many to many, and the linking table

A user belongs to many projects; a project has many users. Neither side can hold
the key, so the relationship gets its own table.

```sql
CREATE TABLE project_members (
  project_id uuid NOT NULL REFERENCES projects ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users    ON DELETE CASCADE,
  role       member_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);
```

Two things make this correct rather than merely functional:

**The composite primary key.** `(project_id, user_id)` being the key says "this
user is in this project" is a fact that can be true at most once. No surrogate
`id`, no `UNIQUE` constraint bolted on afterwards, and no duplicate membership
rows to deduplicate in application code.

**The relationship carries data.** `role` belongs on the link, not on the user
and not on the project, because ==being an admin is a property of the pairing==.
The same person can own one project and be a plain member of another.

```text
  users        project_members              projects
  ┌──────┐     ┌──────────────────────┐     ┌──────┐
  │ u1   │◀────│ (p2, u1)  role=owner │────▶│ p1   │
  │ u2   │◀────│ (p1, u2)  role=admin │────▶│ p2   │
  │ u3   │◀────│ (p2, u2)  role=member│────▶│ p3   │
  └──────┘     └──────────────────────┘     └──────┘
                 the pair is the key
```

:::trap "Add an `id` to the linking table, every table needs one"
It buys nothing here and costs you the guarantee. With a surrogate key, nothing
stops the same `(project_id, user_id)` pair being inserted twice, and now you
have two rows saying the same thing with different roles. ==Add a surrogate key
to a linking table only when something else has to reference the link itself==,
for example an invitation record pointing at a membership.
:::

## 21. Referential integrity on delete

When the parent row goes, what happens to the children? Four answers, and
choosing is a product decision.

| Clause | Behaviour | Use for |
|---|---|---|
| `ON DELETE RESTRICT` | ==Refuses the delete== while children exist | Parents whose loss would be catastrophic |
| `ON DELETE CASCADE` | Deletes the children too | Children that are meaningless alone |
| `ON DELETE SET NULL` | Nulls the child's FK | Optional links: an unassigned task |
| `ON DELETE SET DEFAULT` | Sets it to the column default | Rare. Needs a sensible default row |

Applied to the running schema, every choice says something:

```text
  projects.owner_id   → users     ON DELETE RESTRICT
        "you cannot delete a user who still owns projects.
         somebody has to reassign them first."

  tasks.project_id    → projects  ON DELETE CASCADE
        "a task without its project is meaningless. take it with."

  tasks.assigned_to   → users     ON DELETE SET NULL
        "the task survives. it just becomes unassigned."

  project_members     → both      ON DELETE CASCADE
        "the membership is only a link. it dies with either end."
```

:::signal
"`CASCADE` and `SET NULL` are conveniences with teeth. ==A cascade can delete far
more than the person clicking expected==, and it does so with no confirmation
step. On anything a human can trigger I prefer `RESTRICT` plus an explicit
application flow that says what will be removed, and I reserve `CASCADE` for
rows that are genuinely part of their parent."
:::

## 22. `CHECK`, `UNIQUE`, and pushing rules down

```sql
priority  int NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
email     text NOT NULL UNIQUE,
CONSTRAINT valid_dates CHECK (due_date IS NULL OR due_date >= created_at::date)
```

Every rule you can express here is a rule that ==holds against every writer for
the life of the table==, including the migration you run at 2am and the script a
colleague writes next year.

| Constraint | Stops |
|---|---|
| `NOT NULL` | Unknown where a value is required |
| `UNIQUE` | Two accounts with one email |
| `CHECK` | Values in range, and cross-column rules |
| `FOREIGN KEY` | Pointers to nothing |
| `EXCLUDE` | Overlaps. Two bookings on one room at one time |

:::do Prefer a partial unique index for conditional uniqueness
"Email must be unique among users who are not soft-deleted" is not expressible
as a plain `UNIQUE`. It is expressible exactly as:

```sql
CREATE UNIQUE INDEX users_email_active
  ON users (email) WHERE deleted_at IS NULL;
```
:::

## 23. Naming: plural, lower, snake

```text
  ✓ users, user_profiles, project_members       plural tables
  ✓ created_at, password_hash, owner_id         snake_case columns
  ✗ User, userProfiles, createdAt               fights the engine
```

Plural versus singular is a convention with no technical winner, so follow the
one the codebase already uses; plural is the more common industry default.

Case is ==not== a convention. Postgres folds unquoted identifiers to lower case,
so `createdAt` is stored as `createdat`, and the only way to get the mixed-case
name back is to quote it forever:

```sql
SELECT "createdAt" FROM "userProfiles";   -- every query. every time. forever.
```

:::key
Postgres lower-cases unquoted identifiers, so ==camelCase either silently becomes
lowercase or forces double quotes into every query you will ever write==. Use
snake_case and let the ORM or the serialisation layer present camelCase to the
client, which is where that convention belongs.
:::

:::recall Write the DDL for a linking table between `users` and `projects`, with the right key and the right delete behaviour. | 7
:::

:::part V | Querying for an API

Not SQL exercises. The five queries behind a real CRUD resource, with the
security and correctness decisions that each one forces.
:::

## 24. Write `FROM` before `SELECT`

SQL is written `SELECT ... FROM ...` and should be ==thought== in the other
order. Decide where the rows come from, then decide which columns you want.

```sql
-- 1. where are the rows coming from, and how do they connect?
FROM users u
LEFT JOIN user_profiles up ON up.user_id = u.id

-- 2. which of them?
WHERE u.deleted_at IS NULL

-- 3. only now, what do I want back?
SELECT u.id, u.email, to_jsonb(up.*) AS profile
```

This is also the order the planner works in, and thinking that way makes the
next four sections obvious: filters and joins are what you index, and the
select list is mostly free.

Aliases (`u`, `up`) are not stylistic. Once two tables in a query both have an
`id` and a `created_at`, unqualified column names are ambiguous, and the error
appears only when the second table is added.

## 25. `JOIN`, and why `LEFT` is usually right

```text
  INNER JOIN     rows that match on BOTH sides
  LEFT JOIN      every row from the left, matched or not (NULLs on the right)
```

The distinction is a correctness bug waiting to happen:

```text
  users                user_profiles
  ┌────────────┐       ┌──────────────────┐
  │ u1 Alice   │◀──────│ user_id = u1     │
  │ u2 Bob     │       └──────────────────┘
  │ u3 Carol   │        Bob and Carol never
  └────────────┘        edited their profile

  INNER JOIN  ──▶  1 row.   ✗ Bob and Carol vanish from /users
  LEFT  JOIN  ──▶  3 rows.  ✓ profile is NULL for two of them
```

An `INNER JOIN` here silently deletes users from your API response. Nobody gets
an error; the list is just short, and the bug is reported months later as "some
users do not appear".

:::do Ask "is the right side optional?" before every join
If the related row may legitimately not exist, ==`LEFT JOIN`==. If its absence
means the left row should not be returned at all, `INNER JOIN`, and say so in a
comment because the next reader will wonder. The default in application queries
is `LEFT`, because most relationships in a product are optional.
:::

## 26. Nested JSON in one round trip

The endpoint wants a user with their profile embedded. Two round trips is the
naive answer; one is available.

```sql
SELECT u.*,
       to_jsonb(up.*) AS profile
FROM users u
LEFT JOIN user_profiles up ON up.user_id = u.id
ORDER BY u.created_at DESC;
```

`to_jsonb(up.*)` turns the joined row into a JSON object, so the driver hands
your code a nested structure directly. For a one-to-many, aggregate instead:

```sql
SELECT p.*,
       COALESCE(
         jsonb_agg(to_jsonb(t.*) ORDER BY t.created_at DESC)
           FILTER (WHERE t.id IS NOT NULL),
         '[]'
       ) AS tasks
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id
GROUP BY p.id;
```

The `FILTER` and `COALESCE` matter: without them a project with no tasks returns
`[null]` instead of `[]`, which every client then has to defend against.

:::trap "Always build the JSON in the database, it is faster"
It often is, and it has a real cost: the query becomes harder to read, harder to
paginate (aggregation and `LIMIT` interact badly), and it moves presentation
logic into SQL. ==Use it where it removes a round trip in a hot path==, keep it
out of queries that already have complex filtering, and never let it become the
only place your response shape is defined.
:::

#### One more thing about `ORDER BY`

```text
  SQL guarantees NO row order without ORDER BY.
  not insertion order. not primary key order.

  it will look stable in development, then reorder in production
  after a VACUUM, a plan change, or a parallel scan.
```

Every list endpoint needs an explicit `ORDER BY`, and it must be
==deterministic==: order by `created_at DESC, id DESC`, not `created_at DESC`
alone, or rows sharing a timestamp can swap between pages.

## 27. Parameterised queries, and SQL injection

```text
  ✗ CONCATENATION
    query = "SELECT * FROM users WHERE id = '" + userId + "'"

    userId = "' OR '1'='1"
        ──▶ SELECT * FROM users WHERE id = '' OR '1'='1'
            every user in the table, returned to the caller

    userId = "'; DROP TABLE users; --"
        ──▶ exactly what it looks like


  ✓ PARAMETERS
    query = "SELECT * FROM users WHERE id = $1"
    execute(query, [userId])
```

The mechanism is worth stating precisely, because "it escapes the string" is
only half true. The query text and the data ==travel separately==. The planner
parses the statement with a placeholder, so by the time your value arrives the
shape of the query is already fixed. There is no parse step left for the value
to influence, whatever it contains.

:::do What parameters cannot do
Parameters bind ==values==, not identifiers. You cannot parameterise a table
name, a column name, or a sort direction:

```text
  ✗ ORDER BY $1              -- silently sorts by a constant, not a column
  ✓ ORDER BY  <whitelisted>  -- see section 28
```
That gap is exactly where injection reappears in "dynamic" query builders.
:::

## 28. Dynamic filters and sorts, without opening a hole

A list endpoint takes `?letter=j&sort_by=email&sort_order=asc&page=2&limit=20`.
Filters are values, so they parameterise. ==Sort columns are identifiers, so they
do not.==

```js
const SORTABLE = { created_at: "u.created_at",
                   email:      "u.email",
                   full_name:  "u.full_name" };          // ← the whitelist

const column = SORTABLE[q.sort_by] ?? "u.created_at";     // never the raw input
const dir    = q.sort_order === "asc" ? "ASC" : "DESC";   // never the raw input

const where = [];
const args  = [];
if (q.letter) { args.push(q.letter + "%"); where.push(`u.full_name ILIKE $${args.length}`); }

const sql = `
  SELECT u.*, to_jsonb(up.*) AS profile
  FROM users u
  LEFT JOIN user_profiles up ON up.user_id = u.id
  ${where.length ? "WHERE " + where.join(" AND ") : ""}
  ORDER BY ${column} ${dir}, u.id DESC
  LIMIT $${args.length + 1} OFFSET $${args.length + 2}`;
```

Three rules, and they are the whole of it:

- ++Values go in parameters.++ Always, with no exceptions.
- ++Identifiers come from a map you wrote.++ Not from the request, not
  sanitised from the request. A lookup in a whitelist, with a default.
- ++Only add a clause when the parameter is present.++ Do not emit
  `WHERE full_name ILIKE '%'` for every request; it prevents index use and
  makes every query plan the same bad plan.

## 29. Pagination: `OFFSET`, and why it dies

```sql
... ORDER BY created_at DESC LIMIT 20 OFFSET 40;      -- page 3
```

Two problems the lecture does not reach, and both are asked about.

**It gets slower the deeper you go.** `OFFSET 100000` does not skip to row
100,000. The database ==produces the first 100,000 rows and throws them away==,
every time. Page 1 is instant, page 5,000 times out.

**It drops and duplicates rows.** If a row is inserted while a user pages, every
subsequent page shifts by one, so an item they have already seen appears again
and an unseen item is skipped entirely.

```text
  KEYSET (cursor) pagination

  page 1:  ORDER BY created_at DESC, id DESC LIMIT 20
           ──▶ remember the last row's (created_at, id)

  page 2:  WHERE (created_at, id) < ($1, $2)
           ORDER BY created_at DESC, id DESC LIMIT 20

  constant time at any depth, uses the index directly,
  and stable under concurrent inserts.
```

:::do Offset for pages you can count, keyset for feeds
`OFFSET` is fine for an admin table with numbered pages over a few thousand
rows, where "jump to page 7" is a real requirement. ==Use keyset for infinite
scroll, feeds, exports and any table that will grow without bound==, where
nobody ever asks for page 4,000 but a crawler will happily request it.
:::

## 30. Insert and update

```sql
INSERT INTO users (email, full_name, password_hash)
VALUES ($1, $2, $3)
RETURNING *;
```

`RETURNING` is the detail worth keeping: the row comes back, with its
database-generated `id` and `created_at`, ==in the same round trip==. Without it
you insert and then select, which is two trips and a race.

Updates are conditional, because a `PATCH` sends only the fields the user
changed:

```js
const sets = [], args = [];
for (const [col, val] of Object.entries(patch)) {
  if (!ALLOWED.has(col)) continue;              // ← whitelist again
  args.push(val);
  sets.push(`${col} = $${args.length}`);
}
if (!sets.length) return current;               // nothing to do, do not UPDATE
args.push(userId);

await db.query(
  `UPDATE user_profiles SET ${sets.join(", ")}
   WHERE user_id = $${args.length} RETURNING *`, args);
```

:::trap "Update every column with whatever the client sent"
That is how a `PATCH` that omits a field nulls it, and how a client that sends
`{"role": "admin"}` to a profile endpoint promotes itself. ==Build the `SET`
list from a whitelist of columns the caller is allowed to change==, never from
the keys of the request body.
:::

:::ask Where should `updated_at` be set?
Not in application code, because then every writer has to remember and one of
them will not. Set it with a ==trigger== (section 42) so it is maintained by the
database for every writer including manual fixes and backfills. The lecture
builds exactly this, and it is one of the few places a trigger clearly earns its
keep.
:::

## 31. The N+1 problem

Not in the lecture, and the single most common database performance bug in
application code.

```text
  GET /projects  with each project's task count

  ✗ N+1
    SELECT * FROM projects;                       ← 1 query, 50 rows
    for each project:
        SELECT count(*) FROM tasks WHERE …        ← 50 more queries
                                                  ── 51 round trips

  ✓ ONE QUERY
    SELECT p.*, count(t.id) AS task_count
    FROM projects p
    LEFT JOIN tasks t ON t.project_id = p.id
    GROUP BY p.id;                                ── 1 round trip
```

Each individual query is fast, which is what makes this hard to spot: nothing
appears in a slow query log. What you see is an endpoint that takes 400ms for no
apparent reason, and gets slower as the list grows, because the cost is ==50
network round trips==, not 50 slow queries.

ORMs cause this by default, since lazy-loading a relation inside a loop looks
exactly like ordinary code.

:::do Three fixes, in order of preference
- ++One query with a join and an aggregate++, as above.
- ++Eager loading++: `include` in Prisma, `joinedload` in SQLAlchemy,
  `Preload` in GORM, `includes` in ActiveRecord.
- ++One extra query, not N++: fetch the parents, collect the ids, then
  `WHERE project_id = ANY($1)` and stitch in application code. Two queries
  regardless of list size, and often the most readable option.
:::

:::signal
"I watch the ==query count per request==, not just query latency. N+1 never shows
up in a slow query log, because every individual query is fast. It shows up as
an endpoint whose latency scales with the size of the list it returns."
:::

:::recall Write the get-all-users query: join, embed the profile, filter by first letter, sort safely, paginate. | 8
:::

:::part VI | Making it fast

An index is the difference between a query that scales and one that works
until it does not. The hard part is not creating them; it is knowing which ones
to create, and what each one costs you on every write.
:::

## 32. What an index actually is

The lecture's analogy is the right one. A book's index maps "chapter 4" to
"page 54", so you jump instead of scanning.

```text
  WITHOUT AN INDEX: sequential scan

    SELECT * FROM tasks WHERE id = 't7'

    row 1 ─ no    row 2 ─ no    row 3 ─ no  …  row 4,000,000 ─ yes
    every row read from disk and compared. O(n).


  WITH AN INDEX: index scan

    a B-tree, sorted by the indexed value

              ┌──────────┐
              │  t4      │
         ┌────┴───┐  ┌───┴────┐
         │ t2     │  │ t7 ──▶ heap location (page 91, offset 3)
      ┌──┴─┐   ┌──┴─┐└────────┘
      │ t1 │   │ t3 │
      └────┘   └────┘

    three comparisons, then one read. O(log n).
```

One refinement on the lecture's description: it is not a flat lookup table but a
==B-tree==, which is why it stays fast as it grows and why it can also answer
range queries (`created_at > $1`), prefix matches, and sorts, not just equality.

That last property is the one people miss:

```text
  a B-tree is SORTED, so an index can also satisfy:

    ORDER BY created_at DESC LIMIT 20     ← read 20 entries off one end
    WHERE created_at BETWEEN $1 AND $2    ← walk a contiguous range
    WHERE email LIKE 'jo%'                ← a prefix is a range
```

:::ask Do you need a `DESC` index to sort descending?
No, and this is worth correcting. Postgres can walk a B-tree ==backwards==, so a
plain ascending index serves `ORDER BY created_at DESC` perfectly well. Explicit
direction only matters for ==multi-column indexes with mixed directions==, for
example `ORDER BY status ASC, created_at DESC`, where the index must be declared
`(status, created_at DESC)` to be usable for that sort in one pass.
:::

## 33. What to index, and what Postgres already did

The rule of thumb is: index what appears in a `WHERE`, a `JOIN`, or an
`ORDER BY`, weighted by how often the query runs.

Applied to the running schema:

```sql
CREATE INDEX users_created_at   ON users     (created_at DESC);  -- list sort
CREATE INDEX tasks_project_id   ON tasks     (project_id);       -- FK, joins
CREATE INDEX tasks_assigned_to  ON tasks     (assigned_to);      -- FK, joins
CREATE INDEX tasks_status       ON tasks     (status);           -- filter
CREATE INDEX members_user_id    ON project_members (user_id);    -- reverse lookup
```

Two things Postgres does and does not do for you, and the gap between them is a
common production bug:

```text
  PRIMARY KEY         ✓ indexed automatically
  UNIQUE constraint   ✓ indexed automatically (that is how it is enforced)

  FOREIGN KEY         ✗ NOT indexed. Postgres indexes the parent's key,
                        because it is a primary key, and does nothing
                        for the child's column.
```

So every `JOIN tasks ON tasks.project_id = projects.id` scans `tasks` unless you
index `project_id` yourself. It is also why deleting a parent row can be
mysteriously slow: the cascade or restrict check has to find referencing rows,
and with no index that is a full scan of the child table per deleted row.

#### Composite indexes, and the order of columns

```text
  CREATE INDEX tasks_project_status ON tasks (project_id, status);

  serves:   WHERE project_id = $1
            WHERE project_id = $1 AND status = $2
  does NOT serve:  WHERE status = $2          ← leading column missing

  leftmost prefix rule: an index on (a, b, c) serves
  queries on (a), (a, b), (a, b, c). Never on (b) alone.
```

:::do Put the equality column first
In a composite index, order by: equality filters first, then the range or sort
column. For `WHERE project_id = $1 ORDER BY created_at DESC`, the index is
`(project_id, created_at DESC)`, which satisfies both the filter and the sort
in one walk with no sort step at all.
:::

## 34. What an index costs

Indexes are not free, and the cost is paid on ==every write==.

```text
  INSERT INTO tasks (…)
        │
        ├──▶ write the row to the heap
        ├──▶ update tasks_project_id
        ├──▶ update tasks_assigned_to
        ├──▶ update tasks_status
        └──▶ update tasks_created_at
             four extra writes per insert, plus disk space,
             plus more to keep in memory, plus more for vacuum
```

| Cost | Detail |
|---|---|
| Write amplification | Every insert, update and delete maintains every index |
| Disk and memory | An index on a large table can rival the table's own size |
| Planning | More indexes means more plans to consider |
| Maintenance | More for `VACUUM` to clean, more bloat to watch |

:::do Index deliberately, then verify
- Start from the ==query==, not the column. "This endpoint is called constantly
  and filters on these two columns" is a reason; "this looks like a column
  people search" is not.
- Add the index, then confirm with `EXPLAIN` that the planner ==actually uses
  it== (section 35). An unused index is pure cost.
- Find dead weight with `pg_stat_user_indexes`: an index with `idx_scan = 0`
  after a representative period is being paid for and never used.
- Drop them `CONCURRENTLY`, like you created them.
:::

:::trap "More indexes make the database faster"
They make ==reads that use them== faster and ==every write== slower, and a write-
heavy table with a dozen indexes can be slower overall than one with three. The
question is never "is this index useful" but "is it useful often enough to pay
for on every insert".
:::

## 35. Reading `EXPLAIN ANALYZE`

Not in the lecture, and the tool that turns indexing from guesswork into
measurement.

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM tasks WHERE project_id = '...' ORDER BY created_at DESC LIMIT 20;
```

```text
  Limit  (cost=0.43..8.71 rows=20 width=182)
         (actual time=0.031..0.094 rows=20 loops=1)
    ->  Index Scan Backward using tasks_project_created on tasks
          Index Cond: (project_id = '...'::uuid)
          (actual time=0.028..0.081 rows=20 loops=1)
  Planning Time: 0.212 ms
  Execution Time: 0.140 ms
```

Read it bottom-up and inside-out. What to look for, in order:

| Sign | Means |
|---|---|
| `Seq Scan` on a large table | ==No usable index==, or the planner chose not to |
| `rows=` estimate far from `actual rows` | Stats are stale. `ANALYZE` the table |
| `Nested Loop` with a big inner `loops=` | The join is running N times. Section 31 |
| `Sort` before a `Limit` | An index could have provided the order |
| `Filter:` removing many rows | The index found too much; the condition is not indexed |
| `Heap Fetches` high on an index-only scan | Vacuum is behind |

:::do `EXPLAIN` versus `EXPLAIN ANALYZE`
`EXPLAIN` shows the ==plan== and is free. `EXPLAIN ANALYZE` ==actually runs the
query== and shows real timings, which is what you want, and which is also why
you must never run it casually against an `UPDATE` or `DELETE` in production
without wrapping it in a transaction you roll back.
:::

## 36. Beyond B-tree

The default index type does not cover everything, and one of the gaps sits
directly in the query from section 28.

| Type | For |
|---|---|
| ==B-tree== | The default. Equality, ranges, sorts, prefixes |
| ==GIN== | `jsonb` containment, arrays, full-text search |
| ==GiST== | Geometry, ranges, nearest-neighbour |
| ==BRIN== | Huge tables with naturally ordered data, tiny index |
| ==Hash== | Equality only. Rarely worth it over B-tree |

#### The `ILIKE` gap

```text
  CREATE INDEX users_email ON users (email);          -- B-tree

  WHERE email LIKE  'jo%'    ✓ uses the index (a prefix is a range)
  WHERE email ILIKE 'jo%'    ✗ does NOT. case-insensitive matching
                               is not the collation the index was built in
  WHERE email LIKE '%jo%'    ✗ no leading anchor, no range to walk
```

This matters because the lecture indexes `email` and then filters with `ILIKE`,
and those two do not meet. Three ways to close it:

```sql
-- 1. index the expression you actually query
CREATE INDEX users_email_lower ON users (lower(email));
--    then query:  WHERE lower(email) LIKE 'jo%'

-- 2. or make the column case-insensitive once, and stop thinking about it
CREATE EXTENSION citext;
ALTER TABLE users ALTER COLUMN email TYPE citext;

-- 3. for infix search ('%jo%'), trigrams
CREATE EXTENSION pg_trgm;
CREATE INDEX users_name_trgm ON users USING gin (full_name gin_trgm_ops);
```

:::signal
"Adding an index and adding a query that can use it are two different tasks.
==Any function applied to the column in the `WHERE` clause disables a plain
index==, whether that is `lower()`, a cast, or `ILIKE`. Either index the
expression, or change the column so the query is a plain comparison."
:::

:::recall Which of these are indexed automatically: primary key, unique, foreign key, the column in an ORDER BY? | 5
:::

:::part VII | Correctness under concurrency

None of this is in the lecture, and it is where the interview goes after the
schema is drawn. Section 2 showed the lost update in a text file. Here is what
happens when it is a real database, and what actually stops it.
:::

## 37. Transactions, and what ACID buys

```sql
BEGIN;
  UPDATE accounts SET balance = balance - 100 WHERE id = 'a';
  UPDATE accounts SET balance = balance + 100 WHERE id = 'b';
COMMIT;                      -- both, or neither. never one.
```

| Property | Means | Failure it prevents |
|---|---|---|
| ==Atomicity== | All statements or none | Money debited but never credited |
| ==Consistency== | Constraints hold at commit | A row that violates a `CHECK` |
| ==Isolation== | Concurrent transactions do not corrupt each other | Section 38 |
| ==Durability== | Committed means survives a crash | "It said saved" and it was not |

The practical rule: ==a transaction should wrap one unit of business meaning==,
and it should be as short as possible in wall-clock time, because everything it
touches stays locked until it ends.

:::trap "Wrap the whole request handler in a transaction, to be safe"
Now an HTTP call to a payment provider, a slow template render, or a sleepy
client holds database locks for seconds. Long transactions block other writers,
prevent `VACUUM` from cleaning rows, and turn one slow dependency into a
database-wide stall. ==Open the transaction as late as possible and close it as
early as possible==, and never make a network call inside one.
:::

## 38. Isolation levels

Isolation is a dial, and the anomalies it stops are named things you should be
able to list.

```text
  DIRTY READ        you read a row another transaction has not committed
  NON-REPEATABLE    you read the same row twice and get different values
  PHANTOM READ      you run the same query twice and get different ROWS
  LOST UPDATE       two read-modify-writes, one silently overwrites the other
```

| Level | Dirty | Non-repeatable | Phantom |
|---|---|---|---|
| Read uncommitted | Not possible in PG | Possible | Possible |
| ==Read committed== (PG default) | No | Possible | Possible |
| Repeatable read | No | No | ==No, in PG== |
| Serializable | No | No | No |

Two Postgres-specific facts worth knowing:

- Postgres has ==no dirty reads at any level==. `READ UNCOMMITTED` is accepted
  and behaves as `READ COMMITTED`.
- Postgres's `REPEATABLE READ` is a snapshot, so it also prevents phantoms,
  which is stronger than the SQL standard requires.

:::signal
"The default is `READ COMMITTED`, which means ==each statement sees a fresh
snapshot==. So two statements in the same transaction can see different data,
and that is exactly where read-modify-write bugs live. If a transaction's
correctness depends on the world not changing underneath it, I raise the level
or take an explicit lock rather than hoping."
:::

## 39. Row locks and `SELECT FOR UPDATE`

The concrete tool for read-modify-write:

```sql
BEGIN;
  SELECT balance FROM accounts WHERE id = $1 FOR UPDATE;   -- ← locks the row
  -- any other transaction doing the same now WAITS here
  UPDATE accounts SET balance = $2 WHERE id = $1;
COMMIT;                                                     -- ← lock released
```

| Clause | Behaviour |
|---|---|
| `FOR UPDATE` | Locks the rows. Other writers wait |
| `FOR NO KEY UPDATE` | Weaker; allows concurrent foreign-key references |
| `FOR SHARE` | Others may read, none may write |
| `FOR UPDATE NOWAIT` | Error immediately instead of waiting |
| `FOR UPDATE SKIP LOCKED` | ==Skip locked rows.== The queue-worker pattern |

`SKIP LOCKED` is the one worth remembering, because it turns a table into a work
queue with no extra infrastructure:

```sql
UPDATE jobs SET status = 'running'
WHERE id = (SELECT id FROM jobs WHERE status = 'pending'
            ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED)
RETURNING *;
```

Ten workers running that concurrently each get a different job, with no
coordination service. Notebook 15 covers when this is enough and when you want a
real broker.

#### Deadlock

```text
  txn A: lock row 1 ──▶ wants row 2
  txn B: lock row 2 ──▶ wants row 1
         both wait forever.

  Postgres detects it and kills one with:
      ERROR: deadlock detected

  the fix is ordering: always acquire locks in a consistent order,
  for example sorted by primary key, in every code path.
```

## 40. The lost update, revisited

Section 2's bug, now with a real database, because ==a transaction alone does not
fix it==.

```text
  READ COMMITTED, both in transactions:

  A: BEGIN; SELECT balance → 40
  B: BEGIN; SELECT balance → 40
  A: UPDATE SET balance = 60; COMMIT;
  B: UPDATE SET balance = 20; COMMIT;

  final: 20.  A's update is lost, exactly as with the text file.
  no error. both transactions committed successfully.
```

Four fixes, in ascending order of cost:

```sql
-- 1. don't read-modify-write. let the database do the arithmetic.
UPDATE accounts SET balance = balance + 20 WHERE id = $1;   -- ← atomic. best.

-- 2. pessimistic: lock the row while you think
SELECT balance FROM accounts WHERE id = $1 FOR UPDATE;

-- 3. optimistic: a version column, and fail loudly
UPDATE accounts SET balance = $1, version = version + 1
WHERE id = $2 AND version = $3;      -- 0 rows updated ⇒ someone beat you, retry

-- 4. raise isolation and be ready to retry
BEGIN ISOLATION LEVEL SERIALIZABLE;  -- may abort with a serialization failure
```

:::key
Option 1 is the one to reach for first and the one people skip. ==If the new
value is a function of the old value, express it as one statement== and the
database does the read and the write atomically. Most "we need a lock" problems
are actually "we wrote it as two statements".
:::

:::signal
"Optimistic concurrency is the same pattern as `If-Match` and an ETag on an
object store, or a `version` column in an ORM: ==read a version, write
conditionally on it, and fail loudly if you lost==. Notebook 02 section 22 is the
identical idea at the storage layer."
:::

:::recall Two requests both add 20 to a balance of 40. Give four ways to make the answer 80, cheapest first. | 7
:::

:::part VIII | Living with it in production

Four things that are invisible on a laptop and decide whether the database
survives real traffic.
:::

## 41. Connection pooling

A Postgres connection is a ==process==, not a thread. Each one costs memory
before it does any work, and the server has a hard `max_connections`.

```text
  ✗ WITHOUT POOLING
    3 app instances × 200 request workers = 600 connections attempted
    max_connections = 100
         ──▶ FATAL: sorry, too many clients already
             and the ones that do connect thrash the scheduler

  ✓ WITH POOLING
    each app keeps a small pool and reuses connections
    3 instances × 20 = 60 connections, held open, handed round
```

Two layers, and they solve different problems:

| Layer | Example | Solves |
|---|---|---|
| In-process pool | `pg.Pool`, HikariCP, SQLAlchemy | Connection setup cost, per-instance cap |
| ==External pooler== | PgBouncer, pgcat, RDS Proxy | Total connections across ==all== instances |

An in-process pool cannot help you when the problem is that you have forty
serverless instances, each with its own pool. That is what PgBouncer is for.

:::do Size the pool small, and know the transaction-mode catch
- A common starting point is `((core_count × 2) + effective_spindle_count)` per
  instance, which lands around 10 to 20. ==Bigger pools are usually slower==,
  because past the point where the database can execute in parallel, extra
  connections only add contention.
- PgBouncer in ==transaction mode== hands a different backend connection to each
  transaction, which breaks anything with session state: `SET` outside a
  transaction, `LISTEN/NOTIFY`, session-level advisory locks, and server-side
  prepared statements unless the driver is configured for it.
- Serverless, where instance count is unbounded, essentially requires an
  external pooler or a driver built for it.
:::

## 42. Triggers, and when not to

The lecture's use of a trigger is the canonical good one:

```sql
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

This earns its place because the rule is ==mechanical, universal, and must hold
for every writer==, including a manual `UPDATE` in psql and a one-off backfill
script. No application code can guarantee that.

:::trap "Triggers are elegant, put the business logic in them"
Triggers are ==invisible==. They do not appear in the application code, they do
not appear in a stack trace, and a new engineer debugging "why did this column
change" has no thread to pull. They also fire inside the caller's transaction,
so a slow trigger silently slows every write.

Good: `updated_at`, audit rows, denormalised counters that must never drift.
Bad: sending email, calling an API, anything with a branch a product manager
might want changed, anything you would want to unit test.
:::

## 43. Vacuum, bloat and wraparound

Postgres never updates a row in place. An `UPDATE` writes a ==new version== and
marks the old one dead. That is what gives readers a consistent snapshot without
blocking writers, and it means dead rows accumulate.

```text
  UPDATE users SET bio = 'new' WHERE id = 'u1';

  heap:  [u1 v1 dead] [u1 v2 live]
                ▲
                └── still on disk, still in every index,
                    until VACUUM reclaims it
```

| Symptom | Cause |
|---|---|
| Table much larger than its data | ==Bloat==. Dead tuples not reclaimed |
| Queries slowing with no schema change | Scanning dead rows and bloated indexes |
| Bad plans after a bulk load | Stale statistics. `ANALYZE` not run |
| `Heap Fetches` high on index-only scans | Visibility map behind |

Autovacuum handles this by default. It falls behind under heavy update or delete
load, and ==a long-running transaction blocks it entirely==, because rows visible
to that transaction cannot be reclaimed. This is one more reason section 37's
rule about short transactions is not stylistic.

:::do What to actually watch
Monitor `pg_stat_user_tables.n_dead_tup` against `n_live_tup`, and the age of
your oldest transaction. On a table with a high update rate, tune
`autovacuum_vacuum_scale_factor` down for that table specifically rather than
globally. And know the words ==transaction ID wraparound==: if vacuum falls far
enough behind, Postgres will refuse writes to protect itself, which is a
full outage with a recovery measured in hours.
:::

## 44. Backups, and the difference that matters

| Kind | Tool | Restores to |
|---|---|---|
| Logical dump | `pg_dump`, `pg_dumpall` | The moment the dump ran |
| Physical base backup | `pg_basebackup` | The moment the backup ran |
| ==Base backup + WAL archive== | PITR | ==Any point in time== |
| Replica | Streaming replication | Not a backup. See below |

:::trap "We have a replica, so we have a backup"
A replica replays everything, including your mistake, in seconds. `DROP TABLE
users` on the primary is `DROP TABLE users` on the replica. ==A replica is for
availability; a backup is for recovery from your own actions==, which is the
identical distinction Notebook 02 section 19 makes about durability not being
backup.
:::

:::do The only backup rule that matters
++Restore it.++ On a schedule, into a scratch environment, and time it. A backup
you have never restored is a hypothesis, and the number you actually need in an
incident is not "do we have a backup" but "how long until we are back", which
you can only know by having done it.
:::

:::part IX | The interview itself

Schema design is one of the most commonly asked practical exercises, because it
is fast to run and it exposes exactly how much production experience someone
has.
:::

## 45. The delivery script

"Design the schema for a project management app." Seven steps, about fifteen
minutes.

1. **Clarify the entities and the cardinality, out loud.** "Users, projects,
   tasks. A project has one owner and many members, so users to projects is
   many to many. A task belongs to exactly one project and is assigned to at
   most one user." ==State every relationship as one to one, one to many or many
   to many before drawing anything.==
2. **Draw the tables with keys only.** No column types yet. Get the shape
   agreed before spending time on detail.
3. **Fill in types, saying why for the interesting ones.** `numeric` for money,
   `timestamptz` for instants, `text` not `varchar(255)`, enum or lookup table
   for status.
4. **Add the constraints, and name what each one prevents.** `NOT NULL`,
   `UNIQUE` on email, `CHECK` on priority, and the delete behaviour on every
   foreign key. This is the step that separates candidates.
5. **Write one real query.** The list endpoint, with the join, the sort and the
   pagination. It proves the schema actually serves the product.
6. **Index that query, and say what it costs.** Foreign keys are not indexed
   automatically; the sort column needs one; every index is paid for on write.
7. **Volunteer the concurrency question.** "Two people move the same task at
   once" or "two people invite the same member". Show that you know a
   transaction alone does not fix a read-modify-write.

Then name what you left out: partitioning, sharding, read replicas, soft
deletes, audit tables. ==Naming the boundary reads as judgement==, not as a gap.

## 46. Follow-up question bank

| Question | Section |
|---|---|
| Why not store this in a text file, or in Mongo? | 2, 4 |
| `varchar(255)` or `text`, and why? | 7 |
| `timestamp` or `timestamptz`? | 8 |
| UUID or auto-increment for the primary key? | 9 |
| When would you use `jsonb`, and what do you lose? | 10 |
| Enum or lookup table? | 11 |
| How do you add a `NOT NULL` column to a 50 million row table? | 14 |
| What does `PRIMARY KEY` imply that you did not write? | 17 |
| Why is `user_profiles` a separate table? | 18 |
| How do you model many to many, and where does `role` live? | 20 |
| `CASCADE` or `RESTRICT`, and who decides? | 21 |
| `INNER JOIN` and users disappear from the list. Why? | 25 |
| How do you let the client choose the sort column safely? | 27, 28 |
| Why does page 5,000 time out? | 29 |
| The endpoint is slow but every query is fast. What is it? | 31 |
| Which columns does Postgres index for you, and which does it not? | 33 |
| You added an index and the query did not get faster. Why? | 35, 36 |
| Two requests both add 20 to a balance. What happens? | 40 |
| Why is a bigger connection pool often slower? | 41 |
| Where does `updated_at` get set, and why not in code? | 42 |
| The table is 40 GB and holds 4 GB of data. Why? | 43 |
| You have a replica. Do you still need backups? | 44 |

:::part X | Appendices
:::

## Appendix A. Defaults to memorise

| Thing | Value |
|---|---|
| Money | `numeric(12,2)`, never float |
| Text | `text`, never `varchar(255)` |
| Instant | `timestamptz`. Calendar day: `date` |
| Surrogate key | `uuid` (v7 if available), or `bigint GENERATED ALWAYS AS IDENTITY` |
| Flexible column | `jsonb` + GIN, never `json` |
| Nullability | `NOT NULL` unless optional is a real domain fact |
| One to one | FK is also the PK |
| One to many | FK on the many side |
| Many to many | Linking table, composite PK |
| Indexed automatically | PK, `UNIQUE`. ==Not foreign keys== |
| Composite index rule | Leftmost prefix; equality column first |
| Index on a large table | `CREATE INDEX CONCURRENTLY` |
| Default isolation | `READ COMMITTED` (no dirty reads at any level in PG) |
| Read-modify-write fix | One statement: `SET x = x + $1` |
| Queue pattern | `FOR UPDATE SKIP LOCKED` |
| Pool size per instance | ~`(cores × 2) + 1`, roughly 10 to 20 |
| Abort-incomplete lifecycle | Short transactions, or vacuum stalls |
| Pagination | `OFFSET` for numbered pages, keyset for feeds |

## Appendix B. Glossary

| Term | Meaning |
|---|---|
| DBMS | The software: storage, access, integrity, security |
| Persistence | Data outlives the process that wrote it |
| Schema | The declared shape, enforced by the engine |
| Migration | An ordered, version-controlled change to the schema |
| Primary key | Unique, not null, indexed. Identifies one row |
| Foreign key | Value must exist in the referenced table |
| Composite key | Two or more columns forming one key |
| Referential integrity | The FK rules, including on-delete behaviour |
| Constraint | `NOT NULL`, `UNIQUE`, `CHECK`, `FOREIGN KEY`, `EXCLUDE` |
| Linking table | Table implementing a many-to-many relationship |
| Index | Sorted structure mapping a value to row locations |
| B-tree | The default index. Equality, ranges, sorts, prefixes |
| GIN | Index for `jsonb`, arrays, full text, trigrams |
| Leftmost prefix | An index on (a,b,c) serves (a), (a,b), (a,b,c) |
| Sequential scan | Reading every row. Fine on small tables, fatal on large |
| `EXPLAIN ANALYZE` | Runs the query and reports the real plan and timings |
| Parameterised query | Statement and values sent separately. Stops injection |
| N+1 | One query for the list, then one per row |
| Keyset pagination | Paging on the last row's sort key, not an offset |
| Transaction | All statements or none |
| Isolation level | How much concurrent transactions can see of each other |
| Lost update | Two read-modify-writes; one silently overwrites |
| `SKIP LOCKED` | Skip rows another transaction holds. Queue pattern |
| Deadlock | Two transactions each holding what the other wants |
| MVCC | Updates write a new row version; old ones are cleaned later |
| Bloat | Dead tuples not yet reclaimed by vacuum |
| Wraparound | Vacuum falls so far behind that Postgres stops writes |
| PITR | Base backup plus WAL, restoring to any point in time |
| Connection pooler | Reuses connections. PgBouncer, pgcat, RDS Proxy |

## Appendix C. Self-test

Close the book.

:::recall Draw the five tables, all keys, and mark the three relationship types. | 8
:::

:::recall Name six column types and the single rule that decides each one. | 7
:::

:::recall What does `PRIMARY KEY` give you implicitly, and what does a foreign key NOT give you? | 5
:::

:::recall Four on-delete behaviours, and the right one for each FK in this schema. | 6
:::

:::recall Write the list-users query with join, filter, safe sort and pagination. | 8
:::

:::recall Three ways an index you created will not be used. | 6
:::

:::recall Four anomalies isolation levels prevent, and Postgres's default level. | 6
:::

:::recall Four fixes for the lost update, cheapest first. | 6
:::

:::redraw The schema, plus the indexes you would create and the query each one serves. | Then compare with the sketch you made on the title page.
:::
