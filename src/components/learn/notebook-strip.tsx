import Link from "next/link";
import { notebooks } from "@/lib/learn";

/**
 * The library, shown rather than counted.
 *
 * Each card carries three real entries from that notebook's table of contents.
 * The contents are deliberately public (they are the best preview there is, and
 * `src/lib/learn.ts` says so); the sections themselves stay behind the gate, so
 * nothing here leaks a word of gated prose.
 *
 * A scroll strip rather than a grid: ten cards in a grid is a wall, ten cards on
 * a rail invites a flick.
 */
export function NotebookStrip({ base }: { base: string }) {
  return (
    <div className="-mx-6 overflow-x-auto px-6 pb-4 lg:-mx-10 lg:px-10">
      <ul className="flex w-max gap-4">
        {notebooks.map((notebook) => (
          <li key={notebook.slug} className="w-[17.5rem] shrink-0">
            <Link
              href={`${base}/notebooks/${notebook.slug}`}
              className="flex h-full flex-col rounded-card border border-border bg-card p-5 transition-colors hover:border-foreground/25"
            >
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-subtle">
                {notebook.series} {notebook.number}
              </p>
              <p className="mt-2 font-display text-lg font-semibold leading-tight tracking-tight text-foreground">
                {notebook.title}
              </p>

              <ul className="mt-4 space-y-1.5 border-t border-dashed border-border pt-4">
                {notebook.contents.slice(0, 3).map((entry) => (
                  <li
                    key={entry}
                    className="truncate text-[0.8rem] leading-5 text-muted"
                  >
                    {entry}
                  </li>
                ))}
              </ul>

              <p className="mt-auto pt-4 font-hand text-lg text-accent-strong">
                {notebook.contents.length} sections, {notebook.pages} pages
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
