import Link from "next/link";
import { notebooks } from "@/lib/learn";

/** The four highlighters, cycled so the rail reads as a set of notes. */
const CARD_BG = [
  "bg-[#ffe0d2] dark:bg-[#4a2f26]",
  "bg-[#d6f3e6] dark:bg-[#1f4036]",
  "bg-[#d9ecff] dark:bg-[#22384d]",
  "bg-[#eddcff] dark:bg-[#38294a]",
];

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
        {notebooks.map((notebook, i) => (
          <li key={notebook.slug} className="w-[17.5rem] shrink-0">
            <Link
              href={`${base}/notebooks/${notebook.slug}`}
              className={`flex h-full flex-col rounded-card p-5 transition-transform duration-300 hover:-translate-y-1 ${CARD_BG[i % CARD_BG.length]}`}
            >
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.2em] text-foreground/45">
                {notebook.series} {notebook.number}
              </p>
              <p className="mt-2 font-display text-lg font-semibold leading-tight tracking-tight text-foreground">
                {notebook.title}
              </p>

              <ul className="mt-4 space-y-1.5 border-t border-dashed border-foreground/15 pt-4">
                {notebook.contents.slice(0, 3).map((entry) => (
                  <li
                    key={entry}
                    className="truncate text-[0.8rem] leading-5 text-foreground/70"
                  >
                    {entry}
                  </li>
                ))}
              </ul>

              <p className="mt-auto pt-4 font-hand text-lg text-foreground/70">
                {notebook.contents.length} sections, {notebook.pages} pages
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
