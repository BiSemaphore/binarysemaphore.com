import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNotebook } from "@/lib/learn";
import { getSections, splitBook } from "@/lib/learn/book";
import { canRead, getAccess } from "@/lib/learn/access";
import { getProgress } from "@/lib/learn/progress";
import { learnBase } from "@/lib/learn/paths";
import { ReaderNav } from "@/components/learn/reader-nav";
import { ActiveSectionProvider } from "@/components/learn/active-section";
import { ReferencedRail } from "@/components/learn/referenced-rail";
import { notebooks } from "@/lib/learn";
import { openNotebookAction } from "@/app/learn/actions";
import { LockIcon } from "@/components/icons";
import { Credit } from "@/components/learn/credit";
import type { SectionEntry } from "@/lib/learn/book";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const notebook = getNotebook(slug);
  if (!notebook) return {};

  return {
    title: `Read ${notebook.title}`,
    description: `${notebook.subtitle}. ${notebook.blurb}`,
    alternates: { canonical: `https://learn.binarysemaphore.com/${slug}/read` },
  };
}

/** One section, anchored so the contents can follow the scroll. */
async function Section({
  slug,
  section,
}: {
  slug: string;
  section: SectionEntry;
}) {
  const { default: Body } = await import(
    `@/content/notebooks/${slug}/${section.slug}.mdx`
  );

  return (
    <section
      id={section.slug}
      data-section=""
      className="scroll-mt-24 border-t border-border pt-12 first:border-0 first:pt-0"
    >
      {section.partTitle ? (
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-accent-strong">
          {section.part ? `Part ${section.part} · ` : ""}
          {section.partTitle}
        </p>
      ) : null}

      <h2 className="nb-section-title mt-3 flex items-baseline gap-4">
        {section.number ? (
          <span className="nb-section-number">{section.number}</span>
        ) : null}
        <span>{section.title}</span>
      </h2>

      <div className="mt-6">
        <Body />
      </div>
    </section>
  );
}

export default async function ReaderPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const notebook = getNotebook(slug);
  if (!notebook) notFound();

  const sections = getSections(slug);
  if (sections.length === 0) notFound();

  const [access, base, progress] = await Promise.all([
    getAccess(slug),
    learnBase(),
    getProgress(slug),
  ]);

  const entitled = canRead(access);
  const { free, gated } = splitBook(sections);
  // An entitled reader gets the book. Anyone else gets `free`, and the rest is
  // never imported, so it is not in the page.
  const shown = entitled ? sections : free;

  const notebookTitles = Object.fromEntries(
    notebooks.map((n) => [n.slug, n.title]),
  );

  return (
    <ActiveSectionProvider
      first={shown[0]?.slug ?? ""}
      slug={slug}
      entitled={entitled}
      read={[...progress.read]}
    >
      {/* Three columns, centred as one block. Centring the reading column alone
          and hanging the contents off it left the page visibly heavy on the
          left and empty on the right. Below 1360px there is no room for either
          rail, so it collapses to the column. */}
      <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-10 px-6 pb-24 min-[1360px]:max-w-none min-[1360px]:grid-cols-[13rem_minmax(0,48rem)_13rem] min-[1360px]:justify-center">
        <div className="hidden min-[1360px]:block">
          <div className="sticky top-24">
            <ReaderNav sections={shown} read={[...progress.read]} />
          </div>
        </div>

        <div>

        <nav className="pt-10">
          <Link
            href={`${base}/notebooks/${slug}`}
            className="font-mono text-xs text-subtle transition-colors hover:text-foreground"
          >
            ← {notebook.title}
          </Link>
        </nav>

        <header className="pt-6 pb-10">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-accent-strong">
            {notebook.series} / {notebook.number}
          </p>
          <h1 className="nb-book-title mt-3">{notebook.title}</h1>
          <p className="mt-4 text-lg leading-7 text-muted">
            {notebook.subtitle}
          </p>
          <Credit notebook={notebook} className="mt-7" />
        </header>

        <article className="thread notebook">
          <div className="flex flex-col gap-12">
            {shown.map((section) => (
              <Section key={section.slug} slug={slug} section={section} />
            ))}
          </div>
        </article>

        {entitled || gated.length === 0 ? null : (
          <section
            aria-labelledby="gate-heading"
            className="mt-12 rounded-panel border border-border bg-card p-6 shadow-soft sm:p-8"
          >
            <div className="flex items-center gap-2.5">
              <LockIcon className="h-4 w-4 text-subtle" />
              <h2
                id="gate-heading"
                className="font-display text-lg font-semibold tracking-tight text-foreground"
              >
                {`${gated.length} more sections`}
              </h2>
            </div>

            {access.state === "anonymous" ? (
              <>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                  That is {shown.length} of {sections.length} sections. Sign in
                  to read the rest of {notebook.title}, all {notebook.pages}{" "}
                  pages, and take the PDF editions with you. An account is all
                  it takes, and it is what makes a download belong to someone.
                </p>
                <Link
                  href={`${base}/login?next=${encodeURIComponent(`${base}/notebooks/${slug}/read`)}`}
                  className="mt-5 inline-flex items-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-transform duration-300 hover:-translate-y-0.5"
                >
                  Sign in to read on
                </Link>
              </>
            ) : (
              <>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                  Open {notebook.title} to read the whole thing, and take the
                  three PDF editions with you.
                </p>
                <form action={openNotebookAction} className="mt-5">
                  <input type="hidden" name="slug" value={slug} />
                  <button
                    type="submit"
                    className="inline-flex items-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-transform duration-300 hover:-translate-y-0.5"
                  >
                    Open the notebook
                  </button>
                </form>
              </>
            )}
          </section>
        )}
        </div>

        <div className="hidden min-[1360px]:block">
          <div className="sticky top-24">
            <ReferencedRail
              sections={shown}
              notebookTitles={notebookTitles}
              base={base}
            />
          </div>
        </div>
      </div>
    </ActiveSectionProvider>
  );
}
