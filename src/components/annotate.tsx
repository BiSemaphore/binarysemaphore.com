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
 * ## Props
 *
 * Colour used to arrive through `className`, which meant the only way to know
 * that "text-blue/80" was the colour slot was to read this file. It is a prop
 * now, and it takes either a brand token or any CSS colour:
 *
 *   <Highlight color="lime">this</Highlight>
 *   <Underline color="#0a7">or this</Underline>
 *
 * Three more, all optional and all with a sensible default per mark:
 *
 *   weight   thin | regular | bold      how hard the pen presses
 *   speed    quick | normal | slow      how long the stroke takes to draw
 *   delay    milliseconds               to stagger marks in one sentence
 *
 * `className` still works and still wins, so nothing written before this
 * changes. Passing no props gives byte-identical output to the version that
 * had none.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";

/** The palette, by name. Anything else is passed through as raw CSS. */
const TOKENS = [
  "accent",
  "accent-strong",
  "coral",
  "blue",
  "violet",
  "sun",
  "lime",
  "foreground",
  "muted",
  "subtle",
] as const;

export type MarkColor = (typeof TOKENS)[number] | (string & {});

type MarkProps = {
  children: ReactNode;
  /**
   * A brand token ("blue", "sun", "accent") or any CSS colour ("#0a7",
   * "rgb(0 0 0 / 0.5)"). Left out, each mark keeps its own default.
   */
  color?: MarkColor;
  /** How hard the pen presses. Default "regular". */
  weight?: "thin" | "regular" | "bold";
  /** How long the stroke takes. Scales each mark's own timing. */
  speed?: "quick" | "normal" | "slow";
  /** Milliseconds before it starts, for staggering marks in one sentence. */
  delay?: number;
  /** Escape hatch, and still the last word: applied after everything else. */
  className?: string;
};

/**
 * A token becomes a CSS variable; anything else is handed to CSS untouched.
 *
 * Returning undefined for "no colour given" is what preserves the old
 * behaviour: the default className carries the colour, and no inline style
 * overrides it.
 */
function resolveColor(color?: MarkColor): string | undefined {
  if (!color) return undefined;
  return (TOKENS as readonly string[]).includes(color)
    ? `var(--${color})`
    : color;
}

const WEIGHTS = { thin: 1.5, regular: 2.5, bold: 4 } as const;
const SPEEDS = { quick: 0.6, normal: 1, slow: 1.7 } as const;

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

/**
 * Common style for a self-drawing stroke path.
 *
 * The path is normalised to `pathLength={1}`, so one dash of length 1 covers
 * the whole stroke whatever its real geometry, and animating the offset from 1
 * to 0 draws it end to end. That is why every mark can share one function
 * despite having completely different paths.
 */
function strokeStyle(
  drawn: boolean,
  ms: number,
  speed: MarkProps["speed"] = "normal",
  delay = 0,
) {
  return {
    strokeDasharray: 1,
    strokeDashoffset: drawn ? 0 : 1,
    transition: `stroke-dashoffset ${Math.round(ms * SPEEDS[speed])}ms cubic-bezier(0.65, 0, 0.35, 1) ${delay}ms`,
  } as const;
}

/** Slightly wobbly underline that sweeps in under the text. */
export function Underline({
  children,
  color,
  weight = "regular",
  speed = "normal",
  delay = 0,
  className = "text-blue/80",
}: MarkProps) {
  const { ref, drawn } = useDrawn<HTMLSpanElement>();
  return (
    <span ref={ref} className="relative inline-block">
      {children}
      <svg
        className={`pointer-events-none absolute -bottom-1 left-0 h-[0.5em] w-full overflow-visible ${className}`}
        style={{ color: resolveColor(color) }}
        viewBox="0 0 300 12"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M3 8C58 3 118 10 178 6c40-3 80-1 119 2"
          stroke="currentColor"
          strokeWidth={WEIGHTS[weight]}
          strokeLinecap="round"
          pathLength={1}
          style={strokeStyle(drawn, 1150, speed, delay)}
        />
      </svg>
    </span>
  );
}

/** Open, hand-drawn ellipse looped around the text. */
export function Circle({
  children,
  color,
  weight = "regular",
  speed = "normal",
  delay = 0,
  className = "text-violet/80",
}: MarkProps) {
  const { ref, drawn } = useDrawn<HTMLSpanElement>();
  return (
    <span ref={ref} className="relative inline-block px-[0.35em] py-[0.15em]">
      {children}
      <svg
        className={`pointer-events-none absolute inset-0 h-full w-full overflow-visible ${className}`}
        style={{ color: resolveColor(color) }}
        viewBox="0 0 300 120"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M155 9C82 6 16 28 13 60c-3 33 70 53 142 51 78-2 135-26 132-55C296 30 224 12 150 11"
          stroke="currentColor"
          strokeWidth={WEIGHTS[weight]}
          strokeLinecap="round"
          pathLength={1}
          style={strokeStyle(drawn, 1600, speed, delay)}
        />
      </svg>
    </span>
  );
}

/** Rough rectangle drawn around the text. */
export function Box({
  children,
  color,
  weight = "regular",
  speed = "normal",
  delay = 0,
  className = "text-lime",
}: MarkProps) {
  const { ref, drawn } = useDrawn<HTMLSpanElement>();
  return (
    <span ref={ref} className="relative inline-block px-[0.4em] py-[0.18em]">
      {children}
      <svg
        className={`pointer-events-none absolute inset-0 h-full w-full overflow-visible ${className}`}
        style={{ color: resolveColor(color) }}
        viewBox="0 0 300 100"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M9 13C88 8 214 7 292 13c4 26 3 49-1 74-79 6-206 7-284 1C3 62 4 39 9 13Z"
          stroke="currentColor"
          strokeWidth={WEIGHTS[weight]}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          style={strokeStyle(drawn, 1700, speed, delay)}
        />
      </svg>
    </span>
  );
}

/** A line struck through the text. */
export function Strike({
  children,
  color,
  weight = "regular",
  speed = "normal",
  delay = 0,
  className = "text-subtle",
}: MarkProps) {
  const { ref, drawn } = useDrawn<HTMLSpanElement>();
  return (
    <span ref={ref} className="relative inline-block">
      {children}
      <svg
        className={`pointer-events-none absolute left-0 top-1/2 h-[0.4em] w-full -translate-y-1/2 overflow-visible ${className}`}
        style={{ color: resolveColor(color) }}
        viewBox="0 0 300 10"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M4 6c60-3 130 2 190-1 40-2 70 1 102 2"
          stroke="currentColor"
          strokeWidth={WEIGHTS[weight]}
          strokeLinecap="round"
          pathLength={1}
          style={strokeStyle(drawn, 900, speed, delay)}
        />
      </svg>
    </span>
  );
}

/**
 * Marker-style highlight that wipes in behind the text.
 *
 * Unlike the others this is a filled band, not a stroke, so `color` becomes a
 * background rather than a pen colour and `weight` has no meaning. It gets two
 * of its own instead: how tall the band sits, and how far it tilts.
 *
 * The colour is mixed with transparency rather than used flat, because a
 * highlighter that hides the words underneath is not a highlighter.
 */
export function Highlight({
  children,
  color,
  opacity = 0.4,
  height = "text",
  tilt = -1,
  speed = "normal",
  delay = 0,
  className = "bg-sun/40",
}: Omit<MarkProps, "weight"> & {
  /** How much of the colour shows through. Default 0.4. */
  opacity?: number;
  /** "text" hugs the words; "line" covers the whole line box. */
  height?: "text" | "line";
  /** Degrees of tilt, the way a real marker never lands square. */
  tilt?: number;
}) {
  const { ref, drawn } = useDrawn<HTMLSpanElement>();
  const resolved = resolveColor(color);

  return (
    <span ref={ref} className="relative inline-block">
      <span
        aria-hidden="true"
        className={`absolute inset-x-[-0.15em] origin-left rounded-[0.2em] ${
          height === "line" ? "inset-y-0" : "bottom-[0.05em] top-[0.4em]"
        } ${resolved ? "" : className}`}
        style={{
          // color-mix rather than an alpha channel, so a token, a hex and an
          // rgb() string all work the same way.
          background: resolved
            ? `color-mix(in oklab, ${resolved} ${Math.round(opacity * 100)}%, transparent)`
            : undefined,
          transform: `rotate(${tilt}deg) scaleX(${drawn ? 1 : 0})`,
          transition: `transform ${Math.round(900 * SPEEDS[speed])}ms cubic-bezier(0.65, 0, 0.35, 1) ${delay}ms`,
        }}
      />
      <span className="relative">{children}</span>
    </span>
  );
}
