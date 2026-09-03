"use client";

import { useState } from "react";
import { site } from "@/lib/site";

/**
 * Ten questions you can either answer out loud or cannot.
 *
 * Everything happens in this component and nothing leaves the browser: the
 * point is the reader finding out where the holes are, not us collecting it.
 * There is no submit, no storage, and no result to keep.
 *
 * The tick is a real checkbox underneath, so it is keyboard operable and reads
 * correctly to a screen reader; the drawn box on top is decoration.
 */
export function SelfCheck() {
  const { questions, note } = site.mentorship.selfCheck;
  const [ticked, setTicked] = useState<number[]>([]);

  const count = ticked.length;
  const total = questions.length;

  function toggle(i: number) {
    setTicked((prev) =>
      prev.includes(i) ? prev.filter((n) => n !== i) : [...prev, i],
    );
  }

  return (
    <div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {questions.map((q, i) => {
          const on = ticked.includes(i);
          return (
            <li key={q.question}>
              <label
                className={`flex h-full cursor-pointer gap-3 rounded-card border px-4 py-4 transition-colors ${
                  on
                    ? "border-accent/40 bg-accent/[0.04]"
                    : "border-border bg-card hover:border-foreground/25"
                }`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(i)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden
                  className={`drawn-box mt-0.5 grid h-5 w-5 shrink-0 place-items-center font-hand text-lg leading-none peer-focus-visible:ring-2 peer-focus-visible:ring-accent ${
                    on ? "text-accent-strong" : "text-transparent"
                  }`}
                >
                  &#10003;
                </span>
                <span>
                  <span
                    className={`block text-[0.95rem] leading-6 ${
                      on ? "text-foreground/55 line-through" : "text-foreground"
                    }`}
                  >
                    {q.question}
                  </span>
                  <span className="mt-2 block font-mono text-[0.6rem] uppercase tracking-[0.18em] text-subtle">
                    {q.tag}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <p aria-live="polite" className="mt-8 font-hand text-3xl text-foreground">
        {count} of {total}.
        {count < total ? (
          <span className="ml-3 text-muted">{note}</span>
        ) : (
          <span className="ml-3 text-muted">
            Then you do not need us. Go and take the viva.
          </span>
        )}
      </p>
    </div>
  );
}
