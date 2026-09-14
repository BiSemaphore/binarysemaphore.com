/**
 * Single source of truth for site copy, links, the team and the projects.
 *
 * Was 1,821 lines: 302 of type declarations followed by one object literal.
 * The types now live in `./site/types`, and the sections that change most often
 * live beside them. Everything is still re-exported from here, so every existing
 * `import { site } from "@/lib/site"` keeps working and no page had to change.
 */
export * from "./site/types";
import type { Project, SiteConfig, TeamMember } from "./site/types";
import { mentorship } from "./site/mentorship";

export const site: SiteConfig = {
  name: "Binary Semaphore",
  /** Org / wordmark shown in the header and used as the hero headline. */
  wordmark: "Binary Semaphore",
  /** Small status line above the hero headline. */
  eyebrow: "AI · distributed systems · developer tools",
  /** One-line studio statement (hero subhead + metadata). */
  role: "Building software across AI, distributed systems, and developer tools",
  tagline:
    "We build software across AI, distributed systems, and developer tools.",

  // --- Links -------------------------------------------------------------
  // LinkedIn is hidden everywhere until a real URL is set (no broken links).
  email: "shahid@binarysemaphore.com",
  github: "https://github.com/shahid-io",
  // Company LinkedIn page.
  linkedin: "https://www.linkedin.com/company/binary-semaphore/",
  org: "https://github.com/BiSemaphore",
  // TODO(shahid): this invite expires 2026-09-30. Replace it with a
  // never-expiring one (Server Settings -> Invites -> Edit -> Expire After:
  // Never), or every Discord link on the site breaks that day.
  discord: "https://discord.gg/cKtUvbC5K",
  instagram: "https://www.instagram.com/binary.semaphore/",
  instagramHandle: "binary.semaphore",

  // --- Mentorship (learn.binarysemaphore.com) ----------------------------
  mentorship,
  formspreeId: "", // TODO: e.g. "xrgkabcd" from https://formspree.io/f/xrgkabcd

  // --- Behind the work ---------------------------------------------------
  // DRAFT — edit freely. Frames the maker behind the studio.
  about: [
    "Binary Semaphore takes its name from the simplest synchronization primitive there is, and we treat software the same way: small, well-defined parts that coordinate cleanly and hide the right details behind each interface.",
    "We work across applied AI, distributed systems, and developer tools. We spend our effort on the essential complexity of a problem and refuse to let the accidental kind pile up, designing for reliability and maintainability from the start rather than bolting them on later. The current focus is inode, a Go CLI that answers questions over your notes with retrieval-augmented generation.",
  ],

  // --- How we work -------------------------------------------------------
  howWeWork: {
    label: "How we work",
    title: "Small parts, coordinated well",
    lead: "We keep the moving parts few and the boundaries between them clear. Most of a project is understanding the real problem before writing the code that solves it.",
    steps: [
      {
        title: "Understand the problem",
        body: "We map the real problem and its constraints before writing code, so we build what is needed and not the longest feature list.",
      },
      {
        title: "Design the shape",
        body: "We decide the few well-defined parts and the boundaries between them. Most mistakes are cheaper to fix here than after the code is written.",
      },
      {
        title: "Build it honestly",
        body: "Simple, legible code with interfaces that tell the truth. We spend the effort on the essential complexity and keep the accidental kind out.",
      },
      {
        title: "Ship and keep it reliable",
        body: "We get it into production in small steps, watch how it behaves, and design for failure so it holds up as it grows.",
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
        slug: "applied-ai",
        title: "Applied AI",
        body: "Retrieval, embeddings, and LLM features built into real tools. We focus on systems that are useful day to day and honest about what the model can and can't do.",
        lede: "Retrieval, embeddings, and language-model features built into software people actually use.",
        overview: [
          "We treat a model as one component in a larger system, not the whole product. The interesting work is usually around it: getting the right context to it, handling the cases where it is wrong, and measuring whether it genuinely helps before shipping.",
          "We have built this from the inside out with inode, a retrieval-augmented knowledge base, so we know where retrieval quality, latency, and cost actually bite.",
        ],
        offerings: [
          {
            title: "Retrieval and semantic search",
            body: "Embeddings, vector search, and ranking that find the right thing even when the words do not match. We tune for precision on real queries, not benchmark scores.",
          },
          {
            title: "Agents and pipelines",
            body: "Multi-step flows that call tools, with clear boundaries so a wrong step fails safely instead of cascading, and a human stays in the loop where it matters.",
          },
          {
            title: "Honest evaluation",
            body: "We measure whether a feature helps before it ships, and we are upfront about what the model can and cannot do.",
          },
        ],
      },
      {
        slug: "distributed-systems",
        title: "Distributed systems",
        body: "Services that stay correct under concurrency and load. We design for failure, keep state consistent, and make the behaviour easy to reason about.",
        lede: "Services that stay correct when traffic, concurrency, and failure all show up at once.",
        overview: [
          "Most outages are not exotic. They are the ordinary cases that were never designed for: a slow dependency, a retry storm, two writers racing for the same row. We design for those from the start.",
          "We keep state consistent, make failure modes explicit, and prefer systems whose behaviour you can reason about over clever ones you cannot.",
        ],
        offerings: [
          {
            title: "Concurrency and correctness",
            body: "Coordination that holds under load: the right locks, queues, and idempotency so the system does the right thing when everything happens at once.",
          },
          {
            title: "Resilience and failure design",
            body: "Timeouts, backpressure, and graceful degradation, so a slow or failing dependency does not take the whole service down with it.",
          },
          {
            title: "Observability",
            body: "Metrics, traces, and logs that show what the system is actually doing, so problems are visible before users feel them.",
          },
        ],
      },
      {
        slug: "developer-tools",
        title: "Developer tools",
        body: "CLIs, libraries, and workflows that respect your time: fast, scriptable, and happy to run on your own machine, in the spirit of the Unix philosophy.",
        lede: "Fast, scriptable tools that respect the time of the people using them.",
        overview: [
          "Good tools disappear. They start fast, do one thing well, compose with everything else, and never make you wait. We build in that spirit, following the Unix philosophy rather than fighting it.",
          "These are the tools we reach for ourselves, which is why we sweat the small details: startup time, sensible defaults, and output you can pipe straight into the next thing.",
        ],
        offerings: [
          {
            title: "CLIs and libraries",
            body: "Command-line tools and libraries that are fast to start, scriptable, and predictable, with output designed to compose.",
          },
          {
            title: "Internal tooling",
            body: "The scripts, services, and workflows a team leans on every day, built to be reliable and easy to change as the team grows.",
          },
          {
            title: "On-device and offline",
            body: "Tools that run on your own machine and keep working when the network does not, so your workflow does not depend on someone else's uptime.",
          },
        ],
      },
    ],
  },

  // --- At-a-glance stats (honest, not vanity metrics) --------------------
  stats: [
    { value: "Go", label: "Primary language" },
    { value: "3", label: "Focus areas" },
    { value: "3", label: "Products shipped" },
    { value: "100%", label: "Type-safe" },
  ],

  // --- Tech stack --------------------------------------------------------
  techStack: {
    label: "Tech stack",
    title: "What we build with",
    lead: "We are not loyal to any one tool. We reach for what fits the problem and what we can keep reliable in production. A fairly complete map of what we work with:",
    tools: [
      // Languages
      { slug: "go", name: "Go" },
      { slug: "rust", name: "Rust" },
      { slug: "python", name: "Python" },
      { slug: "typescript", name: "TypeScript" },
      { slug: "java", name: "Java" },
      { slug: "c", name: "C" },
      { slug: "cpp", name: "C++" },
      // Frameworks & runtime
      { slug: "nodejs", name: "Node.js" },
      { slug: "nestjs", name: "NestJS" },
      { slug: "react", name: "React" },
      { slug: "nextjs", name: "Next.js" },
      { slug: "angular", name: "Angular" },
      // Data science
      { slug: "pandas", name: "pandas" },
      { slug: "numpy", name: "NumPy" },
      { slug: "scikitlearn", name: "scikit-learn" },
      { slug: "jupyter", name: "Jupyter" },
      // Databases & ORMs
      { slug: "postgresql", name: "PostgreSQL" },
      { slug: "mongodb", name: "MongoDB" },
      { slug: "redis", name: "Redis" },
      { slug: "sqlite", name: "SQLite" },
      { slug: "elasticsearch", name: "Elasticsearch" },
      { slug: "prisma", name: "Prisma" },
      { slug: "mongoose", name: "Mongoose" },
      { slug: "sequelize", name: "Sequelize" },
      // Messaging & APIs
      { slug: "kafka", name: "Kafka" },
      { slug: "rabbitmq", name: "RabbitMQ" },
      { slug: "grpc", name: "gRPC" },
      { slug: "graphql", name: "GraphQL" },
      // Infrastructure
      { slug: "docker", name: "Docker" },
      { slug: "kubernetes", name: "Kubernetes" },
      { slug: "linux", name: "Linux" },
      { slug: "nginx", name: "Nginx" },
      { slug: "terraform", name: "Terraform" },
      // Observability
      { slug: "prometheus", name: "Prometheus" },
      { slug: "grafana", name: "Grafana" },
      // Tooling
      { slug: "git", name: "Git" },
      { slug: "githubactions", name: "GitHub Actions" },
      { slug: "neovim", name: "Neovim" },
      { slug: "bash", name: "Bash" },
      { slug: "vercel", name: "Vercel" },
    ],
    concepts: [
      "RAG",
      "Agents",
      "Pipelines",
      "MCP",
      "LangChain",
      "LangGraph",
      "Protocol Buffers",
      "OpenTelemetry",
      "Vector search",
      "Event-driven",
      "System design",
      "Agile delivery",
    ],
  },

  // --- FAQ ---------------------------------------------------------------
  faq: {
    label: "FAQ",
    title: "Questions, answered plainly",
    items: [
      {
        q: "What kind of work do you take on?",
        a: "Two kinds. We build and maintain our own tools and products, and we build software for a specific need when a team brings us a real problem. Most of it sits across applied AI, distributed systems, and developer tools.",
      },
      {
        q: "Is everything open source?",
        a: "What we build for ourselves usually is. Work we do for a client belongs to the client; whether any of it is open-sourced is their call, and we are happy either way.",
      },
      {
        q: "How do you engage on a project?",
        a: "We take on a small number of things at a time and see them through, from the first design to something reliable in production. We scope each piece of work to the problem rather than selling fixed packages.",
      },
      {
        q: "Do you do design too?",
        a: "We are engineering-led. We keep interfaces simple and honest and can take a product end to end, but for heavy visual or brand design we would rather partner with someone who does that full time.",
      },
      {
        q: "What does your stack look like?",
        a: "We lean on Go for backends and systems work, with Python and TypeScript where they fit. We are not loyal to any one tool; the tech-stack section above is a fair map of what we reach for.",
      },
      {
        q: "How do we start?",
        a: "Get in touch with a short description of the problem. The first conversation is about understanding it, not pitching you a package.",
      },
    ],
  },

  // --- Landing hero ------------------------------------------------------
  hero: {
    headline: "We build software for",
    headlineAccent: "AI and distributed systems",
    subhead:
      "We build on the fundamentals: correct concurrency, honest abstractions, and systems that stay reliable as they scale.",
    primary: { label: "See our work", href: "/#projects" },
    secondary: {
      label: "View on GitHub",
      href: "https://github.com/BiSemaphore",
    },
  },

  builtWith: [
    "Go",
    "Python",
    "TypeScript",
    "PostgreSQL",
    "Kafka",
    "Kubernetes",
    "LLMs",
  ],

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
        { label: "Engineers", href: "/engineers" },
      ],
    },
    {
      title: "Work",
      links: [
        { label: "Products", href: "/projects" },
        { label: "inode", href: "/projects/inode" },
        { label: "notchify", href: "/projects/notchify" },
        { label: "Resume", href: "https://resume.binarysemaphore.com" },
        { label: "Learn", href: "https://learn.binarysemaphore.com" },
        { label: "Threads", href: "/threads" },
      ],
    },
    {
      title: "Contact",
      links: [
        { label: "Get in touch", href: "/contact" },
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
        { label: "Discord", href: "/discord" },
        { label: "GitHub", href: "https://github.com/BiSemaphore" },
        {
          label: "Instagram",
          href: "https://www.instagram.com/binary.semaphore/",
        },
      ],
    },
  ],
};

// The team. `bio` paragraphs are DRAFTS (LinkedIn can't be read automatically);
// edit them or paste real profile text. Detail pages live at /engineers/<slug>.
export const team: TeamMember[] = [
  {
    name: "Shahid Raza",
    slug: "shahid",
    role: "Software Engineer",
    focus: "Core development",
    description:
      "Leads core development, turning ideas into working software and sweating the details that make it feel right.",
    avatar: "/team/shahid-raza.png",
    avatarAlt:
      "Illustrated portrait of Shahid Raza, arms folded, in a cream shirt on a blue background.",
    bio: [
      "Shahid leads core development at Binary Semaphore. He spends most of his time on the essential complexity of a problem: modeling it well, drawing clean boundaries, and turning that into software that holds up.",
      "Three years of full-stack work, owning modules end to end: data modeling and API design through deployment and the performance work that comes after. Mostly Node.js, NestJS, and TypeScript over MongoDB and PostgreSQL, with React and Next.js on the front, shipped for B2B enterprise clients and US platforms across CMS, LMS, ERP, and community events.",
      "The parts he keeps coming back to are the ones where getting it wrong is expensive: authentication and authorization, payments and subscription billing, database transactions, message queues, and concurrency control.",
      "Outside client work he writes Go, with a soft spot for tools that run on your own machine and the Unix philosophy. inode, the studio's CLI knowledge base, started as one of his side projects.",
    ],
    skillGroups: [
      {
        title: "Languages",
        items: ["TypeScript", "JavaScript", "Go", "Python", "Java"],
      },
      {
        title: "Backend",
        items: [
          "Node.js",
          "NestJS",
          "Express",
          "REST",
          "GraphQL",
          "Apollo Server",
          "WebSockets",
          "Microservices",
          "Swagger/OpenAPI",
          "JWT",
          "OAuth2",
          "RBAC",
        ],
      },
      {
        title: "Frontend",
        items: [
          "React",
          "Next.js",
          "Server Components",
          "SSR/SSG/ISR",
          "Redux",
          "React Query",
          "Zustand",
          "React Hook Form",
          "Zod",
          "Apollo Client",
          "Radix UI",
          "shadcn/ui",
          "Tailwind CSS",
          "Angular",
        ],
      },
      {
        title: "Data",
        items: [
          "PostgreSQL",
          "MongoDB",
          "MySQL",
          "Redis",
          "Mongoose",
          "Sequelize",
          "Drizzle",
          "pgvector",
          "sqlite-vec",
        ],
      },
      {
        title: "Architecture",
        items: [
          "SOLID",
          "Dependency injection",
          "Layered architecture",
          "Event-driven architecture",
          "Transactional outbox",
          "Database transactions",
          "Concurrency control",
          "System design",
        ],
      },
      {
        title: "Infrastructure",
        items: [
          "Docker",
          "AWS (EC2, S3, Lambda)",
          "Kafka",
          "Kong API Gateway",
          "Nginx",
          "GitHub Actions",
          "CI/CD",
          "Git",
          "PM2",
          "Linux",
        ],
      },
      {
        title: "AI",
        items: [
          "LLM integration",
          "Embeddings",
          "Vector search",
          "RAG",
          "MCP",
          "Claude API",
          "Ollama",
        ],
      },
      { title: "Payments", items: ["Stripe", "Razorpay", "Paytm"] },
    ],
    email: "shahid@binarysemaphore.com",
    linkedin: "https://www.linkedin.com/in/shahid-raza-2615b4129/",
    github: "https://github.com/shahid-io",
    builds: ["inode", "notchify", "resume", "learn"],
    experience: [
      {
        role: "Full-Stack Developer",
        company: "NewAgeSys Solutions",
        period: "Nov 2025 - May 2026",
        location: "Kochi, India",
        summary:
          "Owned admin modules end to end on two US products: a community events platform and a driving academy.",
        highlights: [
          "Owned the community admin module of LOCAL-IL, a US community events platform: creation, editing, status switching, organization-initiated email changes, a per-admin activity log, and the dashboard across its aggregation APIs and its UI.",
          "Built event and camp management on Next.js server actions with React Hook Form and Zod validation at the boundary, including guest lists, approve and deny on join requests, payment status, and separate cancellation paths for the community and the parent organization.",
          "Integrated Stripe for checkout and subscription billing, wrapping each state change in a database transaction so the subscription record and its side effects committed together or not at all.",
          "Kept signed contracts and support-ticket attachments in a private S3 bucket, released only as pre-signed URLs issued per request, so no document was ever reachable from a guessable address.",
        ],
        stack: [
          "Next.js",
          "React",
          "NestJS",
          "Angular",
          "PostgreSQL",
          "MongoDB",
          "Stripe",
          "AWS S3",
        ],
      },
      {
        role: "Software Developer",
        company: "TechwareLab",
        period: "Apr 2024 - Oct 2025",
        location: "Kochi, India",
        summary:
          "Designed and built backend services for B2B enterprise clients, mostly in NestJS and TypeScript.",
        highlights: [
          "Designed and built Munawel's internal ERP, the HRMS, sales, and invoicing modules, from schema and API design through release, sharing domain models across them instead of duplicating them.",
          "Ran GraphQL alongside REST on every project, served from Apollo Server inside NestJS and consumed through Apollo Client, with lookups batched in Sequelize to avoid N+1 queries and subscriptions pushing live notifications.",
          "Fronted the NestJS services with a Kong API gateway, authenticating through its JWT plugin against a Kong consumer per user and rate-limiting at the gateway rather than reimplementing it in every service.",
          "Built the NetSuite integration for Infithra, a UAE HR and payroll platform, keeping payroll data in sync across the two systems.",
        ],
        stack: [
          "NestJS",
          "TypeScript",
          "GraphQL",
          "Apollo",
          "Kong",
          "PostgreSQL",
          "Sequelize",
          "Docker",
        ],
      },
      {
        role: "Junior Software Developer",
        company: "TechwareLab",
        period: "Apr 2023 - Apr 2024",
        location: "Kochi, India",
        summary:
          "Backend work across client projects, moving from supervised tickets to owning features end to end.",
        highlights: [
          "Built REST APIs and backend services for B2B enterprise clients including XLRI and Kinderpass, in two-week Scrum sprints tracked in Jira.",
          "Modeled and built the MongoDB data layer behind the CMS, LMS, and payment-transaction modules, from collection and document design through the queries the application ran against them.",
          "Integrated Stripe, Razorpay, and Paytm checkout flows, modeling transaction states so a payment was never ambiguous, with failure and retry handling.",
          "Cut latency on the hottest read paths by caching them in Redis and reshaping the queries behind them, across PostgreSQL, MySQL, and MongoDB.",
        ],
        stack: [
          "Node.js",
          "NestJS",
          "TypeScript",
          "MongoDB",
          "Redis",
          "Stripe",
          "Docker",
          "Jira",
        ],
      },
    ],
    education: [
      {
        degree: "Master of Computer Applications (MCA)",
        school: "Cochin University of Science and Technology",
        period: "2021 - 2023",
        location: "Kochi, India",
      },
      {
        degree: "Bachelor of Computer Applications (BCA)",
        school: "Nalanda Open University",
        period: "2017 - 2020",
        location: "Patna, India",
      },
    ],
    projects: [
      {
        name: "Ascent",
        description:
          "A cohort-based LMS built as five NestJS services, each with its own Postgres database, behind an Nginx gateway. Kafka carries domain events over the transactional outbox pattern with idempotent consumers; enrollment claims a seat with an atomic conditional update, load-tested at 20 concurrent requests on a 5-seat cohort with no overselling.",
        href: "https://github.com/BiSemaphore/ascent",
      },
      {
        name: "Booking.go",
        description:
          "A multi-tenant SaaS for slot-based booking, where one backend serves many independent businesses without their data crossing. Express and TypeScript on a strict route to service to repository path, with Postgres, MongoDB, and Redis each doing what they are good at.",
        href: "https://github.com/Booking-Go",
      },
      {
        name: "beeline",
        description:
          "A command palette over 80,000 records that searches entirely in the browser, with no search server. A typed-array index answers at p95 of 1ms per keystroke at typing pace, forgives typos, and ships with a benchmark you can run inside the app.",
        href: "https://github.com/shahid-io/beeline",
      },
      {
        name: "Polaris",
        description:
          "Flight search across six providers that recognises the same marketed flight sold by different sellers, so each flight is one row carrying every price. A provider that fails becomes a visible status instead of a failed search. NestJS and Next.js in a Turborepo monorepo, 263 tests.",
        href: "https://github.com/shahid-io/polaris",
      },
      {
        name: "notebook-kit",
        description:
          "Turns markdown into annotatable study-notebook PDFs: block directives, hand-drawn SVG figures, a linter that fails the build, and a generated question bank. Python 3 and headless Chrome, no third-party packages.",
        href: "https://github.com/shahid-io/notebook-kit",
      },
    ],
    certifications: [
      {
        name: "Data Structures, Algorithms and System Design",
        issuer: "Scaler Academy",
        year: "2026",
        href: "https://www.scaler.com/academy/profile/7fa6a80ade33",
      },
      {
        name: "Backend Engineering with Java and Spring Boot, cohort programme",
        issuer: "Algocamp",
        year: "2025",
      },
      {
        name: "Backend Engineering Cohort",
        issuer: "Airtribe",
        year: "2024",
      },
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
    events: [
      {
        name: "HackerRank Orchestrate",
        kind: "hackathon",
        host: "HackerRank",
        date: "2026-09-13",
        cover: "/events/hackerrank-orchestrate.jpg",
        logo: "/events/logo-hackerrank.svg",
        note: "A 24-hour hackathon. Built an agent that decides whether someone can safely afford a purchase: a deterministic cash-flow engine plans the payment, and a language model only reads the messages and receipts behind it.",
      },
      {
        name: "IBM Bob Hands-on Lab",
        kind: "workshop",
        host: "IBM WatsonLabs India",
        date: "2026-07-11",
        location: "IBM India, Gurugram",
        note: "A day of building with IBM Bob across the development lifecycle: code generation, GitHub integration, CI/CD, pull request review, and Java modernization.",
        href: "https://luma.com/192h2elm",
        cover: "/events/ibm-bob-lab.jpg",
        logo: "/events/logo-ibm.png",
      },
      {
        name: "AI Builders Mixer: Delhi Edition",
        kind: "meetup",
        host: "The AI Builders",
        date: "2026-07-05",
        location: "Masters' Union, Gurugram",
        note: "Conversations with people building AI products in Delhi NCR about careers, learning paths, and where the work is.",
        href: "https://luma.com/8sboash7",
        cover: "/events/ai-builders-mixer.jpg",
        logo: "/events/logo-ai-builders.png",
      },
      {
        name: "AI Builders Meet-up 2026: Delhi NCR",
        kind: "meetup",
        host: "Indian Data Club",
        date: "2026-06-13",
        location: "ThoughtWorks, Gurugram",
        note: "Panels on AI careers and industry trends, and a technical session on building autonomous agents with Google's Agent Development Kit.",
        href: "https://luma.com/2782mgfb",
        cover: "/events/idc-ai-builders.jpg",
        logo: "/events/logo-indian-data-club.png",
      },
      {
        name: "Kochi FOSS meetups",
        kind: "meetup",
        host: "FOSS United Kochi",
        date: "2023",
        until: "2026",
        location: "Kochi",
        note: "The monthly free and open source software meetup in Kochi, a regular stop while living there.",
        href: "https://kochifoss.org/",
        cover: "/events/kochi-foss.jpg",
        logo: "/events/logo-kochi-foss.svg",
      },
    ],
  },
  {
    name: "Sanny Kumar",
    slug: "sanny",
    role: "Software Engineer",
    focus: "Core development",
    description:
      "Full-stack engineer who has spent three years building and running an e-commerce platform end to end.",
    bio: [
      "Sanny is a full-stack engineer at Binary Semaphore. He has spent nearly three years at Mosh Ecom Services in Bengaluru, building and running an e-commerce platform: the storefront, the APIs behind it, the Amazon Seller Central integration, and the file storage on S3.",
      "He works across the MERN stack, Java, PHP and Laravel, with SQL underneath, and started out shipping Android and Java projects during his MCA at Cochin University, where he and Shahid studied together.",
      "At the studio he works alongside Shahid on the core product, with a preference for code that reads plainly and abstractions that stay honest as the system grows.",
    ],
    skillGroups: [
      { title: "Languages", items: ["JavaScript", "Java", "Python", "PHP", "SQL"] },
      { title: "Web", items: ["React", "Node.js", "Express", "Laravel", "REST APIs", "HTML", "CSS"] },
      { title: "Data and cloud", items: ["MongoDB", "MySQL", "Amazon S3", "Amazon Seller Central"] },
      { title: "Foundations", items: ["Data structures and algorithms"] },
    ],
    experience: [
      {
        role: "Full Stack Developer",
        company: "Mosh Ecom Services",
        period: "Nov 2023 - Present",
        location: "Bengaluru, India",
        summary:
          "Builds and runs an e-commerce platform end to end, from the storefront and its APIs to the Amazon Seller Central integration and S3 storage.",
        stack: ["React", "Node.js", "Laravel", "PHP", "MySQL", "Amazon S3"],
      },
      {
        role: "Java Developer",
        company: "Oasis Infobyte",
        period: "Jun 2023 - Jul 2023",
        summary: "Two Java projects delivered during a short engagement.",
        stack: ["Java"],
      },
      {
        role: "Android Developer",
        company: "PHN Technology",
        period: "Apr 2023 - Jun 2023",
        stack: ["Android", "Java"],
      },
    ],
    education: [
      {
        degree: "Master of Computer Applications (MCA)",
        school: "Cochin University of Science and Technology",
        period: "2021 - 2023",
        location: "Kochi, India",
      },
      {
        degree: "Bachelor of Computer Applications (BCA)",
        school: "Nalanda Open University",
        period: "2017 - 2020",
        location: "Patna, India",
      },
    ],
    certifications: [
      { name: "Java (Basic)" },
      { name: "HTML" },
      { name: "CSS" },
    ],
    email: "ksanny556@gmail.com",
    linkedin: "https://www.linkedin.com/in/supersanny/",
    github: "https://github.com/SuperSanny",
  },
];

/**
 * Learn is an offer, not a product, so it stays out of `projects` and the
 * homepage grid. A team member can still list it under `builds`.
 */
const learnBuild: Project = {
  name: mentorship.headline,
  tagline: mentorship.summary.split(". ")[0] + ".",
  description: mentorship.summary,
  tags: ["Mentorship", "Computer science", "One to one"],
  href: "https://learn.binarysemaphore.com",
  cover: "/projects/learn.jpg",
};

/** Resolve a `builds` slug: a project, or "learn" for the mentorship offer. */
export function getStudioBuild(slug: string): Project | undefined {
  return slug === "learn" ? learnBuild : projects.find((p) => p.slug === slug);
}

/** Find a team member by slug (for the detail page). */
export function getTeamMember(slug: string): TeamMember | undefined {
  return team.find((m) => m.slug === slug);
}

/** Find a service area by slug (for the detail page). */
export function getService(slug: string) {
  return site.services.items.find((s) => s.slug === slug);
}

export const projects: Project[] = [
  {
    name: "Resume",
    tagline: "Build a clean resume and export a pixel-perfect PDF.",
    description:
      "A resume builder with 21 templates, a live side-by-side editor, rich text, and one-click PDF export. Free, runs in your browser, and your data stays in your account.",
    tags: ["Next.js", "Supabase", "PDF", "Templates"],
    href: "https://resume.binarysemaphore.com",
    cover: "/projects/resume.jpg",
    status: "live",
    featured: true,
    slug: "resume",
    detail: {
      lede: "A resume builder where the preview is the PDF: same pagination, same page breaks, no surprises on export.",
      statements: [
        "What you see paginated is what you export.",
        "Free. Your data stays in your account.",
      ],
      overview: [
        "Most browser-based resume builders show you a preview that is roughly what you will get. Then you export, and a bullet is cut in half across the page break, or a section heading is stranded alone at the bottom of page one. The preview and the exporter were two different pieces of code that agreed on the styling and disagreed on the math.",
        "This one shares the math. The on-screen preview and the print document run the same pagination module, so a break in the preview is a break in the PDF, in the same place, every time. You draft on the left, watch the paginated pages on the right at true print size, and export what you already looked at.",
        "It is free, it runs in the browser, and your resumes live in your own account. Sign in with GitHub or Google, pick from 21 templates, write with rich text where it helps, and download a PDF when you are done.",
      ],
      howItWorks: [
        {
          step: "Sign in",
          body: "GitHub or Google OAuth through Supabase Auth. Row-level security scopes every read and write to your account, so the database itself enforces the boundary rather than the application remembering to.",
        },
        {
          step: "Draft side by side",
          body: "The editor holds the content; the paper beside it renders at true print size. Rich text is supported where a resume actually needs it, and templates change the presentation without touching what you wrote.",
        },
        {
          step: "Paginate honestly",
          body: "The preview measures the laid-out document and slices it into pages at safe boundaries: between two lines of a paragraph, never through one, and never leaving a heading alone at the foot of a page.",
        },
        {
          step: "Export",
          body: "A serverless function opens the chrome-free print route in headless Chromium, carrying your session so it renders your document, and streams back a PDF as a direct download with no browser print dialog.",
        },
      ],
      features: [
        {
          title: "One pagination module, two renderers",
          body: "The preview and the print page import the same pure-DOM measurement code. That is the whole trick behind WYSIWYG here: there is no second implementation to drift out of agreement with the first.",
        },
        {
          title: "Breaks between lines, not through them",
          body: "Most page-break logic works on block boundaries, which is why a five-line bullet either overflows or jumps wholesale to the next page. This measures the individual client rects of a block's text, merging the fragments a bold or a link splits a line into, so a break can land between line three and line four of one bullet.",
        },
        {
          title: "Headings keep their content",
          body: "Section labels and entry titles are marked keep-with-next, so a page never ends with a heading whose content starts overleaf. It is a small rule that separates a document that looks typeset from one that looks generated.",
        },
        {
          title: "PDF export inside the size limit",
          body: "Headless Chromium does not fit in a serverless bundle by default. The build ships brotli-compressed binaries via @sparticuz/chromium and runs on the Node runtime with a longer duration, so a cold start still renders. Locally it drives your installed Chrome instead.",
        },
        {
          title: "Export that fails loudly",
          body: "The renderer authenticates by forwarding the caller's cookies, and the target host is validated before Chromium is ever pointed at it. If the forwarded session does not authenticate, the print page redirects to login, and the route returns an error rather than handing you a PDF of a login screen.",
        },
        {
          title: "Templates without lock-in",
          body: "21 templates sit on top of one content model, so switching template is a presentation change and never a rewrite. Content stays yours in Supabase, scoped to your account.",
        },
      ],
      facts: [
        { label: "Type", value: "Web app, free" },
        { label: "Live at", value: "resume.binarysemaphore.com" },
        { label: "Frontend", value: "Next.js 16 · React 19 · Tailwind v4" },
        { label: "Backend", value: "Supabase (Postgres + Auth, RLS)" },
        { label: "Auth", value: "GitHub and Google OAuth" },
        { label: "Export", value: "puppeteer-core + @sparticuz/chromium" },
        { label: "Templates", value: "21" },
        { label: "Hosting", value: "Vercel" },
      ],
    },
  },
  {
    name: "inode",
    tagline:
      "A Go CLI for retrieval-augmented search over notes, commands, and secrets.",
    description:
      "Embeds every note, fetches the nearest ones to a question with k-nearest-neighbour search, and has a language model answer only from those. SQLite with sqlite-vec and Ollama by default, so it runs on your machine; PostgreSQL with pgvector, Claude, OpenAI, and Voyage AI are opt-in, and a read-only MCP server lets Claude Code or Cursor query the same store.",
    tags: ["Go", "RAG", "pgvector", "MCP", "Ollama"],
    href: "https://github.com/shahid-io/inode",
    cover: "/projects/inode.png",
    featured: true,
    slug: "inode",
    subdomain: "inode",
    detail: {
      lede: "A Go CLI that stores notes, commands, and secrets as vector embeddings and answers natural-language questions over them with retrieval-augmented generation.",
      statements: [
        "Embed, search by distance, answer from the matches.",
        "AES-256-GCM for secrets. SQLite and sqlite-vec for storage.",
      ],
      overview: [
        "Every developer accumulates a pile of scattered knowledge: the staging database password, the exact flags for a deploy, a snippet you wrote once and will need again. It ends up in notes apps, shell history, password managers, and stray text files. The problem is rarely storing it. The problem is finding it again, weeks later, when you no longer remember the exact words you used.",
        "inode treats that as a retrieval problem. Every note is embedded into a vector space, a question is embedded into the same space, and the notes closest to it by L2 distance become the context a language model answers from. So “the staging database password” finds the entry you saved as “RDS creds for stage”: the two share no words, but their vectors sit close together.",
        "It is built to run entirely on your machine. By default there are no API keys, no accounts, and no network calls: embeddings and language-model inference run locally through Ollama, and everything is stored in a single SQLite file you own. When you want higher-quality results, you can point it at cloud backends without changing a single command you type.",
      ],
      howItWorks: [
        {
          step: "Classify",
          body: "On add, a language model assigns one of nine fixed categories (credentials, commands, snippets, decisions, runbooks, learnings, references, contacts, notes), proposes tags, and flags sensitive content. Anything outside the set falls back to notes, and an explicit --category always wins.",
        },
        {
          step: "Embed",
          body: "The note is embedded with nomic-embed-text through Ollama, or voyage-3 through Voyage AI. Both return L2-normalised vectors, so distances fall between 0 and 2 and a fixed relevance threshold means the same thing for every note.",
        },
        {
          step: "Store",
          body: "Content goes into a notes table and the vector into a sqlite-vec vec0 virtual table in the same SQLite file, or into a vector(N) column when the backend is PostgreSQL with pgvector. Sensitive content is sealed with AES-256-GCM before it is written.",
        },
        {
          step: "Retrieve, filter, answer",
          body: "The question is embedded the same way and the five nearest notes come back by L2 distance. Any candidate further than 1.0 (cosine similarity below 0.5) is dropped, sensitive notes are decrypted in memory, and the rest become the model's only context. The model reports which notes it used, and only those are listed as sources.",
        },
      ],
      features: [
        {
          title: "Retrieval that survives different wording",
          body: "Matching happens between embeddings, not strings, so “prod logging config” finds a runbook titled “observability setup”. The distance ceiling keeps weak matches out of the context window rather than letting the model improvise from them, and when nothing clears it inode says so instead of answering.",
        },
        {
          title: "Runs on your machine, cloud is opt-in",
          body: "Storage, embeddings, and the language model each sit behind an adapter interface: SQLite or PostgreSQL, Ollama or Voyage AI, and Ollama, Claude, or OpenAI. The default is SQLite, nomic-embed-text, and llama3.2, with no API keys and nothing leaving your laptop. Switching a backend is a config change; the commands stay the same.",
        },
        {
          title: "Secrets handled like secrets",
          body: "Sensitive notes are sealed with AES-256-GCM under a fresh random nonce, with the note ID bound as additional authenticated data, so a ciphertext copied onto another row fails to decrypt. The key is derived with Argon2id from a 32-byte master secret held in the OS keyring. Values stay masked in output until you pass --reveal.",
        },
        {
          title: "An MCP server your editor can read",
          body: "inode mcp serves the Model Context Protocol over stdio with three read-only tools: search_notes, list_notes, and get_note. Search skips the local model and returns the raw candidates, because the calling agent is a language model already. Sensitive notes are excluded from search and masked in get_note unless you opt in.",
        },
      ],
      usage: [
        {
          command: 'inode add "My Stripe test key is sk_test_xxxxx"',
          description:
            "The model classifies it as credentials, adds tags, and flags it sensitive, so it is encrypted before it is stored.",
        },
        {
          command: 'inode get "stripe test key"',
          description:
            "Embeds the query, runs k-nearest-neighbour search, drops weak matches, and answers from what is left. Aliases: ask, find, search.",
        },
        {
          command: 'inode get "stripe test key" --reveal',
          description:
            "Sensitive values are masked by default. --reveal prompts for confirmation, then prints the plaintext.",
        },
        {
          command: "inode list --category credentials",
          description:
            "Lists notes by category or tag straight from the table, without touching the vector index.",
        },
        {
          command: "inode mcp",
          description:
            "Run the read-only MCP server over stdio so Claude Code or Cursor can read your knowledge base.",
        },
      ],
      facts: [
        { label: "Language", value: "Go" },
        { label: "Retrieval", value: "k-NN by L2 distance, cutoff 1.0" },
        { label: "Storage", value: "SQLite + sqlite-vec · PostgreSQL + pgvector" },
        { label: "Embeddings", value: "nomic-embed-text (Ollama) · voyage-3" },
        { label: "Language models", value: "Ollama · Claude · OpenAI" },
        { label: "Encryption", value: "AES-256-GCM, Argon2id-derived key" },
        { label: "Integrations", value: "MCP over stdio, read-only" },
        {
          label: "Categories",
          value: "9 (credentials, commands, runbooks, …)",
        },
        { label: "Install", value: "go install · Linux release binary" },
      ],
    },
  },
  {
    name: "Ascent",
    tagline:
      "A cohort-based learning platform, built as a real distributed system.",
    description:
      "An LMS where instructors author curricula, admins open cohorts with limited seats, and learners move through the content together. Five NestJS services, one database each, Kafka between them, with deliberate depth on the hard parts: seat concurrency, event-driven consistency, and payments.",
    tags: ["NestJS", "TypeScript", "PostgreSQL", "Kafka", "Microservices"],
    href: "https://github.com/BiSemaphore/ascent",
    status: "v0.3",
    slug: "ascent",
    detail: {
      lede: "A cohort-based EdTech platform built as a microservices system, with the seat and event problems solved properly rather than papered over.",
      statements: [
        "Five services. One database each. No shared tables.",
        "Two people, one last seat. Only one gets in.",
      ],
      overview: [
        "Ascent is a cohort-based learning platform in the shape of Scaler or a bootcamp: instructors author programs, courses, modules, and lessons; admins open a scheduled cohort with a fixed number of seats; learners buy a seat and move through the content as a group. Content authoring is the CMS side, delivery is the learner side, one product with two audiences.",
        "It is built as a microservices system on purpose. The interesting part of a platform like this is not the CRUD, it is what happens when a hundred people hit a five-seat cohort at the same time, or when a payment succeeds but the service that grants the seat is down. Those are the problems the architecture is arranged around.",
        "The build is phased and each phase ships as a tagged release: auth and content behind a gateway, then cohorts and concurrency-safe enrollment, then the Kafka event backbone and a projection service, then payments. The roadmap, architecture decisions, and per-service data model are written down in the repo rather than living in someone's head.",
      ],
      howItWorks: [
        {
          step: "Everything enters through one door",
          body: "An Nginx gateway is the single entry point on port 8080, routing /api/* to the service that owns it and doing per-IP rate limiting at the edge, so no service has to reimplement it.",
        },
        {
          step: "Each service owns its data",
          body: "Auth, content, cohort, payment, and progress each have their own Postgres database with Drizzle migrations. Services share code through workspace libraries, never through tables, so one service cannot quietly depend on another's schema.",
        },
        {
          step: "A seat is claimed atomically",
          body: "Enrollment runs an atomic conditional update (WHERE seats_taken < seat_limit) inside a transaction, backed by a unique constraint. The database decides the winner, so two concurrent requests for the last seat cannot both succeed.",
        },
        {
          step: "State changes become events",
          body: "The event is written to an outbox table in the same transaction as the state change. A relay polls it with FOR UPDATE SKIP LOCKED, publishes to Kafka, and stamps it published, so there is no dual write and nothing is lost when the broker is down.",
        },
        {
          step: "Consumers project, idempotently",
          body: "The progress service holds no source of truth. It consumes learner.enrolled and lesson.completed and rebuilds per-learner state from them, deduplicating on a processed_events table so at-least-once redelivery never double counts.",
        },
      ],
      features: [
        {
          title: "Concurrency-safe enrollment, load-tested",
          body: "Reading the seat count and then writing it back is the classic lost-update bug, and it only shows up under real traffic. Ascent claims the seat in one conditional statement instead. Load-tested at 20 concurrent enrollments against a 5-seat cohort: exactly 5 learners get in, every run, with no overselling.",
        },
        {
          title: "Transactional outbox instead of dual writes",
          body: "Writing to the database and then publishing to Kafka is two writes that can disagree: the row commits, the publish fails, and the rest of the system never hears about it. The outbox makes the event part of the same transaction, and a separate relay does the publishing, which turns an impossible guarantee into an ordinary one.",
        },
        {
          title: "Payments decoupled from seat allocation",
          body: "Stripe Checkout takes the money and a signature-verified webhook writes payment.completed to the payment service's own outbox. Cohort consumes that event and enrolls the buyer through the same concurrency-safe path. Paid cohorts reject direct enrollment; free ones still enroll straight through.",
        },
        {
          title: "One service per bounded context",
          body: "Auth, content, cohort, payment, and progress are split by what they own, not by layer. Each is a NestJS service with validated env config that fails fast, a health check that pings its datastores, graceful shutdown, Swagger docs, and RBAC from a shared @ascent/auth library.",
        },
        {
          title: "The right store for each job",
          body: "Postgres holds the transactional core, one database per service. MongoDB takes the append-heavy activity and audit logs, kept off the relational path. Event contracts live in a shared @ascent/contracts package so producers and consumers cannot drift.",
        },
        {
          title: "A frontend with real layering",
          body: "The Angular app follows component to facade to repository to HttpClient, feature-first with lazy routes, auth and error interceptors, OnPush change detection, and a role directive for permission gating. A public catalog lets anonymous visitors browse open cohorts over safe projections that never expose internal fields.",
        },
      ],
      facts: [
        { label: "Type", value: "Cohort-based LMS, microservices" },
        {
          label: "Services",
          value: "auth · content · cohort · payment · progress",
        },
        {
          label: "Data",
          value: "PostgreSQL (one per service) · MongoDB · Redis",
        },
        { label: "Async", value: "Kafka (KRaft), transactional outbox" },
        { label: "Gateway", value: "Nginx (routing, rate limiting)" },
        { label: "Frontend", value: "Angular (standalone, signals)" },
        { label: "Payments", value: "Stripe Checkout + webhooks" },
        { label: "Local run", value: "Docker Compose, one command" },
        { label: "Status", value: "v0.3.0 shipped, payments in progress" },
      ],
    },
  },
  {
    name: "notchify",
    tagline: "A developer toolbox that lives in your Mac's camera notch.",
    description:
      "Stays hidden until you move the cursor to the notch (or press a global hotkey), then drops a panel of small tools you reach for while building: a file shelf you can drag in and out of any app, searchable clipboard history grouped into links, colors, code, and text, format converters for JSON, Base64, and URLs, a screen color picker and generators (UUID, timestamps), and a port peek that shows what is listening and lets you free it. Follows light or dark mode, and runs entirely on your machine with no dock or menu-bar icon.",
    tags: ["Swift", "macOS", "AppKit", "SwiftUI"],
    href: "https://github.com/BiSemaphore/notchify",
    cover: "/projects/notchify/cover.jpg",
    featured: true,
    slug: "notchify",
    detail: {
      lede: "A small developer toolbox that hides in your Mac's camera notch and drops down when you need it.",
      statements: [
        "Hidden until you need it. Gone when you don't.",
        "Runs on your machine. No dock icon, no account.",
      ],
      overview: [
        "The notch on a modern Mac is mostly dead space. Meanwhile the small things a developer reaches for all day (a spot to park a file mid-drag, the last thing you copied, the hex of a color on screen, the process squatting on a port) are scattered across apps, menu bars, and terminal commands. None is hard on its own. Together they add up to a lot of little context switches.",
        "notchify puts those tools in the notch. It stays invisible until you move the cursor up to the notch, then a clean panel drops down with five tabs: Shelf, Clipboard, Format, Tools, and Camera. The panel follows your system appearance, light or dark, and you can also bring it up with a global hotkey (⌥⌘N by default, no Accessibility permission needed). Move away and it tucks back up. There is no dock icon and no menu bar icon, so it stays out of the way until the moment you want it. You open Settings from a gear in the panel to toggle tabs, set launch at login, choose the hotkey, and tune the hover behavior.",
        "Everything runs on your machine. There is no account and nothing leaves your Mac. The only permission it ever asks for is the camera, and only when you open the Camera tab. It runs outside the App Sandbox because it shells out to system tools like lsof and reads the screen for the color picker, so it is distributed directly rather than through the Mac App Store. macOS 14 or later, MIT licensed.",
      ],
      howItWorks: [
        {
          step: "Shelf",
          body: "Drag a file onto the notch to park it, then drag it back out into any app later (Finder, Mail, Slack, WhatsApp, VS Code). It survives restarts. Hover a file to remove it, or clear the whole shelf at once.",
        },
        {
          step: "Clipboard",
          body: "Recent copies, newest first, automatically grouped into links, colors, code, and text. A search box narrows the list and a filter row jumps to one type; clicking an item copies it back. In Settings you choose how many items to keep and whether history persists across restarts (off by default).",
        },
        {
          step: "Format",
          body: "Paste text and transform it in place: pretty-print or minify JSON, Base64 encode and decode, or URL encode and decode. It is a plain-text editor with no smart-quote substitution, so what you paste is what you get, and one click copies the result back.",
        },
        {
          step: "Tools",
          body: "A screen color picker for any pixel's hex, one-click generators for a UUID, a timestamp, a Unix epoch, a random hex, or lorem, and a port peek that shows what is listening on a port and lets you kill it to free the port.",
        },
        {
          step: "Camera",
          body: "An optional front-camera mirror for a quick check before a call. Off by default, and it only asks for the camera the first time you open it.",
        },
      ],
      features: [
        {
          title: "Lives in the notch, not in your way",
          body: "notchify is invisible until you move the cursor to the notch, or press a global hotkey (⌥⌘N by default, no Accessibility permission needed), then a panel drops down and tucks back up when you leave. It follows your system light or dark appearance. There is no dock icon and no menu bar icon (LSUIElement), so it never adds clutter; you reach Settings from a gear in the panel or by right-clicking it.",
        },
        {
          title: "A shelf that drags into any app",
          body: "Park a file on the notch mid-task and drag it back out later into Finder, Mail, or Chromium-based apps like Slack, WhatsApp, and VS Code that reject a plain URL. It is built on NSFilePromiseProvider, and the shelf survives restarts.",
        },
        {
          title: "Clipboard that sorts itself",
          body: "Your recent copies are kept newest first and auto-classified into Links, Colors, Code, and Text, with a search box and a filter row to find one fast. Click any item to copy it back. You set how many items to keep and whether the history survives a restart, which is off by default. It is a clipboard you can actually find things in.",
        },
        {
          title: "Format text in place",
          body: "A Format tab for the conversions you would otherwise paste into some website: pretty-print or minify JSON, Base64 encode and decode, and URL encode and decode. It is a plain-text editor with no smart-quote substitution, so what you paste is what you get.",
        },
        {
          title: "Runs on your machine",
          body: "No account, and nothing leaves your Mac. The only permission notchify ever requests is the camera, and only when you open the Camera tab. Each tab can be turned off in Settings, alongside launch at login and the hover behavior.",
        },
      ],
      facts: [
        { label: "Language", value: "Swift" },
        { label: "Frameworks", value: "AppKit + SwiftUI" },
        { label: "Platform", value: "macOS 14 (Sonoma) or later" },
        { label: "Footprint", value: "No dock or menu bar icon (LSUIElement)" },
        { label: "Global shortcut", value: "⌥⌘N toggles the panel" },
        { label: "Appearance", value: "Follows system light or dark mode" },
        { label: "Privacy", value: "Runs on your machine, no account" },
        { label: "Permissions", value: "Camera only, on open" },
        {
          label: "Distribution",
          value: "Direct download, outside the Mac App Store",
        },
        { label: "License", value: "MIT" },
        { label: "Version", value: "0.2.0" },
      ],
      screenshots: [
        {
          src: "/projects/notchify/shelf.png",
          alt: "The notchify panel open on the Shelf tab, with parked files ready to drag back out.",
        },
        {
          src: "/projects/notchify/clipboard.png",
          alt: "The Clipboard tab showing recent copies grouped into links, colors, code, and text.",
        },
        {
          src: "/projects/notchify/tools.png",
          alt: "The Tools tab with the color picker, generators, and the port peek field.",
        },
      ],
    },
  },
  {
    name: "Booking.go",
    tagline:
      "Slot-based booking for small businesses, multi-tenant from the start.",
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
