"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * The bar across the top while a page is on its way.
 *
 * Every content page here is server-rendered from Postgres, so a click has a
 * real round trip behind it, and until now nothing acknowledged the click at
 * all. On a fast connection that reads as a slightly slow site; on a slow one
 * it reads as a broken button, and people click again.
 *
 * ## Why this shape
 *
 * The App Router has no router events, so this watches what it can see: a click
 * on a same-origin link starts the bar, and a change in `usePathname` ends it.
 * That covers every link on the site, including ones in MDX prose that no
 * component of ours wraps.
 *
 * `useLinkStatus` is the official per-link API, but it only reports for the one
 * `<Link>` it sits inside, so a global bar would mean wrapping every link on
 * the site and threading the state back up. Next's own guidance is to prefer
 * `loading.tsx` for route-level feedback, which we now also have; this is the
 * layer above it, for the gap between the click and the first byte.
 *
 * ## Two details that matter more than the animation
 *
 * **It waits 150ms before appearing.** A loader that flashes for an instant
 * navigation is worse than no loader: it reads as a glitch. Anything that
 * resolves faster than the eye can register never shows a bar at all.
 *
 * **It gives up after 10 seconds**, in CSS. A click that never navigates (a
 * blocked route, a failed prefetch) would otherwise leave the bar stuck near
 * the end forever, which is a worse lie than showing nothing.
 *
 * ## Why there is no "navigation finished" effect
 *
 * The obvious shape is `useEffect(() => setLoading(false), [pathname])`, and
 * the React Compiler refuses it: calling setState synchronously in an effect
 * triggers cascading renders. It is also the wrong model. "Loading" is not a
 * fact to be synchronised, it is `the path I clicked from is still the path I
 * am on`, which is derivable from the two values we already have. Ending the
 * bar is then not an event at all: the pathname changes, the expression turns
 * false, the bar goes.
 */
export function ProgressBar() {
  const pathname = usePathname();
  const [from, setFrom] = useState<string | null>(null);

  const loading = from !== null && from === pathname;

  useEffect(() => {
    function onClick(event: MouseEvent) {
      // Anything that is not a plain left click opens elsewhere or does
      // nothing, and neither is a navigation of this page.
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as HTMLElement | null)?.closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;

      // Same pathname: either nothing to wait for, or a query-string change
      // this cannot detect the end of, since it watches the path alone. Both
      // are better left without a bar than with one that never leaves.
      if (url.pathname === window.location.pathname) return;

      setFrom(window.location.pathname);
    }

    // Capture, and this is not a detail.
    //
    // React attaches its listeners at the app root, which is inside document,
    // so on the bubble phase Next's Link handler has already run and called
    // preventDefault() to take over the navigation. A listener here would see
    // `defaultPrevented` on every single link and, if it checked for that,
    // would silently never fire. Capturing runs this first, before anyone has
    // had the chance to cancel anything.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return (
    <div
      aria-hidden
      data-loading={loading ? "" : undefined}
      className="progress-bar"
    />
  );
}
