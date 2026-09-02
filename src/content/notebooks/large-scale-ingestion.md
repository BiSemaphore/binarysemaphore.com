:::title Sketch the whole flow here before you read on. Redo it at the end and compare.
System Design Notebook / 01
Large-Scale Data Ingestion
How to accept, store, process and track multi-gigabyte jobs without losing them
Senior backend and full-stack interview preparation. Read with a pen.
:::

## How to use this book

This is not a reference manual. It is a study notebook built around one interview
question, chosen because that single question forces you through resumable
uploads, object storage, queues, workers, streaming, retries, idempotency,
checkpointing, backpressure and asynchronous job tracking. Learn this one case
deeply and you can answer a large fraction of backend system design questions by
reassembling its parts.

Every page has a dotted rail on the right. Use it. The people who do well in
system design interviews are the ones who can draw the architecture from memory
under pressure, and you only get there by drawing it badly a few times first.

#### The five block types

| Block            | What it means                                                              |
| ---------------- | -------------------------------------------------------------------------- |
| Interviewer asks | A real follow-up you should expect. Answer it out loud before reading on.  |
| Senior signal    | The specific sentence that separates a senior answer from a mid-level one. |
| Trap             | A common answer that sounds right and is wrong.                            |
| Do this          | The concrete practice, with the parameter or command.                      |
| Key idea         | The one thing to carry out of that section.                                |

#### A suggested route

1. Read Part I and draw the flow once, badly, from memory.
2. Read Parts II to V in order. These are the mechanics, and they are where
   follow-up questions live.
3. Skim Parts VI and VII, then come back after you can draw the flow.
4. Drill Part VIII the night before. It is the delivery, not the knowledge.

:::key
Do not memorise a technology list. Memorise a chain of forced moves, where each
constraint eliminates an option and the architecture is what survives.
:::

:::toc
:::

## The whole system on one page

```text
                     ┌───────────────┐
                     │   FRONTEND    │
                     └───────┬───────┘
                             │ 1. POST /jobs        (metadata only)
                             ▼
                     ┌───────────────┐   2. create job row (status=CREATED)
                     │  API SERVICE  │──────────────────────────────┐
                     └───────┬───────┘   3. presigned upload URLs   │
                             │                                      ▼
                             │                              ┌──────────────┐
        4. PUT part 1..N     │                              │   METADATA   │
     (direct, parallel,      │                              │      DB      │
      resumable, retried)    │                              └──────┬───────┘
                             ▼                                     │
                     ┌───────────────┐                             │
                     │ OBJECT STORE  │  5. CompleteMultipartUpload │
                     │     (S3)      │                             │
                     └───────┬───────┘                             │
                             │ 6. notify API / S3 event            │
                             ▼                                     │
                     ┌───────────────┐  7. outbox row + publish    │
                     │  JOB QUEUE    │◀────────────────────────────┘
                     │ SQS / Rabbit  │
                     └───────┬───────┘
                             │ 8. lease a message
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐   ┌──────────┐   ┌──────────┐
        │ WORKER 1 │   │ WORKER 2 │   │ WORKER N │   9. stream, transform,
        └────┬─────┘   └────┬─────┘   └────┬─────┘      checkpoint, batch
             └──────────────┼──────────────┘
                            ▼
              ┌─────────────┴─────────────┐
              ▼                           ▼
        ┌──────────┐                ┌──────────┐
        │ RESULT   │                │ RESULTS  │
        │   DB     │                │  IN S3   │
        └────┬─────┘                └──────────┘
             │ 10. progress + terminal status
             ▼
        ┌──────────┐   11. GET /jobs/:id  (poll)  or  SSE stream
        │ FRONTEND │
        └──────────┘
```

The rest of this book is the justification for every arrow above, and what
happens when each one fails.

:::recall Cover the diagram. List the eleven numbered steps in order. | 8
:::

:::part I | Framing the problem
Before any box is drawn. Most candidates lose this question in the first two
minutes by designing a system nobody asked for.
:::

## 1. The problem, stated properly

A weak framing of this question is:

> How do I process ten gigabytes of data?

That framing produces a bad answer, because it invites you to talk about parsing
speed. The real framing is:

:::key
How do I reliably ingest, store, process, and report on very large datasets in a
distributed system, given that networks fail mid-transfer, workers die
mid-processing, jobs run for hours, and load is bursty?
:::

Write that at the top of your notes in the interview. It reframes the question
from a throughput problem into a ==reliability and state-management problem==,
which is what the interviewer is actually testing.

#### The requirements, restated as constraints

| Requirement                       | The constraint it creates                                     |
| --------------------------------- | ------------------------------------------------------------- |
| Files are gigabytes to terabytes  | Cannot fit in memory, cannot fit in one HTTP request          |
| Processing takes minutes to hours | Cannot happen inside a request/response cycle                 |
| Networks fail mid-upload          | Transfer must be resumable at sub-file granularity            |
| Workers crash mid-job             | Processing must be resumable and repeatable safely            |
| Many users submit at once         | Load must be buffered, not applied directly to workers        |
| Users want progress               | Job state must be externally observable, not in worker memory |

Every architectural decision in this book falls out of the right-hand column.

:::trap Designing for the happy path
The happy path here is trivial: download the file, parse it, write results. If
you spend your time on that, you have answered a junior question. The interview
lives entirely in the failure paths, so get to them fast and deliberately.
:::

## 2. Clarifying questions that buy you the design

Ask these before drawing anything. Each one is not politeness, it changes the
architecture, and saying why makes that visible.

| Question                                                                  | Why it changes the design                                                                    |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| How large, realistically? P50 and P99?                                    | 50 MB means a simple upload. 500 GB forces multipart and split processing.                   |
| Who produces the data: a user's browser, or another service?              | Browser means presigned URLs and CORS. Service-to-service may mean pull, or a shared bucket. |
| What does "processing" do? Row-wise, or does it need global state?        | Row-wise is embarrassingly parallel. Sorting or joining across the whole file is not.        |
| How long may processing take, at the top end?                             | Minutes allows a simple queue. Hours forces lease renewal and checkpointing.                 |
| How many concurrent jobs, and how bursty?                                 | Sets worker count, queue choice and whether you need fairness between tenants.               |
| Is the output a file, rows in a database, or both?                        | Changes the write path and how you make it idempotent.                                       |
| Must results be exact, or is best-effort with an error report acceptable? | Decides whether one bad row fails the job.                                                   |
| Retention: how long do inputs and outputs live?                           | Drives lifecycle policy and cost.                                                            |

:::signal
Ask "row-wise or global?" early. It is the question that decides whether you can
split one file across many workers, and most candidates never ask it. If
processing is row-wise and order-independent, say so out loud, because it unlocks
the fan-out design in section 19.
:::

:::ask Why do you need to know P99 file size, isn't the max enough?
Because the max drives correctness and the P99 drives cost. If P99 is 80 MB and
the max is 2 TB, you build the simple path for the common case and a split path
for the tail, rather than paying multipart overhead on every 2 MB file.
:::

## 3. Back-of-the-envelope, before the boxes

Numbers stop the design from being hand-waving. Do this arithmetic out loud.

#### Transfer time

```text
10 GB over a 100 Mbit/s uplink

  100 Mbit/s = 12.5 MB/s
  10 GB = 10,240 MB
  10,240 / 12.5 = 819 s = ~13.6 minutes   (best case, single stream)
```

Thirteen minutes is far longer than any sane HTTP timeout, and long enough that
a transient network failure is likely rather than exotic. That single number
justifies both the async design and resumability.

#### Processing time

```text
10 GB CSV, ~200 bytes per row  ->  ~53 million rows

  single worker at 20k rows/s   ->  ~44 minutes
  8 workers at 20k rows/s each  ->  ~5.5 minutes
```

#### Load

```text
100 concurrent jobs x 10 GB = 1 TB in flight
  storage: cheap and fine for object storage
  workers: 100 jobs x 44 min = 73 worker-hours of compute
  at 8 workers  -> ~9 hours of backlog
  at 60 workers -> ~1.2 hours
```

:::key
The backlog calculation is the one that matters. It shows the queue is not
decoration, it is the mechanism that lets you absorb a burst you cannot serve
immediately, and it makes worker count a dial rather than a guess.
:::

:::ask Where does the bottleneck actually sit?
Usually the destination database, not the parser. Bulk inserts into an indexed
table are frequently slower than reading and transforming the rows. Say this
early, because it leads naturally to batching, copy-style bulk loading, and
dropping or deferring indexes during load.
:::

## 4. The first principle: separate ingestion from processing

This is the decision the whole design rests on. The naive model is:

```text
        WRONG

  Frontend
     │  POST 10 GB
     ▼
  Backend  ─────────►  parse + transform + write  (20+ minutes)
     │
     ▼
  HTTP 200
```

This fails for at least five independent reasons, and it is worth naming them
all rather than just saying "it does not scale":

1. **The request outlives every timeout.** Load balancers, reverse proxies and
   browsers all cut long-lived requests. AWS ALB defaults to 60 seconds idle.
2. **The bytes flow through your compute.** Bandwidth and memory on the API tier
   are consumed by data movement that adds no value.
3. **A retry restarts everything.** There is no unit of progress smaller than the
   whole job.
4. **Deploys become destructive.** Any rolling restart kills in-flight work.
5. **You cannot scale the two halves separately.** Upload capacity and processing
   capacity have completely different demand curves.

So split it in two, and treat them as separate problems with separate failure
models:

```text
        RIGHT

  ┌──────────── INGESTION ────────────┐   ┌──────── PROCESSING ────────┐
  │                                   │   │                            │
  │  Frontend ──► Object store        │   │  Queue ──► Workers ──► DB  │
  │      (direct, resumable, retried) │   │       (leased, resumable)  │
  │                                   │   │                            │
  └───────────────────┬───────────────┘   └────────────┬───────────────┘
                      │                                │
                      └──────► durable handoff ◄───────┘
                                 (an event)
```

:::signal
Say the phrase "the file at rest in object storage is the handoff point between
two independent failure domains". Once the bytes are durably in S3, an upload
failure and a processing failure are unrelated problems with unrelated
recoveries. That framing is what makes the rest of the design tractable.
:::

:::recall Name the five reasons the synchronous model fails. No peeking. | 6
:::

:::part II | Ingestion, getting the bytes in
Ten gigabytes, an unreliable network, and a backend you do not want in the
middle of it.
:::

## 5. Why object storage, not the database

The instinct to put the file in PostgreSQL should be killed explicitly.

| Concern               | Object store (S3, GCS, Blob)     | Relational database                        |
| --------------------- | -------------------------------- | ------------------------------------------ |
| Cost per GB per month | ~$0.023                          | 10x to 20x more, on provisioned storage    |
| Max object size       | 5 TiB                            | BYTEA and BLOB practical limits far lower  |
| Effect on backups     | None, versioned separately       | Backup and restore time explodes           |
| Streaming reads       | Native, with byte-range requests | Awkward, buffers through the DB connection |
| Direct client upload  | Yes, presigned                   | No, must pass through your servers         |
| Replication cost      | Cheap, built in                  | Every replica carries the blob             |

:::key
The database stores ==metadata and results==. The object store holds ==bytes==.
Mixing them makes your most operationally sensitive component the one carrying
the most dead weight.
:::

#### The layout

```text
s3://acme-ingest/
├── uploads/
│   ├── job-8f21/
│   │   └── input.csv            (raw, immutable, written once)
│   └── job-8f22/
│       └── input.csv
├── processed/
│   ├── job-8f21/
│   │   ├── part-00000.parquet
│   │   └── part-00001.parquet
│   └── job-8f21/errors.csv      (rejected rows, with reasons)
└── tmp/                          (lifecycle: delete after 1 day)
```

Keying everything by `job-id` is deliberate. It makes cleanup, debugging,
per-job access control and lifecycle rules trivial, and it means an operator
with a job ID can find everything about that job in one place.

#### The metadata row

```sql
CREATE TABLE jobs (
  id               UUID PRIMARY KEY,
  tenant_id        UUID NOT NULL,
  status           TEXT NOT NULL,          -- see the state machine, section 21
  input_key        TEXT,                   -- uploads/job-8f21/input.csv
  input_bytes      BIGINT,
  input_checksum   TEXT,
  output_prefix    TEXT,
  upload_id        TEXT,                   -- S3 multipart upload id
  total_chunks     INT,
  processed_chunks INT NOT NULL DEFAULT 0,
  attempt          INT NOT NULL DEFAULT 0,
  error_code       TEXT,
  error_detail     TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  heartbeat_at     TIMESTAMPTZ             -- see section 18
);

CREATE INDEX jobs_tenant_created ON jobs (tenant_id, created_at DESC);
CREATE INDEX jobs_active ON jobs (status) WHERE status IN ('QUEUED','PROCESSING');
```

:::signal
The partial index on active jobs is a small detail that reads as production
experience. The table grows forever, but the set of running jobs stays small,
and every operational query ("what is stuck?") hits only that set.
:::

:::ask Should the file ever go in the database?
Yes, when it is small and transactional integrity with the row matters more than
size: a 40 KB signed PDF that must appear and disappear atomically with its
record is fine in the database. The rule is about size and access pattern, not
dogma.
:::

## 6. Presigned URLs, keeping the bytes out of your backend

Do not proxy the payload.

```text
   PROXIED (bad)                        PRESIGNED (good)

  Frontend                              Frontend
     │ 10 GB                               │ 1. ask for URLs (bytes: ~0)
     ▼                                     ▼
  Backend   ◄── bandwidth, memory,      Backend  (authorises, signs, records)
     │           timeouts, cost            │ 2. returns signed URLs
     │ 10 GB                               ▼
     ▼                                  Frontend
    S3                                     │ 3. 10 GB, direct
                                           ▼
                                          S3
```

The backend keeps the job it is good at, ==authorisation and orchestration==,
and hands the job it is bad at, ==moving bytes==, to infrastructure designed for
it. Your API tier stays small and stateless, and its cost stops scaling with
payload size.

#### What a presigned URL actually is

A URL with a signature computed from your credentials, the HTTP method, the
exact object key, and an expiry. S3 validates the signature itself. No call
reaches your servers. Because the signature covers the key and method, a URL
signed for `PUT uploads/job-8f21/part-3` cannot be used to write anywhere else,
or to read anything.

:::do Constrain the signature, do not just sign

- Short expiry: minutes for a single small `PUT`, up to a few hours for a
  multipart session, never days.
- Bind the key to the job, and derive it server-side. Never accept a
  client-supplied key, or a client can overwrite another tenant's object.
- For browser `POST` policies, set `content-length-range` so a client cannot
  upload a 5 TB file when you authorised 5 GB.
- Require a checksum header (`x-amz-checksum-sha256`) so a corrupted part is
  rejected by S3 rather than discovered by your parser an hour later.
- Set a bucket CORS rule that exposes `ETag`, otherwise the browser cannot read
  the part ETags it needs to complete the upload.
  :::

:::trap "Presigned URLs are insecure because anyone with the link can upload"
Anyone with the link can perform ==exactly the one operation you signed, on the
one key you named, until it expires==. That is a capability, not a hole. The
actual risks are over-broad scope and over-long expiry, both of which are yours
to set.
:::

:::ask The data comes from another backend service, not a browser. Does this change?
The principle holds, the mechanism may simplify. Service to service, you can
grant a scoped IAM role instead of presigning, or have the producer write to a
bucket you read. If the producer is a third party you cannot change, you may
have to pull instead: then your ingestion worker streams from their endpoint
into S3, using ranged requests so it too can resume.
:::

## 7. Multipart and resumable upload

A single 10 GB `PUT` is one failure away from zero progress. Multipart makes the
unit of failure a part, not the file.

```text
  10 GB, 64 MiB parts  ->  160 parts

  part 001  ████ ok
  part 002  ████ ok
  part 003  ████ ok
  part 004  ░░░░ FAILED  (connection reset)
  part 005  ████ ok
  ...
  part 160  ████ ok

  retry only part 004  ->  ok
  CompleteMultipartUpload(uploadId, [{part,etag}, ...])
  S3 assembles the object server-side. No re-upload of the other 159.
```

#### The three calls

```bash
# 1. begin a session; S3 returns an uploadId that identifies it
aws s3api create-multipart-upload --bucket acme-ingest \
    --key uploads/job-8f21/input.csv

# 2. upload parts, in parallel, in any order; each returns an ETag
aws s3api upload-part --bucket acme-ingest --key uploads/job-8f21/input.csv \
    --upload-id "$UPLOAD_ID" --part-number 4 --body part-004.bin

# 3. commit: the object does not exist until this succeeds
aws s3api complete-multipart-upload --bucket acme-ingest \
    --key uploads/job-8f21/input.csv --upload-id "$UPLOAD_ID" \
    --multipart-upload file://parts.json
```

:::key
The upload is ==atomic at the object level==. Until `CompleteMultipartUpload`
returns, no reader can see a partial file. This is what makes "upload finished"
a trustworthy event, and it is why the processing side can treat the object as
immutable.
:::

#### Resumability

Resuming needs only two things: the `uploadId` and the set of parts already
accepted. Both survive a browser refresh if you persist the `uploadId` on the
job row and keep part state client-side, and S3 will tell you the truth on
request:

```bash
aws s3api list-parts --bucket acme-ingest \
    --key uploads/job-8f21/input.csv --upload-id "$UPLOAD_ID"
```

:::do Resume correctly after a client restart
Call `ListParts` and trust S3, not the client's memory. Compare part numbers and
checksums, upload only what is missing, then complete. This also survives the
case where a part succeeded but the response was lost, which is exactly the
ambiguity a naive client resolves by uploading everything again.
:::

:::ask What if the user closes the laptop for two days mid-upload?
The `uploadId` stays valid, S3 has no built-in expiry on it, so the upload can
resume. That is also the problem: the accepted parts are billed as storage
indefinitely. This is section 27's abandoned-upload cost bug, and the fix is a
lifecycle rule.
:::

## 8. Choosing the part size

Interviewers like this because it is where "I have used S3" separates from "I
have read about S3".

#### The hard limits

| Limit                    | Value                            |
| ------------------------ | -------------------------------- |
| Minimum part size        | 5 MiB (the final part is exempt) |
| Maximum part size        | 5 GiB                            |
| Maximum parts per upload | 10,000                           |
| Maximum object size      | 5 TiB                            |
| Maximum single `PUT`     | 5 GiB                            |

#### The consequence

```text
  10,000 parts is the ceiling, so:

  part size    max object      parts for 10 GB    parts for 1 TB
  ─────────    ──────────      ───────────────    ──────────────
   5 MiB        48.8 GiB           2,048          too many, invalid
  16 MiB       156.2 GiB             640          65,536  invalid
  64 MiB       625.0 GiB             160          16,384  invalid
 128 MiB         1.2 TiB              80           8,192  ok
 512 MiB         4.8 TiB              20           2,048  ok
```

:::do Compute the part size, do not hardcode it

```text
part_size = max(8 MiB, ceil(file_size / 9500))
part_size = round_up_to_power_of_two(part_size)
```

Dividing by 9,500 rather than 10,000 leaves headroom for rounding. Small files
get small parts and fast retries, huge files automatically get bigger parts and
stay under the part ceiling.
:::

#### The trade-off in both directions

```text
  smaller parts                          larger parts
  ────────────                           ────────────
  + cheap retry (lose 8 MiB)             + fewer requests, lower request cost
  + finer progress reporting             + less per-part overhead
  - more requests, more request cost     - expensive retry (lose 512 MiB)
  - more round trips, latency-bound      - coarse progress
  - risk of hitting the 10,000 cap       - a slow part stalls the tail
```

:::signal
Tie part size to network quality, not just file size. On a lossy mobile
connection, 8 MiB parts with six-way concurrency finish faster than 128 MiB
parts, because the expected cost of a retry dominates. On a datacentre link the
opposite holds. Saying "the optimum depends on failure rate, not just bandwidth"
is the senior version of this answer.
:::

## 9. When the network fails mid-upload

This is the question your interviewer asked, and the one to answer with a
protocol rather than a promise.

```text
  part 004 fails
        │
        ▼
  is it retryable?
        │
        ├── 5xx, 429, timeout, connection reset  ──►  retry with backoff
        │
        └── 4xx (403 expired signature, 400 bad request)  ──►  do not retry
                    │
                    ▼
              re-sign the part URL from the API, then retry
```

#### Exponential backoff with jitter

```text
  attempt 1  ──►  fail   wait  1s  x random(0.5 .. 1.5)
  attempt 2  ──►  fail   wait  2s  x random(0.5 .. 1.5)
  attempt 3  ──►  fail   wait  4s  x random(0.5 .. 1.5)
  attempt 4  ──►  fail   wait  8s  x random(0.5 .. 1.5)
  attempt 5  ──►  ok
```

:::key
The jitter is not a detail. Without it, every client that failed during the same
network blip retries at the same instant, and you have built a synchronised
thundering herd that recreates the outage you were recovering from.
:::

:::do The client-side upload loop

1. Bound concurrency (4 to 8 parts in flight). Unbounded parallelism starves
   itself and hides failures behind timeouts.
2. Retry per part, not per file. Cap at 5 attempts, then surface the part number.
3. Refresh expired signatures rather than failing the job. A multi-hour upload
   will outlive a 15-minute signature.
4. Checksum each part locally and send the header. Detect corruption at the part
   boundary, not after processing starts.
5. Persist `{uploadId, completedParts}` to `localStorage` so a refresh resumes.
6. On permanent failure, `AbortMultipartUpload` so the parts stop costing money.
   :::

:::ask The connection drops for good and the user never comes back. What happens?
The job sits in `UPLOADING` forever unless you handle it. Two mechanisms: a
lifecycle rule that aborts incomplete multipart uploads after N days, and a
sweeper that moves jobs stuck in `UPLOADING` past a deadline to `UPLOAD_EXPIRED`.
Without the first, you pay storage on parts belonging to an object that will
never exist.
:::

:::trap Retrying a 403
An expired presigned URL returns 403, which looks like a permission error and
gets classified as permanent. Clients that do not special-case it fail
multi-hour uploads at minute sixteen. Re-sign, then retry.
:::

:::recall Draw the failure decision tree for a failed part, from memory. | 7
:::

:::redraw Redraw Part II from memory | Frontend, API, presigned URLs, parts, retries, complete. Then check against section 7.
:::

:::part III | The handoff
The bytes are in S3. Nothing is processing them yet. This gap is where jobs
silently disappear.
:::

## 10. Completing the upload and verifying it

The client says the upload is done. Do not believe it.

```text
  Frontend                   API                        S3
     │                        │                          │
     │ POST /jobs/8f21/complete                          │
     │  { uploadId, parts[] } │                          │
     │───────────────────────►│                          │
     │                        │ CompleteMultipartUpload  │
     │                        │─────────────────────────►│
     │                        │◄──── 200 + ETag ─────────│
     │                        │                          │
     │                        │ HeadObject (size, checksum)
     │                        │─────────────────────────►│
     │                        │◄──── 10,737,418,240 B ───│
     │                        │
     │                        │ verify size + checksum vs the job row
     │                        │ status: UPLOADING -> UPLOADED
     │                        │ write outbox row (same transaction)
     │◄─── 202 Accepted ──────│
```

:::do Verify three things before accepting an upload

1. **It exists.** `HeadObject`, not the client's word.
2. **The size matches** what the client declared when the job was created.
3. **The checksum matches**, if you asked for one. This is your only defence
   against a corrupted file that parses far enough to write garbage.

Then, and only then, transition the job and emit the work.
:::

#### Who calls "complete"?

Two designs, and the choice is worth stating explicitly.

|                                        | Client-driven                                 | S3 event-driven                                |
| -------------------------------------- | --------------------------------------------- | ---------------------------------------------- |
| Trigger                                | Client calls your API after the last part     | S3 emits `ObjectCreated` to SQS or EventBridge |
| If the client dies after the last part | Job stuck in `UPLOADING` until a sweeper runs | Fires anyway, upload is not lost               |
| Ordering guarantee                     | You control it                                | At-least-once, occasionally delayed            |
| Complexity                             | Lower                                         | Needs event plumbing and key parsing           |

:::signal
Use both. The client call gives a fast, responsive path, and the S3 event is the
safety net that catches the case where the client dies between the last part and
your API call. Because the transition is idempotent (`UPLOADING -> UPLOADED`
happens once), running both paths is safe. Naming that as a deliberate
belt-and-braces design reads as production experience, not indecision.
:::

## 11. The dual-write problem and the outbox

Here is a bug most candidates walk straight into.

```text
  BROKEN

  db.update(job, status = UPLOADED)     ✓ committed
  ──────────── process dies here ────────────
  queue.publish({jobId})                ✗ never happened

  Result: a job marked ready that no worker will ever pick up.
  It is invisible, because nothing failed loudly.
```

Reversing the order does not help, it changes which way you break:

```text
  ALSO BROKEN

  queue.publish({jobId})                ✓ published
  ──────────── process dies here ────────────
  db.update(job, status = UPLOADED)     ✗ never happened

  Result: a worker picks up a job whose row still says UPLOADING.
```

You are trying to write atomically to two systems that do not share a
transaction. That is the ==dual-write problem==, and the standard answer is the
==transactional outbox==.

```sql
CREATE TABLE outbox (
  id           BIGSERIAL PRIMARY KEY,
  aggregate_id UUID NOT NULL,
  event_type   TEXT NOT NULL,
  payload      JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);
CREATE INDEX outbox_unpublished ON outbox (id) WHERE published_at IS NULL;
```

```java
// One transaction, one database, therefore actually atomic.
@Transactional
public void markUploaded(UUID jobId) {
    jobs.updateStatus(jobId, Status.UPLOADED);
    outbox.insert(jobId, "job.ready", payloadFor(jobId));
}
```

A separate relay reads unpublished rows, publishes them, and marks them
published. If it dies mid-flight it republishes, which is fine, because the
consumer is idempotent (section 17).

```text
  ┌────────────────── one ACID transaction ──────────────────┐
  │   jobs.status = UPLOADED      outbox: job.ready          │
  └────────────────────────────┬─────────────────────────────┘
                               │
                      relay polls / reads the WAL
                               │
                               ▼
                          message queue        at-least-once
                               │
                               ▼
                            workers            idempotent consumer
```

:::key
Outbox converts an impossible atomic write across two systems into an ordinary
atomic write to one system, plus an at-least-once delivery you were already
required to tolerate.
:::

:::ask Isn't polling the outbox table wasteful?
At low volume, polling every 200 ms is fine and trivially correct. At high
volume, read the write-ahead log instead with change data capture (Debezium on
Postgres logical replication), which removes the polling entirely. Name both and
say which you would start with, and why.
:::

:::trap "Just publish inside the transaction"
Publishing to Kafka inside a database transaction does not make it
transactional. The broker has already accepted the message when the transaction
rolls back. The message is out, the row is not, and the two systems now disagree.
:::

:::part IV | The queue
Why the job goes on a queue, and how to choose the queue without hand-waving.
:::

## 12. Why a queue at all

The queue is not there because distributed systems are supposed to have one. It
does four specific jobs, and you should be able to name them.

| Job                                   | What breaks without it                             |
| ------------------------------------- | -------------------------------------------------- |
| **Decouple** the API from the workers | A worker outage becomes an API outage              |
| **Buffer** bursts (load levelling)    | 500 simultaneous submissions overwhelm the workers |
| **Distribute** work across consumers  | You hand-roll assignment, and get it wrong         |
| **Retry** with visibility             | A crashed worker's job vanishes                    |

The API becomes trivially fast, because it only writes a row and an outbox
entry:

```json
POST /jobs  ->  202 Accepted
{
  "jobId":  "8f21c0de-...",
  "status": "QUEUED",
  "statusUrl": "/jobs/8f21c0de-.../status"
}
```

:::key
Returning a job ID instead of a result is the whole asynchronous pattern in one
line. The HTTP request's job is to ==durably accept responsibility== for the
work, not to do it.
:::

## 13. Kafka or RabbitMQ or SQS

Never say "we could use Kafka or RabbitMQ". Say which, and why, in terms of this
workload.

|                      | SQS                     | RabbitMQ                      | Kafka                      |
| -------------------- | ----------------------- | ----------------------------- | -------------------------- |
| Model                | Managed queue           | Broker with routing           | Distributed log            |
| Unit of work         | Message, deleted on ack | Message, acked                | Offset in a partition      |
| Redelivery           | Visibility timeout      | Ack timeout / nack            | Consumer re-reads offset   |
| Max in-flight time   | 12 hours                | Configurable, heartbeat-based | `max.poll.interval.ms`     |
| Per-message retry    | Native, with DLQ        | Native, with DLX              | Manual, you build it       |
| Replay history       | No                      | No                            | Yes, that is the point     |
| Fan-out to N systems | Needs SNS in front      | Exchange bindings             | Native, independent groups |
| Ordering             | FIFO queues only        | Per-queue                     | Per-partition              |
| Ops burden           | None                    | Moderate                      | High                       |

#### Why the log model is awkward here

Kafka's strength, an ordered immutable log consumed by offset, is a poor fit for
long heterogeneous tasks:

```text
  partition 0:  [job A: 2 min] [job B: 4 HOURS] [job C: 2 min] [job D: 2 min]
                                     ▲
                                     └── C and D wait behind B

  Kafka commits offsets in order within a partition. One slow job at the head
  blocks every job behind it in that partition. A queue with per-message acks
  does not have this problem: A, C and D are delivered to other consumers
  while B is still being worked.
```

:::signal
Head-of-line blocking is the answer that wins this comparison. Long, variable
duration tasks want ==per-message acknowledgement==, not ordered offsets. Say
that sentence and the Kafka-versus-RabbitMQ question is settled on technical
grounds instead of taste.
:::

#### The recommendation

:::do Choose by what the workload actually needs

- **Default: SQS** (or RabbitMQ if you are not on AWS). Per-message ack,
  built-in visibility timeout, native DLQ, no cluster to run. This is a job
  queue, and these are job queue tools.
- **Kafka when** the upload event genuinely needs multiple independent
  consumers (processing, analytics, audit, billing), or you need replay of the
  event history, or Kafka is already the backbone of the company.
- **Both is legitimate**: Kafka as the event bus for `DataUploaded`, with a
  bridge that turns it into work items on a job queue. Say this only if you can
  justify the extra hop.
  :::

```text
  If the event has many audiences:          If it is one unit of work:

     DataUploaded                              job.ready
          │                                        │
       ┌──┴───┬────────┐                           ▼
       ▼      ▼        ▼                       ┌────────┐
   process analytics audit                     │  SQS   │
    (Kafka: everyone reads                     └───┬────┘
     the same log)                       ┌─────────┼─────────┐
                                         ▼         ▼         ▼
                                       w1        w2        w3
```

:::trap "Kafka scales better, so use Kafka"
Kafka scales ==throughput of messages==. Your bottleneck is hours of CPU per
message. Ten thousand messages per second is irrelevant when you process one
message every forty minutes. Choosing the tool by its headline metric rather
than your actual constraint is precisely the mistake being tested.
:::

:::recall Why is Kafka a poor default for long-running jobs? One sentence. | 3
:::

:::part V | Processing
Streaming, checkpointing, idempotency, leases and fan-out. The densest part of
the book, and where senior interviews are won.
:::

## 14. The worker loop

```text
  ┌───────────────────────────────────────────────────────────┐
  │  loop:                                                    │
  │    msg = queue.receive(waitSeconds=20)   long poll        │
  │    if none: continue                                      │
  │                                                           │
  │    job = db.load(msg.jobId)                               │
  │    if job.status is terminal: queue.delete(msg); continue │
  │                                                           │
  │    claim(job)          PROCESSING, attempt += 1           │
  │    start heartbeat     extends the lease, section 18      │
  │                                                           │
  │    try:                                                   │
  │      stream S3 -> parse -> transform -> batch -> write    │
  │      checkpoint after every chunk                         │
  │      finish(job)     COMPLETED                            │
  │      queue.delete(msg)                                    │
  │    except Retryable:                                      │
  │      release(msg)    back to the queue, backoff           │
  │    except Fatal:                                          │
  │      fail(job); queue.delete(msg)                         │
  │    finally:                                               │
  │      stop heartbeat                                       │
  └───────────────────────────────────────────────────────────┘
```

The terminal-status check on the second line is not defensive clutter. Because
delivery is at-least-once, a worker ==will== eventually receive a message for a
job that is already finished, and the cheapest possible handling is to notice
and drop it.

:::do Make the worker stateless
Every fact the worker needs comes from the message, the job row, or the object
store. Nothing important lives in worker memory, so any worker can pick up any
job at any time, and you can kill workers freely during deploys and scale-downs.
:::

## 15. Streaming, never loading

```java
// Wrong: 10 GB into a process with a 2 GB heap.
byte[] data = s3.getObject(req).readAllBytes();
```

```java
// Right: bounded memory, regardless of object size.
try (var in = s3.getObject(req);                     // InputStream
     var reader = new BufferedReader(new InputStreamReader(in, UTF_8))) {
    var batch = new ArrayList<Row>(BATCH_SIZE);
    String line;
    while ((line = reader.readLine()) != null) {
        batch.add(transform(parse(line)));
        if (batch.size() == BATCH_SIZE) {
            writeBatch(batch);                       // bulk insert
            batch.clear();
        }
    }
    if (!batch.isEmpty()) writeBatch(batch);
}
```

```text
   S3 object ──► network stream ──► decompress ──► parse ──► transform
                                                                │
                                                                ▼
                                                      batch buffer (10k rows)
                                                                │
                                                     full ──────┘
                                                                ▼
                                                          bulk insert
                                                                │
                                                                ▼
                                                          checkpoint
```

:::key
Memory usage becomes a function of ==batch size==, not file size. A worker that
handles 10 GB and one that handles 10 TB have identical memory profiles, so
capacity planning stops depending on the largest file anyone might upload.
:::

#### Batch size is a real trade-off

| Batch               | Effect                                                                     |
| ------------------- | -------------------------------------------------------------------------- |
| Too small (10 rows) | Round-trip overhead dominates, the database is idle waiting                |
| Right (1k to 10k)   | Amortised round trips, memory stays in tens of megabytes                   |
| Too large (1M rows) | Memory spike, long transactions, lock contention, huge rollback on failure |

:::do Practical write-path tuning

- Use the bulk path, not row-by-row inserts: `COPY` on Postgres, `LOAD DATA` on
  MySQL, JDBC batch with `rewriteBatchedStatements=true`.
- Bound the total number of worker connections. Fifty workers each holding a
  connection pool of twenty will exhaust the database long before CPU.
- If the destination is analytical, write Parquet to S3 and load once, rather
  than pushing tens of millions of rows through the OLTP database.
  :::

:::ask The file is a 4 GB gzip. Does streaming still work?
Yes, decompress in the stream (`GZIPInputStream`), memory stays bounded. But
gzip is not splittable, so you cannot assign byte ranges to different workers
and the fan-out in section 19 is unavailable. Formats matter: bzip2, zstd with
frames, and Parquet are splittable, plain gzip is not. Knowing that distinction
is a strong signal.
:::

## 16. Chunking and checkpointing

Without checkpoints, a crash at 90 percent costs you 90 percent.

```text
  10 GB file, 100 chunks of 100 MB

  chunk  1..60  ████████████████████░░░░░░░░  processed
  chunk  61     ▓ in flight
                ✗ worker dies

  no checkpoint:   restart at chunk 1     ~40 minutes wasted
  checkpoint:      restart at chunk 61    ~24 seconds wasted
```

#### Defining a chunk

The chunk must be a ==deterministic function of the input==, so that any worker
computes the same boundaries. Byte ranges are the usual answer, snapped to the
next record delimiter:

```text
  chunk 7 = bytes [700,000,000 .. 800,000,000)

  the reader:
    seeks to 700,000,000
    discards to the next newline      (that partial row belongs to chunk 6)
    reads until past 800,000,000, then to the next newline  (completing the row)
```

That "discard to the next delimiter, finish the trailing record" rule is how
every splittable-format reader works, and stating it shows you have actually
thought about row boundaries rather than assuming they align with byte offsets.

#### Recording progress

```sql
CREATE TABLE job_chunks (
  job_id    UUID NOT NULL,
  chunk_id  INT  NOT NULL,
  status    TEXT NOT NULL,          -- PENDING | DONE | FAILED
  rows_ok   INT  NOT NULL DEFAULT 0,
  rows_bad  INT  NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (job_id, chunk_id)
);
```

:::do Commit the checkpoint with the data, not after it

```sql
BEGIN;
  INSERT INTO results (...) VALUES (...);            -- the chunk's output
  UPDATE job_chunks SET status='DONE', rows_ok=9987
   WHERE job_id=$1 AND chunk_id=$2;
COMMIT;
```

One transaction means the checkpoint can never disagree with the data. Writing
results and then updating the checkpoint separately reintroduces the dual-write
problem from section 11, in the hottest loop of the system.
:::

:::ask What if results go to S3, which has no transaction with your database?
Write the chunk output to a deterministic key (`processed/job-8f21/chunk-007`),
then commit the checkpoint. A crash between the two leaves an orphan object that
the retry simply overwrites, because the key is derived from the chunk ID and
not from a timestamp or a random ID. Deterministic naming is what makes the
retry safe.
:::

## 17. Idempotency

Checkpointing alone is not enough, and this is the sharpest part of the whole
design.

```text
  worker writes 10,000 rows for chunk 7    ✓ committed
  ─────────────── crash before ack ───────────────
  checkpoint says chunk 7 = DONE, but the queue never got the delete

  the message is redelivered
        │
        ▼
  a new worker processes chunk 7 again
        │
        ▼
  20,000 rows, if writes are not idempotent
```

Since delivery is at-least-once, ==at-least-once processing is a certainty==,
not a risk. The system must therefore be built so that repeating work is
harmless.

#### The three mechanisms

**1. A natural or derived unique key**

```sql
ALTER TABLE results
  ADD CONSTRAINT results_unique UNIQUE (job_id, chunk_id, row_ordinal);

INSERT INTO results (job_id, chunk_id, row_ordinal, payload)
VALUES (...)
ON CONFLICT (job_id, chunk_id, row_ordinal) DO NOTHING;
```

**2. Deterministic output keys** for object storage, so a rerun overwrites
rather than appends:

```text
  processed/job-8f21/chunk-00007.parquet     safe to rewrite
  processed/job-8f21/2026-04-11T09-22-15Z    NOT safe, produces duplicates
```

**3. Check-then-skip**, guarded by the checkpoint table:

```java
if (chunks.isDone(jobId, chunkId)) return;   // cheap, but not sufficient alone
```

:::trap Check-then-skip as the only mechanism
It is a race, not a guarantee. Two workers can both read `PENDING` and both
proceed. Use it as an optimisation to avoid redoing expensive work, and rely on
the unique constraint or deterministic key for correctness. The database is the
only thing that can actually arbitrate.
:::

:::signal
Say this: "exactly-once ==delivery== is not achievable across a network, so I
design for at-least-once delivery plus idempotent processing, which gives
effectively-once ==semantics==." Getting delivery-versus-semantics right is a
recognised marker of someone who has operated these systems, and the phrase
"effectively once" is the one that lands.
:::

:::ask What about side effects you cannot deduplicate, like sending an email?
Guard them with a dedicated idempotency record written in the same transaction
as the effect's precondition, or move them behind a provider that accepts an
idempotency key (Stripe and SendGrid both do). If neither is possible, make the
effect the very last step and accept a rare duplicate, having said so explicitly
rather than pretending the problem does not exist.
:::

## 18. The lease problem: when the queue thinks you died

This is the failure most candidates never mention, and it is the one that
actually bites in production.

```text
  SQS visibility timeout = 5 minutes (default is 30 seconds)
  the job takes 90 minutes

  t=0     worker A receives the message, starts work
  t=5m    SQS: "no ack, A must be dead"  ──►  redelivers to worker B
  t=5m    worker B starts the same job
  t=10m   SQS redelivers to worker C
  ...
  t=90m   A finishes. So do B and C, eventually.

  Result: N workers doing identical work, competing for the same rows,
          and the queue is now a duplicate-generating machine.
```

#### Three fixes, used together

**1. Heartbeat the lease.** While working, periodically extend the visibility
timeout. The message stays invisible only as long as the worker is alive.

```java
// Every 60 s, push the deadline out by 5 minutes.
scheduler.scheduleAtFixedRate(() ->
    sqs.changeMessageVisibility(queueUrl, receiptHandle, 300),
    60, 60, SECONDS);
```

On Kafka the equivalent is keeping `max.poll.interval.ms` above your worst-case
processing time, or calling `pause()` and processing off the poll thread so the
consumer keeps heartbeating and is not evicted from the group.

**2. Heartbeat the job row too**, so an operator (and your sweeper) can tell a
running job from an abandoned one:

```sql
UPDATE jobs SET heartbeat_at = now() WHERE id = $1;

-- the sweeper, every minute
UPDATE jobs SET status = 'QUEUED'
 WHERE status = 'PROCESSING' AND heartbeat_at < now() - INTERVAL '3 minutes';
```

**3. Split the work so no single lease is long.** If each message is one chunk
rather than one file, no lease needs to outlive a few minutes, and the whole
class of problem shrinks. This is the real motivation for section 19.

:::key
Long jobs and message queues are in tension by design. Either the lease must
follow the work (heartbeats), or the work must be cut to fit the lease
(chunking). Choose consciously, and say which you chose.
:::

:::ask SQS caps message retention and in-flight time at a maximum. What if a job exceeds it?
The 12-hour ceiling on in-flight time is a hard limit, so you cannot heartbeat
past it. That is a design signal, not a workaround problem: split the job into
chunk messages, each comfortably short, and track overall completion in the
database. If a single indivisible unit of work takes longer than twelve hours,
the queue is the wrong orchestrator and you want a workflow engine (Step
Functions, Temporal, Airflow) that is built for durable long-running state.
:::

## 19. Parallelising one big file

Everything so far scales across ==jobs==. This scales within ==one job==, and it
is the difference between a 44-minute job and a 6-minute one.

```text
                    ┌──────────────┐
                    │ COORDINATOR  │  reads size, computes N chunks,
                    └──────┬───────┘  writes job_chunks, emits N messages
                           │
        ┌──────────┬───────┼───────┬──────────┐
        ▼          ▼       ▼       ▼          ▼
     chunk 0    chunk 1  chunk 2  ...      chunk N-1     (queue messages)
        │          │       │       │          │
        ▼          ▼       ▼       ▼          ▼
     worker     worker  worker   worker    worker        (any worker, any chunk)
        │          │       │       │          │
        └──────────┴───────┼───────┴──────────┘
                           ▼
                    ┌──────────────┐
                    │  FAN-IN      │  last chunk to finish flips the job
                    └──────────────┘  to COMPLETED and runs finalisation
```

#### Detecting completion without a race

The naive check ("count the DONE chunks, if it equals the total, finish the
job") races: two workers finishing simultaneously both see the full count and
both finalise. Make the counter atomic and let exactly one caller win:

```sql
UPDATE jobs
   SET processed_chunks = processed_chunks + 1
 WHERE id = $1
RETURNING processed_chunks, total_chunks;
-- the single caller whose returned counts are equal owns finalisation
```

`UPDATE ... RETURNING` is atomic, so exactly one worker can observe the moment
the counts become equal. That worker, and only that worker, writes the manifest,
flips the status, and fires the notification.

:::signal
Prerequisites matter here, and naming them shows real understanding: fan-out
requires that processing is ==row-independent== and the format is
==splittable==. If rows must be processed in order, or the job needs a global
sort or aggregate, you cannot split freely. Then you either accept a single
worker, or you build a two-phase map and reduce with an intermediate shuffle in
S3.
:::

:::ask How do you pick the number of chunks?
Target a chunk duration, not a chunk size. Aim for something like two to five
minutes of work: short enough that a lease never expires and a retry is cheap,
long enough that per-chunk overhead (leasing, connecting, committing) stays
negligible. Work backwards from measured throughput to a byte size, and cap the
total chunk count so the queue does not receive a hundred thousand messages for
one job.
:::

## 20. Retries, poison pills and the DLQ

```text
                    ┌───────────┐
                    │   QUEUE   │
                    └─────┬─────┘
                          │ receive
                          ▼
                    ┌───────────┐   success   ┌───────────┐
                    │  WORKER   │────────────►│ COMPLETED │
                    └─────┬─────┘             └───────────┘
                          │ failure
                          ▼
                  ┌───────────────┐
                  │ classify      │
                  └───┬───────┬───┘
        retryable     │       │   permanent
                      ▼       ▼
             ┌──────────────┐ └──────────────► FAILED (no retry, tell the user)
             │ backoff and  │
             │ redeliver    │
             └──────┬───────┘
                    │ attempt > maxReceiveCount
                    ▼
             ┌──────────────┐
             │     DLQ      │  alert, inspect, fix, replay
             └──────────────┘
```

#### Classify before you retry

| Class     | Examples                                            | Action                                      |
| --------- | --------------------------------------------------- | ------------------------------------------- |
| Transient | Network blip, DB deadlock, 5xx, throttling          | Retry with backoff and jitter               |
| Poison    | Malformed file, wrong schema, unsupported encoding  | Fail fast, do not retry                     |
| Capacity  | Out of memory, disk full, connection pool exhausted | Retry, but on a different worker, and alert |
| Bug       | NullPointerException in your transform              | Retry once, then DLQ, then fix the code     |

:::trap Retrying everything the same number of times
Retrying a malformed-file error five times with exponential backoff wastes about
half an hour and tells the user nothing useful. Retrying a deadlock once and
giving up throws away work that would have succeeded on the next attempt. The
classification is the design; the retry count is a detail.
:::

:::do Make the DLQ operationally real

- Alert on `DLQ depth > 0`. A dead letter queue nobody watches is a data loss
  mechanism with extra steps.
- Keep the original message, the error, the stack trace and the attempt count,
  so triage does not require reproducing the failure.
- Build a replay path from day one: fix the bug, redrive the DLQ. AWS has
  `StartMessageMoveTask` for exactly this.
- Cap `maxReceiveCount` at 3 to 5. Higher just delays the alert.
  :::

:::ask One row in ten million is malformed. Does the whole job fail?
Almost certainly not, and this should be a product decision you surface rather
than a default you pick silently. Collect bad rows into
`processed/job-8f21/errors.csv` with row numbers and reasons, complete the job as
`COMPLETED_WITH_ERRORS`, and report `9,999,999 ok / 1 rejected`. Add a threshold:
if more than some percentage of rows fail, the file is probably wrong (bad
schema, wrong encoding) and failing the whole job is the correct response.
:::

:::recall List the four failure classes and what you do for each. | 6
:::

:::redraw Redraw the processing path from memory | Queue, lease, heartbeat, stream, chunk, checkpoint, idempotent write, fan-in. Then compare with sections 14 to 20.
:::

:::part VI | State and visibility
A job the user cannot see the state of is a job they will submit again.
:::

## 21. The job state machine

Draw this in the interview. It compresses a great deal of reasoning into one
picture, and it makes every failure path something you can point at.

```text
                          ┌─────────┐
                          │ CREATED │  row exists, upload session issued
                          └────┬────┘
                               ▼
                        ┌─────────────┐
              ┌─────────│  UPLOADING  │─────────┐
              │         └──────┬──────┘         │
     upload failed             │            expired / abandoned
              ▼                ▼                ▼
     ┌────────────────┐  ┌──────────┐  ┌─────────────────┐
     │ UPLOAD_FAILED  │  │ UPLOADED │  │ UPLOAD_EXPIRED  │
     └────────────────┘  └────┬─────┘  └─────────────────┘
                              │ verified: exists, size, checksum
                              ▼
                        ┌──────────┐
                        │  QUEUED  │  outbox published
                        └────┬─────┘
                             ▼
                     ┌──────────────┐
          ┌──────────│  PROCESSING  │◄─────────┐
          │          └──────┬───────┘          │ lease reclaimed
          │                 │                  │ or transient failure
          │                 │                  │
   cancel requested         │            ┌───────────┐
          │                 │            │ RETRYING  │
          ▼                 │            └─────┬─────┘
   ┌────────────┐           │                  │ attempts exhausted
   │ CANCELLED  │           │                  ▼
   └────────────┘           │            ┌───────────┐
                            │            │  FAILED   │
        ┌───────────────────┴──────┐     └───────────┘
        ▼                          ▼
  ┌───────────┐        ┌────────────────────────┐
  │ COMPLETED │        │ COMPLETED_WITH_ERRORS  │
  └───────────┘        └────────────────────────┘
```

:::do Enforce the machine, do not merely document it

- Terminal states are terminal: `COMPLETED`, `FAILED` and `CANCELLED` never
  transition again. This is what makes redelivered messages harmless.
- Guard every write with the state it expects, so concurrent workers cannot
  fight:

```sql
UPDATE jobs SET status='PROCESSING', attempt=attempt+1, started_at=now()
 WHERE id=$1 AND status IN ('QUEUED','RETRYING');
-- zero rows updated means someone else claimed it; drop the message
```

- Record `error_code` (machine-readable, for metrics and retries) separately
  from `error_detail` (human-readable, for support).
  :::

:::ask How do you cancel a running job?
Set `CANCELLED` in the database, and have the worker check a cancellation flag
at each chunk boundary and stop cleanly. You cannot reach into a running worker,
so cancellation is cooperative, and the checkpoint boundary is the natural place
to observe it. Then clean up: delete partial output, abort any multipart upload,
and decide explicitly whether already-written rows are rolled back or left with
the job marked cancelled.
:::

## 22. Progress without hammering the database

Naive progress reporting creates a second scaling problem inside the first one.

```text
  BAD:  UPDATE jobs SET progress = ... after every row
        53 million rows  ->  53 million UPDATEs on one hot row
        the progress bar becomes the bottleneck
```

```text
  GOOD: update on chunk boundaries only
        100 chunks  ->  100 UPDATEs, once every ~25 seconds
        progress is granular enough for a human, invisible to the database
```

For finer granularity without the write load, keep the hot counter in Redis and
let the database hold the durable, coarse checkpoint:

```text
  Redis (fast, approximate, expendable)   DB (durable, coarse, authoritative)
  ─────────────────────────────────────   ──────────────────────────────────
  job:8f21:rows      INCRBY 1000          jobs.processed_chunks  += 1
  job:8f21:pct       61                   jobs.status            = PROCESSING
  TTL 24h                                 committed with the chunk's data
```

:::key
Progress is a ==user experience feature==, not a correctness feature. It may be
approximate, slightly stale, and lost on a Redis restart, so give it a cheap
store and never let it share a transaction with the data path.
:::

#### Estimating what is left

```text
  rows_done = 6,400,000     elapsed = 320 s
  rate      = 20,000 rows/s
  remaining = (53,000,000 - 6,400,000) / 20,000 = 2,330 s = ~39 min
```

Use a moving average over the last few chunks rather than the whole run, so the
estimate reacts to a slowdown instead of averaging it away, and round it
generously. Users forgive an estimate that improves and remember one that slips.

## 23. Telling the frontend

| Mechanism                    | Cost                           | Latency        | Use when                                             |
| ---------------------------- | ------------------------------ | -------------- | ---------------------------------------------------- |
| Client polls `GET /jobs/:id` | One cheap request per interval | Interval-bound | Default. Simple, cache-friendly, survives reconnects |
| Server-sent events           | One held connection per viewer | Immediate      | Server-to-client only, and you want live updates     |
| WebSocket                    | One held connection, both ways | Immediate      | You already have one, or need client-to-server too   |
| Webhook to another service   | One request per transition     | Immediate      | The consumer is a backend, not a browser             |

:::do Poll well, and it beats a bad stream

- Back off as the job ages: 2 s for the first minute, then 5 s, then 15 s.
- Stop polling on a terminal status. Runaway polling of finished jobs is a
  classic frontend bug that shows up as mysterious backend load.
- Return `Cache-Control: no-store` and an `ETag`, so unchanged responses cost a
  304 instead of a payload.
- Poll a read replica or a cache. Status reads vastly outnumber writes, and they
  do not need the primary.
  :::

```json
GET /jobs/8f21c0de-.../status

{
  "jobId": "8f21c0de-...",
  "status": "PROCESSING",
  "progress": { "percent": 61, "chunksDone": 61, "chunksTotal": 100 },
  "rows": { "ok": 6400000, "rejected": 12 },
  "startedAt": "2026-04-11T09:22:15Z",
  "etaSeconds": 2330,
  "output": null,
  "error": null
}
```

:::signal
One status endpoint whose shape does not change between states is worth calling
out. The frontend renders from one contract: `status` decides the view, and the
other fields are populated or null. Interviewers notice API design that will not
need a rewrite in three months.
:::

:::ask A hundred thousand users each watching a job. Does polling hold up?
Yes, if the status read is cheap. It is a single primary-key lookup, cacheable
for a second or two, servable from a replica or Redis. A hundred thousand
pollers at one request per five seconds is twenty thousand requests per second
of trivially cacheable reads, which is far easier to run than a hundred thousand
held WebSocket connections. Say the arithmetic, do not assert the conclusion.
:::

:::part VII | Senior concerns
Scaling, fairness, partial failure, cost, observability and security. Raise
these only after the core design is agreed.
:::

## 24. Scaling: workers, backpressure and queue depth

```text
  queue depth
      │                                        ▲ autoscale up
  1000├───────────────╮                        │ (depth per worker > threshold)
      │               ╰──╮
   500│                  ╰────╮
      │                       ╰──────╮
     0└────────────────────────────────╰─────────────────────────► time
                                              ▼ autoscale down
                                                (idle workers)
```

:::do Scale on the right signal

- Scale on ==queue depth per worker== or ==oldest message age==, not on worker
  CPU. CPU is a lagging, misleading indicator when workers are IO-bound on S3
  and the database.
- Set a maximum worker count, and set it from the ==database's== capacity, not
  the queue's. The queue will happily let you launch two hundred workers that
  collectively DDoS your primary.
- Scale in slowly and out quickly. Killing a worker mid-chunk costs a redelivery
  and wasted work; being slow to add capacity costs latency on every queued job.
- Drain on shutdown: stop receiving, finish the current chunk, checkpoint, exit.
  Handle `SIGTERM`, because your orchestrator will send it.
  :::

#### Backpressure

Scaling up is only half the answer. When the downstream cannot keep up, the
system must slow down rather than fall over.

```text
  workers ──────► database   at capacity
      │
      ├── detect: rising write latency, pool exhaustion, throttling errors
      │
      ├── react:  reduce batch concurrency, add delay between batches,
      │           stop receiving new messages (the queue absorbs it)
      │
      └── never:  retry harder into an overloaded dependency
```

:::key
The queue ==is== the backpressure mechanism. Work waiting in a queue is
harmless; work retried aggressively against a struggling database is how a
slowdown becomes an outage.
:::

## 25. Multi-tenancy and fairness

One queue and one big tenant is a denial of service you built yourself.

```text
  single FIFO queue

  [ acme: 400 chunks ][ acme: ... ][ bob: 1 chunk ]
                                          ▲
                                          └── waits behind all of acme

  Bob uploaded a 5 MB file and waits two hours. Bob churns.
```

| Approach                   | How it works                                          | Cost                                      |
| -------------------------- | ----------------------------------------------------- | ----------------------------------------- |
| Per-tenant queues          | One queue each, workers round-robin                   | Does not scale past a few hundred tenants |
| Weighted fair queueing     | Sample queues in proportion to weight                 | More logic, much better behaviour         |
| Concurrency cap per tenant | A tenant may hold at most N leases                    | Simple, effective, easy to explain        |
| Size-based lanes           | Small, medium and large queues with dedicated workers | Small jobs always stay fast               |

:::signal
Size-based lanes are the pragmatic answer and are easy to justify: a dedicated
pool for jobs under some threshold guarantees that small uploads never queue
behind terabyte ones. It is the same reasoning as a supermarket express lane,
and interviewers respond well to it because it is a real product decision rather
than an algorithm.
:::

:::ask How do you stop one tenant from consuming the whole worker fleet?
Cap in-flight chunks per tenant. Before claiming a chunk, check that tenant's
active count against its limit and skip the message if it is at the cap, letting
it return to the queue. Combined with size lanes this bounds the blast radius of
any one tenant without needing a full fair-queueing implementation.
:::

## 26. Partial failure: what "failed" means

```text
  10,000,000 rows
   9,999,988 written  ✓
          12 rejected  (bad date format, row 4,201,993 and 11 others)

  Is this job COMPLETED or FAILED?
```

There is no universally correct answer, which is exactly why you should raise
it. What matters is that the behaviour is a decision, not an accident.

:::do Give the caller the full picture, and a policy dial

```json
{
  "status": "COMPLETED_WITH_ERRORS",
  "rows": { "ok": 9999988, "rejected": 12 },
  "errorReport": "s3://acme-ingest/processed/job-8f21/errors.csv",
  "policy": { "failThresholdPercent": 1.0 }
}
```

- Write every rejected row, with its row number and reason, to an error file.
- Apply a threshold: above it, the file is probably wrong and the job should
  fail outright rather than half-load a bad dataset.
- Let the tenant configure `strict` (any error fails) or `lenient` (report and
  continue). Different customers genuinely want different answers.
  :::

:::ask If the job fails at 80 percent, do you roll back the 80 percent?
State the trade-off rather than picking blindly. Rolling back gives clean
all-or-nothing semantics but throws away hours of work and needs either a staging
table or a delete keyed by `job_id`. Leaving it lets the retry resume from the
checkpoint, which is far cheaper, and is safe precisely because the writes are
idempotent. The usual production answer is: load into a staging table, and make
the atomic swap into the live table the final step, so consumers only ever see a
complete dataset.
:::

## 27. Cost, the bill nobody mentions

Cost questions separate people who have run these systems from people who have
read about them.

| Line item                     | Where it comes from                                 | What to do                                                            |
| ----------------------------- | --------------------------------------------------- | --------------------------------------------------------------------- |
| Abandoned multipart parts     | Uploads that never completed, billed forever        | Lifecycle rule: abort incomplete uploads after 7 days                 |
| Request costs                 | Millions of tiny parts or tiny objects              | Larger parts, fewer objects                                           |
| Cross-AZ or egress transfer   | Workers in a different AZ or region from the bucket | Colocate workers with the bucket, use a VPC endpoint                  |
| Idle workers                  | Fleet sized for peak, running at trough             | Scale on queue depth, use spot instances                              |
| Storage of raw inputs forever | No retention policy                                 | Lifecycle: Infrequent Access at 30 days, Glacier at 90, delete at 365 |
| Database write amplification  | Row-by-row inserts and index maintenance            | Bulk load, drop and rebuild indexes                                   |

:::do The lifecycle rule everyone forgets

```json
{
  "Rules": [
    {
      "ID": "abort-incomplete-multipart",
      "Status": "Enabled",
      "Filter": { "Prefix": "uploads/" },
      "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 7 }
    }
  ]
}
```

Without this, every abandoned upload's parts are stored and billed indefinitely,
and they are invisible in the console because the object does not exist. It is a
real and common production bill surprise, and mentioning it unprompted is one of
the strongest signals in this entire design.
:::

## 28. Observability and security

#### Observability

:::do Instrument the four things you will actually be paged about

- **Correlation.** One `jobId` on every log line, span and metric, from the API
  through the queue into the worker. Without it, debugging is archaeology.
- **Metrics that map to user pain**, not to machines:

```text
  queue_depth                    is work piling up?
  oldest_message_age_seconds     the real latency SLO
  job_duration_seconds{p50,p99}  is it getting slower?
  chunk_failure_rate             is something broken?
  dlq_depth                      page immediately, always
  upload_abort_rate              is the client-side path broken?
```

- **Structured logs**, one event per state transition, so a job's whole life can
  be reconstructed from a single query.
- **Tracing** across the async boundary: propagate the trace context in the
  message headers, or the trace stops dead at the queue.
  :::

#### Security

| Concern                          | Control                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------- |
| Anyone can upload anywhere       | Presigned URL scoped to one method, one key, short expiry                    |
| Client-supplied object keys      | Derive the key server-side from the job ID, always                           |
| Oversized uploads                | `content-length-range` in the POST policy                                    |
| Cross-tenant reads               | Bucket policy plus `tenant_id` checks on every job lookup                    |
| Data at rest                     | SSE-KMS, per-tenant keys if the compliance story demands it                  |
| Data in transit                  | TLS everywhere, and reject unencrypted transport in the bucket policy        |
| Malicious content                | Scan before processing if the file is user-generated and will be served back |
| Zip bombs and huge decompression | Cap the decompressed byte count and abort past the limit                     |
| PII in logs                      | Log row numbers and error codes, never row contents                          |

:::trap Logging the failing row to help debugging
It is the most natural thing to write, and it puts customer data into your log
aggregator, where it is retained, indexed, and readable by everyone with log
access. Log the row number and the error code. Put the row itself in the
tenant-scoped error file in their own bucket prefix.
:::

:::recall Name three cost items and their mitigations, without looking. | 5
:::

:::part VIII | The interview itself
You now know more than enough. This part is about delivery, which is a separate
skill and the one most candidates neglect.
:::

## 29. The seven-step delivery script

Do not open with a diagram of fifteen boxes. Interviewers score the ==process==
as much as the answer.

```text
  1. CLARIFY        2 min   size, source, processing shape, duration, scale
  2. NAME THE       1 min   "this is a reliability problem, not a
     REAL PROBLEM            throughput problem"
  3. SIZE IT        2 min   transfer time, processing time, backlog
  4. SPLIT IT       1 min   ingestion and processing are separate failure domains
  5. DESIGN         8 min   ingestion first, then handoff, then processing
     THE HAPPY PATH
  6. BREAK IT      10 min   network fails, worker dies, message redelivered,
                            lease expires, one row is bad
  7. SCALE AND      5 min   more workers, fairness, cost, metrics, security
     OPERATE
```

:::signal
Step 6 is where the interview is decided, so get there deliberately and early
rather than being dragged. Saying "the happy path is straightforward, so let me
spend our time on the failure modes" tells the interviewer you know where the
difficulty lives, and it puts you in control of the session.
:::

#### Phrases worth having ready

- "Let me size this before I draw anything."
- "The object at rest in S3 is the handoff between two independent failure
  domains."
- "Exactly-once delivery is not achievable, so I want at-least-once delivery
  plus idempotent processing, which gives effectively-once semantics."
- "Long jobs and message leases are in tension. Either the lease follows the
  work, or the work is cut to fit the lease."
- "The queue is the backpressure mechanism."
- "That is a product decision. Here are the two behaviours and what each costs."

## 30. Whiteboard drawing order

Draw in this order, narrating as you go. Never draw everything and then explain.

```text
  step 1        step 2                     step 3
  ──────        ──────                     ──────
  FE  API       FE ──► API ──► S3          FE ─► API ─► S3 ─► Q ─► W ─► DB
                       │
                       └──► DB (metadata)

  step 4: annotate the arrows with the failure and its answer
          FE ─► S3     multipart + resume + backoff
          S3 ─► Q      outbox, at-least-once
          Q  ─► W      lease + heartbeat, DLQ
          W  ─► DB     idempotent writes, checkpoint per chunk

  step 5: only now, the extras
          Redis progress, SSE, per-tenant lanes, metrics, lifecycle rules
```

:::do Three whiteboard habits that read as senior

1. Label arrows with the ==protocol and the failure mode==, not just a verb.
   "PUT part, retry with backoff" beats "upload".
2. Write the state machine in a corner and point at it when discussing failures.
   It saves you re-explaining the same transition three times.
3. Leave space. A cramped diagram you cannot extend forces you to erase, and
   erasing mid-answer breaks your narrative.
   :::

## 31. Follow-up question bank

Cover the answers and work through these out loud. If you can answer twenty of
the twenty-five, you are ready.

| #   | Question                                          | The one-line answer                                                                               |
| --- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | Why not send the file through your API?           | Bandwidth, memory and timeouts on the tier least able to absorb them; presign instead             |
| 2   | Why S3 over the database?                         | Cost, size ceiling, streaming reads, direct client upload, backup impact                          |
| 3   | How do you resume a failed upload?                | Multipart: keep the `uploadId`, `ListParts`, re-upload only what is missing                       |
| 4   | What part size, and why?                          | `max(8 MiB, size/9500)`; the 10,000-part cap and retry cost set both bounds                       |
| 5   | An upload is abandoned. What happens?             | Lifecycle rule aborts incomplete uploads; a sweeper expires the job row                           |
| 6   | Why is a 403 special during upload?               | An expired presigned URL, so re-sign and retry rather than failing permanently                    |
| 7   | How do you know the upload finished?              | `CompleteMultipartUpload`, then `HeadObject` to verify size and checksum                          |
| 8   | The client dies after the last part. Now what?    | The S3 `ObjectCreated` event is the safety net for the client-driven path                         |
| 9   | Row is written, publish fails. What breaks?       | Dual write: the job is ready but nothing is queued; fix with a transactional outbox               |
| 10  | Kafka or RabbitMQ, and why?                       | Per-message ack wins for long variable tasks; Kafka's ordered offsets cause head-of-line blocking |
| 11  | When would you actually use Kafka?                | Many independent consumers of the same event, replay, or it is already the backbone               |
| 12  | Worker dies at 60 percent. What is lost?          | One chunk, because checkpoints commit in the same transaction as the chunk's data                 |
| 13  | Why must processing be idempotent?                | Delivery is at-least-once, so duplicate processing is certain, not hypothetical                   |
| 14  | How do you make a write idempotent?               | Unique key with `ON CONFLICT DO NOTHING`, or deterministic object keys                            |
| 15  | The queue redelivers a job that is finished.      | Terminal-state check at the top of the loop; delete the message and move on                       |
| 16  | A 90-minute job on a 5-minute visibility timeout. | Heartbeat the lease, and preferably split the work so no lease is long                            |
| 17  | Can you exceed the 12-hour in-flight cap?         | No; split into chunk messages, or use a workflow engine for the orchestration                     |
| 18  | How do you process one file in parallel?          | Byte-range chunks snapped to delimiters, fan out, fan in with an atomic counter                   |
| 19  | Who finalises the job when chunks finish?         | `UPDATE ... RETURNING` on a counter; exactly one caller sees done equal to total                  |
| 20  | One bad row in ten million.                       | Error file plus `COMPLETED_WITH_ERRORS`, with a configurable failure threshold                    |
| 21  | How does the frontend see progress?               | Poll a cheap cached status endpoint; chunk-boundary updates, Redis for fine counters              |
| 22  | Why not update progress per row?                  | Fifty-three million writes to one hot row; the progress bar becomes the bottleneck                |
| 23  | How do you autoscale workers?                     | On queue depth per worker or oldest message age; cap by database capacity                         |
| 24  | One tenant floods the system.                     | Per-tenant concurrency caps and size-based lanes                                                  |
| 25  | What is the cost bug nobody catches?              | Abandoned multipart parts billed forever with no visible object                                   |

:::redraw Draw the entire system from memory, then grade yourself | Eleven steps, four failure annotations, the state machine. Compare against page one.
:::

:::part IX | Appendices
Numbers, vocabulary and a self-test.
:::

## Appendix A. Numbers to memorise

```text
  S3
    minimum part size                     5 MiB (last part exempt)
    maximum part size                     5 GiB
    maximum parts per upload             10,000
    maximum object size                   5 TiB
    maximum single PUT                    5 GiB
    read-after-write consistency          strong, for all operations
    durability                            11 nines (design goal)

  SQS
    default visibility timeout           30 seconds
    maximum visibility timeout           12 hours
    maximum message retention            14 days
    maximum message size                256 KB (use an S3 pointer beyond that)
    long poll maximum                    20 seconds

  Kafka
    default max.poll.interval.ms          5 minutes
    default session.timeout.ms           45 seconds

  Rules of thumb
    100 Mbit/s                          ~12.5 MB/s  (10 GB in ~14 min)
    1 Gbit/s                            ~125 MB/s   (10 GB in ~85 s)
    CSV row                             ~100 to 200 bytes
    single-worker parse + transform     ~20k rows/s
    bulk insert, indexed table          ~10k to 50k rows/s
    S3 GET first-byte latency           ~20 to 100 ms
    S3 throughput per prefix            ~5,500 GET/s, ~3,500 PUT/s
```

## Appendix B. Glossary

| Term                       | Meaning                                                                     |
| -------------------------- | --------------------------------------------------------------------------- |
| Backpressure               | Letting work queue up instead of pushing it into an overloaded dependency   |
| Checkpoint                 | Durable record of progress, so a restart resumes rather than repeats        |
| DLQ                        | Dead letter queue: where messages go after exhausting retries               |
| Dual write                 | Writing to two systems without a shared transaction, so they can disagree   |
| Effectively once           | At-least-once delivery plus idempotent processing; the achievable goal      |
| Fan-out / fan-in           | Splitting one job into parallel units, then detecting collective completion |
| Head-of-line blocking      | One slow item at the front delaying everything behind it                    |
| Idempotent                 | Repeating the operation produces the same result as doing it once           |
| Lease / visibility timeout | The window in which a consumer must ack before redelivery                   |
| Multipart upload           | Uploading one object as independently retryable parts                       |
| Outbox                     | Events written in the same transaction as the state change, relayed after   |
| Poison pill                | A message that will never succeed, no matter how often it is retried        |
| Presigned URL              | A time-limited signed URL authorising one operation on one key              |
| Splittable format          | A format that can be read from an arbitrary offset (not plain gzip)         |
| Thundering herd            | Many clients retrying in lockstep and recreating the outage                 |

## Appendix C. Self-test

Write the answers in the rail before checking the section named in brackets.

1. Why can this not be one synchronous HTTP request? Give five reasons. [4]
2. What exactly does a presigned URL authorise? [6]
3. Compute the part size for a 900 GB file. [8]
4. A part upload returns 403. Retry or not? [9]
5. What are the three checks before accepting an upload? [10]
6. Draw the dual-write failure in both orderings. [11]
7. Why does Kafka suffer head-of-line blocking here? [13]
8. What is the memory profile of the worker, as a formula? [15]
9. Why must the checkpoint commit with the data? [16]
10. Why is check-then-skip insufficient for idempotency? [17]
11. What are the three fixes for the lease problem? [18]
12. How does exactly one worker finalise a fanned-out job? [19]
13. Name the four failure classes. [20]
14. Which states are terminal, and why does that matter? [21]
15. Why is per-row progress a bug? [22]
16. When does polling beat WebSockets? [23]
17. What signal should autoscaling use, and what must cap it? [24]
18. How do you stop one tenant starving the fleet? [25]
19. What does `COMPLETED_WITH_ERRORS` need to return? [26]
20. What is the invisible S3 cost, and its fix? [27]

:::redraw Notes and open questions | Anything above you could not answer without looking.
:::
