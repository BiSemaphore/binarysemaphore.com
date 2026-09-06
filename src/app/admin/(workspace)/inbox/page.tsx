import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";
import { setInboxStatus } from "@/app/admin/inbox-actions";

export const metadata: Metadata = { title: "Inbox" };

type Message = {
  id: string;
  kind: string;
  name: string;
  email: string;
  body: string;
  context: Record<string, string | null>;
  status: string;
  created_at: string;
};

/**
 * Everything people have sent us.
 *
 * `contact_messages` and `mentorship_requests` were two tables holding one
 * entity, neither with a handled state and neither with a read path: answering
 * one meant opening the Supabase dashboard. This page is the reason they were
 * merged.
 */
export default async function AdminInbox() {
  const db = await createClient();
  const { data, error } = await db.rpc("admin_inbox");
  const messages = (data ?? []) as Message[];

  return (
    <>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        Inbox
      </h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        Contact and mentorship, in one place. Nothing here can be read without
        being an admin: the table is in a schema with no URL, and the function
        that reads it refuses anyone else.
      </p>

      {error ? (
        <p className="mt-8 text-sm text-coral">
          Could not read the inbox: {error.message}
        </p>
      ) : messages.length === 0 ? (
        <p className="mt-8 rounded-card border border-dashed border-border px-5 py-8 text-center text-sm text-subtle">
          Nothing yet. Both forms have received zero messages since they were
          built, which is worth knowing about the forms.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {messages.map((m) => (
            <li
              key={m.id}
              className="rounded-card border border-border bg-card px-5 py-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="text-sm text-foreground">
                  {m.name}{" "}
                  <a
                    href={`mailto:${m.email}`}
                    className="text-muted underline decoration-border underline-offset-4"
                  >
                    {m.email}
                  </a>
                </span>
                <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-subtle">
                  {m.kind} · {new Date(m.created_at).toLocaleDateString("en-GB")}
                  {m.status === "new" ? "" : ` · ${m.status}`}
                </span>
              </div>

              {Object.entries(m.context ?? {}).some(([, v]) => v) ? (
                <p className="mt-1 font-mono text-xs text-subtle">
                  {Object.entries(m.context)
                    .filter(([, v]) => v)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(" · ")}
                </p>
              ) : null}

              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted">
                {m.body}
              </p>

              <form action={setInboxStatus} className="mt-4 flex gap-3">
                <input type="hidden" name="id" value={m.id} />
                <button
                  name="status"
                  value={m.status === "answered" ? "new" : "answered"}
                  className="text-xs text-muted underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
                >
                  {m.status === "answered" ? "Reopen" : "Mark answered"}
                </button>
                {m.status !== "ignored" ? (
                  <button
                    name="status"
                    value="ignored"
                    className="text-xs text-subtle underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
                  >
                    Ignore
                  </button>
                ) : null}
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
