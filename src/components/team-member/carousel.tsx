"use client";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowRightIcon } from "@/components/icons";

/*
 * A carousel for a row of cards, built on Embla (headless, 7 KB).
 *
 * No scrollbar: the track is clipped and moved with a transform. Previous and
 * next arrows sit above the track and disable at the ends; dots below show
 * which page you are on and jump to it. Drag or swipe on touch, arrow keys
 * when the track has focus. Readers who ask for reduced motion get an instant
 * jump instead of a slide.
 */
export function Carousel({
  items,
  itemClassName = "flex-[0_0_18rem] sm:flex-[0_0_22rem]",
  label,
}: {
  items: { key: string; node: ReactNode }[];
  /** Flex basis of one card; the next card peeks in from the right. */
  itemClassName?: string;
  /** Accessible name for the region. */
  label: string;
}) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const [viewportRef, embla] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    skipSnaps: false,
    duration: reduced ? 0 : 22,
  });

  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [snaps, setSnaps] = useState<number[]>([]);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!embla) return;
    const sync = () => {
      setCanPrev(embla.canScrollPrev());
      setCanNext(embla.canScrollNext());
      setSnaps(embla.scrollSnapList());
      setSelected(embla.selectedScrollSnap());
    };
    sync();
    embla.on("select", sync).on("reInit", sync);
    return () => {
      embla.off("select", sync).off("reInit", sync);
    };
  }, [embla]);

  const prev = useCallback(() => embla?.scrollPrev(), [embla]);
  const next = useCallback(() => embla?.scrollNext(), [embla]);
  const scrollable = snaps.length > 1;

  return (
    <section aria-label={label} className="-mx-6 lg:-mx-10">
      <div
        ref={viewportRef}
        tabIndex={scrollable ? 0 : -1}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") prev();
          if (e.key === "ArrowRight") next();
        }}
        className="overflow-hidden px-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent lg:px-10"
      >
        <ul className="flex touch-pan-y gap-4">
          {items.map((item) => (
            <li key={item.key} className={`min-w-0 ${itemClassName}`}>
              {item.node}
            </li>
          ))}
        </ul>
      </div>

      {scrollable ? (
        <div className="mt-5 flex items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-2" role="tablist" aria-label={`${label} pages`}>
            {snaps.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === selected}
                aria-label={`Page ${i + 1} of ${snaps.length}`}
                onClick={() => embla?.scrollTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === selected ? "w-6 bg-foreground" : "w-2 bg-border hover:bg-subtle"
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prev}
              disabled={!canPrev}
              aria-label="Previous"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-soft transition-colors hover:border-foreground/40 disabled:cursor-default disabled:opacity-30 disabled:hover:border-border"
            >
              <ArrowRightIcon className="h-4 w-4 rotate-180" />
            </button>
            <button
              type="button"
              onClick={next}
              disabled={!canNext}
              aria-label="Next"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-soft transition-colors hover:border-foreground/40 disabled:cursor-default disabled:opacity-30 disabled:hover:border-border"
            >
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
