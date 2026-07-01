/**
 * Server-only data access for the resume builder. Row-Level Security (see
 * supabase/schema.sql) does the authorization; these helpers just scope and
 * shape the queries. Call from Server Components, Route Handlers, or actions.
 *
 * Server-only: imports `next/headers` (via the SSR client), so importing this
 * from a Client Component will error at build time.
 */
import { createClient } from "@/utils/supabase/server";
import {
  DEFAULT_ALIGN,
  DEFAULT_PAD,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SCALE,
  DEFAULT_TEMPLATE,
  clampPad,
  clampScale,
  emptyResume,
  isTextAlign,
  normalizeResume,
  type PageSize,
  type ResumeContent,
  type TemplateId,
  type TextAlign,
} from "@/lib/resume/schema";

/** Upper bound on a resume's serialized content (~256KB) to keep rows sane. */
const MAX_CONTENT_BYTES = 256 * 1024;

/** Max resumes a single user may own. Enforced in createResume (authoritative)
 * and surfaced in the UI so the create button disables at the cap. */
export const MAX_RESUMES = 3;

/** Human-readable message shown when the per-user resume cap is hit. */
export const RESUME_LIMIT_MESSAGE = `You've reached the limit of ${MAX_RESUMES} resumes. Delete one to create another.`;

/** Thrown by createResume when the user is already at MAX_RESUMES, so callers
 * can distinguish the cap from other failures and show a friendly message. */
export class ResumeLimitError extends Error {
  constructor() {
    super(RESUME_LIMIT_MESSAGE);
    this.name = "ResumeLimitError";
  }
}

export type Resume = {
  id: string;
  title: string;
  templateId: TemplateId;
  pageSize: PageSize;
  /** Tune: overall zoom percent, and page margins in mm. */
  scalePct: number;
  padTop: number;
  padBottom: number;
  textAlign: TextAlign;
  content: ResumeContent;
  createdAt: string;
  updatedAt: string;
};

/** A lightweight row for list views (no full content). */
export type ResumeSummary = Pick<
  Resume,
  "id" | "title" | "templateId" | "updatedAt"
>;

type Row = {
  id: string;
  title: string;
  template_id: string;
  page_size: string;
  scale_pct: number | null;
  pad_top: number | null;
  pad_bottom: number | null;
  text_align: string | null;
  content: unknown;
  created_at: string;
  updated_at: string;
};

function toResume(row: Row): Resume {
  return {
    id: row.id,
    title: row.title,
    templateId: (row.template_id as TemplateId) || DEFAULT_TEMPLATE,
    pageSize: (row.page_size as PageSize) || DEFAULT_PAGE_SIZE,
    scalePct: clampScale(row.scale_pct ?? DEFAULT_SCALE),
    padTop: clampPad(row.pad_top ?? DEFAULT_PAD),
    padBottom: clampPad(row.pad_bottom ?? DEFAULT_PAD),
    textAlign: isTextAlign(row.text_align ?? "") ? (row.text_align as TextAlign) : DEFAULT_ALIGN,
    content: normalizeResume(row.content),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** How many resumes the current user owns (RLS scopes the count to them). */
export async function countResumes(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("resumes")
    .select("id", { count: "exact", head: true });
  if (error) throw error;
  return count ?? 0;
}

/** The current user's resumes, newest first. */
export async function listResumes(): Promise<ResumeSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resumes")
    .select("id, title, template_id, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    templateId: (r.template_id as TemplateId) || DEFAULT_TEMPLATE,
    updatedAt: r.updated_at,
  }));
}

/** A single resume by id, or null if it doesn't exist / isn't the user's. */
export async function getResume(id: string): Promise<Resume | null> {
  const supabase = await createClient();
  const base =
    "id, title, template_id, page_size, scale_pct, pad_top, pad_bottom, content, created_at, updated_at";
  let { data, error } = await supabase
    .from("resumes")
    .select(`${base}, text_align`)
    .eq("id", id)
    .maybeSingle();
  // Resilient to a DB that hasn't run the text_align migration yet: retry
  // without the column (alignment defaults until the migration is applied).
  if (error && /text_align/.test(error.message)) {
    ({ data, error } = await supabase
      .from("resumes")
      .select(base)
      .eq("id", id)
      .maybeSingle());
  }
  if (error) throw error;
  return data ? toResume(data as Row) : null;
}

/** Create a blank resume for the current user; returns its id. */
export async function createResume(
  title = "Untitled",
  templateId: TemplateId = DEFAULT_TEMPLATE,
): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Authoritative per-user cap. RLS scopes this count to the current user, so it
  // holds even if a caller skips the UI guard. (A concurrent double-create could
  // still slip one over the cap; acceptable for a soft limit.)
  const { count, error: countError } = await supabase
    .from("resumes")
    .select("id", { count: "exact", head: true });
  if (countError) throw countError;
  if ((count ?? 0) >= MAX_RESUMES) throw new ResumeLimitError();

  const { data, error } = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      title,
      template_id: templateId,
      // Set the tune defaults explicitly so a new resume starts where the
      // editor's "reset" lands, regardless of the DB column defaults (which
      // predate DEFAULT_PAD). Keeps the app the single source of truth.
      pad_top: DEFAULT_PAD,
      pad_bottom: DEFAULT_PAD,
      content: emptyResume(),
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export type ResumePatch = {
  title?: string;
  templateId?: TemplateId;
  pageSize?: PageSize;
  scalePct?: number;
  padTop?: number;
  padBottom?: number;
  textAlign?: TextAlign;
  content?: ResumeContent;
};

/** Update fields on a resume. RLS ensures only the owner can. */
export async function updateResume(
  id: string,
  patch: ResumePatch,
): Promise<void> {
  const supabase = await createClient();
  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.templateId !== undefined) row.template_id = patch.templateId;
  if (patch.pageSize !== undefined) row.page_size = patch.pageSize;
  if (patch.scalePct !== undefined) row.scale_pct = clampScale(patch.scalePct);
  if (patch.padTop !== undefined) row.pad_top = clampPad(patch.padTop);
  if (patch.padBottom !== undefined) row.pad_bottom = clampPad(patch.padBottom);
  if (patch.textAlign !== undefined) row.text_align = patch.textAlign;
  if (patch.content !== undefined) {
    // Coerce to a known shape and cap the size so a malformed or oversized
    // client payload can't bloat the row (RLS already scopes it to the owner).
    const normalized = normalizeResume(patch.content);
    if (JSON.stringify(normalized).length > MAX_CONTENT_BYTES) {
      throw new Error("Resume content too large");
    }
    row.content = normalized;
  }
  if (Object.keys(row).length === 0) return;

  const { error } = await supabase.from("resumes").update(row).eq("id", id);
  // Resilient to a DB without the text_align column yet: drop it and retry so
  // saving still works before the migration is applied.
  if (error && /text_align/.test(error.message) && "text_align" in row) {
    delete row.text_align;
    if (Object.keys(row).length === 0) return;
    const retry = await supabase.from("resumes").update(row).eq("id", id);
    if (retry.error) throw retry.error;
    return;
  }
  if (error) throw error;
}

/** Delete a resume. RLS ensures only the owner can. */
export async function deleteResume(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("resumes").delete().eq("id", id);
  if (error) throw error;
}
