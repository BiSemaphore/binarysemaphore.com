/**
 * Shapes for everything in `src/lib/site.ts`.
 *
 * Split out because site.ts had grown to 1,821 lines: 302 of types followed
 * by a single object literal. Types change for different reasons than copy
 * does, and separating them means a copy edit no longer shows up in the same
 * diff as a shape change.
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
  /** Optional screenshot gallery (square images, paths under /public). */
  screenshots?: { src: string; alt: string }[];
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
  /**
   * Product screenshot for the compact build cards on team profiles (path
   * under /public), 1200:627. Kept apart from `image` so the homepage grid,
   * where only some products have one, is unaffected.
   */
  cover?: string;
  /** Optional: shown as a small monospace label on the card, e.g. "v0.3". */
  status?: string;
  featured?: boolean;
  /** When set, the card links to /projects/<slug> and a detail page is built. */
  slug?: string;
  /** When set, the product is served at <subdomain>.binarysemaphore.com. */
  subdomain?: string;
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
  /** Square avatar (path under /public). Falls back to initials when unset. */
  avatar?: string;
  /** Alt text for the avatar. Required when `avatar` is set. */
  avatarAlt?: string;
  /** Longer bio paragraphs for the detail page. DRAFT — edit freely. */
  bio?: string[];
  /** Skills / focus areas shown as chips on the detail page. */
  skills?: string[];
  /** Skills grouped by area. Takes over from `skills` when present. */
  skillGroups?: { title: string; items: string[] }[];
  /** Work experience (paste from LinkedIn). Rendered only when present. */
  experience?: {
    role: string;
    company: string;
    /** e.g. "2023 - Present" or "Jun 2022 - Jan 2024". */
    period?: string;
    /** City, country. */
    location?: string;
    summary?: string;
    /** What was actually built there, one line each. */
    highlights?: string[];
    /** Tech used on that role, rendered as small mono chips. */
    stack?: string[];
  }[];
  /** Education. Rendered only when present. */
  education?: {
    degree: string;
    school: string;
    /** e.g. "2021 - 2023". */
    period?: string;
    location?: string;
  }[];
  /**
   * Slugs from `projects` (or "learn") this person builds at the studio,
   * resolved by `getStudioBuild`. Rendered near the top of the detail page as
   * product cards, so the studio's work leads and `projects` below becomes
   * "Other projects". Unknown slugs are skipped.
   */
  builds?: string[];
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

/**
 * The one-to-one mentorship offer at learn.binarysemaphore.com.
 *
 * TODO(shahid): three things only you can fill in, marked below: the real list
 * of papers you can mentor, how long a session runs and how often, and whether
 * it is paid. There is deliberately no cost language anywhere until you decide.
 */
export type Mentorship = {
  eyebrow: string;
  /** The plain half of the headline. */
  headline: string;
  /** The half set in the handwritten face, as if annotated afterwards. */
  headlineHand: string;
  /** One sentence on the offer, for metadata and cards that link to Learn. */
  summary: string;
  lead: string;
  /**
   * What a student might say they are stuck on, in their words. Shown as
   * torn-off scraps, so these should read like a person talking rather than a
   * syllabus.
   */
  stuckOn: string[];
  /** How it actually works. Three, because more is a process diagram. */
  how: { step: string; body: string }[];
  /**
   * Cal.com booking link. Empty hides the booking button everywhere and the
   * form becomes the way in, so the page is never broken while this is unset.
   */
  bookingUrl: string;
  /** What to bring. */
  bring: string;
  /** Answering "what is this", plainly, in two columns. */
  isThis: string[];
  isNotThis: string[];
  /**
   * Real prompts, quoted from our own Question Bank notebook rather than
   * written for the page. They show the register a session works in: a question
   * you either can answer out loud or cannot.
   */
  sampleQuestions: { question: string; from: string }[];
  /**
   * Three students, described so one of them is recognisably you. The third is
   * the newest and the least written about anywhere: the assignment works, an
   * agent wrote it, and there is nothing behind it to say in a viva.
   */
  profiles: { tag: string; said: string; title: string; body: string }[];
  /**
   * One question taken apart in public. Showing the reasoning is worth more
   * than any number of claims about the reasoning, so this gets real space on
   * the page.
   */
  workedExample: {
    label: string;
    asked: string;
    steps: { title: string; body: string }[];
    verdict: string;
  };
  /**
   * Ten questions you can either answer out loud or cannot. Scored in the
   * browser and never sent anywhere: the point is the reader finding out, not
   * us finding out.
   */
  selfCheck: {
    title: string;
    lead: string;
    questions: { question: string; tag: string }[];
    note: string;
  };
  /**
   * The AI section. Not prompt tips: what is actually happening between the
   * question and the answer, in the same register as the rest of the page.
   */
  ai: {
    label: string;
    title: string;
    lead: string;
    /** The pipeline, drawn left to right. Four stages, because five is a lecture. */
    stages: { name: string; body: string }[];
    /** Index cards. One honest sentence each, no hedging. */
    glossary: { term: string; body: string }[];
    /** What it cannot do, said plainly, because everyone else skips it. */
    honest: string;
    /** Our own shipped proof, linked rather than described. */
    proof: { body: string; href: string; label: string };
  };
  /**
   * The subjects, drawn as a tree rather than listed as a syllabus. A branch
   * with a `roadmap` slug becomes a link into that map; the rest are still
   * just labels, which is honest until those maps are drawn.
   */
  syllabus: { branch: string; leaves: string[]; roadmap?: string }[];
  /** What an hour actually consists of. Logistics reassure more than pep talk. */
  session: { label: string; body: string }[];
  faq: { q: string; a: string }[];
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
  /**
   * Public Discord invite ("" hides every Discord link). Use the permanent
   * invite from Server Settings -> Invites, not a 7-day one from the channel
   * menu, or every link on the site dies after a week.
   */
  discord: string;
  /** Public Instagram profile URL ("" hides Instagram links/feed). */
  instagram: string;
  /** Handle without the @, used for labels. */
  instagramHandle: string;
  formspreeId: string;
  about: string[];
  mentorship: Mentorship;
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
    items: {
      /** URL slug for the detail page (/services/<slug>). */
      slug: string;
      title: string;
      /** Short blurb shown on the card. */
      body: string;
      /** One-line summary at the top of the detail page. */
      lede: string;
      /** Intro paragraphs on the detail page. */
      overview: string[];
      /** "What this involves" sub-areas on the detail page. */
      offerings: { title: string; body: string }[];
    }[];
  };
  /** Honest at-a-glance facts shown under the hero. */
  stats: { value: string; label: string }[];
  /** Tech stack: logo'd tools (marquee) plus concept items shown as text. */
  techStack: {
    label: string;
    title: string;
    lead: string;
    /** `slug` matches an SVG at /public/tech/<slug>.svg. */
    tools: { slug: string; name: string }[];
    concepts: string[];
  };
  /** Frequently asked questions (honest Q&A accordion). */
  faq: {
    label: string;
    title: string;
    items: { q: string; a: string }[];
  };
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
