import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/utils/supabase/auth";
import { getResume } from "@/lib/resume/db";
import { renderTemplate } from "@/components/resume/templates";
import {
  PAGE_MARGIN_X,
  pageDims,
  pageSizeCss,
  scaleZoom,
} from "@/lib/resume/schema";

export const metadata: Metadata = {
  title: "Print",
  robots: { index: false, follow: false },
};

/**
 * Bare, chrome-free render of a single resume. Outside the resume `(app)` route
 * group, so it gets only the root layout (html/body + globals.css), no header or
 * footer. Headless Chromium (see /api/resume/[id]/pdf) loads this page and turns
 * it into the downloaded PDF. Auth-gated, RLS-scoped like every other view.
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

  const dims = pageDims(resume.pageSize);
  // Content density (zoom) lives on the content; the page margins live on the
  // @page box so EVERY page (not just the first) gets the top/bottom margin.
  const style = { zoom: scaleZoom(resume.scalePct) } as React.CSSProperties;
  const pageCss = `@page { size: ${pageSizeCss(resume.pageSize)}; margin: ${resume.padTop}mm ${PAGE_MARGIN_X}mm ${resume.padBottom}mm; }`;

  return (
    <div
      className="resume-paper"
      style={{ background: "#fff", width: `${dims.wMm - PAGE_MARGIN_X * 2}mm` }}
    >
      <style>{pageCss}</style>
      <div style={style}>{renderTemplate(resume.templateId, resume.content)}</div>
    </div>
  );
}
