"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveAction, type EditorState } from "@/app/admin/save";
import { INPUT, AREA, LABEL, BUTTON, CONTROL_H } from "@/components/admin/ui";
import { Select } from "@/components/select";

type Initial = {
  title: string;
  summary: string;
  body: string;
  status: "draft" | "published" | "archived";
};

const initialState: EditorState = { ok: null };

/**
 * A textarea, not a rich-text editor.
 *
 * We write MDX, and the marks and code fences are the point: `<Underline>` and
 * a fenced block have no equivalent in a WYSIWYG that would not quietly lose
 * them. The tradeoff is that the writer must know MDX, which we do.
 *
 * Three things this has that the first version did not, all of them about not
 * losing work:
 *
 * - **Cmd/Ctrl+S saves.** Anyone editing prose will press it out of habit, and
 *   the browser's own "save page" dialog is a useless answer to that reflex.
 * - **Leaving with unsaved changes warns.** A save is a network round trip, and
 *   before this a stray back gesture silently discarded an hour.
 * - **The action bar is sticky.** The Save button used to sit below a 3000-word
 *   body, so saving meant scrolling to the bottom of what you were reading.
 */
export function Editor({
  id,
  initial,
  readOnly = false,
}: {
  id: string;
  initial: Initial;
  readOnly?: boolean;
}) {
  const [state, submit, pending] = useActionState(saveAction, initialState);
  const [dirty, setDirty] = useState(false);
  const [words, setWords] = useState(
    () => initial.body.trim().split(/\s+/).filter(Boolean).length,
  );
  const form = useRef<HTMLFormElement>(null);

  /**
   * Submitting clears the dirty flag.
   *
   * Doing it here rather than after the response is deliberate. The obvious
   * alternative, clearing it when `state.ok` turns true, has to run in an
   * effect, which is the `set-state-in-effect` rule the React Compiler
   * enforces. And it left a hole: with `dirty` still set, the success line
   * ("Saved") could never render, so a successful save gave no feedback at all.
   *
   * A failed save shows the compiler's error instead, which is louder than
   * "unsaved changes" would have been.
   */
  function action(formData: FormData) {
    setDirty(false);
    return submit(formData);
  }

  useEffect(() => {
    if (readOnly) return;

    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        form.current?.requestSubmit();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [readOnly]);

  useEffect(() => {
    if (!dirty) return;

    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
    }

    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  return (
    <form
      ref={form}
      action={action}
      onChange={() => setDirty(true)}
      className="mt-6"
    >
      <input type="hidden" name="id" value={id} />

      <div className="grid gap-5">
        <label className="grid gap-1.5">
          <span className={LABEL}>Title</span>
          <input
            name="title"
            defaultValue={initial.title}
            disabled={readOnly}
            required
            className={`${INPUT} w-full max-w-2xl`}
          />
        </label>

        <label className="grid gap-1.5">
          <span className={LABEL}>Summary</span>
          <textarea
            name="summary"
            defaultValue={initial.summary}
            disabled={readOnly}
            rows={2}
            className={`${AREA} w-full max-w-2xl resize-y`}
          />
        </label>

        <label className="grid gap-1.5">
          <span className="flex items-baseline justify-between gap-4">
            <span className={LABEL}>Body (MDX)</span>
            <span className="font-mono text-[0.65rem] tabular-nums text-subtle">
              {words.toLocaleString("en-GB")} words
            </span>
          </span>
          {/*
            `field-sizing: content` grows the box with the prose, so a long
            body is not read through a small window inside a scrolling page.
            Where it is unsupported the rows attribute still applies, which is
            the previous behaviour rather than a broken one.
          */}
          <textarea
            name="body"
            defaultValue={initial.body}
            disabled={readOnly}
            rows={24}
            spellCheck={false}
            onChange={(event) =>
              setWords(
                event.target.value.trim().split(/\s+/).filter(Boolean).length,
              )
            }
            style={{ fieldSizing: "content" } as React.CSSProperties}
            className={`${AREA} min-h-[28rem] w-full font-mono text-[13px] leading-relaxed`}
          />
        </label>
      </div>

      {/*
        Sticky at the bottom of the viewport: the one control you need is always
        one click away, however far down the prose you are.
      */}
      <div className="sticky bottom-0 z-10 -mx-1 mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-border bg-background/95 px-1 py-3 backdrop-blur">
        <label className="flex items-center gap-2">
          <span className={LABEL}>Status</span>
          <Select
            name="status"
            defaultValue={initial.status}
            disabled={readOnly}
            className={CONTROL_H}
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </Select>
        </label>

        <button type="submit" disabled={pending || readOnly} className={BUTTON}>
          {pending ? "Saving…" : "Save"}
        </button>

        <span className="font-mono text-[0.65rem] text-subtle">⌘S</span>

        {/*
          The only feedback this form gives, so it is announced. A failed save
          carries the MDX compiler's own message, which names a line.
        */}
        <p aria-live="polite" className="min-w-0 flex-1 text-sm">
          {dirty ? (
            <span className="text-subtle">Unsaved changes</span>
          ) : state.ok === true ? (
            <span className="text-muted">Saved. The cache was cleared.</span>
          ) : state.ok === false ? (
            <span className="text-coral">{state.error}</span>
          ) : null}
        </p>
      </div>
    </form>
  );
}
