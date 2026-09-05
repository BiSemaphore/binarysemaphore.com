import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/lib/site";
import { getNotebook } from "@/lib/learn";
import { getRoadmap } from "@/lib/learn/roadmaps";
import { allTopics, getTopic, topicState } from "@/lib/learn/topics";
import { learnBase } from "@/lib/learn/paths";
import { ArrowRightIcon } from "@/components/icons";
import { DecodeTitle } from "@/components/learn/topics/decode-title";

export function generateStaticParams() {
  return allTopics().map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const found = getTopic(slug);
  if (!found) return {};
  return { title: found.topic.title, description: found.topic.blurb };
}

/** One row in the right rail. */
function RailLink({
  label,
  title,
  href,
  external = false,
}: {
  label: string;
  title: string;
  href: string;
  external?: boolean;
}) {
  const className =
    "block rounded-card border border-border bg-card px-4 py-3 transition-colors hover:bg-card-hover";
  const body = (
    <>
      <span className="block font-mono text-[0.6rem] uppercase tracking-[0.18em] text-subtle">
        {label}
      </span>
      <span className="mt-1.5 block text-sm leading-snug text-foreground">
        {title}
      </span>
    </>
  );

  return external ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {body}
    </a>
  ) : (
    <Link href={href} className={className}>
      {body}
    </Link>
  );
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const found = getTopic(slug);
  if (!found) notFound();

  const { topic, group } = found;
  const base = await learnBase();
  const state = topicState(topic);
  const notebook = topic.notebook ? getNotebook(topic.notebook) : undefined;
  const roadmap = topic.roadmap ? getRoadmap(topic.roadmap) : undefined;
  const { bookingUrl } = site.mentorship;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 lg:flex-row lg:gap-12 lg:px-10 lg:py-14">
      <article className="min-w-0 flex-1">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-subtle">
          {group.name}
        </p>

        <DecodeTitle
          text={topic.title}
          className="mt-4 font-mono text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-foreground sm:text-5xl"
        />

        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted">
          {topic.blurb}
        </p>

        {/* The honest bit. 52 of 64 topics have nothing of ours behind them, and
            a page that pretends otherwise is a lie the reader finds on arrival. */}
        {state === "soon" ? (
          <div className="mt-10 max-w-2xl rounded-card border border-border bg-card px-6 py-6">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-subtle">
              Not written yet
            </p>
            <p className="mt-3 leading-7 text-muted">
              We have not published anything on {topic.title} yet, and it would
              be easy to pretend otherwise.{" "}
              {topic.reference
                ? "The canonical documentation is linked on the right, and it is better than anything we would rush out."
                : "There is no single canonical source worth sending you to, which is exactly the kind of topic an hour is good for."}
            </p>
            <a
              href={bookingUrl || `${base}/#ask`}
              {...(bookingUrl
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-transform duration-300 hover:-translate-y-0.5"
            >
              Sit with someone on it
              <ArrowRightIcon className="h-4 w-4" />
            </a>
          </div>
        ) : (
          <div className="mt-10 max-w-2xl rounded-card border border-border bg-card px-6 py-6">
            <p className="leading-7 text-muted">
              There is work of ours behind this one. It is linked on the right,
              and the written-up version of this page is still to come.
            </p>
          </div>
        )}
      </article>

      {/* The right rail. On Discord this lists people; here it answers the only
          question a reader has on landing: is there anything here for me. */}
      <aside className="w-full shrink-0 lg:w-[264px]">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-subtle">
          What we have
        </p>

        <div className="mt-4 space-y-3">
          {notebook ? (
            <RailLink
              label="Notebook"
              title={notebook.title}
              href={`${base}/notebooks/${notebook.slug}`}
            />
          ) : null}

          {roadmap ? (
            <RailLink
              label="Roadmap"
              title={`The ${roadmap.title} roadmap`}
              href={`${base}/roadmaps/${roadmap.slug}`}
            />
          ) : null}

          {topic.reference ? (
            <RailLink
              label="Reference"
              title={topic.reference.label}
              href={topic.reference.href}
              external
            />
          ) : null}

          {state === "soon" && !topic.reference ? (
            <p className="rounded-card border border-dashed border-border px-4 py-3 text-sm leading-6 text-subtle">
              Nothing yet, and no canonical source worth pointing at.
            </p>
          ) : null}
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <a
            href={bookingUrl || `${base}/#ask`}
            {...(bookingUrl
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
          >
            Book an hour on this
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </div>
      </aside>
    </div>
  );
}
