"use client";

import { useEffect, useRef } from "react";
import type { SectionEntry } from "@/lib/learn/book";
import { useActiveSection } from "@/components/learn/active-section";

/**
 * The book's contents, following the scroll.
 *
 * The active section comes from ActiveSectionProvider, which owns the one
 * observer the page needs, so this rail and the references rail always agree.
 * The active entry is kept scrolled into view: a 55-section list otherwise
 * leaves you hunting for where you are.
 */
export function ReaderNav({
  sections,
  read,
}: {
  sections: SectionEntry[];
  /** Section slugs already read, marked with a tick. */
  read: string[];
}) {
  const active = useActiveSection();
  const listRef = useRef<HTMLDivElement>(null);
  const done = new Set(read);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>('[aria-current="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

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
                    done.has(section.slug) ? "text-accent-strong" : "text-subtle"
                  }`}
                >
                  {done.has(section.slug) ? "✓" : section.number}
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
