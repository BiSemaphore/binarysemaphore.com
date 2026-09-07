"use client";

import { useActionState } from "react";
import { createAction, type CreateState } from "@/app/admin/create";
import { INPUT, BUTTON, CONTROL_H } from "@/components/admin/ui";
import { Select } from "@/components/select";

const initial: CreateState = { ok: null };

const field = INPUT;

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
          <Select name="scope" required defaultValue="" className={CONTROL_H}>
            <option value="" disabled>
              subject
            </option>
            {subjects?.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </Select>
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
          className={BUTTON}
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
