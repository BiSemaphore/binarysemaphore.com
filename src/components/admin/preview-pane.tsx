"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { previewMdx, type Preview } from "@/app/admin/preview";

/**
 * What the prose will look like, beside what you are typing.
 *
 * MDX is not markdown: a mistyped component name or an unclosed tag is a
 * compile error, not a stray asterisk, and until now the first time you found
 * out was on save. This renders through the real pipeline on the server, so the
 * preview is the page rather than an approximation of it.
 *
 * ## Debounced, not live
 *
 * Every render is a compile plus a Shiki highlight, which is expensive enough
 * that doing it per keystroke would make typing feel heavy. 600ms after you
 * stop is fast enough to feel connected to what you typed and slow enough that
 * a sentence costs one render rather than forty.
 *
 * The previous good render stays on screen while a new one is in flight, so the
 * pane never blanks. Flashing empty between keystrokes is worse than being a
 * moment out of date.
 */
export function PreviewPane({
  source,
  collection,
}: {
  source: string;
  collection: "thread" | "channel" | "notebook_section";
}) {
  const [result, setResult] = useState<Preview | null>(null);
  const [pending, startTransition] = useTransition();

  /**
   * Which request is the current one.
   *
   * Two renders can be in flight at once, and a compile's duration depends on
   * what is being compiled: add a fenced code block and that request takes
   * longer than the one after it. Without this, the slower reply lands last and
   * the pane shows an older document than the one on the left. Clearing the
   * timeout is not enough, because the timeout only guards the gap before the
   * request, not the request itself.
   */
  const latest = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      const ticket = ++latest.current;
      startTransition(async () => {
        const next = await previewMdx(source);
        if (ticket === latest.current) setResult(next);
      });
    }, 600);

    return () => clearTimeout(timer);
  }, [source]);

  return (
    <div className="min-w-0">
      {/* No heading: the tab strip above already names this pane. */}
      <span
        aria-live="polite"
        className="block text-right font-mono text-[0.65rem] text-subtle"
      >
        {pending ? "rendering" : null}
      </span>

      {result?.ok === false ? (
        <p className="mt-1.5 rounded-xl border border-coral/40 bg-card px-4 py-3 font-mono text-xs leading-5 text-coral">
          {result.error}
        </p>
      ) : null}

      {/*
        A React tree, not an HTML string: the action returns the same
        <MdxBody> the published page renders, so this pane cannot drift from
        production and there is no dangerouslySetInnerHTML anywhere in it.
      */}
      {/*
        The same prose class the published page uses. A thread and a channel do
        not read the same: channels are set in Ubuntu Mono at a wider line
        height, threads in the sans stack. Previewing a thread in the channel's
        typography would answer the wrong question.
      */}
      <div
        className={`mt-1.5 max-w-none rounded-xl border border-border bg-card px-5 py-4 ${
          collection === "thread" ? "thread" : "thread topic-prose"
        }`}
      >
        {result?.ok ? result.node : null}
      </div>

      {result === null ? (
        <p className="mt-3 text-xs text-subtle">Rendering…</p>
      ) : null}
    </div>
  );
}
