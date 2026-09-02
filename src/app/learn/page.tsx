import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { notebooks, totalPages } from "@/lib/learn";
import { learnBase } from "@/lib/learn/paths";
import { Reveal } from "@/components/reveal";
import { Circle, Underline } from "@/components/annotate";
import { Arrow, Squiggle } from "@/components/doodle";
import { DiscordIcon, MailIcon, ArrowRightIcon } from "@/components/icons";
import {
  PaperSheet,
  StickyNote,
  StuckChip,
  type Tilt,
  type Tone,
} from "@/components/learn/paper";
import { MentorshipForm } from "@/components/learn/mentorship-form";

export const metadata: Metadata = {
  title: "Mentorship",
  description:
    "One to one mentorship for college students stuck in a computer science paper. Tell us which paper and where it stopped making sense.",
  alternates: { canonical: "https://learn.binarysemaphore.com" },
};

/** Cycled so the scraps and notes do not all sit at the same angle. */
const TONES: Tone[] = ["peach", "mint", "sky", "pink"];
const TILTS: Tilt[] = [0, 1, 2, 3];

export default async function MentorshipPage() {
  const base = await learnBase();
  const { mentorship } = site;

  return (
    <div className="mx-auto w-full max-w-5xl px-6 pb-24 lg:px-10">
      {/* Masthead. The plain statement, then the annotation, the way you would
          write a heading and come back to it with a pen. */}
      <header className="pt-16 sm:pt-24">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-accent-strong">
          {mentorship.eyebrow}
        </p>

        <h1 className="mt-4 font-display text-6xl font-bold leading-[0.9] tracking-[-0.04em] text-foreground sm:text-8xl">
          {mentorship.headline}
          <span className="text-accent">.</span>
        </h1>
        <p className="mt-3 font-hand text-3xl leading-tight text-muted sm:text-4xl">
          <Underline className="text-accent">{mentorship.headlineHand}</Underline>
        </p>

        <p className="mt-8 max-w-2xl text-lg leading-8 text-muted">
          {mentorship.lead}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a
            href={mentorship.bookingUrl || "#ask"}
            {...(mentorship.bookingUrl
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-transform duration-300 hover:-translate-y-0.5"
          >
            {mentorship.bookingUrl ? "Book a slot" : "Ask for a session"}
            <ArrowRightIcon className="h-4 w-4" />
          </a>
          <span aria-hidden className="hidden w-16 text-subtle sm:block">
            <Arrow />
          </span>
          <span className="font-hand text-xl text-subtle">
            {mentorship.bring}
          </span>
        </div>
      </header>

      <Squiggle className="my-14 text-border" />

      {/* What a student might actually be here for, in their words. */}
      <section aria-labelledby="stuck-heading">
        <h2
          id="stuck-heading"
          className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-subtle"
        >
          You might be here because of
        </h2>

        <div className="mt-6 flex flex-wrap gap-3">
          {mentorship.stuckOn.map((label, i) => (
            <StuckChip
              key={label}
              label={label}
              tone={TONES[i % TONES.length]}
              tilt={TILTS[i % TILTS.length]}
            />
          ))}
        </div>
      </section>

      {/* Three steps, on sticky notes. */}
      <section aria-labelledby="how-heading" className="mt-20">
        <h2
          id="how-heading"
          className="font-display text-3xl font-semibold tracking-tight text-foreground"
        >
          How it works
        </h2>

        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {mentorship.how.map((step, i) => (
            <li key={step.step}>
              <Reveal delay={i * 80}>
                <StickyNote tone={TONES[i]} tilt={TILTS[i]} className="h-full">
                  <p className="font-hand text-2xl leading-none text-foreground/60">
                    {i + 1}
                  </p>
                  <p className="mt-3 font-display text-lg font-semibold tracking-tight text-foreground">
                    {step.step}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground/75">
                    {step.body}
                  </p>
                </StickyNote>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      {/* What this is, answered plainly, because it is the first thing anyone
          wants to know and vagueness reads as evasion. */}
      <section aria-labelledby="what-heading" className="mt-20">
        <h2
          id="what-heading"
          className="font-display text-3xl font-semibold tracking-tight text-foreground"
        >
          What this is
        </h2>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <StickyNote tone="mint" tilt={0}>
            <p className="font-hand text-2xl leading-none text-foreground">
              It is
            </p>
            <ul className="mt-4 space-y-2.5">
              {mentorship.isThis.map((item) => (
                <li
                  key={item}
                  className="flex gap-2.5 text-sm leading-6 text-foreground/80"
                >
                  <span aria-hidden className="text-foreground/50">
                    &#10003;
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </StickyNote>

          <StickyNote tone="peach" tilt={1}>
            <p className="font-hand text-2xl leading-none text-foreground">
              It is not
            </p>
            <ul className="mt-4 space-y-2.5">
              {mentorship.isNotThis.map((item) => (
                <li
                  key={item}
                  className="flex gap-2.5 text-sm leading-6 text-foreground/80"
                >
                  <span aria-hidden className="text-foreground/50">
                    &#215;
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </StickyNote>
        </div>
      </section>

      {/* Real prompts from our own Question Bank, not written for this page.
          A question you either can answer out loud or cannot is the clearest
          way to show what an hour is spent on. */}
      <section aria-labelledby="questions-heading" className="mt-20">
        <h2
          id="questions-heading"
          className="font-display text-3xl font-semibold tracking-tight text-foreground"
        >
          The kind of question we sit with
        </h2>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          Not invented for this page. These are lifted straight out of our own
          Question Bank, which is one of the notebooks below.
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {mentorship.sampleQuestions.map((q, i) => (
            <li key={q.question}>
              <Reveal delay={i * 70}>
                <PaperSheet className="h-full px-6 py-6">
                  <p className="font-hand text-xl leading-snug text-foreground">
                    {q.question}
                  </p>
                  <p className="mt-4 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-subtle">
                    {q.from}
                  </p>
                </PaperSheet>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>

      {/* Booking is the way in. The form is kept for someone who is not ready
          to pick a time, but it is no longer the centre of the page. */}
      <section id="ask" className="mt-20 scroll-mt-24">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground">
          Pick a time you are <Circle className="text-accent">free</Circle>
        </h2>
        <p className="mt-3 max-w-xl leading-7 text-muted">
          One slot, one paper. You will be asked which paper and where it
          stopped making sense, so the hour starts with the actual question.
        </p>

        <PaperSheet tape className="mt-8 px-6 py-10 sm:px-10">
          {mentorship.bookingUrl ? (
            <a
              href={mentorship.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-transform duration-300 hover:-translate-y-0.5"
            >
              Book a slot
              <ArrowRightIcon className="h-4 w-4" />
            </a>
          ) : (
            <p className="font-hand text-2xl text-muted">
              Booking opens shortly. Until then, write to us below.
            </p>
          )}

          {/* Closed by default: a form nobody asked for should not be the first
              thing on the page. Native details, so it works without JS. */}
          <details className="group mt-8 border-t border-border pt-6">
            <summary className="cursor-pointer list-none font-mono text-[0.7rem] uppercase tracking-[0.16em] text-subtle transition-colors hover:text-foreground">
              Rather just write it out?
              <span aria-hidden className="ml-2 inline-block group-open:hidden">
                +
              </span>
              <span
                aria-hidden
                className="ml-2 hidden group-open:inline-block"
              >
                &minus;
              </span>
            </summary>

            <div className="-mx-6 mt-2 sm:-mx-10">
              <MentorshipForm />
            </div>
          </details>
        </PaperSheet>
      </section>

      {/* The notebooks, for someone who would rather read than talk. */}
      <section className="mt-20">
        <PaperSheet className="px-6 py-8 sm:px-10 sm:py-10">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-subtle">
            Or just read
          </p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {notebooks.length} study notebooks, {totalPages().toLocaleString("en-GB")} pages
          </h2>
          <p className="mt-3 max-w-xl leading-7 text-muted">
            Long-form manuals on backend and systems work, built to be printed
            and written on. Sign in and they open.
          </p>
          <Link
            href={`${base}/notebooks`}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-foreground px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            Open the library
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </PaperSheet>
      </section>

      {/* The other ways in. */}
      <section className="mt-16 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-border pt-10">
        <p className="font-hand text-xl text-muted">Rather just ask first?</p>

        {site.discord ? (
          <a
            href="/discord"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent"
          >
            <DiscordIcon className="h-4 w-4" />
            Ask in the Discord
          </a>
        ) : null}

        <a
          href={`mailto:${site.email}?subject=${encodeURIComponent("Mentorship")}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent"
        >
          <MailIcon className="h-4 w-4" />
          {site.email}
        </a>
      </section>
    </div>
  );
}
