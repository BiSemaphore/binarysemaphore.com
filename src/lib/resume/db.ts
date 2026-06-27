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
  DEFAULT_DENSITY,
  DEFAULT_TEMPLATE,
  emptyResume,
  normalizeResume,
  type Density,
  type ResumeContent,
  type TemplateId,
} from "@/lib/resume/schema";

export type Resume = {
  id: string;
  title: string;
  templateId: TemplateId;
  density: Density;
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
  density: string;
  content: unknown;
  created_at: string;
  updated_at: string;
};

function toResume(row: Row): Resume {
  return {
    id: row.id,
    title: row.title,
    templateId: (row.template_id as TemplateId) || DEFAULT_TEMPLATE,
    density: (row.density as Density) || DEFAULT_DENSITY,
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
  const { data, error } = await supabase
    .from("resumes")
    .select("id, title, template_id, density, content, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toResume(data as Row) : null;
}

/** Create a blank resume for the current user; returns its id. */
export async function createResume(title = "Untitled"): Promise<string> {
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
      template_id: DEFAULT_TEMPLATE,
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
  density?: Density;
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
  if (patch.density !== undefined) row.density = patch.density;
  if (patch.content !== undefined) row.content = patch.content;
  if (Object.keys(row).length === 0) return;

  const { error } = await supabase.from("resumes").update(row).eq("id", id);
  if (error) throw error;
}

/** Delete a resume. RLS ensures only the owner can. */
export async function deleteResume(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("resumes").delete().eq("id", id);
  if (error) throw error;
}
