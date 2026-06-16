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
  name: "Binary Semaphore",
  /** Org / wordmark shown in the header and used as the hero headline. */
  wordmark: "Binary Semaphore",
  /** Small status line above the hero headline. */
  eyebrow: "AI · distributed systems · developer tools",
  /** One-line studio statement (hero subhead + metadata). */
  role: "A software studio for AI and distributed systems",
  tagline:
    "A software studio working across AI, distributed systems, and developer tools — from brainstorm to production.",

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
    "Binary Semaphore is a software studio working across AI and distributed systems. We take ideas from brainstorm to production — sitting with the business problem first, then engineering software that fits it.",
    "Our work spans applied AI, distributed systems, and developer tools. The current focus is inode, a CLI knowledge base that retrieves your notes, secrets, and commands by meaning instead of exact keywords — built in Go, with care for ergonomics and performance.",
  ],

  // --- Landing hero ------------------------------------------------------
  hero: {
    headline: "Ideas, engineered into",
    headlineAccent: "real software.",
    subhead:
      "Binary Semaphore is a software studio working across AI and distributed systems. We take ideas from brainstorm to production — and build each one around the business it needs to serve.",
    primary: { label: "See our work", href: "/#projects" },
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
        "Everything runs on your machine by default, with no API keys or internet required, so your notes and secrets never leave your laptop. When you want higher-quality results, you can switch to cloud backends without changing how you use it.",
      ],
      features: [
        {
          title: "Semantic search",
          body: "Built in Go with vector embeddings and LLM inference for natural-language retrieval. Content is auto-classified into nine strict categories — credentials, commands, snippets, runbooks, and more — so what you store stays organized and what you ask for comes back precise.",
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
