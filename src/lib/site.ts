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

export type CTA = { label: string; href: string };

export type Feature = { title: string; body: string };

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
  /** Product value props shown as a card grid. */
  features: Feature[];
};

export const site: SiteConfig = {
  name: "Shahid Raza",
  /** Org / wordmark shown in the header and used as the hero headline. */
  wordmark: "Binary Semaphore",
  /** Small status line above the hero headline. */
  eyebrow: "developer tools · shipped in public",
  /** One-line studio statement (hero subhead + metadata). */
  role: "Software engineer building developer tools",
  tagline:
    "A workshop building small, fast developer tools that respect your machine and your attention — released early and built in the open.",

  // --- Links -------------------------------------------------------------
  // LinkedIn is hidden everywhere until a real URL is set (no broken links).
  email: "razashahid532@gmail.com",
  github: "https://github.com/shahid-io",
  linkedin: "https://www.linkedin.com/in/shahid-raza-2615b4129/",
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
    "Binary Semaphore is the workshop of Shahid Raza, a software engineer who builds developer tools — small, fast programs that run locally, do one thing well, and get out of the way.",
    "The current focus is inode, a CLI knowledge base that retrieves your notes, secrets, and commands by meaning instead of exact keywords. Everything here is built mostly in Go, with care for ergonomics and performance, and shipped in public: released early, written about along the way, and iterated on in the open.",
  ],

  // --- Landing hero ------------------------------------------------------
  hero: {
    headline: "Small, fast developer tools,",
    headlineAccent: "built in the open.",
    subhead:
      "Binary Semaphore is a workshop for local-first developer tools. First up: inode, a CLI knowledge base that finds your notes, secrets, and commands by meaning.",
    primary: { label: "Explore inode", href: "/projects/inode" },
    secondary: { label: "View on GitHub", href: "https://github.com/BiSemaphore" },
  },

  builtWith: ["Go", "SQLite", "pgvector", "Ollama", "MCP"],

  features: [
    {
      title: "Runs locally",
      body: "By default there are no API keys and no network calls — notes and secrets stay on your machine. Cloud backends are opt-in.",
    },
    {
      title: "Semantic search",
      body: "Retrieves notes, commands, and secrets from a description of what you want, not an exact keyword match.",
    },
    {
      title: "Encrypted storage",
      body: "Sensitive values are stored with AES-256-GCM encryption and masked when printed to the terminal.",
    },
    {
      title: "MCP server",
      body: "Exposes a read-only MCP server, so Claude Code, Cursor, and similar tools can read from your knowledge base.",
    },
  ],
};

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
        "inode is a command-line knowledge base you talk to in plain English. Instead of remembering exact filenames or grepping through scattered notes, you ask for what you need — “the staging database password” or “how I deployed the worker last time” — and inode finds it by meaning rather than exact keywords.",
        "It is local-first by design: everything runs on your machine with no API keys or internet required, so your notes and secrets never leave your laptop. When you want higher-quality results, you can opt into cloud backends without changing how you use it.",
      ],
      features: [
        {
          title: "Semantic search",
          body: "Built in Go with vector embeddings and LLM inference for natural-language retrieval. Content is auto-classified into nine strict categories — credentials, commands, snippets, runbooks, and more — so what you store stays organized and what you ask for comes back precise.",
        },
        {
          title: "Local-first architecture",
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
        { label: "Security", value: "AES-256-GCM, local-first" },
        { label: "Integrations", value: "MCP (Claude Code, Cursor)" },
        { label: "Platforms", value: "macOS · Linux · Windows" },
      ],
    },
  },
];
