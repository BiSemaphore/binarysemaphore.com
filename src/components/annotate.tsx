"use client";

/**
 * Hand-drawn "pen" annotations for long-form thread prose. Wrap any inline text
 * to circle / underline / box / strike / highlight it, the way you'd mark up a
 * printed page. Each mark draws itself when it scrolls into view (respecting
 * `prefers-reduced-motion`, which shows it instantly).
 *
 * Wired into MDX in `src/mdx-components.tsx`, so threads can write:
 *   Cron was <Underline>easy</Underline> because the job was <Circle>dumb</Circle>.
 *
 * Stroke colour comes from `currentColor`; set it with a text utility via
 * `className` (default is the brand accent, i.e. a red-pen look).
 */

import { useEffect, useRef, useState, type ReactNode } from "react";

type MarkProps = {
  children: ReactNode;
  /** Tailwind colour utility for the stroke, e.g. "text-accent-strong". */
  className?: string;
};

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

/** Common style for a self-drawing stroke path. */
function strokeStyle(drawn: boolean, ms: number) {
  return {
    strokeDasharray: 1,
    strokeDashoffset: drawn ? 0 : 1,
    transition: `stroke-dashoffset ${ms}ms cubic-bezier(0.65, 0, 0.35, 1)`,
  } as const;
}

/** Slightly wobbly underline that sweeps in under the text. */
export function Underline({ children, className = "text-blue/80" }: MarkProps) {
  const { ref, drawn } = useDrawn<HTMLSpanElement>();
  return (
    <span ref={ref} className="relative inline-block">
      {children}
      <svg
        className={`pointer-events-none absolute -bottom-1 left-0 h-[0.5em] w-full overflow-visible ${className}`}
        viewBox="0 0 300 12"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M3 8C58 3 118 10 178 6c40-3 80-1 119 2"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          pathLength={1}
          style={strokeStyle(drawn, 1150)}
        />
      </svg>
    </span>
  );
}

/** Open, hand-drawn ellipse looped around the text. */
export function Circle({ children, className = "text-violet/80" }: MarkProps) {
  const { ref, drawn } = useDrawn<HTMLSpanElement>();
  return (
    <span ref={ref} className="relative inline-block px-[0.35em] py-[0.15em]">
      {children}
      <svg
        className={`pointer-events-none absolute inset-0 h-full w-full overflow-visible ${className}`}
        viewBox="0 0 300 120"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M155 9C82 6 16 28 13 60c-3 33 70 53 142 51 78-2 135-26 132-55C296 30 224 12 150 11"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          pathLength={1}
          style={strokeStyle(drawn, 1600)}
        />
      </svg>
    </span>
  );
}

/** Rough rectangle drawn around the text. */
export function Box({ children, className = "text-lime" }: MarkProps) {
  const { ref, drawn } = useDrawn<HTMLSpanElement>();
  return (
    <span ref={ref} className="relative inline-block px-[0.4em] py-[0.18em]">
      {children}
      <svg
        className={`pointer-events-none absolute inset-0 h-full w-full overflow-visible ${className}`}
        viewBox="0 0 300 100"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M9 13C88 8 214 7 292 13c4 26 3 49-1 74-79 6-206 7-284 1C3 62 4 39 9 13Z"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          style={strokeStyle(drawn, 1700)}
        />
      </svg>
    </span>
  );
}

/** A line struck through the text. */
export function Strike({ children, className = "text-subtle" }: MarkProps) {
  const { ref, drawn } = useDrawn<HTMLSpanElement>();
  return (
    <span ref={ref} className="relative inline-block">
      {children}
      <svg
        className={`pointer-events-none absolute left-0 top-1/2 h-[0.4em] w-full -translate-y-1/2 overflow-visible ${className}`}
        viewBox="0 0 300 10"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M4 6c60-3 130 2 190-1 40-2 70 1 102 2"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          pathLength={1}
          style={strokeStyle(drawn, 900)}
        />
      </svg>
    </span>
  );
}

/** Marker-style highlight that wipes in behind the text. */
export function Highlight({ children, className = "bg-sun/40" }: MarkProps) {
  const { ref, drawn } = useDrawn<HTMLSpanElement>();
  return (
    <span ref={ref} className="relative inline-block">
      <span
        className={`absolute inset-x-[-0.15em] bottom-[0.05em] top-[0.4em] origin-left -rotate-1 rounded-[0.2em] ${className}`}
        aria-hidden="true"
        style={{
          transform: `rotate(-1deg) scaleX(${drawn ? 1 : 0})`,
          transition: "transform 900ms cubic-bezier(0.65, 0, 0.35, 1)",
        }}
      />
      <span className="relative">{children}</span>
    </span>
  );
}
