import type { ReactNode } from "react";
import type { StaticImageData } from "next/image";
import { DotGrid } from "@/components/decoration";
import { Photo } from "@/components/photo";

/**
 * The notes-paper vocabulary for the learn landing page.
 *
 * The page should read like a student's own notes, so the pieces are the ones
 * you would actually find on a page: a sheet, a sticky note, a scribbled chip.
 * The paper texture itself is `DotGrid` from `src/components/decoration.tsx`,
 * which already existed for the marketing site.
 *
 * Tilts are small and fixed rather than random: a page that reshuffles itself on
 * every render reads as broken, not as handmade.
 */

/** The four highlighter tones, matching the notebooks' own marks. */
export type Tone = "peach" | "mint" | "sky" | "pink";

const NOTE_BG: Record<Tone, string> = {
  peach: "bg-[#ffe0d2] dark:bg-[#4a2f26]",
  mint: "bg-[#d6f3e6] dark:bg-[#1f4036]",
  sky: "bg-[#d9ecff] dark:bg-[#22384d]",
  pink: "bg-[#eddcff] dark:bg-[#38294a]",
};

const TILT = ["-rotate-1", "rotate-1", "-rotate-2", "rotate-2"] as const;
export type Tilt = 0 | 1 | 2 | 3;

/** A sheet of paper. Optionally taped to the page. */
export function PaperSheet({
  children,
  tape = false,
  className = "",
}: {
  children: ReactNode;
  tape?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative isolate overflow-hidden rounded-card border border-border bg-card shadow-soft ${className}`}
    >
      <DotGrid className="text-foreground/[0.07]" gap={24} size={1.2} />
      {tape ? (
        <span
          aria-hidden
          className="tape left-1/2 top-0 -translate-x-1/2 -rotate-1"
        />
      ) : null}
      {children}
    </div>
  );
}

/** One idea, on a coloured square. */
export function StickyNote({
  children,
  tone,
  tilt = 0,
  className = "",
}: {
  children: ReactNode;
  tone: Tone;
  tilt?: Tilt;
  className?: string;
}) {
  return (
    <div
      className={`sticky-note ${NOTE_BG[tone]} ${TILT[tilt]} p-5 transition-transform duration-300 hover:rotate-0 ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Something a student might say they are stuck on, written on a torn-off scrap.
 * The label is their words, not a syllabus entry.
 */
export function StuckChip({
  label,
  tone,
  tilt = 0,
}: {
  label: string;
  tone: Tone;
  tilt?: Tilt;
}) {
  return (
    <span
      className={`sticky-note ${NOTE_BG[tone]} ${TILT[tilt]} inline-block px-4 py-2 font-hand text-lg leading-none text-foreground transition-transform duration-300 hover:rotate-0`}
    >
      {label}
    </span>
  );
}

/**
 * One block of the page, sitting on the ruled sheet.
 *
 * The margin note is the thing you would scribble beside a paragraph: a page
 * number, a date, "!!". It lives in the gutter next to the red rule, and it
 * disappears below `lg`, where there is no gutter to put it in. Decorative, so
 * it is hidden from assistive tech rather than read out as stray words.
 */
export function NotesBlock({
  id,
  margin,
  children,
  className = "",
  labelledBy,
}: {
  id?: string;
  margin?: ReactNode;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`relative scroll-mt-24 ${className}`}
    >
      {margin ? (
        <span
          aria-hidden
          className="margin-note font-hand text-base leading-tight text-subtle"
        >
          {margin}
        </span>
      ) : null}
      {children}
    </section>
  );
}

/** A tear-off line between blocks. */
export function Perforation({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`perforation ${className}`} />;
}

/** A lined index card: one term, one honest sentence. */
export function IndexCard({
  term,
  children,
  tilt = 0,
}: {
  term: string;
  children: ReactNode;
  tilt?: Tilt;
}) {
  return (
    <div
      className={`index-card ${TILT[tilt]} px-4 py-4 transition-transform duration-300 hover:rotate-0`}
    >
      <p className="font-hand text-2xl leading-none text-accent-strong">
        {term}
      </p>
      <p className="mt-3 text-sm leading-[1.6rem] text-foreground/75">
        {children}
      </p>
    </div>
  );
}

/** A box drawn round something by hand, corners and all. */
export function DrawnBox({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`drawn-box ${className}`}>{children}</div>;
}

/**
 * A photograph stuck into the notebook.
 *
 * Not a hero image and not a banner: a white paper margin (deeper at the foot,
 * the way a print is), a degree or two of tilt, tape at the top, and the colour
 * pulled most of the way out by `.photo-print` so it sits with the ink rather
 * than shouting over it. Hovering restores the colour, the way you would pick a
 * photo up to look at it properly.
 *
 * The caption is optional and set in the handwritten face, because a photo in
 * someone's notes is captioned by hand or not at all.
 */
export function TapedPhoto({
  src,
  alt,
  caption,
  tilt = 0,
  className = "",
  /** Aspect ratio of the print itself, as a Tailwind class. */
  aspect = "aspect-[3/4]",
  sizes = "(min-width: 1024px) 24rem, 100vw",
  priority = false,
}: {
  src: StaticImageData;
  alt: string;
  caption?: string;
  tilt?: Tilt;
  className?: string;
  aspect?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <figure
      className={`group relative ${TILT[tilt]} bg-card p-3 pb-4 shadow-soft ring-1 ring-black/5 transition-transform duration-500 hover:rotate-0 ${className}`}
    >
      <span
        aria-hidden
        className="tape left-1/2 -top-2 -translate-x-1/2 rotate-2"
      />
      <Photo
        src={src}
        alt={alt}
        sizes={sizes}
        priority={priority}
        className={`photo-print w-full ${aspect}`}
      />
      {caption ? (
        <figcaption className="pt-3 text-center font-hand text-lg leading-none text-subtle">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
