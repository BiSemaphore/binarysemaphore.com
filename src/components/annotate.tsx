"use client";

/**
 * Hand-drawn "pen" annotations for long-form prose. Wrap any inline text to
 * circle / underline / box / strike / highlight it, the way you would mark up a
 * printed page. Each mark draws itself when it scrolls into view, respecting
 * `prefers-reduced-motion`, which shows it instantly.
 *
 * Wired into MDX in `src/mdx-components.tsx`, so a thread can write:
 *   Cron was <Underline>easy</Underline> because the job was <Circle>dumb</Circle>.
 *
 * ## What is here, and what is not
 *
 * Only the animation. The shapes, the palette, the weights and the timings live
 * in `./annotate/shapes.tsx`, which has no `"use client"` and can therefore be
 * rendered on the server. `./annotate/static.tsx` renders the same marks in
 * their finished state for places a browser is not involved, which is how the
 * admin's MDX preview shows real marks instead of imitations of them.
 *
 * ## Props
 *
 *   color    a brand token or any CSS colour
 *   weight   thin | regular | bold      how hard the pen presses
 *   speed    quick | normal | slow      how long the stroke takes to draw
 *   delay    milliseconds               to stagger marks in one sentence
 *
 * `<Highlight>` swaps `weight` for `opacity`, `height` and `tilt`, because it
 * is a filled band rather than a stroke. `className` still works and still
 * wins, so nothing written before these props existed changes.
 */

import { useEffect, useRef, useState } from "react";
import {
  BoldMark,
  HighlightMark,
  StrokeMark,
  type BoldProps,
  type HighlightProps,
  type MarkProps,
} from "@/components/annotate/shapes";

/** Reveal once, when the element scrolls into view. Reduced-motion => instant. */
function useDrawn<T extends Element>() {
  const ref = useRef<T>(null);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const raf = requestAnimationFrame(() => setDrawn(true));
      return () => cancelAnimationFrame(raf);
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setDrawn(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.85, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, drawn };
}

/** Slightly wobbly underline that sweeps in under the text. */
export function Underline(props: MarkProps) {
  const { ref, drawn } = useDrawn<HTMLSpanElement>();
  return <StrokeMark kind="underline" ref={ref} drawn={drawn} {...props} />;
}

/** Open, hand-drawn ellipse looped around the text. */
export function Circle(props: MarkProps) {
  const { ref, drawn } = useDrawn<HTMLSpanElement>();
  return <StrokeMark kind="circle" ref={ref} drawn={drawn} {...props} />;
}

/** Rough rectangle drawn around the text. */
export function Box(props: MarkProps) {
  const { ref, drawn } = useDrawn<HTMLSpanElement>();
  return <StrokeMark kind="box" ref={ref} drawn={drawn} {...props} />;
}

/** A line struck through the text. */
export function Strike(props: MarkProps) {
  const { ref, drawn } = useDrawn<HTMLSpanElement>();
  return <StrokeMark kind="strike" ref={ref} drawn={drawn} {...props} />;
}

/** Marker-style highlight that wipes in behind the text. */
export function Highlight(props: HighlightProps) {
  const { ref, drawn } = useDrawn<HTMLSpanElement>();
  return <HighlightMark ref={ref} drawn={drawn} {...props} />;
}

/** Emphasis that sweeps into colour, for a phrase that carries the paragraph. */
export function Bold(props: BoldProps) {
  const { ref, drawn } = useDrawn<HTMLSpanElement>();
  return <BoldMark ref={ref} drawn={drawn} {...props} />;
}
