"use client";

import { useState } from "react";

/**
 * The way a student asks for a session.
 *
 * Five fields, because the useful part of a request is its structure: which
 * paper, and where it stopped making sense. Asking for that up front is also
 * what lets a reply be worth reading.
 *
 * Posts JSON to POST /api/mentorship, which validates and inserts. The insert
 * policy on `mentorship_requests` is the real boundary; the messages here exist
 * so a person is told what to fix.
 */

type Field = {
  name: "name" | "email" | "college" | "paper" | "stuck";
  label: string;
  /** The hint under the label, in the student's own terms. */
  hint?: string;
  type?: string;
  required?: boolean;
  rows?: number;
};

const FIELDS: Field[] = [
  { name: "name", label: "Your name", required: true },
  { name: "email", label: "Email", type: "email", required: true },
  {
    name: "college",
    label: "College and year",
    hint: "Optional. It helps to know how far in you are.",
  },
  {
    name: "paper",
    label: "Which paper",
    hint: "The subject, however you refer to it.",
    required: true,
  },
  {
    name: "stuck",
    label: "Where it stopped making sense",
    hint: "One line is enough. You do not need to explain it well, that is the job.",
    required: true,
    rows: 4,
  },
];

type State = "idle" | "sending" | "sent";

export function MentorshipForm() {
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(
      FIELDS.map((f) => [f.name, String(form.get(f.name) ?? "")]),
    );

    try {
      const res = await fetch("/api/mentorship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Could not send that. Please try again.");
        setState("idle");
        return;
      }
      setState("sent");
    } catch {
      setError("Could not reach us. Check your connection and try again.");
      setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div className="px-6 py-10 text-center sm:px-10">
        <p className="font-hand text-3xl text-foreground">Got it.</p>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-muted">
          We read every one of these ourselves. You will hear back at the address
          you gave, and we will ask about the paper before we suggest anything.
        </p>
      </div>
    );
  }

  const input =
    "mt-1.5 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-[15px] text-foreground outline-none transition-colors placeholder:text-subtle focus:border-foreground/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue";

  return (
    <form onSubmit={onSubmit} className="grid gap-5 px-6 py-8 sm:px-10 sm:py-10">
      {FIELDS.map((field) => (
        <div key={field.name}>
          <label
            htmlFor={`m-${field.name}`}
            className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-subtle"
          >
            {field.label}
            {field.required ? null : (
              <span className="ml-2 normal-case tracking-normal">optional</span>
            )}
          </label>

          {field.rows ? (
            <textarea
              id={`m-${field.name}`}
              name={field.name}
              rows={field.rows}
              required={field.required}
              className={input}
            />
          ) : (
            <input
              id={`m-${field.name}`}
              name={field.name}
              type={field.type ?? "text"}
              required={field.required}
              className={input}
            />
          )}

          {field.hint ? (
            <p className="mt-1.5 text-xs leading-5 text-subtle">{field.hint}</p>
          ) : null}
        </div>
      ))}

      {error ? (
        <p role="alert" className="text-sm leading-6 text-accent-strong">
          {error}
        </p>
      ) : null}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={state === "sending"}
          className="inline-flex items-center rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-transform duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {state === "sending" ? "Sending" : "Send it"}
        </button>
        <span className="font-hand text-lg text-subtle">
          we read these ourselves
        </span>
      </div>
    </form>
  );
}
