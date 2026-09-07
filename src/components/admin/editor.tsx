"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveAction, type EditorState } from "@/app/admin/save";
import { AREA, LABEL } from "@/components/admin/ui";
import { PreviewPane } from "@/components/admin/preview-pane";
import { MarkToolbar } from "@/components/admin/mark-toolbar";
import { StatusControl, type Status } from "@/components/admin/status-control";

type Initial = {
  title: string;
  summary: string;
  body: string;
  status: "draft" | "published" | "archived";
};

const initialState: EditorState = { ok: null };

type Pane = "preview" | "details" | "history" | "off";

/**
 * The whole window: one bar, then two panes to the bottom of the screen.
 *
 * Everything that is not the prose lives in the bar. Title, status, save and
 * the marks were previously spread across a page header, a labelled field
 * block and a footer, which between them took roughly a third of the viewport
 * before the first line of text.
 *
 * The right pane carries three things behind tabs rather than three places on
 * the page: the rendered preview, the summary field, and the revision history.
 * All stay mounted; switching is a `hidden` attribute, so the history is not
 * re-queried and a half-written summary is never thrown away.
 *
 * A textarea, not a rich-text editor. We write MDX, and the marks and code
 * fences are the point; a WYSIWYG would quietly lose them.
 */
export function Editor({
  id,
  initial,
  collection,
  revisions,
  details,
  back,
  readOnly = false,
}: {
  id: string;
  initial: Initial;
  collection: "thread" | "channel" | "notebook_section";
  /** Server-rendered and handed in, so switching tabs costs no query. */
  revisions: React.ReactNode;
  /** Slug, timestamps and the live link. Facts, not controls. */
  details: React.ReactNode;
  back: React.ReactNode;
  readOnly?: boolean;
}) {
  const [state, submit, pending] = useActionState(saveAction, initialState);
  const [dirty, setDirty] = useState(false);
  const [body, setBody] = useState(initial.body);
  const [pane, setPane] = useState<Pane>("preview");
  const [status, setStatus] = useState<Status>(initial.status);
  const form = useRef<HTMLFormElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Derived, not stored. A second piece of state for something computable from
  // the first is a second thing that can be wrong.
  const words = body.trim().split(/\s+/).filter(Boolean).length;

  /**
   * Submitting clears the dirty flag.
   *
   * Clearing it when `state.ok` turns true would have to run in an effect,
   * which is the `set-state-in-effect` rule the React Compiler enforces, and it
   * left a hole: with `dirty` still set the success line could never render, so
   * a successful save gave no feedback at all.
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

  const tab = (value: Exclude<Pane, "off">, label: string) => (
    <button
      key={value}
      type="button"
      onClick={() => setPane(value)}
      aria-pressed={pane === value}
      className={`rounded px-1 font-mono text-[0.65rem] uppercase tracking-[0.16em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${
        pane === value ? "text-foreground" : "text-subtle hover:text-muted"
      }`}
    >
      {label}
    </button>
  );

  return (
    <form
      ref={form}
      action={action}
      onChange={() => setDirty(true)}
      className="flex h-full min-h-0 flex-col"
    >
      <input type="hidden" name="id" value={id} />

      {/* One bar. Everything that is not the prose. */}
      <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-border px-4 py-2">
        {back}

        <input
          name="title"
          defaultValue={initial.title}
          disabled={readOnly}
          required
          aria-label="Title"
          className="min-w-40 flex-1 rounded border-0 bg-transparent px-0 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-foreground/15 disabled:opacity-60"
        />

        <MarkToolbar textarea={bodyRef} disabled={readOnly} />

        <span className="font-mono text-[0.65rem] tabular-nums text-subtle">
          {words.toLocaleString("en-GB")}w
        </span>

        {/* The real value, since the visible select is presentational and the
            form is what gets submitted. */}
        <input type="hidden" name="status" value={status} />

        <StatusControl value={status} onChange={setStatus} disabled={readOnly}>
          <button
            type="submit"
            disabled={pending || readOnly}
            className="-ml-px inline-flex items-center rounded-r-xl border border-foreground bg-foreground px-4 text-xs font-semibold text-background transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save"}
          </button>
        </StatusControl>

        {/* The only feedback a save gives, so it is announced. A failure
            carries the MDX compiler's own message, which names a line. */}
        <p
          aria-live="polite"
          className="min-w-0 flex-1 truncate text-xs"
          title={state.ok === false ? state.error : undefined}
        >
          {dirty ? (
            <span className="text-subtle">Unsaved</span>
          ) : state.ok === true ? (
            <span className="text-muted">Saved</span>
          ) : state.ok === false ? (
            <span className="text-coral">{state.error}</span>
          ) : null}
        </p>

        <span className="flex items-baseline gap-1">
          {tab("preview", "preview")}
          {tab("details", "details")}
          {tab("history", "history")}
          <button
            type="button"
            onClick={() => setPane((p) => (p === "off" ? "preview" : "off"))}
            className="rounded px-1 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-subtle transition-colors hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            {pane === "off" ? "split" : "wide"}
          </button>
        </span>
      </header>

      {/* Two panes to the bottom of the window. Each scrolls itself; nothing
          else on the page scrolls at all. */}
      <div
        className={`grid min-h-0 flex-1 ${pane === "off" ? "" : "lg:grid-cols-2"}`}
      >
        <textarea
          ref={bodyRef}
          name="body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          disabled={readOnly}
          spellCheck={false}
          aria-label="Body, in MDX"
          // No card, no radius, no margin: the writing surface runs to the
          // edges of its half of the window. `resize-none` because the height
          // is the window's, not the content's.
          className="min-h-0 w-full resize-none border-0 bg-card px-5 py-4 font-mono text-[13px] leading-relaxed text-foreground outline-none focus-visible:ring-0 disabled:opacity-60"
        />

        {pane === "off" ? null : (
          <div className="flex min-h-0 flex-col border-l border-border">
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4" hidden={pane !== "preview"}>
              <PreviewPane source={body} collection={collection} />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4" hidden={pane !== "details"}>
              <label className="grid gap-1.5">
                <span className={LABEL}>Summary</span>
                <textarea
                  name="summary"
                  defaultValue={initial.summary}
                  disabled={readOnly}
                  rows={3}
                  className={`${AREA} w-full resize-y`}
                />
              </label>

              <div className="mt-6">{details}</div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4" hidden={pane !== "history"}>
              {revisions}
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
