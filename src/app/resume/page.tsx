import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/utils/supabase/auth";

export const metadata: Metadata = {
  title: "Resume builder",
  description:
    "Fill in a few fields, pick a template, and export a clean resume to PDF. Free, and your data stays in your account.",
  alternates: { canonical: "https://resume.binarysemaphore.com" },
};

const STEPS = [
  {
    title: "Fill in the fields",
    body: "Your details, experience, education, and skills. One form, no fiddling with layout.",
  },
  {
    title: "Pick a template",
    body: "A handful of clean, recruiter-friendly designs. Switch any time without redoing your content.",
  },
  {
    title: "Export to PDF",
    body: "Download a crisp PDF straight from your browser. The same thing you see is what prints.",
  },
];

export default async function ResumeLandingPage() {
  const user = await getCurrentUser();
  const primaryHref = user ? "/dashboard" : "/login";
  const primaryLabel = user ? "Go to dashboard" : "Start building";

  return (
    <main className="flex-1">
      {/* Hero — same shape as the main site's page intros: mono label, big
          display headline, muted lead. No decoration. */}
      <section className="mx-auto w-full max-w-7xl px-6 pt-16 pb-2 lg:px-10 lg:pt-24">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
          Resume · by Binary Semaphore
        </p>
        <h1 className="max-w-3xl text-balance font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          A resume you can build in one sitting
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
          Fill in a few fields, pick a template, and export to PDF. No fiddling
          with margins, no watermarks. Your data stays in your account.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            href={primaryHref}
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-transform duration-300 hover:-translate-y-0.5"
          >
            {primaryLabel}
          </Link>
          {!user ? (
            <span className="text-sm text-subtle">Free, sign in to start.</span>
          ) : null}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-7xl px-6 pt-14 pb-24 lg:px-10">
        <div className="grid gap-5 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <div
              key={step.title}
              className="rounded-panel border border-border bg-card p-6 shadow-soft"
            >
              <span className="font-mono text-xs font-bold text-accent-strong">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h2 className="mt-3 text-base font-semibold text-foreground">
                {step.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
