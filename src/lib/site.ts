/**
 * Central site configuration — single source of truth for copy and links.
 * Edit values here; components read from this file.
 *
 * Items marked TODO need a real value from Shahid before launch.
 */

export type ProjectDetail = {
  /** One-sentence summary shown under the title on the detail page. */
  lede: string;
  /** Intro paragraphs. */
  overview: string[];
  /** Deep-dive sections. */
  features: { title: string; body: string }[];
  /** Quick-fact sidebar (label/value pairs). */
  facts: { label: string; value: string }[];
};

export type Project = {
  name: string;
  tagline: string;
  description: string;
  tags: string[];
  /** GitHub repository URL. */
  href: string;
  /** Optional banner image (path under /public), ~1.9:1 aspect. */
  image?: string;
  /** Optional: shown as a small monospace label on the card, e.g. "v0.3". */
  status?: string;
  featured?: boolean;
  /** When set, the card links to /projects/<slug> and a detail page is built. */
  slug?: string;
  /** Long-form content for the detail page. */
  detail?: ProjectDetail;
};

export type TeamMember = {
  name: string;
  /** URL slug for the detail page (/team/<slug>). */
  slug: string;
  /** Primary title/role — edit freely. */
  role: string;
  /** Optional second line: the broader hat / contribution they wear. */
  focus?: string;
  /** Short one-line description shown on the card. */
  description?: string;
  /** Longer bio paragraphs for the detail page. DRAFT — edit freely. */
  bio?: string[];
  /** Skills / focus areas shown as chips on the detail page. */
  skills?: string[];
  /** Work experience (paste from LinkedIn). Rendered only when present. */
  experience?: {
    role: string;
    company: string;
    /** e.g. "2023 - Present" or "Jun 2022 - Jan 2024". */
    period?: string;
    summary?: string;
  }[];
  /** Projects (paste from LinkedIn). Rendered only when present. */
  projects?: { name: string; description?: string; href?: string }[];
  /** Certifications (paste from LinkedIn). Rendered only when present. */
  certifications?: {
    name: string;
    issuer?: string;
    /** Issue year or date. */
    year?: string;
    href?: string;
  }[];
  /** Optional contact / profile links (omit any to hide that icon). */
  email?: string;
  linkedin?: string;
  github?: string;
};

export type CTA = { label: string; href: string };

export type Feature = { title: string; body: string };

export type FeatureItem = { label: string; body: string };

export type Testimonial = { quote: string; name: string; role: string };

export type FooterColumn = {
  title: string;
  links: { label: string; href: string }[];
};

export type SiteConfig = {
  name: string;
  wordmark: string;
  eyebrow: string;
  role: string;
  tagline: string;
  email: string;
  github: string;
  linkedin: string;
  org: string;
  /** Public Instagram profile URL ("" hides Instagram links/feed). */
  instagram: string;
  /** Handle without the @, used for labels. */
  instagramHandle: string;
  formspreeId: string;
  about: string[];
  /** Product-led landing hero. */
  hero: {
    headline: string;
    /** Trailing phrase rendered with the accent gradient. */
    headlineAccent: string;
    subhead: string;
    primary: CTA;
    secondary: CTA;
  };
  /** Tech "built with" strip under the hero. */
  builtWith: string[];
  /** Studio domains, shown as the 3 use-case columns. */
  capabilities: Feature[];
  /** How we work, shown in the feature showcase. */
  features: Feature[];
  /** Client/company names for the "used by" row (placeholders for now). */
  clients: string[];
  /** Dense capability list grid. */
  featureList: FeatureItem[];
  /** Testimonials wall (placeholders for now). */
  testimonials: Testimonial[];
  /** Footer link columns. */
  footerColumns: FooterColumn[];
};

export const site: SiteConfig = {
  name: "Binary Semaphore",
  /** Org / wordmark shown in the header and used as the hero headline. */
  wordmark: "Binary Semaphore",
  /** Small status line above the hero headline. */
  eyebrow: "AI · distributed systems · developer tools",
  /** One-line studio statement (hero subhead + metadata). */
  role: "A small software team building AI and distributed systems",
  tagline:
    "A small software team working across AI, distributed systems, and developer tools.",

  // --- Links -------------------------------------------------------------
  // LinkedIn is hidden everywhere until a real URL is set (no broken links).
  email: "razashahid532@gmail.com",
  github: "https://github.com/shahid-io",
  // Personal LinkedIn hidden — set a company LinkedIn URL here to show the link.
  linkedin: "",
  org: "https://github.com/BiSemaphore",
  instagram: "https://www.instagram.com/binary.semaphore/",
  instagramHandle: "binary.semaphore",

  // --- Contact form ------------------------------------------------------
  // When empty, the contact section falls back to a mailto button so the
  // site works immediately. Paste your Formspree form ID (the part after
  // "/f/" in your endpoint) to switch on the real form.
  formspreeId: "", // TODO: e.g. "xrgkabcd" from https://formspree.io/f/xrgkabcd

  // --- Behind the work ---------------------------------------------------
  // DRAFT — edit freely. Frames the maker behind the studio.
  about: [
    "Binary Semaphore is a small software team, named after the simplest synchronization primitive there is. We treat software the same way: small, well-defined parts that coordinate cleanly and hide the right details behind each interface.",
    "We work across applied AI, distributed systems, and developer tools. We spend our effort on the essential complexity of a problem and refuse to let the accidental kind pile up, designing for reliability and maintainability from the start rather than bolting them on later. The current focus is inode, a CLI knowledge base that retrieves by meaning, written in Go.",
  ],

  // --- Landing hero ------------------------------------------------------
  hero: {
    headline: "We build software for",
    headlineAccent: "AI and distributed systems",
    subhead:
      "A small team that cares about the fundamentals: correct concurrency, honest abstractions, and systems that stay reliable as they scale.",
    primary: { label: "See our work", href: "/#projects" },
    secondary: { label: "View on GitHub", href: "https://github.com/BiSemaphore" },
  },

  builtWith: ["Go", "Python", "TypeScript", "PostgreSQL", "Kafka", "Kubernetes", "LLMs"],

  // What we work on, shown as quick cards in the hero.
  capabilities: [
    {
      title: "Applied AI",
      body: "Retrieval, embeddings, and language models grounded in your own data, applied where they earn their keep rather than where they look impressive.",
    },
    {
      title: "Distributed systems",
      body: "Services designed for the three properties that matter under load: reliability, scalability, and maintainability. We assume failure and design for it.",
    },
    {
      title: "Developer tools",
      body: "Small, sharp programs in the Unix tradition. Each does one thing well and composes with the rest of your workflow.",
    },
  ],

  // How we work, shown as alternating panels.
  features: [
    {
      title: "Separate the essential from the accidental",
      body: "Most of the difficulty in software is the problem itself, not the tooling around it. We spend our effort on the essential complexity and keep the accidental kind from accumulating.",
    },
    {
      title: "Keep abstractions honest",
      body: "A good interface hides what changes and exposes what stays stable. We draw boundaries so the hard parts stay contained and everything built on top stays simple.",
    },
    {
      title: "Design for failure and scale",
      body: "Distributed systems fail in parts, not all at once. We make systems degrade gracefully, measure before optimizing, and keep them observable in production.",
    },
    {
      title: "Ship small, iterate in the open",
      body: "Working software over speculation. We keep the feedback loop short, release early, and improve in the open, the way we built inode.",
    },
  ],

  // PLACEHOLDER client/company names for the "used by" row. Replace with real
  // client names or swap the component to render logo images.
  clients: ["Acme Labs", "Northwind", "Globex", "Initech", "Umbrella", "Hooli"],

  // Dense capability list grid (Superlist-style "everyday superpowers").
  featureList: [
    {
      label: "Retrieval-augmented generation",
      body: "Language-model answers grounded in your data, so the output is sourced rather than guessed.",
    },
    {
      label: "Semantic search",
      body: "Nearest-neighbor search over embeddings, matching meaning even when the keywords don't.",
    },
    {
      label: "Fault tolerance",
      body: "Systems that degrade gracefully when a dependency fails instead of falling over with it.",
    },
    {
      label: "Event-driven design",
      body: "Services decoupled through durable logs and queues, so producers and consumers evolve independently.",
    },
    {
      label: "Honest interfaces",
      body: "APIs defined by a clear contract, so other teams can build on them without reading the source.",
    },
    {
      label: "Observability",
      body: "Logs, metrics, and traces, so you can reason about the system's behavior in production.",
    },
    {
      label: "Unix-philosophy tooling",
      body: "Small composable programs that each do one thing well and pipe cleanly into the next.",
    },
    {
      label: "Local-first",
      body: "Works on your machine and offline by default, with your data staying on disk and yours.",
    },
    {
      label: "Horizontal scalability",
      body: "Stateless services and partitioned data, so capacity grows by adding machines, not rewrites.",
    },
  ],

  // PLACEHOLDER testimonials. Replace with real quotes before launch.
  testimonials: [
    {
      quote:
        "They modeled the problem before writing a line of code, and the design held up as requirements changed. That's rarer than it should be.",
      name: "Placeholder Name",
      role: "Engineering lead, Company",
    },
    {
      quote:
        "We had a working prototype in a week, and it was the simplest thing that could possibly work, not a pile of premature abstraction.",
      name: "Placeholder Name",
      role: "Founder, Startup",
    },
    {
      quote:
        "The system degraded gracefully the day traffic spiked. Nobody had to scramble, because it was designed for failure from the start.",
      name: "Placeholder Name",
      role: "CTO, Company",
    },
    {
      quote:
        "inode quietly became the tool I reach for first. It retrieves by meaning, so I find things I'd have spent ten minutes grepping for.",
      name: "Placeholder Name",
      role: "Backend developer",
    },
  ],

  // Footer link columns. Internal anchors point at home-page sections.
  footerColumns: [
    {
      title: "Studio",
      links: [
        { label: "Approach", href: "/#features" },
        { label: "Products", href: "/#projects" },
        { label: "Team", href: "/#team" },
      ],
    },
    {
      title: "Work",
      links: [
        { label: "inode", href: "/projects/inode" },
        { label: "Threads", href: "/threads" },
        { label: "GitHub", href: "https://github.com/BiSemaphore" },
      ],
    },
    {
      title: "Contact",
      links: [
        { label: "Get in touch", href: "/#contact" },
        { label: "Instagram", href: "https://www.instagram.com/binary.semaphore/" },
      ],
    },
  ],
};

// The team. `bio` paragraphs are DRAFTS (LinkedIn can't be read automatically);
// edit them or paste real profile text. Detail pages live at /team/<slug>.
export const team: TeamMember[] = [
  {
    name: "Shahid Raza",
    slug: "shahid-raza",
    role: "Software Engineer",
    focus: "Core development",
    description:
      "Leads core development, turning ideas into working software and sweating the details that make it feel right.",
    bio: [
      "Shahid leads core development at Binary Semaphore. He spends most of his time on the essential complexity of a problem: modeling it well, drawing clean boundaries, and turning that into software that holds up.",
      "He works mostly in Go, with a soft spot for local-first tools and the Unix philosophy. inode, the studio's CLI knowledge base, started as one of his side projects and became the team's main focus.",
    ],
    skills: ["Go", "Distributed systems", "CLI tooling", "Vector search", "System design"],
    email: "razashahid@gmail.com",
    linkedin: "https://www.linkedin.com/in/shahid-raza-2615b4129/",
    github: "https://github.com/shahid-io",
  },
  {
    name: "Sanny Kumar",
    slug: "sanny-kumar",
    role: "Software Engineer",
    focus: "Core development",
    description:
      "Works hands-on across the codebase, building and refining the core product alongside the team.",
    bio: [
      "Sanny works hands-on across the stack, building and refining the core product alongside Shahid. He cares about code that reads well and abstractions that stay honest as the system grows.",
      "He enjoys the parts other people avoid: tightening hot paths, paying down accidental complexity, and making the tooling pleasant to work in.",
    ],
    skills: ["Backend", "APIs", "Testing", "Performance", "Refactoring"],
    email: "ksanny556@gmail.com",
    linkedin: "https://www.linkedin.com/in/supersanny/",
    github: "https://github.com/SuperSanny",
  },
  {
    name: "Anand Singh",
    slug: "anand-singh",
    role: "Software Engineer",
    focus: "Business analysis & requirements",
    description:
      "Builds features while shaping requirements and helping steer the decisions that keep projects on track.",
    bio: [
      "Anand sits between the code and the problem. He builds features while shaping requirements, translating what a business actually needs into something the team can design and ship.",
      "He keeps projects honest about scope and trade-offs, and helps steer the decisions that decide whether a system ages well or not.",
    ],
    skills: ["Business analysis", "Requirements", "Project planning", "Backend", "Stakeholder comms"],
    email: "anandmevaparajitah04@gmail.com",
    linkedin: "https://www.linkedin.com/in/anand-singh-03ab70201",
    github: "https://github.com/hawkeyemehawk",
  },
  {
    name: "Sanjita Sahu",
    slug: "sanjita-sahu",
    role: "Product Manager & Data Analyst",
    focus: "Business problems & delivery",
    description:
      "Turns business problems into clear plans and reads the data that points to what we build next.",
    bio: [
      "Sanjita turns fuzzy business problems into clear plans the team can act on. She works closely with Anand on requirements and keeps delivery moving without losing sight of the goal.",
      "As a data analyst she reads what the numbers are actually saying, so decisions about what to build next come from evidence rather than hunches.",
    ],
    skills: ["Product management", "Data analysis", "Roadmapping", "SQL", "Delivery"],
    email: "sahusanjita4@gmail.com",
    linkedin: "https://www.linkedin.com/in/sanjitasahu/",
    github: "https://github.com/sahu130",
  },
];

/** Find a team member by slug (for the detail page). */
export function getTeamMember(slug: string): TeamMember | undefined {
  return team.find((m) => m.slug === slug);
}

export const projects: Project[] = [
  {
    name: "inode",
    tagline: "A CLI knowledge base that retrieves by meaning, not keywords.",
    description:
      "Stores your notes, secrets, and commands and retrieves them by meaning using vector search and an LLM. Runs fully on your machine by default (Ollama + SQLite), with an optional Postgres/pgvector backend and an MCP server so tools like Claude Code can query it directly.",
    tags: ["Go", "RAG", "pgvector", "MCP", "Ollama"],
    href: "https://github.com/shahid-io/inode",
    image: "/projects/inode.png",
    featured: true,
    slug: "inode",
    detail: {
      lede: "A privacy-focused CLI for storing and retrieving notes, secrets, and commands through natural-language semantic search.",
      overview: [
        "inode is a command-line knowledge base you talk to in plain English. Instead of remembering exact filenames or grepping through scattered notes, you ask for what you need, like “the staging database password” or “how I deployed the worker last time”, and inode finds it by meaning rather than exact keywords.",
        "Everything runs on your machine by default, with no API keys or internet required, so your notes and secrets never leave your laptop. When you want higher-quality results, you can switch to cloud backends without changing how you use it.",
      ],
      features: [
        {
          title: "Semantic search",
          body: "Built in Go with vector embeddings and LLM inference for natural-language retrieval. Content is auto-classified into nine strict categories (credentials, commands, snippets, runbooks, and more), so what you store stays organized and what you ask for comes back precise.",
        },
        {
          title: "Runs on your machine",
          body: "Uses SQLite + sqlite-vec by default, with no API keys or internet required. Optional PostgreSQL/pgvector, Claude API, and Voyage AI backends are available when you want higher-quality embeddings and results.",
        },
        {
          title: "Security by default",
          body: "Sensitive values are encrypted at rest with AES-256-GCM and masked in output. Ollama provides zero-cost local embeddings and inference, so nothing sensitive is sent anywhere unless you explicitly opt in.",
        },
        {
          title: "AI integration",
          body: "Ships a read-only Model Context Protocol (MCP) server so tools like Claude Code and Cursor can query your knowledge base directly. Cross-platform binaries are available for macOS, Linux, and Windows.",
        },
      ],
      facts: [
        { label: "Language", value: "Go" },
        { label: "Default storage", value: "SQLite + sqlite-vec" },
        { label: "Optional backends", value: "PostgreSQL/pgvector · Claude · Voyage AI" },
        { label: "Security", value: "AES-256-GCM, on-device" },
        { label: "Integrations", value: "MCP (Claude Code, Cursor)" },
        { label: "Platforms", value: "macOS · Linux · Windows" },
      ],
    },
  },
];
