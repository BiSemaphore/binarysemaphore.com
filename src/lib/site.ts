/**
 * Central site configuration — single source of truth for copy and links.
 * Edit values here; components read from this file.
 *
 * Items marked TODO need a real value from Shahid before launch.
 */

export type Project = {
  name: string;
  tagline: string;
  description: string;
  tags: string[];
  href: string;
  /** Optional banner image (path under /public), ~1.9:1 aspect. */
  image?: string;
  /** Optional: shown as a small monospace label on the card, e.g. "v0.3". */
  status?: string;
  featured?: boolean;
};

export type SiteConfig = {
  name: string;
  wordmark: string;
  role: string;
  tagline: string;
  email: string;
  github: string;
  linkedin: string;
  org: string;
  formspreeId: string;
  about: string[];
};

export const site: SiteConfig = {
  name: "Shahid Raza",
  /** Org / wordmark shown in the header. */
  wordmark: "Binary Semaphore",
  /** One-line hero statement. */
  role: "Software engineer building developer tools",
  tagline:
    "I build small, fast tools that respect your machine and your attention — and I ship them in public.",

  // --- Links -------------------------------------------------------------
  // LinkedIn is hidden everywhere until a real URL is set (no broken links).
  email: "razashahid532@gmail.com", // TODO: confirm this is the address to show publicly
  github: "https://github.com/shahid-io",
  linkedin: "", // TODO: add LinkedIn profile URL, e.g. https://www.linkedin.com/in/<handle>
  org: "https://github.com/BinarySemaphore",

  // --- Contact form ------------------------------------------------------
  // When empty, the contact section falls back to a mailto button so the
  // site works immediately. Paste your Formspree form ID (the part after
  // "/f/" in your endpoint) to switch on the real form.
  formspreeId: "", // TODO: e.g. "xrgkabcd" from https://formspree.io/f/xrgkabcd

  // --- About -------------------------------------------------------------
  // DRAFT — edit freely.
  about: [
    "I'm a software engineer who builds developer tools. I like small, fast programs that run locally, do one thing well, and get out of the way.",
    "Lately I've been building inode — a CLI knowledge base that retrieves your notes, secrets, and commands by meaning instead of exact keywords. I work mostly in Go, care about ergonomics and performance, and I ship in public: releasing early, writing about the process, and iterating in the open.",
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
  },
];
