import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/utils/supabase/auth";
import { listResumes } from "@/lib/resume/db";
import { TEMPLATES } from "@/lib/resume/schema";
import { TemplateCard } from "@/components/resume/template-card";
import { SubmitButton } from "@/components/resume/submit-button";
import { PencilIcon, TrashIcon } from "@/components/icons";
import { createResumeAction, deleteResumeAction } from "./actions";
import { RenameTitle } from "@/components/resume/rename-title";

export const metadata: Metadata = {
  title: "Resume builder",
  description:
    "Build a clean resume, pick a template, and export to PDF. By Binary Semaphore.",
  alternates: { canonical: "https://resume.binarysemaphore.com" },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ResumeHome() {
  const user = await getCurrentUser();
  const resumes = user ? await listResumes() : [];
  const featured = TEMPLATES.slice(0, 6);

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-12">
      {/* Hero */}
      <header className="text-center">
        <p className="font-mono text-xs text-[color:var(--rx-muted)]">
          {"// resume"}
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold tracking-tight text-foreground">
          Resume
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-[color:var(--rx-muted)]">
          Build a clean resume, pick a template, and export a pixel-perfect PDF.
        </p>
      </header>

      {/* Your resumes */}
      <section className="mt-12">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-[color:var(--rx-muted)]">
            Your resumes
          </h2>
          {user ? (
            <form action={createResumeAction}>
              <SubmitButton
                className="rx-pill rx-accent font-mono text-xs"
                pendingLabel="creating…"
              >
                + new resume
              </SubmitButton>
            </form>
          ) : null}
        </div>

        {!user ? (
          <div className="rounded-xl border border-black/10 bg-white/70 p-10 text-center dark:border-white/10 dark:bg-white/[0.04]">
            <p className="text-sm text-[color:var(--rx-muted)]">
              Sign in to create and manage your resumes.
            </p>
            <Link
              href="/login"
              className="rx-pill rx-accent mt-4 inline-flex font-mono text-xs"
            >
              sign in
            </Link>
          </div>
        ) : resumes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-black/15 bg-white/60 p-10 text-center dark:border-white/15 dark:bg-white/[0.03]">
            <p className="text-sm text-[color:var(--rx-muted)]">
              No resumes yet. Click{" "}
              <span className="font-medium text-foreground">+ new resume</span>,
              or pick a template below.
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {resumes.map((resume) => (
              <li
                key={resume.id}
                className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04] sm:flex sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <RenameTitle id={resume.id} title={resume.title} />
                  <p className="mt-1 px-2 font-mono text-xs text-[color:var(--rx-muted)]">
                    {resume.templateId} · updated {formatDate(resume.updatedAt)}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-2 sm:mt-0">
                  <Link
                    href={`/editor/${resume.id}`}
                    aria-label={`Edit ${resume.title}`}
                    title="Edit"
                    className="rx-pill"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Link>
                  <form action={deleteResumeAction}>
                    <input type="hidden" name="id" value={resume.id} />
                    <button
                      type="submit"
                      aria-label={`Delete ${resume.title}`}
                      title="Delete"
                      className="inline-flex items-center rounded-lg p-2 text-[color:var(--rx-muted)] transition-colors hover:text-red-500"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Templates */}
      <section className="mt-12">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-[color:var(--rx-muted)]">
            Templates
          </h2>
          <Link
            href="/templates"
            className="font-mono text-xs text-[color:var(--rx-muted)] transition-colors hover:text-foreground"
          >
            browse all ({TEMPLATES.length}) →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      </section>
    </div>
  );
}
