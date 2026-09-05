import type { Metadata } from "next";
import Link from "next/link";
import { roadmaps, countStops } from "@/lib/learn/roadmaps";
import { learnBase } from "@/lib/learn/paths";
import { Reveal } from "@/components/reveal";
import { ArrowRightIcon } from "@/components/icons";
import { NotesBlock, PaperSheet, type Tone } from "@/components/learn/paper";

const TONES: Tone[] = ["mint", "sky", "peach", "pink"];

export const metadata: Metadata = {
  title: "Roadmaps",
  description:
    "Ordered maps of what to learn and in what order, with the canonical reference for each stop and an hour with someone when a stop will not go in.",
};

export default async function RoadmapsIndex() {
  const base = await learnBase();

  return (
    <div className="notes-rule mx-auto w-full max-w-5xl px-6 pb-24 lg:pl-32 lg:pr-10">
      <NotesBlock margin="pg 1" className="pt-14 sm:pt-20">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-accent-strong">
          binary semaphore
        </p>
        <h1 className="mt-4 font-display text-5xl font-bold leading-[0.95] tracking-[-0.04em] text-foreground sm:text-7xl">
          Roadmaps
          <span className="text-accent">.</span>
        </h1>
        <p className="mt-4 max-w-2xl font-hand text-2xl leading-tight text-muted sm:text-3xl">
          what to learn, in what order, and where it usually goes wrong
        </p>

        <p className="mt-8 max-w-2xl text-lg leading-8 text-muted">
          The notebooks are organised by topic, which is how a writer organises
          material. You arrive with a goal instead. A roadmap reorders the same
          ground by goal: every stop points at the canonical reference, says
          plainly whether we have written anything on it, and offers an hour
          when reading is not going to be enough.
        </p>
      </NotesBlock>

      <ul className="mt-14 grid gap-6 sm:grid-cols-2">
        {roadmaps.map((roadmap, i) => (
          <li key={roadmap.slug}>
            <Reveal delay={i * 70}>
              <Link href={`${base}/roadmaps/${roadmap.slug}`} className="block">
                <PaperSheet
                  tone={TONES[i % TONES.length]}
                  className="flex h-full flex-col px-7 py-8 transition-transform duration-300 hover:-translate-y-1"
                >
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-foreground/45">
                    {roadmap.stages.length} stages &middot;{" "}
                    {countStops(roadmap)} stops
                  </p>
                  <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground">
                    {roadmap.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-foreground/75">
                    {roadmap.blurb}
                  </p>

                  <ol className="mt-6 flex flex-wrap gap-x-2 gap-y-2">
                    {roadmap.stages.map((stage) => (
                      <li
                        key={stage.name}
                        className="rounded-full bg-foreground/[0.07] px-3 py-1 font-mono text-[0.62rem] tracking-wide text-foreground/70"
                      >
                        {stage.name}
                      </li>
                    ))}
                  </ol>

                  <span className="mt-auto inline-flex items-center gap-2 pt-7 font-hand text-xl text-foreground/70">
                    Open the map
                    <ArrowRightIcon className="h-4 w-4" />
                  </span>
                </PaperSheet>
              </Link>
            </Reveal>
          </li>
        ))}
      </ul>

      {/* Said out loud rather than implied by an empty grid: one map exists,
          more are coming, and which ones is a decision not a mystery. */}
      <p className="mt-12 max-w-2xl font-hand text-2xl leading-snug text-subtle">
        More maps are being drawn. Databases and the final year project are
        next, and each one only ships when it is honest about what we can
        actually take you through.
      </p>
    </div>
  );
}
