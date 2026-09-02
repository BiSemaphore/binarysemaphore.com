"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { markReadAction } from "@/app/learn/actions";

/**
 * Which section is being read, shared by the contents on the left and the
 * references on the right.
 *
 * One IntersectionObserver rather than one per rail, so both sides always agree
 * and the page does not observe 55 sections twice.
 *
 * It also records reading progress: whatever you are looking at is what you have
 * read. Debounced, so scrolling past forty sections does not write forty rows,
 * and fire-and-forget, because losing a bookmark must never interrupt reading.
 */
/** Height of the sticky header, so a section does not land under it. */
const HEADER_OFFSET = 96;

const ActiveSection = createContext<string>("");

export function useActiveSection(): string {
  return useContext(ActiveSection);
}

export function ActiveSectionProvider({
  first,
  slug,
  entitled,
  read,
  children,
}: {
  first: string;
  slug: string;
  entitled: boolean;
  read: string[];
  children: ReactNode;
}) {
  const [active, setActive] = useState(first);
  const seen = useRef(new Set(read));
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Land on the anchor when arriving with one.
  //
  // Two things fight this. The router restores scroll to the top after
  // hydration, undoing the browser's own jump; and a book is fifty sections of
  // prose and figures, so anything above the target is still growing when a
  // single scroll would fire, leaving you short of it.
  //
  // So: scroll, then keep correcting until the position stops moving. Any real
  // scroll input abandons it, because fighting the reader would be worse than
  // missing the anchor.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;

    let cancelled = false;
    const abandon = () => {
      cancelled = true;
    };
    for (const event of ["wheel", "touchstart", "keydown"] as const) {
      window.addEventListener(event, abandon, { passive: true, once: true });
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const delay of [0, 120, 400, 900]) {
      timers.push(
        setTimeout(() => {
          if (cancelled) return;
          const target = document.getElementById(id);
          if (!target) return;
          // Absolute position rather than scrollIntoView: the section sits
          // inside a grid whose other column scrolls, and scrollIntoView walks
          // to the nearest scrollable ancestor rather than the window.
          const top =
            target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
          window.scrollTo({ top, behavior: "instant" as ScrollBehavior });
          setActive(id);
        }, delay),
      );
    }

    return () => {
      cancelled = true;
      for (const timer of timers) clearTimeout(timer);
      for (const event of ["wheel", "touchstart", "keydown"] as const) {
        window.removeEventListener(event, abandon);
      }
    };
  }, []);

  useEffect(() => {
    const nodes = document.querySelectorAll<HTMLElement>("[data-section]");
    if (nodes.length === 0) return;

    // The band is the top third of the viewport: the section you are reading is
    // the one that has passed the top, not one peeking in from the bottom.
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-10% 0px -70% 0px", threshold: 0 },
    );

    for (const node of nodes) io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!entitled || !active || seen.current.has(active)) return;

    if (pending.current) clearTimeout(pending.current);
    pending.current = setTimeout(() => {
      seen.current.add(active);
      void markReadAction(slug, active).catch(() => {});
    }, 1500);

    return () => {
      if (pending.current) clearTimeout(pending.current);
    };
  }, [active, entitled, slug]);

  return (
    <ActiveSection.Provider value={active}>{children}</ActiveSection.Provider>
  );
}
