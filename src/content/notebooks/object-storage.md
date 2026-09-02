:::title Draw what happens today when a user uploads a profile picture to your app. Keep it. Redraw it at the end.
System Design Notebook / 02
Object Storage
Why a file is not your application's data, and what to do about it
Senior backend and full-stack interview preparation. Read with a pen.
:::

## How to use this book

This book follows one lecture end to end and then keeps going where the lecture
stops. The lecture is _Object Storage, Everything You Need to Know_, parts 1 and
2 (`youtube.com/watch?v=Ie0TjKI9cDI` and `?v=iWrVCxexUWY`), and its structure is
worth copying: it does not start with S3. It starts with the most reasonable thing a competent developer
would write on their first day, then kills it seven times, and only then
introduces the thing that survives.

That is also how the topic is examined. Nobody asks "what is S3". They ask "a
user uploads a 4 GB video, walk me through it", and the answer is judged by
whether you know ==which failure you are avoiding at each step==.

#### The five block types

| Block            | What it means                                                              |
| ---------------- | -------------------------------------------------------------------------- |
| Interviewer asks | A real follow-up you should expect. Answer it out loud before reading on.  |
| Senior signal    | The specific sentence that separates a senior answer from a mid-level one. |
| Trap             | A common answer that sounds right and is wrong.                            |
| Do this          | The concrete practice, with the parameter or command.                      |
| Key idea         | The one thing to carry out of that section.                                |

#### The four highlighters

Colour in this book is never decorative. Each one means one thing, so a marked
phrase is already half-read before you get to the words.

| Mark      | Means                                                         |
| --------- | ------------------------------------------------------------- |
| ==peach== | The sentence to carry away                                    |
| !!rose!!  | The wrong answer, the thing that bites                        |
| ++mint++  | The correct practice                                          |
| %%pink%%  | A definition, a term of art, at the point it is first defined |

Figures follow the same discipline. Box drawing recedes to a pale wire so the
shape reads first, NODE LABELS take full ink, and anything after a left arrow
is an annotation in pencil rather than part of the machine.

#### What is in the lecture and what is not

Parts I to VII are the two lectures, expanded and reordered. Parts VIII onwards
are the production concerns that turn up in interviews immediately after the
upload path is agreed, and are not in either lecture: the access-control
mechanisms, encryption, lifecycle and untrusted content. Sections overlapping
Notebook 01
(_Large-Scale Data Ingestion_) say so and point at the section there that goes
deeper, rather than repeating it.

#### A suggested route

1. Read Part I in one sitting. Do not skip to the answer. The seven failures are
   the actual content of an interview answer; object storage is just the noun at
   the end of them.
2. Read Parts II to IV. These are the "do you understand the system or have you
   only used the SDK" sections.
3. Work Part V with an editor open. Build the two-phase flow once.
4. Skim VI and VII, then drill VIII.

:::key
Object storage is not "a folder in the cloud". It is a deliberate trade: you
give up in-place modification, hierarchy and locking, and in exchange you get
capacity, durability and horizontal scale with no coordination. Every quirk in
this book falls out of that one trade.
:::

:::toc
:::

## The whole picture on one page

```text
                    ┌──────────────────┐
                    │     BROWSER      │
                    └────┬─────────┬───┘
       1. POST /uploads  │         │  3. POST file + policy fields
          (intent only)  │         │     (bytes go direct, never to you)
                         ▼         │
                  ┌─────────────┐  │
                  │ YOUR SERVER │  │      ┌────────────────────────┐
                  │             │  │      │     OBJECT STORAGE     │
                  │ authorise   │  │      │                        │
                  │ pick key    │  └─────▶│  bucket + key = object │
                  │ sign policy │         │                        │
                  └──────┬──────┘         │  metadata plane        │
       2. row: status    │                │    sorted index        │
          = pending      │   5. HEAD key  │  data plane            │
                         │  ◀───────────▶ │    14+6 shards         │
                         ▼                └───────────┬────────────┘
                  ┌─────────────┐                     │
                  │  DATABASE   │  6. status=ready    │ 7. GET via
                  │             │                     │    signed URL
                  │ what exists │                     ▼
                  │ who owns it │              ┌─────────────┐
                  │ orig. name  │              │     CDN     │──▶ users
                  └─────────────┘              └─────────────┘

        4. client calls POST /uploads/:id/complete after the PUT
```

Two rules are encoded in that picture, and they are the whole architecture:

- ==The bytes never touch your server.== Your server authorises, names, signs
  and records. It does not carry payload.
- ==The database is the index; the bucket is the storage.== The bucket knows how
  to hold bytes. It does not know which user owns them, what the file was
  called, or whether the upload finished.

:::redraw The upload path, from the browser's first request to a ready row. | Six arrows. Label which ones carry file bytes.
:::

:::part I | The naive design, and the seven ways it dies

The design every backend writes on day one, and each production failure that
takes it apart. Learn these in order: they are the spine of the interview
answer, and each one eliminates an option until only object storage is left.
:::

## 1. The requirement, and the intuitive answer

A user needs to upload a profile picture. You have a backend with handlers,
services, repositories, a database and auth. Nothing exotic is being asked for.

The intuitive implementation writes itself:

```text
  browser                 your server                     disk + db

  <input type=file>  ──▶  parse multipart/form-data
                          write bytes to /var/app/uploads/avatar.png
                          INSERT INTO users(avatar_path) VALUES (...)
                     ◀──  200 OK

  <img src=/avatar>  ──▶  SELECT avatar_path
                          read the file off disk
                     ◀──  image bytes
```

The browser sends the file as `multipart/form-data`, you pull it out of the
request, you save it to the local file system, because it is a file and files
live in file systems, and you record the path in a row so you can find it again.

It works. It works on your laptop, it works in staging, and it works in
production on the day you ship it. That is exactly what makes it dangerous: the
design does not fail at the moment it is wrong, it fails later, under conditions
your development machine never reproduces.

:::signal
"That design is not wrong because saving a file is wrong. It is wrong because it
puts ==state on a server I have been trying very hard to keep stateless==, and
puts the ==payload in the request path of a process I sized for JSON==."
:::

The wrong assumption underneath it is small and worth naming precisely, because
the interviewer is listening for it:

:::key
The naive design assumes %%a file is data your application owns%%, like a row.
It is not. Your service spends 95% of its life moving kilobyte JSON documents.
A file has a different size profile, a different access pattern, a different
cost profile and a different failure profile, so it needs different storage.
:::

The next seven sections are the seven ways this comes apart. Read them as a
sequence of forced moves, not a list of complaints.

## 2. Failure 1: the file does not fit

The pattern survives profile pictures. A phone photo is 300 KB to 10 MB, a
mirrorless camera file might be 20 MB, and all of that fits comfortably in a
server sized for JSON.

Then a feature lands that needs video, and someone uploads 4 GB.

```text
  container memory limit: 4 GB

  request arrives ──▶ framework helpfully parses the whole body
                      into memory before handing it to your handler

     0 GB  ▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏  ▏
     1 GB  ████████▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏  ▏
     2 GB  ████████████████▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏▏  ▏
     3 GB  ████████████████████████▏▏▏▏▏▏▏▏▏▏▏▏▏  ▏
     4 GB  ████████████████████████████████ OOMKilled
```

`ParseMultipartForm` in Go, the default body parser in an Express app, the same
helper in every framework: the convenient call is the one that buffers. The
container hits its memory limit and the kernel kills it.

Note the second-order effect, which is the part people miss. The instance
restarts, and ==every file ever uploaded to that instance is gone==, because it
was on the container's file system. One user's oversized video destroyed other
users' data. The blast radius of an OOM is not one request.

:::trap "We stream the upload, so the file size is not a problem"
Streaming fixes !!memory!!. It does not fix bandwidth, connection hold time,
load balancer idle timeouts, reverse proxy body caps, or the fact that a request
worker is pinned for the duration. Section 25 is entirely about the limits that
survive streaming. Say "streaming fixes memory, not the data path".
:::

:::ask How much memory does a streaming upload actually use?
One buffer, typically tens of kilobytes, regardless of whether the object is
1 MB or 1 GB. You read a chunk off the request body and write it to the storage
client, then reuse the buffer. Section 24 has the measured comparison: same
wall-clock time, flat memory line instead of a 500 MB climb.
:::

## 3. Failure 2: the disk is ephemeral

A container's file system lives exactly as long as the container.

```text
  deploy v1        ┌────────────┐
                   │ container  │  /app/uploads/  a.png  b.png  c.mp4
                   └────────────┘
                          │
  push new code, CI/CD builds a new image
                          │
                          ▼
  deploy v2        ┌────────────┐
                   │ container  │  /app/uploads/  (empty)
                   └────────────┘
```

The image contains your code. It does not contain your users' files. So every
deploy, every crash, every OOM kill, every node drain, every scale-in event
wipes them. This is not a bug in Docker; it is the property that makes
containers interchangeable, and it is the same property your deployment strategy
depends on.

If you deploy on Kubernetes, ECS, Railway, Render, Fly, or any serverless
platform, this applies to you. On serverless it is worse: the writable area is
usually a small `/tmp` that disappears between invocations.

#### The partial solution: a persistent volume

If you know Kubernetes you already have an answer in mind: attach a
PersistentVolume so the storage outlives the container.

That does work, for this failure. It is worth being precise about what it buys
and what it does not:

| Failure                        | Persistent volume fixes it?          |
| ------------------------------ | ------------------------------------ |
| 1. File does not fit in memory | No, unrelated                        |
| 2. Ephemeral storage           | ==Yes==                              |
| 3. Horizontal scaling          | No, and RWO volumes make it worse    |
| 4. Fixed size disk             | No, still a vertical resize          |
| 5. Durability                  | Partly, depends on the storage class |
| 6. Server as CDN               | No                                   |
| 7. No cross-system transaction | No                                   |

:::trap "A persistent volume solves the file storage problem"
It solves !!one!! of seven. Worse, the common volume access mode
(`ReadWriteOnce`) attaches to a single node, so adopting it can pin your pod to
one node and quietly undo the horizontal scalability you were trying to keep.
:::

:::key
Volumes are for state a single workload owns, like a database's data directory.
User-uploaded content is ==shared, unbounded and permanent==, which is a
different problem.
:::

## 4. Failure 3: horizontal scaling, and the 1-in-N 404

This is the failure that most often gets asked about directly, because it is
about statelessness rather than storage.

Three instances behind a load balancer, round robin:

```text
                        ┌───────────────┐
      upload  ─────────▶│ LOAD BALANCER │
                        └───┬───┬───┬───┘
                            │   │   │
                  ┌─────────┘   │   └─────────┐
                  ▼             ▼             ▼
            ┌──────────┐  ┌──────────┐  ┌──────────┐
            │  node 1  │  │  node 2  │  │  node 3  │
            │ avatar ✓ │  │  (none)  │  │  (none)  │
            └──────────┘  └──────────┘  └──────────┘

      two minutes later, the browser asks for the image.
      round robin sends it to node 3.        ──▶  404
```

The upload landed on node 1. The read is routed by an algorithm that knows
nothing about where bytes are, so it lands wherever it lands. Your hit rate is
about `1/N`, and it ==gets worse every time you scale out==, which is the exact
opposite of what scaling is supposed to do.

:::signal
"Storing uploads on the instance's local disk breaks the one property a
horizontally scaled server must have: ==no instance holds state the others do
not==. The moment that is false, the load balancer's routing decision becomes a
correctness decision."
:::

:::ask Could you fix this with sticky sessions?
You can make it appear fixed, and you should say why that is a bad trade.
Session affinity pins a user to one node, so a redeploy, a crash or a scale-in
loses their files anyway, load distribution degrades, and you have converted a
stateless tier into a stateful one to avoid a storage decision. It also does
nothing when two different users need the same object, which is the normal case
for shared or public content.
:::

:::ask What about a shared network file system, NFS or EFS?
Legitimate, and it is what many older systems did. It gives every node the same
namespace, so the 404 goes away. What you inherit is POSIX coordination over a
network: locking, metadata round trips, small-file latency, a throughput ceiling
you now have to provision, and an operational surface. See section 10. It is the
right answer when you genuinely need file semantics, for example a legacy binary
that calls `open()` and `seek()`. It is the wrong answer when all you needed was
put and get.
:::

## 5. Failure 4: the disk grows the wrong way

Servers scale horizontally. Disks do not.

```text
  more traffic     ──▶  add another instance        (horizontal, online)
  more files       ──▶  make the one disk bigger    (vertical, disruptive)
```

Growing a disk means a resize: detach, expand, reattach, sometimes copy, usually
with downtime or at least a maintenance window. And every provider has a
ceiling, so "just make it bigger" has a last iteration.

Meanwhile user-uploaded content is typically the ==fastest growing data in the
entire system==, and it is close to monotonic, because people delete far less
than they upload.

```text
  1,000 users × 100 MB per month  =  100 GB / month, forever

  month  1     6     12    24    36
  size   0.1   0.6   1.2   2.4   3.6  TB   and it never shrinks
```

:::key
Capacity planning for user content is a losing game. The correct answer is a
storage system where capacity is ==not a number you provision at all==: you keep
writing objects and there is nothing to resize.
:::

:::ask Is capacity really infinite in object storage?
Practically, yes, and precisely, no. There is no volume you size, no resize
operation and no ceiling you will reach, but there are per-object limits (S3
caps a single object at 5 TiB and a single PUT at 5 GiB, hence multipart), and
account-level request rate limits per prefix. "Infinite capacity, finite request
rate per partition" is the accurate sentence.
:::

## 6. Failure 5: durability is not availability

Disks die. Not rarely, not exceptionally: at fleet scale, constantly. If your
one disk holds the only copy of a user's photos, that disk's failure is
permanent data loss.

Two words get used interchangeably in casual conversation and must not be:

|                    | Availability                    | Durability                                    |
| ------------------ | ------------------------------- | --------------------------------------------- |
| Question           | Can I reach the data right now? | Does the data still exist?                    |
| Failure looks like | 500s, timeouts, a slow endpoint | The bytes are gone                            |
| Recovery           | ==Wait.== It comes back         | You cannot wait. There is nothing to wait for |
| Measured as        | uptime %, e.g. 99.99%           | annual object loss probability, e.g. 11 nines |

:::signal
"An availability incident is a bad afternoon. ==A durability incident is a bad
company.== You can apologise for slow. You cannot apologise for gone."
:::

The only known cure for a durability problem is redundancy: more than one copy,
in more than one failure domain. And the moment you have copies you have signed
up for the rest of it:

- checksums, so you can tell a good copy from a silently corrupted one
- background scrubbers that read cold data looking for bit rot
- repair processes that rebuild a lost copy before a second failure catches you
- placement rules, so the copies are not in one rack on one power feed

That is a serious, permanent engineering programme. It is not something you
build alongside your product.

:::key
You do not want to be in the durability business. Paying someone else for it
is one of the few clearly correct build-versus-buy decisions in backend
engineering.
:::

## 7. Failure 6: your server is an expensive CDN

Uploads get the attention. Downloads are quietly worse, because there are far
more of them.

A 50 MB file to a phone on 2 Mbps:

```text
  50 MB = 400 Mb;  400 Mb / 2 Mbps  =  200 seconds  ≈  3.5 minutes

  for those 3.5 minutes, one worker is:
     ┌──────────────────────────────────────────────┐
     │  read 32 KB from disk ──▶ write 32 KB to a    │
     │  socket that drains at dial-up speed  ──▶ …   │
     └──────────────────────────────────────────────┘
     CPU used: ~nothing.   Worker occupied: totally.
```

Whatever your concurrency primitive is, a goroutine, an event loop slot, a
thread, a worker process, it is now pinned to copying bytes very slowly to a
device thousands of miles away. With a 100-connection limit, 100 slow readers is
your whole server.

#### IO-bound versus CPU-bound, and why it matters here

|             | CPU-bound                                     | IO-bound                                         |
| ----------- | --------------------------------------------- | ------------------------------------------------ |
| Doing what  | Hashing, encoding, JSON parse, business rules | Waiting on a socket, a disk, a database, an API  |
| Bottleneck  | Cores                                         | Concurrency slots and bandwidth                  |
| Scale it by | More cores, faster code                       | More concurrency, or ==getting out of the path== |

Serving files is IO-bound work with none of the value: your server is acting as
a content delivery network with one location, no caching layer, no anycast, no
edge, and a per-instance connection cap. There is an industry of machines built
exactly for this job, and yours is not one of them.

:::signal
"I do not want my application tier in the data path for large payloads at all,
in either direction. Uploads go ==browser to bucket== with a signed
capability, downloads go ==CDN to browser== from the bucket as origin. My
service handles authorisation and metadata, which is the work only it can do."
:::

## 8. Failure 7: no transaction across two systems

The last failure is the subtle one, and unlike the other six ==it does not go
away when you adopt object storage==. It only becomes easier to manage.

You are writing to two systems that know nothing about each other, so there is
no transaction spanning them. Both orderings are broken:

```text
  ORDER A: file first                  ORDER B: row first

  write file to disk        ✓          INSERT row                ✓
  INSERT row                ✗          write file to disk        ✗
  ────────────────────────────         ────────────────────────────
  orphan: bytes nobody can             dangling pointer: every read
  reach, paid for forever              of that row 404s or 500s
```

There is no ordering that fixes this, because the failure is between the two
operations, not inside either.

What you can do is choose ==which failure mode you prefer==, and then reconcile:

- Prefer the orphan. Write the object first, commit the row second. An
  unreferenced object costs money and can be swept by a lifecycle rule. A
  dangling row corrupts user-visible behaviour and every read path must defend
  against it.
- Make the intent durable first. Section 29's two-phase flow writes a `pending`
  row ==before== any bytes move, so a failure leaves a row you can reason about
  rather than a mystery.
- Reconcile on a schedule. A background job resolves disagreements between the
  two sources of truth. Section 30.

:::key
The database is the source of truth for ==what exists and who owns it==. The
bucket is the source of truth for ==the bytes==. They will disagree. Design the
reconciliation before you ship, not after the first support ticket.
:::

:::ask This sounds like the dual-write problem. Is it?
It is exactly the dual-write problem, and the transactional outbox is the
general solution: commit the intent in the same transaction as your business
data, then let a relay perform the second effect with retries. Notebook 01
section 11 works this through in full. For upload specifically, two-phase plus
a sweeper is usually enough, because the object store gives you a cheap,
authoritative existence check (`HEAD`) that a message broker cannot.
:::

:::recall Name all seven failures of the local-disk design, in order, without looking. | 8
:::

:::part II | Three kinds of storage

Block, file and object are not three products. They are three different answers
to the question "what is the smallest interface I can offer", and every
property you like or hate about each one is downstream of that answer.
:::

## 9. Block storage

The lowest level. A block device gives you a raw array of fixed-size blocks,
each with a number, and that is the entire interface.

```text
  block #0   block #1   block #2   …   block #9,000,000
  ┌────────┐ ┌────────┐ ┌────────┐     ┌────────┐
  │ 4 KB   │ │ 4 KB   │ │ 4 KB   │ ··· │ 4 KB   │
  └────────┘ └────────┘ └────────┘     └────────┘

  read(block_number)          write(block_number, bytes)
```

Blocks are typically 512 bytes or 4 KB. There is no file, no name, no directory,
no permission. Your SSD is a block device. AWS EBS is a block device delivered
over a network.

| Property    | Block storage                             |
| ----------- | ----------------------------------------- |
| Interface   | Read and write numbered fixed-size blocks |
| Latency     | ==Microseconds==                          |
| Examples    | SSD, NVMe, AWS EBS, GCP Persistent Disk   |
| Attach to   | ==Exactly one machine at a time==         |
| Typical use | Boot volumes, database data directories   |

Two facts matter for interviews.

First, this is why databases live here. PostgreSQL and MySQL want to control
their own page layout, their own write ordering and their own fsync behaviour,
so they want the thinnest possible layer between them and the device. They sit
on a file system, but they use it as little as possible, with pre-allocated
files, direct IO and explicit flushes, precisely to keep block-level latency.

Second, ==a block device attaches to one machine==. That single sentence
disqualifies it for shared user content and is worth having ready, because it is
the fastest way to explain why EBS is not the answer to "where do the uploads
go".

:::key
Block storage is the fastest and the least useful on its own. You cannot build
an application directly on numbered blocks; something has to give them meaning.
That something is a file system.
:::

## 10. File storage, and what POSIX costs

A file system is one abstraction layer on top of blocks. It spends blocks on
bookkeeping (inodes, directory entries, free space maps) and in exchange gives
you the richest interface in computing:

```text
  open()  read()  write()  seek()  truncate()  close()
  rename()  link()  unlink()  mkdir()  chmod()  flock()
```

That set is roughly what people mean by %%POSIX semantics%%: the standard that
defines what an operating system offers, including the file system calls every
program assumes. Some of its guarantees are much stronger than they look.

#### Rename is atomic

`rename()` either happens completely or not at all. There is no observable
in-between state. An enormous amount of software depends on this, and the
save-file dance in your editor is the everyday example:

```text
  you type          ──▶  edits held in memory / a temp file
  you press save    ──▶  write complete new contents to  file.ts.tmp
                    ──▶  fsync
                    ──▶  rename("file.ts.tmp", "file.ts")   ← atomic
```

Any other process reading `file.ts` at any instant sees either the whole old
version or the whole new version, never half a file. That guarantee is the
reason the dance exists.

#### Writes are consistently visible, and locks exist

Two processes appending to the same log file need `flock` or `O_APPEND`
semantics so their lines do not interleave into garbage. Partial writes must not
be visible. Readers and writers must agree on what the file currently is.

#### And that is the problem

Every one of those guarantees is a ==coordination requirement==. Atomicity,
ordering, locking and consistent visibility are cheap inside one kernel, which
owns all the state. They get expensive across a network, and they get
prohibitive across data centres and continents.

Network file systems (NFS, SMB, AWS EFS, Azure Files) implement them anyway, and
their trade-offs are exactly where the coordination shows up:

| Property  | Network file storage                                                  |
| --------- | --------------------------------------------------------------------- |
| Interface | POSIX, or most of it                                                  |
| Shared by | Many machines, ==unlike block==                                       |
| Latency   | Sub-millisecond to milliseconds, plus metadata round trips            |
| Weak spot | Small-file and metadata-heavy workloads, locking, throughput ceilings |
| Use when  | Software you cannot change requires `open()` and `seek()`             |

:::trap "EFS is basically S3 with folders"
They are not comparable. EFS is a POSIX file system: it maintains a directory
tree, supports in-place writes and locks, and prices and scales accordingly.
S3 maintains a flat key index with no locking and no in-place writes. Choosing
EFS for user uploads usually means paying several times per GB for semantics
your web app never uses.
:::

## 11. Object storage: the minimum interface

Object storage starts from the opposite question. Not "how rich can the
interface be", but:

> What is the ==absolute minimum interface== we can get away with, so that the
> system can scale without bound?

The answer is four operations.

```text
  PUT     bucket + key + bytes   ──▶  store, replacing anything at that key
  GET     bucket + key           ──▶  the bytes
  DELETE  bucket + key           ──▶  gone
  LIST    bucket + prefix        ──▶  keys under that prefix
```

That is essentially the whole API. Everything else in an SDK with 200 methods is
either a variant of these four, an administrative operation, or metadata.

#### What you give up

| You cannot                                  | Because                                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Modify an object in place                   | Objects are %%immutable%%; you replace the whole thing                                      |
| `seek()` and overwrite bytes 4,000 to 4,004 | No partial write. Download, edit, re-upload the whole object                                |
| Have real folders                           | Keys are flat strings; hierarchy is an illusion (section 14)                                |
| Rename                                      | Copy to the new key, delete the old. Costs the ==full size== of the object                  |
| Lock a file                                 | There is no lock. There is now a conditional write (section 22)                             |
| Expect microseconds                         | Every operation is an ==HTTP request over a network==: milliseconds to tens of milliseconds |

#### What you get

- ==Nothing to coordinate.== No in-place mutation means no distributed locking
  protocol, no write ordering to agree on, and an entire category of distributed
  systems problems simply does not arise.
- ==No tree.== No directory structure to maintain, lock, split or rebalance. A
  flat key space partitions trivially.
- ==Any node can serve any request.== Each operation is a self-contained,
  authenticated HTTP request, so a fleet of stateless front-end nodes scales
  horizontally without limit.
- ==No capacity planning.== Nothing to provision, nothing to resize.
- ==Durability as a product.== 11 nines from the provider, section 19.
- ==Directly addressable over HTTP.== Browsers, mobile apps, video players, curl,
  a CDN: anything that speaks HTTP can talk to an object without going through
  your server at all. This is what makes presigned URLs possible, and it is the
  single most important consequence of the whole design.

:::signal
"The four-verb interface is not a limitation they have not gotten around to
fixing. It is ==the mechanism==. Every operation being independent and
self-contained is precisely what lets ten thousand stateless nodes serve one
namespace."
:::

## 12. The trade you are actually making

Step back from storage for a moment, because the interviewer's next question is
often a level up.

```text
             richer interface                infinite scale
             ◀───────────────────────────────────────────▶

  block      file system      NFS/EFS          object storage
  fastest    POSIX            POSIX over       4 verbs
  1 machine  1 machine        the network      any machine, any client
                                               immutable
```

The same trade recurs everywhere in distributed systems:

| Domain     | Mutable version                     | Immutable version that scales           |
| ---------- | ----------------------------------- | --------------------------------------- |
| Storage    | File system                         | Object storage                          |
| Servers    | Stateful server, sessions in memory | Stateless servers, state externalised   |
| Deployment | SSH in and patch the box            | Immutable images, replace the container |
| Caching    | Update the cached entry             | New key, or invalidate and re-fetch     |
| Data       | UPDATE the row                      | Append-only log, event sourcing         |

Each row is the same bargain: ==give up in-place mutation, receive unbounded
horizontal scale==, because mutation is what forces coordination and
coordination is what does not scale.

:::key
Object storage is the purest, most widely deployed instance of the central trade
in distributed systems: %%mutability for scale%%. If you can state it that way,
you have understood the topic rather than memorised an API.
:::

:::ask So when would you not use object storage?
When you need what it gave up. Small mutable state with transactions belongs in
a database. Microsecond latency and in-place writes belong on block storage,
which is why databases sit there. Legacy software that requires POSIX belongs on
a network file system. And very small blobs, a few KB, that must appear and
disappear atomically with a row can reasonably live in the database itself:
the per-object request overhead can exceed the benefit at that size.
:::

:::recall Block, file, object: name the interface, the latency and the sharing model of each. | 6
:::

:::part III | Anatomy of an object

What an object actually is, why the folders in the console are a lie, and the
one decision this topic really asks a backend engineer to make: the key.
:::

## 13. Key, value, metadata, bucket

An object has four parts.

```text
  ┌──────────────────────────────────────────────────────────┐
  │ KEY        "u/8f21/a3c9d1e0.jpg"                          │
  │            a string. the complete and entire identity.    │
  ├──────────────────────────────────────────────────────────┤
  │ VALUE      <binary blob>                                  │
  │            an array of bytes. opaque to the store.        │
  ├──────────────────────────────────────────────────────────┤
  │ SYSTEM     Content-Length, Content-Type, Last-Modified,   │
  │ METADATA   ETag, storage class                            │
  ├──────────────────────────────────────────────────────────┤
  │ USER       x-amz-meta-uploaded-by: 42                     │
  │ METADATA   x-amz-meta-original-name: my trip.mov          │
  │            arbitrary key/value pairs you attach           │
  └──────────────────────────────────────────────────────────┘

  all of it lives in a BUCKET: a named container.
  bucket + key must be globally unique.
```

Two details worth holding on to.

**The key is the identity.** Not a name, not a path, not a pointer: the string
is the object's identity, which is why section 15 is about designing it.

**User metadata is fixed at write time.** Because objects are immutable, you
cannot change a metadata value without rewriting the object. Use it for facts
that will never change (who uploaded it, the original filename), and keep
anything mutable (status, visibility, tags your app filters on) in the database,
where you can update and index it.

:::ask What is an ETag, exactly?
An opaque entity tag the store returns for the current contents of an object.
For a single-part PUT it is usually the MD5 of the body, which makes it a handy
integrity check; for a multipart upload it is a hash of the part hashes with a
`-N` suffix, so it is ==not== the MD5 of the whole object and you should never
present it as a content checksum. Its real job is conditional requests:
`If-None-Match` for caching (section 42) and for the conditional writes in
section 22. If you need a real content hash, ask for one explicitly with the
checksum headers.
:::

:::ask Why does a bucket name have to be globally unique?
Because objects are addressable over HTTP by hostname:
`https://my-bucket.s3.amazonaws.com/key`. The bucket name is part of the DNS
name, so it shares a global namespace across every account on the platform.
That also means bucket names are ==public information==: never encode a customer
name or anything sensitive into one.
:::

## 14. There are no folders

Open the S3 console. You see `uploads/`, you double-click, you see `2026/`,
inside there is `cat.png`. That hierarchy does not exist.

What exists is one object whose key is the string:

```text
  uploads/2026/cat.png
  ^^^^^^^^^^^^^^^^^^^^  one key. one object.

  the "/" characters are ordinary characters in a string.
  they carry no structural meaning to the store.
  you could use "-" or "@" or "#" and nothing about the
  storage system would behave differently.
```

There is no parent object, no directory entry, no nesting. A bucket is a flat
namespace holding millions or trillions of string keys.

#### Where the illusion comes from

The console calls LIST with a `prefix` and a `delimiter`, and the response
contains a field the whole illusion is built on:

```bash
aws s3api put-object --bucket demo --key uploads/2026/cat.png --body cat.png

# raw listing: exactly one key exists
aws s3api list-objects-v2 --bucket demo --query 'Contents[].Key'
# [ "uploads/2026/cat.png" ]

# ask with a prefix and a delimiter, and a "folder" appears
aws s3api list-objects-v2 --bucket demo --prefix uploads/ --delimiter /
# CommonPrefixes: [ { "Prefix": "uploads/2026/" } ]
# Contents:       []
```

The algorithm is three lines of description:

```text
  for every key starting with <prefix>:
      look at the remainder after the prefix
      if the remainder contains <delimiter>:
          chop it there and report the head once, as a common prefix
      else:
          report the key itself, as an object
```

==Folders are a GROUP BY on a string.== That is the entire feature.

#### Three consequences that show up in production

- **Moving a "folder" is slow and costs money.** There is no folder to move.
  40,000 objects have to be copied to new keys and the old ones deleted, and you
  pay per request and for the copied bytes.
- **An empty folder cannot exist.** A prefix only appears because a key contains
  it. The console fakes empty folders by writing a zero-byte object whose key
  ends in `/`, which fools the group-by. It is an object, not a directory.
- **Deleting a "folder" is a paginated LIST followed by batched deletes.** It is
  not one operation, it is not atomic, and it can fail halfway.

:::trap "I will organise uploads by folder and move files between folders as their status changes"
Every move is a full copy plus a delete, billed by size and by request, and it
is not atomic. Status belongs in a !!database column!!, not in the key. Keep the
key immutable for the life of the object.
:::

:::signal
"Prefixes are not a hierarchy; they are a sorted-string range. That is also why
LIST is a range scan and why the index partitions by key prefix, which is what
makes key design a performance decision."
:::

## 15. Designing the key

This is the one place where object storage genuinely demands a design decision
from you, and it is a favourite interview probe because the wrong answer is a
security bug.

#### Rule 1: never use the filename the user gave you

Non-negotiable. Three separate reasons, and you should be able to give all
three:

**Collisions, and silent destruction.** Two users upload `resume.pdf`. The
second write silently destroys the first. It is called PUT for a reason: in
HTTP, PUT replaces the entity at a URI. It succeeds, returns 200, and warns you
about nothing. (POST, by contrast, promises creation, which is why the API does
not use it for this.)

**Path traversal.** A filename can contain `..`, absolute-looking paths, encoded
separators. Depending on what you do downstream, the key can escape the prefix
you thought you were writing under, which is exactly the boundary your
authorisation depends on.

**Hostile bytes.** Filenames can carry emoji, right-to-left override characters,
null bytes, newlines, control characters, 4,000-character names. Each of those
has been a real bug in a real system, in logging, in signing, in a downstream
parser.

```text
  BAD   uploads/resume.pdf
  BAD   uploads/../../etc/passwd
  BAD   uploads/2026/my‮gnp.exe.pdf        ← RTL override, displays reversed

  GOOD  u/42/9f3a1c8e-4b21-4d0f-9a77-2c1e5b8d6f04.pdf
        original filename stored in your database
```

:::do Generate the key server-side, always

- The client never chooses the key. Your server picks it and signs for exactly
  that one key.
- Use a random identifier: UUIDv4, ULID, or a hash prefix.
- Keep the extension only if you derive it from a ++validated++ content type,
  never by trusting the string after the last dot.
- Store the original filename in your database, and optionally in user
  metadata. Serve it back at download time with
  `Content-Disposition: attachment; filename="..."`.
  :::

#### Rule 2: put the entropy at the front, not the back

The metadata index is a sorted structure partitioned by key range, so ==keys
that share a leading prefix land on the same partition==.

```text
  BAD   uploads/2026-08-29T14/  a1.jpg
        uploads/2026-08-29T14/  a2.jpg      every write for a whole hour
        uploads/2026-08-29T14/  a3.jpg      hits one index partition
                └── identical for 60 minutes ──▶ hot partition, 503 SlowDown

  GOOD  u/9f3a1c8e/2026-08-29/photo.jpg
        u/2b7d40aa/2026-08-29/photo.jpg     writes spread across partitions
        u/c81e0f45/2026-08-29/photo.jpg
        └── high entropy first
```

The symptom of getting this wrong at scale is `503 SlowDown`. S3's automatic
partition splitting has improved enormously and you will probably never see it
at small scale, but putting the random part first ==costs nothing on day one==
and is close to impossible to retrofit later, because fixing it means rewriting
every key.

#### Rule 3: make the key carry ownership

```text
  <tenant_id>/<user_id>/<object_id>
```

Two things fall out of this, both valuable:

- **Authorisation becomes a string comparison.** Middleware can reject a request
  by comparing the caller's tenant to the key's first segment, before touching
  the database or the object store. One network hop saved on every request.
- **IAM policies can scope to a prefix.** You can issue credentials, or a
  policy, that permit access to `acme/*` and nothing else, so a compromised
  component is contained by the storage system itself rather than by your code
  being correct.

:::trap "Random UUIDs everywhere are the most secure key design"
A flat namespace of opaque IDs means !!every single authorisation check must hit
your database!!, and no storage-level policy can express "this credential may
only touch this tenant". Structure the prefix, randomise the leaf.
:::

:::recall Write a key for user 42 of tenant `acme` uploading `holiday.jpg`. Justify each segment. | 5
:::

## 16. Why LIST is not a lookup

The four verbs are not four equal verbs. Three of them are point operations on
an index. One of them is a range scan.

```text
  GET / PUT / DELETE   ──▶  index lookup by exact key    ──▶  O(1)-ish, ms
  LIST prefix          ──▶  range scan over a sorted,
                            distributed index, paginated
                            at 1,000 keys per call       ──▶  O(n), slow
```

A bucket with 10 million objects under one prefix needs 10,000 paginated calls
to enumerate, each a network round trip, and you pay per request.

:::key
==Never put LIST in a request path.== Your database is the index of what objects
exist. The bucket stores bytes and answers questions about ==one key at a time==.
:::

Concretely, the query "show me this user's uploads" is a SELECT against your
`files` table, ordered and paginated with an index, and then presigned GET URLs
minted for the rows on that page. It is never `list_objects_v2(prefix="u/42/")`.

Legitimate uses of LIST are administrative and asynchronous: a reconciliation
sweeper, a migration, a backfill, an ops investigation. All of them are batch
jobs, none of them are on a user's critical path.

:::ask Why is there no atomic rename, if the bytes do not have to move?
Because the key determines the partition. Changing the key means removing an
entry from one partition of a globally distributed sorted index and inserting it
into another, atomically, while both partitions serve traffic. That is a
distributed transaction, which is the exact thing this design refuses to have.
The same structure explains a nicer property: the index holds size, ETag and
content type, so `HEAD` answers instantly ==without touching a single drive==.
:::

:::part IV | Inside the system

What actually happens when a PUT arrives. The split into two planes, the
arithmetic behind eleven nines, the index that makes the whole thing possible,
and the one primitive added in 2024 that changed what you can build on top.
:::

## 17. What happens when you PUT

You send a 100 MB object. Follow it.

```text
  1.  request lands on one of thousands of STATELESS FRONT-END NODES
      (any node can serve any request, because every request is
       self-contained: that is the design from section 11)

  2.  the node AUTHENTICATES by recomputing the signature over the
      canonical request and comparing (section 26)

  3.  the problem SPLITS IN TWO
            │
      ┌─────┴──────────────────────────────┐
      ▼                                    ▼
  DATA PLANE                          METADATA PLANE
  "keep these 100 MB alive"           "remember that bucket+key
                                       maps to those shards"

  huge volume of bytes                small volume of data
  simple operations                   enormous operation count
  eventual internal repair            STRONGLY CONSISTENT
  optimise for $/TB                   optimise for latency

  4.  bytes are erasure coded and scattered (section 18)
  5.  the index entry is committed (section 20)
  6.  200 OK with an ETag
```

That split is the core architectural idea of every object store, and it is worth
saying out loud in an interview, because it explains almost every behaviour that
follows.

:::signal
"Separating the metadata plane from the data plane lets each side be optimised
for a completely different workload. Storing exabytes on drives has been a
solved problem for decades. ==Maintaining a strongly consistent, globally
distributed sorted index over trillions of keys with millisecond lookups is the
genuinely hard part==, and it is where the engineering went."
:::

## 18. The data plane: replication and erasure coding

#### The naive answer: three copies

```text
  object ──▶ copy A  (rack 1, power domain 1)
             copy B  (rack 7, power domain 2)
             copy C  (rack 12, power domain 3)

  survives 2 simultaneous failures.   storage overhead: 200%
```

Simple, and it works. The problem is cost: to hold 1 PB of customer data you buy
3 PB of drives. At provider scale that is billions of dollars of pure overhead.

#### The real answer: erasure coding

Split the object into 14 data shards, run a Reed-Solomon transform to compute 6
parity shards, and scatter all 20 across 20 drives in different racks, different
power domains, ideally different buildings.

```text
        object
          │
          ▼  split
  ┌──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┬──┐
  │d1│d2│d3│d4│d5│d6│d7│d8│d9│..│..│..│..│14│   14 data shards
  └──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┴──┘
          │  Reed-Solomon
          ▼
  ┌──┬──┬──┬──┬──┬──┐
  │p1│p2│p3│p4│p5│p6│                            6 parity shards
  └──┴──┴──┴──┴──┴──┘

  20 shards, scattered across 20 failure domains.

  ANY 14 of the 20 reconstruct the object exactly.
  It does not matter which 14.
```

Run the numbers, because the comparison is the point:

|                                 | 3x replication  | 14+6 erasure coding                    |
| ------------------------------- | --------------- | -------------------------------------- |
| Storage for 1 PB                | 3 PB            | ==1.43 PB==                            |
| Overhead                        | 200%            | 43%                                    |
| Simultaneous failures tolerated | 2               | ==6==                                  |
| Cost of a read                  | Read one copy   | Read 14 shards, reassemble             |
| Cost of a repair                | Copy one object | Read 14 shards, recompute the lost one |
| Paid in                         | Drives          | ==CPU and internal network==           |

Cheaper **and** more failure-tolerant. What you pay is CPU for the coding maths
and extra reads during recovery, and at provider scale drives cost far more than
cycles. It is a very good trade, which is why everyone makes it.

:::ask Why not use erasure coding for everything, including small objects?
Because the overhead is per object, not per byte. Splitting a 2 KB object into
20 shards means 20 tiny IOs and 20 index entries to hold a fraction of a block,
and the fixed per-shard cost dominates. Real systems batch small objects into
larger internal containers first, then erasure code the container. This is also
why very small objects have a minimum billable size, often 128 KB.
:::

## 19. Eleven nines, read carefully

S3 advertises 99.999999999% durability. Eleven nines.

```text
  store 10,000,000 objects
  ──▶ statistically expect to lose one of them
      about once every 10,000 years
```

The number falls out of the shard arithmetic in section 18: the probability that
enough shards in enough independent failure domains die inside the repair window
to make reconstruction impossible.

Now the part that matters more than the number.

:::trap "Eleven nines means my data is backed up"
!!Durability is not backup.!! The guarantee is about !!hardware!!. It says the
system will not lose your bytes to failing drives. It says nothing about
protecting you from !!your own actions!!.
:::

Read that as three concrete scenarios:

```text
  you delete the wrong prefix
       ──▶ the system deletes it durably, reliably, and completely.
           with eleven nines of confidence, it is gone.

  your code has a bug and overwrites 40,000 objects with empty files
       ──▶ the system stores the corrupted version durably, forever.

  your credentials leak and an attacker issues DeleteObject
       ──▶ same. it is a valid, authenticated, authorised request.
```

There is no "please give it back" endpoint. Durability guarantees the storage
system will not lose data. It does not guarantee ==you== will not.

:::do What you actually turn on, in order of value

- **Versioning.** An overwrite or delete creates a new version instead of
  destroying the old one; a delete writes a delete marker. This is the single
  highest-value setting on a bucket holding data you care about. Pair it with a
  lifecycle rule that expires non-current versions after N days so it does not
  become a cost problem.
- **MFA delete** or a bucket policy that denies `DeleteObjectVersion` outside a
  break-glass role.
- **Cross-account replication** to a second bucket in a ++different account++.
  Different account matters: if the credentials for account A are compromised,
  you do not want the attacker holding account B as well.
- **Object Lock / WORM** for compliance data that must not be deletable at all
  for a retention period, even by an administrator.
  :::

:::signal
"Eleven nines protects against drives dying. It does not protect against me. My
backup strategy for a bucket is versioning plus replication into a separate
account, because ==the failure mode I am actually planning for is a bad deploy
or a compromised key, not a disk==."
:::

## 20. The metadata plane

Conceptually, one enormous sorted key-value index.

```text
  a distributed B-tree (balanced tree), partitioned by KEY RANGE

  ┌───────────────────────┬───────────────────────┬─────────────────┐
  │ partition 1           │ partition 2           │ partition 3     │
  │ keys  "a…" → "f…"     │ keys  "f…" → "p…"     │ "p…" → "z…"     │
  └───────────────────────┴───────────────────────┴─────────────────┘

  entry:  (bucket, key) ──▶ { shard locations, size, ETag,
                              content-type, version, storage class }
```

Everything in this book that seemed arbitrary is a property of this structure:

| Behaviour                                        | Because the index is…                                     |
| ------------------------------------------------ | --------------------------------------------------------- |
| Hot partitions from sequential keys (section 15) | partitioned by %%key range%%                              |
| LIST is slow and paginated (section 16)          | a ==range scan==, not a lookup                            |
| No atomic rename (section 16)                    | a key change ==moves partitions==                         |
| `HEAD` is instant and touches no drive           | size and ETag ==live in the index==                       |
| Folders are a group-by (section 14)              | a ==sorted== structure, so prefixes are contiguous ranges |

And it must be ==strongly consistent==, which is the genuinely hard requirement:
trillions of keys, globally distributed, millisecond lookups, and a write must
be visible to the next read.

## 21. Consistency: eventual, then strong

Worth knowing as history, because half the advice on the internet predates the
change and interviewers over a certain age remember it vividly.

|                             | Eventually consistent                                   | Strongly consistent                         |
| --------------------------- | ------------------------------------------------------- | ------------------------------------------- |
| Write then immediately read | May 404 or return a stale version                       | ==Always returns the new object==           |
| Why                         | The read hit an index replica that had not caught up    | The read observes the committed index entry |
| Code you had to write       | Retry loops, `sleep(2)`, "eventual consistency helpers" | None                                        |

```text
  before Dec 2020                      since Dec 2020

  PUT  key  ──▶ 200                    PUT  key  ──▶ 200
  GET  key  ──▶ 404  ← real, common    GET  key  ──▶ 200, the new bytes
  sleep, retry, hope
```

Since December 2020, S3 provides %%strong read-after-write consistency%% for all
operations, at no cost and with no opt-in. If you find a Stack Overflow answer
recommending a retry loop after upload, it is correct for 2016 and obsolete now.

:::ask Is everything strongly consistent, then?
The object data path is: PUT, GET, HEAD, DELETE and LIST are strongly consistent
in S3 today. Some ==bucket-level configuration== remains eventually consistent
(policies, replication rules, and similar propagate). And cross-region
replication is asynchronous by definition, so a replica bucket is a different
question entirely. The precise sentence is "strong read-after-write for objects
in a bucket; configuration and cross-region replication are eventual".
:::

:::key
Countless production systems now depend on this one property. Strong consistency
is what made the next section possible, and the next section is what made
databases start treating object storage as a coordination primitive.
:::

## 22. Conditional writes, the primitive that changed things

For nearly twenty years a PUT always overwrote. Two processes writing the same
key: one silently wins, the other silently loses, and ==there was no way to
detect which==. Not a way to prevent it, a way to even find out.

In 2024, S3 added conditional writes, and this is the most interesting thing in
the lecture.

#### `If-None-Match: *`, create only if absent

```bash
aws s3api put-object --bucket demo --key locks/leader \
    --if-none-match '*' --body node-a.json
# first call:   200 OK, returns an ETag
# second call:  412 Precondition Failed
```

That 412 is a very big deal. It is a ==compare-and-set on a distributed
namespace==: exactly one caller can win, and every loser is told it lost.

#### `If-Match: <etag>`, replace only if unchanged

```text
  client A                  S3                   client B
  ─────────────────────────────────────────────────────────
  GET key      ──────────▶
               ◀────────── bytes, ETag "v1"
  edit locally
                                        ◀─── B PUTs, ETag becomes "v2"
  PUT key
   If-Match: "v1"  ──────▶
               ◀────────── 412 Precondition Failed
                           A's write is refused; B's data survives
```

Without `If-Match`, A's write would silently destroy B's. This is optimistic
concurrency control, the same pattern as a `version` column in a relational
table, now available on an object store.

#### Why this matters beyond your upload endpoint

Conditional write plus strong consistency gives you the two properties a
write-ahead log needs: ==exactly one writer wins==, and ==everyone sees the
result immediately==. That is why there has been a wave of systems built
directly on S3 with no separate coordination service: leader election,
distributed locks, and databases putting their WAL in a bucket. It turns object
storage from a place to park files into a coordination primitive.

For your application the immediate value is smaller and still worth having:
`If-None-Match: *` guarantees an upload can ==never silently destroy an existing
object==, which closes the duplicate-key failure from section 15 at the storage
layer rather than trusting your key generator.

:::trap "S3-compatible means it behaves like S3"
"S3 compatible" means it speaks the same protocol so the AWS SDK works against
it. It does !!not!! promise feature parity. Cloudflare R2 supports conditional
writes; Backblaze B2, also S3-compatible, does not. If your design depends on
`If-None-Match`, check the provider's documentation before you depend on it,
because the failure mode is a silent overwrite in production rather than an
error at compile time.
:::

:::recall Two clients edit the same object. Write the exact header sequence that stops one from destroying the other. | 6
:::

:::part V | Getting the bytes in

Two architectures, one of which is fine for small files and one of which is the
production answer. Then the hole in the production answer, the policy that
closes it, and the flow that keeps your database and your bucket in agreement.
:::

## 23. Architecture A: through your server

The obvious one. The browser posts to your API, your API forwards to the bucket.

```text
  browser ──── 100 MB ────▶ your server ──── 100 MB ────▶ bucket
                             sees every byte
```

It has real advantages, and dismissing it outright is a worse answer than
knowing when it applies:

| You can                                       | Because you hold the bytes                       |
| --------------------------------------------- | ------------------------------------------------ |
| Validate content for real                     | Sniff magic bytes, not the declared content type |
| Scan for malware inline                       | Before anything is stored                        |
| Compute a hash, transcode, resize, strip EXIF | You have the data anyway                         |
| Reject for any business reason                | Quota, plan limits, moderation                   |
| Use your ordinary auth middleware             | Same session, same token, no CORS config         |

For profile pictures, CSVs, documents under a few megabytes, this is a
defensible choice and plenty of production systems use it. It is not
categorically wrong.

The problem is what the convenient implementation does.

## 24. Buffering versus streaming

```text
  BUFFERED                              STREAMING

  read the entire body into RAM         read a chunk ──▶ write a chunk
  then hand it to the handler           reuse the buffer, repeat

  memory = file size                    memory = one buffer, ~32 KB
  20 concurrent × 100 MB = 2 GB         20 concurrent × 100 MB = ~640 KB
  ──▶ OOMKilled                         ──▶ fine
```

The default helper in every framework buffers: `ParseMultipartForm`, the
default body parser, the convenient decorator. You have to opt in to streaming.

```go
// buffered: the entire file lands in memory before you see it
r.ParseMultipartForm(32 << 20)
file, hdr, _ := r.FormFile("file")

// streaming: hand the reader straight to the uploader
mr, _ := r.MultipartReader()
for {
    part, err := mr.NextPart()
    if err == io.EOF { break }
    if part.FormName() != "file" { continue }
    _, err = uploader.Upload(ctx, &s3.PutObjectInput{
        Bucket: aws.String(bucket),
        Key:    aws.String(key),
        Body:   part,            // a reader, not a []byte
    })
}
```

Measured, uploading the same 500 MB file twice:

```text
  buffered                              streaming
  ────────────────────────────          ────────────────────────────
  RSS  ▁▂▃▄▅▆▇█  +500 MB                RSS  ▁▁▁▁▁▁▁▁  flat
  time 6.5 s                            time 6.5 s
```

Same wall-clock time. The only difference is whether the bytes accumulate.

:::do Two things, in every language, on every upload endpoint

- Hand the storage SDK a ++reader++, never a byte array. In Go, the multipart
  `Part`; in Node, `req.pipe(...)` or `Upload({ Body: stream })`; in Python,
  `upload_fileobj`, not `upload_file` after a read.
- Wrap the body in a ++hard size limit before you read a single byte++:
  `http.MaxBytesReader` in Go, `limits` in your framework, `client_max_body_size`
  in nginx. A client sending 4 GB should be cut off at your limit, not allowed
  to try.
  :::

:::trap "It works on my machine, so the upload path is fine"
This class of bug is invisible in development by construction: you test with a
small file, on a 1 Gbps link, on a laptop with 32 GB of RAM. Production is a
2 Mbps mobile connection, a 512 MB container, and twenty concurrent users. Load
test the upload path with a large file over a throttled link, or you will find
out from an OOMKilled event.
:::

## 25. The limits streaming does not remove

Streaming fixes memory. Everything else in the data path is still in the data
path.

```text
  browser ──▶ CDN/LB ──▶ reverse proxy ──▶ your app ──▶ bucket
               │            │                  │
               │            │                  └── worker pinned for
               │            │                      the whole transfer
               │            └── nginx client_max_body_size
               │                default 1 MB ──▶ 413 Entity Too Large
               └── idle timeout, commonly 60 s
                   ──▶ 504 on a slow mobile upload
```

| Limit                            | Typical default          | Symptom                             |
| -------------------------------- | ------------------------ | ----------------------------------- |
| Load balancer idle timeout       | 60 s (ALB)               | Upload dies mid-transfer, 504       |
| nginx `client_max_body_size`     | 1 MB                     | ==413 Request Entity Too Large==    |
| API Gateway payload cap          | 10 MB, ==not raisable==  | 413, and no configuration will help |
| Lambda / serverless request size | 6 MB sync                | Hard wall                           |
| Worker or connection slots       | 100s                     | Slow uploaders exhaust the pool     |
| Egress and instance bandwidth    | Instance-class dependent | Everything gets slower at once      |

That API Gateway row is the one that ends the argument. Some of these you can
tune. That one you cannot, at any price.

:::key
Streaming makes proxying ==survivable==, not ==correct==. Your application tier
is still spending its bandwidth, its connection slots and its wall-clock time
moving bytes it has no opinion about. The fix is not a bigger timeout. The fix
is not being in the path.
:::

## 26. Architecture B: presigned URLs

Let the browser talk to the bucket directly.

Two constraints make that non-trivial:

- The bucket is private, and must be. A public writable bucket is one of the
  most reliably catastrophic misconfigurations in cloud computing.
- You obviously cannot ship your storage credentials to a browser.

So the problem is precise: give an untrusted client the ability to perform
==exactly one operation, on exactly one key, for exactly the next five
minutes==, without handing over a credential.

That is what a presigned URL is. It is a %%capability%%.

#### What is actually in the URL

```text
  https://bucket.s3.amazonaws.com/u/42/9f3a1c8e.jpg
    ?X-Amz-Algorithm=AWS4-HMAC-SHA256
    &X-Amz-Credential=AKIA…/20260829/eu-west-1/s3/aws4_request
    &X-Amz-Date=20260829T101500Z
    &X-Amz-Expires=300
    &X-Amz-SignedHeaders=host
    &X-Amz-Signature=3f9c1a…            ← HMAC over the canonical request
```

The signature is an HMAC, keyed with your secret, computed over a canonical
string describing the request: the ==method==, the ==bucket==, the ==key==, the
==expiry==, and the ==signed headers==.

```text
  browser sends PUT to that URL
        │
        ▼
  S3 rebuilds the same canonical string from the request it received
  S3 computes the HMAC with its own copy of your secret
        │
        ├── matches, and not expired  ──▶ 200, object stored
        └── anything differs           ──▶ 403 Forbidden

  change one character of the key   ──▶ 403
  change PUT to DELETE              ──▶ 403
  use it 61 seconds after a 60 s expiry ──▶ 403
```

Nothing about this validation involves your server. It never sees the request.

```text
  1. POST /uploads          browser ──▶ your server   (authorise, pick key, sign)
  2. { url, key }           your server ──▶ browser
  3. PUT <url>  + bytes     browser ──▶ bucket        (no credentials on the wire)
```

:::trap "Presigned URLs are insecure because anyone with the link can use it"
Anyone with the link can perform !!exactly the one operation you signed, on the
one key you named, until it expires!!. That is a capability, not a hole. The
real risks are scope that is too broad and expiry that is too long, and both of
those are your parameters. Sign narrowly, expire in minutes.
:::

:::do Signing hygiene

- Expiry in minutes for a single PUT; hours only for a long multipart session.
- Derive the key ++server-side++ from the authenticated session. Never sign a
  key the client supplied.
- Sign the specific method. An upload URL must not be usable for GET or DELETE.
- Prefer short-lived role credentials over a long-lived access key for the
  signer, so a leaked signature cannot outlive the role session.
- Presigned GET URLs are ++bearer tokens++. They leak through referrer headers,
  logs, screenshots and shared links, so keep them short-lived and never treat
  one as an access control decision by itself.
  :::

## 27. The hole in a presigned PUT

You signed a URL for a profile picture. What stops the client uploading 5 GB
to it?

==Nothing.==

```text
  signature covers:   method ✓   bucket ✓   key ✓   expiry ✓
  signature covers:   size ✗     content type ✗
```

A demonstration from the lecture, and it is worth running yourself: sign a URL
for an avatar, then PUT a 300 MB file to it. The bucket returns ==200==. The
object is stored. You are billed for it. Your server, which authorised "a
profile picture", never learns any of this happened.

The same hole applies to content type: you can sign for `image/jpeg` and receive
an executable, because a signed header is only checked if the client sends it,
and a client that omits it simply is not bound by it.

:::key
A presigned PUT authorises ==an operation on a key==. It does not constrain
==what you may put there==. For anything a browser uploads, that is not enough.
:::

## 28. Presigned POST policies

The fix is to sign a ==policy document== instead of a URL. The client gets a URL
plus a set of form fields, and the object store enforces the conditions itself.

```json
{
  "expiration": "2026-08-29T10:20:00Z",
  "conditions": [
    { "bucket": "acme-uploads" },
    ["starts-with", "$key", "acme/42/"],
    ["starts-with", "$Content-Type", "image/"],
    ["content-length-range", 1024, 5242880]
  ]
}
```

Three constraints, each closing a specific attack:

| Condition                   | Stops                                                            |
| --------------------------- | ---------------------------------------------------------------- |
| `content-length-range`      | The 5 GB upload from section 27. ==Enforced by the store==       |
| `starts-with $Content-Type` | An executable arriving where an image was authorised             |
| `starts-with $key`          | Writing outside the caller's prefix, into another tenant's space |

If the client violates any of them the object store rejects the request and
==nothing is stored==. Your server is not involved, is not billed, and does not
have to be correct for this to hold.

```text
  round 1: presigned PUT, no policy
    300 MB uploaded to an "avatar" URL   ──▶  200 OK, 314,572,800 bytes stored

  round 2: presigned POST, with the policy above
    same 300 MB file                     ──▶  400 EntityTooLarge, nothing stored
    a 415 KB image                       ──▶  204, stored
    same image, key of another user      ──▶  403, condition named in the body
```

#### The two client-side details that waste an afternoon

```js
const form = new FormData();
Object.entries(fields).forEach(([k, v]) => form.append(k, v));
form.append("Content-Type", file.type);
form.append("file", file); // ← the file field MUST be appended LAST

await fetch(url, { method: "POST", body: form });
// ← do NOT set the Content-Type header yourself.
//   the browser must set multipart/form-data with its own boundary.
```

The file field must come last because the store evaluates conditions in field
order as it parses the stream, and it must know the policy before it reaches the
bytes. And setting `Content-Type` manually on the fetch destroys the multipart
boundary the browser would have generated.

:::signal
"I use a presigned POST policy rather than a presigned PUT for anything a
browser uploads, because ==the size and type limits are then enforced by the
storage service rather than trusted from the client==. My server states the
constraint once, at signing time, and never has to see a byte to enforce it."
:::

:::ask The upload comes from another backend service, not a browser. Does this change?
The principle holds, the mechanism simplifies. Service to service you can grant
a scoped IAM role, or let the producer write into a bucket you read, and skip
signing entirely. If the producer is a third party you cannot change, you may
have to pull instead: your worker streams from their endpoint into the bucket
using ranged requests so it can resume. Notebook 01 section 6 covers the
service-to-service variant.
:::

## 29. The two-phase upload

The bytes now bypass your server entirely, which reintroduces the question that
started section 8: ==if you never see the upload, how does your database learn
about it?==

```text
  PHASE 1  ── intent ──────────────────────────────────────────────

  browser  POST /uploads { filename, size, type }
       │
       ▼
  server   authenticate and authorise
           GENERATE THE KEY  (server-side, section 15)
           INSERT INTO files (id, user_id, key, orig_name,
                              expected_type, expected_size, status)
                  VALUES (…, 'pending')          ← before any bytes move
           sign a POST policy for that exact key
       │
       ▼
  browser  { upload_id: 101, url, fields }


  PHASE 2  ── transfer ────────────────────────────────────────────

  browser  POST the file straight to the bucket, with the policy fields
           (your server is not involved and learns nothing)


  PHASE 3  ── confirm ─────────────────────────────────────────────

  browser  POST /uploads/101/complete       ← the upload_id, NOT the key
       │
       ▼
  server   look up row 101, confirm it belongs to the caller
           HEAD  bucket/<key>               ← metadata only, no bytes
                 exists?
                 Content-Length within the expected range?
                 Content-Type as expected?
       │
       ▼
           UPDATE files SET status='ready', size=…, etag=… WHERE id=101
```

Three details carry the design.

**The intent row is written before any bytes move.** The database knows the
object's identity before the object exists. There is never a moment where bytes
exist and you have no record of what they were meant to be.

**The client sends the upload id, not the key.** If the client could name the
key at completion time it could claim an object it does not own, and your
completion endpoint would be an authorisation bypass. The id is a handle into a
row you already wrote and already authorised.

**Verification is `HEAD`, not `GET`.**

```text
  GET   bucket/key  ──▶  4 GB across the network into your server, to
                         answer the question "does this exist?"
  HEAD  bucket/key  ──▶  Content-Length: 4294967296
                         Content-Type:   video/mp4
                         ETag:           "9f3a…-64"
                         one round trip. no bytes. answered from the
                         metadata index, without touching a drive.
```

`HEAD` is the right call because of section 20: size, type and ETag live in the
index, so the answer is free.

:::trap "Trust the client's completion call and mark it ready"
Then a client can call `complete` without uploading anything, and you have a row
claiming an object that does not exist, which fails later in a place with no
useful context. !!Always verify with HEAD!!, and check the size and type against
what you authorised, not just existence.
:::

## 30. Reconciliation: pending, expired, orphaned

Some percentage of uploads will never complete. The tab closed, the network
dropped, the phone went into a tunnel, the process was killed, the completion
call was lost after a successful upload. This is not an edge case, it is a
steady-state rate.

```text
  DB says              bucket says          what it is         what to do
  ───────────────────────────────────────────────────────────────────────
  pending, recent      absent               in flight          wait
  pending, > 24 h      absent               abandoned          mark expired
  pending, > 24 h      present              lost completion    HEAD, then
                                                               promote to ready
  ready                absent               CORRUPTION         alert, investigate
  (no row)             present              orphan             lifecycle delete
```

Two mechanisms cover the whole table, and you want both:

- **A bucket lifecycle rule** deleting anything under the `pending/` prefix
  after 24 hours. Free, runs without your code, catches orphans.
- **A background sweeper** that scans `pending` rows older than the window,
  `HEAD`s each key, and either promotes the row to `ready` or marks it
  `expired`. This one is worth writing carefully, because the "lost completion
  call" row above is a real user losing a real upload they successfully made.

:::key
The database is the source of truth for ==what exists==. The bucket is the
source of truth for ==the bytes==. Two systems with no transaction between them
will drift. A reconciliation job is not optional cleanup, it is ==the mechanism
that makes the design correct==.
:::

:::ask Could you use bucket event notifications instead of the client calling complete?
Yes, and it is stronger. S3 can publish `s3:ObjectCreated:*` to SQS, SNS, Lambda
or EventBridge, so completion is driven by the storage system rather than
trusted from a client that may never call back. The trade-offs to mention:
delivery is asynchronous and ==at least once==, so your handler must be
idempotent; ordering is not guaranteed; and you now have a second failure domain
in the path. The mature answer is ==both==: the client's call for the fast path
so the UI updates immediately, the event as the authoritative backstop, and the
sweeper for whatever both of them miss.
:::

## 31. CORS, the last mile

The browser is now posting to a different origin than your site, so it is a
cross-origin request and CORS applies to it.

```json
[
  {
    "AllowedOrigins": ["https://app.acme.com"],
    "AllowedMethods": ["PUT", "POST", "GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

`ExposeHeaders: ["ETag"]` is the line people miss. Without it the browser
receives the response but ==JavaScript cannot read the ETag==, and multipart
uploads (section 37) need the per-part ETags to complete the upload. The upload
appears to succeed and the completion step fails with an empty value.

:::do The diagnostic
If an upload works from curl or Postman and fails from the browser, it is CORS,
essentially always. curl does not enforce CORS; the browser does. Check the
bucket's CORS configuration before you debug anything else, and check the
preflight `OPTIONS` response in the network panel rather than the PUT.
:::

:::redraw The full two-phase upload: browser, server, bucket, database. Mark which arrow carries the file bytes. | Six numbered arrows, one HEAD, one status transition.
:::

:::part VI | Large files

Everything so far works to a few hundred megabytes. Past that a single PUT stops
working, for four separate reasons, and the answer is a protocol rather than a
bigger timeout.
:::

## 32. Why a single PUT stops working

Four reasons, and they are independent. Know all four, because an interviewer
who hears only "the 5 GB limit" will assume you read it in a table.

#### 1. A hard limit

```text
  single PUT  ────────────────────▶  5 GiB, and not one byte more
```

This is not your framework, your proxy or your timeout. The storage service
refuses it. If your product takes video, CAD files, database dumps or drone
footage, you are ==architecturally required== to do something else. There is no
configuration that raises it.

#### 2. All or nothing

```text
  4.8 GB of 5 GB transferred
        │
        │  the wifi blinks. the phone hands over from wifi to cellular.
        ▼
  connection drops  ──▶  the upload is cancelled
                    ──▶  the next attempt starts at byte 0
```

There is no resume button on a PUT. On a real consumer connection a multi-gigabyte
transfer takes twenty to thirty minutes, and a network that glitches once in
thirty minutes is not an unlucky network, it is a normal one.

#### 3. One TCP connection cannot saturate a link

This is the reason people find surprising, and it is the most interesting one.

```text
  throughput  ≈  window size / round-trip time

  and one lost packet collapses the congestion window,
  which then has to climb back up.

  your link:            200 Mbps
  your single stream:    30 Mbps        ← not a bug, this is TCP
```

The fix is at the network layer: more connections. Parallel streams each get
their own congestion window, so one stalling does not affect the others.

This is exactly what download managers have always done. They do not make your
connection faster. They open eight of them.

#### 4. User experience

A single PUT gives you a rough progress number, no pause, and no survival across
a tab close. All three are product requirements the moment files are large
enough for a user to walk away mid-upload.

:::key
Multipart upload is not an optimisation for large files. It is the ==only==
mechanism above 5 GiB, and above a few hundred megabytes it is the only one that
survives a real network.
:::

## 33. The multipart protocol

Three calls, plus one you must not forget.

```text
  1. CreateMultipartUpload(bucket, key, content-type)
         ──▶  uploadId

     nothing exists at the key yet. a GET returns 404.
     the uploadId names a STAGING AREA, in the git sense:
     work accumulates there, uncommitted, and can be thrown away.

  2. UploadPart(uploadId, partNumber, bytes)     × N
         ──▶  ETag per part

     each part is an INDEPENDENT HTTP request:
       - they may go in parallel
       - they may arrive in any order, part 7 before part 2
       - any one may be retried alone, without touching the others

  3. CompleteMultipartUpload(uploadId, [{partNumber, ETag}, …])
         ──▶  the object appears at the key, atomically

  4. AbortMultipartUpload(uploadId)
         ──▶  the staging area is discarded      ← section 36
```

The property worth stating out loud in an interview:

:::signal
"CompleteMultipartUpload takes the ==same time for a 50 GB object as for a 50 MB
one==, because the service is not concatenating anything. It writes an index
entry saying this key consists of these parts in this order. It is a metadata
plane operation, not a data plane one, which is exactly the split from section
17."
:::

Until step 3, the key does not exist. A GET returns 404, a LIST does not show
it, and the console shows nothing. That has a consequence, and it is section 36.

## 34. Choosing the part size

There is a hard cap of ==10,000 parts==, and this is where people get hurt.

```text
  fixed 5 MiB parts  ×  10,000  =  50 GB ceiling

  upload a 60 GB file with 5 MiB parts:
      parts 1 … 10,000     upload fine        ← 50 GB transferred
      part 10,001          ✗ rejected         ← and now you start over
```

Failing at part 10,001 is the worst possible failure: it happens at the end,
after everything expensive has already been paid for.

#### So compute it, do not hardcode it

```js
const FLOOR = 16 * 1024 * 1024; // 16 MiB
const partSize = Math.max(FLOOR, Math.ceil(fileSize / 10_000));
const partCount = Math.ceil(fileSize / partSize);
```

Take whichever is larger: your sensible floor, or the size that keeps you inside
10,000 parts. A 16 MiB floor carries you to 160 GB without the formula ever
binding; a 32 MiB floor to 320 GB.

#### Why not just use enormous parts

Because ==the part is your retry granularity==.

```text
  500 MiB parts   ──▶  one failure on a mobile connection costs 500 MiB
   16 MiB parts   ──▶  one failure costs 16 MiB

  16 to 64 MiB is the sweet spot: few enough parts to stay well
  inside the cap, small enough that a retry is cheap.
```

:::do The part size rule, in one line
`partSize = max(16 MiB, ceil(fileSize / 10000))`, and never a fixed constant.
Notebook 01 section 8 works the same trade through from the ingestion side.
:::

## 35. The ETag trap

A reasonable integrity check, which is wrong:

```text
  hash the file locally with MD5
  upload
  compare your hash to the ETag the service returned
  ✓ they match, so the upload was clean
```

That works for a single PUT, where the ETag ==is== the MD5 of the body. It
breaks silently the moment you switch to multipart.

```text
  single PUT     ETag = "9f3a1c8e4b214d0f9a772c1e5b8d6f04"
                        MD5 of the object

  multipart      ETag = "5e2f01c9a8b34d67e0f1a2b3c4d5e6f7-42"
                        MD5 of the concatenated part MD5s, then "-42"
                        for 42 parts.  NOT THE HASH OF YOUR FILE.
```

Your check now fails for every large file, and the natural reaction, "the upload
must be corrupting things", sends you debugging the wrong system.

:::do Get real end-to-end integrity, three options

- Use the SDK's checksum feature. Modern S3 SDKs compute CRC32C or SHA-256 per
  part and can give you a full-object checksum the service verifies for you.
- Or compute SHA-256 of the file client-side, send it as ==user metadata==, and
  verify it in a background job after upload. This gives you content-addressed
  deduplication for free: same hash, same object, skip the upload.
- Either way, treat the ETag as ==an opaque version token for conditional
  requests== (sections 22 and 42), never as a content hash.
  :::

## 36. Abandoned uploads: the invisible bill

Follow a failure through.

```text
  300 parts × 32 MiB  =  ~10 GB uploaded into the staging area
        │
        │  the user closes the tab
        ▼
  CompleteMultipartUpload   never called
  AbortMultipartUpload      never called
        │
        ▼
  10 GB sits there. billed every month. forever.
```

And you cannot see it. The object does not exist, so it appears in no bucket
listing and nowhere in the console.

```bash
# the console says: 1 object, 184 MB. that is the whole story, apparently.

aws s3api list-multipart-uploads --bucket demo
# three uploads, initiated days ago, ~460 MB of parts already pushed,
# invisible to list-objects and to the console, and billed.
```

:::do The one lifecycle rule to write before any feature code
Abort incomplete multipart uploads after ==7 days==, on every bucket, from day
one. It costs nothing, it permanently closes the leak, and 7 days is long enough
that no legitimate resume is ever cut off.
:::

:::trap "I would notice, because the bucket size would grow"
You would not. `ListObjectsV2` cannot see parts of an object that does not
exist, and neither can the console. The only thing that shows them is
`ListMultipartUploads`, which nobody runs unless they already suspect the
problem. This is one of the most common silent cloud bills there is.
:::

## 37. The full large-file architecture

Everything from Part V, plus multipart.

```text
  1. browser  POST /uploads/init { filename, size, type }
        │
        ▼
     server  authorise
             partSize = max(FLOOR, ceil(size / 10000))
             CreateMultipartUpload           ──▶ uploadId
             INSERT files (…, status='pending', upload_id)
             presign UploadPart for each part
        │
        ▼
  2. browser  { uploadId, partSize, urls[] }

  3. browser ──── N parallel PUTs, direct to the bucket ────▶ bucket
             concurrency 4 to 6.   each returns an ETag.

  4. browser  POST /uploads/complete { uploadId, parts:[{n, ETag}] }
        │
        ▼
     server  CompleteMultipartUpload(uploadId, parts)
             HEAD the key            ← size, type, existence   (section 29)
             UPDATE files SET status='ready'
             emit file.uploaded  ──▶ queue (transcode, scan, audit)
                                 ──▶ websocket, so the UI confirms
```

Four notes that only show up once you build it:

- **Do not presign 10,000 URLs up front.** The init response becomes megabytes
  of JSON. Presign in batches of ~100 and hand out the next batch as the browser
  works through them.
- **Concurrency 4 to 6.** Past that, parallel parts fight each other and other
  devices for the same bandwidth, and throughput stops improving.
- **The browser never holds the whole file.** `file.slice(start, end)` returns a
  ==lazy Blob==: the bytes are read only when the request needs them. Peak
  memory is `partSize × concurrency`, not file size. A 2 GB upload with 16 MiB
  parts at concurrency 5 holds about 80 MB.
- **CORS must expose `ETag`.** Without it JavaScript cannot read the per-part
  ETags, so step 4 sends empty values and completion fails. Section 31.

#### What the progress bar is actually made of

```text
  125 parts, 16 MiB each, concurrency 5

  ███████████████░░░░░▒▒▒▒▒░░░░░░░░░░░░░░░░░░░░░░░░░░
  ▲              ▲    ▲
  │              │    └── waiting
  │              └── in flight, 5 at a time
  └── done

  rate and ETA are computed by the CLIENT from completed parts,
  not reported by the server, which is why the bar advances
  smoothly instead of jumping.
```

## 38. Resuming

Resumability is not an extra feature. Once you have multipart it falls out of
`ListParts`.

```text
  page refresh, or the app reopens
        │
  browser  "do I have an upload in progress for this file?"
        ▼
   server  SELECT … WHERE status='pending' AND fingerprint = ?
           ListParts(uploadId)        ← which parts does the bucket already hold?
           presign ONLY the missing parts
        ▼
  browser  resumes at part 341 of 500, not at part 1
```

The bucket, not your database, is the authority on which parts exist. Your row
holds the `uploadId`; `ListParts` holds the truth.

:::ask How does the client know it is the same file after a reload?
It cannot rely on the filename. Fingerprint it: size plus last-modified plus a
hash of the first and last part is usually enough, and is cheap because slicing
is lazy. Store that fingerprint on the pending row. Getting this wrong means
resuming one file into another file's upload, which produces a corrupt object
that passes every existence check.
:::

:::recall Write the part-size formula, the part cap, and the concurrency, from memory. | 5
:::

:::part VII | Getting the bytes out

Downloads are where the traffic is and where the bill is: files are fetched far
more often than they are uploaded. Three delivery patterns, the caching mistake
that quietly costs the most money, and what a range request unlocks.
:::

## 39. Never relay a download

The rule from section 7, restated where it matters most.

```text
  BAD                                    GOOD

  bucket                                 bucket
    │ GetObject                            │
    ▼                                      ▼
  your server   ← a worker pinned         CDN edge   ← cached, near the user
    │             for the whole             │
    ▼             download, plus            ▼
  user            egress you pay for      user
```

Three costs, all of them avoidable:

- **A worker per download.** Section 7. A goroutine or event-loop slot spends
  minutes copying bytes at the user's speed.
- **Bandwidth you pay for.** Every provider bills egress. Relaying means paying
  for the same bytes leaving the bucket and then leaving your server.
- **It is slow.** Your service is in one region, or three. A CDN is in hundreds.

:::key
Bytes should leave the ==bucket or the CDN==, never your application. Uploads go
browser to bucket, downloads go CDN to browser. Your service authorises and
records; it does not carry payload in either direction.
:::

## 40. Three delivery patterns

| Pattern                         | Bucket                 | Use when                                   |
| ------------------------------- | ---------------------- | ------------------------------------------ |
| 1. CDN in front, bucket private | Private, CDN-only read | Public assets: images, CSS, product photos |
| 2. Presigned GET                | Private                | Private per-user content, moderate volume  |
| 3. CDN signed URLs or cookies   | Private, CDN-only read | Private content at volume, and video       |

#### Pattern 1: public content, private bucket

Do not make the bucket public. Put a CDN in front, let only the CDN read it, and
then:

```text
  key = <sha256 of the contents>.jpg      ← content-addressed
  Cache-Control: public, max-age=31536000, immutable
```

Because the key is derived from the bytes, ==the URL changes whenever the
content changes==. No invalidation, no purge, no stale reads, and rollback is a
row update. Cheapest and fastest option available.

#### Pattern 2: presigned GET

Exactly the mirror of section 26: the browser asks your server, your server
authorises and returns a URL valid for five to fifteen minutes, the browser
fetches from the bucket. Simple, and correct at moderate volume. It has one
serious problem, which is the next section.

## 41. Why a presigned GET destroys your cache

This is the most valuable thing in the download half of the lecture, and it is
not obvious.

```text
  every presigned URL carries a fresh timestamp and signature

  user A:  /cat.jpg?X-Amz-Date=…101500Z&X-Amz-Signature=3f9c1a…
  user B:  /cat.jpg?X-Amz-Date=…101812Z&X-Amz-Signature=b7e204…
  user A:  /cat.jpg?X-Amz-Date=…103344Z&X-Amz-Signature=c19fe8…
                    └──────── different URL every single time ────────┘

  to the CDN these are THREE DIFFERENT RESOURCES.

  cache hit rate:  0%
  you are paying full egress, and paying for a CDN that caches nothing.
```

You installed a CDN specifically to cut egress, and it is doing nothing at all.

:::do Two fixes, cheap and proper

- **Cheap: round the expiry.** Sign "valid until the top of the next hour"
  rather than "valid for 15 minutes from now". Every user requesting that object
  within the same hour gets the ==identical URL==, so the CDN can cache it. You
  trade precision on expiry for a cache hit rate, which is usually a good trade.
- **Proper: sign at the edge.** Use the CDN's own signed URLs or signed cookies.
  Authorisation happens at the edge, the CDN keeps full control of caching, and
  your backend is out of the read path entirely.
  :::

:::signal
"Signed cookies matter most for video. A single viewing session pulls hundreds
or thousands of segments, so per-object presigned URLs would mean my backend
signing thousands of URLs per viewer. ==One signed cookie authorises the whole
session at the edge.=="
:::

:::trap "We put a CDN in front of S3, so egress is handled"
Only if the CDN can cache. Presigned GET URLs, `Vary` headers set too broadly,
and per-user query strings each drive the hit rate toward zero while the bill
looks exactly the same as before. Measure ==cache hit ratio==, not whether a CDN
exists.
:::

## 42. Range requests

A client can ask for part of an object.

```text
  GET /video.mp4
  Range: bytes=1048576-3145727

  206 Partial Content
  Content-Range: bytes 1048576-3145727/734003200
  Accept-Ranges: bytes

  and if the range is nonsense:
  416 Range Not Satisfiable
```

Note what this is: ==an HTTP semantic, not an object storage invention==. Object
storage supports it because object storage is HTTP, which is the same property
from section 11 that makes presigned URLs and direct browser access possible.
One protocol decision keeps paying out.

Three things it unlocks:

```text
  SEEKING          drag the scrubber to 30:00
                   the player reads the file index, computes the byte
                   offset for that timestamp, and requests from there.
                   the first 30 minutes are never downloaded.

  RESUMING         connection died at byte 400,000,000
                   reconnect, Range: bytes=400000000-
                   no bytes are re-fetched.

  PARALLEL READ    open 6 connections, give each a different range.
                   this is what a download manager does, and it is
                   the same congestion-window argument as section 32.
```

And one trick worth having:

```bash
curl -r 0-7 "$URL" | xxd
# 00000000: 8950 4e47 0d0a 1a0a                      .PNG....
```

Eight bytes told you the file type. You can validate a magic number, read an
image header, or check a container format ==without downloading the object==.

:::ask Does a range request cost less than a full GET?
You pay one request either way, and egress only for the bytes returned. So a
range read of 8 bytes costs one GET plus 8 bytes of egress. That is why
header-sniffing and index reads are cheap, and why parallel ranged reads cost
the same in egress as one sequential read of the same object.
:::

## 43. Segmented streaming, and where object storage stops

Progressive download over ranges works well, up to one hard limit: ==there is
exactly one version of the file==. Every viewer gets the same bytes, whatever
their connection.

No streaming platform does that. They serve a different file to every viewer,
chosen continuously.

```text
  ORIGINAL  ──▶  transcode  ──▶  240p  480p  720p  1080p  4K
                                  │     │     │     │      │
                              chop each into ~4 second segments
                                  │     │     │     │      │
                                  ▼     ▼     ▼     ▼      ▼
                              seg0 seg1 seg2 …   (each one an OBJECT)

                              manifest.m3u8       (also an OBJECT)
                              lists every rendition and segment

  PLAYER   fetch manifest
           fetch a segment, MEASURE how long it took
           next segment: step up a rendition, or drop down
           ──▶ ADAPTIVE BITRATE
```

That is HLS and DASH. And the point for this book:

:::key
==Nothing changes on the storage side.== The segments are objects, the manifest
is an object, and the CDN serves both. Object storage plus a CDN is the entire
delivery half of a video platform. The hard engineering is the ==transcoding
pipeline==: the upload event, the queue, the worker fleet, the retries. That is
Notebook 01's territory, not this one.
:::

:::do Build or buy
If video is a ==feature== of your product, buy it: Mux, Bunny Stream and
Cloudflare Stream do the transcoding, packaging and delivery. If video ==is==
your product, build the pipeline, because at that volume the per-minute pricing
of a hosted service stops making sense and the pipeline is your actual business.
:::

## 44. The bill

Three lines, and knowing their relative sizes changes architectures. Rates move;
==the ratios are the durable knowledge==.

```text
  1. STORAGE      per GB-month              ~$0.023   S3 Standard
  2. OPERATIONS   per request               writes ~10x the cost of reads
  3. EGRESS       per GB leaving the cloud  ~$0.09    ← usually the whole bill
```

```text
  1 TB stored, each byte served once in the month:

     storage   1,000 GB × $0.023  =  $23
     egress    1,000 GB × $0.09   =  $90        ← four times the storage
```

| Driver     | The mistake                                   | The fix                                                          |
| ---------- | --------------------------------------------- | ---------------------------------------------------------------- |
| Egress     | Serving from the bucket                       | CDN in front, and ==measure the hit rate==                       |
| Egress     | Presigned GETs behind a CDN                   | Section 41                                                       |
| Egress     | Compute in a different region from the bucket | Co-locate                                                        |
| Operations | LIST in the request path                      | Section 16                                                       |
| Operations | Millions of tiny objects                      | Aggregate; mind the 128 KB minimum billable size on cold classes |
| Storage    | Abandoned multipart uploads                   | Section 36                                                       |
| Storage    | Every version kept forever                    | Expire non-current versions                                      |
| Storage    | Nothing ever expires                          | Lifecycle rules, section 46                                      |

:::signal
"Egress dominates, so the first architectural move is a CDN with a high cache
hit rate, and the second is content-addressed keys so everything is cacheable
forever. ==Storing data is cheap; moving it is not.== Cloudflare R2 charges zero
egress, which for a delivery-heavy product is an architectural consideration and
not just a discount."
:::

:::recall Where does the money go for a 1 TB video library served to 100,000 users a month, and what do you change first? | 6
:::

:::part VIII | Production concerns

Who can read what, what happens to old objects, and what you do about files you
did not write. The second half of the interview, once the upload path is agreed.
:::

## 45. The security surface

Four mechanisms control access, and knowing which is which is a common probe.

| Mechanism                   | Attached to              | Answers                                                       |
| --------------------------- | ------------------------ | ------------------------------------------------------------- |
| IAM policy                  | A principal (role, user) | What may ==this identity== do?                                |
| Bucket policy               | The bucket               | Who may touch ==this bucket==? Cross-account grants live here |
| ACL                         | Bucket or object         | Legacy. ==Disable it== (bucket owner enforced)                |
| Presigned URL / POST policy | A single request         | A capability: one operation, one key, one expiry              |

Access is granted only if nothing denies it and something allows it. An explicit
`Deny` always wins, which makes a deny-based guardrail (deny any request without
TLS, or without server-side encryption) a reliable control.

:::do Bucket defaults for anything holding user content

- ==Block Public Access== on, at the account level as well as the bucket.
- Bucket owner enforced, ACLs disabled.
- Default encryption on, versioning on.
- Deny non-TLS requests via a condition on `aws:SecureTransport`.
- Scope every role to a ==prefix==, using the ownership structure from section
  15, never to the whole bucket.
- Access logs or CloudTrail data events to a ==different bucket in a different
  account==.
  :::

#### Encryption

| Mode        | Key held by  | Use when                                                                                   |
| ----------- | ------------ | ------------------------------------------------------------------------------------------ |
| SSE-S3      | The provider | Default. On by default now. Free                                                           |
| SSE-KMS     | Your KMS key | You need an audit trail of key use, or per-tenant keys. Costs per request and can throttle |
| Client-side | You          | The provider must never be able to read the bytes                                          |

All three encrypt at rest. ==None of them stop a valid, authorised request==,
which is the threat you are actually likely to face.

## 46. Lifecycle, storage classes and versioning

Objects should not all live forever in the most expensive tier.

```text
  day 0    Standard              ~$0.023/GB    hot
  day 30   Standard-IA           ~$0.0125/GB   occasional, retrieval fee
  day 90   Glacier Instant       ~$0.004/GB    rare, still milliseconds
  day 180  Glacier Deep Archive  ~$0.00099/GB  compliance, hours to restore
  day 365  expire
```

The trap is the minimums: 30 days minimum billable duration on IA, 90 on Glacier
Flexible, 180 on Deep Archive, plus per-object overhead and a transition request
per object. Moving millions of small objects to a cold class ==can cost more
than leaving them in Standard==. Check the size distribution first.

:::do Lifecycle rules to write on day one

- ++Abort incomplete multipart uploads after 7 days.++ (Section 36. Non-negotiable.)
- ++Delete anything under `pending/` or `tmp/` after 24 hours.++ (Section 30.)
- ++Expire non-current versions after 30 to 90 days++, so versioning stays a
  safety net rather than an unbounded cost.
- Only then consider cold-tier transitions.
  :::

## 47. Untrusted content, and what to watch

Everything in a user-upload bucket was written by someone who is not you.

:::do Treat the bucket as hostile input

- ++Never serve user content from your application's origin.++ A stored HTML or
  SVG file becomes stored XSS with access to your session cookies. Serve from a
  ==separate domain== so the same-origin policy contains it.
- Set `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`
  for anything not deliberately rendered inline.
- Derive the content type ==server-side from magic bytes== after upload, never
  from the extension or the client's declared type. Section 42's eight-byte
  range read is how you do it cheaply.
- Re-encode images rather than serving originals: it strips EXIF (which carries
  GPS coordinates), removes polyglot payloads and normalises the format.
- Scan asynchronously after the HEAD verification, before flipping status to
  `ready`. Quarantine under a prefix with no read policy.
  :::

| Watch                                  | Because                                          |
| -------------------------------------- | ------------------------------------------------ |
| `pending` rows older than the window   | Section 30. Uploads are failing                  |
| Incomplete multipart uploads           | Section 36. Invisible in a listing, and billed   |
| ==503 SlowDown==                       | Hot partition. Section 15                        |
| 4xx rate on the bucket                 | Policy violations, expired signatures, CORS      |
| ==CDN cache hit ratio==                | The single biggest lever on the bill. Section 41 |
| Bucket size and object count by prefix | Lifecycle rules not firing                       |

:::part IX | The interview itself

The knowledge is not the deliverable. The delivery is.
:::

## 48. The delivery script

"A user uploads a 4 GB video. Design it." Seven steps, about twelve minutes.

1. **Clarify, in three questions.** How large, how often, who may read it back,
   and does anything process the file afterwards? Size decides multipart,
   readership decides public versus signed, processing decides whether a queue
   appears in the diagram.
2. **State the naive design and kill it, in four sentences.** Local disk, path
   in a row. Breaks on ephemeral storage, on horizontal scaling, on durability,
   and it puts your application tier in the data path. Not eight minutes: four
   sentences. It shows you know why the answer is the answer.
3. **Name the storage decision and the trade.** Object storage: no in-place
   mutation, no hierarchy, no locking, in exchange for capacity, durability and
   direct HTTP access from any client.
4. **Draw the two-phase flow.** Intent row, presigned POST policy, direct
   upload, completion, HEAD verification, status transition. This is the core.
5. **Escalate to multipart, because they said 4 GB.** Part size computed from
   file size, 10,000 part cap, concurrency 4 to 6, resume via `ListParts`, and
   the abort-incomplete lifecycle rule.
6. **Volunteer the failure cases before you are asked.** Abandoned uploads and
   the sweeper, the dual-write problem, size enforced by policy rather than
   trust, CORS exposing ETag.
7. **Do the read path and the bill.** CDN with a private bucket, why presigned
   GETs kill the cache, range requests for seeking, egress dominating the bill.

Then name what you left out: "I have not covered transcoding; that is a queue
and a worker pool reading from the same bucket." Naming the boundary reads as
judgement, not as a gap.

## 49. Whiteboard drawing order

Draw in this order. It builds an argument instead of a picture.

```text
  1. browser                    2. your server         3. bucket
     ┌────────┐                    ┌────────┐             ┌────────┐
     │        │                    │        │             │        │
     └────────┘                    └────────┘             └────────┘

  4. arrow 1: browser ──▶ server   "intent only, no bytes"
  5. box: database, arrow: row status=pending
  6. arrow 2: server ──▶ browser   "signed policy, 5 min, one key"
  7. arrow 3: browser ──▶ bucket   THICK. "the only arrow with bytes"
  8. arrow 4: browser ──▶ server   "complete(uploadId, parts)"
  9. arrow 5: server ──▶ bucket    "HEAD, metadata only"
 10. status: pending ──▶ ready
 11. only now: CDN, sweeper, multipart grid, lifecycle
```

Draw the thick arrow deliberately and say "this is the only line carrying file
bytes, and it does not touch my service". That one gesture communicates the
whole design.

## 50. Follow-up question bank

Answer each out loud before checking the section.

| Question                                                             | Section |
| -------------------------------------------------------------------- | ------- |
| Why not a bigger disk, or EFS?                                       | 5, 10   |
| Difference between durability and availability?                      | 6       |
| Streaming fixes memory, so why not proxy uploads?                    | 24, 25  |
| What stops a client uploading 5 GB to an avatar URL?                 | 27, 28  |
| How does the server know the upload finished?                        | 29      |
| Why HEAD and not GET?                                                | 29      |
| What happens when the client never calls complete?                   | 30, 36  |
| Two clients write the same key at once. Who wins, and who knows?     | 22      |
| Why is renaming a folder slow?                                       | 14      |
| Why does key design affect throughput?                               | 15, 20  |
| Why must you never LIST in a request path?                           | 16      |
| Give four reasons a single PUT fails on a 6 GB file                  | 32      |
| Why is CompleteMultipartUpload fast for a 50 GB object?              | 33      |
| How do you choose the part size, and what breaks if you hardcode it? | 34      |
| Your MD5 check fails on large files only. Why?                       | 35      |
| What is in the bucket that you are billed for and cannot see?        | 36      |
| How does resume work after a page refresh?                           | 38      |
| You put a CDN in front and egress did not drop. Why?                 | 41      |
| How does video seeking work?                                         | 42      |
| How would you serve 4K and 240p from one bucket?                     | 43      |
| Where does the money go?                                             | 44      |
| A user uploads an HTML file. What is the risk?                       | 47      |
| S3 promises eleven nines. Do you still need backups?                 | 19      |

:::part X | Appendices
:::

## Appendix A. Numbers to memorise

| Quantity                   | Value                                                     |
| -------------------------- | --------------------------------------------------------- |
| Block size                 | 512 B or 4 KB                                             |
| Block storage latency      | Microseconds                                              |
| Object storage latency     | Milliseconds to tens of milliseconds (an HTTP round trip) |
| Maximum single PUT         | ==5 GiB==                                                 |
| Maximum object size        | 5 TiB                                                     |
| Multipart minimum part     | 5 MiB (except the last)                                   |
| Multipart maximum parts    | ==10,000==                                                |
| Part size formula          | `max(16 MiB, ceil(fileSize / 10000))`                     |
| Upload concurrency         | 4 to 6 parallel parts                                     |
| Browser peak memory        | `partSize × concurrency`                                  |
| Abort-incomplete lifecycle | 7 days                                                    |
| LIST page size             | 1,000 keys                                                |
| Erasure coding shape       | 14 data + 6 parity, any 14 reconstruct                    |
| Erasure coding overhead    | 1.43x, versus 3x for replication                          |
| S3 durability              | 11 nines: 1 object lost per 10 million per 10,000 years   |
| Request rate per prefix    | ~3,500 write/s, ~5,500 read/s                             |
| Storage                    | ~$0.023 per GB-month                                      |
| Egress                     | ~$0.09 per GB, roughly 4x storage                         |
| Write requests cost        | ~10x read requests                                        |
| Strong consistency since   | December 2020                                             |
| Conditional writes since   | 2024                                                      |

## Appendix B. Glossary

| Term                   | Meaning                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| Bucket                 | Named container for objects. Globally unique name                    |
| Key                    | The string that is an object's entire identity                       |
| Prefix                 | A leading substring of keys. What "folders" are made of              |
| Delimiter              | The character LIST groups on to fake folders                         |
| CommonPrefixes         | The LIST response field the folder illusion is built from            |
| Object                 | Key + bytes + system metadata + user metadata                        |
| ETag                   | Opaque tag for current contents. ==Not a content hash on multipart== |
| Data plane             | Stores and reconstructs the bytes                                    |
| Metadata plane         | The strongly consistent sorted index of keys                         |
| Erasure coding         | Reed-Solomon shards; any k of n reconstruct                          |
| Durability             | Whether the data still exists                                        |
| Availability           | Whether you can reach it right now                                   |
| Presigned URL          | A signed capability: one method, one key, one expiry                 |
| POST policy            | A signed JSON document of conditions the store enforces              |
| `content-length-range` | The policy condition that caps upload size                           |
| Conditional write      | `If-None-Match: *` or `If-Match: <etag>`; 412 on failure             |
| Two-phase upload       | Intent row, direct upload, verified completion                       |
| uploadId               | Handle for a multipart staging area. Not an object                   |
| Part                   | One independently retried chunk of a multipart upload                |
| Orphan                 | Bytes in the bucket with no database row                             |
| Hot partition          | Too many keys sharing a prefix. Symptom: 503 SlowDown                |
| Range request          | `Range: bytes=a-b`, answered with 206 Partial Content                |
| Egress                 | Data leaving the cloud. Usually the largest line on the bill         |
| Content-addressed      | Key derived from a hash of the bytes, so it is immutable             |
| Adaptive bitrate       | Player picks a rendition per segment from measured speed             |
| Manifest               | The HLS/DASH index object listing renditions and segments            |
| S3-compatible          | Speaks the S3 protocol. ==Not== a promise of feature parity          |

## Appendix C. Self-test

Close the book.

:::recall List the seven failures of the local-disk design, in order. | 8
:::

:::recall Block, file, object: interface, latency, sharing model, one use case each. | 8
:::

:::recall Explain "folders" in terms of prefix, delimiter and CommonPrefixes. | 6
:::

:::recall Three rules for designing an object key, and the failure each prevents. | 7
:::

:::recall Erasure coding: the shape, the overhead, the failures tolerated, what you pay. | 6
:::

:::recall Why is a presigned PUT not enough for a browser upload, and what replaces it? | 6
:::

:::recall The four calls of a multipart upload, and what exists at the key after each. | 7
:::

:::recall Every place the database and the bucket can disagree, and how each is resolved. | 8
:::

:::recall Why does a presigned GET behind a CDN cost more than it should, and both fixes. | 7
:::

:::redraw The whole system: browser, server, database, bucket, CDN, queue. | Mark the byte-carrying arrows, and the multipart fan-out. Then compare with the drawing you made on the title page.
:::
