import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { editions, getNotebook, notebooks } from "@/lib/learn";
import { getAccess } from "@/lib/learn/access";
import { learnBase } from "@/lib/learn/paths";
import { AccessPanel } from "@/components/learn/access-panel";
import { ArrowRightIcon } from "@/components/icons";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const notebook = getNotebook(slug);
  if (!notebook) return {};

  const description = `${notebook.subtitle}. ${notebook.blurb}`;

  return {
    title: notebook.title,
    description,
    openGraph: { type: "article", title: notebook.title, description },
    twitter: { card: "summary_large_image", title: notebook.title, description },
    alternates: {
      canonical: `https://learn.binarysemaphore.com/${slug}`,
    },
  };
}

export default async function NotebookPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const notebook = getNotebook(slug);
  if (!notebook) notFound();

  const [access, base] = await Promise.all([getAccess(slug), learnBase()]);
  const available = editions.filter((e) => notebook.assets[e.id]);
  const others = notebooks.filter((n) => n.slug !== slug).slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pb-24">
      <nav className="pt-10">
        <Link
          href={base || "/"}
          className="font-mono text-xs text-subtle transition-colors hover:text-foreground"
        >
          ← all notebooks
        </Link>
      </nav>

      <header className="pt-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent-strong">
          {notebook.series} / {notebook.number}
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl">
          {notebook.title}
        </h1>
        <p className="mt-4 text-lg leading-7 text-foreground/80">
          {notebook.subtitle}
        </p>
        <p className="mt-5 leading-7 text-muted">{notebook.blurb}</p>

        <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3 border-y border-border py-4">
          {[
            { label: "pages", value: String(notebook.pages) },
            { label: "sections", value: String(notebook.contents.length) },
            {
              label: "editions",
              value: available.map((e) => e.name).join(", "),
            },
          ].map((fact) => (
            <div key={fact.label}>
              <dt className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-subtle">
                {fact.label}
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-foreground">
                {fact.value}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="mt-10">
        <AccessPanel notebook={notebook} access={access} base={base} />
      </div>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          What is inside
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">
          The full table of contents. Nothing here is hidden: if a section you
          need is not in this list, the notebook is not the right one and you
          should not spend a week on it.
        </p>

        <ol className="mt-6 grid gap-x-8 gap-y-0 sm:grid-cols-2">
          {notebook.contents.map((section) => (
            <li
              key={section}
              className="border-b border-border/60 py-2.5 text-sm leading-6 text-foreground/85"
            >
              {section}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          How to read it
        </h2>
        <p className="mt-3 leading-7 text-muted">
          Read with a pen. Every notebook opens with a question to answer before
          you start and asks you to redo the answer at the end, and the margin in
          the Print edition exists so you have somewhere to be wrong first. The
          Tablet edition is 16:9 with vector text, so note apps draw on it rather
          than treating it as a photograph.
        </p>
      </section>

      {others.length > 0 ? (
        <section className="mt-14 border-t border-border pt-10">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-subtle">
            more notebooks
          </h2>
          <ul className="mt-5 grid gap-3">
            {others.map((other) => (
              <li key={other.slug}>
                <Link
                  href={`${base}/${other.slug}`}
                  className="group flex items-center gap-4 rounded-card border border-border bg-card p-4 transition-colors hover:bg-card-hover"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-base font-semibold tracking-tight text-foreground">
                      {other.title}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-muted">
                      {other.subtitle}
                    </span>
                  </span>
                  <ArrowRightIcon className="h-4 w-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
