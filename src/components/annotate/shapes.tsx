import type { CSSProperties, ReactNode, Ref } from "react";

/**
 * The pen marks, as geometry.
 *
 * Deliberately not a client component. Everything here is shape, colour and
 * measurement, none of which needs a browser; only the scroll-triggered draw
 * does, and that lives one level up in `annotate.tsx`.
 *
 * That split is the whole point of this file. The marks used to be client-only,
 * which made them unrenderable anywhere a Server Action returns JSX, so the
 * admin's MDX preview grew a set of hand-written imitations: a second palette,
 * a second colour resolver, and `underline decoration-2` standing in for a
 * hand-drawn path. Two sources of truth for one visual language, guaranteed to
 * drift. Now both the animated marks and the static ones render from these.
 */

/** The palette, by name. Anything else is passed through as raw CSS. */
export const TOKENS = [
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

export type MarkProps = {
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

export const WEIGHTS = { thin: 1.5, regular: 2.5, bold: 4 } as const;
export const SPEEDS = { quick: 0.6, normal: 1, slow: 1.7 } as const;

/**
 * A token becomes a CSS variable; anything else is handed to CSS untouched.
 *
 * Returning undefined for "no colour given" is what preserves the original
 * behaviour: the default className carries the colour, and no inline style
 * overrides it.
 */
export function resolveColor(color?: MarkColor): string | undefined {
  if (!color) return undefined;
  return (TOKENS as readonly string[]).includes(color)
    ? `var(--${color})`
    : color;
}

/**
 * Every stroke mark, as data.
 *
 * Four marks that differ only in a path, a viewBox, some positioning and a
 * duration have no business being four near-identical components.
 */
export const STROKES = {
  underline: {
    viewBox: "0 0 300 12",
    d: "M3 8C58 3 118 10 178 6c40-3 80-1 119 2",
    ms: 1150,
    color: "text-blue/80",
    wrapper: "relative inline-block",
    svg: "pointer-events-none absolute -bottom-1 left-0 h-[0.5em] w-full overflow-visible",
  },
  circle: {
    viewBox: "0 0 300 120",
    d: "M155 9C82 6 16 28 13 60c-3 33 70 53 142 51 78-2 135-26 132-55C296 30 224 12 150 11",
    ms: 1600,
    color: "text-violet/80",
    wrapper: "relative inline-block px-[0.35em] py-[0.15em]",
    svg: "pointer-events-none absolute inset-0 h-full w-full overflow-visible",
  },
  box: {
    viewBox: "0 0 300 100",
    d: "M9 13C88 8 214 7 292 13c4 26 3 49-1 74-79 6-206 7-284 1C3 62 4 39 9 13Z",
    ms: 1700,
    color: "text-lime",
    wrapper: "relative inline-block px-[0.4em] py-[0.18em]",
    svg: "pointer-events-none absolute inset-0 h-full w-full overflow-visible",
    join: true,
  },
  strike: {
    viewBox: "0 0 300 10",
    d: "M4 6c60-3 130 2 190-1 40-2 70 1 102 2",
    ms: 900,
    color: "text-subtle",
    wrapper: "relative inline-block",
    svg: "pointer-events-none absolute left-0 top-1/2 h-[0.4em] w-full -translate-y-1/2 overflow-visible",
  },
} as const;

export type StrokeKind = keyof typeof STROKES;

/**
 * One stroke mark, drawn or not.
 *
 * The path is normalised to `pathLength={1}`, so a single dash of length 1
 * covers the whole stroke whatever its real geometry, and animating the offset
 * from 1 to 0 draws it end to end. That is why four very different paths share
 * one implementation.
 *
 * `drawn` is passed in rather than observed here, which is what keeps this
 * renderable on the server: the animated version watches the viewport, the
 * static version simply says true.
 */
export function StrokeMark({
  kind,
  drawn,
  children,
  color,
  weight = "regular",
  speed = "normal",
  delay = 0,
  className,
  ref,
}: MarkProps & {
  kind: StrokeKind;
  drawn: boolean;
  ref?: Ref<HTMLSpanElement>;
}) {
  const mark = STROKES[kind];

  const style: CSSProperties = {
    strokeDasharray: 1,
    strokeDashoffset: drawn ? 0 : 1,
    transition: `stroke-dashoffset ${Math.round(mark.ms * SPEEDS[speed])}ms cubic-bezier(0.65, 0, 0.35, 1) ${delay}ms`,
  };

  return (
    <span ref={ref} className={mark.wrapper}>
      {children}
      <svg
        className={`${mark.svg} ${className ?? mark.color}`}
        style={{ color: resolveColor(color) }}
        viewBox={mark.viewBox}
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d={mark.d}
          stroke="currentColor"
          strokeWidth={WEIGHTS[weight]}
          strokeLinecap="round"
          {...("join" in mark && mark.join
            ? { strokeLinejoin: "round" as const }
            : {})}
          pathLength={1}
          style={style}
        />
      </svg>
    </span>
  );
}

export type HighlightProps = Omit<MarkProps, "weight"> & {
  /** How much of the colour shows through. Default 0.4. */
  opacity?: number;
  /** "text" hugs the words; "line" covers the whole line box. */
  height?: "text" | "line";
  /** Degrees of tilt, the way a real marker never lands square. */
  tilt?: number;
};

/**
 * The highlight, drawn or not.
 *
 * A filled band rather than a stroke, so `weight` means nothing to it. The
 * colour goes through `color-mix` rather than a flat fill for two reasons: a
 * highlighter that hides the words underneath is not a highlighter, and mixing
 * means a token, a hex and an `rgb()` string all behave the same way.
 */
export function HighlightMark({
  drawn,
  children,
  color,
  opacity = 0.4,
  height = "text",
  tilt = -1,
  speed = "normal",
  delay = 0,
  className = "bg-sun/40",
  ref,
}: HighlightProps & { drawn: boolean; ref?: Ref<HTMLSpanElement> }) {
  const resolved = resolveColor(color);

  return (
    <span ref={ref} className="relative inline-block">
      <span
        aria-hidden="true"
        className={`absolute inset-x-[-0.15em] origin-left rounded-[0.2em] ${
          height === "line" ? "inset-y-0" : "bottom-[0.05em] top-[0.4em]"
        } ${resolved ? "" : className}`}
        style={{
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

export type BoldProps = Omit<MarkProps, "weight"> & {
  /** How heavy the text gets. Default "bold". */
  weight?: "semibold" | "bold" | "black";
};

const FONT_WEIGHTS = { semibold: 600, bold: 700, black: 900 } as const;

/**
 * Emphasis that arrives in colour, drawn or not.
 *
 * The other marks draw *around* the words. This one colours the words
 * themselves, sweeping left to right the way a pen would if you went over a
 * phrase to make it stand out.
 *
 * The sweep is a two-stop gradient clipped to the glyphs: it starts showing the
 * inherited text colour and slides to show the mark colour, so nothing flashes
 * and the text is legible at every frame, including before the animation runs
 * and in browsers that never run it.
 *
 * Unlike the stroke marks this one has a colour by default rather than
 * inheriting one, because emphasis with no colour is just bold text and there
 * is already a way to write that.
 */
export function BoldMark({
  drawn,
  children,
  color = "accent",
  weight = "bold",
  speed = "normal",
  delay = 0,
  className = "",
  ref,
}: BoldProps & { drawn: boolean; ref?: Ref<HTMLSpanElement> }) {
  const resolved = resolveColor(color) ?? "currentColor";

  return (
    <span
      ref={ref}
      className={`relative inline-block font-semibold ${className}`}
      style={{
        fontWeight: FONT_WEIGHTS[weight],
        // Two stops, one width of text each, slid across a double-width box.
        backgroundImage: `linear-gradient(to right, ${resolved} 0 50%, currentColor 50% 100%)`,
        backgroundSize: "200% 100%",
        backgroundPosition: drawn ? "left center" : "right center",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
        // Selection and forced-colours modes ignore background-clip, so the
        // text falls back to a real colour rather than disappearing.
        WebkitTextFillColor: "transparent",
        transition: `background-position ${Math.round(700 * SPEEDS[speed])}ms cubic-bezier(0.65, 0, 0.35, 1) ${delay}ms`,
      }}
    >
      {children}
    </span>
  );
}
