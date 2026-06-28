/**
 * The shape of a resume document. Stored as `jsonb` in `public.resumes.content`
 * (see supabase/schema.sql). Every template renders from this one type, so a
 * resume's data is independent of which template displays it.
 */

export type ResumeBasics = {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
};

export type ResumeExperience = {
  company: string;
  /** Optional company website; makes the company name a clickable link. */
  companyUrl: string;
  role: string;
  /** Free-text month/year, e.g. "Jan 2024". */
  start: string;
  end: string;
  current: boolean;
  bullets: string[];
};

export type ResumeEducation = {
  school: string;
  degree: string;
  field: string;
  start: string;
  end: string;
};

export type ResumeProject = {
  name: string;
  description: string;
  link: string;
};

export type ResumeLink = {
  label: string;
  url: string;
};

export type ResumeContent = {
  basics: ResumeBasics;
  experience: ResumeExperience[];
  education: ResumeEducation[];
  skills: string[];
  projects: ResumeProject[];
  links: ResumeLink[];
};

/** A blank document for a freshly created resume. */
export function emptyResume(): ResumeContent {
  return {
    basics: {
      name: "",
      title: "",
      email: "",
      phone: "",
      location: "",
      website: "",
      summary: "",
    },
    experience: [],
    education: [],
    skills: [],
    projects: [],
    links: [],
  };
}

/**
 * Coerce arbitrary stored JSON into a complete ResumeContent, filling missing
 * fields from emptyResume(). Keeps older/partial rows safe to render and edit.
 */
export function normalizeResume(value: unknown): ResumeContent {
  const base = emptyResume();
  if (!value || typeof value !== "object") return base;
  const v = value as Partial<ResumeContent>;
  return {
    basics: { ...base.basics, ...(v.basics ?? {}) },
    experience: Array.isArray(v.experience)
      ? v.experience.map((e) => ({ ...e, companyUrl: e.companyUrl ?? "" }))
      : base.experience,
    education: Array.isArray(v.education) ? v.education : base.education,
    skills: Array.isArray(v.skills) ? v.skills : base.skills,
    projects: Array.isArray(v.projects) ? v.projects : base.projects,
    links: Array.isArray(v.links) ? v.links : base.links,
  };
}

/**
 * Available templates (max 5). `id` is what we store in `resumes.template_id`;
 * each maps to a renderer in src/components/resume/templates.
 */
export const TEMPLATES = [
  {
    id: "classic",
    label: "Classic",
    description:
      "Clean single column, recruiter-friendly. Bold name, ruled section heads, generous spacing.",
    tags: ["single-column", "minimal", "ats", "sans"],
  },
  {
    id: "swiss",
    label: "Swiss",
    description:
      "Swiss / International Style. Strict baseline grid, all-caps tracked labels, cobalt block accent.",
    tags: ["single-column", "grid", "color-block", "sans"],
  },
  {
    id: "twocol",
    label: "Two-Column",
    description:
      "Two-column layout: a sidebar for skills and links, the main column for experience and projects.",
    tags: ["two-column", "compact", "sans"],
  },
  {
    id: "editorial",
    label: "Editorial",
    description:
      "Magazine feel. Oversized serif name, all-caps tracked section heads, asymmetric rhythm.",
    tags: ["single-column", "serif", "magazine"],
  },
  {
    id: "terminal",
    label: "Terminal",
    description:
      "CLI / shell aesthetic. Prompt-style sections, monospace throughout, syntax-accent labels.",
    tags: ["single-column", "mono", "developer"],
  },
  {
    id: "executive",
    label: "Executive",
    description:
      "Conservative and corporate. Centred name, double-ruled header, deep-navy section labels.",
    tags: ["single-column", "corporate", "formal", "sans"],
  },
  {
    id: "minimal",
    label: "Minimal",
    description:
      "Ultra-spare. No rules, light weights, lots of whitespace. The content does the talking.",
    tags: ["single-column", "minimal", "modern", "sans"],
  },
  {
    id: "saas",
    label: "SaaS",
    description:
      "Modern product look. A teal accent band header, pill skills, clean labels.",
    tags: ["single-column", "color-block", "modern", "sans"],
  },
  {
    id: "academic",
    label: "Academic",
    description:
      "LaTeX-CV aesthetic. Serif type, centred name, small-caps ruled section heads, dense.",
    tags: ["single-column", "serif", "cv", "dense"],
  },
  {
    id: "architect",
    label: "Architect",
    description:
      "Drafting / blueprint feel. Thin rules, monospace labels with a numeric index, precise.",
    tags: ["single-column", "mono", "technical", "grid"],
  },
  {
    id: "banker",
    label: "Banker",
    description:
      "Formal letterhead. Centred serif name over a burgundy rule, conservative spacing.",
    tags: ["single-column", "serif", "formal", "letterhead"],
  },
  {
    id: "brutalist",
    label: "Brutalist",
    description:
      "Bold and loud. Heavy black section bars with reversed labels, oversized name.",
    tags: ["single-column", "bold", "statement", "sans"],
  },
  {
    id: "newspaper",
    label: "Newspaper",
    description:
      "Broadsheet masthead with a double rule, serif type, and a dropped-cap lead.",
    tags: ["single-column", "serif", "editorial"],
  },
  {
    id: "magazine",
    label: "Magazine",
    description:
      "Cover-style. A navy kicker, oversized serif name, tracked subtitle. Bold editorial.",
    tags: ["single-column", "serif", "magazine"],
  },
  {
    id: "display",
    label: "Display",
    description:
      "Typography-forward. An enormous name set tight over a thin contact rule, quiet body.",
    tags: ["single-column", "bold", "modern", "sans"],
  },
  {
    id: "dossier",
    label: "Dossier",
    description:
      "Case-file aesthetic. Bordered header, monospace meta strip, boxed section labels.",
    tags: ["single-column", "mono", "technical"],
  },
  {
    id: "indexcard",
    label: "Index Card",
    description:
      "Ruled record-card look. A tabbed header, hairline row rules, compact spacing.",
    tags: ["single-column", "compact", "sans"],
  },
  {
    id: "letterpress",
    label: "Letterpress",
    description:
      "Warm and literary. Serif type, italic accents, centred small-caps section heads.",
    tags: ["single-column", "serif", "formal"],
  },
  {
    id: "mirror",
    label: "Mirror",
    description:
      "Fully centred and symmetric. Balanced headings and rules. Calm and formal.",
    tags: ["single-column", "modern", "sans"],
  },
  {
    id: "periodical",
    label: "Periodical",
    description:
      "Academic-journal byline. Ruled running head with volume meta, serif body.",
    tags: ["single-column", "serif", "cv"],
  },
  {
    id: "specsheet",
    label: "Spec Sheet",
    description:
      "Datasheet aesthetic. Monospace labels in a left rail, content right, hairline rows.",
    tags: ["single-column", "mono", "technical", "developer"],
  },
] as const;

export type TemplateId = (typeof TEMPLATES)[number]["id"];

export type Template = (typeof TEMPLATES)[number];

export const DEFAULT_TEMPLATE: TemplateId = "classic";

export function isTemplateId(value: string): value is TemplateId {
  return TEMPLATES.some((t) => t.id === value);
}

/** Sorted unique set of all template tags (for the gallery filter chips). */
export const ALL_TEMPLATE_TAGS: readonly string[] = [
  ...new Set(TEMPLATES.flatMap((t) => t.tags)),
].sort();

/**
 * "Tune" settings — how the resume is fit onto the page. All applied as CSS so
 * the resume genuinely reflows and paginates across pages.
 *
 * - scale: overall zoom, stored as a percent (CSS `zoom`).
 * - padTop / padBottom: page margins in mm (override the template's vertical
 *   padding via CSS variables).
 */
export const SCALE_MIN = 60;
export const SCALE_MAX = 130;
export const DEFAULT_SCALE = 100;

export const PAD_MIN = 0;
export const PAD_MAX = 40;
// Default vertical page margin in mm. Matches the reference (resumex) paper,
// which uses ~15mm top/bottom and 16mm left/right (the horizontal margin is
// fixed in the templates; only top/bottom are tunable).
export const DEFAULT_PAD = 15;

export function clampScale(pct: number): number {
  if (!Number.isFinite(pct)) return DEFAULT_SCALE;
  return Math.min(SCALE_MAX, Math.max(SCALE_MIN, Math.round(pct)));
}

export function clampPad(mm: number): number {
  if (!Number.isFinite(mm)) return DEFAULT_PAD;
  return Math.min(PAD_MAX, Math.max(PAD_MIN, Math.round(mm)));
}

/** The CSS `zoom` value for a scale percent. */
export function scaleZoom(scalePct: number): number {
  return clampScale(scalePct) / 100;
}

/**
 * Density presets: quick shortcuts that set the scale. "tight" fits more per
 * page; "roomy" gives more room. The slider stays the source of truth.
 */
export const DENSITIES = [
  { id: "tight", label: "Tight", scale: 90 },
  { id: "regular", label: "Regular", scale: 100 },
  { id: "roomy", label: "Roomy", scale: 108 },
] as const;

export type Density = (typeof DENSITIES)[number]["id"];

/** The density preset matching a scale, if any (for highlighting). */
export function densityForScale(scalePct: number): Density | null {
  return DENSITIES.find((d) => d.scale === scalePct)?.id ?? null;
}

/**
 * Page size for PDF export. A4 is the global default; Letter for US/Canada.
 * `css` is the value used in the `@page { size }` rule.
 */
export const PAGE_SIZES = [
  { id: "a4", label: "A4", css: "A4" },
  { id: "letter", label: "Letter", css: "letter" },
] as const;

export type PageSize = (typeof PAGE_SIZES)[number]["id"];

export const DEFAULT_PAGE_SIZE: PageSize = "a4";

export function isPageSize(value: string): value is PageSize {
  return PAGE_SIZES.some((p) => p.id === value);
}

/** The `@page { size }` keyword for a page size (defaults to A4). */
export function pageSizeCss(pageSize: string): string {
  return PAGE_SIZES.find((p) => p.id === pageSize)?.css ?? "A4";
}

/** CSS pixels per millimetre at 96dpi (the print baseline). */
export const PX_PER_MM = 96 / 25.4;

/** Physical page dimensions in millimetres, for the WYSIWYG paper + page breaks. */
export type PageDims = { wMm: number; hMm: number };

const PAGE_DIMS: Record<PageSize, PageDims> = {
  a4: { wMm: 210, hMm: 297 },
  letter: { wMm: 215.9, hMm: 279.4 },
};

/** Page dimensions in mm (defaults to A4). */
export function pageDims(pageSize: string): PageDims {
  return PAGE_DIMS[(pageSize as PageSize) in PAGE_DIMS ? (pageSize as PageSize) : "a4"];
}

/** Fixed horizontal page margin in mm (left/right). Vertical is tunable. */
export const PAGE_MARGIN_X = 16;

/**
 * Body-text alignment. "left" is the default (most readable / ATS-safe);
 * "justify" fills lines edge-to-edge. Applied to the resume content wrapper;
 * a template's explicit header alignment (centred names, etc.) still wins.
 */
export const TEXT_ALIGNS = [
  { id: "left", label: "Left" },
  { id: "justify", label: "Justify" },
] as const;

export type TextAlign = (typeof TEXT_ALIGNS)[number]["id"];

export const DEFAULT_ALIGN: TextAlign = "left";

export function isTextAlign(value: string): value is TextAlign {
  return TEXT_ALIGNS.some((a) => a.id === value);
}
