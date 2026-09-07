"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveAction, type EditorState } from "@/app/admin/save";
import { INPUT, AREA, LABEL, BUTTON, CONTROL_H } from "@/components/admin/ui";
import { Select } from "@/components/select";
import { PreviewPane } from "@/components/admin/preview-pane";
import { MarkToolbar } from "@/components/admin/mark-toolbar";

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
  collection,
  revisions,
  readOnly = false,
}: {
  id: string;
  initial: Initial;
  collection: "thread" | "channel" | "notebook_section";
  /**
   * Rendered on the server and handed in, so switching to it costs nothing and
   * this component never has to fetch. Toggled with CSS rather than unmounted,
   * so the history is not re-queried every time you glance at it.
   */
  revisions: React.ReactNode;
  readOnly?: boolean;
}) {
  const [state, submit, pending] = useActionState(saveAction, initialState);
  const [dirty, setDirty] = useState(false);
  const [body, setBody] = useState(initial.body);
  const [pane, setPane] = useState<"preview" | "history" | "off">("preview");

  // Derived, not stored. A second piece of state for something computable from
  // the first is a second thing that can be wrong.
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const form = useRef<HTMLFormElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

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
      // flex-1, not h-full. As a flex child of the page column, `h-full`
      // resolves against a parent whose height this element also contributes
      // to, and the form collapsed to 24px with every pane inside it at zero.
      // Claiming the leftover space is what was meant.
      className="flex min-h-0 flex-1 flex-col"
    >
      <input type="hidden" name="id" value={id} />

      <div className="grid shrink-0 gap-4 pb-5">
        <label className="grid gap-1.5">
          <span className={LABEL}>Title</span>
          <input
            name="title"
            defaultValue={initial.title}
            disabled={readOnly}
            required
            className={`${INPUT} w-full max-w-3xl`}
          />
        </label>

        <label className="grid gap-1.5">
          <span className={LABEL}>Summary</span>
          <textarea
            name="summary"
            defaultValue={initial.summary}
            disabled={readOnly}
            rows={2}
            className={`${AREA} w-full max-w-3xl resize-none`}
          />
        </label>
      </div>

      {/*
        The two panes. Each scrolls itself; the page does not.
      */}
      <div
        className={`grid min-h-0 flex-1 gap-6 ${
          pane === "off" ? "" : "lg:grid-cols-2"
        }`}
      >
        <label className="flex min-h-0 flex-col gap-1.5">
          <span className="flex shrink-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className={LABEL}>Body (MDX)</span>
              <MarkToolbar textarea={bodyRef} disabled={readOnly} />
            </span>
            <span className="font-mono text-[0.65rem] tabular-nums text-subtle">
              {words.toLocaleString("en-GB")} words
            </span>
          </span>

          {/*
            `resize-none` and a real height, not `field-sizing: content`. A box
            that grows with the prose is right on a scrolling page and wrong
            here: it would push the action bar off the bottom of a shell that
            cannot scroll.
          */}
          <textarea
            ref={bodyRef}
            name="body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            disabled={readOnly}
            spellCheck={false}
            className={`${AREA} min-h-0 w-full flex-1 resize-none font-mono text-[13px] leading-relaxed`}
          />
        </label>

        {pane === "off" ? null : (
          <div className="flex min-h-0 flex-col gap-1.5">
            <span className="flex shrink-0 items-baseline gap-4">
              {(["preview", "history"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setPane(tab)}
                  aria-pressed={pane === tab}
                  className={`rounded font-mono text-[0.65rem] uppercase tracking-[0.16em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${
                    pane === tab
                      ? "text-foreground"
                      : "text-subtle hover:text-muted"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </span>

            {/*
              Both panes stay mounted. The history is a server-rendered tree
              handed in as a prop, and unmounting it to switch tabs would throw
              away a query for nothing.
            */}
            <div
              className="min-h-0 flex-1 overflow-y-auto"
              hidden={pane !== "preview"}
            >
              <PreviewPane source={body} collection={collection} />
            </div>
            <div
              className="min-h-0 flex-1 overflow-y-auto"
              hidden={pane !== "history"}
            >
              {revisions}
            </div>
          </div>
        )}
      </div>

      {/*
        Sticky at the bottom of the viewport: the one control you need is always
        one click away, however far down the prose you are.
      */}
      <div className="z-10 flex shrink-0 flex-wrap items-center gap-x-4 gap-y-3 border-t border-border bg-background px-1 py-3">
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

        <button
          type="button"
          onClick={() => setPane((p) => (p === "off" ? "preview" : "off"))}
          className="rounded font-mono text-[0.65rem] text-subtle underline decoration-border underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          {pane === "off" ? "show preview" : "full width"}
        </button>

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
