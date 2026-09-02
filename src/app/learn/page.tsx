import type { Metadata } from "next";
import Link from "next/link";
import { editions, notebooks, totalPages } from "@/lib/learn";
import { accessLabel, getAllAccess } from "@/lib/learn/access";
import { learnBase } from "@/lib/learn/paths";
import { getAllProgress, summarise } from "@/lib/learn/progress";
import { getSections } from "@/lib/learn/book";
import { DiscordIcon } from "@/components/icons";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Learn",
  description:
    "Study notebooks on backend and systems engineering: ingestion, object storage, Postgres, security, scaling, real-time. One book, one question, worked properly.",
  alternates: { canonical: "https://learn.binarysemaphore.com" },
};

/** The colophon: the facts a reader wants before opening anything. Mono, so the
 * values line up in a column the way a spec block should. */
function Colophon({ pages }: { pages: number }) {
  const rows = [
    { label: "Notebooks", value: String(notebooks.length) },
    { label: "Pages", value: pages.toLocaleString("en-GB") },
    { label: "Editions", value: editions.map((e) => e.name).join(" / ") },
    { label: "To read", value: "Sign in" },
  ];

  return (
    <dl className="w-full max-w-xs border-t border-foreground/15">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-baseline justify-between gap-6 border-b border-border py-2.5"
        >
          <dt className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-subtle">
            {row.label}
          </dt>
          <dd className="font-mono text-xs text-foreground">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function LearnIndexPage() {
  const [access, base, progress] = await Promise.all([
    getAllAccess(),
    learnBase(),
    getAllProgress(),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-28 lg:px-10">
      {/* Masthead. "Learn" is the title; Binary Semaphore is the publisher. */}
      <header className="grid gap-12 pt-20 pb-16 md:grid-cols-[1fr_auto] md:items-end md:gap-16 md:pt-28">
        <div>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-accent-strong">
            Binary Semaphore
          </p>

          <h1 className="mt-4 font-display text-[4.5rem] font-semibold leading-[0.85] tracking-[-0.045em] text-foreground sm:text-[7rem] lg:text-[8.5rem]">
            Learn<span className="text-accent">.</span>
          </h1>

          <p className="mt-8 max-w-xl text-lg leading-8 text-muted">
            Study notebooks on the backend work that interviews and production
            both care about. Each one is built around a single question, because
            one question worked properly teaches more than a survey does.
            Written to be printed and written on.
          </p>
        </div>

        <Colophon pages={totalPages()} />
      </header>

      {/* The library, set as a book's contents page. The numbers are the real
          catalogue numbers from each series, not a decorative sequence. */}
      <section aria-labelledby="contents-heading">
        <div className="flex items-baseline justify-between gap-4 border-b border-foreground pb-3">
          <h2
            id="contents-heading"
            className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-foreground"
          >
            Contents
          </h2>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-subtle">
            {notebooks.length} notebooks
          </p>
        </div>

        <ol>
          {notebooks.map((notebook) => {
            const label = accessLabel(
              access.get(notebook.slug) ?? { state: "none" },
            );
            const read = progress.get(notebook.slug)?.read ?? new Set<string>();
            const done = summarise(read, getSections(notebook.slug).length);

            return (
              <li key={notebook.slug} className="border-b border-border">
                <Link
                  href={`${base}/${notebook.slug}`}
                  className="group relative grid grid-cols-[2.75rem_1fr] items-start gap-x-5 py-6 transition-colors sm:grid-cols-[4rem_1fr] sm:gap-x-8"
                >
                  {/* The margin rule: a highlighter stroke down the edge on
                      hover, the way a reader marks a section worth returning to. */}
                  <span
                    aria-hidden
                    className="absolute -left-4 top-6 bottom-6 w-[3px] origin-top scale-y-0 rounded-full bg-accent transition-transform duration-300 group-hover:scale-y-100 motion-reduce:transition-none"
                  />

                  <span className="pt-1">
                    <span className="block font-mono text-2xl leading-none tracking-tight text-subtle transition-colors group-hover:text-accent-strong">
                      {notebook.number}
                    </span>
                    <span className="mt-2 block font-mono text-[0.6rem] uppercase leading-[1.4] tracking-[0.12em] text-subtle/80">
                      {notebook.series.replace(" Notebook", "")}
                    </span>
                  </span>

                  <span className="min-w-0">
                    <span className="flex items-baseline gap-3">
                      <span className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                        {notebook.title}
                      </span>
                      {label ? (
                        <span className="shrink-0 rounded-full border border-accent/30 px-2 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-accent-strong">
                          {label}
                        </span>
                      ) : null}
                      {/* Leader. The device a contents page uses to carry the
                          eye from a title to its page number. */}
                      <span
                        aria-hidden
                        className="hidden min-w-8 flex-1 translate-y-[-0.3em] border-b border-dotted border-border sm:block"
                      />
                      <span className="hidden shrink-0 font-mono text-sm text-foreground sm:block">
                        {notebook.pages} pp
                      </span>
                    </span>

                    <span className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="max-w-2xl text-[0.95rem] leading-7 text-muted">
                        {notebook.subtitle}
                      </span>
                      <span className="font-mono text-xs text-subtle sm:hidden">
                        {notebook.pages} pp
                      </span>
                    </span>

                    <span className="mt-1.5 flex items-center gap-3 font-mono text-[0.7rem] text-subtle">
                      <span>
                        {Object.keys(notebook.assets)
                          .map((id) => editions.find((e) => e.id === id)!.name)
                          .join(" · ")}
                      </span>
                      {done.count > 0 ? (
                        <>
                          <span aria-hidden>·</span>
                          <span className="text-accent-strong">
                            {done.complete
                              ? "finished"
                              : `${done.count}/${done.total} read`}
                          </span>
                        </>
                      ) : null}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      {/* How it works, as a plain note rather than a boxed callout. */}
      <section className="mt-16 grid gap-8 border-t border-border pt-10 sm:grid-cols-2 sm:gap-16">
        <div>
          <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-foreground">
            How to get one
          </h2>
          <p className="mt-4 text-[0.95rem] leading-7 text-muted">
            Sign in, open the notebook you want, and it stays open: every page,
            every edition, nothing withheld and no clock on it. The account is
            there so a download belongs to someone, not to charge you.
          </p>
        </div>

        <div>
          <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-foreground">
            Three editions
          </h2>
          <dl className="mt-4 space-y-3">
            {editions.map((edition) => (
              <div key={edition.id} className="text-[0.95rem] leading-7">
                <dt className="inline font-medium text-foreground">
                  {edition.name}.
                </dt>{" "}
                <dd className="inline text-muted">{edition.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {site.discord ? (
        <section className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-border pt-10">
          <div>
            <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
              Read them with other people
            </h2>
            <p className="mt-1.5 max-w-lg text-[0.95rem] leading-7 text-muted">
              The Discord is where the working notes go: what is being written
              next, corrections, and questions from whoever is reading the same
              notebook as you.
            </p>
          </div>
          <a
            href="/discord"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-transform duration-300 hover:-translate-y-0.5"
          >
            <DiscordIcon className="h-4 w-4" />
            Join the Discord
          </a>
        </section>
      ) : null}
    </div>
  );
}
