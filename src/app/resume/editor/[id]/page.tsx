import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/utils/supabase/auth";
import { getResume } from "@/lib/resume/db";

export const metadata: Metadata = {
  title: "Editor",
  robots: { index: false, follow: false },
};

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getCurrentUser())) redirect("/login");

  const { id } = await params;
  const resume = await getResume(id);
  if (!resume) notFound();

  // Phase 1 placeholder. The split form + live preview + autosave land in the
  // next release; for now this confirms the resume loads (RLS-scoped).
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <nav className="mb-8 text-sm">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 font-mono text-subtle transition-colors hover:text-foreground"
        >
          <span aria-hidden>&larr;</span> Dashboard
        </Link>
      </nav>

      <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
        {resume.title}
      </h1>
      <p className="mt-1 font-mono text-xs text-subtle">
        Template: {resume.templateId}
      </p>

      <div className="mt-8 rounded-panel border border-dashed border-border bg-card p-10 text-center">
        <p className="text-sm font-medium text-foreground">
          The editor is coming in the next release.
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
          This resume is saved to your account. Soon you&apos;ll fill in your
          details on the left and watch the template update live on the right,
          then export to PDF.
        </p>
      </div>
    </main>
  );
}
