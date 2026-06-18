/**
 * Per-letter "roll" hover, recreating the reference site's GSAP SplitText nav
 * animation with pure CSS. The label is split into letters; a duplicate row
 * sits clipped below. On hover of the link (`.roll-link`), every letter rolls
 * up with a small per-letter delay so the word cascades.
 *
 * No JS animation library: the stagger is just inline transition-delay, and the
 * whole thing is disabled under prefers-reduced-motion by the global rule.
 */
const NBSP = " ";

function Row({
  letters,
  step,
  clone,
}: {
  letters: string[];
  step: number;
  clone: boolean;
}) {
  return (
    <span className={clone ? "roll-row roll-row--clone" : "roll-row"} aria-hidden>
      {letters.map((ch, i) => (
        <span
          key={i}
          className="roll-letter"
          style={{ transitionDelay: `${i * step}ms` }}
        >
          {ch === " " ? NBSP : ch}
        </span>
      ))}
    </span>
  );
}

export function RollText({
  text,
  /** Per-letter stagger in ms. */
  step = 22,
}: {
  text: string;
  step?: number;
}) {
  const letters = [...text];
  return (
    <span className="roll" aria-label={text}>
      <Row letters={letters} step={step} clone={false} />
      <Row letters={letters} step={step} clone />
    </span>
  );
}
