/**
 * Study Notebooks (learn.binarysemaphore.com) , single source of truth for the
 * catalog, the way `site.ts` is for the marketing site. Edit copy here, not in
 * components.
 *
 * The PDFs themselves are NOT in this repo. They are built in the `learnings`
 * repo (`notebooks/build.sh`) and uploaded to the private `notebooks` Supabase
 * Storage bucket by `scripts/upload-notebooks.mjs`. This file records what
 * exists and what it is called; `src/lib/learn/access.ts` decides who may read
 * it.
 *
 * Every `slug` here must also exist in `public.learn_products` (seeded in
 * supabase/migrations/0003_learn.sql). tests/lib/learn.test.ts enforces that.
 */

/** The three cuts of every notebook. Same text, different page geometry. */
export type EditionId = "reading" | "print" | "tablet";

export type Edition = {
  id: EditionId;
  name: string;
  /** One line on who this cut is for, shown beside the download. */
  description: string;
};

/** Ordered as they are offered. Reading is the default download. */
export const editions: Edition[] = [
  {
    id: "reading",
    name: "Reading",
    description: "A4 portrait, no annotation margin. For reading on a screen.",
  },
  {
    id: "print",
    name: "Print",
    description:
      "A4 with a wide outer margin. Made to be printed and written on.",
  },
  {
    id: "tablet",
    name: "Tablet",
    description:
      "16:9 landscape, fills a tablet screen. Vector text, so note apps draw it rather than rasterise it.",
  },
];

/**
 * The lecture series most of these notebooks are built from.
 *
 * Credit is not optional here. Six of the nine notebooks expand a lecture from
 * this playlist, and a reader deserves to know whose work they are standing on
 * and to be able to go and watch it.
 *
 * Verified against the playlist itself, not the books' own prose: two books
 * cite the wrong video id in their text.
 */
export const lectureSeries = {
  author: "Sriniously",
  authorUrl: "https://www.youtube.com/@sriniously",
  playlist: "Backend from first principles",
  playlistUrl:
    "https://www.youtube.com/playlist?list=PLui3EUkuMTPgZcV0QhQrOcwMPcBCcd_Q1",
} as const;

/** One lecture a notebook is built from. */
export type SourceVideo = {
  title: string;
  url: string;
  /** "2h45", as the notebooks write durations. */
  duration: string;
};

export type EditionAsset = {
  /** File name inside the notebook's folder in the storage bucket. */
  file: string;
  /** Size in bytes, used for the "4.2 MB" label. */
  bytes: number;
};

export type Notebook = {
  /** URL slug, storage folder, and `learn_products.id`. All the same string. */
  slug: string;
  /** e.g. "System Design Notebook". */
  series: string;
  /** Two-digit number within its series. */
  number: string;
  title: string;
  /** The line under the title, from the book's own title block. */
  subtitle: string;
  /** Two or three sentences on what is in it. Shown on the card and the page. */
  blurb: string;
  /** Page count of the Reading edition. */
  pages: number;
  /** The full table of contents. Free to read: it is the best preview there is. */
  contents: string[];
  /** Which cuts exist. Not every notebook has all three. */
  assets: Partial<Record<EditionId, EditionAsset>>;
  /** The lectures this notebook expands. Empty when it was written from
   * scratch, which the page says rather than leaving the reader guessing. */
  sources: SourceVideo[];
};

export const notebooks: Notebook[] = [
  {
    slug: "question-bank",
    series: "Study Notebook",
    number: "00",
    title: "Question Bank",
    subtitle: "253 prompts pulled from notebooks 01 to 09, answers at the back",
    blurb:
      "Work in pen. A prompt you can only half answer is the whole point of the exercise: mark it, and go back to the section it names. Regenerated from every other notebook, so it stays in step with them.",
    pages: 179,
    contents: [
      "1. Opening",
      "2. Framing the problem",
      "3. Ingestion, getting the bytes in",
      "4. The handoff",
      "5. The queue",
      "6. Processing",
      "7. State and visibility",
      "8. Senior concerns",
      "9. The interview itself",
      "10. Final review",
      "11. Opening",
      "12. The naive design, and the seven ways it dies",
      "13. Three kinds of storage",
      "14. Anatomy of an object",
      "15. Inside the system",
      "16. Getting the bytes in",
      "17. Large files",
      "18. Getting the bytes out",
      "19. Final review",
      "20. Opening",
      "21. How to review code out loud",
      "22. The Node.js runtime",
      "23. Express and the HTTP boundary",
      "24. The client: React and Redux",
      "25. PostgreSQL",
      "26. MongoDB",
      "27. Kafka",
      "28. Twenty-four more drills",
      "29. Delivery",
      "30. Opening",
      "31. Why a database at all",
      "32. Types are the first constraint",
      "33. Designing the schema",
      "34. Querying for an API",
      "35. Making it fast",
      "36. Correctness under concurrency",
      "37. Final review",
      "38. Opening",
      "39. Injection",
      "40. Authentication",
      "41. Authorization",
      "42. The browser is a boundary too",
      "43. Final review",
      '44. What "fast" means',
      "45. Finding the bottleneck",
      "46. The database",
      "47. Caching",
      "48. More machines",
      "49. The stateful part",
      "50. Moving work in space and time",
      "51. Architecture decisions",
      "52. The interview",
      "53. Final review",
      "54. Opening",
      "55. The client always spoke first",
      "56. Server-sent events: the response that never ends",
      "57. WebSocket: leaving HTTP behind",
      "58. How many connections fit on one machine",
      "59. The connection is state",
      "60. Delivery: gaps, storms and fan-out",
      "61. The parts the lecture left out",
      "62. Final review",
      "63. Opening",
      "64. The standard exists so you do not have to negotiate",
      "65. Resources, and the URL that names them",
      "66. The method is a promise about repeating",
      "67. The response is the other half of the interface",
      "68. The list endpoint is where APIs go wrong",
      "69. When CRUD runs out",
      "70. Consistency is the whole product",
      "71. The interview itself",
      "72. Final review",
      "73. Opening",
      "74. The words that came before the acronym",
      "75. The five",
      "76. Using them without being used by them",
      "77. The interview itself",
      "78. Opening",
      "79. Caching is a bet about staleness",
      "80. Where caches live",
      "81. The strategies",
      "82. Invalidation",
      "83. The failure modes",
      "84. Telling someone else's cache what to do",
      "85. Redis in practice",
      "86. The interview itself",
      "87. Final review",
      "88. Answers, Notebook 01",
      "89. Answers, Notebook 02",
      "90. Answers, Notebook 03",
      "91. Answers, Notebook 04",
      "92. Answers, Notebook 05",
      "93. Answers, Notebook 06",
      "94. Answers, Notebook 07",
      "95. Answers, Notebook 08",
      "96. Answers, Notebook 09",
      "97. Answers, Notebook 10",
    ],
    assets: {
      reading: { file: "Question-Bank-Reading.pdf", bytes: 3717210 },
      print: { file: "Question-Bank-Print.pdf", bytes: 5014696 },
      tablet: { file: "Question-Bank-Tablet.pdf", bytes: 7695122 },
    },
    sources: [],
  },
  {
    slug: "large-scale-ingestion",
    series: "System Design Notebook",
    number: "01",
    title: "Large-Scale Data Ingestion",
    subtitle:
      "How to accept, store, process and track multi-gigabyte jobs without losing them",
    blurb:
      "Accepting a multi-gigabyte upload is not a bigger version of accepting a form. This one walks the whole path: presigned URLs, multipart and resume, the outbox pattern, the queue, and how a caller finds out the job is still alive.",
    pages: 68,
    contents: [
      "The whole system on one page",
      "1. The problem, stated properly",
      "2. Clarifying questions that buy you the design",
      "3. Back-of-the-envelope, before the boxes",
      "4. The first principle: separate ingestion from processing",
      "5. Why object storage, not the database",
      "6. Presigned URLs, keeping the bytes out of your backend",
      "7. Multipart and resumable upload",
      "8. Choosing the part size",
      "9. When the network fails mid-upload",
      "10. Completing the upload and verifying it",
      "11. The dual-write problem and the outbox",
      "12. Why a queue at all",
      "13. Kafka or RabbitMQ or SQS",
      "14. The worker loop",
      "15. Streaming, never loading",
      "16. Chunking and checkpointing",
      "17. Idempotency",
      "18. The lease problem: when the queue thinks you died",
      "19. Parallelising one big file",
      "20. Retries, poison pills and the DLQ",
      "21. The job state machine",
      "22. Progress without hammering the database",
      "23. Telling the frontend",
      "24. Scaling: workers, backpressure and queue depth",
      "25. Multi-tenancy and fairness",
      '26. Partial failure: what "failed" means',
      "27. Cost, the bill nobody mentions",
      "28. Observability and security",
      "29. The seven-step delivery script",
      "30. Whiteboard drawing order",
      "31. Follow-up question bank",
      "Appendix A. Numbers to memorise",
      "Appendix B. Glossary",
      "Appendix C. Self-test",
    ],
    assets: {
      reading: {
        file: "Large-Scale-Data-Ingestion-Reading.pdf",
        bytes: 1812365,
      },
      print: { file: "Large-Scale-Data-Ingestion-Print.pdf", bytes: 2585802 },
      tablet: { file: "Large-Scale-Data-Ingestion-Tablet.pdf", bytes: 3088390 },
    },
    sources: [],
  },
  {
    slug: "object-storage",
    series: "System Design Notebook",
    number: "02",
    title: "Object Storage",
    subtitle:
      "Why a file is not your application's data, and what to do about it",
    blurb:
      "Seven ways the obvious design dies, one at a time, then block, file and object storage compared on what they actually promise. Ends on the trade you are making when you pick one.",
    pages: 86,
    contents: [
      "The whole picture on one page",
      "1. The requirement, and the intuitive answer",
      "2. Failure 1: the file does not fit",
      "3. Failure 2: the disk is ephemeral",
      "4. Failure 3: horizontal scaling, and the 1-in-N 404",
      "5. Failure 4: the disk grows the wrong way",
      "6. Failure 5: durability is not availability",
      "7. Failure 6: your server is an expensive CDN",
      "8. Failure 7: no transaction across two systems",
      "9. Block storage",
      "10. File storage, and what POSIX costs",
      "11. Object storage: the minimum interface",
      "12. The trade you are actually making",
      "13. Key, value, metadata, bucket",
      "14. There are no folders",
      "15. Designing the key",
      "16. Why LIST is not a lookup",
      "17. What happens when you PUT",
      "18. The data plane: replication and erasure coding",
      "19. Eleven nines, read carefully",
      "20. The metadata plane",
      "21. Consistency: eventual, then strong",
      "22. Conditional writes, the primitive that changed things",
      "23. Architecture A: through your server",
      "24. Buffering versus streaming",
      "25. The limits streaming does not remove",
      "26. Architecture B: presigned URLs",
      "27. The hole in a presigned PUT",
      "28. Presigned POST policies",
      "29. The two-phase upload",
      "30. Reconciliation: pending, expired, orphaned",
      "31. CORS, the last mile",
      "32. Why a single PUT stops working",
      "33. The multipart protocol",
      "34. Choosing the part size",
      "35. The ETag trap",
      "36. Abandoned uploads: the invisible bill",
      "37. The full large-file architecture",
      "38. Resuming",
      "39. Never relay a download",
      "40. Three delivery patterns",
      "41. Why a presigned GET destroys your cache",
      "42. Range requests",
      "43. Segmented streaming, and where object storage stops",
      "44. The bill",
      "45. The security surface",
      "46. Lifecycle, storage classes and versioning",
      "47. Untrusted content, and what to watch",
      "48. The delivery script",
      "49. Whiteboard drawing order",
      "50. Follow-up question bank",
      "Appendix A. Numbers to memorise",
      "Appendix B. Glossary",
      "Appendix C. Self-test",
    ],
    assets: {
      reading: { file: "Object-Storage-Reading.pdf", bytes: 2278606 },
      print: { file: "Object-Storage-Print.pdf", bytes: 3236643 },
      tablet: { file: "Object-Storage-Tablet.pdf", bytes: 4229404 },
    },
    sources: [
      {
        title: "23. Object Storage, Everything You Need to Know: Part 1",
        url: "https://www.youtube.com/watch?v=Ie0TjKI9cDI",
        duration: "1h29",
      },
      {
        title: "24. Object Storage, Everything You Need to Know: Part 2",
        url: "https://www.youtube.com/watch?v=iWrVCxexUWY",
        duration: "0h50",
      },
    ],
  },
  {
    slug: "postgres",
    series: "Study Notebook",
    number: "04",
    title: "Postgres",
    subtitle:
      "Schema, queries and indexes for people who have to keep the thing running",
    blurb:
      "Types, constraints, relationships and indexes, then the part most courses skip: transactions and isolation, the N+1 problem, connection pooling, EXPLAIN, and vacuum. A schema you can draw is table stakes.",
    pages: 71,
    contents: [
      "The schema on one page",
      "1. Persistence, and where data lives",
      "2. What a text file cannot do",
      "3. What a DBMS promises",
      "4. Relational or not",
      "5. Why Postgres",
      "6. Numbers, and the money rule",
      "7. Text, and why the answer is `text`",
      "8. Time, and the one that bites",
      "9. Identity: serial, identity, uuid",
      "10. JSON and JSONB",
      "11. Enums, and the argument that actually wins",
      "12. Why you never touch the database by hand",
      "13. Up, down, and the version table",
      "14. Migrations that do not lock the table",
      "15. The columns every table has",
      "16. `NOT NULL` is the default you want",
      "17. Keys: primary, foreign, composite",
      "18. One to one, and when to split a table",
      "19. One to many",
      "20. Many to many, and the linking table",
      "21. Referential integrity on delete",
      "22. `CHECK`, `UNIQUE`, and pushing rules down",
      "23. Naming: plural, lower, snake",
      "24. Write `FROM` before `SELECT`",
      "25. `JOIN`, and why `LEFT` is usually right",
      "26. Nested JSON in one round trip",
      "27. Parameterised queries, and SQL injection",
      "28. Dynamic filters and sorts, without opening a hole",
      "29. Pagination: `OFFSET`, and why it dies",
      "30. Insert and update",
      "31. The N+1 problem",
      "32. What an index actually is",
      "33. What to index, and what Postgres already did",
      "34. What an index costs",
      "35. Reading `EXPLAIN ANALYZE`",
      "36. Beyond B-tree",
      "37. Transactions, and what ACID buys",
      "38. Isolation levels",
      "39. Row locks and `SELECT FOR UPDATE`",
      "40. The lost update, revisited",
      "41. Connection pooling",
      "42. Triggers, and when not to",
      "43. Vacuum, bloat and wraparound",
      "44. Backups, and the difference that matters",
      "45. The delivery script",
      "46. Follow-up question bank",
      "Appendix A. Defaults to memorise",
      "Appendix B. Glossary",
      "Appendix C. Self-test",
    ],
    assets: {
      reading: { file: "Postgres-Reading.pdf", bytes: 2095918 },
      print: { file: "Postgres-Print.pdf", bytes: 3139136 },
      tablet: { file: "Postgres-Tablet.pdf", bytes: 4021915 },
    },
    sources: [
      {
        title: "12. Mastering Databases with Postgres",
        url: "https://www.youtube.com/watch?v=F7Vwp2Xo5Do",
        duration: "2h45",
      },
    ],
  },
  {
    slug: "security",
    series: "Study Notebook",
    number: "05",
    title: "Backend Security",
    subtitle: "Where you made an assumption, and who is going to find it",
    blurb:
      "Every vulnerability is an assumption someone else found first. Injection across SQL, NoSQL and the shell, password storage done properly, sessions and tokens, and the boundaries where data turns into code.",
    pages: 55,
    contents: [
      "The whole book in one question",
      "1. Assumptions are the vulnerability",
      "2. Your application speaks several languages",
      "3. The boundary between data and code",
      "4. SQL injection",
      "5. Parameterised queries, and what they cannot do",
      "6. NoSQL injection",
      "7. Command injection",
      "8. The argument array",
      "9. Build it only if you have a reason",
      "10. Never store a password",
      "11. Why hashing alone is not enough",
      "12. Salt, and the right algorithm",
      "13. Sessions",
      "14. Cookie flags",
      "15. JWT: what you gain and what you give up",
      "16. Rate limiting",
      "17. The layer where the check belongs",
      "18. Broken object level authorization",
      "19. What the status code leaks",
      "20. Deny by default",
      "21. Audit logging",
      "22. Cross-site scripting",
      "23. Content Security Policy",
      "24. Cross-site request forgery",
      "25. Clickjacking",
      "26. Secrets",
      "27. Error messages and debug output",
      "28. What you must not log",
      "29. Dependencies",
      "30. Reviewing an endpoint",
      "31. Follow-up question bank",
      "Appendix A. The response headers",
      "Appendix B. Glossary",
      "Appendix C. Self-test",
    ],
    assets: {
      reading: { file: "Backend-Security-Reading.pdf", bytes: 1634767 },
      print: { file: "Backend-Security-Print.pdf", bytes: 2293446 },
      tablet: { file: "Backend-Security-Tablet.pdf", bytes: 2648548 },
    },
    sources: [
      {
        title: "20. Backend Security: Everything You Need to Know",
        url: "https://www.youtube.com/watch?v=xB1C1xZZW4k",
        duration: "2h50",
      },
    ],
  },
  {
    slug: "scaling",
    series: "Study Notebook",
    number: "06",
    title: "Scaling and Performance",
    subtitle: "Where the time actually goes, and how you know",
    blurb:
      "Latency is a distribution, not a number. Measure before you fix: percentiles, utilization and the knee, flame graphs, distributed tracing. Then the fixes, in the order they pay off.",
    pages: 100,
    contents: [
      '1. "Slow" is not a bug report',
      "2. Latency is a distribution, not a number",
      "3. Why P99 is your most valuable customers",
      "4. Throughput, and the curve that bends",
      "5. Utilization and the knee",
      "6. Headroom, and why traffic arrives in bursts",
      "7. Never guess. The week spent on the wrong fix",
      "8. Profiling, and what a flame graph shows",
      "9. Distributed tracing, and why waiting needs it",
      "10. What to measure, in what order",
      "11. N+1: the shape, not the name",
      "12. Indexes: the catalogue, the tree, and the cost",
      "13. Composite and covering indexes",
      "14. EXPLAIN ANALYZE: deciding instead of guessing",
      "15. Connections are not free",
      "16. Pooling, and the autoscaler that killed the database",
      "17. What caching actually buys",
      "18. Invalidation: the second hard problem",
      "19. Where the cache lives",
      "20. Three patterns: aside, through, behind",
      "21. Hit rate, and the four things that move it",
      "22. Vertical scaling, and its three ceilings",
      "23. Horizontal scaling, and the bill it comes with",
      "24. Statelessness is the price of admission",
      "25. The load balancer, and five algorithms",
      "26. Health checks, and the server that is up but dead",
      "27. Read replicas",
      "28. Replication lag, and the read-after-write bug",
      "29. Sharding, and the key that is hard to choose",
      "30. Distributed databases: rent, do not build",
      "31. The speed of light, and the latency budget",
      "32. CDNs: what goes on one",
      "33. The edge, and what it cannot do",
      "34. Asynchronous processing: the queue as a latency tool",
      "35. What can be made async, and what cannot",
      "36. Microservices scale teams, not machines",
      "37. What a network boundary costs",
      "38. Serverless: the pricing model is the point",
      "39. Cold starts, limits, and statelessness",
      "40. When serverless fits, and when it does not",
      '41. How to answer "how would you scale this?"',
      "42. Five traps",
      "43. The five rules",
      "Appendix A. Numbers worth memorising",
      "Appendix B. Glossary",
      "Appendix C. Final review",
    ],
    assets: {
      reading: { file: "Scaling-and-Performance-Reading.pdf", bytes: 2373735 },
      print: { file: "Scaling-and-Performance-Print.pdf", bytes: 3809134 },
      tablet: { file: "Scaling-and-Performance-Tablet.pdf", bytes: 5114928 },
    },
    sources: [
      {
        title: "21.1. Backend Scaling and Performance Engineering: Part 1",
        url: "https://www.youtube.com/watch?v=z7kt_p44rjs",
        duration: "1h48",
      },
      {
        title: "21.2. Backend Scaling and Performance Engineering: Part 2",
        url: "https://www.youtube.com/watch?v=sOhAopEwjH4",
        duration: "2h18",
      },
    ],
  },
  {
    slug: "real-time-backends",
    series: "System Design Notebook",
    number: "07",
    title: "Real-Time Backends",
    subtitle: "What it costs to let the server speak first",
    blurb:
      "Polling, long polling, SSE and WebSockets, priced honestly. The proxies that eat your stream, the six-connections-per-origin limit, and what any of it does to a server you have to keep running.",
    pages: 90,
    contents: [
      "The whole picture on one page",
      "1. The requirement: two people, one board",
      "2. The shape of every request you have written so far",
      "3. Polling, and why it is not stupid",
      "4. The arithmetic of polling",
      "5. Long polling, and the gap",
      "6. The two inversions",
      "7. A 200 that does not close",
      "8. The wire format: four fields and a blank line",
      "9. Reconnection you did not write",
      "10. Why nobody streams an LLM with EventSource",
      "11. The proxy that eats your stream",
      "12. Six connections per origin",
      "13. What SSE cannot do",
      "14. The handshake, byte by byte",
      "15. What 101 actually changed",
      "16. The frame",
      "17. Masking, and the proxy it was designed to protect",
      "18. Ping, pong, and the connection that is already dead",
      "19. Close codes, and the one you cannot send",
      "20. Choosing: polling, long polling, SSE, WebSocket",
      "21. Ceiling 1: file descriptors",
      "22. The thousand-descriptor limit is language-dependent",
      "23. Ceiling 2: the client's ports, not the server's",
      "24. Ceiling 3: memory, and where 10 KB goes",
      "25. The ceiling the benchmark did not measure",
      "26. Compression, and the budget it destroys",
      "27. What you just broke",
      "28. Sticky sessions are not the answer, and not for the reason you think",
      "29. Pub/sub: the instances talk to each other",
      "30. Redis pub/sub is at-most-once, and deploys are when it bites",
      "31. Ordering, and why sequence numbers come first",
      "32. The catch-up protocol",
      "33. Fan-out: events times subscribers",
      "34. Coalescing: the other lever",
      "35. The reconnect storm",
      "36. Deploys: draining a connection that never ends",
      "37. Authenticating a socket",
      "38. The token that never expires",
      "39. Cross-site WebSocket hijacking",
      "40. Presence: who is online",
      "41. Collaborative editing, in one page",
      "42. Where this goes next: WebTransport",
      "43. The delivery script",
      "44. Whiteboard drawing order",
      "45. Follow-up question bank",
      "Appendix A. Numbers to memorise",
      "Appendix B. Glossary",
      "Appendix C. Self-test",
    ],
    assets: {
      reading: { file: "Real-Time-Backends-Reading.pdf", bytes: 2487020 },
      print: { file: "Real-Time-Backends-Print.pdf", bytes: 3382139 },
      tablet: { file: "Real-Time-Backends-Tablet.pdf", bytes: 4402860 },
    },
    sources: [
      {
        title: "25. Real-Time Backends",
        url: "https://www.youtube.com/watch?v=wUQryt697cs",
        duration: "0h52",
      },
    ],
  },
  {
    slug: "rest-api-design",
    series: "System Design Notebook",
    number: "08",
    title: "REST API Design",
    subtitle: "Designing an interface for someone you will never meet",
    blurb:
      "An interface is a promise to someone you will never meet. Fielding's constraints and which one nobody implements, resources and the methods that act on them, status codes a client can act on, and what a well-behaved error looks like.",
    pages: 99,
    contents: [
      "The whole picture on one page",
      "1. The requirement: an interface two strangers agree on",
      "2. 1990 to 1993: the web outgrows its inventor",
      "3. Fielding's six constraints",
      "4. Why it is called REST",
      "5. The constraint nobody implements",
      "6. Finding the nouns",
      "7. Anatomy of a URL",
      "8. Plural nouns, and where the rule breaks",
      "9. The slash means containment",
      "10. Slugs, and the two problems the lecture skips",
      "11. Path or query, and what an id should look like",
      "12. Versioning: what actually forces a v2",
      "13. Safe, idempotent, and the difference nobody draws",
      "14. GET, and the day Google deleted a company's data",
      "15. POST, and why it is the odd one",
      "16. PUT and PATCH: replace against modify",
      "17. PATCH is not idempotent, and the lecture says it is",
      "18. What a PATCH body actually is",
      "19. DELETE, and the 404 on the second call",
      "20. Making POST retryable: idempotency keys",
      "21. 200, 201, and the Location header",
      "22. 204, and when an empty body is wrong",
      "23. 404, and the collection that is empty",
      "24. 400 against 422: which kind of wrong",
      "25. 401 against 403, and the misleading name",
      "26. 409, and the duplicate you did not plan for",
      "27. The lost update, and the two headers that prevent it",
      "28. 202, 429, and the responses that ask the client to wait",
      "29. One error shape, everywhere",
      "30. Three features, one endpoint",
      "31. The envelope: what wraps your data",
      "32. Offset pagination, and the page-2 bug",
      "33. Keyset pagination",
      "34. `total` costs a second query",
      "35. Sorting, and the index underneath it",
      "36. Filtering, operators, and the namespace collision",
      "37. The unbounded limit",
      "38. Sane defaults: sending nothing must work",
      "39. The action that is not a verb on a noun",
      "40. Designing a custom action",
      "41. Custom actions are not REST, and that is fine",
      "42. The API-level N+1, and why GraphQL exists",
      "43. The second endpoint should cost nothing to learn",
      "44. Naming, and the standard that does not exist",
      "45. Design first: the interface before the code",
      "46. OpenAPI, and documentation that cannot go stale",
      "47. Reviewing an API diff",
      "48. The delivery script",
      "49. Whiteboard: designing an API live",
      "50. Follow-up question bank",
      "Appendix A. Status codes to memorise",
      "Appendix B. The design checklist",
      "Appendix C. Glossary",
      "Appendix D. Self-test",
    ],
    assets: {
      reading: { file: "REST-API-Design-Reading.pdf", bytes: 2891344 },
      print: { file: "REST-API-Design-Print.pdf", bytes: 4081932 },
      tablet: { file: "REST-API-Design-Tablet.pdf", bytes: 4939485 },
    },
    sources: [
      {
        title: "11. Complete REST API Design",
        url: "https://www.youtube.com/watch?v=RG6q57DwV8Y",
        duration: "2h04",
      },
    ],
  },
  {
    slug: "design-principles",
    series: "System Design Notebook",
    number: "09",
    title: "Design Principles",
    subtitle: "SOLID, and the question underneath it",
    blurb:
      "SOLID is the answer. The question underneath it is which changes a design makes cheap and which it makes expensive, so each letter is taken back to the coupling it is really about, including where two of them disagree.",
    pages: 42,
    contents: [
      "The whole picture on one page",
      "1. The requirement: a change that should have been small",
      "2. Cohesion and coupling: the older, better words",
      "3. Separation of concerns, and where these principles live",
      "4. S: one reason to change",
      "5. S, refined: responsibility means an actor",
      "6. O: change by adding, not by editing",
      "7. O: Meyer's version and Martin's are not the same",
      "8. L: what Liskov actually said",
      "9. L: the four rules, and the square",
      "10. I: the interface that carries what you do not use",
      "11. D: point the dependency at what changes least",
      "12. When two principles disagree",
      "13. OCP against YAGNI: the abstraction you did not need",
      "14. SRP against DRY: the duplication you should keep",
      "15. The smell catalogue: what a violation looks like in a diff",
      "16. SOLID outside objects",
      "17. The critique: is SOLID still right?",
      "18. The delivery script",
      "19. Whiteboard: refactoring live",
      "20. Follow-up question bank",
      "Appendix A. The sources, and what each one actually says",
      "Appendix B. The one-page summary",
      "Appendix C. Glossary",
      "Appendix D. Self-test",
    ],
    assets: {
      reading: { file: "Design-Principles-Reading.pdf", bytes: 1074869 },
      print: { file: "Design-Principles-Print.pdf", bytes: 1541603 },
      tablet: { file: "Design-Principles-Tablet.pdf", bytes: 1911872 },
    },
    sources: [],
  },
  {
    slug: "caching",
    series: "System Design Notebook",
    number: "10",
    title: "Caching",
    subtitle: "How wrong you are willing to be, and for how long",
    blurb:
      "Where a cache goes and what it costs you when it is stale. The hit ratio arithmetic, the stampede that turns smooth load into spikes, and the invalidation nobody gets right the first time.",
    pages: 77,
    contents: [
      "The whole picture on one page",
      "1. The requirement: the query that runs a million times",
      "2. What a cache actually is",
      "3. The arithmetic of a hit ratio",
      "4. The cost you just took on",
      "5. What must never be cached",
      "6. The hierarchy, end to end",
      "7. Hardware caching, and the numbers worth memorising",
      "8. Why RAM is fast, and why sequential is faster still",
      "9. The caches you did not configure",
      "10. DNS, and caching at five levels",
      "11. CDN: the edge, the PoP, and the origin",
      "12. The application cache: Redis and Memcached",
      "13. Cache-aside, and the race inside it",
      "14. Read-through",
      "15. Write-through, and the claim that it is always fresh",
      "16. Write-behind",
      "17. Refresh-ahead and stale-while-revalidate",
      "18. Choosing",
      "19. Why invalidation is the hard part",
      "20. TTL is the honest answer",
      "21. Delete, do not update",
      "22. The ordering problem",
      "23. Versioned keys",
      "24. Cache key design, and the day you serve the wrong user's data",
      "25. The thundering herd",
      "26. Avalanche, and the one line that prevents it",
      "27. Penetration, and caching the miss",
      "28. Hot keys",
      "29. When the cache goes down",
      "30. Eviction: what to drop when you run out",
      "31. Cache-Control, and the directive everybody misreads",
      "32. max-age, s-maxage, and who obeys which",
      "33. ETag and conditional requests",
      "34. stale-while-revalidate",
      "35. Vary, and the cache key you did not know you had",
      "36. Single-threaded, and the command that kills production",
      "37. Persistence, and what durable means here",
      "38. Sessions and rate limits, and the bug in the counter",
      "39. Redis or Memcached",
      "40. The delivery script",
      "41. Whiteboard: adding a cache live",
      "42. Follow-up question bank",
      "Appendix A. Numbers worth memorising",
      "Appendix B. The caching checklist",
      "Appendix C. Glossary",
      "Appendix D. Self-test",
    ],
    assets: {
      reading: { file: "Caching-Reading.pdf", bytes: 2074050 },
      print: { file: "Caching-Print.pdf", bytes: 2958992 },
      tablet: { file: "Caching-Tablet.pdf", bytes: 3916455 },
    },
    sources: [
      {
        title: "13. Caching, the secret behind it all",
        url: "https://www.youtube.com/watch?v=estH64OkwxU",
        duration: "1h04",
      },
    ],
  },
];

/** The notebook with this slug, or undefined. */
export function getNotebook(slug: string): Notebook | undefined {
  return notebooks.find((n) => n.slug === slug);
}

/** Storage object key for one edition: `<slug>/<file>`. The first path segment
 * is the product id, which is what the bucket's RLS policy checks. */
export function objectKey(
  notebook: Notebook,
  edition: EditionId,
): string | null {
  const asset = notebook.assets[edition];
  return asset ? `${notebook.slug}/${asset.file}` : null;
}

/** "4.2 MB", for a download label. */
export function formatBytes(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

/** Total pages across the library, for the index page. */
export function totalPages(): number {
  return notebooks.reduce((sum, n) => sum + n.pages, 0);
}

/** Total sections across the library, counted from the tables of contents. */
export function totalSections(): number {
  return notebooks.reduce((sum, n) => sum + n.contents.length, 0);
}
