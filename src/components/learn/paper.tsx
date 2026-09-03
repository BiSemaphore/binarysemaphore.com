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
  tone,
  className = "",
}: {
  children: ReactNode;
  tape?: boolean;
  /** Tints the sheet with one of the four highlighter colours. */
  tone?: Tone;
  className?: string;
}) {
  return (
    <div
      className={`relative isolate overflow-hidden rounded-card border shadow-soft ${
        tone ? `${NOTE_BG[tone]} border-transparent` : "border-border bg-card"
      } ${className}`}
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
  tone,
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={`drawn-box ${tone ? NOTE_BG[tone] : ""} ${className}`}>
      {children}
    </div>
  );
}

/**
 * A photograph at full width, with the page's own content laid over it.
 *
 * Deliberately not a small taped print: an image this size is either the
 * strongest thing in view or it should not be there at all. The scrim is a
 * gradient rather than a flat wash, so the picture stays a picture while the
 * type over it keeps its contrast.
 */
export function PhotoBand({
  src,
  alt,
  children,
  /** Fixed ratio for an image-only band. Pass "" when content sets the height. */
  aspect = "aspect-[16/9]",
  priority = false,
  className = "",
  /** Which part of the photo to keep when it is cropped. */
  focus = "object-center",
}: {
  src: StaticImageData;
  alt: string;
  children?: ReactNode;
  aspect?: string;
  priority?: boolean;
  className?: string;
  focus?: string;
}) {
  return (
    <div
      className={`relative isolate overflow-hidden rounded-panel ${aspect} ${className}`}
    >
      {/* Photo sets `relative` on its own wrapper, so it cannot be positioned
          by passing `absolute` in. It gets its own absolute box instead, which
          also means the band can be sized by its content rather than needing a
          fixed aspect ratio. */}
      <div className="absolute inset-0">
        <Photo
          src={src}
          alt={alt}
          sizes="(min-width: 1024px) 56rem, 100vw"
          priority={priority}
          className="h-full w-full"
          imgClassName={focus}
        />
      </div>
      {children ? (
        <>
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/65 to-black/15 sm:bg-gradient-to-r sm:from-black/90 sm:via-black/70 sm:to-black/20"
          />
          <div className="relative flex h-full flex-col justify-end p-6 py-10 sm:p-10 sm:py-12">
            {children}
          </div>
        </>
      ) : null}
    </div>
  );
}
