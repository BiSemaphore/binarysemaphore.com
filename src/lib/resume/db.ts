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

  const { data, error } = await supabase
    .from("resumes")
    .insert({
      user_id: user.id,
      title,
      template_id: templateId,
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
  if (patch.content !== undefined) row.content = patch.content;
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
