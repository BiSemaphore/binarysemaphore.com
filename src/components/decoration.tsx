/**
 * Decorative primitives for the Superlist-inspired look.
 *
 * All are pure CSS/SVG with no client JS, marked aria-hidden, and
 * pointer-events-none so they never interfere with content or a11y.
 */
import type { CSSProperties } from "react";

type BlobProps = {
  /** A color token utility background, e.g. "bg-coral". Defaults to accent. */
  className?: string;
  style?: CSSProperties;
};

/**
 * A soft, blurred color blob. Position it with the `className` (absolute
 * inset utilities) and tint it with a `bg-*` color. Sits behind content.
 */
export function Blob({ className = "", style }: BlobProps) {
  return (
    <div
      aria-hidden
      style={style}
      className={`pointer-events-none absolute -z-10 rounded-full opacity-30 blur-3xl ${className}`}
    />
  );
}

/**
 * A halftone dot grid, Superlist's signature texture. Renders as a tiled
 * radial-gradient so it scales cleanly and costs nothing to paint.
 * Tint via a text color utility (dots use currentColor).
 */
export function DotGrid({
  className = "text-foreground/10",
  /** Dot spacing in px. */
  gap = 22,
  /** Dot radius in px. */
  size = 1.5,
}: {
  className?: string;
  gap?: number;
  size?: number;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 -z-10 ${className}`}
      style={{
        backgroundImage:
          "radial-gradient(currentColor var(--dot-size) , transparent var(--dot-size))",
        backgroundSize: `${gap}px ${gap}px`,
        // expose dot radius to the gradient above
        ["--dot-size" as string]: `${size}px`,
      }}
    />
  );
}

/**
 * A wide, soft gradient wash used behind hero/CTA areas. Uses the brand
 * coral -> violet gradient tokens at low opacity.
 */
export function GradientWash({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 -z-10 opacity-[0.18] blur-2xl ${className}`}
      style={{
        background:
          "radial-gradient(60% 60% at 15% 0%, var(--grad-from), transparent), radial-gradient(55% 55% at 90% 20%, var(--grad-to), transparent)",
      }}
    />
  );
}
