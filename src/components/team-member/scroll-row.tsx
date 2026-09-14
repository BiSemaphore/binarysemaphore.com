import type { ReactNode } from "react";

/**
 * A row of cards that scrolls sideways instead of stacking.
 *
 * Native overflow scrolling, no script: it works with a trackpad, a swipe,
 * shift plus wheel, and the keyboard, and it honours reduced motion because
 * nothing moves on its own. Scroll snap keeps a card aligned after a swipe.
 * The row bleeds past the content edge on the right so the next card peeks
 * in, which is what tells a reader there is more.
 */
export function ScrollRow({
  items,
  itemClassName = "w-[18rem] sm:w-[22rem]",
  label,
}: {
  items: { key: string; node: ReactNode }[];
  /** Width of one card; the row shows a little of the next one. */
  itemClassName?: string;
  /** Accessible name for the scrolling region. */
  label: string;
}) {
  return (
    <div className="-mx-6 lg:-mx-10">
      <ul
        role="list"
        aria-label={label}
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-6 px-6 pb-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent lg:scroll-px-10 lg:px-10 [scrollbar-width:thin]"
      >
        {items.map((item) => (
          <li key={item.key} className={`shrink-0 snap-start ${itemClassName}`}>
            {item.node}
          </li>
        ))}
      </ul>
    </div>
  );
}
