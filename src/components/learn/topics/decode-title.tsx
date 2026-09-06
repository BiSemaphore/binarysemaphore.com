/**
 * A topic title that resolves character by character as it arrives.
 *
 * The text is rendered in full immediately and only animated per character, so
 * the accessible name is the whole title from the first frame and a crawler
 * sees plain text. `aria-hidden` on the spans plus an `sr-only` copy would be
 * the alternative; splitting the visible text is simpler and has no duplicate.
 *
 * Chrome only. Body prose is never animated: it hurts readability and LCP. With
 * `prefers-reduced-motion` the animation is dropped in CSS and the title is
 * simply present.
 *
 * Deliberately a server component. It has no state, no handlers and touches no
 * browser API: the animation is CSS and the only per-character value is a
 * static inline delay. Marking it `"use client"` shipped JavaScript to render
 * spans.
 */
export function DecodeTitle({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <h1 className={`decode ${className}`}>
      {text.split("").map((char, i) => (
        <span
          key={`${char}-${i}`}
          style={{ animationDelay: `${Math.min(i * 26, 620)}ms` }}
        >
          {char === " " ? " " : char}
        </span>
      ))}
    </h1>
  );
}
