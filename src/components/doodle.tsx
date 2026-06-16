/**
 * Hand-drawn doodle primitives for the "sketchbook" typography style.
 *
 * Each is a pure inline SVG (no client JS). Strokes use `currentColor`, so set
 * the colour with a text utility on the element (e.g. `text-accent`). The
 * underline/circle stretch to the wrapped text via `preserveAspectRatio="none"`.
 */
import type { ReactNode } from "react";

type WrapProps = {
  children: ReactNode;
  /** Tailwind colour utility for the doodle stroke, e.g. "text-accent". */
  className?: string;
};

/** Slightly wobbly underline that sits just below the wrapped text. */
export function Underline({ children, className = "text-accent" }: WrapProps) {
  return (
    <span className="relative inline-block">
      {children}
      <svg
        className={`pointer-events-none absolute -bottom-1.5 left-0 h-2 w-full ${className}`}
        viewBox="0 0 300 12"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M3 8C58 3 118 10 178 6c40-3 80-1 119 2"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/** Open, hand-drawn ellipse looped around the wrapped text. */
export function Circle({ children, className = "text-accent" }: WrapProps) {
  return (
    <span className="relative inline-block px-2 py-1">
      {children}
      <svg
        className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
        viewBox="0 0 300 120"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M155 9C82 6 16 28 13 60c-3 33 70 53 142 51 78-2 135-26 132-55C296 30 224 12 150 11"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/** Marker-style highlight swept behind the wrapped text. */
export function Highlight({
  children,
  className = "bg-accent/20",
}: WrapProps) {
  return (
    <span className="relative inline-block">
      <span
        className={`absolute inset-x-[-0.15em] bottom-[0.05em] top-[0.45em] -rotate-1 rounded-[0.2em] ${className}`}
        aria-hidden="true"
      />
      <span className="relative">{children}</span>
    </span>
  );
}

/** A wavy divider line. */
export function Squiggle({ className = "text-border" }: { className?: string }) {
  return (
    <svg
      className={`h-3 w-28 ${className}`}
      viewBox="0 0 120 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M2 6c8-7 18 7 26 0s18 7 26 0 18 7 26 0 18 7 26 0"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A little curved doodle arrow; rotate via className. */
export function Arrow({ className = "text-subtle" }: { className?: string }) {
  return (
    <svg
      className={`h-8 w-8 ${className}`}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 10c14 2 26 12 30 28"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M40 26c-1 5-2 9-2 12-4-1-8-2-12-2"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
