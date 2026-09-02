import type { ReactNode } from "react";
import { DotGrid } from "@/components/decoration";

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
        <span aria-hidden className="tape left-1/2 top-0 -translate-x-1/2 -rotate-1" />
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
