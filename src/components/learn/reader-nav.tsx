"use client";

import { useEffect, useRef, useState } from "react";
import type { SectionEntry } from "@/lib/learn/book";
import { markReadAction } from "@/app/learn/actions";

/**
 * The book's contents, following the scroll.
 *
 * Modelled on `src/components/table-of-contents.tsx`, but observing the
 * sections themselves rather than headings, since a notebook's structure is its
 * sections. The active entry is highlighted and kept scrolled into view, so a
 * 55-section list does not leave you hunting.
 *
 * It also records reading progress: whatever you are actually looking at is
 * what you have read. Debounced, so scrolling past forty sections does not write
 * forty rows, and fire-and-forget, because losing a bookmark must never
 * interrupt reading.
 */
export function ReaderNav({
  sections,
  read,
  slug,
  entitled,
}: {
  sections: SectionEntry[];
  read: string[];
  slug: string;
  entitled: boolean;
}) {
  const [active, setActive] = useState<string>(sections[0]?.slug ?? "");
  const [seen, setSeen] = useState<Set<string>>(() => new Set(read));
  const listRef = useRef<HTMLDivElement>(null);
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-section]"),
    );
    if (nodes.length === 0) return;

    // Top third of the viewport: the section you are reading is the one that
    // has passed the top, not the one merely peeking in from the bottom.
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const id = visible[0]?.target.id;
        if (id) setActive(id);
      },
      { rootMargin: "-10% 0px -70% 0px", threshold: 0 },
    );

    for (const node of nodes) io.observe(node);
    return () => io.disconnect();
  }, [sections]);

  // Keep the active entry visible in a long list.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[aria-current="true"]');
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  // Record what has been read, once the reader has settled on a section.
  useEffect(() => {
    if (!entitled || !active || seen.has(active)) return;

    if (pending.current) clearTimeout(pending.current);
    pending.current = setTimeout(() => {
      setSeen((prev) => new Set(prev).add(active));
      void markReadAction(slug, active).catch(() => {});
    }, 1500);

    return () => {
      if (pending.current) clearTimeout(pending.current);
    };
  }, [active, entitled, seen, slug]);

  return (
    <nav aria-label="Contents" className="text-sm">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-subtle">
        Contents
      </p>

      <div
        ref={listRef}
        className="mt-4 max-h-[calc(100vh-9rem)] overflow-y-auto pr-2"
      >
        {sections.map((section, i) => {
          const isActive = section.slug === active;
          const isRead = seen.has(section.slug);
          const newPart =
            section.partTitle && sections[i - 1]?.part !== section.part;

          return (
            <div key={section.slug}>
              {newPart ? (
                <p className="mb-1.5 mt-5 font-mono text-[0.6rem] uppercase leading-[1.5] tracking-[0.14em] text-subtle/80">
                  {section.part ? `${section.part} · ` : ""}
                  {section.partTitle}
                </p>
              ) : null}

              <a
                href={`#${section.slug}`}
                aria-current={isActive ? "true" : undefined}
                className={`flex gap-2 rounded py-1 text-[13px] leading-5 transition-colors ${
                  isActive
                    ? "font-medium text-accent-strong"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <span
                  className={`w-5 shrink-0 font-mono text-[11px] ${
                    isRead ? "text-accent-strong" : "text-subtle"
                  }`}
                >
                  {isRead ? "✓" : section.number}
                </span>
                <span>{section.title}</span>
              </a>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
