import type { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Highlight, Squiggle, Arrow } from "@/components/doodle";
import { ArrowUpRightIcon, GitHubIcon } from "@/components/icons";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Threads",
  description:
    "Notes and deep-dives on backend & systems, Go, developer tools, and learning in public.",
  alternates: { canonical: "/threads" },
};

type Topic = {
  index: string;
  name: string;
  blurb: string;
};

// The planned topic areas — what threads will cover. (Real topics, no fake posts.)
const topics: Topic[] = [
  {
    index: "01",
    name: "Backend & systems",
    blurb:
      "Architecture, databases, caching, real-time, and the trade-offs behind systems that scale.",
  },
  {
    index: "02",
    name: "Developer tools & Go",
    blurb:
      "Building CLIs and local-first tools in Go — plus AI/LLM plumbing like RAG, embeddings, and MCP.",
  },
  {
    index: "03",
    name: "Practical tutorials",
    blurb:
      "Hands-on, copy-along guides that take you from empty folder to something that runs.",
  },
  {
    index: "04",
    name: "Engineering & learning in public",
    blurb:
      "Notes from the work itself — decisions, mistakes, and the messy middle of shipping.",
  },
];

export default function ThreadsPage() {
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

          <p className="mt-5 inline-flex items-center gap-2 font-hand text-xl text-subtle">
            first threads are spinning up
            <Arrow className="-rotate-12 text-accent" />
          </p>
        </section>

        <div className="flex items-center gap-3 py-2">
          <Squiggle className="text-border" />
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">
            what to expect
          </span>
        </div>

        {/* Topic preview */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          {topics.map((topic) => (
            <article
              key={topic.name}
              className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-accent/40"
            >
              <span className="font-hand text-2xl text-accent">
                {topic.index}
              </span>
              <h2 className="mt-1 text-base font-semibold text-foreground">
                {topic.name}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">{topic.blurb}</p>
            </article>
          ))}
        </section>

        {/* Meanwhile */}
        <section className="mt-12 rounded-xl border border-dashed border-border p-6 text-center">
          <p className="font-hand text-2xl text-foreground">
            nothing published just yet
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            The first threads are in progress. Until then, the building happens
            in the open on GitHub.
          </p>
          <a
            href={site.github}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-card-hover"
          >
            <GitHubIcon className="h-4 w-4" />
            Follow along on GitHub
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
