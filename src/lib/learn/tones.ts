/**
 * The four highlighter tones, in one place.
 *
 * These were declared independently in six files: `NOTE_BG` in paper.tsx,
 * `LEAF_BG` in diagrams.tsx, `CARD_BG` in notebook-strip.tsx, `FAQ_BG` and
 * `TONES` on the learn page, and `TONES` again on both roadmap pages. Same four
 * colours, four different names, and one of them in a different order, so a
 * fifth tone or a palette change meant finding all six.
 *
 * The classes themselves live in `globals.css` as `.note-*`, which is also
 * where they re-pin the text tokens so the tint stays readable in dark mode.
 */
export type Tone = "peach" | "mint" | "sky" | "pink";

/** Cycle order. Index into this with `i % TONES.length`. */
export const TONES: Tone[] = ["peach", "mint", "sky", "pink"];

export const TONE_CLASS: Record<Tone, string> = {
  peach: "note-peach",
  mint: "note-mint",
  sky: "note-sky",
  pink: "note-pink",
};

/** The class for the nth item in a list, cycling through the four. */
export function toneAt(index: number): string {
  return TONE_CLASS[TONES[index % TONES.length]];
}
