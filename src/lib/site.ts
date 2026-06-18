/**
 * Central site configuration — single source of truth for copy and links.
 * Edit values here; components read from this file.
 *
 * Items marked TODO need a real value from Shahid before launch.
 */

export type ProjectDetail = {
  /** One-sentence summary shown under the title on the detail page. */
  lede: string;
  /** Punchy brand statements shown as a bold band near the top. */
  statements?: string[];
  /** Intro paragraphs. */
  overview: string[];
  /** Numbered "how it works" pipeline steps. */
  howItWorks?: { step: string; body: string }[];
  /** Deep-dive sections. */
  features: { title: string; body: string }[];
  /** Example commands with explanations. */
  usage?: { command: string; description: string }[];
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
  /** Short "how we work" band: a lead line plus a couple of process notes. */
  howWeWork: {
    label: string;
    title: string;
    lead: string;
    steps: { title: string; body: string }[];
  };
  /** Services page: the areas we work in. */
  services: {
    label: string;
    title: string;
    lead: string;
    items: { title: string; body: string }[];
  };
  /** Honest at-a-glance facts shown under the hero. */
  stats: { value: string; label: string }[];
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
  // Company LinkedIn page.
  linkedin: "https://www.linkedin.com/company/binary-semaphore/",
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

  // --- How we work -------------------------------------------------------
  howWeWork: {
    label: "How we work",
    title: "Small parts, coordinated well",
    lead: "We keep the moving parts few and the boundaries between them clear. Most of a project is understanding the real problem before writing the code that solves it.",
    steps: [
      {
        title: "Start from the problem",
        body: "We map the actual problem and its constraints first, so we build the thing that's needed and not the longest feature list.",
      },
      {
        title: "Build the honest version",
        body: "Simple, legible parts with interfaces that tell the truth. We spend the effort on the essential complexity and keep the accidental kind out.",
      },
    ],
  },

  // --- Services ----------------------------------------------------------
  services: {
    label: "Services",
    title: "What we work on",
    lead: "We take on a small number of problems at a time and see them through, from the first design to something reliable in production.",
    items: [
      {
        title: "Applied AI",
        body: "Retrieval, embeddings, and LLM features built into real tools. We focus on systems that are useful day to day and honest about what the model can and can't do.",
      },
      {
        title: "Distributed systems",
        body: "Services that stay correct under concurrency and load. We design for failure, keep state consistent, and make the behaviour easy to reason about.",
      },
      {
        title: "Developer tools",
        body: "CLIs, libraries, and workflows that respect your time: fast, scriptable, and happy to run on your own machine, in the spirit of the Unix philosophy.",
      },
    ],
  },

  // --- At-a-glance stats (honest, not vanity metrics) --------------------
  stats: [
    { value: "100%", label: "Open source" },
    { value: "Go", label: "Primary language" },
    { value: "3", label: "Focus areas" },
    { value: "2", label: "Products in the open" },
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

  // No public client list yet. The Clients component renders nothing while this
  // is empty. Add real names (or logo images) when there's something honest to show.
  clients: [],

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
      label: "On-device by default",
      body: "Computation and data stay on your machine, offline by default, so nothing leaves the host unless you choose a remote backend.",
    },
    {
      label: "Horizontal scalability",
      body: "Stateless services and partitioned data, so capacity grows by adding machines, not rewrites.",
    },
  ],

  // No testimonials yet. The Testimonials component renders nothing while this
  // is empty. Add real, attributable quotes when we have them.
  testimonials: [],

  // Footer link columns. Internal links point at dedicated pages.
  footerColumns: [
    {
      title: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Services", href: "/services" },
        { label: "Team", href: "/team" },
      ],
    },
    {
      title: "Work",
      links: [
        { label: "Products", href: "/projects" },
        { label: "inode", href: "/projects/inode" },
        { label: "Threads", href: "/threads" },
      ],
    },
    {
      title: "Contact",
      links: [
        { label: "Get in touch", href: "/contact" },
        { label: "GitHub", href: "https://github.com/BiSemaphore" },
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
      "He works mostly in Go, with a soft spot for tools that run on your own machine and the Unix philosophy. inode, the studio's CLI knowledge base, started as one of his side projects and became the team's main focus.",
    ],
    skills: [
      "Go",
      "Node.js",
      "Next.js",
      "Microservices",
      "REST & GraphQL APIs",
      "PostgreSQL",
      "Retrieval-augmented generation",
      "System design",
    ],
    email: "razashahid@gmail.com",
    linkedin: "https://www.linkedin.com/in/shahid-raza-2615b4129/",
    github: "https://github.com/shahid-io",
    experience: [
      {
        role: "Software Engineer",
        company: "SkillSnap Learning",
        period: "Jun 2026 - Present",
        summary:
          "Founding engineer working across product strategy, architecture, and full-stack development. Partners with leadership to define the product and make the technical calls behind it, taking features from idea to production.",
      },
      {
        role: "Full Stack Developer",
        company: "NewAgeSys Solutions",
        period: "Nov 2025 - May 2026",
        summary:
          "Built across frontend, backend, and databases to ship reliable, scalable products.",
      },
      {
        role: "Software Developer",
        company: "TechwareLab",
        period: "Apr 2024 - Oct 2025",
        summary:
          "Designed and built scalable backend services, mostly in Node.js and TypeScript.",
      },
      {
        role: "Junior Software Developer",
        company: "TechwareLab",
        period: "Apr 2023 - Apr 2024",
        summary:
          "Worked across the backend, learning to write code that holds up in production.",
      },
    ],
    projects: [
      {
        name: "inode",
        description:
          "A CLI knowledge base in Go. Save anything from the terminal, retrieve it later in plain English. End-to-end RAG pipeline over a pluggable adapter architecture: SQLite + sqlite-vec by default, Postgres + pgvector as a zero-CGO alternative, with swappable embedding and LLM providers. Encrypted at rest, and it exposes a read-only MCP server so AI clients can query it.",
        href: "https://github.com/shahid-io/inode",
      },
      {
        name: "Urban Waddle",
        description:
          "A Go backend service handling authentication, products, and orders over a REST API.",
        href: "https://github.com/shahid-io/urban-waddle",
      },
    ],
    certifications: [
      {
        name: "Go for Developers: Practical Techniques for Effective Coding",
        issuer: "LinkedIn",
        year: "2025",
      },
      {
        name: "Learning Go",
        issuer: "LinkedIn",
        year: "2025",
      },
      {
        name: "Backend Engineering Launchpad",
        issuer: "Airtribe",
        year: "2024",
      },
      {
        name: "Introduction to Back-End Development",
        issuer: "Meta",
        year: "2022",
      },
      {
        name: "Spring Framework for Beginners with Spring Boot",
        issuer: "Udemy",
        year: "2022",
      },
      {
        name: "Introduction to Cloud Computing",
        issuer: "IBM",
        year: "2022",
      },
      {
        name: "NDG Linux Essentials",
        issuer: "Cisco Networking Academy",
        year: "2022",
      },
    ],
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
    featured: true,
    slug: "inode",
    detail: {
      lede: "A privacy-focused CLI for storing and retrieving notes, secrets, and commands through natural-language semantic search.",
      statements: [
        "Save anything. Ask in plain English.",
        "Runs on your machine. Encrypted. Yours.",
      ],
      overview: [
        "Every developer accumulates a pile of scattered knowledge: the staging database password, the exact flags for a deploy, a snippet you wrote once and will need again. It ends up in notes apps, shell history, password managers, and stray text files. The problem is rarely storing it. The problem is finding it again, weeks later, when you no longer remember the exact words you used.",
        "inode is a command-line knowledge base that solves the finding problem. You talk to it in plain English. Instead of grepping for an exact string, you ask for what you mean, like “the staging database password” or “how I deployed the worker last time”, and it returns the right entry even when none of those words appear in it. It matches meaning, not characters.",
        "It is built to run entirely on your machine. By default there are no API keys, no accounts, and no network calls: embeddings and language-model inference run locally through Ollama, and everything is stored in a single SQLite file you own. When you want higher-quality results, you can point it at cloud backends without changing a single command you type.",
      ],
      howItWorks: [
        {
          step: "Capture and classify",
          body: "When you add an entry, inode classifies it into one of nine strict categories (credential, command, snippet, runbook, note, and so on) so retrieval stays precise and sensitive types can be handled differently.",
        },
        {
          step: "Embed",
          body: "The text is turned into a vector embedding, a list of numbers that captures its meaning. Local embeddings run through Ollama at zero cost; Voyage AI or Claude can be used for higher quality.",
        },
        {
          step: "Store",
          body: "Vectors and content live in SQLite with the sqlite-vec extension by default, or PostgreSQL with pgvector when you want a shared, larger store. Credentials are encrypted at rest before they touch disk.",
        },
        {
          step: "Retrieve and rerank",
          body: "Your query is embedded the same way and matched by nearest-neighbor (cosine) similarity. The top candidates are then handed to an LLM that reads them and returns the answer that is actually there, rather than trusting the raw vector score alone.",
        },
      ],
      features: [
        {
          title: "Semantic search that understands intent",
          body: "Retrieval is built on vector embeddings and LLM reranking, so a query like “prod logging config” surfaces the right runbook even if it was titled “observability setup”. Content is auto-classified into nine categories, which keeps results sharp and lets inode treat a credential differently from a note.",
        },
        {
          title: "Runs on your machine, cloud is opt-in",
          body: "The default stack is SQLite + sqlite-vec + Ollama: no API keys, no internet, nothing leaves your laptop. The same commands work unchanged against PostgreSQL/pgvector for storage and Claude or Voyage AI for embeddings when you want more power. The architecture treats backends as a swappable detail, not a rewrite.",
        },
        {
          title: "Secrets handled like secrets",
          body: "Sensitive values are encrypted at rest with AES-256-GCM and masked in terminal output by default, so a screen-share or a scrollback never leaks them. You reveal a value explicitly, only when you mean to.",
        },
        {
          title: "An MCP server your editor can read",
          body: "inode ships a read-only Model Context Protocol server, so assistants like Claude Code and Cursor can query your knowledge base directly and answer from your real notes and runbooks. Read-only by design: the model can look, but it cannot rewrite or delete what you have stored.",
        },
      ],
      usage: [
        {
          command: 'inode add "My Stripe test key is sk_test_xxxxx"',
          description: "Save anything. The LLM auto-detects the category (credentials), adds tags, and flags it sensitive, then encrypts it at rest.",
        },
        {
          command: 'inode get "stripe test key"',
          description: "Ask in plain English. inode embeds the query, finds the closest notes by meaning, and answers from them. Aliases: ask, find, search.",
        },
        {
          command: 'inode get "stripe test key" --reveal',
          description: "Sensitive values are masked by default. --reveal prompts for confirmation, then prints the plaintext.",
        },
        {
          command: "inode list --category credentials",
          description: "Browse by category or tag. inode sorts everything into nine strict categories.",
        },
        {
          command: "inode mcp",
          description: "Run the read-only MCP server over stdio so Claude Code or Cursor can read your knowledge base.",
        },
      ],
      facts: [
        { label: "Language", value: "Go" },
        { label: "Default storage", value: "SQLite + sqlite-vec" },
        { label: "Optional backends", value: "PostgreSQL/pgvector · Claude · Voyage AI" },
        { label: "Embeddings", value: "Ollama (local) · Voyage AI" },
        { label: "Security", value: "AES-256-GCM, on-device" },
        { label: "Integrations", value: "MCP (Claude Code, Cursor)" },
        { label: "Categories", value: "9 (credentials, commands, runbooks, …)" },
        { label: "Platforms", value: "macOS · Linux · Windows" },
      ],
    },
  },
  {
    name: "Booking.go",
    tagline: "Slot-based booking for small businesses, multi-tenant from the start.",
    description:
      "A scheduling platform for salons, clinics, gyms, and independent consultants. One backend serves many businesses, each with its own services, hours, and bookable slots. In active development.",
    tags: ["TypeScript", "Node.js", "Next.js", "PostgreSQL", "Redis", "SaaS"],
    href: "https://github.com/Booking-Go",
    slug: "booking-go",
    status: "In development",
    detail: {
      lede: "A multi-tenant SaaS for slot-based booking, built so a single backend can serve many independent businesses without their data ever crossing.",
      overview: [
        "Small businesses that run on appointments (a salon, a physiotherapy clinic, a personal trainer, a freelance consultant) all face the same scheduling problem: publish when you are available, let clients book a slot, and keep two people from claiming the same one. Most reach for a calendar and a phone, which works until it doesn't.",
        "Booking.go is a platform that solves this once, for many businesses at the same time. It is multi-tenant: each business owns its services, working hours, holidays, and bookable slots, and one deployment serves all of them while keeping each tenant's data cleanly separated. The data model and access paths are designed around that boundary rather than bolting it on later.",
        "It is two services. The backend (booking-go-engine) is a Node.js and TypeScript API on Express, with a layered architecture that keeps routing, business logic, and data access in separate places. The frontend (booking-go-web) is a Next.js and React app that talks to it. Both are open source and still being built, so the surface is changing as the model settles.",
      ],
      howItWorks: [
        {
          step: "Authenticate the tenant",
          body: "A business owner registers and signs in. Auth issues short-lived access tokens and longer-lived refresh tokens (JWT), and every request is scoped to the tenant it belongs to.",
        },
        {
          step: "Describe the business",
          body: "Each business defines its services, working hours, and holidays. This is the configuration that everything else is generated from, so it is modeled as first-class data rather than free text.",
        },
        {
          step: "Generate and query slots",
          body: "From a business's hours and services, the engine generates the slots clients can actually book. Availability queries are read-heavy and repetitive, so results are cached in Redis instead of recomputed on every request.",
        },
        {
          step: "Run the booking lifecycle",
          body: "A booking moves through clear states: booked, confirmed, cancelled, completed. The rules that guard those transitions (no double-booking a slot, no booking outside hours) live in the service layer, not scattered across routes.",
        },
      ],
      features: [
        {
          title: "Multi-tenant by design",
          body: "One backend serves many businesses, with each tenant's services, hours, and bookings kept separate. Tenancy is part of the data model and the access paths from the start, which is far cheaper than retrofitting isolation onto a single-tenant app later.",
        },
        {
          title: "Layered backend with honest boundaries",
          body: "The engine follows a strict path: route to service to repository to database. Routing handles HTTP, services hold the business rules, repositories own data access. Each layer has one job, so the rules that matter stay in one place and are easy to test.",
        },
        {
          title: "The right store for each job",
          body: "PostgreSQL holds the relational core (businesses, services, slots, bookings) where consistency matters. MongoDB takes the append-heavy activity logs and notifications. Redis caches sessions and slot availability. Each datastore does what it is good at instead of forcing everything into one.",
        },
        {
          title: "Typed end to end",
          body: "TypeScript spans both services, and inputs are validated with Zod at the edges, so a malformed request is rejected before it reaches the business logic. The frontend is a Next.js and React app using React Query for server state and NextAuth for sessions.",
        },
      ],
      facts: [
        { label: "Type", value: "Multi-tenant SaaS, slot-based booking" },
        { label: "Backend", value: "booking-go-engine (Express + TypeScript)" },
        { label: "Frontend", value: "booking-go-web (Next.js 15 + React 19)" },
        { label: "Databases", value: "PostgreSQL · MongoDB · Redis" },
        { label: "Auth", value: "JWT access + refresh tokens" },
        { label: "Validation", value: "Zod (shared across both services)" },
        { label: "Infra", value: "Docker Compose" },
        { label: "Status", value: "In active development" },
      ],
    },
  },
];
