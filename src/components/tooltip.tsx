"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

export type TooltipSide = "top" | "right" | "bottom" | "left";

/** Distance from the trigger to the bubble, and the margin kept from the edge. */
const OFFSET = 10;
const EDGE = 8;

type Placement = { top: number; left: number; side: TooltipSide };

/**
 * A tooltip for anywhere on the site.
 *
 * **Portalled to `document.body` on purpose.** Two things break the obvious
 * implementations, and both exist in this codebase already: an absolutely
 * positioned bubble is clipped by any scrolling ancestor (the topic rail is
 * `overflow-y-auto`), and `position: fixed` resolves against the nearest
 * *transformed* ancestor rather than the viewport (the topic drawer carries a
 * translate). A portal escapes both, so this works wherever it is dropped.
 *
 * It flips rather than overflowing: if the preferred side would put the bubble
 * off-screen it uses the opposite one, then clamps along the other axis. A
 * tooltip half off the edge is worse than one on the wrong side.
 *
 * The label normally repeats an accessible name the trigger already has, so the
 * bubble is `aria-hidden` and does not announce twice. When the trigger has no
 * other name, give it one; a tooltip is not an accessible name.
 */
export function Tooltip({
  label,
  children,
  side = "top",
  delay = 250,
  onlyWhenTruncated = false,
  className = "",
}: {
  label: string;
  children: ReactNode;
  side?: TooltipSide;
  /** Milliseconds before it appears. 0 shows immediately. */
  delay?: number;
  /** Only show when the child marked `data-truncate` is actually ellipsised. */
  onlyWhenTruncated?: boolean;
  className?: string;
}) {
  const [placement, setPlacement] = useState<Placement | null>(null);
  const anchor = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const bubble = useRef<HTMLSpanElement>(null);

  const hide = useCallback(() => {
    window.clearTimeout(timer.current);
    setPlacement(null);
  }, []);

  const place = useCallback(() => {
    const el = anchor.current;
    if (!el) return;

    // Measure the child, not the wrapper: the wrapper is `display: contents` so
    // it adds no box to the layout, and a boxless element reports a zero rect.
    const target = (el.firstElementChild as HTMLElement | null) ?? el;

    if (onlyWhenTruncated) {
      const inner = target.querySelector<HTMLElement>("[data-truncate]");
      // `scrollWidth > clientWidth` is the only reliable read of "this text is
      // ellipsised". There is no CSS or DOM flag for it.
      if (!inner || inner.scrollWidth <= inner.clientWidth) return;
    }

    const r = target.getBoundingClientRect();
    // The bubble is not in the DOM yet on first open, so estimate from the text
    // and correct after mount. Roughly 7.2px per character at 0.8rem mono.
    const w = bubble.current?.offsetWidth ?? label.length * 7.2 + 24;
    const h = bubble.current?.offsetHeight ?? 32;

    const fits: Record<TooltipSide, boolean> = {
      top: r.top - h - OFFSET > EDGE,
      bottom: r.bottom + h + OFFSET < window.innerHeight - EDGE,
      left: r.left - w - OFFSET > EDGE,
      right: r.right + w + OFFSET < window.innerWidth - EDGE,
    };
    const opposite: Record<TooltipSide, TooltipSide> = {
      top: "bottom",
      bottom: "top",
      left: "right",
      right: "left",
    };
    const chosen = fits[side]
      ? side
      : fits[opposite[side]]
        ? opposite[side]
        : side;

    const clamp = (v: number, min: number, max: number) =>
      Math.min(Math.max(v, min), max);

    const next: Placement =
      chosen === "top" || chosen === "bottom"
        ? {
            side: chosen,
            top: chosen === "top" ? r.top - OFFSET : r.bottom + OFFSET,
            left: clamp(
              r.left + r.width / 2,
              EDGE + w / 2,
              window.innerWidth - EDGE - w / 2,
            ),
          }
        : {
            side: chosen,
            top: clamp(
              r.top + r.height / 2,
              EDGE + h / 2,
              window.innerHeight - EDGE - h / 2,
            ),
            left: chosen === "left" ? r.left - OFFSET : r.right + OFFSET,
          };

    setPlacement(next);
  }, [label.length, onlyWhenTruncated, side]);

  const show = useCallback(() => {
    window.clearTimeout(timer.current);
    if (delay <= 0) {
      place();
      return;
    }
    timer.current = window.setTimeout(place, delay);
  }, [delay, place]);

  // Dismiss on Escape and on any scroll: a bubble pinned over content that has
  // moved is worse than no bubble. Bound only while open.
  useEffect(() => {
    if (!placement) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide();
    };
    window.addEventListener("scroll", hide, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [placement, hide]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <>
      <span
        ref={anchor}
        className="contents"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        // A tooltip on touch fires on tap and then sits there. Suppress it and
        // let the tap do what the control is for.
        onTouchStart={hide}
      >
        {children}
      </span>

      {placement
        ? createPortal(
            <span
              ref={bubble}
              aria-hidden
              data-side={placement.side}
              style={{ top: placement.top, left: placement.left }}
              className={`tooltip pointer-events-none fixed z-[100] max-w-xs rounded-lg bg-[#111214] px-3 py-2 font-mono text-[0.8rem] font-semibold leading-tight text-white shadow-[0_8px_16px_rgba(0,0,0,0.28)] ${className}`}
            >
              {label}
            </span>,
            document.body,
          )
        : null}
    </>
  );
}
