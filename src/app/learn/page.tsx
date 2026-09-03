import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { notebooks, totalPages, totalSections } from "@/lib/learn";
import { learnBase } from "@/lib/learn/paths";
import { Reveal } from "@/components/reveal";
import { Circle } from "@/components/annotate";
import { Arrow, Squiggle } from "@/components/doodle";
import { DiscordIcon, MailIcon, ArrowRightIcon } from "@/components/icons";
import emptyLectureHall from "@/images/empty-lecture-hall.jpg";
import deskGridPad from "@/images/desk-grid-pad.jpg";
import {
  DrawnBox,
  IndexCard,
  NotesBlock,
  PaperSheet,
  Perforation,
  StickyNote,
  StuckChip,
  PhotoBand,
  type Tilt,
  type Tone,
} from "@/components/learn/paper";
import { AiPipeline, SyllabusTree } from "@/components/learn/diagrams";
import { NotebookStrip } from "@/components/learn/notebook-strip";
import { SelfCheck } from "@/components/learn/self-check";
import { MentorshipForm } from "@/components/learn/mentorship-form";

export const metadata: Metadata = {
  title: "Mentorship",
  description:
    "One to one mentorship for college students stuck in a computer science paper. Core papers, JavaScript, and what AI is actually doing underneath.",
  alternates: { canonical: "https://learn.binarysemaphore.com" },
};

/** Cycled so the scraps and notes do not all sit at the same angle. */
const TONES: Tone[] = ["peach", "mint", "sky", "pink"];
const TILTS: Tilt[] = [0, 1, 2, 3];

/** Shared by every section heading, so they all read as the same hand. */
const HEADING =
  "font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl";
/** The four highlighters, for the FAQ notes. */
const FAQ_BG = [
  "bg-[#ffe0d2] dark:bg-[#4a2f26]",
  "bg-[#d6f3e6] dark:bg-[#1f4036]",
  "bg-[#d9ecff] dark:bg-[#22384d]",
  "bg-[#eddcff] dark:bg-[#38294a]",
];

const EYEBROW =
  "font-mono text-[0.7rem] uppercase tracking-[0.28em] text-subtle";

export default async function MentorshipPage() {
  const base = await learnBase();
  const { mentorship } = site;

  return (
    <div className="notes-rule mx-auto w-full max-w-5xl px-6 pb-24 lg:pl-32 lg:pr-10">
      {/* Masthead. The plain statement, then the annotation, the way you would
          write a heading and come back to it with a pen. */}
      {/* The hero. One photograph at full width with the type over it, rather
          than a wall of words beside a small print. The scrim is a gradient, so
          the picture survives and the text still has contrast. */}
      <NotesBlock margin="pg 1" className="pt-10 sm:pt-14">
        <PhotoBand
          src={emptyLectureHall}
          alt="One student sitting alone reading in an otherwise empty lecture hall."
          priority
          aspect=""
          focus="object-[55%_60%]"
          className="min-h-[36rem] sm:min-h-[32rem] lg:min-h-[36rem]"
        >
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.28em] text-white/60">
            {mentorship.eyebrow}
          </p>

          <h1 className="mt-3 font-display text-6xl font-bold leading-[0.9] tracking-[-0.04em] text-white sm:text-7xl lg:text-8xl">
            {mentorship.headline}
            <span className="text-accent">.</span>
          </h1>
          <p className="mt-2 font-hand text-2xl leading-tight text-white/80 sm:text-3xl">
            {mentorship.headlineHand}
          </p>

          <p className="mt-5 max-w-xl text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
            {mentorship.lead}
          </p>

          <div className="mt-7">
            <a
              href={mentorship.bookingUrl || "#ask"}
              {...(mentorship.bookingUrl
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-transform duration-300 hover:-translate-y-0.5"
            >
              {mentorship.bookingUrl ? "Book a slot" : "Ask for a session"}
              <ArrowRightIcon className="h-4 w-4" />
            </a>
          </div>
        </PhotoBand>

        <p className="mt-5 flex flex-wrap items-center gap-3 font-hand text-xl text-subtle">
          <span aria-hidden className="hidden w-12 text-subtle sm:block">
            <Arrow />
          </span>
          {mentorship.bring}
        </p>
      </NotesBlock>

      <Squiggle className="my-14 text-border" />

      {/* What a student might actually be here for, in their words. */}
      <NotesBlock margin="in their words" labelledBy="stuck-heading">
        <h2 id="stuck-heading" className={EYEBROW}>
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
      </NotesBlock>

      {/* Three students, described closely enough that one of them is you. */}
      <NotesBlock
        margin="which one?"
        labelledBy="profiles-heading"
        className="mt-20"
      >
        <h2 id="profiles-heading" className={HEADING}>
          Which one are you?
        </h2>

        <ul className="mt-8 grid gap-6 lg:grid-cols-3">
          {mentorship.profiles.map((profile, i) => (
            <li key={profile.tag}>
              <Reveal delay={i * 80}>
                <PaperSheet
                  tone={TONES[i % TONES.length]}
                  className="h-full px-6 py-7"
                >
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-subtle">
                    {profile.tag}
                  </p>
                  <p className="mt-4 font-hand text-2xl leading-tight text-foreground/80">
                    &#8220;{profile.said}&#8221;
                  </p>
                  <p className="mt-5 font-display text-lg font-semibold leading-snug tracking-tight text-foreground">
                    {profile.title}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-foreground/75">
                    {profile.body}
                  </p>
                </PaperSheet>
              </Reveal>
            </li>
          ))}
        </ul>
      </NotesBlock>

      <Perforation className="my-20" />

      {/* One question taken apart in public. Showing the reasoning is worth
          more than any number of claims about it, so this gets real room. */}
      <NotesBlock
        margin="work it through"
        labelledBy="worked-heading"
        className="scroll-mt-24"
        id="worked"
      >
        <p className={EYEBROW}>{mentorship.workedExample.label}</p>
        <h2 id="worked-heading" className={`mt-3 ${HEADING}`}>
          Someone asked us this
        </h2>

        <PaperSheet tape className="mt-8 px-6 py-10 sm:px-10">
          <p className="max-w-3xl font-hand text-2xl leading-snug text-foreground sm:text-3xl">
            {mentorship.workedExample.asked}
          </p>

          <ol className="mt-10 space-y-8 border-t border-dashed border-border pt-8">
            {mentorship.workedExample.steps.map((step, i) => (
              <li key={step.title} className="flex gap-5">
                <span
                  aria-hidden
                  className="mt-0.5 font-hand text-3xl leading-none text-accent/70"
                >
                  {i + 1}
                </span>
                <div>
                  <p className="font-display text-lg font-semibold tracking-tight text-foreground">
                    {step.title}
                  </p>
                  <p className="mt-2 max-w-2xl leading-7 text-muted">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <DrawnBox className="mt-10 px-6 py-5">
            <p className="max-w-3xl leading-7 text-foreground">
              {mentorship.workedExample.verdict}
            </p>
          </DrawnBox>
        </PaperSheet>
      </NotesBlock>

      {/* Three steps, on sticky notes. */}
      <NotesBlock
        margin="the shape of it"
        labelledBy="how-heading"
        className="mt-20"
      >
        <h2 id="how-heading" className={HEADING}>
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
      </NotesBlock>

      <Perforation className="my-20" />

      {/* The ten questions. Scored in the browser, kept by nobody. */}
      <NotesBlock
        margin="say it out loud"
        labelledBy="check-heading"
        id="check"
      >
        <h2 id="check-heading" className={HEADING}>
          {mentorship.selfCheck.title}
        </h2>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          {mentorship.selfCheck.lead}
        </p>

        <div className="mt-8">
          <SelfCheck />
        </div>
      </NotesBlock>

      {/* What this is, answered plainly, because it is the first thing anyone
          wants to know and vagueness reads as evasion. */}
      <NotesBlock margin="plainly" labelledBy="what-heading" className="mt-20">
        <h2 id="what-heading" className={HEADING}>
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
      </NotesBlock>

      <Perforation className="my-20" />

      {/* AI, taught the same way as everything else here: what is actually
          happening, not what to type. */}
      <NotesBlock margin="press enter" labelledBy="ai-heading" id="ai">
        <p className={EYEBROW}>{mentorship.ai.label}</p>
        <h2 id="ai-heading" className={`mt-3 ${HEADING}`}>
          <Circle className="text-accent">{mentorship.ai.title}</Circle>
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">
          {mentorship.ai.lead}
        </p>

        <div className="mt-10">
          <AiPipeline />
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {mentorship.ai.glossary.map((entry, i) => (
            <li key={entry.term}>
              <Reveal delay={i * 60}>
                <IndexCard term={entry.term} tilt={TILTS[i % TILTS.length]}>
                  {entry.body}
                </IndexCard>
              </Reveal>
            </li>
          ))}
        </ul>

        <p className="mt-10 max-w-2xl font-hand text-2xl leading-snug text-foreground">
          {mentorship.ai.honest}
        </p>

        <PaperSheet className="mt-8 px-6 py-7 sm:px-8">
          <p className="max-w-3xl leading-7 text-muted">
            {mentorship.ai.proof.body}
          </p>
          <a
            href={mentorship.ai.proof.href}
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-foreground underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent"
          >
            {mentorship.ai.proof.label}
            <ArrowRightIcon className="h-4 w-4" />
          </a>
        </PaperSheet>
      </NotesBlock>

      {/* Real prompts from our own Question Bank, not written for this page.
          A question you either can answer out loud or cannot is the clearest
          way to show what an hour is spent on. */}
      <NotesBlock
        margin="from the book"
        labelledBy="questions-heading"
        className="mt-20"
      >
        <h2 id="questions-heading" className={HEADING}>
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
                <PaperSheet
                  tone={TONES[i % TONES.length]}
                  className="h-full px-6 py-6"
                >
                  <p className="font-hand text-xl leading-snug text-foreground">
                    {q.question}
                  </p>
                  <p className="mt-4 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-foreground/50">
                    {q.from}
                  </p>
                </PaperSheet>
              </Reveal>
            </li>
          ))}
        </ul>
      </NotesBlock>

      <Perforation className="my-20" />

      {/* The subjects, drawn as a map. Doubles as a way into the library. */}
      <NotesBlock margin="the map" labelledBy="syllabus-heading">
        <h2 id="syllabus-heading" className={HEADING}>
          What we can actually sit with
        </h2>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          Not a syllabus, and nothing has to be taken in order. Point at the
          branch that is giving you trouble.
        </p>

        <div className="mt-10">
          <SyllabusTree />
        </div>
      </NotesBlock>

      {/* The library, shown rather than counted. */}
      <NotesBlock margin="or just read" className="mt-20">
        <p className={EYEBROW}>The notebooks</p>
        <h2 className={`mt-3 ${HEADING}`}>
          {notebooks.length} of them, {totalSections()} sections,{" "}
          {totalPages().toLocaleString("en-GB")} pages
        </h2>
        <p className="mt-3 max-w-2xl leading-7 text-muted">
          Long-form manuals on backend and systems work, built to be printed and
          written on. The contents pages are open to everyone. Sign in and the
          rest opens too.
        </p>

        <div className="mt-8">
          <NotebookStrip base={base} />
        </div>

        <Link
          href={`${base}/notebooks`}
          className="mt-4 inline-flex items-center gap-2 rounded-full border border-foreground px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          Open the library
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </NotesBlock>

      <Perforation className="my-20" />

      {/* Logistics. These reassure more than encouragement does. */}
      <NotesBlock margin="the hour itself" labelledBy="session-heading">
        <h2 id="session-heading" className={HEADING}>
          What an hour is
        </h2>

        <dl className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {mentorship.session.map((item) => (
            <div key={item.label} className="border-t border-border pt-4">
              <dt className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-subtle">
                {item.label}
              </dt>
              <dd className="mt-2 leading-7 text-muted">{item.body}</dd>
            </div>
          ))}
        </dl>
      </NotesBlock>

      {/* The questions people actually send before booking. */}
      <NotesBlock
        margin="asked a lot"
        labelledBy="faq-heading"
        className="mt-20"
      >
        <h2 id="faq-heading" className={HEADING}>
          Before you ask
        </h2>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {mentorship.faq.map((item, i) => (
            <li key={item.q}>
              <details
                className={`group h-full rounded-card px-5 py-4 ${FAQ_BG[i % FAQ_BG.length]}`}
              >
                <summary className="flex cursor-pointer list-none items-start gap-3 font-hand text-xl leading-snug text-foreground">
                  <span aria-hidden className="text-accent">
                    Q
                  </span>
                  {item.q}
                </summary>
                <p className="mt-3 border-t border-dashed border-foreground/15 pt-3 text-sm leading-6 text-foreground/75">
                  {item.a}
                </p>
              </details>
            </li>
          ))}
        </ul>
      </NotesBlock>

      <Perforation className="my-20" />

      <PhotoBand
        src={deskGridPad}
        alt="A hand about to write on a blank grid-paper pad on a dark desk."
        aspect="aspect-[3/2] sm:aspect-[21/9]"
        focus="object-[35%_50%]"
        className="mb-20"
      >
        <p className="font-hand text-3xl leading-tight text-white sm:text-4xl">
          The blank page is the hard part.
        </p>
      </PhotoBand>

      {/* Booking is the way in. The form is kept for someone who is not ready
          to pick a time, but it is no longer the centre of the page. */}
      <NotesBlock id="ask" margin="!!">
        <h2 className={HEADING}>
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
              <span aria-hidden className="ml-2 hidden group-open:inline-block">
                &minus;
              </span>
            </summary>

            <div className="-mx-6 mt-2 sm:-mx-10">
              <MentorshipForm />
            </div>
          </details>
        </PaperSheet>
      </NotesBlock>

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
