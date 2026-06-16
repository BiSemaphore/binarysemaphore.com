"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Reveals its children with a subtle fade + rise the first time they scroll
 * into view. Pure CSS transition driven by a data attribute; the animation is
 * disabled entirely under `prefers-reduced-motion` (see globals.css).
 *
 * `className` is passed through so the wrapper can act as a grid/flex item.
 */
export function Reveal({
  children,
  className = "",
  /** Stagger delay in ms. */
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-reveal={shown ? "in" : "out"}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal ${className}`}
    >
      {children}
    </div>
  );
}
