import { site } from "@/lib/site";
import { DrawnBox, type Tone } from "@/components/learn/paper";

/**
 * The two drawn things on the page.
 *
 * Both are laid out with CSS rather than a fixed SVG, because a diagram that
 * cannot reflow is a diagram that is unreadable on a phone, and a phone is what
 * a student is holding. The hand-drawn quality comes from the uneven corners of
 * `.drawn-box` and from Caveat, not from a bitmap.
 */

/**
 * What actually happens between the question and the answer. Four stages,
 * because a fifth turns it into a lecture.
 */
const TONES: Tone[] = ["peach", "mint", "sky", "pink"];

/** The same four highlighters, at chip strength. */
const LEAF_BG = [
  "bg-[#ffe0d2] dark:bg-[#4a2f26]",
  "bg-[#d6f3e6] dark:bg-[#1f4036]",
  "bg-[#d9ecff] dark:bg-[#22384d]",
  "bg-[#eddcff] dark:bg-[#38294a]",
];

export function AiPipeline() {
  const { stages } = site.mentorship.ai;

  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stages.map((stage, i) => (
        <li key={stage.name} className="relative">
          <DrawnBox tone={TONES[i % TONES.length]} className="h-full px-5 py-5">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-foreground/45">
              {String(i + 1).padStart(2, "0")}
            </p>
            <p className="mt-2 font-hand text-2xl leading-none text-foreground">
              {stage.name}
            </p>
            <p className="mt-3 text-sm leading-6 text-foreground/75">
              {stage.body}
            </p>
          </DrawnBox>

          {/* The arrow to the next stage, drawn in the gap. Only where there is
              a gap to draw it in, so it never dangles off the last one. */}
          {i < stages.length - 1 ? (
            <span
              aria-hidden
              className="absolute -right-3 top-1/2 hidden -translate-y-1/2 font-hand text-2xl text-subtle lg:block"
            >
              &#8594;
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

/**
 * The subjects, as a map rather than a syllabus: one stem, a branch per
 * subject, and what actually sits on each branch.
 */
export function SyllabusTree() {
  const { syllabus } = site.mentorship;

  return (
    <ol className="relative ml-2 border-l border-dashed border-border pl-6 sm:ml-4 sm:pl-10">
      {syllabus.map((branch) => (
        <li key={branch.branch} className="relative py-5 first:pt-0 last:pb-0">
          {/* The elbow off the stem. A quarter turn, so it reads as drawn
              rather than as a table rule. */}
          <span
            aria-hidden
            className="absolute -left-6 top-8 h-4 w-4 rounded-bl-xl border-b border-l border-dashed border-border sm:-left-10 sm:w-8"
          />

          <p className="font-hand text-3xl leading-none text-foreground">
            {branch.branch}
          </p>

          <ul className="mt-3 flex flex-wrap gap-x-2 gap-y-2">
            {branch.leaves.map((leaf, i) => (
              <li
                key={leaf}
                className={`rounded-full px-3 py-1 font-mono text-[0.68rem] tracking-wide text-foreground/75 ${LEAF_BG[i % LEAF_BG.length]}`}
              >
                {leaf}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
