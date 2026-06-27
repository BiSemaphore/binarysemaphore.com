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
    experience: Array.isArray(v.experience) ? v.experience : base.experience,
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
  { id: "classic", label: "Classic" },
  { id: "swiss", label: "Swiss" },
  { id: "twocol", label: "Two-Column" },
  { id: "editorial", label: "Editorial" },
  { id: "terminal", label: "Terminal" },
] as const;

export type TemplateId = (typeof TEMPLATES)[number]["id"];

export const DEFAULT_TEMPLATE: TemplateId = "classic";

export function isTemplateId(value: string): value is TemplateId {
  return TEMPLATES.some((t) => t.id === value);
}

/**
 * Fit-to-page density. Applied as CSS `zoom` on the rendered resume so content
 * genuinely reflows (and paginates across pages) rather than just visually
 * scaling. "tight" fits more per page, "roomy" gives more breathing room.
 */
export const DENSITIES = [
  { id: "tight", label: "Tight", zoom: 0.9 },
  { id: "regular", label: "Regular", zoom: 1 },
  { id: "roomy", label: "Roomy", zoom: 1.08 },
] as const;

export type Density = (typeof DENSITIES)[number]["id"];

export const DEFAULT_DENSITY: Density = "regular";

export function isDensity(value: string): value is Density {
  return DENSITIES.some((d) => d.id === value);
}

/** The CSS `zoom` factor for a density (defaults to 1 for unknown values). */
export function densityZoom(density: string): number {
  return DENSITIES.find((d) => d.id === density)?.zoom ?? 1;
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
