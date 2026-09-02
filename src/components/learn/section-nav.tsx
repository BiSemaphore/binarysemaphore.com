import Link from "next/link";
import type { SectionEntry } from "@/lib/learn/book";

/**
 * The book's contents, beside the section you are reading.
 *
 * A notebook is read a section at a time, so without this the only way to reach
 * the next part is to go back to the notebook page. Grouped by part, because
 * that is how the books are organised and 55 flat entries is not a list anyone
 * reads.
 *
 * Hidden on narrow screens by its parent: there, prev/next at the foot of the
 * section is the right affordance.
 */
export function SectionNav({
  sections,
  current,
  base,
  slug,
}: {
  sections: SectionEntry[];
  current: string;
  base: string;
  slug: string;
}) {
  // Group consecutive sections by part, keeping reading order.
  const groups: { part: string; title: string; items: SectionEntry[] }[] = [];
  for (const section of sections) {
    const last = groups.at(-1);
    if (last && last.part === section.part) last.items.push(section);
    else
      groups.push({
        part: section.part,
        title: section.partTitle,
        items: [section],
      });
  }

  return (
    <nav aria-label="Contents" className="text-sm">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-subtle">
        Contents
      </p>

      <div className="mt-4 max-h-[calc(100vh-9rem)] overflow-y-auto pr-2">
        {groups.map((group, i) => (
          <div key={`${group.part}-${i}`} className="mb-5">
            {group.title ? (
              <p className="mb-1.5 font-mono text-[0.6rem] uppercase leading-[1.5] tracking-[0.14em] text-subtle/80">
                {group.part ? `${group.part} · ` : ""}
                {group.title}
              </p>
            ) : null}

            <ul className="space-y-0.5">
              {group.items.map((section) => {
                const active = section.slug === current;
                return (
                  <li key={section.slug}>
                    <Link
                      href={`${base}/${slug}/${section.slug}`}
                      aria-current={active ? "page" : undefined}
                      className={`flex gap-2 rounded py-1 text-[13px] leading-5 transition-colors ${
                        active
                          ? "font-medium text-accent-strong"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      {section.number ? (
                        <span className="w-5 shrink-0 font-mono text-[11px] text-subtle">
                          {section.number}
                        </span>
                      ) : (
                        <span aria-hidden className="w-5 shrink-0" />
                      )}
                      <span>{section.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
