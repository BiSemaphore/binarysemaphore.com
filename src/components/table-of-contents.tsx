"use client";

/**
 * "On this page" navigator for a thread. Reads the rendered article's h2/h3
 * headings (which already carry ids from rehype-slug), lists them, and
 * highlights the section you're currently reading via IntersectionObserver.
 * Clicking a heading jumps to it (native anchor + the headings' scroll-mt).
 *
 * Renders nothing when there are fewer than two headings, and is hidden on
 * narrow screens by its parent (scrolling is fine there).
 */

import { useEffect, useState } from "react";

type Item = { id: string; text: string; level: 2 | 3 };

export function TableOfContents() {
  const [items, setItems] = useState<Item[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    let io: IntersectionObserver | undefined;

    // Read the rendered headings after paint so we're not calling setState
    // synchronously in the effect body, and so ids from rehype-slug exist.
    const raf = requestAnimationFrame(() => {
      const headings = Array.from(
        document.querySelectorAll<HTMLElement>(".thread h2, .thread h3"),
      ).filter((h) => h.id);

      setItems(
        headings.map((h) => ({
          id: h.id,
          text: h.textContent ?? "",
          level: h.tagName === "H3" ? 3 : 2,
        })),
      );

      if (headings.length < 2) return;

      // Track which heading is nearest the top of the viewport.
      const visible = new Map<string, number>();
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const id = (entry.target as HTMLElement).id;
            if (entry.isIntersecting) visible.set(id, entry.boundingClientRect.top);
            else visible.delete(id);
          }
          if (visible.size > 0) {
            const top = [...visible.entries()].sort((a, b) => a[1] - b[1])[0][0];
            setActiveId(top);
          }
        },
        { rootMargin: "-80px 0px -68% 0px", threshold: 0 },
      );

      headings.forEach((h) => io!.observe(h));
    });

    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
    };
  }, []);

  if (items.length < 2) return null;

  return (
    <nav aria-label="On this page">
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-subtle">
        On this page
      </p>
      <ul className="space-y-1 border-l border-border">
        {items.map((item) => {
          const active = activeId === item.id;
          return (
            <li key={item.id} className={item.level === 3 ? "pl-3" : ""}>
              <a
                href={`#${item.id}`}
                aria-current={active ? "location" : undefined}
                className={`-ml-px block border-l-2 py-1 pl-3 text-sm leading-snug transition-colors ${
                  active
                    ? "border-accent font-medium text-foreground"
                    : "border-transparent text-subtle hover:border-border hover:text-foreground"
                }`}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
