/**
 * The topic tree browsed at /topics.
 *
 * **Subjects on the rail, angles in the sidebar.** The first version had
 * subject-areas on the rail (Languages, DSA, Maths) and subjects as leaves, so
 * `java` was a single page and the sidebar showed all twelve areas at once.
 * That is a library catalogue, not a place to look something up.
 *
 * You pick the subject you are working in, and its channels are *ways in*:
 * what breaks, what gets asked, where people freeze. Deliberately not a
 * beginner ladder. Nobody arrives at `#memory-and-gc` needing chapter one, they
 * arrive because a heap dump is open on the other monitor.
 *
 * Rules this file holds:
 *
 * 1. **Channel names are situations, not syllabus entries.** `what-breaks-in-
 *    production`, not `1-introduction`. If a name could head a textbook
 *    chapter, it is the wrong name.
 * 2. **Slugs are permanent.** A channel's URL is `/topics/<subject>/<channel>`.
 *    Moving a channel between subjects breaks a link, so it needs a redirect.
 * 3. **Nothing claims coverage we do not have.** A channel points at a notebook
 *    or roadmap only when one genuinely covers it; everything else is `soon` and
 *    the page says so.
 * 4. **References are canonical or absent.** Where no single authoritative
 *    source exists, and for most of these there is not one, the field is left
 *    off rather than filled with whatever ranks well.
 */

export type ChannelState = "notebook" | "roadmap" | "soon";

export type Reference = {
  href: string;
  /** e.g. "MDN", "postgresql.org". */
  label: string;
};

export type Channel = {
  /** Unique within its subject. The URL is /topics/<subject>/<slug>. */
  slug: string;
  title: string;
  /** One line, in the words someone with the problem would use. */
  blurb: string;
  reference?: Reference;
  /** Slug in `src/lib/learn.ts`, when one of our notebooks covers this. */
  notebook?: string;
  /** Slug in `src/lib/learn/roadmaps.ts`, when a roadmap passes through this. */
  roadmap?: string;
};

export type Subject = {
  slug: string;
  name: string;
  /** Key into `group-icons.tsx`. */
  icon: string;
  /** One line for the sidebar header and the index. */
  blurb: string;
  channels: Channel[];
};

const MDN = "https://developer.mozilla.org/en-US/docs";

export const subjects: Subject[] = [
  {
    slug: "c",
    name: "C",
    icon: "c",
    blurb: "Pointers, memory, and the machine underneath everything else.",
    channels: [
      {
        slug: "pointers-in-practice",
        title: "Pointers in practice",
        blurb:
          "Where the mental model breaks: arrays decaying, ownership nobody wrote down, and the difference between a pointer and the thing it points at.",
      },
      {
        slug: "undefined-behaviour",
        title: "Undefined behaviour",
        blurb:
          "The compiler is allowed to do anything at all. What that means for code that works today and stops working at -O2.",
      },
      {
        slug: "memory-bugs",
        title: "Memory bugs, and how they present",
        blurb:
          "Leaks, double frees, use-after-free. Almost none of them crash where the mistake is, which is why they are hard.",
      },
      {
        slug: "interview-questions",
        title: "What gets asked",
        blurb:
          "The C questions that come up, and what the examiner is checking.",
      },
    ],
  },
  {
    slug: "cpp",
    name: "C++",
    icon: "cpp",
    blurb: "Everything C left to you, plus the machinery to manage it.",
    channels: [
      {
        slug: "ownership-and-raii",
        title: "Ownership and RAII",
        blurb:
          "Who frees this, and when. The one idea that makes the rest of the language make sense.",
      },
      {
        slug: "what-the-compiler-generates",
        title: "What the compiler generates for you",
        blurb:
          "Copy, move, and the constructors you did not write but are using anyway.",
      },
      {
        slug: "templates-when-they-help",
        title: "Templates, when they help",
        blurb:
          "And when they turn a build into a four-minute wait and an error nobody can read.",
      },
      {
        slug: "interview-questions",
        title: "What gets asked",
        blurb: "The C++ questions that come up, and the ones that are traps.",
      },
    ],
  },
  {
    slug: "java",
    name: "Java",
    icon: "java",
    blurb:
      "The paper most students carry a backlog in, and the one most jobs want.",
    channels: [
      {
        slug: "memory-and-gc",
        title: "Memory and the collector",
        blurb:
          "Heap, stack, generations, and why a pause happened at the worst moment.",
      },
      {
        slug: "concurrency-traps",
        title: "Concurrency traps",
        blurb:
          "synchronized, volatile, and the race that only appears on the marker's machine.",
      },
      {
        slug: "collections-in-anger",
        title: "Collections in anger",
        blurb:
          "Which one to reach for, what it costs, and what happens when you mutate while iterating.",
      },
      {
        slug: "equals-and-hashcode",
        title: "equals and hashCode",
        blurb:
          "The contract between them, and the bug you get in a HashMap when you break it.",
      },
      {
        slug: "interview-questions",
        title: "What gets asked",
        blurb: "The Java questions that come up in nearly every round.",
      },
      {
        slug: "viva-defence",
        title: "Defending it in a viva",
        blurb:
          "Saying why you used an interface there, out loud, without hedging.",
      },
    ],
  },
  {
    slug: "python",
    name: "Python",
    icon: "python",
    blurb: "Quick to write, and quick to write something surprising.",
    channels: [
      {
        slug: "mutable-defaults",
        title: "Mutable defaults and other gotchas",
        blurb:
          "The handful of behaviours that bite everyone once, and are obvious forever after.",
      },
      {
        slug: "the-gil-in-practice",
        title: "The GIL, in practice",
        blurb:
          "What it actually stops you doing, and why your threads did not go faster.",
      },
      {
        slug: "packaging",
        title: "Packaging, and why it hurts",
        blurb:
          "Virtual environments, versions, and the reason it runs for you and not for them.",
      },
      {
        slug: "interview-questions",
        title: "What gets asked",
        blurb:
          "Python questions, including the ones that are really CS questions.",
        reference: {
          href: "https://docs.python.org/3/",
          label: "docs.python.org",
        },
      },
    ],
  },
  {
    slug: "javascript",
    name: "JavaScript",
    icon: "javascript",
    blurb: "Most people stuck on a framework are stuck here instead.",
    channels: [
      {
        slug: "this-and-closures",
        title: "this, and closures",
        blurb:
          "Two features that explain most confusing JavaScript, including every hook you will write.",
        reference: {
          href: `${MDN}/Web/JavaScript/Guide/Closures`,
          label: "MDN",
        },
        roadmap: "react",
      },
      {
        slug: "async-in-practice",
        title: "Async, in practice",
        blurb:
          "The event loop, and why your data is undefined on the first render.",
        reference: {
          href: `${MDN}/Web/JavaScript/Guide/Using_promises`,
          label: "MDN",
        },
        roadmap: "react",
      },
      {
        slug: "equality-and-coercion",
        title: "Equality and coercion",
        blurb:
          "Why == and === are different questions, and which one you meant.",
        reference: {
          href: `${MDN}/Web/JavaScript/Guide/Equality_comparisons_and_sameness`,
          label: "MDN",
        },
      },
      {
        slug: "interview-questions",
        title: "What gets asked",
        blurb: "Closures, hoisting, event loop. The same four, forever.",
      },
    ],
  },
  {
    slug: "typescript",
    name: "TypeScript",
    icon: "typescript",
    blurb: "Types over JavaScript, and a clear line around what they check.",
    channels: [
      {
        slug: "what-types-do-not-check",
        title: "What types do not check",
        blurb:
          "Everything at the edges: API responses, JSON, forms. The compiler believed you.",
      },
      {
        slug: "narrowing",
        title: "Narrowing, in practice",
        blurb:
          "Getting from unknown to something usable without reaching for an assertion.",
      },
      {
        slug: "generics-when-you-need-them",
        title: "Generics, when you need them",
        blurb: "Which is later than most tutorials suggest.",
        reference: {
          href: "https://www.typescriptlang.org/docs/",
          label: "typescriptlang.org",
        },
      },
    ],
  },
  {
    slug: "go",
    name: "Go",
    icon: "go",
    blurb: "Small language, real concurrency, few places to hide.",
    channels: [
      {
        slug: "goroutines-and-leaks",
        title: "Goroutines, and leaking them",
        blurb:
          "Cheap to start, easy to forget, and nothing tells you they piled up.",
      },
      {
        slug: "errors-as-values",
        title: "Errors as values",
        blurb:
          "What it buys, what it costs, and wrapping without losing the cause.",
      },
      {
        slug: "interfaces-in-practice",
        title: "Interfaces, in practice",
        blurb:
          "Accept interfaces, return structs, and why the nil check surprised you.",
        reference: { href: "https://go.dev/doc/", label: "go.dev" },
      },
    ],
  },
  {
    slug: "dsa",
    name: "DSA",
    icon: "dsa",
    blurb: "The part of the year placement season eats.",
    channels: [
      {
        slug: "patterns-that-repeat",
        title: "The patterns that actually repeat",
        blurb:
          "Two pointers, sliding window, the handful that cover most of what you will be shown.",
      },
      {
        slug: "where-people-freeze",
        title: "Where people freeze",
        blurb:
          "Not the algorithm. Recognising which problem you are looking at, under a clock.",
      },
      {
        slug: "complexity-in-interviews",
        title: "Complexity, out loud",
        blurb:
          "Stating it correctly and confidently, including what Big O deliberately ignores.",
      },
      {
        slug: "the-questions-that-get-asked",
        title: "The questions that get asked",
        blurb:
          "The real set, and what a good answer sounds like rather than looks like.",
        notebook: "question-bank",
      },
      {
        slug: "whiteboard-without-panic",
        title: "Whiteboarding without panic",
        blurb: "Thinking out loud is a skill, and it is the one being marked.",
      },
    ],
  },
  {
    slug: "operating-systems",
    name: "Operating Systems",
    icon: "operating-systems",
    blurb: "The paper everything else quietly assumes you did.",
    channels: [
      {
        slug: "processes-vs-threads",
        title: "Processes and threads, properly",
        blurb:
          "Said without the word lightweight, which is where most answers go wrong.",
      },
      {
        slug: "what-the-scheduler-does",
        title: "What the scheduler does to you",
        blurb: "Why your timing is not reproducible and your benchmark lied.",
      },
      {
        slug: "memory-you-did-not-allocate",
        title: "Memory you did not allocate",
        blurb: "Virtual memory, paging, and where the resident size came from.",
      },
      {
        slug: "interview-questions",
        title: "What gets asked",
        blurb:
          "Deadlock, scheduling, paging. Reliably these, reliably in this order.",
      },
    ],
  },
  {
    slug: "networks",
    name: "Networks",
    icon: "networks",
    blurb: "How the bytes get there, and why sometimes they do not.",
    channels: [
      {
        slug: "what-happens-on-a-request",
        title: "What happens on one request",
        blurb:
          "DNS, TCP, TLS, HTTP, in order. The answer to the most-asked interview question there is.",
        reference: { href: `${MDN}/Web/HTTP`, label: "MDN" },
      },
      {
        slug: "latency-you-can-feel",
        title: "Latency you can feel",
        blurb:
          "Where the time actually goes, and which fixes are worth anything.",
      },
      {
        slug: "tls-and-certificates",
        title: "TLS and certificates",
        blurb:
          "What an attacker on the wire can and cannot see, and why it expired.",
      },
      {
        slug: "the-network-tab",
        title: "Debugging with the network tab",
        blurb:
          "It answers more questions than any tutorial, and almost nobody opens it.",
      },
    ],
  },
  {
    slug: "databases",
    name: "Databases",
    icon: "databases",
    blurb: "The theory paper, and the thing your project actually runs on.",
    channels: [
      {
        slug: "normalisation-for-the-exam",
        title: "Normalisation, for the exam",
        blurb: "1NF to BCNF said in a way you can reproduce under pressure.",
      },
      {
        slug: "indexes-and-slow-queries",
        title: "Indexes, and why it crawls",
        blurb:
          "What an index is, what it costs on write, and reading EXPLAIN without guessing.",
        notebook: "postgres",
      },
      {
        slug: "transactions-and-isolation",
        title: "Transactions and isolation",
        blurb:
          "What ACID buys, and the anomaly each isolation level still allows.",
        notebook: "postgres",
      },
      {
        slug: "the-n-plus-one",
        title: "The N+1",
        blurb:
          "The most common performance bug in student projects, and in real ones.",
        notebook: "postgres",
      },
      {
        slug: "interview-questions",
        title: "What gets asked",
        blurb: "Joins, indexes, isolation, and one normalisation question.",
        reference: {
          href: "https://www.postgresql.org/docs/",
          label: "postgresql.org",
        },
      },
      {
        slug: "viva-defence",
        title: "Defending your schema",
        blurb: "Why this table, why this key, why not one big table. Out loud.",
      },
    ],
  },
  {
    slug: "system-design",
    name: "System Design",
    icon: "system-design",
    blurb: "Sizing, bottlenecks, and defending a drawing under questioning.",
    channels: [
      {
        slug: "sizing-before-designing",
        title: "Sizing before designing",
        blurb:
          "Numbers first. Most bad designs are answers to an unasked question.",
        notebook: "scaling",
      },
      {
        slug: "caching-decisions",
        title: "Caching is a bet",
        blurb:
          "Where caches live, what staleness you accepted, and every way it betrays you.",
        notebook: "caching",
      },
      {
        slug: "queues-and-backpressure",
        title: "Queues and backpressure",
        blurb:
          "What happens when the producer is faster than the consumer, which it will be.",
        notebook: "large-scale-ingestion",
      },
      {
        slug: "the-interview-format",
        title: "The interview format",
        blurb:
          "Forty-five minutes, a whiteboard, and someone deliberately vague.",
      },
    ],
  },
  {
    slug: "theory",
    name: "Theory and Compilers",
    icon: "theory",
    blurb: "Automata, grammars, and what a machine can be asked to do.",
    channels: [
      {
        slug: "automata-that-matter",
        title: "The automata that matter",
        blurb: "Which parts show up again later, and which are exam-only.",
      },
      {
        slug: "parsing-in-practice",
        title: "Parsing, in practice",
        blurb: "Lexing and parsing, and where you meet them outside the paper.",
      },
      {
        slug: "what-the-optimiser-does",
        title: "What the optimiser does",
        blurb: "Why your benchmark disappeared and the loop was deleted.",
      },
    ],
  },
  {
    slug: "maths",
    name: "Maths for CS",
    icon: "maths",
    blurb: "The subset that shows up again after the exam.",
    channels: [
      {
        slug: "discrete-for-the-exam",
        title: "Discrete maths, for the exam",
        blurb:
          "Logic, sets, relations, counting. The grammar under the theory papers.",
      },
      {
        slug: "probability-that-shows-up",
        title: "The probability that shows up",
        blurb:
          "Expectation, distributions, and why an average misleads you about latency.",
      },
      {
        slug: "linear-algebra-for-ml",
        title: "Linear algebra, for ML",
        blurb:
          "Vectors, matrices, distance. Which is also what an embedding is made of.",
      },
    ],
  },
  {
    slug: "frontend",
    name: "Frontend",
    icon: "frontend",
    blurb: "React, and the browser it is sitting on.",
    channels: [
      {
        slug: "state-that-gets-away",
        title: "State that gets away from you",
        blurb:
          "UI as a function of state, and what happens when you fight that.",
        reference: { href: "https://react.dev/learn", label: "react.dev" },
        roadmap: "react",
      },
      {
        slug: "effects-you-did-not-need",
        title: "The effects you did not need",
        blurb:
          "Most useEffect is wrong, including in the tutorial you learned it from.",
        reference: {
          href: "https://react.dev/learn/you-might-not-need-an-effect",
          label: "react.dev",
        },
        roadmap: "react",
      },
      {
        slug: "what-costs-a-render",
        title: "What a render actually costs",
        blurb:
          "Measure before memoising, and note the compiler now writes most of it.",
        roadmap: "react",
      },
      {
        slug: "forms-and-validation",
        title: "Forms, and validating them twice",
        blurb:
          "Where everyone fights the framework, and the rule that stops it.",
      },
      {
        slug: "interview-questions",
        title: "What gets asked",
        blurb:
          "Keys, reconciliation, hooks rules, and one question about the DOM.",
      },
    ],
  },
  {
    slug: "backend",
    name: "Backend and APIs",
    icon: "backend",
    blurb: "An interface two strangers have to agree on.",
    channels: [
      {
        slug: "designing-an-endpoint",
        title: "Designing one endpoint",
        blurb: "Nouns, URLs, methods. Getting one right teaches you the rest.",
        notebook: "rest-api-design",
      },
      {
        slug: "errors-and-status-codes",
        title: "Errors, and status codes",
        blurb:
          "What to return, what to log, and what the caller can actually do about it.",
        notebook: "rest-api-design",
      },
      {
        slug: "what-breaks-under-load",
        title: "What breaks under load",
        blurb:
          "Connections, pools, timeouts, and the failure that only appears at scale.",
        notebook: "scaling",
      },
      {
        slug: "real-time",
        title: "Keeping a connection open",
        blurb:
          "WebSockets and server-sent events, and what a deploy does to both.",
        notebook: "real-time-backends",
      },
      {
        slug: "interview-questions",
        title: "What gets asked",
        blurb:
          "REST versus RPC, idempotency, versioning, and one caching question.",
      },
    ],
  },
  {
    slug: "security",
    name: "Security",
    icon: "security",
    blurb: "The half that gets projects marked down.",
    channels: [
      {
        slug: "injection-in-three-contexts",
        title: "Injection, in three contexts",
        blurb:
          "The character that breaks each, and the one structural fix they share.",
        notebook: "security",
      },
      {
        slug: "auth-vs-authorisation",
        title: "Logging in is the easy half",
        blurb:
          "Checking permission on every request is the half that gets forgotten.",
        notebook: "security",
      },
      {
        slug: "secrets-and-where-they-leak",
        title: "Secrets, and where they leak",
        blurb:
          "Git history, client bundles, logs, error messages. Usually all four.",
      },
      {
        slug: "interview-questions",
        title: "What gets asked",
        blurb:
          "XSS, CSRF, hashing versus encryption, and how you store a password.",
      },
    ],
  },
  {
    slug: "cloud",
    name: "Cloud and DevOps",
    icon: "cloud",
    blurb: "Someone else's computer, and how you talk to it.",
    channels: [
      {
        slug: "containers-in-practice",
        title: "Containers, in practice",
        blurb: "Images, layers, and why yours is 1.2GB.",
        reference: {
          href: "https://docs.docker.com/",
          label: "docs.docker.com",
        },
      },
      {
        slug: "ci-that-does-not-lie",
        title: "CI that does not lie to you",
        blurb:
          "A green build that means something, and what to do when it does not.",
      },
      {
        slug: "what-production-is-doing",
        title: "Knowing what production is doing",
        blurb:
          "Logs, metrics, traces, and which of the three answers your question.",
      },
      {
        slug: "cost-surprises",
        title: "The bill",
        blurb: "Where the money actually goes, and the free tier that was not.",
      },
    ],
  },
  {
    slug: "testing",
    name: "Testing",
    icon: "testing",
    blurb: "What is worth testing, and what is theatre.",
    channels: [
      {
        slug: "what-is-worth-testing",
        title: "What is worth testing",
        blurb: "And what only makes the coverage number go up.",
      },
      {
        slug: "tests-that-fail-usefully",
        title: "Tests that fail usefully",
        blurb: "A failure should name the bug, not just say something changed.",
      },
      {
        slug: "flaky-tests",
        title: "Flaky tests",
        blurb:
          "Almost always time, order or shared state. Almost never the framework.",
      },
    ],
  },
  {
    slug: "ai",
    name: "AI",
    icon: "ai",
    blurb: "What is actually happening after you press enter.",
    channels: [
      {
        slug: "how-llms-work",
        title: "How an LLM actually works",
        blurb:
          "Tokens, context, prediction, and why confidence signals nothing.",
      },
      {
        slug: "retrieval-that-returns-the-wrong-thing",
        title: "Retrieval that returns the wrong thing",
        blurb:
          "Nearest is not the same as correct. Where every RAG project breaks.",
      },
      {
        slug: "what-mcp-actually-is",
        title: "What MCP actually is",
        blurb:
          "A protocol. Your tool exposes functions a model may call, and the rest is plumbing.",
        reference: {
          href: "https://modelcontextprotocol.io/",
          label: "modelcontextprotocol.io",
        },
      },
      {
        slug: "agents-in-practice",
        title: "Agents, in practice",
        blurb:
          "A loop: pick a tool, read the result, pick again. And where it goes wrong.",
      },
      {
        slug: "building-with-claude-honestly",
        title: "Building with Claude, honestly",
        blurb:
          "Moving fast with an agent and still answering for every line of it.",
      },
    ],
  },
  {
    slug: "toolbox",
    name: "Git and the Shell",
    icon: "toolbox",
    blurb: "The tools nobody teaches and everybody needs.",
    channels: [
      {
        slug: "git-when-it-goes-wrong",
        title: "Git, when it goes wrong",
        blurb:
          "Detached heads, bad merges, and getting the work back. It is nearly always there.",
        reference: { href: "https://git-scm.com/doc", label: "git-scm.com" },
      },
      {
        slug: "shell-that-pays-off",
        title: "The shell commands that pay off",
        blurb:
          "The dozen worth knowing properly, and pipes that turn them into one tool.",
      },
      {
        slug: "scripting-the-repeated-thing",
        title: "Scripting the thing you typed four times",
        blurb: "Where automation starts, and where it stops being worth it.",
      },
    ],
  },
  {
    slug: "debugging",
    name: "Debugging",
    icon: "debugging",
    blurb: "The skill nobody is taught and everybody is judged on.",
    channels: [
      {
        slug: "reading-a-stack-trace",
        title: "Reading a stack trace",
        blurb: "Where the error is thrown is rarely where the mistake is.",
      },
      {
        slug: "bisecting-a-problem",
        title: "Bisecting a problem",
        blurb: "Halving the search space beats staring at it, every time.",
      },
      {
        slug: "hypothesis-not-guessing",
        title: "Hypothesis, not guessing",
        blurb: "One change at a time, and a prediction before you run it.",
      },
    ],
  },
  {
    slug: "interviews",
    name: "Interviews and Viva",
    icon: "interviews",
    blurb: "Explaining work you did, to someone deciding about you.",
    channels: [
      {
        slug: "the-viva-test",
        title: "The viva test",
        blurb:
          "Point at any line and say why it is there. If you cannot, you do not own it yet.",
      },
      {
        slug: "explaining-your-own-project",
        title: "Explaining your own project",
        blurb: "Two minutes, no jargon, and one defensible decision.",
      },
      {
        slug: "placement-season",
        title: "Placement season",
        blurb:
          "You can write it and freeze when asked. Those are different skills.",
      },
      {
        slug: "what-they-actually-ask",
        title: "What they actually ask",
        blurb:
          "Lifted from our own question bank rather than invented for a listicle.",
        notebook: "question-bank",
      },
    ],
  },
];

/** What actually exists behind a channel. Derived, never stored twice. */
export function channelState(channel: Channel): ChannelState {
  if (channel.notebook) return "notebook";
  if (channel.roadmap) return "roadmap";
  return "soon";
}

export function getSubject(slug: string): Subject | undefined {
  return subjects.find((s) => s.slug === slug);
}

export function getChannel(
  subjectSlug: string,
  channelSlug: string,
): { subject: Subject; channel: Channel } | undefined {
  const subject = getSubject(subjectSlug);
  const channel = subject?.channels.find((c) => c.slug === channelSlug);
  return subject && channel ? { subject, channel } : undefined;
}

/** Every channel, flat, with its subject. */
export function allChannels(): { subject: Subject; channel: Channel }[] {
  return subjects.flatMap((subject) =>
    subject.channels.map((channel) => ({ subject, channel })),
  );
}

export function countChannels(): number {
  return allChannels().length;
}

/** How many channels have something of ours behind them. */
export function countCovered(): number {
  return allChannels().filter(({ channel }) => channelState(channel) !== "soon")
    .length;
}

/**
 * Prove the invariants rather than trusting them. Called by the test suite, so
 * a duplicate fails CI instead of quietly shadowing a route.
 */
export function assertTree(): void {
  const subjectSlugs = new Set<string>();
  for (const subject of subjects) {
    if (subjectSlugs.has(subject.slug)) {
      throw new Error(`Two subjects share the slug "${subject.slug}".`);
    }
    subjectSlugs.add(subject.slug);

    const channelSlugs = new Set<string>();
    for (const channel of subject.channels) {
      if (channelSlugs.has(channel.slug)) {
        throw new Error(
          `"${subject.slug}" has two channels called "${channel.slug}".`,
        );
      }
      channelSlugs.add(channel.slug);
    }
  }
}
