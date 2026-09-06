"use client";

import { useActionState } from "react";
import { saveAction, type EditorState } from "@/app/admin/save";

type Initial = {
  title: string;
  summary: string;
  body: string;
  status: "draft" | "published" | "archived";
};

const initialState: EditorState = { ok: null };

const field =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-subtle focus:border-foreground disabled:opacity-60";

const label =
  "font-mono text-[0.6rem] uppercase tracking-[0.18em] text-subtle";

/**
 * A textarea, not a rich-text editor.
 *
 * We write MDX, and the marks and code fences are the point: `<Underline>` and
 * a fenced block have no equivalent in a WYSIWYG that would not quietly lose
 * them. The tradeoff is that the writer must know MDX, which we do.
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
  const [state, action, pending] = useActionState(saveAction, initialState);

  return (
    <form action={action} className="mt-8 grid gap-4">
      <input type="hidden" name="id" value={id} />

      <label className="grid gap-1.5">
        <span className={label}>Title</span>
        <input
          name="title"
          defaultValue={initial.title}
          disabled={readOnly}
          required
          className={field}
        />
      </label>

      <label className="grid gap-1.5">
        <span className={label}>Summary</span>
        <textarea
          name="summary"
          defaultValue={initial.summary}
          disabled={readOnly}
          rows={2}
          className={field}
        />
      </label>

      <label className="grid gap-1.5">
        <span className={label}>Body (MDX)</span>
        <textarea
          name="body"
          defaultValue={initial.body}
          disabled={readOnly}
          rows={26}
          spellCheck={false}
          className={`${field} font-mono text-[13px] leading-relaxed`}
        />
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <label className="grid gap-1.5">
          <span className={label}>Status</span>
          <select
            name="status"
            defaultValue={initial.status}
            disabled={readOnly}
            className={field}
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
            <option value="archived">archived</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={pending || readOnly}
          className="mt-5 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>

      {/* The only feedback this form gives, so it is announced. A failed save
          says why: the MDX compiler's own message, which points at a line. */}
      <p aria-live="polite" className="min-h-5 text-sm">
        {state.ok === true ? (
          <span className="text-muted">Saved, and the cache was cleared.</span>
        ) : state.ok === false ? (
          <span className="text-coral">{state.error}</span>
        ) : null}
      </p>
    </form>
  );
}
