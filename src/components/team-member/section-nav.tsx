"use client";

/**
 * Sticky "on this page" rail for a team member profile. Lists the sections
 * the page actually rendered and highlights the one nearest the top of the
 * viewport. Hidden on narrow screens by its parent, where scrolling is fine.
 */

import { useEffect, useState } from "react";

export type SectionLink = { id: string; label: string };

export function SectionNav({ items }: { items: SectionLink[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const targets = items
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => Boolean(el));

    const io = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      { rootMargin: "-96px 0px -60% 0px", threshold: 0 },
    );

    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  return (
    <nav aria-label="On this page">
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">
        On this page
      </p>
      <ol className="space-y-1 border-l border-border">
        {items.map((item, i) => {
          const isActive = item.id === active;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={isActive ? "location" : undefined}
                className={`-ml-px flex items-baseline gap-2.5 border-l-2 py-1.5 pl-4 text-sm transition-colors ${
                  isActive
                    ? "border-accent font-medium text-foreground"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                <span className="font-mono text-[11px] text-subtle">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item.label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
