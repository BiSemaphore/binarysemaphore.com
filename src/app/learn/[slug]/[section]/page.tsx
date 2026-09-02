import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getNotebook } from "@/lib/learn";
import { getSection, getSections } from "@/lib/learn/book";
import { canRead, getAccess, TRIAL_DAYS } from "@/lib/learn/access";
import { learnBase } from "@/lib/learn/paths";
import { startTrialAction } from "@/app/learn/actions";
import { ArrowRightIcon, LockIcon } from "@/components/icons";
import { SectionNav } from "@/components/learn/section-nav";

type Params = { slug: string; section: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug, section } = await params;
  const ctx = getSection(slug, section);
  const notebook = getNotebook(slug);
  if (!ctx || !notebook) return {};

  const heading = ctx.section.number
    ? `${ctx.section.number}. ${ctx.section.title}`
    : ctx.section.title;

  return {
    title: `${ctx.section.title} · ${notebook.title}`,
    description: `${heading}, from ${notebook.title}: ${notebook.subtitle}.`,
    alternates: {
      canonical: `https://learn.binarysemaphore.com/${slug}/${section}`,
    },
  };
}

export default async function SectionPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug, section } = await params;
  const notebook = getNotebook(slug);
  const ctx = getSection(slug, section);
  if (!notebook || !ctx) notFound();

  const sections = getSections(slug);

  const [access, base] = await Promise.all([getAccess(slug), learnBase()]);
  const entitled = canRead(access);

  // Imported the way a thread imports its own MDX. The gated half is a separate
  // file and is only imported for an entitled reader, so for anyone else it is
  // not in the page at all: there is nothing hidden to reveal.
  const { default: Preview } = await import(
    `@/content/notebooks/${slug}/${section}.mdx`
  );
  const Rest =
    entitled && ctx.section.gated
      ? (await import(`@/content/notebooks/${slug}/${section}.rest.mdx`)).default
      : null;

  return (
    <div className="mx-auto w-full max-w-3xl px-6 pb-24">
      <div className="relative">
        {/* The book's contents, beside what you are reading. A notebook is read
            a section at a time, so without this the only way onward is back to
            the notebook page. Below this width there is no room for it, and
            prev/next at the foot does the job. The breakpoint is set so the
            sidebar clears the viewport edge: the column is 768px centred, so at
            1360px its left edge sits at 296px and the 208px sidebar plus its
            40px gutter starts at 48px. Below that it would be clipped. */}
        <aside className="absolute right-full top-0 hidden h-full pr-10 min-[1360px]:block">
          <div className="sticky top-24 w-52">
            <SectionNav
              sections={sections}
              current={section}
              base={base}
              slug={slug}
            />
          </div>
        </aside>

      <nav className="flex items-center gap-2 pt-10 font-mono text-xs text-subtle">
        <Link
          href={`${base}/${slug}`}
          className="transition-colors hover:text-foreground"
        >
          {notebook.title}
        </Link>
        {ctx.section.part ? (
          <>
            <span aria-hidden>/</span>
            <span>Part {ctx.section.part}</span>
          </>
        ) : null}
        <span aria-hidden className="ml-auto">
          {ctx.position} of {ctx.total}
        </span>
      </nav>

      <header className="pt-7">
        {ctx.section.partTitle ? (
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-accent-strong">
            {ctx.section.partTitle}
          </p>
        ) : null}
        <h1 className="mt-3 flex gap-4 font-display text-3xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-4xl">
          {ctx.section.number ? (
            <span className="font-mono text-2xl font-normal text-subtle sm:text-3xl">
              {ctx.section.number}
            </span>
          ) : null}
          <span>{ctx.section.title}</span>
        </h1>
      </header>

      <article className="thread mt-9">
        <Preview />

        {!ctx.section.gated ? null : Rest ? (
          <Rest />
        ) : (
          <section
            aria-labelledby="gate-heading"
            className="relative mt-2"
          >
            {/* A snippet of what comes next, already truncated on the server.
                Nothing beyond this is in the page at all, so view-source shows
                the same thing the reader does. */}
            {ctx.section.teaser ? (
              <p
                aria-hidden
                className="pointer-events-none my-4 select-none text-[15px] leading-7 text-muted [mask-image:linear-gradient(to_bottom,black,transparent)]"
              >
                {ctx.section.teaser}
              </p>
            ) : null}

            <div className="mt-6 rounded-panel border border-border bg-card p-6 shadow-soft sm:p-7">
              <div className="flex items-center gap-2.5">
                <LockIcon className="h-4 w-4 text-subtle" />
                <h2
                  id="gate-heading"
                  className="font-display text-lg font-semibold tracking-tight text-foreground"
                >
                  {access.state === "expired"
                    ? `Your ${TRIAL_DAYS} days are up`
                    : "Keep reading"}
                </h2>
              </div>

              {access.state === "anonymous" ? (
                <>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    The rest of this section, and all {notebook.pages} pages of{" "}
                    {notebook.title}, are free for {TRIAL_DAYS} days. No card,
                    nothing to pay. We ask for an account so the reading belongs
                    to someone.
                  </p>
                  <Link
                    href={`${base}/login?next=${encodeURIComponent(`${base}/${slug}/${section}`)}`}
                    className="mt-5 inline-flex items-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-transform duration-300 hover:-translate-y-0.5"
                  >
                    Sign in to read on
                  </Link>
                </>
              ) : access.state === "expired" ? (
                <p className="mt-2 text-sm leading-6 text-muted">
                  Paid access is not open yet, so there is nothing to buy today.
                  Anything you already downloaded is still yours.
                </p>
              ) : (
                <>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Open {notebook.title} and read the whole thing, plus the
                    three PDF editions, free for {TRIAL_DAYS} days. The clock
                    starts when you click.
                  </p>
                  <form action={startTrialAction} className="mt-5">
                    <input type="hidden" name="slug" value={slug} />
                    <button
                      type="submit"
                      className="inline-flex items-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-transform duration-300 hover:-translate-y-0.5"
                    >
                      Start reading
                    </button>
                  </form>
                </>
              )}
            </div>
          </section>
        )}
      </article>

      <nav className="mt-14 grid gap-3 border-t border-border pt-8 sm:grid-cols-2">
        {ctx.previous ? (
          <Link
            href={`${base}/${slug}/${ctx.previous.slug}`}
            className="group rounded-card border border-border bg-card p-4 transition-colors hover:bg-card-hover"
          >
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-subtle">
              Previous
            </span>
            <span className="mt-1 block text-sm font-medium text-foreground">
              {ctx.previous.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {ctx.next ? (
          <Link
            href={`${base}/${slug}/${ctx.next.slug}`}
            className="group rounded-card border border-border bg-card p-4 text-right transition-colors hover:bg-card-hover"
          >
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-subtle">
              Next
            </span>
            <span className="mt-1 flex items-center justify-end gap-2 text-sm font-medium text-foreground">
              {ctx.next.title}
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ) : null}
      </nav>
      </div>
    </div>
  );
}
