"use client";

import type { SectionEntry } from "@/lib/learn/book";
import { useActiveSection } from "@/components/learn/active-section";

/**
 * What the section you are reading points at.
 *
 * The books are deliberately cross-referential: 370 places say "as in section
 * 26" or "see Notebook 02". Those are links in the prose now, and this puts the
 * same targets in the margin by title, so you can see where a section leans
 * without breaking off to look.
 *
 * Renders nothing for a section that references nothing, which is most of them.
 * An empty rail is better than a rail full of filler.
 */
export function ReferencedRail({
  sections,
  notebookTitles,
  base,
}: {
  sections: SectionEntry[];
  /** Notebook slug -> title, for cross-book references. */
  notebookTitles: Record<string, string>;
  base: string;
}) {
  const active = useActiveSection();
  const current = sections.find((s) => s.slug === active);
  // Only references to sections that are actually on this page. A signed-out
  // reader has the first few sections, and the books point forward constantly,
  // so without this the rail offers links to anchors that do not exist and
  // renders a heading over an empty list.
  const onPage = new Set(sections.map((s) => s.slug));
  const reachable = (ref: string) =>
    ref.startsWith("n:") || onPage.has(ref.slice(2));

  const refs = (current?.refs ?? []).filter(reachable);
  const backrefs = (current?.backrefs ?? []).filter((b) => onPage.has(b));
  if (refs.length === 0 && backrefs.length === 0) return null;

  const byTitle = new Map(sections.map((s) => [s.slug, s]));

  const link = (slug: string) => {
    const section = byTitle.get(slug);
    if (!section) return null;
    return (
      <li key={slug}>
        <a
          href={`#${slug}`}
          className="flex gap-2 text-[13px] leading-5 text-muted transition-colors hover:text-foreground"
        >
          <span className="w-5 shrink-0 font-mono text-[11px] text-subtle">
            {section.number}
          </span>
          <span>{section.title}</span>
        </a>
      </li>
    );
  };

  return (
    <aside aria-label="References" className="space-y-7 text-sm">
      {refs.length > 0 ? (
        <div>
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-subtle">
        Points at
      </p>

      <ul className="mt-4 space-y-3">
        {refs.map((ref) => {
          const [kind, target] = [ref.slice(0, 1), ref.slice(2)];

          if (kind === "s") return link(target);

          const title = notebookTitles[target];
          if (!title) return null;
          return (
            <li key={ref}>
              <a
                href={`${base}/${target}`}
                className="block text-[13px] leading-5 text-muted transition-colors hover:text-foreground"
              >
                <span className="block font-mono text-[0.6rem] uppercase tracking-[0.14em] text-subtle">
                  Another notebook
                </span>
                {title}
              </a>
            </li>
          );
        })}
      </ul>
        </div>
      ) : null}

      {backrefs.length > 0 ? (
        <div>
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-subtle">
            Referenced by
          </p>
          <ul className="mt-4 space-y-3">{backrefs.map(link)}</ul>
        </div>
      ) : null}
    </aside>
  );
}
