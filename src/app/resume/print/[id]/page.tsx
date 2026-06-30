import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/utils/supabase/auth";
import { getResume } from "@/lib/resume/db";
import { PrintDocument } from "@/components/resume/print-document";

export const metadata: Metadata = {
  title: "Print",
  robots: { index: false, follow: false },
};

/**
 * Bare, chrome-free render of a single resume. Outside the resume `(app)` route
 * group, so it gets only the root layout (html/body + globals.css), no header or
 * footer. Headless Chromium (see /api/resume/[id]/pdf) loads this page and turns
 * it into the downloaded PDF. Auth-gated, RLS-scoped like every other view.
 *
 * PrintDocument paginates client-side with the same logic as the editor preview,
 * so the PDF matches what you see, then sets `data-print-ready` once laid out.
 */
export default async function ResumePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getCurrentUser())) redirect("/login");

  const { id } = await params;
  const resume = await getResume(id);
  if (!resume) notFound();

  return (
    <PrintDocument
      templateId={resume.templateId}
      content={resume.content}
      pageSize={resume.pageSize}
      scalePct={resume.scalePct}
      padTop={resume.padTop}
      padBottom={resume.padBottom}
      align={resume.textAlign}
    />
  );
}
