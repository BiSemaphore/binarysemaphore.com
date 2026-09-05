import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/lib/site";
import { getNotebook } from "@/lib/learn";
import { getRoadmap, roadmaps, countStops } from "@/lib/learn/roadmaps";
import { learnBase } from "@/lib/learn/paths";
import { Reveal } from "@/components/reveal";
import { ArrowRightIcon } from "@/components/icons";
import {
  NotesBlock,
  PaperSheet,
  Perforation,
  StickyNote,
  type Tone,
} from "@/components/learn/paper";

const TONES: Tone[] = ["peach", "mint", "sky", "pink"];

export function generateStaticParams() {
  return roadmaps.map((roadmap) => ({ slug: roadmap.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const roadmap = getRoadmap(slug);
  if (!roadmap) return {};
  return {
    title: `${roadmap.title} roadmap`,
    description: roadmap.blurb,
  };
}

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const roadmap = getRoadmap(slug);
  if (!roadmap) notFound();

  const base = await learnBase();
  const { bookingUrl } = site.mentorship;
  const stops = countStops(roadmap);

  return (
    <div className="notes-rule mx-auto w-full max-w-5xl px-6 pb-24 lg:pl-32 lg:pr-10">
      <NotesBlock margin="the map" className="pt-14 sm:pt-20">
        <Link
          href={`${base}/roadmaps`}
          className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-subtle transition-colors hover:text-foreground"
        >
          &#8592; all roadmaps
        </Link>

        <h1 className="mt-5 font-display text-5xl font-bold leading-[0.95] tracking-[-0.04em] text-foreground sm:text-7xl">
          {roadmap.title}
          <span className="text-accent">.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
          {roadmap.blurb}
        </p>

        <p className="mt-6 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-subtle">
          {roadmap.stages.length} stages &middot; {stops} stops
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <StickyNote tone="sky" tilt={0}>
            <p className="font-hand text-2xl leading-none">Who this is for</p>
            <p className="mt-3 text-sm leading-6">{roadmap.audience}</p>
          </StickyNote>
          <StickyNote tone="peach" tilt={1}>
            <p className="font-hand text-2xl leading-none">Read this first</p>
            <p className="mt-3 text-sm leading-6">{roadmap.caution}</p>
          </StickyNote>
        </div>
      </NotesBlock>

      {/* The stages, in order, because the order is the point. Stops inside a
          stage are not ordered, so they are not numbered. */}
      {roadmap.stages.map((stage, stageIndex) => (
        <div key={stage.name}>
          <Perforation className="my-16" />

          <NotesBlock margin={`stage ${stageIndex + 1}`}>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-subtle">
              Stage {stageIndex + 1} of {roadmap.stages.length}
            </p>
            <h2 className="mt-3 font-hand text-4xl leading-none text-foreground sm:text-5xl">
              {stage.name}
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-muted">
              By the end: {stage.goal}
            </p>

            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {stage.stops.map((stop, i) => {
                const notebook = stop.notebook
                  ? getNotebook(stop.notebook)
                  : undefined;

                return (
                  <li key={stop.title}>
                    <Reveal delay={i * 60}>
                      <PaperSheet
                        tone={TONES[(stageIndex + i) % TONES.length]}
                        className="flex h-full flex-col px-6 py-6"
                      >
                        {stop.wall ? (
                          <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-accent-strong">
                            everyone gets stuck here
                          </p>
                        ) : null}

                        <p
                          className={`font-display text-lg font-semibold leading-snug tracking-tight text-foreground ${
                            stop.wall ? "mt-3" : ""
                          }`}
                        >
                          {stop.title}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-foreground/75">
                          {stop.body}
                        </p>

                        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-5">
                          {stop.source ? (
                            <a
                              href={stop.source.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-foreground/60 underline decoration-foreground/25 underline-offset-4 transition-colors hover:text-foreground"
                            >
                              {stop.source.label}
                            </a>
                          ) : null}

                          {notebook ? (
                            <Link
                              href={`${base}/notebooks/${notebook.slug}`}
                              className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-foreground/60 underline decoration-foreground/25 underline-offset-4 transition-colors hover:text-foreground"
                            >
                              our notebook
                            </Link>
                          ) : null}

                          <a
                            href={bookingUrl || `${base}/#ask`}
                            {...(bookingUrl
                              ? { target: "_blank", rel: "noopener noreferrer" }
                              : {})}
                            className="ml-auto font-hand text-lg leading-none text-foreground/70 transition-colors hover:text-foreground"
                          >
                            stuck here?
                          </a>
                        </div>
                      </PaperSheet>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
          </NotesBlock>
        </div>
      ))}

      <Perforation className="my-16" />

      <NotesBlock margin="!!">
        <PaperSheet tape className="px-6 py-10 sm:px-10">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            Nobody finishes this alone
          </h2>
          <p className="mt-3 max-w-xl leading-7 text-muted">
            The map is free and it will still be here later. What it does not do
            is sit with you at the stop you are stuck on, which is the part we
            actually offer.
          </p>
          <a
            href={bookingUrl || `${base}/#ask`}
            {...(bookingUrl
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-transform duration-300 hover:-translate-y-0.5"
          >
            Book an hour
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </PaperSheet>
      </NotesBlock>
    </div>
  );
}
