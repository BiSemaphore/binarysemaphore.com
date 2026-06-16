import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Highlight, Squiggle, Arrow } from "@/components/doodle";
import { Reveal } from "@/components/reveal";
import { ArrowUpRightIcon, GitHubIcon } from "@/components/icons";
import { getAllThreads, formatDate } from "@/lib/threads";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Threads",
  description:
    "Notes and deep-dives on backend & systems, Go, developer tools, and learning in public.",
  alternates: { canonical: "/threads" },
};

const topics = [
  "Backend & systems",
  "Developer tools & Go",
  "Practical tutorials",
  "Learning in public",
];

export default function ThreadsPage() {
  const threads = getAllThreads();

  return (
    <>
      <Header />

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-20">
        {/* Intro */}
        <section className="pt-16 pb-10 sm:pt-20">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
            the writing
          </p>

          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            <Highlight className="bg-accent/15">Threads</Highlight>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-7 text-muted">
            Notes and deep-dives on backend &amp; systems, Go, developer tools,
            and learning in public. Think of each one as a thread you can pull —
            short ideas and long build logs alike.
          </p>
        </section>

        {threads.length > 0 ? (
          <section>
            <ul className="grid gap-5">
              {threads.map((thread, i) => (
                <li key={thread.slug}>
                  <Reveal delay={(i % 2) * 80}>
                    <Link
                      href={`/threads/${thread.slug}`}
                      className="group block rounded-panel border border-border bg-card p-6 shadow-soft transition-transform duration-200 hover:-translate-y-1 sm:p-7"
                    >
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-subtle">
                        <time dateTime={thread.date}>
                          {formatDate(thread.date)}
                        </time>
                        <span aria-hidden="true">·</span>
                        <span>{thread.readingMinutes} min read</span>
                      </div>

                      <h2 className="mt-2 flex items-start justify-between gap-3 font-display text-2xl font-bold tracking-tight text-foreground">
                        <span className="transition-colors group-hover:text-accent-strong">
                          {thread.title}
                        </span>
                        <ArrowUpRightIcon className="mt-1.5 h-4 w-4 shrink-0 text-subtle transition-colors group-hover:text-accent" />
                      </h2>

                      <p className="mt-2 text-[15px] leading-7 text-muted">
                        {thread.description}
                      </p>

                      {thread.tags.length > 0 ? (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {thread.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-background px-2.5 py-1 font-mono text-xs text-subtle ring-1 ring-inset ring-border"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </Link>
                  </Reveal>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          /* Empty state */
          <section>
            <div className="flex items-center gap-3 py-2">
              <Squiggle className="text-border" />
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">
                what to expect
              </span>
            </div>
            <p className="mt-4 inline-flex items-center gap-2 font-hand text-xl text-subtle">
              first threads are spinning up
              <Arrow className="-rotate-12 text-accent" />
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {topics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-full border border-border px-3 py-1 text-sm text-muted"
                >
                  {topic}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Build-in-public note */}
        <section className="mt-12 rounded-panel border border-dashed border-border p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <p className="font-hand text-2xl text-foreground">
              more threads in progress
            </p>
            <p className="mt-1 text-sm text-muted">
              New notes and build logs as they&apos;re ready.
            </p>
          </div>
          <a
            href={site.org}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card-hover sm:mt-0"
          >
            <GitHubIcon className="h-4 w-4" />
            Follow on GitHub
            <ArrowUpRightIcon className="h-3.5 w-3.5 text-subtle" />
          </a>
        </section>
      </main>

      <div className="mx-auto w-full max-w-3xl px-6">
        <Footer />
      </div>
    </>
  );
}
