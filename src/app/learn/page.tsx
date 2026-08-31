import type { Metadata } from "next";
import Link from "next/link";
import { notebooks, totalPages } from "@/lib/learn";
import { accessLabel, getAllAccess, TRIAL_DAYS } from "@/lib/learn/access";
import { learnBase } from "@/lib/learn/paths";
import { Highlight } from "@/components/doodle";
import { Reveal } from "@/components/reveal";
import { DiscordIcon, ArrowRightIcon } from "@/components/icons";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Study Notebooks",
  description:
    "Printed study manuals on backend and systems engineering: ingestion, object storage, Postgres, security, scaling, real-time. One book, one question, worked properly.",
  alternates: { canonical: "https://learn.binarysemaphore.com" },
};

export default async function LearnIndexPage() {
  const [access, base] = await Promise.all([getAllAccess(), learnBase()]);
  const pages = totalPages();

  return (
    <div className="mx-auto w-full max-w-5xl px-6 pb-24">
      <section className="pt-16 pb-12 sm:pt-20">
        <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
          the notebooks
        </p>

        <h1 className="max-w-2xl font-display text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
          <Highlight className="bg-accent/15">Study Notebooks</Highlight>
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-7 text-muted">
          Long-form manuals on the backend work that interviews and production
          both care about. Each one is built around a single question, because
          one question worked properly teaches more than a survey does. Written
          to be printed and written on.
        </p>

        <dl className="mt-9 flex flex-wrap gap-x-10 gap-y-4">
          {[
            { label: "notebooks", value: String(notebooks.length) },
            { label: "pages", value: pages.toLocaleString("en-GB") },
            { label: "editions each", value: "3" },
          ].map((stat) => (
            <div key={stat.label}>
              <dt className="font-mono text-xs uppercase tracking-[0.15em] text-subtle">
                {stat.label}
              </dt>
              <dd className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>

        <p className="mt-8 max-w-2xl rounded-card border border-border bg-card px-5 py-4 text-sm leading-6 text-muted">
          Every notebook is free to read for {TRIAL_DAYS} days. Sign in, open the
          one you want, and download all three editions. Nothing is withheld and
          there is nothing to pay.
        </p>
      </section>

      <ul className="grid gap-4 sm:grid-cols-2">
        {notebooks.map((notebook, i) => {
          const label = accessLabel(access.get(notebook.slug) ?? { state: "none" });

          return (
            <li key={notebook.slug}>
              <Reveal delay={Math.min(i, 4) * 60}>
                <Link
                  href={`${base}/${notebook.slug}`}
                  className="group flex h-full flex-col rounded-panel border border-border bg-card p-6 shadow-soft transition-colors hover:bg-card-hover"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-mono text-xs uppercase tracking-[0.15em] text-subtle">
                      {notebook.series} / {notebook.number}
                    </p>
                    {label ? (
                      <span className="shrink-0 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 font-mono text-[0.65rem] text-accent-strong">
                        {label}
                      </span>
                    ) : null}
                  </div>

                  <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-foreground">
                    {notebook.title}
                  </h2>
                  <p className="mt-1.5 text-sm leading-6 text-foreground/80">
                    {notebook.subtitle}
                  </p>
                  <p className="mt-3 flex-1 text-sm leading-6 text-muted">
                    {notebook.blurb}
                  </p>

                  <p className="mt-5 flex items-center gap-2 font-mono text-xs text-subtle">
                    {notebook.pages} pages
                    <span aria-hidden>·</span>
                    {Object.keys(notebook.assets).length} editions
                    <ArrowRightIcon className="ml-auto h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </p>
                </Link>
              </Reveal>
            </li>
          );
        })}
      </ul>

      {site.discord ? (
        <section className="mt-14 rounded-panel border border-border bg-card p-7 shadow-soft sm:p-9">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Read them with other people
          </h2>
          <p className="mt-2.5 max-w-xl text-sm leading-6 text-muted">
            The Discord is where the working notes go: what is being written
            next, corrections, links worth keeping, and questions from whoever is
            reading the same notebook as you.
          </p>
          <a
            href="/discord"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-transform duration-300 hover:-translate-y-0.5"
          >
            <DiscordIcon className="h-4 w-4" />
            Join the Discord
          </a>
        </section>
      ) : null}
    </div>
  );
}
