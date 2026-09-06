import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/lib/site";
import { getNotebook } from "@/lib/learn";
import { getRoadmap } from "@/lib/learn/roadmaps";
import {
  allChannels,
  channelState,
  getChannel,
  getChannelBody,
} from "@/lib/learn/topics";
import { MdxBody } from "@/lib/mdx/runtime";
import { learnBase } from "@/lib/learn/paths";
import { ArrowRightIcon } from "@/components/icons";
import { DecodeTitle } from "@/components/learn/topics/decode-title";
import { RequestNote } from "@/components/learn/request-note";

type Params = { subject: string; channel: string };

export async function generateStaticParams() {
  return (await allChannels()).map(({ subject, channel }) => ({
    subject: subject.slug,
    channel: channel.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { subject, channel } = await params;
  const found = await getChannel(subject, channel);
  if (!found) return {};
  return {
    title: `${found.channel.title} · ${found.subject.name}`,
    description: found.channel.blurb,
  };
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
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {body}
    </a>
  ) : (
    <Link href={href} className={className}>
      {body}
    </Link>
  );
}

export default async function ChannelPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { subject: subjectSlug, channel: channelSlug } = await params;
  const [found, body] = await Promise.all([
    getChannel(subjectSlug, channelSlug),
    getChannelBody(subjectSlug, channelSlug),
  ]);
  if (!found) notFound();

  const { subject, channel } = found;
  const base = await learnBase();
  const state = channelState(channel);
  const notebook = channel.notebook ? getNotebook(channel.notebook) : undefined;
  const roadmap = channel.roadmap ? getRoadmap(channel.roadmap) : undefined;
  const { bookingUrl } = site.mentorship;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 lg:flex-row lg:gap-12 lg:px-10 lg:py-14">
      <article className="min-w-0 flex-1">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.22em] text-subtle">
          {subject.name}
        </p>

        <DecodeTitle
          text={channel.title}
          className="font-reading mt-4 text-3xl font-bold leading-[1.15] tracking-[-0.04em] text-foreground sm:text-4xl"
        />

        <p className="font-reading mt-4 max-w-3xl text-[1.05rem] leading-[1.75] text-muted">
          {channel.blurb}
        </p>

        {body ? (
          <article className="thread topic-prose mt-10 max-w-3xl">
            <MdxBody source={body} />
          </article>
        ) : null}

        <div className="mt-12 max-w-3xl space-y-5 border-t border-border pt-10">
          <p className="leading-7 text-muted">
            {body
              ? "More on this is coming, and asking moves it up the list."
              : state === "soon"
                ? "We have not written this one up yet, and it would be easy to pretend otherwise."
                : "There is work of ours behind this. It is linked on the right."}
          </p>

          <RequestNote
            subject={`${subject.slug}/${channel.slug}`}
            title={channel.title}
          />

          <p className="text-sm leading-6 text-subtle">
            Or{" "}
            <a
              href={bookingUrl || `${base}/#ask`}
              {...(bookingUrl
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
            >
              sit with someone on it
            </a>{" "}
            instead of waiting for us to write it.
          </p>
        </div>
      </article>

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
          {channel.reference ? (
            <RailLink
              label="Reference"
              title={channel.reference.label}
              href={channel.reference.href}
              external
            />
          ) : null}
          {state === "soon" && !channel.reference ? (
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
