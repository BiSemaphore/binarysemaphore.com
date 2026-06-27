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
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-2/3"
          style={{
            background:
              "radial-gradient(60% 60% at 50% 0%, color-mix(in srgb, var(--accent) 12%, transparent), transparent)",
          }}
        />
        <div className="mx-auto w-full max-w-3xl px-6 py-20 text-center sm:py-28">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
            Resume, by Binary Semaphore
          </p>
          <h1 className="mt-4 text-balance font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            A resume you can build in one sitting
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-balance text-lg leading-7 text-muted">
            Fill in a few fields, pick a template, and export to PDF. No
            fiddling with margins, no watermarks. Your data stays in your
            account.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={primaryHref}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-soft transition-transform hover:-translate-y-0.5"
            >
              {primaryLabel}
            </Link>
            {!user ? (
              <span className="text-sm text-subtle">Free, sign in to start</span>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 pb-24">
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
