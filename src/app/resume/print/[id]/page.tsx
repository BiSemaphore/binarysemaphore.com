import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/utils/supabase/auth";
import { getResume } from "@/lib/resume/db";
import { renderTemplate } from "@/components/resume/templates";
import { pageSizeCss, scaleZoom } from "@/lib/resume/schema";

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

  const style = {
    zoom: scaleZoom(resume.scalePct),
    "--rpt": `${resume.padTop}mm`,
    "--rpb": `${resume.padBottom}mm`,
  } as React.CSSProperties;

  return (
    <div className="resume-paper" style={{ background: "#fff" }}>
      <style>{`@page { size: ${pageSizeCss(resume.pageSize)}; margin: 0; }`}</style>
      <div style={style}>{renderTemplate(resume.templateId, resume.content)}</div>
    </div>
  );
}
