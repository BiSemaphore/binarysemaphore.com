"use client";

import type { RefObject } from "react";

/**
 * The marks, as buttons.
 *
 * The pen annotations are the reason our prose looks like ours, and using them
 * meant remembering five component names and closing every tag by hand. Wrap
 * the selection instead.
 *
 * ## Why execCommand, which is deprecated
 *
 * Setting `textarea.value` or using `setRangeText` wipes the browser's native
 * undo stack: one Cmd+Z after an insert and the whole document reverts to what
 * it was when the page loaded. `document.execCommand("insertText")` is the only
 * way left to write into a textarea as though it were typed, so undo keeps
 * working per edit. It is deprecated and every editor still uses it, because
 * nothing replaced it.
 *
 * It also dispatches a real `input` event, so React's onChange fires and the
 * preview follows, with no synthetic dispatch needed.
 */

const MARKS = [
  { tag: "Underline", label: "underline", hint: "a pen line under the words" },
  { tag: "Circle", label: "circle", hint: "circled, for a term being named" },
  { tag: "Box", label: "box", hint: "boxed, for something to come back to" },
  { tag: "Strike", label: "strike", hint: "struck through, for a wrong idea" },
  { tag: "Highlight", label: "highlight", hint: "highlighter over the words" },
  { tag: "Bold", label: "bold", hint: "the words themselves, sweeping into colour" },
] as const;

/** Shown on hover, because the props are the part nobody would guess. */
const PROPS =
  'props: color="sun" weight="bold" speed="slow" delay={200}';

export function MarkToolbar({
  textarea,
  disabled = false,
}: {
  textarea: RefObject<HTMLTextAreaElement | null>;
  disabled?: boolean;
}) {
  function wrap(tag: string) {
    const el = textarea.current;
    if (!el) return;

    const { selectionStart: from, selectionEnd: to } = el;
    const selected = el.value.slice(from, to);

    el.focus();
    document.execCommand("insertText", false, `<${tag}>${selected}</${tag}>`);

    // With nothing selected the caret lands after the closing tag, which is
    // never where you want to type next. Put it between the tags.
    if (!selected) {
      const caret = from + tag.length + 2;
      el.setSelectionRange(caret, caret);
    }
  }

  return (
    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
      {MARKS.map((mark) => (
        <button
          key={mark.tag}
          type="button"
          disabled={disabled}
          title={`${mark.hint}\n<${mark.tag}> ${PROPS}`}
          onMouseDown={(event) => {
            // Keep the selection: focus would otherwise leave the textarea on
            // mousedown and collapse it before the click ever fires.
            event.preventDefault();
          }}
          onClick={() => wrap(mark.tag)}
          className="rounded font-mono text-[0.65rem] text-subtle transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-40"
        >
          {mark.label}
        </button>
      ))}
    </span>
  );
}
