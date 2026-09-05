/**
 * The computer science topic tree browsed at /topics.
 *
 * Canonical taxonomy: 12 groups, 64 topics. `docs/topics.md` holds the same
 * table in prose; if the two disagree, one of them is a bug.
 *
 * Three rules this file exists to hold:
 *
 * 1. **A topic belongs to exactly one group.** `assertTree()` proves it rather
 *    than trusting it, and the test suite calls that.
 * 2. **Slugs are flat and permanent.** The group drives the sidebar and nothing
 *    else, so regrouping is free and renaming is a breaking change needing a
 *    redirect.
 * 3. **Nothing claims coverage we do not have.** A topic points at a notebook or
 *    a roadmap only when one genuinely covers it. Everything else is `soon`, and
 *    the UI says so on every row.
 *
 * References are the canonical source or nothing. Where a topic has no single
 * authoritative home (most of the theory papers do not), the field is left off
 * rather than filled with whatever ranks well.
 */

export type TopicState = "notebook" | "roadmap" | "soon";

export type TopicReference = {
  href: string;
  /** e.g. "MDN", "postgresql.org". */
  label: string;
};

export type Topic = {
  /** Flat and permanent. The URL is /topics/<slug>. */
  slug: string;
  title: string;
  /** One line, in the words a student would use. */
  blurb: string;
  reference?: TopicReference;
  /** Slug in `src/lib/learn.ts`, when one of our notebooks covers this. */
  notebook?: string;
  /** Slug in `src/lib/learn/roadmaps.ts`, when a roadmap passes through this. */
  roadmap?: string;
};

export type TopicGroup = {
  slug: string;
  name: string;
  /** One line for the group header. */
  tagline: string;
  topics: Topic[];
};

const MDN = "https://developer.mozilla.org/en-US/docs";

export const groups: TopicGroup[] = [
  {
    slug: "languages",
    name: "Languages",
    tagline: "The ones you will be asked to write in.",
    topics: [
      {
        slug: "c",
        title: "C",
        blurb:
          "Where pointers, memory and the machine stop being abstract. Usually your first real language and the one that explains the others.",
      },
      {
        slug: "c-plus-plus",
        title: "C++",
        blurb:
          "C with objects, templates and a standard library, plus every decision C left to you still left to you.",
      },
      {
        slug: "java",
        title: "Java",
        blurb:
          "Objects, collections, the garbage collector, and threads. The paper most students carry a backlog in.",
      },
      {
        slug: "python",
        title: "Python",
        blurb:
          "The language you reach for when the problem matters more than the ceremony.",
        reference: {
          href: "https://docs.python.org/3/",
          label: "docs.python.org",
        },
      },
      {
        slug: "javascript",
        title: "JavaScript",
        blurb:
          "Closures, async and the event loop. Most people stuck on React are stuck here.",
        reference: { href: `${MDN}/Web/JavaScript`, label: "MDN" },
        roadmap: "react",
      },
      {
        slug: "typescript",
        title: "TypeScript",
        blurb:
          "Types over JavaScript, and what they do and do not check for you.",
        reference: {
          href: "https://www.typescriptlang.org/docs/",
          label: "typescriptlang.org",
        },
      },
      {
        slug: "sql",
        title: "SQL",
        blurb:
          "Declaring what you want instead of how to get it, and why that is harder than it sounds.",
      },
      {
        slug: "go",
        title: "Go",
        blurb:
          "Small language, real concurrency, and a compiler that keeps up with you.",
        reference: { href: "https://go.dev/doc/", label: "go.dev" },
      },
    ],
  },
  {
    slug: "dsa",
    name: "DSA",
    tagline: "The part of the year placement season eats.",
    topics: [
      {
        slug: "arrays-and-strings",
        title: "Arrays and Strings",
        blurb:
          "Contiguous memory, indexing, and the two-pointer tricks built on both.",
      },
      {
        slug: "linked-lists",
        title: "Linked Lists",
        blurb:
          "Pointers made visible. Slow to read, cheap to splice, and endlessly examined.",
      },
      {
        slug: "stacks-and-queues",
        title: "Stacks and Queues",
        blurb:
          "Two orderings that turn out to describe an enormous amount of real software.",
      },
      {
        slug: "trees",
        title: "Trees",
        blurb:
          "Binary trees, BSTs, heaps, and the traversals you will be asked to write by hand.",
      },
      {
        slug: "graphs",
        title: "Graphs",
        blurb:
          "BFS, DFS, shortest paths. Most hard problems are a graph problem wearing a costume.",
      },
      {
        slug: "hashing",
        title: "Hashing",
        blurb:
          "Why a hash map is fast, what a collision costs, and when it stops being fast.",
      },
      {
        slug: "sorting-and-searching",
        title: "Sorting and Searching",
        blurb:
          "The classic algorithms, and the more useful question of which one your language uses.",
      },
      {
        slug: "dynamic-programming",
        title: "Dynamic Programming",
        blurb:
          "Recognising overlapping subproblems, which is the whole difficulty.",
      },
      {
        slug: "complexity",
        title: "Complexity",
        blurb:
          "Big O said properly: what it measures, and what it deliberately ignores.",
      },
    ],
  },
  {
    slug: "maths",
    name: "Maths for CS",
    tagline: "The maths that actually shows up later.",
    topics: [
      {
        slug: "discrete-mathematics",
        title: "Discrete Mathematics",
        blurb:
          "Logic, sets, relations, combinatorics. The grammar under the theory papers.",
      },
      {
        slug: "probability-and-statistics",
        title: "Probability and Statistics",
        blurb:
          "Distributions, expectation, and why averages mislead you about latency.",
      },
      {
        slug: "linear-algebra",
        title: "Linear Algebra",
        blurb:
          "Vectors and matrices, which is also what an embedding is made of.",
      },
      {
        slug: "maths-for-data-science",
        title: "Maths for Data Science",
        blurb:
          "The subset that carries most of the weight: distance, gradients, dimensionality.",
      },
    ],
  },
  {
    slug: "foundations",
    name: "Foundations",
    tagline: "The theory papers, and why they are not busywork.",
    topics: [
      {
        slug: "theory-of-computation",
        title: "Theory of Computation",
        blurb:
          "Automata, grammars, decidability. What a machine can and cannot be asked to do.",
      },
      {
        slug: "compiler-design",
        title: "Compiler Design",
        blurb:
          "Lexing, parsing, intermediate representations, and code generation.",
      },
      {
        slug: "computer-organisation",
        title: "Computer Organisation",
        blurb:
          "Instructions, pipelines, caches. The layer your Big O quietly depends on.",
      },
      {
        slug: "software-engineering",
        title: "Software Engineering",
        blurb:
          "Cohesion, coupling, SOLID, and when two of those principles disagree.",
        notebook: "design-principles",
      },
    ],
  },
  {
    slug: "systems",
    name: "Systems",
    tagline: "How one machine, then many, actually behave.",
    topics: [
      {
        slug: "operating-systems",
        title: "Operating Systems",
        blurb:
          "Processes, threads, scheduling, memory, files. The paper everything else assumes.",
      },
      {
        slug: "concurrency",
        title: "Concurrency",
        blurb:
          "Locks, races, deadlock, and the semaphore this studio is named after.",
      },
      {
        slug: "distributed-systems",
        title: "Distributed Systems",
        blurb:
          "What breaks once one machine becomes several, which is more than you expect.",
      },
      {
        slug: "system-design",
        title: "System Design",
        blurb:
          "Sizing, bottlenecks, and defending a design out loud under questioning.",
        notebook: "scaling",
      },
    ],
  },
  {
    slug: "networking",
    name: "Networking",
    tagline: "How the bytes get from there to here.",
    topics: [
      {
        slug: "computer-networks",
        title: "Computer Networks",
        blurb:
          "The layered model, and what each layer is genuinely responsible for.",
      },
      {
        slug: "tcp-and-ip",
        title: "TCP and IP",
        blurb:
          "Addressing, routing, the handshake, and what reliability actually costs.",
      },
      {
        slug: "http",
        title: "HTTP",
        blurb:
          "Methods, status codes, headers, caching. The protocol your app lives inside.",
        reference: { href: `${MDN}/Web/HTTP`, label: "MDN" },
      },
      {
        slug: "dns-and-domains",
        title: "DNS and Domains",
        blurb:
          "Names to addresses, records, propagation, and why your deploy is not live yet.",
      },
      {
        slug: "sockets",
        title: "Sockets and Real Time",
        blurb:
          "WebSockets, server-sent events, and keeping a connection open honestly.",
        notebook: "real-time-backends",
      },
    ],
  },
  {
    slug: "data",
    name: "Data",
    tagline: "Where it lives, and what it costs to get it back.",
    topics: [
      {
        slug: "dbms",
        title: "DBMS",
        blurb:
          "The theory paper: the relational model, normalisation, ER diagrams, transactions.",
      },
      {
        slug: "postgres",
        title: "Postgres",
        blurb:
          "The same ideas in a real database: types, indexes, EXPLAIN, isolation, vacuum.",
        reference: {
          href: "https://www.postgresql.org/docs/",
          label: "postgresql.org",
        },
        notebook: "postgres",
      },
      {
        slug: "data-modelling",
        title: "Data Modelling",
        blurb:
          "Choosing the shape before you write the query, which decides everything after.",
      },
      {
        slug: "caching",
        title: "Caching",
        blurb:
          "A bet about staleness. Where caches live, and every way they betray you.",
        notebook: "caching",
      },
      {
        slug: "object-storage",
        title: "Object Storage",
        blurb:
          "Files at scale: uploads, streaming, and how much memory that actually uses.",
        notebook: "object-storage",
      },
      {
        slug: "data-at-scale",
        title: "Data at Scale",
        blurb:
          "Ingestion, queues, partial failure, and what 'failed' really means.",
        notebook: "large-scale-ingestion",
      },
    ],
  },
  {
    slug: "building",
    name: "Building",
    tagline: "Turning all of it into something that runs.",
    topics: [
      {
        slug: "web-fundamentals",
        title: "Web Fundamentals",
        blurb:
          "HTML, CSS, the DOM, and what the browser is doing before any framework arrives.",
        reference: { href: `${MDN}/Web`, label: "MDN" },
      },
      {
        slug: "frontend-and-react",
        title: "Frontend and React",
        blurb:
          "Components, state, effects, and shipping something you can defend in a viva.",
        reference: { href: "https://react.dev/learn", label: "react.dev" },
        roadmap: "react",
      },
      {
        slug: "backend-and-apis",
        title: "Backend and APIs",
        blurb:
          "Resources, URLs, methods, versioning. An interface two strangers agree on.",
        notebook: "rest-api-design",
      },
      {
        slug: "testing",
        title: "Testing",
        blurb:
          "What is worth testing, what is not, and why most student projects have neither.",
      },
      {
        slug: "deployment",
        title: "Deployment",
        blurb:
          "Getting it onto a real URL, which is the difference between a demo and a project.",
      },
    ],
  },
  {
    slug: "security",
    name: "Security",
    tagline: "The half that gets projects marked down.",
    topics: [
      {
        slug: "web-vulnerabilities",
        title: "Web Vulnerabilities",
        blurb:
          "Injection, XSS, CSRF: three contexts, the character that breaks each, one fix.",
        notebook: "security",
      },
      {
        slug: "auth-and-authorisation",
        title: "Auth and Authorisation",
        blurb:
          "Logging in is the easy half. Checking permission on every request is the other.",
        notebook: "security",
      },
      {
        slug: "cryptography",
        title: "Cryptography",
        blurb:
          "Hashing, signing, encryption, and knowing which one your problem needs.",
      },
      {
        slug: "network-security",
        title: "Network Security",
        blurb:
          "TLS, certificates, and what an attacker on the wire can and cannot see.",
      },
    ],
  },
  {
    slug: "cloud",
    name: "Cloud and DevOps",
    tagline: "Someone else's computer, and how you talk to it.",
    topics: [
      {
        slug: "docker",
        title: "Docker",
        blurb:
          "Images, containers, and why 'works on my machine' stopped being an excuse.",
        reference: {
          href: "https://docs.docker.com/",
          label: "docs.docker.com",
        },
      },
      {
        slug: "kubernetes",
        title: "Kubernetes",
        blurb:
          "Scheduling containers across machines, and whether you need it yet.",
        reference: {
          href: "https://kubernetes.io/docs/home/",
          label: "kubernetes.io",
        },
      },
      {
        slug: "ci-cd",
        title: "CI and CD",
        blurb:
          "A machine that checks and ships your work, so you stop doing it by hand.",
      },
      {
        slug: "aws",
        title: "AWS",
        blurb:
          "The handful of services that carry most real systems, not the other two hundred.",
      },
      {
        slug: "observability",
        title: "Observability",
        blurb:
          "Logs, metrics, traces. Knowing what production is doing without guessing.",
      },
    ],
  },
  {
    slug: "ai",
    name: "AI",
    tagline: "What happens after you press enter.",
    topics: [
      {
        slug: "how-llms-work",
        title: "How LLMs Work",
        blurb:
          "Tokens, context, prediction, and why confidence is not a signal of correctness.",
      },
      {
        slug: "embeddings-and-retrieval",
        title: "Embeddings and Retrieval",
        blurb:
          "Meaning as numbers, nearest neighbours, and why your RAG answers the wrong thing.",
      },
      {
        slug: "mcp",
        title: "MCP",
        blurb:
          "A protocol: your tool exposes functions a model may call. The rest is plumbing.",
        reference: {
          href: "https://modelcontextprotocol.io/",
          label: "modelcontextprotocol.io",
        },
      },
      {
        slug: "agents",
        title: "Agents",
        blurb:
          "A loop. Pick a tool, read the result, pick again, stop. That is the whole trick.",
      },
      {
        slug: "working-with-claude",
        title: "Working with Claude",
        blurb:
          "Building fast with an agent and still being able to answer for every line.",
      },
    ],
  },
  {
    slug: "toolbox",
    name: "Toolbox",
    tagline: "The things nobody teaches and everybody needs.",
    topics: [
      {
        slug: "git",
        title: "Git",
        blurb:
          "Commits, branches, merges, and what to do the moment it goes wrong.",
        reference: { href: "https://git-scm.com/doc", label: "git-scm.com" },
      },
      {
        slug: "linux-and-the-shell",
        title: "Linux and the Shell",
        blurb:
          "Files, permissions, processes, pipes. The environment your code will run in.",
      },
      {
        slug: "shell-scripting",
        title: "Shell Scripting",
        blurb: "Automating the thing you have now typed four times.",
      },
      {
        slug: "debugging",
        title: "Debugging",
        blurb:
          "Reading a stack trace, bisecting, and forming a hypothesis instead of guessing.",
      },
      {
        slug: "the-editor",
        title: "The Editor",
        blurb:
          "Knowing your tools well enough that they stop being in the way.",
      },
    ],
  },
];

/** What actually exists behind a topic. Derived, never stored twice. */
export function topicState(topic: Topic): TopicState {
  if (topic.notebook) return "notebook";
  if (topic.roadmap) return "roadmap";
  return "soon";
}

/** Every topic, flat, in group order. */
export function allTopics(): Topic[] {
  return groups.flatMap((group) => group.topics);
}

/** A topic and the group it sits in. */
export function getTopic(
  slug: string,
): { topic: Topic; group: TopicGroup } | undefined {
  for (const group of groups) {
    const topic = group.topics.find((t) => t.slug === slug);
    if (topic) return { topic, group };
  }
  return undefined;
}

export function getGroup(slug: string): TopicGroup | undefined {
  return groups.find((g) => g.slug === slug);
}

export function countTopics(): number {
  return allTopics().length;
}

/** How many topics have something of ours behind them. */
export function countCovered(): number {
  return allTopics().filter((t) => topicState(t) !== "soon").length;
}

/**
 * Prove the two invariants rather than trusting them: every slug unique across
 * the whole tree, and every group slug unique. Called by the test suite, so a
 * duplicate fails CI instead of quietly shadowing a route.
 */
export function assertTree(): void {
  const seen = new Map<string, string>();
  for (const group of groups) {
    for (const topic of group.topics) {
      const previous = seen.get(topic.slug);
      if (previous) {
        throw new Error(
          `Topic "${topic.slug}" is in both "${previous}" and "${group.slug}". A topic belongs to exactly one group.`,
        );
      }
      seen.set(topic.slug, group.slug);
    }
  }

  const groupSlugs = new Set(groups.map((g) => g.slug));
  if (groupSlugs.size !== groups.length) {
    throw new Error("Two groups share a slug.");
  }
}
