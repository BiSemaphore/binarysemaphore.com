import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/utils/supabase/auth";
import { listResumes } from "@/lib/resume/db";
import {
  createResumeAction,
  deleteResumeAction,
  renameResumeAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Your resumes",
  robots: { index: false, follow: false },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const resumes = await listResumes();

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-12">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            Your resumes
          </h1>
          <p className="mt-1 text-sm text-muted">
            {resumes.length === 0
              ? "Create your first resume to get started."
              : `${resumes.length} ${resumes.length === 1 ? "resume" : "resumes"}.`}
          </p>
        </div>
        <form action={createResumeAction}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background shadow-soft transition-transform hover:-translate-y-0.5"
          >
            New resume
          </button>
        </form>
      </div>

      {resumes.length === 0 ? (
        <div className="mt-10 rounded-panel border border-dashed border-border bg-card p-12 text-center">
          <p className="text-sm text-muted">
            No resumes yet. Click <span className="font-medium">New resume</span>{" "}
            to start.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {resumes.map((resume) => (
            <li
              key={resume.id}
              className="rounded-card border border-border bg-card p-4 shadow-soft sm:flex sm:items-center sm:justify-between sm:gap-4"
            >
              <div className="min-w-0 flex-1">
                <form
                  action={renameResumeAction}
                  className="flex items-center gap-2"
                >
                  <input type="hidden" name="id" value={resume.id} />
                  <input
                    name="title"
                    defaultValue={resume.title}
                    aria-label="Resume title"
                    className="w-full max-w-xs rounded-lg border border-transparent bg-transparent px-2 py-1 text-base font-medium text-foreground hover:border-border focus:border-border focus:bg-background focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-lg px-2 py-1 font-mono text-xs text-subtle transition-colors hover:text-foreground"
                  >
                    Save
                  </button>
                </form>
                <p className="mt-1 px-2 font-mono text-xs text-subtle">
                  {resume.templateId} · updated {formatDate(resume.updatedAt)}
                </p>
              </div>

              <div className="mt-3 flex items-center gap-2 sm:mt-0">
                <Link
                  href={`/editor/${resume.id}`}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-card-hover"
                >
                  Edit
                </Link>
                <form action={deleteResumeAction}>
                  <input type="hidden" name="id" value={resume.id} />
                  <button
                    type="submit"
                    className="rounded-lg px-3 py-2 text-sm font-medium text-subtle transition-colors hover:text-red-500"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
