"use client";

import { useActionState } from "react";
import { createAction, type CreateState } from "@/app/admin/create";

const initial: CreateState = { ok: null };

const field =
  "rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-subtle focus:border-foreground";

/**
 * Create a thread or a channel.
 *
 * Only a slug and a title, because everything else is written in the editor and
 * a form that asks for eight things before you can start is a form people avoid.
 * The slug is asked for rather than derived from the title: it is the URL, it is
 * permanent, and a title is often changed after publishing.
 */
export function CreateForm({
  collection,
  subjects,
}: {
  collection: "thread" | "channel";
  subjects?: { slug: string; name: string }[];
}) {
  const [state, action, pending] = useActionState(createAction, initial);

  return (
    <form
      action={action}
      className="mt-6 rounded-card border border-dashed border-border p-4"
    >
      <input type="hidden" name="collection" value={collection} />

      <div className="flex flex-wrap items-center gap-2">
        {collection === "channel" ? (
          <select name="scope" required className={field} defaultValue="">
            <option value="" disabled>
              subject
            </option>
            {subjects?.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        ) : null}

        <input
          name="slug"
          required
          placeholder={
            collection === "thread" ? "what-broke-in-prod" : "memory-and-gc"
          }
          className={`${field} font-mono w-56`}
        />
        <input
          name="title"
          required
          placeholder="Title"
          className={`${field} min-w-56 flex-1`}
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create"}
        </button>
      </div>

      <p aria-live="polite" className="mt-2 min-h-5 text-sm text-coral">
        {state.ok === false ? state.error : null}
      </p>
    </form>
  );
}
